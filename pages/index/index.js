// pages/index/index.js
const medicationService = require('../../utils/medicationService')
const checkinService = require('../../utils/checkinService')
const storage = require('../../utils/storage')
const subscribeService = require('../../utils/subscribeService')

const WEEKDAY_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const FOOD_LABELS = { before: '饭前服用', after: '饭后服用', empty: '空腹服用' }

function timeLabel(scheduledTime) {
  return scheduledTime ? scheduledTime : '未设定时间'
}

Page({
  data: {
    yearMonth: '',
    weekNumber: 0,
    weekDays: [],
    selectedDate: '',
    streakDays: 0,
    progress: 0,
    completedCount: 0,
    totalCount: 0,
    dayItems: [],
    /** 当前选中的日期是否早于今天（用于按钮显示「补录」） */
    isPastSelectedDay: false,
    notificationDot: false
  },

  onLoad() {
    this.initWeekCalendar()
  },

  onShow() {
    this.loadDayData(this.data.selectedDate || storage.today())
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ value: 'index' })
    }
  },

  initWeekCalendar() {
    var today = new Date()
    var todayStr = storage.today()
    var dayOfWeek = today.getDay()
    var mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

    var monday = new Date(today)
    monday.setDate(today.getDate() + mondayOffset)

    var weekDays = []
    for (var i = 0; i < 7; i++) {
      var d = new Date(monday)
      d.setDate(monday.getDate() + i)
      var dateStr = formatDateStr(d)
      weekDays.push({
        shortName: WEEKDAY_SHORT[(d.getDay() + 7) % 7],
        day: d.getDate(),
        date: dateStr,
        isToday: dateStr === todayStr,
        selected: dateStr === todayStr
      })
    }

    var weekNum = getISOWeekNumber(today)

    this.setData({
      yearMonth: today.getFullYear() + '年' + (today.getMonth() + 1) + '月',
      weekNumber: weekNum,
      weekDays: weekDays,
      selectedDate: todayStr
    })

    this.loadDayData(todayStr)
  },

  onSelectDay(e) {
    var date = e.currentTarget.dataset.date
    var weekDays = this.data.weekDays.map(function (d) {
      return Object.assign({}, d, { selected: d.date === date })
    })
    this.setData({ weekDays: weekDays, selectedDate: date })
    this.loadDayData(date)
  },

  async loadDayData(dateStr) {
    try {
      var todayStr = storage.today()
      var nowTime = storage.formatTime(new Date())
      var items = []

      var medications = await medicationService.getActive()
      var dayCheckins = await checkinService.getByDate(dateStr)

      medications.forEach(function (med) {
        var times = med.times || []
        var usagePercent = med.total > 0 ? Math.round((med.remaining / med.total) * 100) : 0
        var foodLabel = FOOD_LABELS[med.withFood] || ''
        var dosageDesc = med.dosage + (foodLabel ? ' · ' + foodLabel : '')
        if (times.length === 0) {
          var existing = dayCheckins.find(function (c) {
            return c.medicationId === med.id && c.scheduledTime === ''
          })
          items.push({
            id: med.id,
            medicationId: med.id,
            name: med.name,
            dosage: med.dosage,
            dosageDesc: dosageDesc,
            specification: med.specification,
            time: '',
            scheduledTime: '',
            taken: existing ? existing.status === 'taken' : false,
            checkinId: existing ? existing.id : null,
            timeLabel: timeLabel(''),
            color: med.color,
            remaining: med.remaining,
            total: med.total,
            unit: med.unit,
            usagePercent: usagePercent,
            urgent: false,
            future: false,
          })
          return
        }

        times.forEach(function (time) {
          var existing = dayCheckins.find(function (c) {
            return c.medicationId === med.id && c.scheduledTime === time
          })
          var taken = existing ? existing.status === 'taken' : false
          var urgent = false
          var future = false

          if (!taken && dateStr === todayStr) {
            if (nowTime > time) {
              urgent = true
            } else if (nowTime < time) {
              future = true
            }
          }
          if (dateStr > todayStr) {
            future = true
          }

          items.push({
            id: med.id + '_' + time,
            medicationId: med.id,
            name: med.name,
            dosage: med.dosage,
            dosageDesc: dosageDesc,
            specification: med.specification,
            time: time,
            scheduledTime: time,
            timeLabel: timeLabel(time),
            taken: taken,
            checkinId: existing ? existing.id : null,
            color: med.color,
            remaining: med.remaining,
            total: med.total,
            unit: med.unit,
            usagePercent: usagePercent,
            urgent: urgent,
            future: future
          })
        })
      })

      items.sort(function (a, b) {
        return (a.time || '99:99').localeCompare(b.time || '99:99')
      })

      var total = items.length
      var completed = items.filter(function (m) { return m.taken }).length
      var progress = total > 0 ? Math.round((completed / total) * 100) : 0

      var streakDays = 0
      try {
        var stats = await checkinService.getStats()
        streakDays = (stats && stats.streakDays) ? stats.streakDays : 0
      } catch (e) { /* 忽略 */ }

      var isPastSelectedDay = dateStr < todayStr

      this.setData({
        dayItems: items,
        isPastSelectedDay: isPastSelectedDay,
        totalCount: total,
        completedCount: completed,
        progress: progress,
        streakDays: streakDays
      })
    } catch (err) {
      console.error('[Index] loadDayData 失败:', err)
    }
  },

  async onCheckIn(e) {
    var id = e.currentTarget.dataset.id
    var targetItem = null
    this.data.dayItems.forEach(function (m) {
      if (m.id === id) targetItem = m
    })
    if (!targetItem) return

    var todayStr = storage.today()
    var selectedDate = this.data.selectedDate
    var isFutureDay = selectedDate > todayStr

    // 未来日期：不可打卡
    if (isFutureDay) {
      wx.showToast({ title: '不能为未来日期打卡', icon: 'none' })
      return
    }

    // 待办（今天未到计划时间）不可操作
    if (targetItem.future) {
      wx.showToast({ title: '还没到服药时间', icon: 'none' })
      return
    }

    // 已打卡 → 取消打卡（任意已选日期）
    if (targetItem.taken) {
      wx.showModal({
        title: '取消打卡',
        content: '确认取消「' + targetItem.name + '」的打卡记录？\n库存将恢复 1 个单位。',
        confirmText: '取消打卡',
        confirmColor: '#e53935',
        cancelText: '保留',
        success: async (res) => {
          if (!res.confirm) return

          try {
            if (targetItem.checkinId) {
              await checkinService.remove(targetItem.checkinId)
            }
            await medicationService.updateStock(targetItem.medicationId, 1)
            wx.showToast({ title: '已取消打卡', icon: 'none' })
            this.loadDayData(selectedDate)
          } catch (err) {
            console.error('[Index] 取消打卡失败:', err)
            this.loadDayData(selectedDate)
          }
        }
      })
      return
    }

    // 未打卡 → 打卡 / 补录
    var now = new Date()
    var actualTime = storage.formatTime(now)
    var isPastDay = selectedDate < todayStr
    var modalTitle = isPastDay ? '补录打卡' : '确认服药'
    var modalContent = isPastDay
      ? '确认为「' + selectedDate + '」补录「' + targetItem.name + '」？\n记录时间：' + actualTime
      : '确认「' + targetItem.name + '」在 ' + actualTime + ' 已服用？'

    wx.showModal({
      title: modalTitle,
      content: modalContent,
      confirmText: '确认',
      cancelText: '取消',
      success: async (res) => {
        if (!res.confirm) return

        try {
          var payload = {
            medicationId: targetItem.medicationId,
            date: selectedDate,
            scheduledTime: targetItem.scheduledTime,
            actualTime: actualTime,
            status: 'taken',
            dosage: targetItem.dosage
          }
          if (isPastDay) {
            payload.note = '补录'
          }

          await checkinService.add(payload)

          await medicationService.updateStock(targetItem.medicationId, -1)
          wx.showToast({ title: isPastDay ? '补录成功' : '打卡成功', icon: 'success' })
          this.loadDayData(selectedDate)

          if (subscribeService.isConfigured() && !subscribeService.hasAuthorized()) {
            setTimeout(function () { subscribeService.promptSubscribe() }, 1500)
          }
        } catch (err) {
          console.error('[Index] 打卡失败:', err)
          this.loadDayData(selectedDate)
        }
      }
    })
  },

  onNotification() {
    wx.navigateTo({ url: '/pages/settings/reminder' })
  },

  onViewAll() {
    wx.switchTab({ url: '/pages/record/record' })
  },

  onPullDownRefresh() {
    this.loadDayData(this.data.selectedDate)
    wx.stopPullDownRefresh()
  }
})

function formatDateStr(d) {
  var y = d.getFullYear()
  var m = String(d.getMonth() + 1).padStart(2, '0')
  var day = String(d.getDate()).padStart(2, '0')
  return y + '-' + m + '-' + day
}

function getISOWeekNumber(date) {
  var d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  var dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
}
