/**
 * 药品数据服务
 * 所有方法均通过 API 调用，返回 Promise
 */
const request = require('./request')

/**
 * 兼容后端返回结构差异：可能返回数组，也可能返回 { list: [] }。
 * @param {any} res
 * @returns {Array}
 */
function normalizeMedicationList(res) {
  if (Array.isArray(res)) return res
  if (res && Array.isArray(res.list)) return res.list
  return []
}

/**
 * 获取所有药品（可按状态筛选）
 * @param {string} [status] - 'active' | 'paused' | 'completed'
 * @returns {Promise<Array>}
 */
function getAll(status) {
  var params = {}
  if (status) params.status = status
  return request.get('/medications', params).then(normalizeMedicationList)
}

/**
 * 获取服用中的药品
 * @returns {Promise<Array>}
 */
function getActive() {
  return getAll('active')
}

/**
 * 根据 ID 获取药品（返回 { medication, recentCheckins }）
 * @param {string} id
 * @returns {Promise<Object>}
 */
function getById(id) {
  return request.get('/medications/' + id)
}

/**
 * 获取药品统计信息
 * @returns {Promise<{ total: number, active: number, lowStock: number }>}
 */
function getStats() {
  return request.get('/medications/stats')
}

/**
 * 添加药品
 * @param {Object} data
 * @returns {Promise<Object>}
 */
function add(data) {
  return request.post('/medications', data)
}

/**
 * 更新药品（部分更新）
 * @param {string} id
 * @param {Object} data
 * @returns {Promise<Object>}
 */
function update(id, data) {
  return request.patch('/medications/' + id, data)
}

/**
 * 删除药品
 * @param {string} id
 * @returns {Promise<any>}
 */
function remove(id) {
  return request.del('/medications/' + id)
}

/**
 * 更新库存（扣减或增加）
 * @param {string} id
 * @param {number} delta - 负数表示扣减，正数表示补充
 * @returns {Promise<Object>}
 */
function updateStock(id, delta) {
  return request.patch('/medications/' + id + '/stock', { delta: delta })
}

module.exports = {
  getAll,
  getActive,
  getById,
  getStats,
  add,
  update,
  remove,
  updateStock
}
