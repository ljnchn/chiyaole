// app.js
const authService = require('./utils/authService')

App({
  _lastSilentLoginAt: 0,

  onLaunch() {
    this.silentLogin(true)
  },

  onShow() {
    // 小程序从后台回前台后，补一次会话校验，降低 session_key 失效带来的突发掉登
    this.silentLogin(false)
  },

  /**
   * 静默登录：自动调用 autoLogin 获取/刷新 token
   * @param {boolean} force - 是否强制执行（启动时 true）
   */
  silentLogin(force) {
    const now = Date.now()
    if (!force && now - this._lastSilentLoginAt < 60 * 1000) {
      return
    }
    this._lastSilentLoginAt = now

    authService.autoLogin().catch(function (err) {
      console.error('[App] 静默登录失败:', err)
    })
  },

  globalData: {}
})
