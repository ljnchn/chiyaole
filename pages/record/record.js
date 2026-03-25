// pages/record/record.js
const medicationService = require('../../utils/medicationService')
const checkinService = require('../../utils/checkinService')

Page({
  data: {
    currentYear: 0,
    currentMonth: 0,
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
    calendarDays: [],
    selectedDate: 0,
    streakDays: 0,
    compliance: 0,
    records: []
  },

  onLoad() {
    const now = new Date()
    this.setData({
      currentYear: now.getFullYear(),
      currentMonth: now.getMonth() + 1,
      selectedDate: now.getDate()
    }, () => {
      this.loadData()
    })
  },

  onShow() {
    this.loadData()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ value: 'record' })
    }
  },

  /**
   * 加载日历和记录数据
   */
  async loadData() {
    try {
      const activeMeds = await medicationService.getActive()
      await this.generateCalendar(activeMeds)
      await this.loadSelectedDateRecords(activeMeds)

      const stats = await checkinService.getStats()
      this.setData({
        streakDays: (stats && stats.streakDays) ? stats.streakDays : 0,
        compliance: (stats && stats.compliance30d) ? stats.compliance30d : 0
      })
    } catch (err) {
      console.error('[Record] loadData 失败:', err)
    }
  },

  /**
   * 生成日历数据
   */
  async generateCalendar(activeMeds) {
    try {
      const { currentYear, currentMonth, selectedDate } = this.data
      const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
      const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay()

      const calendarData = await checkinService.getCalendar(currentYear, currentMonth)

      const calendarDays = []
      const prevMonthDays = new Date(currentYear, currentMonth - 1, 0).getDate()

      // 上月补位
      for (let i = firstDay - 1; i >= 0; i--) {
        calendarDays.push({
          day: prevMonthDays - i,
          currentMonth: false,
          status: null
        })
      }

      // 本月
      for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = currentYear + '-' + String(currentMonth).padStart(2, '0') + '-' + String(i).padStart(2, '0')
        calendarDays.push({
          day: i,
          currentMonth: true,
          status: (calendarData && calendarData[dateStr]) ? calendarData[dateStr] : null,
          selected: i === selectedDate
        })
      }

      this.setData({ calendarDays: calendarDays })
    } catch (err) {
      console.error('[Record] generateCalendar 失败:', err)
    }
  },

  /**
   * 加载选中日期的打卡记录
   */
  async loadSelectedDateRecords(activeMeds) {
    try {
      const { currentYear, currentMonth, selectedDate } = this.data
      const dateStr = currentYear + '-' + String(currentMonth).padStart(2, '0') + '-' + String(selectedDate).padStart(2, '0')

      const dayCheckins = await checkinService.getByDate(dateStr)
      var medications = activeMeds
      if (!medications) {
        medications = await medicationService.getActive()
      }

      const records = []
      medications.forEach(function (med) {
        const times = med.times || ['']
        times.forEach(function (time) {
          const checkin = dayCheckins.find(function (c) {
            return c.medicationId === med.id && c.scheduledTime === time
          })
          records.push({
            id: checkin ? checkin.id : med.id + '_' + time + '_pending',
            name: med.name,
            dosage: med.dosage,
            time: time || '未设定',
            status: checkin ? checkin.status : 'pending',
            icon: med.icon,
            color: med.color,
            warning: checkin && checkin.status === 'missed' ? '漏服记录 - 建议咨询医生' : ''
          })
        })
      })

      records.sort(function (a, b) {
        return (a.time || '').localeCompare(b.time || '')
      })

      this.setData({ records: records })
    } catch (err) {
      console.error('[Record] loadSelectedDateRecords 失败:', err)
    }
  },

  onSelectDate(e) {
    const { day } = e.currentTarget.dataset
    if (!day.currentMonth) return

    this.setData({ selectedDate: day.day }, () => {
      this.generateCalendar()
      this.loadSelectedDateRecords()
    })
  },

  onPrevMonth() {
    let { currentYear, currentMonth } = this.data
    currentMonth--
    if (currentMonth < 1) {
      currentMonth = 12
      currentYear--
    }
    this.setData({ currentYear, currentMonth, selectedDate: 1 }, () => {
      this.loadData()
    })
  },

  onNextMonth() {
    let { currentYear, currentMonth } = this.data
    currentMonth++
    if (currentMonth > 12) {
      currentMonth = 1
      currentYear++
    }
    this.setData({ currentYear, currentMonth, selectedDate: 1 }, () => {
      this.loadData()
    })
  },

  async onMakeup(e) {
    const { id } = e.currentTarget.dataset
    if (!id) return
    var self = this

    wx.showModal({
      title: '补录打卡',
      content: '确认将此条漏服记录标记为已服用？',
      success: async function (res) {
        if (!res.confirm) return

        var record = self.data.records.find(function (r) { return r.id === id })
        if (!record) return

        try {
          // 如果 id 包含 _pending 后缀，说明是未打卡的记录，需要新增
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
              actualTime: time,
              status: 'taken',
              dosage: record.dosage || '',
              note: '补录'
            })
          } else {
            await checkinService.update(id, {
              status: 'taken',
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
    const { currentYear, currentMonth, selectedDate } = this.data
    const dateStr = currentYear + '-' + String(currentMonth).padStart(2, '0') + '-' + String(selectedDate).padStart(2, '0')
    wx.showModal({
      title: dateStr + ' 用药详情',
      content: '当日共 ' + this.data.records.length + ' 条记录',
      showCancel: false
    })
  }
})
