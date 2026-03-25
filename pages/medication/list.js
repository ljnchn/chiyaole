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

  async loadMedications() {
    try {
      const medications = await medicationService.getAll()
      const stats = await medicationService.getStats()

      const list = medications.map(function (m) {
        return Object.assign({}, m, {
          lowStock: m.total > 0 && m.remaining / m.total < 0.2
        })
      })

      this.setData({ medications: list, stats: stats })
    } catch (err) {
      console.error('[MedicationList] 加载失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  onAddMedication() {
    wx.navigateTo({ url: '/pages/medication/add' })
  },

  onMedicationTap(e) {
    const { id } = e.currentTarget.dataset
    wx.navigateTo({ url: '/pages/medication/detail?id=' + id })
  }
})
