/**
 * Storage 基础工具层
 * 封装 wx.getStorageSync / wx.setStorageSync，提供通用 CRUD 能力
 */

const STORAGE_PREFIX = 'cym_'

/**
 * 生成唯一 ID
 * 格式：时间戳(36进制) + 4位随机字符
 */
function generateId() {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 6)
  return `${timestamp}_${random}`
}

/**
 * 获取列表数据
 * @param {string} key - 存储键名（自动加前缀）
 * @returns {Array}
 */
function getList(key) {
  try {
    return wx.getStorageSync(STORAGE_PREFIX + key) || []
  } catch (e) {
    console.error(`[Storage] getList(${key}) 失败:`, e)
    return []
  }
}

/**
 * 保存列表数据
 * @param {string} key - 存储键名
 * @param {Array} list - 数据数组
 */
function setList(key, list) {
  try {
    wx.setStorageSync(STORAGE_PREFIX + key, list)
  } catch (e) {
    console.error(`[Storage] setList(${key}) 失败:`, e)
  }
}

/**
 * 获取单个对象
 * @param {string} key - 存储键名
 * @returns {Object|null}
 */
function getItem(key) {
  try {
    return wx.getStorageSync(STORAGE_PREFIX + key) || null
  } catch (e) {
    console.error(`[Storage] getItem(${key}) 失败:`, e)
    return null
  }
}

/**
 * 保存单个对象
 * @param {string} key - 存储键名
 * @param {Object} data - 数据对象
 */
function setItem(key, data) {
  try {
    wx.setStorageSync(STORAGE_PREFIX + key, data)
  } catch (e) {
    console.error(`[Storage] setItem(${key}) 失败:`, e)
  }
}

/**
 * 删除存储项
 * @param {string} key - 存储键名
 */
function removeItem(key) {
  try {
    wx.removeStorageSync(STORAGE_PREFIX + key)
  } catch (e) {
    console.error(`[Storage] removeItem(${key}) 失败:`, e)
  }
}

/**
 * 检查某个存储键是否已有数据
 * @param {string} key - 存储键名
 * @returns {boolean}
 */
function hasData(key) {
  try {
    const data = wx.getStorageSync(STORAGE_PREFIX + key)
    if (Array.isArray(data)) return data.length > 0
    return data !== '' && data !== null && data !== undefined
  } catch (e) {
    return false
  }
}

/**
 * 获取今日日期字符串
 * @returns {string} "2026-03-25"
 */
function today() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/**
 * 格式化时间为 HH:mm
 * @param {Date} date
 * @returns {string}
 */
function formatTime(date) {
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

module.exports = {
  generateId,
  getList,
  setList,
  getItem,
  setItem,
  removeItem,
  hasData,
  today,
  formatTime
}
