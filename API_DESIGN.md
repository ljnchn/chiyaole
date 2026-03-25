# API 设计文档

**版本:** 1.0
**日期:** 2026-03-25
**Base URL:** `https://api.chiyaome.com/v1`

---

## 1. 总体设计

### 架构原则

- RESTful 风格，JSON 请求/响应
- 所有接口需认证（除登录接口外）
- 本地优先：客户端优先读写 Storage，联网时与服务端同步
- 幂等设计：打卡等操作支持重复提交不产生副作用

### 认证方式

微信小程序登录流程：

```
小程序端                         服务端
  |                                |
  |-- wx.login() 获取 code ------->|
  |                                |-- code2Session 换取 openid + session_key
  |<---- 返回 token (JWT) ---------|
  |                                |
  |-- 后续请求 Header:             |
  |   Authorization: Bearer <token>|
```

Token 有效期 7 天，过期后用 `refreshToken` 续期。

### 通用响应格式

```json
// 成功
{
  "code": 0,
  "message": "ok",
  "data": { ... }
}

// 失败
{
  "code": 40001,
  "message": "参数错误：name 不能为空",
  "data": null
}
```

### 错误码规范

| 范围 | 含义 |
|------|------|
| 0 | 成功 |
| 40001-40099 | 参数校验错误 |
| 40100-40199 | 认证/授权错误 |
| 40400-40499 | 资源不存在 |
| 40900-40999 | 业务冲突（重复打卡等） |
| 50000-50099 | 服务端内部错误 |

### 分页参数（列表接口通用）

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | number | 1 | 页码 |
| pageSize | number | 20 | 每页条数，最大 100 |

分页响应：

```json
{
  "code": 0,
  "data": {
    "list": [ ... ],
    "total": 128,
    "page": 1,
    "pageSize": 20
  }
}
```

---

## 2. 认证模块

### POST /auth/login

微信登录，获取 token。

**请求：**

```json
{
  "code": "0a3Xxxxxx"    // wx.login() 返回的 code
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "token": "eyJhbGciOi...",
    "refreshToken": "xxxxxx",
    "expiresIn": 604800,
    "isNewUser": true
  }
}
```

### POST /auth/refresh

续期 token。

**请求：**

```json
{
  "refreshToken": "xxxxxx"
}
```

**响应：** 同 login。

---

## 3. 用户模块

### GET /user/profile

