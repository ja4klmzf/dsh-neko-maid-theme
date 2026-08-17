# 🐱 猫娘女仆主题 · Neko Maid Theme for DeepSeek Harness

给 DeepSeek Harness Web GUI 换上一套「洛丽塔猫娘女仆」皮肤：昼夜双主题、右下角会叫"欧尼酱"的互动猫娘桌宠、猫爪光标、全屏告白文字雨……个人学习交流用，非商业。

> 灵感来自 [deep-whale-day-night-theme](https://github.com/GGBond2424648901/deep-whale-day-night-theme) 的昼夜主题设计思路，以及 B 站 / [深海女仆工坊 maid-atelier](https://github.com/Small-tailqwq/dsh-deep-whale) 的女仆换肤生态，素材与桌宠形象为本人用 ComfyUI（Qwen-Image）生成的原创猫娘。

---

## ✨ 功能一览

**界面**
- 🌞🌙 昼夜双主题：水晶白昼（粉白/暖阳）↔ 月潮夜晚（深靛紫/星空），跟随系统深浅色或手动切换
- 高清猫娘插画背景（2560×1440 日间 / 3840 夜间），面板半透明可见背景
- 上下缘猫爪印花花边：白天粉色猫爪、夜晚深蓝黑猫爪
- 🐾 猫爪光标（可点击元素带光环猫爪）、侧栏女仆头饰徽章
- 动态氛围：白天花瓣飘落+午后光斑，夜晚星空/月亮/流星
- 窗口自适应：小窗自动缩小、猫娘底边始终高于输入框、设置面板打开时缩到角落不挡内容

**桌宠（右下角洛丽塔猫娘）**
- 悬停弹出互动菜单：🐟投喂 / 🖐摸头 / ⭐夸奖 / 💤休息 / 🍵喝茶 / ☀🌙✦主题
- 点猫娘本体：随机互动
- 隐藏成就：
  - 💢 **逗她**：1.6 秒内连点猫娘 10 次解锁
  - 💋 **亲亲**：投喂 + 喝茶合计满 **300 次**解锁，触发时全屏飘落"欧尼酱，最喜欢你了"等粉色告白文字
- ⏰ 工作时长关怀：每连续工作满 **10 分钟**请你喝红茶；连续工作满 **6 小时**"喝茶"按钮永久常驻
- 智能表情：AI 思考（think）时歪头思考脸、你打字时认真看向对话框、每次回答结束开心庆祝
- "欧尼酱"台词气泡常驻（说下一句才替换），每种效果 10+ 条随机台词

---

## 🚀 快速安装（Windows）

**要求**：已安装 DeepSeek Harness（dsh）。无需管理员权限。

1. 下载并解压本仓库（Code → Download ZIP）
2. 双击 **`install.bat`**
3. 等脚本提示完成后，在浏览器 **硬刷新** DSH 页面（`Ctrl+F5`）

脚本会自动找到 `dsh-web-frontend/dist` 目录（npm 全局目录 / `.dsh\profiles` 两处都会尝试），备份原文件后写入皮肤。

### 手动指定位置

如果自动检测失败：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File install.ps1 -Dist "C:\你的路径\...\dsh-web-frontend\dist"
```

### 手动安装（3 步）

1. 把 `assets\` 里的所有文件复制到 `dsh-web-frontend\dist\assets\`
2. 打开 `dsh-web-frontend\dist\index.html`：
   - 在 `</head>` 前加：
     ```html
     <link rel="stylesheet" href="/assets/override.css?v=1">
     ```
   - 在 `</body>` 前加：
     ```html
     <script src="/assets/neko-theme.js" defer></script>
     ```
3. 硬刷新页面（`Ctrl+F5`）

---

## 📖 使用说明

| 操作 | 效果 |
|---|---|
| 鼠标移到猫娘身上 | 弹出互动菜单 |
| 点击猫娘 | 随机互动（摸头/投喂/夸奖） |
| 快速连点 10 次 | 解锁「逗她」 |
| 累计投喂+喝茶 300 次 | 解锁「亲亲」（全屏告白文字雨） |
| 菜单「主题」按钮 | 切换 白天 → 夜晚 → 自动 |
| 在输入框打字 | 猫娘切"认真看对话框"表情 |
| AI 思考 / 回答完成 | 猫娘思考脸 / 开心庆祝 |
| 连续工作 10 分钟 | 猫娘请你喝红茶 |

解锁进度、投喂/喝茶次数都保存在浏览器 localStorage，刷新不丢失。

---

## ❓ 常见问题

**Q：刷新后没变化？**
DSH 服务器不发缓存头，必须 `Ctrl+F5` 硬刷新；安装脚本每次都会把 CSS 版本号 +1 强制浏览器重新拉取。

**Q：设置面板打不开 / 挤在侧栏？**
本皮肤已修复毛玻璃导致的该问题；若仍出现，确认 `override.css` 是最新版并硬刷新。

**Q：升级 DeepSeek Harness 后皮肤没了？**
DSH 更新会覆盖 `dist` 目录，重新运行 `install.bat` 即可（备份机制会保留最近的原文件）。

**Q：想换猫娘形象 / 台词？**
打开 `assets\neko-theme.js`：台词在各 `*_LINES` 数组里，形象替换 `assets\neko-pet-*.png`（保持文件名不变，圆形柔边 PNG 效果最佳）。

**Q：如何卸载？**
```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File uninstall.ps1
```
会恢复安装时备份的 `index.html` 并删除皮肤文件；也可以手动从 `index.html` 里删掉那两行引用。

---

## 📦 仓库结构

```
├── install.bat          # 一键安装（双击）
├── install.ps1          # 安装脚本（自动检测 dist / 备份 / 打补丁）
├── uninstall.ps1        # 卸载还原脚本
├── assets/
│   ├── override.css     # 皮肤样式（昼夜调色板/花边/光标/宠物动画）
│   ├── neko-theme.js    # 皮肤引擎（互动/成就/工作计时/智能表情）
│   ├── neko-bg-day.jpg  / neko-bg-night.jpg   # 昼夜高清背景
│   ├── neko-pet-*.png   # 猫娘各表情头像（常态/摸头/投喂/亲亲/夸奖/生气/休息/认真/思考/喝茶）
│   └── neko-pet-lace*.svg # 头像花环（白天玫瑰藤 / 夜晚珍珠）
└── backup/              # 安装时自动生成的备份（卸载用）
```

---

## 🌐 发布到 GitHub

1. 新建仓库（如 `dsh-neko-maid-theme`），不要勾选初始化 README
2. 网页上传：直接把整个文件夹拖进仓库页面上传，或用命令行：
   ```bash
   git init
   git add .
   git commit -m "Neko Maid Theme v1.0"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/dsh-neko-maid-theme.git
   git push -u origin main
   ```
   （本机装了 GitHub Desktop 也可以直接 Add repository → Publish，跳过命令行）

---

## ⚠️ 说明与许可

- 本主题通过修改 DSH Web 前端 `dist` 目录实现，属于**界面定制**，不修改 DSH 任何核心代码；升级 DSH 后需重新安装。
- 桌宠形象与背景为本人用 ComfyUI（Qwen-Image）生成的原创素材；引用、二次修改请保留出处。
- 仅限个人学习交流使用，**禁止商用**（CC BY-NC-SA 4.0，见 [LICENSE](LICENSE)）。
