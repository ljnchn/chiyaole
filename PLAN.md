# 开发计划 (Development Plan)

## 项目目标

打造一款高端杂志风格的用药管理小程序，核心功能包括：用药提醒、打卡记录、药品管理、数据统计。

## 功能模块

### 1. 首页 (Home)
**功能点：**
- 每日用药进度总览（圆形进度条）
- 快速打卡按钮
- 今日用药列表（时间轴形式）
- 连续打卡天数展示
- 健康小贴士/洞察

**页面：**
- `pages/index/index` - 首页

---

### 2. 用药管理 (Medications)
**功能点：**
- 药品列表（按状态筛选：服用中/已暂停/已完结）
- 添加药品（名称、剂量、规格、备注）
- 编辑药品信息
- 药品详情页（服用记录、剩余天数）
- 删除/暂停药品
- 药品图标/颜色标记

**页面：**
- `pages/medication/list` - 药品列表
- `pages/medication/add` - 添加药品
- `pages/medication/edit` - 编辑药品
- `pages/medication/detail` - 药品详情

---

### 3. 服药计划 (Schedule)
**功能点：**
- 设置服药时间（每日几次、具体时间点）
- 重复规则（每天/特定星期/周期）
- 剂量设置
- 饭前/饭后/空腹提醒
- 服用周期（开始日期-结束日期）

**页面：**
- `pages/schedule/add` - 添加服药计划
- `pages/schedule/edit` - 编辑计划

---

### 4. 打卡与记录 (Check-in)
**功能点：**
- 一键打卡（首页快速打卡）
- 打卡确认弹窗（确认剂量、时间）
- 补打卡（支持过去日期补录）
- 跳过/延迟提醒
- 打卡记录日历视图
- 每日完成度统计

**页面：**
- `pages/checkin/calendar` - 打卡日历
- `pages/checkin/history` - 打卡历史

---

### 5. 统计与洞察 (Statistics)
**功能点：**
- 周/月/年服药依从率
- 打卡热力图
- 连续打卡记录（最长 streak）
- 药品服用趋势图表
- 健康报告生成

**页面：**
- `pages/stats/index` - 统计首页
- `pages/stats/report` - 健康报告

---

### 6. 提醒与通知 (Reminders)
**功能点：**
- 微信订阅消息推送
- 提醒时间设置
- 提醒音效选择
- 振动开关
- 提醒延迟策略（5分钟/10分钟/15分钟后再次提醒）

**页面：**
- `pages/settings/reminder` - 提醒设置（集成在设置中）

---

### 7. 用户与设置 (User & Settings)
**功能点：**
- 用户信息编辑（昵称、头像）
- 紧急联系人设置
- 导出用药记录
- 数据备份与恢复
- 隐私设置
- 关于页面

**页面：**
- `pages/user/index` - 个人中心
- `pages/user/profile` - 资料编辑
- `pages/settings/index` - 设置首页
- `pages/settings/about` - 关于我们

---

## 数据模型

### Medication (药品)
```javascript
{
  id: string,           // 唯一ID
  name: string,         // 药品名称
  dosage: string,       // 剂量（如"1片"、"2粒"）
  specification: string,// 规格（如"500mg"）
  icon: string,         // 图标类型
  color: string,        // 主题色
  remark: string,       // 备注
  status: 'active' | 'paused' | 'completed',
  createdAt: Date,
  updatedAt: Date
}
```

### Schedule (服药计划)
```javascript
{
  id: string,
  medicationId: string, // 关联药品
  times: [{             // 每日服药时间
    hour: number,
    minute: number,
    dosage: string      // 该时间点剂量
  }],
  frequency: 'daily' | 'weekly' | 'cycle',  // 重复频率
  daysOfWeek: number[], // 星期几（0-6，weekly时有效）
  cycleDays: number,    // 周期天数（cycle时有效）
  startDate: Date,      // 开始日期
  endDate: Date,        // 结束日期（可选）
  reminderMinutes: number,  // 提前提醒分钟数
  withFood: 'before' | 'after' | 'empty',  // 饭前/饭后/空腹
  status: 'active' | 'paused'
}
```

