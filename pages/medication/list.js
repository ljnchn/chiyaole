// pages/medication/list.js
Page({
  data: {
    medications: [
      {
        id: 1,
        name: '阿莫西林胶囊',
        specification: '0.25g * 24粒',
        remaining: 2,
        total: 24,
        unit: '粒',
        icon: 'capsule',
        color: '#0058bc',
        lowStock: true
      },
      {
        id: 2,
        name: '维生素 C 片',
        specification: '100mg * 100片',
        remaining: 68,
        total: 100,
        unit: '片',
        icon: 'pill',
        color: '#006e28',
        lowStock: false
      },
      {
        id: 3,
        name: '沙丁胺醇吸入剂',
        specification: '200 喷/支',
        remaining: 120,
        total: 200,
        unit: '喷',
        icon: 'spray',
        color: '#00bcd4',
        lowStock: false
      },
      {
        id: 4,
        name: '布洛芬缓释胶囊',
        specification: '0.3g * 10粒',
        remaining: 1,
        total: 10,
        unit: '粒',
        icon: 'capsule',
        color: '#e53935',
        lowStock: true
      }
    ],
    stats: {
      total: 24,
      lowStock: 3
    }
  },

  onLoad() {
    this.loadMedications()
  },

  onShow() {
    this.loadMedications()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 2
      })
    }
  },

  loadMedications() {
    const medications = wx.getStorageSync('medications') || this.data.medications
    const stats = this.calculateStats(medications)
    this.setData({ medications, stats })
  },

  calculateStats(medications) {
    return {
      total: medications.length,
      lowStock: medications.filter(m => m.remaining / m.total < 0.2).length
    }
  },

  onAddMedication() {
    wx.navigateTo({
      url: '/pages/medication/add'
    })
  },

  onMedicationTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/medication/detail?id=${id}`
    })
  }
})