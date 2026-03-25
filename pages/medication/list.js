// pages/medication/list.js
const medicationService = require('../../utils/medicationService')
const lowStock = require('../../utils/lowStock')

function getAvatarText(name) {
  const t = (name || '').toString().trim()
  return t ? t.charAt(0) : '药'
}

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

      const list = medications.map(function (m) {
        return Object.assign({}, m, {
          avatarText: getAvatarText(m.name),
          lowStock: lowStock.calcLowStock(m),
          stockPercent: m.total > 0 ? (m.remaining / m.total) * 100 : 0
        })
      })

      this.setData({
        medications: list,
        stats: {
          total: list.length,
          lowStock: list.filter(function (m) { return m.lowStock }).length
        }
      })
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
