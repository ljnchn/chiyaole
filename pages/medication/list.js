// pages/medication/list.js
const medicationService = require('../../utils/medicationService')

Page({
  data: {
    medications: [],
    stats: {
      total: 0,
      lowStock: 0
    }
  },

  onLoad() {
    this.loadMedications()
  },

  onShow() {
    this.loadMedications()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ value: 'medication' })
    }
  },

  loadMedications() {
    const medications = medicationService.getAll()
    const stats = medicationService.getStats()

    // 为列表计算 lowStock 标记
    const list = medications.map(m => ({
      ...m,
      lowStock: m.total > 0 && m.remaining / m.total < 0.2
    }))

    this.setData({ medications: list, stats })
  },

  onAddMedication() {
    wx.navigateTo({ url: '/pages/medication/add' })
  },

  onMedicationTap() {
    wx.showToast({ title: '详情页开发中', icon: 'none' })
  }
})
