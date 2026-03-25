/**
 * 纯工具函数层
 * 仅保留日期格式化和 ID 生成，不涉及 wx storage CRUD
 */

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

/**
 * 生成唯一 ID
 * 格式：时间戳(36进制) + 4位随机字符
 */
function generateId() {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 6)
  return `${timestamp}_${random}`
}

module.exports = {
  today,
  formatTime,
  generateId
}
