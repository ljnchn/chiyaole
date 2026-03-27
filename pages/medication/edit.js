// pages/medication/edit.js
var medicationService = require('../../utils/medicationService')
var lowStock = require('../../utils/lowStock')

var FOOD_OPTIONS = [
  { value: '', label: '不限' },
  { value: 'before', label: '饭前' },
  { value: 'with', label: '随餐' },
  { value: 'after', label: '饭后' },
  { value: 'sleep', label: '睡前' }
]

var FREQ_OPTIONS = [
  { label: '1日1次', value: '1日1次' },
  { label: '1日2次', value: '1日2次' },
  { label: '1日3次', value: '1日3次' },
  { label: '1日4次', value: '1日4次' },
  { label: '隔日1次', value: '隔日1次' },
  { label: '每周1次', value: '每周1次' },
  { label: '必要时', value: '必要时' }
]

var TIME_HOUR_VALUES = ['00','01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23']
var TIME_MINUTE_VALUES = ['00','05','10','15','20','25','30','35','40','45','50','55']

var TIME_HOUR_OPTIONS = TIME_HOUR_VALUES.map(function (h) { return { label: h, value: h } })
var TIME_MINUTE_OPTIONS = TIME_MINUTE_VALUES.map(function (m) { return { label: m, value: m } })

function formatDate(d) {
  var y = d.getFullYear()
  var m = String(d.getMonth() + 1).padStart(2, '0')
  var day = String(d.getDate()).padStart(2, '0')
  return y + '-' + m + '-' + day
}