### CheckIn (打卡记录)
```javascript
{
  id: string,
  medicationId: string,
  scheduleId: string,
  date: Date,           // 日期
  scheduledTime: Date,  // 计划时间
  actualTime: Date,     // 实际打卡时间
  status: 'taken' | 'skipped' | 'missed',
  dosage: string,       // 实际服用剂量
  note: string          // 备注
}
```

### User (用户)
```javascript
{
  id: string,
  nickName: string,
  avatarUrl: string,
  streakDays: number,   // 当前连续打卡天数
  maxStreak: number,    // 最高连续打卡记录
  totalCheckIns: number,// 总打卡次数
  settings: {
    reminderEnabled: boolean,
    reminderSound: string,
    vibrationEnabled: boolean,
    snoozeMinutes: number
  },
  emergencyContact: {
    name: string,
    phone: string
  }
}
```

---

## 组件库规划

### 通用组件 (/components/common/)
- `gradient-button` - 渐变按钮（主按钮、打卡按钮）
- `surface-card` - 层级卡片（支持多级surface背景）
- `progress-ring` - 圆形进度条
- `medication-icon` - 药品图标（带颜色主题）
- `empty-state` - 空状态插画
- `glass-header` - 玻璃拟态头部

### 业务组件 (/components/business/)
- `medication-item` - 药品列表项
- `schedule-timeline` - 服药时间轴
- `checkin-calendar` - 打卡日历
- `stats-chart` - 统计图表
- `insight-chip` - 洞察标签

---

## 开发阶段

### Phase 1: 核心功能 MVP
- [x] 项目初始化 + TDesign 集成
- [x] 首页 UI 完善（进度、今日列表）
- [x] 药品列表页（网格布局 + 库存展示）
- [x] 添加药品页（表单 + 时间设置 + 库存管理）
- [x] 吃药记录页（日历 + 记录列表）
- [x] 个人中心页
- [x] 底部 TabBar 导航
- [x] 本地数据存储 (Storage)

### Phase 2: 计划与提醒
- [ ] 服药计划设置
- [ ] 时间选择器
- [ ] 微信订阅消息
- [ ] 提醒推送逻辑

### Phase 3: 统计与优化
- [ ] 打卡日历
- [ ] 数据统计页
- [ ] 连续打卡 streak
- [ ] 健康洞察

### Phase 4: 用户系统
- [ ] 用户登录/授权
- [ ] 个人中心
- [ ] 数据云同步
- [ ] 紧急联系人

### Phase 5:  polish
- [ ] 动画优化
- [ ] 性能优化
- [ ] 无障碍适配
- [ ] 测试与修复

---

## 技术要点

### 数据存储策略
1. **本地优先** - 使用 wx.getStorageSync 快速存取
2. **云端同步** - 可选微信云开发或自建后端
3. **离线支持** - 无网络时正常打卡，有网后同步

### 提醒实现
- 使用微信小程序订阅消息
- 本地定时器做辅助提醒
- 支持后台提醒（需用户授权）

### 性能优化
- 列表虚拟滚动（药品多时）
- 图片懒加载
- 数据分页加载

---

## 设计检查清单

每个页面开发前检查：
- [ ] 是否使用正确的 surface 层级？
- [ ] 是否遵循无框线规则？
- [ ] 按钮是否使用渐变样式？
- [ ] 字体是否使用 Plus Jakarta Sans/Inter？
- [ ] 是否有足够的留白（spacing-8+）？
- [ ] 点击态是否有 scale(0.98) 效果？

---

## 当前状态

**已完成 (Phase 1):**
- 项目结构初始化
- TDesign 集成
- 设计系统配置
- 首页（今日提醒）- 进度圆环、今日用药列表、快速打卡
- 药品管理页 - 网格布局、库存显示、库存告急标记
- 添加药品页 - 表单、剂量、频率、提醒时间、库存管理
- 吃药记录页 - 日历视图、记录列表、健康分析报告
- 个人中心页 - 用户信息、设置入口
- 底部 TabBar 导航（4 个 tab）
- 本地数据存储

**进行中:**
- Phase 2: 提醒与计划功能

**下一步:**
1. 添加药品详情页
2. 完善打卡功能（补录）
3. 微信订阅消息提醒
4. 数据统计图表
