// popup.js
document.addEventListener('DOMContentLoaded', async () => {
  const slider = document.getElementById('slider');
  const valDisplay = document.getElementById('val');
  const resetBtn = document.getElementById('resetBtn');
  const toggleModeBtn = document.getElementById('toggleMode');
  const toggleLangBtn = document.getElementById('toggleLang'); // 新增
  const body = document.body;

  // --- 0. 翻译字典 ---
  const translations = {
    zh: {
      title: "网页音量增强器",
      reset: "重置回 100%",
      hint: "若无效请刷新视频页面",
      langBtn: "En" // 当前是中文，按钮显示"去英文"
    },
    en: {
      title: "Web Volume Booster",
      reset: "Reset to 100%",
      hint: "Refresh page if ineffective",
      langBtn: "中" // 当前是英文，按钮显示"去中文"
    }
  };

  let currentLang = 'zh'; // 默认语言

  // --- 辅助函数：更新界面语言 ---
  function updateLanguage(lang) {
    currentLang = lang;
    const t = translations[lang];
    
    // 找到所有带 data-key 的元素并更新文本
    document.querySelectorAll('[data-key]').forEach(el => {
      const key = el.getAttribute('data-key');
      if (t[key]) {
        el.textContent = t[key];
      }
    });

    // 更新语言按钮文字
    toggleLangBtn.textContent = t.langBtn;
  }

  // --- 1. 初始化设置 (语言 & 深色模式) ---
  chrome.storage.local.get(['theme', 'lang'], (result) => {
    // 设置主题
    if (result.theme === 'dark') {
      body.classList.add('dark-mode');
    }
    
    // 设置语言 (如果没存过，默认是 zh)
    if (result.lang) {
      updateLanguage(result.lang);
    } else {
      updateLanguage('zh');
    }
  });

  // --- 2. 按钮事件监听 ---
  
  // 切换深色模式
  toggleModeBtn.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const isDark = body.classList.contains('dark-mode');
    chrome.storage.local.set({ theme: isDark ? 'dark' : 'light' });
  });

  // 切换语言
  toggleLangBtn.addEventListener('click', () => {
    const newLang = currentLang === 'zh' ? 'en' : 'zh';
    updateLanguage(newLang);
    chrome.storage.local.set({ lang: newLang });
  });

  // --- 3. 音量核心逻辑 (保持不变) ---
  
  // 获取当前标签页
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabIdStr = String(tab.id);

  function sendVolumeUpdate(value) {
    valDisplay.textContent = value + "%";
    const volumeMultiplier = value / 100;

    chrome.runtime.sendMessage({
      action: 'setVolume',
      tabId: tab.id,
      value: volumeMultiplier
    });

    chrome.storage.local.set({
      [tabIdStr]: volumeMultiplier
    });
  }

  // 读取上次音量
  chrome.storage.local.get([tabIdStr], (result) => {
    if (result[tabIdStr]) {
      const savedVolume = result[tabIdStr];
      const val = parseInt(savedVolume * 100);
      slider.value = val;
      valDisplay.textContent = val + "%";
    }
  });

  // 拖动滑块 (节流)
  let isScheduled = false;
  slider.addEventListener('input', () => {
    valDisplay.textContent = slider.value + "%";
    if (!isScheduled) {
      isScheduled = true;
      requestAnimationFrame(() => {
        sendVolumeUpdate(slider.value);
        isScheduled = false;
      });
    }
  });

  // 重置按钮
  resetBtn.addEventListener('click', () => {
    slider.value = 100;
    sendVolumeUpdate(100);
  });
});