# 隐私政策 (Privacy Policy)

**最后更新日期：** 2024年1月1日 (请改为当前日期)

## 1. 简介 (Introduction)
欢迎使用“网页音量增强器” (Web Volume Booster)。我们非常重视您的隐私。本隐私政策旨在说明我们如何处理您的数据。

## 2. 数据收集与使用 (Data Collection and Usage)
**核心承诺：我们不收集、不存储、不上传您的任何个人信息或音频数据。**

为了实现音量增强功能，本扩展程序需要使用 `tabCapture` 和 `offscreen` 权限来获取当前标签页的音频流。
* **音频处理：** 所有音频处理均在您的本地浏览器内存中即时完成 (Web Audio API)。
* **数据流向：** 音频流直接从标签页传输到扩展程序的处理节点，处理后直接输出到您的扬声器/耳机。
* **无服务器传输：** 音频数据**绝不会**传输到任何远程服务器。

## 3. 权限说明 (Permissions)
* **tabCapture:** 用于捕获当前标签页的音频流以进行音量放大。
* **offscreen:** 用于在后台持续处理音频，防止被浏览器冻结。
* **storage:** 仅用于在本地保存您的偏好设置（如：深色模式开关、上次设定的音量值）。

## 4. 第三方服务 (Third-Party Services)
本扩展程序不包含任何第三方分析工具、广告SDK或追踪代码。

## 5. 联系我们 (Contact)
如果您对本隐私政策有任何疑问，请通过以下方式联系我们：
* GitHub Issues: https://github.com/LXWHX/Quark-Audio-Amplifier/issues