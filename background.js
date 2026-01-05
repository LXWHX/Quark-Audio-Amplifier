// background.js - V3.3 鲁棒增强版

// 记录本：记录哪些标签页已经开启了增强
const activeTabs = new Set();
// 正在初始化中的标签页（防止并发申请造成的冲突）
const initializingTabs = new Set();

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg.action === 'setVolume') {
    // 1. 确保离屏文档在运行
    await setupOffscreenDocument('offscreen.html');

    const tabId = msg.tabId;
    let streamId = null;

    // --- 核心修复：防竞态锁 ---
    
    // 如果这个 Tab 既没有激活，也没有在初始化，那么它是第一次请求
    if (!activeTabs.has(tabId)) {
      
      // 如果正在初始化中，说明上一次的申请还没回来，直接忽略这次“申请”动作
      // (但在拖动过程中，后续会有新的消息过来，一旦初始化完成，新的消息就会走下面的 else 逻辑)
      if (initializingTabs.has(tabId)) {
        return; 
      }

      // 加锁
      initializingTabs.add(tabId);

      try {
        streamId = await chrome.tabCapture.getMediaStreamId({
          targetTabId: tabId
        });
        // 申请成功，记入正式名单
        activeTabs.add(tabId);
      } catch (e) {
        console.error("权限申请失败:", e);
        // 发生错误，必须解锁，否则该页面永远无法再次调整
        initializingTabs.delete(tabId);
        return; 
      } finally {
        // 无论成功失败，操作结束，移除“初始化中”的状态
        initializingTabs.delete(tabId);
      }
    }

    // 2. 发送指令给 offscreen
    // 注意：如果是刚初始化完，streamId 有值；如果是后续拖动，streamId 为 null，这是正常的
    chrome.runtime.sendMessage({
      type: 'update-volume',
      target: 'offscreen',
      tabId: tabId,
      streamId: streamId,
      volume: msg.value
    });
  }
});

// --- 清理逻辑 ---
const clearTabSession = (tabId) => {
  // 无论是活跃状态还是初始化状态，都要清理
  if (activeTabs.has(tabId) || initializingTabs.has(tabId)) {
    activeTabs.delete(tabId);
    initializingTabs.delete(tabId); // 确保锁也被解开
    chrome.storage.local.remove(String(tabId));
    console.log(`清理 Tab ${tabId} 的缓存`);
  }
};

chrome.tabs.onRemoved.addListener(clearTabSession);
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    clearTabSession(tabId);
  }
});

// 离屏文档启动器 (保持不变)
async function setupOffscreenDocument(path) {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL(path)]
  });
  if (existingContexts.length > 0) return;
  await chrome.offscreen.createDocument({
    url: path,
    reasons: ['USER_MEDIA'],
    justification: 'Volume boosting'
  });
}