Page({
  data: {
    statusBarHeight: 20,
    navBarHeight: 64,

    medId: '',
    _origin: null,

    name: '',
    dosage: '',
    frequency: '1日3次',
    startDate: '',
    withFood: '',
    times: [],
    total: '',
    remaining: '',
    unit: '粒',
    lowStockEnabled: true,
    lowStockThreshold: 5,
    remark: '',

    // 选项数据
    foodOptions: FOOD_OPTIONS,
    freqOptions: FREQ_OPTIONS,
    timeHourOptions: TIME_HOUR_OPTIONS,
    timeMinuteOptions: TIME_MINUTE_OPTIONS,

    // UI 状态
    showTimePicker: false,
    showFreqPicker: false,
    freqPickerValue: ['1日3次']
  },

  onLoad(options) {
    var sysInfo = wx.getSystemInfoSync()
    var statusBarHeight = sysInfo.statusBarHeight || 20
    var navBarHeight = statusBarHeight + 44

    var medId = (options && options.id) ? options.id : ''
    this.setData({
      statusBarHeight: statusBarHeight,
      navBarHeight: navBarHeight,
      medId: medId,
      startDate: formatDate(new Date())
    })

    if (medId) this.loadDetail(medId)
  },

  onShow() {
    if (this.data.medId) this.loadDetail(this.data.medId)
  },

  async loadDetail(id) {
    try {
      var result = await medicationService.getById(id)
      var med = result && result.medication ? result.medication : null
      if (!med) {
        wx.showToast({ title: '药品不存在', icon: 'none' })
        setTimeout(function () { wx.navigateBack() }, 500)
        return
      }

      if (!Array.isArray(med.times)) med.times = []
      if (med.remark === undefined || med.remark === null) med.remark = ''
      if (med.withFood === undefined || med.withFood === null) med.withFood = ''

      var totalNum = parseInt(med.total, 10)
      var remainingNum = parseInt(med.remaining, 10)
      var safeTotal = Number.isFinite(totalNum) ? totalNum : 0
      var safeRemaining = Number.isFinite(remainingNum) ? Math.min(remainingNum, safeTotal) : safeTotal

      var enabledRaw = med.lowStockEnabled
      var enabled = enabledRaw === false || enabledRaw === 0 ? false : true

      var thresholdNum = parseInt(med.lowStockThreshold, 10)
      var safeThreshold = Number.isFinite(thresholdNum)
        ? Math.max(0, Math.min(thresholdNum, safeTotal))
        : lowStock.calcDefaultLowStockThreshold(safeTotal)

      this.setData({
        _origin: med,
        name: med.name || '',
        dosage: med.dosage || '',
        frequency: med.frequency || '1日3次',
        startDate: med.startDate || formatDate(new Date()),
        withFood: med.withFood,
        times: med.times,
        unit: med.unit || '粒',
        total: String(safeTotal),
        remaining: String(safeRemaining),
        lowStockEnabled: enabled,
        lowStockThreshold: safeThreshold,
        remark: med.remark || '',
        freqPickerValue: [med.frequency || '1日3次']
      })
    } catch (err) {
      console.error('[MedicationEdit] 加载失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  // --- 基本信息 ---
  onNameInput(e) {
    this.setData({ name: e.detail.value })
  },

  onDosageInput(e) {
    this.setData({ dosage: e.detail.value })
  },

  onStartDateChange(e) {
    this.setData({ startDate: e.detail.value })
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value })
  },

  // --- 服用方式 ---
  onSelectFood(e) {
    this.setData({ withFood: e.currentTarget.dataset.value })
  },

  // --- 频率选择 ---
  onShowFreqPicker() {
    this.setData({ showFreqPicker: true, freqPickerValue: [this.data.frequency] })
  },

  onFreqPickerConfirm(e) {
    var val = e.detail.value
    this.setData({
      frequency: val[0],
      showFreqPicker: false
    })
  },

  onFreqPickerCancel() {
    this.setData({ showFreqPicker: false })
  },

  // --- 时间管理 ---
  onAddTime() {
    this.setData({ showTimePicker: true })
  },

  onTimePickerConfirm(e) {
    var values = e.detail.value
    var hour = values && values[0]
    var minute = values && values[1]

    if (!hour || minute === undefined || minute === null || minute === '') {
      wx.showToast({ title: '请选择完整时间', icon: 'none' })
      return
    }

    var time = hour + ':' + minute
    if (this.data.times.indexOf(time) !== -1) {
      wx.showToast({ title: '该时间已添加', icon: 'none' })
      return
    }

    var newTimes = [].concat(this.data.times, [time]).sort()
    this.setData({ times: newTimes, showTimePicker: false })
  },

  onTimePickerCancel() {
    this.setData({ showTimePicker: false })
  },

  onRemoveTime(e) {
    var index = e.currentTarget.dataset.index
    var times = this.data.times.filter(function (_, i) { return i !== index })
    this.setData({ times: times })
  },

  // --- 库存 ---
  onTotalStepperChange(e) {
    var v = e && e.detail ? e.detail.value : 0
    var totalNum = Number.isFinite(v) ? v : parseInt(v, 10)
    if (!Number.isFinite(totalNum) || totalNum < 0) totalNum = 0

    this.setData({ total: totalNum })

    if (!this.data._thresholdTouched && totalNum > 0) {
      this.setData({
        lowStockThreshold: lowStock.calcDefaultLowStockThreshold(totalNum)
      })
    }
  },

  onRemainingStepperChange(e) {
    var v = e && e.detail ? e.detail.value : 0
    var remainingNum = Number.isFinite(v) ? v : parseInt(v, 10)
    if (!Number.isFinite(remainingNum) || remainingNum < 0) remainingNum = 0

    this.setData({ remaining: remainingNum })
  },

  onLowStockEnabledChange(e) {
    this.setData({ lowStockEnabled: !!e.detail.value })
  },

  onThresholdStepperChange(e) {
    var v = e && e.detail ? e.detail.value : undefined
    this.setData({
      lowStockThreshold: v,
      _thresholdTouched: true
    })
  },

  // --- 导航 ---
  onCancel() {
    wx.navigateBack()
  },

  // --- 保存 ---
  async onSave() {
    var data = this.data
    if (!data.medId) return

    if (!data.name.trim()) {
      wx.showToast({ title: '请输入药品名称', icon: 'none' })
      return
    }
    if (!data.dosage.trim()) {
      wx.showToast({ title: '请输入服用剂量', icon: 'none' })
      return
    }

    try {
      var totalNum = parseInt(data.total, 10)
      var remainingNum = parseInt(data.remaining, 10)
      var safeTotal = Number.isFinite(totalNum) ? totalNum : 0
      var safeRemaining = Number.isFinite(remainingNum) ? Math.min(remainingNum, safeTotal) : safeTotal
      var thresholdNum = parseInt(data.lowStockThreshold, 10)
      var safeThreshold = Number.isFinite(thresholdNum) ? Math.max(0, Math.min(thresholdNum, safeTotal)) : 0

      await medicationService.update(data.medId, {
        name: data.name.trim(),
        dosage: data.dosage.trim(),
        frequency: data.frequency,
        startDate: data.startDate || formatDate(new Date()),
        unit: data.unit,
        total: safeTotal,
        remaining: safeRemaining,
        lowStockEnabled: !!data.lowStockEnabled,
        lowStockThreshold: safeThreshold,
        times: data.times,
        withFood: data.withFood,
        remark: data.remark.trim()
      })

      wx.showToast({ title: '保存成功', icon: 'success' })
      setTimeout(function () { wx.navigateBack() }, 800)
    } catch (err) {
      console.error('[MedicationEdit] 保存失败:', err)
      wx.showToast({ title: '保存失败', icon: 'none' })
    }
  }
})

