// pages/medication/add.js
var medicationService = require('../../utils/medicationService')
var lowStock = require('../../utils/lowStock')
var doseSchedule = require('../../utils/doseSchedule')
var dosageInputUtil = require('../../utils/dosageInput')

var FOOD_OPTIONS = [
  { value: '', label: '不限' },
  { value: 'before', label: '饭前' },
  { value: 'with', label: '随餐' },
  { value: 'after', label: '饭后' }
  // { value: 'sleep', label: '睡前' }
]

/** 用药间隔：value 为 doseIntervalDays（0=必要时，1=每日，2=隔日，3=每3日，7=每周） */
var INTERVAL_OPTIONS = [
  { label: '每日', value: '1' },
  { label: '隔日一次', value: '2' },
  { label: '每3日一次', value: '3' },
  { label: '每周一次', value: '7' },
  { label: '必要时', value: '0' }
]

/** 服用剂量 input 后的可选单位；保存时与 input 拼接为 dosage，并作为库存 unit（未选默认粒） */
var DOSAGE_UNIT_LABELS = ['无', '片', '粒', '丸', '袋', '支', 'ml', 'mg', '喷', '滴']
var DOSAGE_UNIT_VALUES = ['', '片', '粒', '丸', '袋', '支', 'ml', 'mg', '喷', '滴']

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

    name: '',
    dosageInput: '',
    dosageUnit: '',
    dosageUnitIndex: 0,
    dosageUnitLabels: DOSAGE_UNIT_LABELS,
    doseIntervalDays: 1,
    intervalLabelText: '每日',
    startDate: '',
    withFood: '',
    times: [],
    total: '',
    remaining: '',
    lowStockEnabled: true,
    lowStockThreshold: 5,
    remark: '',

    // 选项数据
    foodOptions: FOOD_OPTIONS,
    intervalOptions: INTERVAL_OPTIONS,
    timeHourOptions: TIME_HOUR_OPTIONS,
    timeMinuteOptions: TIME_MINUTE_OPTIONS,

    // UI 状态
    showTimePicker: false,
    showIntervalPicker: false,
    intervalPickerValue: ['1']
  },

  onLoad() {
    var sysInfo = wx.getSystemInfoSync()
    var statusBarHeight = sysInfo.statusBarHeight || 20
    var navBarHeight = statusBarHeight + 44
    this.setData({
      statusBarHeight: statusBarHeight,
      navBarHeight: navBarHeight,
      startDate: formatDate(new Date())
    })
  },

  // --- 基本信息 ---

  onNameInput(e) {
    this.setData({ name: e.detail.value })
  },

  onDosageInput(e) {
    this.setData({ dosageInput: dosageInputUtil.sanitizeDosageNumericInput(e.detail.value) })
  },

  onDosageUnitChange(e) {
    var idx = parseInt(e.detail.value, 10)
    if (isNaN(idx) || idx < 0) idx = 0
    if (idx >= DOSAGE_UNIT_VALUES.length) idx = DOSAGE_UNIT_VALUES.length - 1
    this.setData({
      dosageUnitIndex: idx,
      dosageUnit: DOSAGE_UNIT_VALUES[idx]
    })
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

  // --- 用药间隔 ---

  onShowIntervalPicker() {
    this.setData({
      showIntervalPicker: true,
      intervalPickerValue: [String(this.data.doseIntervalDays)]
    })
  },

  onIntervalPickerConfirm(e) {
    var val = e.detail.value
    var n = parseInt(val && val[0], 10)
    if (![0, 1, 2, 3, 7].includes(n)) n = 1
    this.setData({
      doseIntervalDays: n,
      intervalLabelText: doseSchedule.getIntervalLabel(n),
      showIntervalPicker: false
    })
  },

  onIntervalPickerCancel() {
    this.setData({ showIntervalPicker: false })
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

    if (!data.name.trim()) {
      wx.showToast({ title: '请输入药品名称', icon: 'none' })
      return
    }
    if (!data.dosageInput.trim()) {
      wx.showToast({ title: '请输入服用剂量', icon: 'none' })
      return
    }

    var dosageCombined = data.dosageInput.trim() + (data.dosageUnit || '')
    var stockUnit = data.dosageUnit || '粒'

    if (data.times.length === 0 && data.doseIntervalDays !== 0) {
      wx.showToast({ title: '建议添加至少一个用药时间', icon: 'none' })
    }

    try {
      var totalNum = parseInt(data.total, 10)
      var remainingNum = parseInt(data.remaining, 10)
      var safeTotal = Number.isFinite(totalNum) ? totalNum : 0
      var safeRemaining = Number.isFinite(remainingNum) ? Math.min(remainingNum, safeTotal) : safeTotal
      var thresholdNum = parseInt(data.lowStockThreshold, 10)
      var safeThreshold = Number.isFinite(thresholdNum) ? Math.max(0, Math.min(thresholdNum, safeTotal)) : 0

      await medicationService.add({
        name: data.name.trim(),
        dosage: dosageCombined,
        doseIntervalDays: data.doseIntervalDays,
        startDate: data.startDate || formatDate(new Date()),
        specification: '',
        icon: 'pill',
        color: '#0058bc',
        unit: stockUnit,
        total: safeTotal,
        remaining: safeRemaining,
        lowStockEnabled: !!data.lowStockEnabled,
        lowStockThreshold: safeThreshold,
        times: data.times,
        withFood: data.withFood,
        remark: data.remark.trim(),
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
