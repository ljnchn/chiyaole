// app.js
const userService = require('./utils/userService')
const medicationService = require('./utils/medicationService')
const checkinService = require('./utils/checkinService')
const authService = require('./utils/authService')

App({
  onLaunch() {
    this.initData()
    this.silentLogin()
  },

  /**
   * 首次启动时初始化种子数据
   * 后续启动跳过（各 service 内部判断 hasData）
   */
  initData() {
    userService.initSeedData()
    medicationService.initSeedData()

    const medications = medicationService.getActive()
    checkinService.initSeedData(medications)
  },

  /**
   * 静默登录：每次启动自动调用 wx.login
   * 获取 code 并在本地记录登录状态
   * 后端接入后用于换取 openid + token
   */
  silentLogin() {
    authService.autoLogin().catch(err => {
      console.error('[App] 静默登录失败:', err)
    })
  },

  globalData: {}
})
