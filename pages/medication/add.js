// pages/medication/add.js
const medicationService = require('../../utils/medicationService')

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

// 餐食关系
const FOOD_OPTIONS = [
  { value: '', label: '不限' },
  { value: 'before', label: '饭前' },
  { value: 'after', label: '饭后' },
  { value: 'empty', label: '空腹' }
]

Page({
  data: {
    // 表单字段
    name: '',
    dosage: '',
    specification: '',
    remark: '',
    icon: 'pill',
    color: '#0058bc',
    unit: '片',
    total: 0,
    remaining: 0,
    withFood: '',
    times: [],

    // 选项数据
    iconOptions: ICON_OPTIONS,
    colorOptions: COLOR_OPTIONS,
    unitOptions: UNIT_OPTIONS,
    foodOptions: FOOD_OPTIONS,

    // UI 状态
    showTimePicker: false,
    showUnitPicker: false,
    unitPickerValue: [0]
  },

  // --- 基本信息 ---

  onNameInput(e) {
    this.setData({ name: e.detail.value })
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
    const idx = UNIT_OPTIONS.indexOf(this.data.unit)
    this.setData({ showUnitPicker: true, unitPickerValue: [Math.max(0, idx)] })
  },

  onUnitPickerConfirm(e) {
    this.setData({ unit: e.detail.value[0], showUnitPicker: false })
  },

  onUnitPickerCancel() {
    this.setData({ showUnitPicker: false })
  },

  // --- 库存 ---

  onTotalChange(e) {
    const total = e.detail.value
    this.setData({
      total,
      remaining: Math.min(this.data.remaining, total) || total
    })
  },

  onRemainingChange(e) {
    this.setData({ remaining: e.detail.value })
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
    const time = values[0] + ':' + values[1]
    const { times } = this.data
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
    const { name, dosage, specification, icon, color, unit, total, remaining, times, withFood, remark } = this.data

    if (!name.trim()) {
      wx.showToast({ title: '请输入药品名称', icon: 'none' })
      return
    }
    if (!dosage.trim()) {
      wx.showToast({ title: '请输入剂量', icon: 'none' })
      return
    }

    try {
      await medicationService.add({
        name: name.trim(),
        dosage: dosage.trim(),
        specification: specification.trim(),
        icon: icon,
        color: color,
        unit: unit,
        total: total,
        remaining: remaining || total,
        times: times,
        withFood: withFood,
        remark: remark.trim(),
        status: 'active'
      })

      wx.showToast({ title: '添加成功', icon: 'success' })
      setTimeout(function () {
        wx.navigateBack()
      }, 800)
    } catch (err) {
      console.error('[MedicationAdd] 保存失败:', err)
    }
  }
})
