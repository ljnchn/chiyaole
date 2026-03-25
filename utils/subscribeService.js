/**
 * 订阅消息服务
 * 管理微信订阅消息（wx.requestSubscribeMessage）授权流程
 * 
 * 使用说明：
 * 1. 在微信公众平台配置订阅消息模板，获取 tmplId
 * 2. 将 tmplId 填入下方 TMPL_IDS
 * 3. 后端接入后，在用户授权后调用后端 API 记录授权状态
 */
const storage = require('./storage')

const SUBSCRIBE_KEY = 'subscribe_status'

/**
 * 订阅消息模板 ID
 * TODO: 替换为在微信公众平台申请的真实模板 ID
 * 服药提醒模板需包含：药品名称、服药时间、剂量
 */
const TMPL_IDS = {
  medicationReminder: ''
}

/**
 * 获取模板 ID 列表（过滤掉未配置的）
 */
function getValidTmplIds() {
  return Object.values(TMPL_IDS).filter(id => id.length > 0)
}

/**
 * 获取本地订阅状态
 * @returns {{ [tmplId]: 'accept'|'reject'|'ban' }}
 */
function getStatus() {
  return storage.getItem(SUBSCRIBE_KEY) || {}
}

/**
 * 是否已有有效授权
 */
function hasAuthorized() {
  const status = getStatus()
  return Object.values(status).some(v => v === 'accept')
}

/**
 * 请求订阅消息授权
 * @param {string[]} tmplIds - 要请求的模板 ID 数组（最多 3 个）
 * @returns {Promise<Object>} 各模板的授权结果
 */
function requestSubscribe(tmplIds) {
  const ids = tmplIds || getValidTmplIds()
  if (ids.length === 0) {
    return Promise.resolve({})
  }

  return new Promise((resolve, reject) => {
    wx.requestSubscribeMessage({
      tmplIds: ids,
      success(res) {
        const status = getStatus()
        ids.forEach(id => {
          if (res[id]) {
            status[id] = res[id]
          }
        })
        storage.setItem(SUBSCRIBE_KEY, status)
        resolve(res)
      },
      fail(err) {
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
 * 适合在打卡等操作后调用
 */
function promptSubscribe() {
  const ids = getValidTmplIds()
  if (ids.length === 0) return Promise.resolve({})

  if (hasAuthorized()) return Promise.resolve(getStatus())

  return new Promise((resolve) => {
    wx.showModal({
      title: '开启服药提醒',
      content: '允许「吃药了」向您发送服药提醒通知，帮助按时服药。',
      confirmText: '开启',
      cancelText: '暂不',
      success(modalRes) {
        if (modalRes.confirm) {
          requestSubscribe(ids).then(resolve).catch(() => resolve({}))
        } else {
          resolve({})
        }
      }
    })
  })
}

/**
 * 打开系统设置页（当用户拒绝后需要引导到设置页重新授权）
 */
function openSetting() {
  wx.openSetting({
    success(res) {
      console.log('[Subscribe] 设置页结果:', res)
    }
  })
}

/**
 * 检查模板是否已配置
 */
function isConfigured() {
  return getValidTmplIds().length > 0
}

module.exports = {
  TMPL_IDS,
  getValidTmplIds,
  getStatus,
  hasAuthorized,
  requestSubscribe,
  promptSubscribe,
  openSetting,
  isConfigured
}
