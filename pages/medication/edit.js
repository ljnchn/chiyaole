// pages/medication/edit.js
const medicationService = require('../../utils/medicationService')
const lowStock = require('../../utils/lowStock')

// 图标选项
const ICON_OPTIONS = [
  { value: 'pill', label: '药片' },
  { value: 'capsule', label: '胶囊' },
  { value: 'tablet', label: '片剂' },
  { value: 'spray', label: '喷剂' }
]

// 颜色选项
const COLOR_OPTIONS = [
  { value: '#0058bc', label: '蓝' },
  { value: '#006e28', label: '绿' },
  { value: '#4c4aca', label: '紫' },
  { value: '#e53935', label: '红' },
  { value: '#00bcd4', label: '青' },
  { value: '#ff9800', label: '橙' }
]

// 单位选项
const UNIT_OPTIONS = ['片', '粒', 'ml', '喷', '袋', '支']
const UNIT_PICKER_OPTIONS = UNIT_OPTIONS.map(function (u) { return { label: u, value: u } })

const TIME_HOUR_VALUES = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23']
const TIME_MINUTE_VALUES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

const TIME_HOUR_OPTIONS = [{ label: '不设定', value: '' }].concat(
  TIME_HOUR_VALUES.map(function (h) { return { label: h, value: h } })
)
const TIME_MINUTE_OPTIONS = TIME_MINUTE_VALUES.map(function (m) { return { label: m, value: m } })

// 餐食关系
const FOOD_OPTIONS = [
  { value: '', label: '不限' },
  { value: 'before', label: '饭前' },
  { value: 'after', label: '饭后' },
  { value: 'empty', label: '空腹' }
]

function getAvatarText(name) {
  const t = (name || '').toString().trim()
  return t ? t.charAt(0) : '药'
}

