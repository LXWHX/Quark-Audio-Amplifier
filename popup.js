// popup.js
document.addEventListener('DOMContentLoaded', async () => {
  const slider = document.getElementById('slider');
  const valDisplay = document.getElementById('val');

  // 获取当前标签页
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabIdStr = String(tab.id);

  // 1. 读取记忆
  chrome.storage.local.get([tabIdStr], (result) => {
    if (result[tabIdStr]) {
      const savedVolume = result[tabIdStr];
      slider.value = savedVolume * 100;
      valDisplay.textContent = parseInt(savedVolume * 100) + "%";
    }
  });

  // --- 优化：使用 requestAnimationFrame 进行节流 ---
  let isScheduled = false; // 是否已经安排了发送任务

  slider.addEventListener('input', () => {
    // 1. UI 必须立即更新 (保证手感)
    const value = parseInt(slider.value);
    valDisplay.textContent = value + "%";
    
    // 2. 数据发送逻辑进行节流
    if (!isScheduled) {
      isScheduled = true;
      
      requestAnimationFrame(() => {
        const volumeMultiplier = slider.value / 100;

        // 发送消息
        chrome.runtime.sendMessage({
          action: 'setVolume',
          tabId: tab.id,
          value: volumeMultiplier
        });

        // 保存记忆
        chrome.storage.local.set({
          [tabIdStr]: volumeMultiplier
        });

        isScheduled = false; // 任务执行完毕，允许下一次发送
      });
    }
  });
});