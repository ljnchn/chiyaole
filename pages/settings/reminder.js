// pages/settings/reminder.js
const userService = require('../../utils/userService')

Page({
  data: {
    reminderEnabled: true,
    vibrationEnabled: true,
    snoozeMinutes: 10,
    snoozeOptions: [5, 10, 15, 20, 30]
  },

  onLoad() {
    const settings = userService.getSettings()
    this.setData({
      reminderEnabled: settings.reminderEnabled !== false,
      vibrationEnabled: settings.vibrationEnabled !== false,
      snoozeMinutes: settings.snoozeMinutes || 10
    })
  },

  onReminderChange(e) {
    const enabled = e.detail.value
    userService.updateSettings({ reminderEnabled: enabled })
    this.setData({ reminderEnabled: enabled })
  },

  onVibrationChange(e) {
    const enabled = e.detail.value
    userService.updateSettings({ vibrationEnabled: enabled })
    this.setData({ vibrationEnabled: enabled })
  },

  onSnoozeChange(e) {
    const index = e.detail.value
    const minutes = this.data.snoozeOptions[index]
    userService.updateSettings({ snoozeMinutes: minutes })
    this.setData({ snoozeMinutes: minutes })
    wx.showToast({ title: `贪睡 ${minutes} 分钟`, icon: 'none' })
  }
})
