// pages/user/user.js
const userService = require('../../utils/userService')
const authService = require('../../utils/authService')

Page({
  data: {
    userInfo: {},
    isLogged: false,
    settings: [
      // {
      //   id: 'reminder',
      //   icon: 'notification',
      //   iconColor: '#0058bc',
      //   title: '提醒设置',
      //   desc: '管理服药提醒频率',
      //   value: ''
      // },
      {
        id: 'family',
        icon: 'home',
        iconColor: '#4c4aca',
        title: '家庭成员绑定',
        desc: '关联老人或小孩的账号',
        value: ''
      },
      {
        id: 'help',
        icon: 'help-circle',
        iconColor: '#006e28',
        title: '帮助与反馈',
        desc: '常见问题与在线客服',
        value: ''
      },
      {
        id: 'about',
        icon: 'info-circle',
        iconColor: '#0052d9',
        title: '关于',
        desc: '版本 v1.0.0',
        value: ''
      }
    ]
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ value: 'user' })
    }
  },

  async loadUserInfo() {
    try {
      const user = await userService.get()
      this.setData({
        isLogged: authService.isLogged(),
        userInfo: {
          nickName: user.nickName,
          avatarUrl: user.avatarUrl,
          healthScore: user.healthScore,
          joinDays: user.joinDays,
          status: user.healthScore >= 80 ? '健康守护中' : '需要更加坚持'
        }
      })
    } catch (err) {
      console.error('[User] loadUserInfo 失败:', err)
      this.setData({ isLogged: authService.isLogged() })
    }
  },

  /**
   * 获取微信头像和昵称（需用户主动触发）
   */
  async onSyncWxProfile() {
    try {
      const profile = await authService.getUserProfile()
      await userService.update({
        nickName: profile.nickName,
        avatarUrl: profile.avatarUrl
      })
      wx.showToast({ title: '同步成功', icon: 'success' })
      this.loadUserInfo()
    } catch (err) {
      wx.showToast({ title: '授权已取消', icon: 'none' })
    }
  },

  onSettingTap(e) {
    const { id } = e.currentTarget.dataset
    const settingMap = {
      'reminder': '/pages/settings/reminder',
      'family': '/pages/settings/family',
      'help': '/pages/settings/help',
      'about': '/pages/settings/about'
    }

    if (settingMap[id]) {
      wx.navigateTo({ url: settingMap[id] })
    }
  },

  onEditProfile() {
    wx.navigateTo({ url: '/pages/user/profile' })
  },

  async onLogout() {
    var self = this
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？将清除所有数据。',
      success: async function (res) {
        if (res.confirm) {
          try {
            authService.logout()
            await userService.clear()
          } catch (err) { /* 静默 */ }
          wx.showToast({ title: '已退出登录', icon: 'success' })
          self.loadUserInfo()
        }
      }
    })
  }
})
