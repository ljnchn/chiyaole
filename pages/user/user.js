// pages/user/user.js
const userService = require('../../utils/userService')
const checkinService = require('../../utils/checkinService')
const medicationService = require('../../utils/medicationService')

Page({
  data: {
    userInfo: {},
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

  loadUserInfo() {
    // 计算并更新健康分
    const activeMeds = medicationService.getActive()
    const compliance = checkinService.getComplianceRate(7, activeMeds)
    userService.updateHealthScore(compliance)

    const updatedUser = userService.get()
    this.setData({
      userInfo: {
        nickName: updatedUser.nickName,
        avatarUrl: updatedUser.avatarUrl,
        healthScore: updatedUser.healthScore,
        joinDays: updatedUser.joinDays,
        status: updatedUser.healthScore >= 80 ? '健康守护中' : '需要更加坚持'
      }
    })
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

  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？将清除所有本地数据。',
      success: (res) => {
        if (res.confirm) {
          userService.clear()
          wx.showToast({ title: '已退出登录', icon: 'success' })
          this.loadUserInfo()
        }
      }
    })
  }
})
