// pages/medication/detail.js
const medicationService = require('../../utils/medicationService')
const lowStock = require('../../utils/lowStock')
const doseSchedule = require('../../utils/doseSchedule')

const FOOD_LABELS = {
  '': '不限',
  'before': '饭前',
  'with': '随餐',
  'after': '饭后',
  'sleep': '睡前',
  'empty': '空腹'
}

function getAvatarText(name) {
  const t = (name || '').toString().trim()
  return t ? t.charAt(0) : '药'
}

Page({
  data: {
    medication: null,
    recentRecords: [],
    foodLabel: '',
    intervalLabel: '',
    stockPercent: 0,
    lowStock: false
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

  async loadDetail() {
    try {
      const result = await medicationService.getById(this.medId)

      var med = result.medication
      if (!med) {
        wx.showToast({ title: '药品不存在', icon: 'none' })
        setTimeout(function () { wx.navigateBack() }, 500)
        return
      }

      // 防御性兜底：后端返回可能缺少 times 字段（例如删除/更新时的数据差异）
      if (!Array.isArray(med.times)) med.times = []
      if (med.remark === undefined || med.remark === null) med.remark = ''
      med.avatarText = getAvatarText(med.name)

      var stockPercent = med.total > 0 ? Math.round((med.remaining / med.total) * 100) : 0
      var lowStockFlag = lowStock.calcLowStock(med)
      var foodLabel = FOOD_LABELS[med.withFood] || '不限'
      var intervalLabel = doseSchedule.getIntervalLabel(doseSchedule.getDoseIntervalDays(med))

      var records = (result.recentCheckins || []).map(function (r) {
        return Object.assign({}, r, {
          statusText: r.status === 'taken' ? '已服用' : '漏服',
          timeText: r.actualTime || r.scheduledTime || '--'
        })
      })

      this.setData({
        medication: med,
        recentRecords: records,
        foodLabel: foodLabel,
        intervalLabel: intervalLabel,
        stockPercent: stockPercent,
        lowStock: lowStockFlag
      })
    } catch (err) {
      console.error('[MedicationDetail] 加载失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  onReplenish() {
    var med = this.data.medication
    if (!med) return
    var self = this
    wx.showModal({
      title: '补充库存',
      editable: true,
      placeholderText: '请输入补充数量',
      success: async function (res) {
        if (!res.confirm) return
        var delta = parseInt(res.content, 10)
        if (isNaN(delta) || delta <= 0) {
          wx.showToast({ title: '请输入有效数量', icon: 'none' })
          return
        }
        try {
          await medicationService.updateStock(med.id, delta)
          wx.showToast({ title: '已补充 ' + delta + ' ' + med.unit, icon: 'success' })
          self.loadDetail()
        } catch (err) {
          console.error('[MedicationDetail] 补充库存失败:', err)
        }
      }
    })
  },

  onToggleStatus() {
    var med = this.data.medication
    if (!med) return
    var newStatus = med.status === 'active' ? 'paused' : 'active'
    var label = newStatus === 'active' ? '恢复服用' : '暂停服用'
    var self = this
    wx.showModal({
      title: '确认操作',
      content: '确定要' + label + '「' + med.name + '」吗？',
      success: async function (res) {
        if (!res.confirm) return
        try {
          await medicationService.update(med.id, { status: newStatus })
          wx.showToast({ title: label + '成功', icon: 'success' })
          self.loadDetail()
        } catch (err) {
          console.error('[MedicationDetail] 切换状态失败:', err)
        }
      }
    })
  },

  onEdit() {
    if (!this.medId) return
    wx.navigateTo({ url: '/pages/medication/edit?id=' + this.medId })
  },

  onDelete() {
    var med = this.data.medication
    if (!med) return
    wx.showModal({
      title: '删除药品',
      content: '确定要删除「' + med.name + '」吗？删除后无法恢复。',
      confirmColor: '#e53935',
      success: async function (res) {
        if (!res.confirm) return
        try {
          await medicationService.remove(med.id)
          wx.showToast({ title: '已删除', icon: 'success' })
          setTimeout(function () { wx.navigateBack() }, 500)
        } catch (err) {
          console.error('[MedicationDetail] 删除失败:', err)
        }
      }
    })
  }
})