获取当前用户信息。

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": "u_abc123",
    "openid": "oXXXX",
    "nickName": "小明",
    "avatarUrl": "",
    "healthScore": 94,
    "joinDate": "2026-03-25",
    "joinDays": 1,
    "streakDays": 12,
    "totalCheckIns": 86,
    "settings": {
      "reminderEnabled": true,
      "reminderSound": "default",
      "vibrationEnabled": true,
      "snoozeMinutes": 10
    },
    "emergencyContact": {
      "name": "",
      "phone": ""
    }
  }
}
```

### PUT /user/profile

更新用户信息（部分更新）。

**请求：**

```json
{
  "nickName": "静雅",
  "avatarUrl": "https://..."
}
```

**响应：** 返回完整 profile。

### PUT /user/settings

更新用户设置。

**请求：**

```json
{
  "reminderEnabled": false,
  "snoozeMinutes": 15
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "reminderEnabled": false,
    "reminderSound": "default",
    "vibrationEnabled": true,
    "snoozeMinutes": 15
  }
}
```

### PUT /user/emergency-contact

更新紧急联系人。

**请求：**

```json
{
  "name": "张三",
  "phone": "13800138000"
}
```

### DELETE /user/data

清除用户所有数据（退出/注销）。需二次确认 header `X-Confirm: DELETE`。

---

## 4. 药品模块

### GET /medications

获取用户的所有药品。

**Query 参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| status | string | 可选，筛选 `active` / `paused` / `completed` |

**响应：**

```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": "m_abc123",
        "name": "阿莫西林胶囊",
        "dosage": "1粒",
        "specification": "0.25g x 24粒",
        "icon": "capsule",
        "color": "#0058bc",
        "remark": "",
        "remaining": 2,
        "total": 24,
        "unit": "粒",
        "times": ["08:00", "20:00"],
        "withFood": "after",
        "status": "active",
        "createdAt": "2026-03-25T08:00:00Z",
        "updatedAt": "2026-03-25T08:00:00Z"
      }
    ],
    "total": 4
  }
}
```

### GET /medications/stats

获取药品统计摘要。

**响应：**

```json
{
  "code": 0,
  "data": {
    "total": 4,
    "active": 3,
    "paused": 1,
    "completed": 0,
    "lowStock": 2
  }
}
```

### GET /medications/:id

获取单个药品详情。

### POST /medications

添加药品。

**请求：**

```json
{
  "name": "阿莫西林胶囊",
  "dosage": "1粒",
  "specification": "0.25g x 24粒",
  "icon": "capsule",
  "color": "#0058bc",
  "remark": "",
  "remaining": 24,
  "total": 24,
  "unit": "粒",
  "times": ["08:00", "20:00"],
  "withFood": "after"
}
```

**校验规则：**

| 字段 | 规则 |
|------|------|
| name | 必填，1-50 字符 |
| dosage | 必填，1-20 字符 |
| icon | 可选，枚举：pill / capsule / tablet / spray，默认 pill |
| color | 可选，hex 格式，默认 #0058bc |
| times | 可选，数组，元素格式 HH:mm |
| withFood | 可选，枚举：before / after / empty / 空字符串 |
| remaining | 可选，>= 0，默认 0 |
| total | 可选，>= 0，默认 0 |

**响应：** 返回完整药品对象（含服务端生成的 id, createdAt, updatedAt）。

### PUT /medications/:id

更新药品（部分更新，仅传需要修改的字段）。

### DELETE /medications/:id

删除药品。同时删除关联的打卡记录。

### PATCH /medications/:id/stock

更新库存（专用接口，支持增减）。

**请求：**

```json
{
  "delta": -1     // 负数扣减，正数补充
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "id": "m_abc123",
    "remaining": 1,
    "total": 24,
    "lowStock": true
  }
}
```

---

## 5. 打卡模块

### POST /checkins

创建打卡记录（一键打卡）。

**请求：**

```json
{
  "medicationId": "m_abc123",
  "date": "2026-03-25",
  "scheduledTime": "08:00",
  "actualTime": "08:15",
  "status": "taken",
  "dosage": "1粒",
  "note": ""
}
```

**幂等逻辑：** 同一 `medicationId + date + scheduledTime` 组合若已存在 `taken` 记录，返回 `40900` 冲突而不重复创建。

**响应：** 返回完整打卡记录。

**副作用：** 打卡成功时服务端自动执行库存 -1（无需客户端单独调 stock 接口）。

### PUT /checkins/:id

更新打卡记录（补录、修改备注等）。

**请求：**

```json
{
  "status": "taken",
  "actualTime": "20:30",
  "note": "补录"
}
```

### DELETE /checkins/:id

删除打卡记录。

### GET /checkins

查询打卡记录。

**Query 参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| date | string | 按日查询，格式 YYYY-MM-DD |
| startDate | string | 范围起始（与 endDate 配合） |
| endDate | string | 范围结束 |
| medicationId | string | 按药品筛选 |
| status | string | taken / missed / skipped |
| page | number | 分页 |
| pageSize | number | 分页 |

**示例：** `GET /checkins?date=2026-03-25` 获取当日所有记录。

**响应：**

```json
{
  "code": 0,
  "data": {
    "list": [
      {
        "id": "c_xyz789",
        "medicationId": "m_abc123",
        "date": "2026-03-25",
        "scheduledTime": "08:00",
        "actualTime": "08:15",
        "status": "taken",
        "dosage": "1粒",
        "note": "",
        "createdAt": "2026-03-25T08:15:00Z"
      }
    ],
    "total": 5,
    "page": 1,
    "pageSize": 20
  }
}
```

### GET /checkins/today

获取今日待办 + 打卡状态（首页专用聚合接口）。

**响应：**

```json
{
  "code": 0,
  "data": {
    "date": "2026-03-25",
    "items": [
      {
        "medicationId": "m_abc123",
        "medicationName": "阿莫西林胶囊",
        "dosage": "1粒",
        "icon": "capsule",
        "color": "#0058bc",
        "scheduledTime": "08:00",
        "checkin": {
          "id": "c_xyz789",
          "status": "taken",
          "actualTime": "08:15"
        }
      },
      {
        "medicationId": "m_abc123",
        "medicationName": "阿莫西林胶囊",
        "dosage": "1粒",
        "icon": "capsule",
        "color": "#0058bc",
        "scheduledTime": "20:00",
        "checkin": null
      }
    ],
    "progress": {
      "total": 5,
      "completed": 3,
      "percentage": 60
    }
  }
}
```

### GET /checkins/calendar

获取月度日历打卡状态（日历视图专用）。

**Query 参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| year | number | 必填，如 2026 |
| month | number | 必填，1-12 |

**响应：**

```json
{
  "code": 0,
  "data": {
    "year": 2026,
    "month": 3,
    "days": {
      "2026-03-01": "taken",
      "2026-03-02": "taken",
      "2026-03-03": "partial",
      "2026-03-04": "missed",
      "2026-03-25": null
    }
  }
}
```

状态值：`taken`（全部完成）、`partial`（部分完成）、`missed`（全部漏服）、`null`（无任务/未来日期）。

---

## 6. 统计模块

### GET /stats/overview

获取用户统计总览（个人中心 + 首页用）。

**响应：**

```json
{
  "code": 0,
  "data": {
    "streakDays": 12,
    "maxStreak": 28,
    "totalCheckIns": 86,
    "healthScore": 94,
    "compliance7d": 92,
    "compliance30d": 88
  }
}
```

### GET /stats/compliance

获取依从率趋势数据（统计图表用）。

**Query 参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| period | string | `week` / `month` / `year` |
| startDate | string | 可选 |

**响应（period=month 示例）：**

```json
{
  "code": 0,
  "data": {
    "period": "month",
    "points": [
      { "date": "2026-03-01", "rate": 100 },
      { "date": "2026-03-02", "rate": 100 },
      { "date": "2026-03-03", "rate": 75 },
      { "date": "2026-03-04", "rate": 0 }
    ],
    "average": 88
  }
}
```

### GET /stats/report

获取健康报告（周报/月报）。

**Query 参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| type | string | `weekly` / `monthly` |
| date | string | 可选，报告所属日期，默认最近一期 |

**响应：**

```json
{
  "code": 0,
  "data": {
    "type": "weekly",
    "dateRange": { "start": "2026-03-18", "end": "2026-03-24" },
    "compliance": 92,
    "streakDays": 12,
    "totalDoses": 35,
    "missedDoses": 3,
    "bestMedication": { "id": "m_abc123", "name": "维生素 C 片", "rate": 100 },
    "worstMedication": { "id": "m_def456", "name": "布洛芬缓释胶囊", "rate": 71 },
    "suggestion": "您的服药规律性极佳，请继续保持良好的生活习惯。"
  }
}
```

---

## 7. 提醒模块

### POST /reminders/subscribe

记录用户订阅消息授权状态（调 `wx.requestSubscribeMessage` 后回调）。

**请求：**

```json
{
  "templateId": "tmpl_xxxxxx",
  "status": "accept"
}
```

### GET /reminders/pending

获取今日待推送提醒列表（供客户端本地展示倒计时等）。

**响应：**

```json
{
  "code": 0,
  "data": [
    {
      "id": "r_001",
      "medicationId": "m_abc123",
      "medicationName": "阿莫西林胶囊",
      "scheduledTime": "20:00",
      "dosage": "1粒",
      "withFood": "after",
      "status": "pending"
    }
  ]
}
```

### PUT /reminders/:id/snooze

延迟提醒。

**请求：**

```json
{
  "minutes": 10
}
```

---

## 8. 数据同步模块

### POST /sync/upload

本地数据批量上传（离线打卡后联网同步）。

**请求：**

```json
{
  "medications": [
    { "_action": "create", "localId": "xxx", ... },
    { "_action": "update", "id": "m_abc123", ... },
    { "_action": "delete", "id": "m_def456" }
  ],
  "checkins": [
    { "_action": "create", "localId": "xxx", ... }
  ],
  "lastSyncAt": "2026-03-24T10:00:00Z"
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "idMapping": {
      "medications": { "local_id_1": "m_server_1" },
      "checkins": { "local_id_1": "c_server_1" }
    },
    "conflicts": [],
    "syncedAt": "2026-03-25T10:00:00Z"
  }
}
```

### POST /sync/download

拉取服务端变更（多端同步场景）。

**请求：**

```json
{
  "lastSyncAt": "2026-03-24T10:00:00Z"
}
```

**响应：**

```json
{
  "code": 0,
  "data": {
    "medications": {
      "updated": [ ... ],
      "deleted": ["m_def456"]
    },
    "checkins": {
      "updated": [ ... ],
      "deleted": []
    },
    "user": { ... },
    "syncedAt": "2026-03-25T10:00:00Z"
  }
}
```

---

## 9. 接口总览

| # | 方法 | 路径 | 说明 | 优先级 |
|---|------|------|------|--------|
| 1 | POST | /auth/login | 微信登录 | P0 |
| 2 | POST | /auth/refresh | Token 续期 | P0 |
| 3 | GET | /user/profile | 获取用户信息 | P0 |
| 4 | PUT | /user/profile | 更新用户信息 | P1 |
| 5 | PUT | /user/settings | 更新设置 | P1 |
| 6 | PUT | /user/emergency-contact | 更新紧急联系人 | P2 |
| 7 | DELETE | /user/data | 清除用户数据 | P2 |
| 8 | GET | /medications | 获取药品列表 | P0 |
| 9 | GET | /medications/stats | 药品统计 | P0 |
| 10 | GET | /medications/:id | 药品详情 | P0 |
| 11 | POST | /medications | 添加药品 | P0 |
| 12 | PUT | /medications/:id | 更新药品 | P0 |
| 13 | DELETE | /medications/:id | 删除药品 | P1 |
| 14 | PATCH | /medications/:id/stock | 更新库存 | P0 |
| 15 | POST | /checkins | 打卡 | P0 |
| 16 | PUT | /checkins/:id | 更新打卡（补录） | P1 |
| 17 | DELETE | /checkins/:id | 删除打卡 | P2 |
| 18 | GET | /checkins | 查询打卡记录 | P0 |
| 19 | GET | /checkins/today | 今日待办聚合 | P0 |
| 20 | GET | /checkins/calendar | 月度日历状态 | P0 |
| 21 | GET | /stats/overview | 统计总览 | P1 |
| 22 | GET | /stats/compliance | 依从率趋势 | P2 |
| 23 | GET | /stats/report | 健康报告 | P2 |
| 24 | POST | /reminders/subscribe | 订阅消息授权 | P1 |
| 25 | GET | /reminders/pending | 待推送提醒 | P1 |
| 26 | PUT | /reminders/:id/snooze | 延迟提醒 | P2 |
| 27 | POST | /sync/upload | 离线数据上传 | P1 |
| 28 | POST | /sync/download | 拉取服务端变更 | P1 |

**P0 = 12 个接口（MVP 必须）**，P1 = 10 个，P2 = 6 个。

---

## 10. 前端接入策略

### 封装 wx.request

在 `utils/` 下新建 `request.js`，统一处理 token 注入、错误拦截、自动续期：

```
utils/
├── storage.js             # 基础存储（已有）
├── request.js             # NEW: HTTP 请求封装
├── medicationService.js   # 改造：优先读 Storage，写操作同时发 API
├── checkinService.js      # 同上
└── userService.js         # 同上
```

### 渐进式迁移

不一次性替换 Storage，而是分层接入：

```
阶段 A：仅登录 + 上传
  - 接入 /auth/login，获取 token
  - 打卡/添加药品时，Storage 写入成功后异步 POST 到服务端
  - 读取仍走 Storage（零风险切换）

