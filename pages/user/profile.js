// pages/user/profile.js
const userService = require('../../utils/userService')

/** 无头像时圆形文字：取昵称首字；无昵称时显示「用」；兼容 emoji 等多字节字符 */
function avatarLetterFromName(name) {
  var s = (name || '').trim()
  if (!s) return '用'
  var chars = Array.from(s)
  return chars[0] || '用'
}

Page({
  data: {
    nickName: '',
    avatarUrl: '',
    avatarLetter: '用'
  },

  async onLoad() {
    try {
      const user = await userService.get()
      // const ec = userService.getEmergencyContactFromUser(user)
      var nick = user.nickName || ''
      this.setData({
        nickName: nick,
        avatarUrl: user.avatarUrl || '',
        avatarLetter: avatarLetterFromName(nick)
      })
    } catch (err) {
      console.error('[Profile] 加载用户信息失败:', err)
    }
  },

  // 微信 chooseAvatar：点击头像区域触发
  onChooseAvatar(e) {
    const avatarUrl = e && e.detail ? e.detail.avatarUrl : ''
    this.setData({ avatarUrl: avatarUrl || '' })
  },

  onAvatarImageError() {
    this.setData({ avatarUrl: '' })
  },

  onNickNameInput(e) {
    const nickName = e && e.detail ? e.detail.value : ''
    this.setData({
      nickName: nickName || '',
      avatarLetter: avatarLetterFromName(nickName)
    })
  },

  onNickNameBlur(e) {
    const nickName = e && e.detail ? e.detail.value : ''
    this.setData({
      nickName: nickName || '',
      avatarLetter: avatarLetterFromName(nickName)
    })
  },

  // onEmergencyNameInput(e) {
  //   this.setData({ emergencyName: e.detail.value })
  // },

  // onEmergencyPhoneInput(e) {
  //   this.setData({ emergencyPhone: e.detail.value })
  // },

  async onSubmitSave(e) {
    // form submit 的字段取值（更符合微信文档：onBlur 后的值）
    const submitted = e && e.detail ? e.detail.value : {}
    const nickName = submitted && submitted.nickName !== undefined ? submitted.nickName : this.data.nickName
    // const emergencyName = this.data.emergencyName
    // const emergencyPhone = this.data.emergencyPhone

    const trimmedNick = (nickName || '').trim()

    if (!trimmedNick) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    try {
      // 头像选择返回的是“临时路径”（通常用于预览）。
      // 当前后端 avatarUrl 字段仅保存字符串；如需持久化请后续再接入上传/换取永久 URL。
      await userService.update({
        nickName: trimmedNick,
        avatarUrl: this.data.avatarUrl || ''
      })
      // await userService.updateEmergencyContact({
      //   name: emergencyName.trim(),
      //   phone: emergencyPhone.trim()
      // })

      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(function () { wx.navigateBack() }, 500)
    } catch (err) {
      console.error('[Profile] 保存失败:', err)
      wx.showToast({ title: '保存失败，请稍后重试', icon: 'none' })
    }
  }
})
