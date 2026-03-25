// pages/user/profile.js
const userService = require('../../utils/userService')

Page({
  data: {
    nickName: '',
    emergencyName: '',
    emergencyPhone: ''
  },

  onLoad() {
    const user = userService.get()
    this.setData({
      nickName: user.nickName || '',
      emergencyName: user.emergencyContact ? user.emergencyContact.name : '',
      emergencyPhone: user.emergencyContact ? user.emergencyContact.phone : ''
    })
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

  onSave() {
    const { nickName, emergencyName, emergencyPhone } = this.data

    if (!nickName.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    userService.update({ nickName: nickName.trim() })
    userService.updateEmergencyContact({
      name: emergencyName.trim(),
      phone: emergencyPhone.trim()
    })

    wx.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => wx.navigateBack(), 500)
  }
})
