// app.js
const userService = require('./utils/userService')
const medicationService = require('./utils/medicationService')
const checkinService = require('./utils/checkinService')

App({
  onLaunch() {
    this.initData()
  },

  /**
   * 首次启动时初始化种子数据
   * 后续启动跳过（各 service 内部判断 hasData）
   */
  initData() {
    // 顺序：先用户 → 药品 → 打卡（打卡依赖药品 ID）
    userService.initSeedData()
    medicationService.initSeedData()

    // 打卡种子数据需要药品列表（获取 id 和 times）
    const medications = medicationService.getActive()
    checkinService.initSeedData(medications)
  },

  globalData: {}
})
