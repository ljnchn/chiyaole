/**
 * 用户数据服务
 * Storage key: 'user'
 */
const storage = require('./storage')

const KEY = 'user'

const DEFAULT_USER = {
  nickName: '用药小助手',
  avatarUrl: '',
  healthScore: 0,
  joinDate: '',        // 首次启动日期
  settings: {
    reminderEnabled: true,
    reminderSound: 'default',
    vibrationEnabled: true,
    snoozeMinutes: 10
  },
  emergencyContact: {
    name: '',
    phone: ''
  }
}

/**
 * 获取用户信息
 * @returns {Object}
 */
function get() {
  const user = storage.getItem(KEY)
  if (!user) return { ...DEFAULT_USER }

  // 计算加入天数
  const joinDays = user.joinDate
    ? Math.floor((Date.now() - new Date(user.joinDate + 'T00:00:00').getTime()) / 86400000) + 1
    : 1

  return { ...user, joinDays }
}

/**
 * 更新用户信息（部分更新）
 * @param {Object} data
 * @returns {Object}
 */
function update(data) {
  const current = storage.getItem(KEY) || { ...DEFAULT_USER }

  // 不允许外部修改 joinDate
  delete data.joinDate
  delete data.joinDays

  const updated = { ...current, ...data }
  storage.setItem(KEY, updated)
  return get()
}

/**
 * 获取设置
 * @returns {Object}
 */
function getSettings() {
  const user = get()
  return user.settings || DEFAULT_USER.settings
}

/**
 * 更新设置（部分更新）
 * @param {Object} settings
 * @returns {Object}
 */
function updateSettings(settings) {
  const user = storage.getItem(KEY) || { ...DEFAULT_USER }
  user.settings = { ...user.settings, ...settings }
  storage.setItem(KEY, user)
  return user.settings
}

/**
 * 更新紧急联系人
 * @param {Object} contact - { name, phone }
 * @returns {Object}
 */
function updateEmergencyContact(contact) {
  const user = storage.getItem(KEY) || { ...DEFAULT_USER }
  user.emergencyContact = { ...user.emergencyContact, ...contact }
  storage.setItem(KEY, user)
  return user.emergencyContact
}

/**
 * 计算健康分（基于打卡数据）
 * 简单算法：最近 7 天依从率映射到 0-100 分
 * @param {number} complianceRate - 依从率百分比
 * @returns {number}
 */
function calcHealthScore(complianceRate) {
  return Math.round(complianceRate)
}

/**
 * 更新健康分
 * @param {number} complianceRate
 * @returns {number}
 */
function updateHealthScore(complianceRate) {
  const score = calcHealthScore(complianceRate)
  update({ healthScore: score })
  return score
}

/**
 * 清除所有用户数据（退出登录）
 */
function clear() {
  storage.removeItem(KEY)
  storage.removeItem('medications')
  storage.removeItem('checkins')
}

/**
 * 初始化种子数据
 */
function initSeedData() {
  if (storage.hasData(KEY)) return

  const user = {
    ...DEFAULT_USER,
    nickName: '小明',
    healthScore: 94,
    joinDate: storage.today()
  }
  storage.setItem(KEY, user)
}

module.exports = {
  get,
  update,
  getSettings,
  updateSettings,
  updateEmergencyContact,
  updateHealthScore,
  clear,
  initSeedData
}
