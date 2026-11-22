# 看山桌面伙伴 · Windows

支持 Windows 10 和 Windows 11 的 64 位 x64 电脑。

在[桌宠下载页](https://betty725.github.io/qimai-peilian/?desktop=1)选择 Windows 安装包并运行。安装后可从「开始」菜单启动桌宠，也可以点击网页左下角的刘看山唤回它。需要移除时，在 Windows「设置 → 应用」中卸载。

## 从源码构建

在 Windows x64 安装 Node.js 24 LTS，克隆完整仓库。在本目录运行 `npm ci` 和 `npm run dist:win`，生成 `Kanshan-Setup-win-x64.exe`。桌宠使用仓库中的动画与本地姿态识别模型。
