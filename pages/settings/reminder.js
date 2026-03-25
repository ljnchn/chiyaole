// pages/settings/reminder.js
const userService = require('../../utils/userService')
const subscribeService = require('../../utils/subscribeService')

Page({
  data: {
    reminderEnabled: true,
    vibrationEnabled: true,
    snoozeMinutes: 10,
    snoozeOptions: [5, 10, 15, 20, 30],
    subscribeAuthorized: false,
    subscribeConfigured: false
  },

  async onLoad() {
    try {
      const settings = await userService.getSettings()
      this.setData({
        reminderEnabled: settings.reminderEnabled !== false,
        vibrationEnabled: settings.vibrationEnabled !== false,
        snoozeMinutes: settings.snoozeMinutes || 10,
        subscribeAuthorized: subscribeService.hasAuthorized(),
        subscribeConfigured: subscribeService.isConfigured()
      })
    } catch (err) {
      console.error('[Reminder] 加载设置失败:', err)
    }
  },

  onShow() {
    this.setData({
      subscribeAuthorized: subscribeService.hasAuthorized()
    })
  },

  async onReminderChange(e) {
    var enabled = e.detail.value
    try {
      await userService.updateSettings({ reminderEnabled: enabled })
      this.setData({ reminderEnabled: enabled })

      if (enabled && !this.data.subscribeAuthorized) {
        this.onRequestSubscribe()
      }
    } catch (err) {
      console.error('[Reminder] 更新提醒设置失败:', err)
    }
  },

  async onVibrationChange(e) {
    var enabled = e.detail.value
    try {
      await userService.updateSettings({ vibrationEnabled: enabled })
      this.setData({ vibrationEnabled: enabled })
    } catch (err) {
      console.error('[Reminder] 更新振动设置失败:', err)
    }
  },

  async onSnoozeChange(e) {
    var index = e.detail.value
    var minutes = this.data.snoozeOptions[index]
    try {
      await userService.updateSettings({ snoozeMinutes: minutes })
      this.setData({ snoozeMinutes: minutes })
      wx.showToast({ title: '贪睡 ' + minutes + ' 分钟', icon: 'none' })
    } catch (err) {
      console.error('[Reminder] 更新贪睡设置失败:', err)
    }
  },

  /**
   * 请求订阅消息授权
   */
  onRequestSubscribe() {
    if (!this.data.subscribeConfigured) {
      wx.showToast({ title: '提醒模板尚未配置', icon: 'none' })
      return
    }

    var self = this
    subscribeService.requestSubscribe().then(function () {
      var authorized = subscribeService.hasAuthorized()
      self.setData({ subscribeAuthorized: authorized })
      if (authorized) {
        wx.showToast({ title: '授权成功', icon: 'success' })
      }
    }).catch(function (err) {
      if (err.errCode === 20004) {
        wx.showModal({
          title: '通知已关闭',
          content: '请在微信「设置 → 通知 → 小程序通知」中开启通知权限。',
          confirmText: '去设置',
          success: function (res) {
            if (res.confirm) subscribeService.openSetting()
          }
        })
      } else {
        wx.showToast({ title: '授权失败', icon: 'none' })
      }
    })
  },

  /**
   * 跳转到系统设置页
   */
  onOpenSetting() {
    subscribeService.openSetting()
  }
})
