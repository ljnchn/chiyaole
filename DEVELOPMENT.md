# 开发注意事项

## 环境搭建

1. **安装依赖：** `npm install`
2. **构建 NPM：** 在微信开发者工具中点击 `工具 → 构建 npm`（每次新增 npm 包后都需要重新构建）
3. **AppID：** `wx84a0172595b38012`（已配置在 `project.config.json`）
4. **基础库版本：** 3.0.0

## 微信小程序限制（必读）

### WXSS 样式限制

- **禁止使用 `*` 通用选择器**，需显式列出元素：`view, text, image { }`
- **不支持 `@import url()` 加载外部字体**，用系统字体或 `wx.loadFontFace()`
- **CSS 动画** 尽量只用 `transform` 和 `opacity`
- **`position: fixed`** 在可滚动区域内无效，需用 `position: absolute` 配合页面级固定
- **不支持** `calc()` 中混合 rpx 和 px 单位

### JS / API 限制

- **没有 DOM 操作**，所有数据更新必须通过 `this.setData()`
- **存储** 用 `wx.getStorageSync()` / `wx.setStorageSync()`，不是 `localStorage`
- **网络请求** 用 `wx.request()`，需在后台配置合法域名
- **登录认证** 用 `wx.login()` 获取 code
- **页面跳转** TabBar 页面用 `wx.switchTab()`，非 TabBar 页面用 `wx.navigateTo()`

### 文件结构要求

- 每个页面必须有 4 个同名文件：`.js`、`.json`、`.wxml`、`.wxss`
- 新页面必须在 `app.json` 的 `pages` 数组中注册
- 使用自定义组件必须在页面的 `.json` 中 `usingComponents` 声明

## TDesign 组件使用

### 全局组件（已在 app.json 注册）

| 组件 | 路径 | 用途 |
|------|------|------|
| `t-button` | button/button | 按钮 |
| `t-cell` | cell/cell | 列表项 |
| `t-cell-group` | cell-group/cell-group | 列表分组 |
| `t-input` | input/input | 输入框 |
| `t-progress` | progress/progress | 进度条 |
| `t-tag` | tag/tag | 标签 |
| `t-icon` | icon/icon | 图标 |
| `t-switch` | switch/switch | 开关 |
| `t-stepper` | stepper/stepper | 步进器 |
| `t-calendar` | calendar/calendar | 日历 |

### 使用新组件的步骤

1. 确认 `tdesign-miniprogram` 包中包含该组件
2. 在 `app.json`（全局）或页面 `.json`（局部）的 `usingComponents` 中注册
3. 在 `.wxml` 中使用 `<t-xxx>` 标签

### 样式覆盖

TDesign 组件使用 CSS 变量，在 `app.wxss` 中已全局覆盖（`--td-brand-color` 等）。如需局部覆盖，在页面 `.wxss` 中针对组件重写即可。


Tab 索引对应关系：
- 0 = 今日提醒 (`pages/index/index`)
- 1 = 吃药记录 (`pages/record/record`)
- 2 = 药品管理 (`pages/medication/list`)
- 3 = 个人中心 (`pages/user/user`)

## 设计规范速查

### 核心原则

- **不用 1px 边框分隔** — 用背景色层次区分
- **不用灰色/黑色阴影** — 用品牌色调阴影（`rgba(0, 88, 188, 0.08)`）
- **用色调层级代替投影** — surface → surface-container → surface-container-lowest

### 常用样式类（定义在 app.wxss）

- 卡片：`.card`、`.card-elevated`
- 按钮：`.btn-primary`（蓝色渐变）、`.btn-checkin`（绿色渐变打卡）
- 圆角：`.rounded-sm`(8rpx)、`.rounded-md`(12rpx)、`.rounded-lg`(16rpx)、`.rounded-full`
- 背景：`.bg-surface`、`.bg-surface-container`、`.bg-surface-container-lowest`
- 间距：`.p-4`、`.p-5`、`.px-4`、`.py-4`、`.gap-4`、`.gap-8`
- 文字：`.text-headline-lg`(64rpx)、`.text-headline-md`(48rpx)、`.text-body-md`(28rpx)、`.text-label-md`(24rpx)
- 毛玻璃：`.glass`
- 安全区域：`.safe-area-bottom`

### 颜色使用意图

| 颜色 | 用途 |
|------|------|
| Primary 蓝 `#0058bc` | 主操作按钮、医疗精准感 |
| Secondary 绿 `#006e28` | 打卡、健康进度 |
| Tertiary 紫 `#4c4aca` | 教育标签、洞察信息 |
| 红色 | 紧急/未完成提醒 |

## 项目打包注意

`project.config.json` 已配置 `packOptions.ignore` 排除了 `DESIGN.md`、`CLAUDE.md`、`.git` 文件夹。如新增不需要打包的文件，记得添加到忽略列表。

## 当前数据状态

目前使用硬编码的 mock 数据（见 `pages/index/index.js`）。后续接入后端 API 时需要：
- 替换 `data` 中的硬编码为 `onLoad` 中的 API 请求
- 使用 `wx.request()` 请求数据
- 在后台配置合法请求域名