阶段 B：读写双通道
  - onShow 时从 API 拉最新数据写入 Storage
  - 弱网降级到纯本地

阶段 C：完整同步
  - 接入 /sync/upload + /sync/download
  - 支持多端数据同步
  - 离线队列 + 冲突解决
```

### request.js 接口签名（预设）

```javascript
const request = require('./request')

// GET
request.get('/medications', { status: 'active' })

// POST
request.post('/checkins', { medicationId: 'xxx', ... })

// PUT
request.put('/medications/m_abc123', { name: '新名称' })

// PATCH
request.patch('/medications/m_abc123/stock', { delta: -1 })

// DELETE
request.delete('/medications/m_abc123')
```

---

## 11. 数据库表设计参考

供后端开发参考，与 API 字段一一映射：

```sql
-- 用户表
users (
  id          VARCHAR(32) PRIMARY KEY,
  openid      VARCHAR(64) UNIQUE NOT NULL,
  session_key VARCHAR(64),
  nick_name   VARCHAR(50) DEFAULT '',
  avatar_url  TEXT DEFAULT '',
  health_score INT DEFAULT 0,
  join_date   DATE NOT NULL,
  settings    JSON,
  emergency_contact JSON,
  created_at  TIMESTAMP DEFAULT NOW(),
  updated_at  TIMESTAMP DEFAULT NOW()
)