Page({
  data: {
    // 表单字段
    name: '',
    avatarText: '药',
    dosage: '',
    specification: '',
    remark: '',
    icon: 'pill',
    color: '#0058bc',
    unit: '片',
    total: 0,
    remaining: 0,
    lowStockEnabled: true,
    lowStockThreshold: 0,
    lowStockThresholdTouched: false,
    withFood: '',
    times: [],

    // 选项数据
    iconOptions: ICON_OPTIONS,
    colorOptions: COLOR_OPTIONS,
    unitOptions: UNIT_PICKER_OPTIONS,
    foodOptions: FOOD_OPTIONS,

    timeHourOptions: TIME_HOUR_OPTIONS,
    timeMinuteOptions: TIME_MINUTE_OPTIONS,

    // UI 状态
    showTimePicker: false,
    showUnitPicker: false,
    unitPickerValue: ['片']
  },

  onLoad(options) {
    if (options && options.id) {
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

      const med = result.medication
      if (!med) {
        wx.showToast({ title: '药品不存在', icon: 'none' })
        setTimeout(function () { wx.navigateBack() }, 500)
        return
      }

      if (!Array.isArray(med.times)) med.times = []
      if (med.remark === undefined || med.remark === null) med.remark = ''
      if (med.specification === undefined || med.specification === null) med.specification = ''
      if (med.withFood === undefined || med.withFood === null) med.withFood = ''

      const totalNum = Number(med.total)
      const safeTotal = Number.isFinite(totalNum) ? totalNum : 0
      const remainingNum = Number(med.remaining)
      const safeRemaining = Number.isFinite(remainingNum) ? remainingNum : safeTotal

      const enabledRaw = med.lowStockEnabled
      const enabled = enabledRaw === false || enabledRaw === 0 ? false : true

      const thresholdNum = Number(med.lowStockThreshold)
      const threshold = Number.isFinite(thresholdNum)
        ? Math.max(0, Math.min(thresholdNum, safeTotal))
        : lowStock.calcDefaultLowStockThreshold(safeTotal)

      this.setData({
        name: med.name || '',
        avatarText: getAvatarText(med.name),
        dosage: med.dosage || '',
        specification: med.specification || '',
        remark: med.remark || '',
        icon: med.icon || 'pill',
        color: med.color || '#0058bc',
        unit: med.unit || '片',
        total: safeTotal,
        remaining: Math.min(safeRemaining, safeTotal),
        lowStockEnabled: enabled,
        lowStockThreshold: threshold,
        lowStockThresholdTouched: false,
        withFood: med.withFood,
        times: med.times,
        unitPickerValue: [med.unit || '片']
      })
    } catch (err) {
      console.error('[MedicationEdit] 加载失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  // --- 基本信息 ---
  onNameInput(e) {
    const name = e.detail.value
    const t = (name || '').toString().trim()
    this.setData({
      name: name,
      avatarText: t ? t.charAt(0) : '药'
    })
  },

  onDosageInput(e) {
    this.setData({ dosage: e.detail.value })
  },

  onSpecInput(e) {
    this.setData({ specification: e.detail.value })
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  // --- 图标 & 颜色 ---
  onSelectIcon(e) {
    this.setData({ icon: e.currentTarget.dataset.value })
  },

  onSelectColor(e) {
    this.setData({ color: e.currentTarget.dataset.value })
  },

  // --- 单位选择 ---
  onShowUnitPicker() {
    this.setData({ showUnitPicker: true, unitPickerValue: [this.data.unit] })
  },

  onUnitPickerConfirm(e) {
    this.setData({ unit: e.detail.value[0], showUnitPicker: false })
  },

  onUnitPickerCancel() {
    this.setData({ showUnitPicker: false })
  },

  // --- 库存 ---
  onTotalChange(e) {
    const totalNum = Number(e.detail.value)
    const remainingNum = Number(this.data.remaining)
    const safeRemaining = Number.isFinite(remainingNum) ? Math.min(remainingNum, totalNum) : totalNum

    const safeThreshold = this.data.lowStockThresholdTouched
      ? Number(this.data.lowStockThreshold)
      : lowStock.calcDefaultLowStockThreshold(totalNum)

    this.setData({
      total: totalNum,
      remaining: safeRemaining,
      lowStockThreshold: Number.isFinite(safeThreshold) ? Math.max(0, Math.min(safeThreshold, totalNum)) : 0
    })
  },

  onRemainingChange(e) {
    this.setData({ remaining: Number(e.detail.value) })
  },

  onLowStockEnabledChange(e) {
    const enabled = !!e.detail.value
    const nextThreshold = (!this.data.lowStockThresholdTouched && enabled)
      ? lowStock.calcDefaultLowStockThreshold(this.data.total)
      : this.data.lowStockThreshold

    this.setData({
      lowStockEnabled: enabled,
      lowStockThreshold: Number.isFinite(nextThreshold) ? Number(nextThreshold) : 0
    })
  },

  onLowStockThresholdChange(e) {
    const v = Number(e.detail.value)
    this.setData({
      lowStockThresholdTouched: true,
      lowStockThreshold: Number.isFinite(v) ? Math.max(0, Math.min(v, this.data.total || 0)) : 0
    })
  },

  // --- 餐食关系 ---
  onSelectFood(e) {
    this.setData({ withFood: e.currentTarget.dataset.value })
  },

  // --- 服药时间 ---
  onAddTime() {
    this.setData({ showTimePicker: true })
  },

  onTimePickerChange(e) {
    const values = e.detail.value // ['08', '00']
    const { times } = this.data
    const hour = values && values[0]
    const minute = values && values[1]

    if (!hour) {
      this.setData({ times: [], showTimePicker: false })
      return
    }

    if (minute === undefined || minute === null || minute === '') {
      wx.showToast({ title: '请选择完整时间', icon: 'none' })
      return
    }

    const time = hour + ':' + minute
    if (times.includes(time)) {
      wx.showToast({ title: '该时间已添加', icon: 'none' })
      return
    }

    const newTimes = [].concat(times, [time]).sort()
    this.setData({ times: newTimes, showTimePicker: false })
  },

  onTimePickerCancel() {
    this.setData({ showTimePicker: false })
  },

  onRemoveTime(e) {
    const { index } = e.currentTarget.dataset
    const times = this.data.times.filter(function (_, i) { return i !== index })
    this.setData({ times: times })
  },

  // --- 保存 ---
  async onSave() {
    const { name, dosage, specification, icon, color, unit, total, remaining, times, withFood, remark, lowStockEnabled, lowStockThreshold } = this.data

    if (!name.trim()) {
      wx.showToast({ title: '请输入药品名称', icon: 'none' })
      return
    }
    if (!dosage.trim()) {
      wx.showToast({ title: '请输入剂量', icon: 'none' })
      return
    }

    try {
      const totalNum = Number(total)
      const remainingProvided = remaining !== '' && remaining !== null && remaining !== undefined
      const remainingNum = remainingProvided ? Number(remaining) : totalNum

      const safeTotal = Number.isFinite(totalNum) ? totalNum : 0
      const safeRemaining = Number.isFinite(remainingNum) ? Math.min(remainingNum, safeTotal) : safeTotal

      const thresholdNum = Number(lowStockThreshold)
      const safeThreshold = Number.isFinite(thresholdNum)
        ? Math.max(0, Math.min(thresholdNum, safeTotal))
        : 0

      await medicationService.update(this.medId, {
        name: name.trim(),
        dosage: dosage.trim(),
        specification: specification.trim(),
        icon: icon,
        color: color,
        unit: unit,
        total: safeTotal,
        remaining: safeRemaining,
        lowStockEnabled: !!lowStockEnabled,
        lowStockThreshold: safeThreshold,
        times: times,
        withFood: withFood,
        remark: remark.trim()
      })

      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(function () {
        wx.navigateBack()
      }, 800)
    } catch (err) {
      console.error('[MedicationEdit] 保存失败:', err)
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  }
})

