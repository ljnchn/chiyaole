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
  loadData() {
    const activeMeds = medicationService.getActive()
    this.generateCalendar(activeMeds)
    this.loadSelectedDateRecords(activeMeds)

    const streak = checkinService.getStreak()
    const compliance = checkinService.getComplianceRate(30, activeMeds)

    this.setData({ streakDays: streak, compliance })
  },

  /**
   * 生成日历数据
   */
  generateCalendar(activeMeds) {
    const { currentYear, currentMonth, selectedDate } = this.data
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay()

    // 获取本月打卡状态
    const monthlyStatus = checkinService.getMonthlyStatus(currentYear, currentMonth, activeMeds || medicationService.getActive())

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
      const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      calendarDays.push({
        day: i,
        currentMonth: true,
        status: monthlyStatus[dateStr] || null,
        selected: i === selectedDate
      })
    }

    this.setData({ calendarDays })
  },

  /**
   * 加载选中日期的打卡记录
   */
  loadSelectedDateRecords(activeMeds) {
    const { currentYear, currentMonth, selectedDate } = this.data
    const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(selectedDate).padStart(2, '0')}`

    const dayCheckins = checkinService.getByDate(dateStr)
    const medications = activeMeds || medicationService.getActive()

    // 组合药品信息和打卡记录
    const records = []
    medications.forEach(med => {
      const times = med.times || ['']
      times.forEach(time => {
        const checkin = dayCheckins.find(
          c => c.medicationId === med.id && c.scheduledTime === time
        )
        records.push({
          id: checkin ? checkin.id : `${med.id}_${time}_pending`,
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

    // 按时间排序
    records.sort((a, b) => (a.time || '').localeCompare(b.time || ''))

    this.setData({ records })
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

  onMakeup(e) {
    wx.showToast({ title: '补录功能开发中', icon: 'none' })
  },

  onViewMore() {
    wx.showToast({ title: '查看更多', icon: 'none' })
  }
})
