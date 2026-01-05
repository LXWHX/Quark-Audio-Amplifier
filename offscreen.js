// offscreen.js
const tabs = {};

chrome.runtime.onMessage.addListener(async (msg) => {
    if (msg.target !== 'offscreen') return;

    if (msg.type === 'update-volume') {
        await handleAudioStream(msg.tabId, msg.streamId, msg.volume);
    }
});

async function handleAudioStream(tabId, streamId, volume) {
    // 情况A: 通道已经建立，直接改音量
    if (tabs[tabId]) {
        if (tabs[tabId].context.state === 'suspended') {
            await tabs[tabId].context.resume();
        }
        tabs[tabId].gainNode.gain.value = volume;
        return;
    }

    // 情况B: 还没有通道，且没有 streamId，无法初始化
    if (!streamId) {
        return;
    }

    // 情况C: 建立新通道
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
                mandatory: {
                    chromeMediaSource: 'tab',
                    chromeMediaSourceId: streamId
                }
            },
            video: false
        });

        // --- 安全检查：防止在 await 期间重复创建 ---
        if (tabs[tabId]) {
             // 如果在获取流的过程中，另一个请求已经建好了 tab，就只更新音量
             tabs[tabId].gainNode.gain.value = volume;
             return;
        }

        const audioCtx = new AudioContext();
        const source = audioCtx.createMediaStreamSource(stream);
        const gainNode = audioCtx.createGain();

        source.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        gainNode.gain.value = volume;

        tabs[tabId] = {
            context: audioCtx,
            gainNode: gainNode
        };

        stream.getAudioTracks()[0].onended = () => {
            audioCtx.close();
            delete tabs[tabId];
        };

    } catch (err) {
        console.error("音频捕获错误:", err);
    }
}