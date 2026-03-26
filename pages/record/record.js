// pages/record/record.js
var medicationService = require('../../utils/medicationService')
var checkinService = require('../../utils/checkinService')
var storage = require('../../utils/storage')

/** 计划日期 + 计划服药时刻（用于漏服/待服等） */
function scheduleTimeLabel(record) {
  var p = record.datePrefix || ''
  var t = record.scheduledTime && record.scheduledTime !== '未设定' ? record.scheduledTime : ''
  if (p && t) return p + ' ' + t
  if (p) return p
  return t
}

/**
 * 将记录数据转换为展示用的卡片字段
 */
function buildRecordDisplay(record, todayStr, selectedDateStr) {
  var isToday = selectedDateStr === todayStr
  var status = record.status
  var actualTime = record.actualTime || ''
  var scheduledTime = record.scheduledTime || ''
  var result = {
    id: record.id,
    name: record.name,
    status: status,
    time: record.time,
    actualTime: actualTime,
    scheduledTime: scheduledTime,
    isToday: isToday,
    borderClass: 'border-grey',
    subIcon: '',
    subColor: '#8e8e93',
    subText: record.dosage || '',
    timeLabel: '',
    badgeText: '',
    timeDetail: '',
    dosage: record.dosage
  }

  if (status === 'taken') {
    result.borderClass = 'border-green'
    var displayClock = actualTime || scheduledTime || ''
    if (
      actualTime &&
      scheduledTime &&
      scheduledTime !== '未设定' &&
      actualTime !== scheduledTime
    ) {
      result.timeDetail = '计划 ' + scheduledTime + ' · 实际打卡 ' + actualTime
    }
    if (isToday) {
      result.subText = record.frequency || record.dosage || ''
      result.badgeText = displayClock ? '已服 ' + displayClock : '已服'
    } else {
      result.subIcon = 'check-circle-filled'
      result.subColor = '#006e28'
      result.subText = record.subNote || '按时服用'
      if (record.datePrefix) {
        result.timeLabel = record.datePrefix + (actualTime ? ' 实际 ' + actualTime : (scheduledTime && scheduledTime !== '未设定' ? ' ' + scheduledTime : ''))
      } else {
        result.timeLabel = actualTime ? '实际 ' + actualTime : (scheduledTime && scheduledTime !== '未设定' ? scheduledTime : '')
      }
    }
  } else if (status === 'missed') {
    result.borderClass = 'border-red'
    result.subText = '漏服记录 · 建议咨询医生'
    result.subColor = '#e53935'
    result.timeLabel = scheduleTimeLabel(record)
  } else {
    result.borderClass = 'border-blue'

    if (record.confirmed) {
      result.subIcon = 'check-circle-filled'
      result.subColor = '#006e28'
      result.subText = '确认已服'
    }
    result.timeLabel = scheduleTimeLabel(record)
  }

  return result
}

