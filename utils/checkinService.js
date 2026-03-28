/**
 * 打卡记录数据服务
 * 所有方法均通过 API 调用，返回 Promise
 */
const request = require('./request')

/**
 * 兼容后端返回结构差异：可能返回数组，也可能返回 { list: [] } / { items: [] }。
 * @param {any} res
 * @returns {Array}
 */
function normalizeCheckinList(res) {
  if (Array.isArray(res)) return res
  if (res && Array.isArray(res.list)) return res.list
  if (res && Array.isArray(res.items)) return res.items
  return []
}

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
  return request.get('/checkins', { date: date }).then(normalizeCheckinList)
}

/**
 * 获取日期范围内的打卡记录
 * @param {string} start - "2026-03-01"
 * @param {string} end - "2026-03-31"
 * @param {Object} [extraQuery] - 可选查询参数，如 { page: 1, pageSize: 100 }
 * @returns {Promise<Array>}
 */
function getByDateRange(start, end, extraQuery) {
  var params = { startDate: start, endDate: end }
  if (extraQuery && typeof extraQuery === 'object') {
    Object.keys(extraQuery).forEach(function (k) {
      params[k] = extraQuery[k]
    })
  }
  return request.get('/checkins', params).then(normalizeCheckinList)
}

/**
 * 获取指定药品的打卡记录
 * @param {string} medId
 * @returns {Promise<Array>}
 */
function getByMedication(medId) {
  return request.get('/checkins', { medicationId: medId }).then(normalizeCheckinList)
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
