# chiyaole

吃药了 - 微信小程序用药管理应用

## 项目介绍

一款高端杂志风格的用药提醒小程序，告别传统医疗应用的冰冷感，打造温馨优雅的用药管理体验。

## 设计理念

**"The Living Sanctuary" (生活的圣殿)** - 将医疗功能与高端杂志美学结合，让健康管理充满温度。

## 技术栈

- **框架**: 微信小程序 + [TDesign](https://tdesign.tencent.com/miniprogram/)
- **设计系统**: The Serene Healer
- **字体**: Plus Jakarta Sans + Inter

## 项目结构

```
chiyaole/
├── app.js                 # 应用入口
├── app.json               # 应用配置
├── app.wxss               # 全局样式 + 设计令牌
├── package.json           # npm 依赖
├── project.config.json    # 微信开发者工具配置
├── sitemap.json           # 站点地图
├── pages/
│   └── index/             # 首页
│       ├── index.js
│       ├── index.json
│       ├── index.wxml
│       └── index.wxss
└── components/            # 公共组件 (待创建)
```

## 快速开始

1. 安装依赖:
```bash
npm install
```

2. 在微信开发者工具中: 工具 → 构建 npm

3. 开始开发

## 设计系统要点

- **无框线设计** - 不使用1px边框分隔，仅用色调分层
- **色调层级** - surface → surface-container → surface-container-lowest (白色卡片)
- **渐变色** - 主按钮使用蓝渐变 (#0058bc → #0070eb)，打卡按钮使用绿渐变 (#006e28 → #6ffb85)
- **字体层级** - Plus Jakarta Sans 用于标题，Inter 用于正文

## License

Apache License 2.0