Page({
  data: {
    currentYear: 0,
    currentMonth: 0,
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
    calendarDays: [],
    selectedDate: 0,
    showCalendar: true,
    records: []
  },

  onLoad() {
    var now = new Date()
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1,
      selectedDate: now.getDate()
    }, function () {
      this.loadData()
    }.bind(this))
  },

  onShow() {
    this.loadData()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ value: 'record' })
    }
  },

  async loadData() {
    try {
      var activeMeds = await medicationService.getActive()
      await this.generateCalendar(activeMeds)
      await this.loadSelectedDateRecords(activeMeds)
    } catch (err) {
      console.error('[Record] loadData 失败:', err)
    }
  },

  async generateCalendar(activeMeds) {
    try {
      var currentYear = this.data.currentYear
      var currentMonth = this.data.currentMonth
      var selectedDate = this.data.selectedDate
      var daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
      var firstDay = new Date(currentYear, currentMonth - 1, 1).getDay()

      if (!activeMeds) {
        activeMeds = await medicationService.getActive()
      }

      var calendarData = await checkinService.getCalendar(currentYear, currentMonth)
      // /checkins/calendar 设计为 { year, month, days: { 'YYYY-MM-DD': 'taken'|'partial'|'missed'|null } }
      // 同时兼容后端直接返回 map 的情况
      var dayStatusMap = (calendarData && calendarData.days) ? calendarData.days : calendarData

      function needCheckinOn(dateStr) {
        if (!Array.isArray(activeMeds) || activeMeds.length === 0) return false
        return activeMeds.some(function (m) {
          var s = m && m.startDate ? m.startDate : ''
          // YYYY-MM-DD 字符串可直接比较
          return !s || s <= dateStr
        })
      }

      var calendarDays = []
      var prevMonthDays = new Date(currentYear, currentMonth - 1, 0).getDate()

      for (var i = firstDay - 1; i >= 0; i--) {
        calendarDays.push({
          day: prevMonthDays - i,
          currentMonth: false,
          status: null
        })
      }

      for (var d = 1; d <= daysInMonth; d++) {
        var dateStr = currentYear + '-' + String(currentMonth).padStart(2, '0') + '-' + String(d).padStart(2, '0')
        var shouldShowStatus = needCheckinOn(dateStr)
        calendarDays.push({
          day: d,
          currentMonth: true,
          status: shouldShowStatus && (dayStatusMap && dayStatusMap[dateStr]) ? dayStatusMap[dateStr] : null,
          selected: d === selectedDate
        })
      }

      this.setData({ calendarDays: calendarDays })
    } catch (err) {
      console.error('[Record] generateCalendar 失败:', err)
    }
  },

  async loadSelectedDateRecords(activeMeds) {
    try {
      var currentYear = this.data.currentYear
      var currentMonth = this.data.currentMonth
      var selectedDate = this.data.selectedDate
      var dateStr = currentYear + '-' + String(currentMonth).padStart(2, '0') + '-' + String(selectedDate).padStart(2, '0')
      var todayStr = storage.today()

      var dayCheckins = await checkinService.getByDate(dateStr)
      var medications = activeMeds
      if (!medications) {
        medications = await medicationService.getActive()
      }

      var rawRecords = []
      medications.forEach(function (med) {
        var startDate = med && med.startDate ? med.startDate : ''
        if (startDate && dateStr < startDate) {
          return
        }

        var times = Array.isArray(med.times) && med.times.length > 0 ? med.times : ['']
        times.forEach(function (time) {
          var checkin = dayCheckins.find(function (c) {
            return c.medicationId === med.id && c.scheduledTime === time
          })

          var status = 'pending'
          if (checkin) {
            status = checkin.status
          } else if (dateStr < todayStr && time) {
            status = 'missed'
          }

          var datePrefix = ''
          if (dateStr !== todayStr) {
            var selMonth = parseInt(dateStr.split('-')[1], 10)
            var selDay = parseInt(dateStr.split('-')[2], 10)
            datePrefix = selMonth + '月' + selDay + '日'
            if (isYesterday(dateStr, todayStr)) {
              datePrefix = '昨日'
            }
          }

          var actualFromApi = ''
          if (checkin) {
            actualFromApi = checkin.actualTime || checkin.actual_time || ''
          }

          rawRecords.push({
            id: checkin ? checkin.id : med.id + '_' + time + '_pending',
            name: med.name,
            dosage: med.dosage,
            frequency: med.frequency || '',
            time: time || '未设定',
            scheduledTime: time || '',
            actualTime: actualFromApi,
            status: status,
            datePrefix: datePrefix,
            subNote: checkin && checkin.note ? checkin.note : '按时服用',
            confirmed: checkin && checkin.status === 'taken'
          })
        })
      })

      rawRecords.sort(function (a, b) {
        return (a.time || '').localeCompare(b.time || '')
      })

      var records = rawRecords.map(function (r) {
        return buildRecordDisplay(r, todayStr, dateStr)
      })

      this.setData({ records: records })
    } catch (err) {
      console.error('[Record] loadSelectedDateRecords 失败:', err)
    }
  },

  onSelectDate(e) {
    var day = e.currentTarget.dataset.day
    if (!day.currentMonth) return

    this.setData({ selectedDate: day.day }, function () {
      this.generateCalendar()
      this.loadSelectedDateRecords()
    }.bind(this))
  },

  onPrevMonth() {
    var currentYear = this.data.currentYear
    var currentMonth = this.data.currentMonth
    currentMonth--
    if (currentMonth < 1) {
      currentMonth = 12
      currentYear--
    }
    this.setData({ currentYear: currentYear, currentMonth: currentMonth, selectedDate: 1 }, function () {
      this.loadData()
    }.bind(this))
  },

  onNextMonth() {
    var currentYear = this.data.currentYear
    var currentMonth = this.data.currentMonth
    currentMonth++
    if (currentMonth > 12) {
      currentMonth = 1
      currentYear++
    }
    this.setData({ currentYear: currentYear, currentMonth: currentMonth, selectedDate: 1 }, function () {
      this.loadData()
    }.bind(this))
  },

  onToggleCalendar() {
    this.setData({ showCalendar: !this.data.showCalendar })
  },

  onMore() {
    var self = this
    wx.showActionSheet({
      itemList: ['导出记录', '统计分析'],
      success: function (res) {
        if (res.tapIndex === 0) {
          wx.showToast({ title: '导出功能开发中', icon: 'none' })
        } else if (res.tapIndex === 1) {
          wx.showToast({ title: '统计功能开发中', icon: 'none' })
        }
      }
    })
  },

  async onMakeup(e) {
    var id = e.currentTarget.dataset.id
    if (!id) return
    var self = this

    var record = self.data.records.find(function (r) { return r.id === id })
    if (!record) return

    wx.showModal({
      title: '补录打卡',
      content: '确认将「' + record.name + '」标记为已服用？',
      success: async function (res) {
        if (!res.confirm) return

        try {
          if (id.indexOf('_pending') !== -1) {
            var parts = id.replace('_pending', '').split('_')
            var medId = parts.slice(0, parts.length - 1).join('_')
            var time = parts[parts.length - 1] || ''
            var currentYear = self.data.currentYear
            var currentMonth = self.data.currentMonth
            var selectedDate = self.data.selectedDate
            var dateStr = currentYear + '-' + String(currentMonth).padStart(2, '0') + '-' + String(selectedDate).padStart(2, '0')

            await checkinService.add({
              medicationId: medId,
              date: dateStr,
              scheduledTime: time,
              actualTime: storage.formatTime(new Date()),
              status: 'taken',
              dosage: record.dosage || '',
              note: '补录'
            })
          } else {
            await checkinService.update(id, {
              status: 'taken',
              actualTime: storage.formatTime(new Date()),
              note: '补录'
            })
          }

          wx.showToast({ title: '补录成功', icon: 'success' })
          self.loadData()
        } catch (err) {
          console.error('[Record] 补录失败:', err)
        }
      }
    })
  },

  onViewMore() {
    var currentYear = this.data.currentYear
    var currentMonth = this.data.currentMonth
    var selectedDate = this.data.selectedDate
    var dateStr = currentYear + '-' + String(currentMonth).padStart(2, '0') + '-' + String(selectedDate).padStart(2, '0')
    wx.showModal({
      title: dateStr + ' 用药详情',
      content: '当日共 ' + this.data.records.length + ' 条记录',
      showCancel: false
    })
  }
})

function isYesterday(dateStr, todayStr) {
  var d = new Date(todayStr)
  d.setDate(d.getDate() - 1)
  var y = d.getFullYear()
  var m = String(d.getMonth() + 1).padStart(2, '0')
  var day = String(d.getDate()).padStart(2, '0')
  return dateStr === (y + '-' + m + '-' + day)
}
