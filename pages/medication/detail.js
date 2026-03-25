// pages/medication/detail.js
const medicationService = require('../../utils/medicationService')
const checkinService = require('../../utils/checkinService')

const FOOD_LABELS = { 'before': '饭前', 'after': '饭后', 'empty': '空腹', '': '不限' }

Page({
  data: {
    medication: null,
    recentRecords: [],
    foodLabel: '',
    stockPercent: 0
  },

  onLoad(options) {
    if (options.id) {
      this.medId = options.id
      this.loadDetail()
    }
  },

  onShow() {
    if (this.medId) this.loadDetail()
  },

  loadDetail() {
    const med = medicationService.getById(this.medId)
    if (!med) {
      wx.showToast({ title: '药品不存在', icon: 'none' })
      setTimeout(() => wx.navigateBack(), 500)
      return
    }

    const stockPercent = med.total > 0 ? Math.round((med.remaining / med.total) * 100) : 0
    const foodLabel = FOOD_LABELS[med.withFood] || '不限'

    const records = checkinService.getByMedication(med.id)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10)
      .map(r => ({
        ...r,
        statusText: r.status === 'taken' ? '已服用' : '漏服',
        timeText: r.actualTime || r.scheduledTime || '--'
      }))

    this.setData({ medication: med, recentRecords: records, foodLabel, stockPercent })
  },

  onReplenish() {
    const med = this.data.medication
    if (!med) return
    wx.showModal({
      title: '补充库存',
      editable: true,
      placeholderText: '请输入补充数量',
      success: (res) => {
        if (!res.confirm) return
        const delta = parseInt(res.content, 10)
        if (isNaN(delta) || delta <= 0) {
          wx.showToast({ title: '请输入有效数量', icon: 'none' })
          return
        }
        medicationService.updateStock(med.id, delta)
        wx.showToast({ title: `已补充 ${delta} ${med.unit}`, icon: 'success' })
        this.loadDetail()
      }
    })
  },

  onToggleStatus() {
    const med = this.data.medication
    if (!med) return
    const newStatus = med.status === 'active' ? 'paused' : 'active'
    const label = newStatus === 'active' ? '恢复服用' : '暂停服用'
    wx.showModal({
      title: '确认操作',
      content: `确定要${label}「${med.name}」吗？`,
      success: (res) => {
        if (!res.confirm) return
        medicationService.update(med.id, { status: newStatus })
        wx.showToast({ title: label + '成功', icon: 'success' })
        this.loadDetail()
      }
    })
  },

  onDelete() {
    const med = this.data.medication
    if (!med) return
    wx.showModal({
      title: '删除药品',
      content: `确定要删除「${med.name}」吗？删除后无法恢复。`,
      confirmColor: '#e53935',
      success: (res) => {
        if (!res.confirm) return
        medicationService.remove(med.id)
        wx.showToast({ title: '已删除', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 500)
      }
    })
  }
})
