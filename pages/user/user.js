// pages/user/user.js
const userService = require('../../utils/userService')
const authService = require('../../utils/authService')

Page({
  data: {
    userInfo: {
      nickName: '未登录',
      avatarUrl: '',
      healthScore: 0,
      joinDays: 0,
      status: ''
    },
    isLogged: false,
    isRetryingLogin: false,
    loginError: '',
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

  onAvatarError() {
    // 头像 URL 存在但加载失败时，回退到占位头像，避免“白头像”
    this.setData({
      userInfo: Object.assign({}, this.data.userInfo, { avatarUrl: '' })
    })
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
      this.setData({ loginError: '' })
      const user = await userService.get()
      this.setData({
        isLogged: authService.isLogged(),
        userInfo: {
          nickName: user.nickName || '未设置昵称',
          avatarUrl: user.avatarUrl || '',
          healthScore: user.healthScore || 0,
          joinDays: user.joinDays || 0,
          status: (user.healthScore || 0) >= 80 ? '健康守护中' : '需要更加坚持'
        },
        isLogged: true
      })
    } catch (err) {
      console.error('[User] loadUserInfo 失败:', err)
      this.setData({
        isLogged: false,
        loginError: '登录失败，请重新登录',
        userInfo: Object.assign({}, this.data.userInfo, {
          nickName: '未登录',
          avatarUrl: ''
        })
      })
    }
  },

  async onRetryLogin() {
    if (this.data.isRetryingLogin) return
    this.setData({ isRetryingLogin: true })
    try {
      // 重新登录前清理认证缓存，避免旧 token 干扰
      wx.removeStorageSync('cym_auth')
      await authService.autoLogin()
      await this.loadUserInfo()
      wx.showToast({ title: '重新登录成功', icon: 'success' })
    } catch (err) {
      console.error('[User] 重新登录失败:', err)
      this.setData({ loginError: '登录失败，请检查网络后重试' })
      wx.showToast({ title: '重新登录失败', icon: 'none' })
    } finally {
      this.setData({ isRetryingLogin: false })
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
