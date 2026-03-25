// pages/user/profile.js
const userService = require('../../utils/userService')

Page({
  data: {
    nickName: '',
    emergencyName: '',
    emergencyPhone: ''
  },

  async onLoad() {
    try {
      const user = await userService.get()
      this.setData({
        nickName: user.nickName || '',
        emergencyName: user.emergencyContact ? user.emergencyContact.name : '',
        emergencyPhone: user.emergencyContact ? user.emergencyContact.phone : ''
      })
    } catch (err) {
      console.error('[Profile] 加载用户信息失败:', err)
    }
  },

  onNickNameInput(e) {
    this.setData({ nickName: e.detail.value })
  },

  onEmergencyNameInput(e) {
    this.setData({ emergencyName: e.detail.value })
  },

  onEmergencyPhoneInput(e) {
    this.setData({ emergencyPhone: e.detail.value })
  },

  async onSave() {
    const { nickName, emergencyName, emergencyPhone } = this.data

    if (!nickName.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    try {
      await userService.update({ nickName: nickName.trim() })
      await userService.updateEmergencyContact({
        name: emergencyName.trim(),
        phone: emergencyPhone.trim()
      })

      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(function () { wx.navigateBack() }, 500)
    } catch (err) {
      console.error('[Profile] 保存失败:', err)
    }
  }
})
