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
 * 从用户 settings 中读取紧急联系人
 * @param {Object} user
 * @returns {{ name: string, phone: string }|null}
 */
function getEmergencyContactFromUser(user) {
  if (!user || !user.settings) return null
  const ec = user.settings.emergencyContact
  if (!ec || typeof ec !== 'object') return null
  return {
    name: ec.name || '',
    phone: ec.phone || ''
  }
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
  // 后端没有单独的 emergency-contact endpoint，
  // 统一存放在 users.settings.emergencyContact 中
  return updateSettings({
    emergencyContact: {
      name: contact && contact.name ? contact.name : '',
      phone: contact && contact.phone ? contact.phone : ''
    }
  })
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
  getEmergencyContactFromUser,
  getSettings,
  updateSettings,
  updateEmergencyContact,
  updateHealthScore,
  clear
}
