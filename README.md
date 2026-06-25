# 铁花入梦｜线上沉浸式打铁花体验

## 1. 项目简介

本项目是设计思维课程“为文化传承而设计”的网页原型，主题是通过线上沉浸式体验让用户了解传统非遗“打铁花”。

用户可以从主界面进入打铁花体验页，观看 Canvas 粒子模拟的铁花动画，并进入文化解密页了解匠人技艺、高温危险性、节庆祈福意义与非遗传承现状。

项目目标是在安全、轻量的网页环境中，让用户先感受打铁花的视觉冲击，再理解其背后的文化内涵。项目不使用 Blender、后端或大型框架，主要基于 HTML、CSS、JavaScript 实现。

## 2. 当前功能

- 主界面入口
- 打铁花 Canvas 粒子动画
- “开打一板”触发铁花动画
- 抬头视角
- 连续演示
- 低性能模式
- 声音开关与音效播放
- 文化解密页
- 解密图片展示
- 打铁花流程卡片
- 移动端适配

## 3. 项目结构

```text
.
├── index.html
├── css/
│   └── style.css
├── js/
│   └── main.js
├── assets/
│   ├── images/
│   │   ├── main_ui.png
│   │   ├── decode_craft.png
│   │   ├── decode_danger.png
│   │   ├── decode_festival.png
│   │   ├── decode_inheritance.png
│   │   ├── process_melting.png
│   │   ├── process_pouring.png
│   │   ├── process_striking.png
│   │   ├── process_blooming.png
│   │   └── README.md
│   └── audio/
│       ├── ambient.mp3
│       ├── strike.mp3
│       ├── burst.mp3
│       ├── whoosh.mp3
│       ├── ui_click.mp3
│       └── README.md
└── README.md
```

## 4. 运行方法
先将仓库代码克隆到本地。
方法一：打开文件资源管理器，找到刚刚下载的安装包，解压后直接双击 `index.html`，使用浏览器打开。

方法二：使用 VS Code 的 Live Server / Live Preview 插件运行 `index.html`。

说明：浏览器通常会限制网页自动播放音频，因此音效需要在用户第一次点击页面按钮后才会播放。这是浏览器的自动播放限制，不是项目错误。

## 5. 推荐运行环境

- Chrome / Edge 最新版浏览器
- Windows / macOS 均可
- 不需要安装 Node.js
- 不需要安装后端环境
- 不需要 Blender

## 6. 图片与音效资源说明

图片资源放在 `assets/images/` 目录中，音效资源放在 `assets/audio/` 目录中。

如果需要替换素材，建议保持原有文件名和路径不变。若更改文件名或目录，需要同步修改 `css/style.css` 或 `js/main.js` 中的资源引用路径。

## 7. 页面说明

主界面：负责项目入口和视觉吸引，展示主视觉背景、项目标题、进入体验按钮与项目说明入口。

打铁花体验页：负责观看铁花动画和沉浸交互，包含“开打一板”“抬头视角”“连续演示”“声音开关”“返回主界面”“前往解密页面”等操作。

文化解密页：负责解释匠人技艺、高温危险性、节庆祈福意义、非遗传承现状，并展示打铁花流程卡片。

## 8. 后续可迭代方向

- 加入手机陀螺仪抬头视角
- 优化空间音效
- 增加测试反馈表
- 增加更多非遗知识卡片
- 后续可扩展为 A-Frame / WebXR 版本

## 9. 成员贡献

- 成员A：
- 成员B：
- 成员C：
