/**
 * 用户数据服务
 * 所有方法均通过 API 调用，返回 Promise
 */
const request = require('./request')

/**
 * 获取用户信息
 * @returns {Promise<Object>}
 */
function get() {
  return request.get('/users/me')
}

/**
 * 更新用户信息（部分更新）
 * @param {Object} data
 * @returns {Promise<Object>}
 */
function update(data) {
  return request.patch('/users/me', data)
}

/**
 * 获取用户设置
 * @returns {Promise<Object>}
 */
function getSettings() {
  return request.get('/users/me').then(function (user) {
    return user.settings || {}
  })
}

/**
 * 更新用户设置（部分更新）
 * @param {Object} settings
 * @returns {Promise<Object>}
 */
function updateSettings(settings) {
  return request.patch('/users/me/settings', settings)
}

/**
 * 更新紧急联系人
 * @param {Object} contact - { name, phone }
 * @returns {Promise<Object>}
 */
function updateEmergencyContact(contact) {
  return request.patch('/users/me/emergency-contact', contact)
}

/**
 * 更新健康分
 * @param {number} rate - 健康分数
 * @returns {Promise<Object>}
 */
function updateHealthScore(rate) {
  return request.patch('/users/me', { healthScore: rate })
}

/**
 * 清除所有用户数据
 * @returns {Promise<any>}
 */
function clear() {
  return request.del('/users/me/data', { 'X-Confirm': 'DELETE' })
}

module.exports = {
  get,
  update,
  getSettings,
  updateSettings,
  updateEmergencyContact,
  updateHealthScore,
  clear
}
