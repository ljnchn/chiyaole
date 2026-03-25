// app.js
const authService = require('./utils/authService')

App({
  onLaunch() {
    this.silentLogin()
  },

  /**
   * 静默登录：自动调用 autoLogin 获取/刷新 token
   */
  silentLogin() {
    authService.autoLogin().catch(function (err) {
      console.error('[App] 静默登录失败:', err)
    })
  },

  globalData: {}
})
