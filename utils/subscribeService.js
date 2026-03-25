/**
 * 订阅消息服务
 * 混合模式：客户端 wx.requestSubscribeMessage + 服务端同步
 */
const request = require('./request')

/**
 * 订阅消息模板 ID
 * TODO: 替换为在微信公众平台申请的真实模板 ID
 */
const TMPL_IDS = {
  medicationReminder: ''
}

// 本地缓存 key
var _statusCache = null

/**
 * 获取模板 ID 列表（过滤掉未配置的）
 * @returns {string[]}
 */
function getValidTmplIds() {
  return Object.values(TMPL_IDS).filter(function (id) { return id.length > 0 })
}

/**
 * 从服务端获取订阅状态
 * @returns {Promise<Object>}
 */
function getStatus() {
  return request.get('/subscriptions').then(function (data) {
    _statusCache = data
    return data
  })
}

/**
 * 是否已有有效授权（优先用本地缓存，否则调用服务端）
 * @returns {boolean}
 */
function hasAuthorized() {
  if (_statusCache) {
    if (Array.isArray(_statusCache)) {
      return _statusCache.some(function (s) { return s.status === 'accept' })
    }
    return Object.values(_statusCache).some(function (v) { return v === 'accept' })
  }
  return false
}

/**
 * 请求订阅消息授权，然后把结果同步到服务端
 * @param {string[]} [tmplIds]
 * @returns {Promise<Object>}
 */
function requestSubscribe(tmplIds) {
  var ids = tmplIds || getValidTmplIds()
  if (ids.length === 0) {
    return Promise.resolve({})
  }

  return new Promise(function (resolve, reject) {
    wx.requestSubscribeMessage({
      tmplIds: ids,
      success: function (res) {
        var promises = []
        ids.forEach(function (id) {
          if (res[id]) {
            promises.push(
              request.post('/subscriptions', { tmplId: id, status: res[id] }).catch(function () { /* 静默 */ })
            )
          }
        })
        Promise.all(promises).then(function () {
          _statusCache = null
          resolve(res)
        })
      },
      fail: function (err) {
        if (err.errCode === 20004) {
          console.warn('[Subscribe] 用户关闭了订阅消息主开关')
        }
        reject(err)
      }
    })
  })
}

/**
 * 引导用户授权订阅消息（带友好提示）
 * @returns {Promise<Object>}
 */
function promptSubscribe() {
  var ids = getValidTmplIds()
  if (ids.length === 0) return Promise.resolve({})

  if (hasAuthorized()) return Promise.resolve({})

  return new Promise(function (resolve) {
    wx.showModal({
      title: '开启服药提醒',
      content: '允许「吃药了」向您发送服药提醒通知，帮助按时服药。',
      confirmText: '开启',
      cancelText: '暂不',
      success: function (modalRes) {
        if (modalRes.confirm) {
          requestSubscribe(ids).then(resolve).catch(function () { resolve({}) })
        } else {
          resolve({})
        }
      }
    })
  })
}

/**
 * 检查模板是否已配置
 * @returns {boolean}
 */
function isConfigured() {
  return getValidTmplIds().length > 0
}

/**
 * 打开系统设置页
 */
function openSetting() {
  wx.openSetting({
    success: function (res) {
      console.log('[Subscribe] 设置页结果:', res)
    }
  })
}

module.exports = {
  TMPL_IDS,
  getValidTmplIds,
  getStatus,
  hasAuthorized,
  requestSubscribe,
  promptSubscribe,
  isConfigured,
  openSetting
}