-- 药品表
medications (
  id            VARCHAR(32) PRIMARY KEY,
  user_id       VARCHAR(32) NOT NULL REFERENCES users(id),
  name          VARCHAR(50) NOT NULL,
  dosage        VARCHAR(20) NOT NULL,
  specification VARCHAR(50) DEFAULT '',
  icon          VARCHAR(20) DEFAULT 'pill',
  color         VARCHAR(10) DEFAULT '#0058bc',
  remark        TEXT DEFAULT '',
  remaining     INT DEFAULT 0,
  total         INT DEFAULT 0,
  unit          VARCHAR(10) DEFAULT '片',
  times         JSON DEFAULT '[]',
  with_food     VARCHAR(10) DEFAULT '',
  status        VARCHAR(20) DEFAULT 'active',
  created_at    TIMESTAMP DEFAULT NOW(),
  updated_at    TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_status (user_id, status)
)

-- 打卡记录表
checkins (
  id              VARCHAR(32) PRIMARY KEY,
  user_id         VARCHAR(32) NOT NULL REFERENCES users(id),
  medication_id   VARCHAR(32) NOT NULL REFERENCES medications(id),
  date            DATE NOT NULL,
  scheduled_time  VARCHAR(5) DEFAULT '',
  actual_time     VARCHAR(5) DEFAULT '',
  status          VARCHAR(10) DEFAULT 'taken',
  dosage          VARCHAR(20) DEFAULT '',
  note            TEXT DEFAULT '',
  created_at      TIMESTAMP DEFAULT NOW(),
  UNIQUE idx_unique_checkin (user_id, medication_id, date, scheduled_time),
  INDEX idx_user_date (user_id, date)
)

-- 提醒订阅记录
reminder_subscriptions (
  id          VARCHAR(32) PRIMARY KEY,
  user_id     VARCHAR(32) NOT NULL REFERENCES users(id),
  template_id VARCHAR(64) NOT NULL,
  status      VARCHAR(10) DEFAULT 'accept',
  created_at  TIMESTAMP DEFAULT NOW()
)
```
