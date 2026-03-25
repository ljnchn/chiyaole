/**
 * 打卡记录数据服务
 * 所有方法均通过 API 调用，返回 Promise
 */
const request = require('./request')

/**
 * 获取今日打卡数据（返回 { date, items, progress }）
 * @returns {Promise<Object>}
 */
function getToday() {
  return request.get('/checkins/today')
}

/**
 * 获取指定日期的打卡记录
 * @param {string} date - "2026-03-25"
 * @returns {Promise<Array>}
 */
function getByDate(date) {
  return request.get('/checkins', { date: date })
}

/**
 * 获取日期范围内的打卡记录
 * @param {string} start - "2026-03-01"
 * @param {string} end - "2026-03-31"
 * @returns {Promise<Array>}
 */
function getByDateRange(start, end) {
  return request.get('/checkins', { startDate: start, endDate: end })
}

/**
 * 获取指定药品的打卡记录
 * @param {string} medId
 * @returns {Promise<Array>}
 */
function getByMedication(medId) {
  return request.get('/checkins', { medicationId: medId })
}

/**
 * 获取日历视图数据
 * @param {number} year
 * @param {number} month - 1-12
 * @returns {Promise<Object>} 每日打卡状态 map
 */
function getCalendar(year, month) {
  return request.get('/checkins/calendar', { year: year, month: month })
}

/**
 * 添加打卡记录
 * @param {Object} data
 * @returns {Promise<Object>}
 */
function add(data) {
  return request.post('/checkins', data)
}

/**
 * 更新打卡记录
 * @param {string} id
 * @param {Object} data
 * @returns {Promise<Object>}
 */
function update(id, data) {
  return request.patch('/checkins/' + id, data)
}

/**
 * 删除打卡记录
 * @param {string} id
 * @returns {Promise<any>}
 */
function remove(id) {
  return request.del('/checkins/' + id)
}

/**
 * 获取统计概览（返回 { streakDays, compliance7d, compliance30d, healthScore }）
 * @returns {Promise<Object>}
 */
function getStats() {
  return request.get('/stats/overview')
}

module.exports = {
  getToday,
  getByDate,
  getByDateRange,
  getByMedication,
  getCalendar,
  add,
  update,
  remove,
  getStats
}
