// pages/user/user.js
Page({
  data: {
    userInfo: {
      nickName: '林静雅',
      avatarUrl: '',
      healthScore: 98,
      joinDays: 126,
      status: '健康守护中'
    },
    settings: [
      {
        id: 'reminder',
        icon: 'notification',
        iconColor: '#0058bc',
        title: '提醒设置',
        desc: '管理服药提醒频率',
        value: '静音、震动'
      },
      {
        id: 'family',
        icon: 'user-group',
        iconColor: '#4c4aca',
        title: '家庭成员绑定',
        desc: '关联老人或小孩的账号',
        value: '+1'
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
        iconColor: '#666',
        title: '关于',
        desc: '版本 v2.4.0 (Build 2024)',
        value: ''
      }
    ]
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 3
      })
    }
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.setData({ userInfo })
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
      wx.navigateTo({
        url: settingMap[id]
      })
    }
  },

  onEditProfile() {
    wx.navigateTo({
      url: '/pages/user/profile'
    })
  },

  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorage()
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
        }
      }
    })
  }
})