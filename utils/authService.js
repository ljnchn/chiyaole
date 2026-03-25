/**
 * 登录授权服务
 * 管理微信登录流程和本地认证状态
 * 
 * 当前阶段：前端本地存储，不对接后端
 * 后续接入后端时只需实现 _requestLogin 中的 wx.request 即可
 */
const storage = require('./storage')

const AUTH_KEY = 'auth'

/**
 * 获取本地认证信息
 * @returns {{ logged: boolean, openid: string, token: string, expireAt: number }|null}
 */
function getAuth() {
  return storage.getItem(AUTH_KEY)
}

/**
 * 是否已登录
 */
function isLogged() {
  const auth = getAuth()
  if (!auth || !auth.logged) return false
  if (auth.expireAt && auth.expireAt < Date.now()) return false
  return true
}

/**
 * 静默登录（wx.login 获取 code）
 * 当前阶段：仅本地标记已登录状态
 * 后续需要将 code 发送给后端换取 token
 */
function login() {
  return new Promise((resolve, reject) => {
    wx.login({
      success(res) {
        if (!res.code) {
          reject(new Error('wx.login 获取 code 失败'))
          return
        }

        // TODO: 后端接入后替换为 wx.request 发送 code 到服务端
        // wx.request({
        //   url: 'https://api.chiyaole.com/v1/auth/login',
        //   method: 'POST',
        //   data: { code: res.code },
        //   success(apiRes) { ... }
        // })

        const auth = {
          logged: true,
          code: res.code,
          openid: '',
          token: '',
          expireAt: Date.now() + 7 * 24 * 3600 * 1000
        }
        storage.setItem(AUTH_KEY, auth)
        resolve(auth)
      },
      fail(err) {
        console.error('[Auth] wx.login 失败:', err)
        reject(err)
      }
    })
  })
}

/**
 * 检查会话是否有效
 */
function checkSession() {
  return new Promise((resolve) => {
    wx.checkSession({
      success() { resolve(true) },
      fail() { resolve(false) }
    })
  })
}

/**
 * 自动登录：检查会话 → 过期则重新登录
 */
async function autoLogin() {
  if (isLogged()) {
    const valid = await checkSession()
    if (valid) return getAuth()
  }
  return login()
}

/**
 * 获取微信用户头像和昵称（需用户主动触发）
 * 微信基础库 2.27.1+ 使用 wx.getUserProfile
 */
function getUserProfile() {
  return new Promise((resolve, reject) => {
    wx.getUserProfile({
      desc: '用于展示个人信息',
      success(res) {
        resolve({
          nickName: res.userInfo.nickName,
          avatarUrl: res.userInfo.avatarUrl
        })
      },
      fail(err) {
        reject(err)
      }
    })
  })
}

/**
 * 退出登录
 */
function logout() {
  storage.removeItem(AUTH_KEY)
}

module.exports = {
  getAuth,
  isLogged,
  login,
  checkSession,
  autoLogin,
  getUserProfile,
  logout
}
