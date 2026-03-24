// pages/index/index.js
Page({
  data: {
    userName: '小明',
    currentDate: '',
    weekDay: '',
    progress: 75,
    completedCount: 3,
    totalCount: 4,
    streakDays: 12,
    todayMedications: [
      {
        id: 1,
        name: '阿司匹林',
        dosage: '100mg',
        time: '08:00',
        taken: true,
        icon: 'pill',
        color: '#0058bc'
      },
      {
        id: 2,
        name: '维生素 C',
        dosage: '500mg',
        time: '12:30',
        taken: true,
        icon: 'capsule',
        color: '#006e28'
      },
      {
        id: 3,
        name: '降压灵',
        dosage: '1片',
        time: '20:00',
        taken: false,
        icon: 'tablet',
        color: '#e53935',
        urgent: true
      },
      {
        id: 4,
        name: '辅酶 Q10',
        dosage: '100mg',
        time: '21:00',
        taken: false,
        icon: 'capsule',
        color: '#4c4aca'
      }
    ]
  },

  onLoad() {
    this.updateDate()
    this.updateProgress()
  },

  onShow() {
    this.updateDate()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0
      })
    }
  },

  updateDate() {
    const now = new Date()
    const month = now.getMonth() + 1
    const date = now.getDate()
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    const weekDay = weekDays[now.getDay()]

    this.setData({
      currentDate: `${month}月${date}日`,
      weekDay: `星期${weekDay}`
    })
  },

  updateProgress() {
    const { todayMedications } = this.data
    const taken = todayMedications.filter(m => m.taken).length
    const total = todayMedications.length
    const progress = total > 0 ? Math.round((taken / total) * 100) : 0

    this.setData({
      progress,
      completedCount: taken,
      totalCount: total
    })
  },

  onCheckIn(e) {
    const { id } = e.currentTarget.dataset
    const { todayMedications } = this.data
    const medication = todayMedications.find(m => m.id === id)

    if (medication.taken) {
      wx.showToast({
        title: '已经打卡过了',
        icon: 'none'
      })
      return
    }

    // Update taken status
    const updatedMedications = todayMedications.map(m => {
      if (m.id === id) {
        return { ...m, taken: true }
      }
      return m
    })

    this.setData({
      todayMedications: updatedMedications
    }, () => {
      this.updateProgress()
      wx.showToast({
        title: '打卡成功',
        icon: 'success'
      })
    })
  },

  onAddMedication() {
    wx.navigateTo({
      url: '/pages/medication/add'
    })
  },

  onViewAll() {
    wx.switchTab({
      url: '/pages/record/record'
    })
  }
})
