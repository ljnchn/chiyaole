// pages/record/record.js
Page({
  data: {
    currentYear: 2023,
    currentMonth: 10,
    weekDays: ['日', '一', '二', '三', '四', '五', '六'],
    calendarDays: [],
    selectedDate: 10,
    streakDays: 12,
    compliance: 94,
    records: [
      {
        id: 1,
        name: '阿司匹林',
        dosage: '100mg',
        time: '08:00',
        status: 'taken',
        icon: 'pill',
        color: '#0058bc'
      },
      {
        id: 2,
        name: '维生素 C',
        dosage: '500mg',
        time: '昨日 09:30',
        status: 'taken',
        icon: 'capsule',
        color: '#006e28'
      },
      {
        id: 3,
        name: '降压灵',
        dosage: '1片',
        time: '昨日 20:00',
        status: 'missed',
        icon: 'tablet',
        color: '#e53935',
        warning: '漏服记录 - 建议咨询医生'
      },
      {
        id: 4,
        name: '辅酶 Q10',
        dosage: '100mg',
        time: '10月8日 12:00',
        status: 'taken',
        icon: 'capsule',
        color: '#4c4aca'
      }
    ]
  },

  onLoad() {
    this.generateCalendar()
  },

  onShow() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      })
    }
  },

  generateCalendar() {
    const { currentYear, currentMonth } = this.data
    const daysInMonth = new Date(currentYear, currentMonth, 0).getDate()
    const firstDay = new Date(currentYear, currentMonth - 1, 1).getDay()

    const calendarDays = []
    const prevMonthDays = new Date(currentYear, currentMonth - 1, 0).getDate()

    // Previous month padding
    for (let i = firstDay - 1; i >= 0; i--) {
      calendarDays.push({
        day: prevMonthDays - i,
        currentMonth: false,
        status: null
      })
    }

    // Current month
    const takenDays = [2, 3, 5, 6, 8, 9, 10]
    const missedDays = [4]

    for (let i = 1; i <= daysInMonth; i++) {
      let status = null
      if (takenDays.includes(i)) status = 'taken'
      if (missedDays.includes(i)) status = 'missed'

      calendarDays.push({
        day: i,
        currentMonth: true,
        status,
        selected: i === this.data.selectedDate
      })
    }

    this.setData({ calendarDays })
  },

  onSelectDate(e) {
    const { day } = e.currentTarget.dataset
    if (!day.currentMonth) return

    this.setData({ selectedDate: day.day })
    this.generateCalendar()
  },

  onPrevMonth() {
    let { currentYear, currentMonth } = this.data
    currentMonth--
    if (currentMonth < 1) {
      currentMonth = 12
      currentYear--
    }
    this.setData({ currentYear, currentMonth }, () => {
      this.generateCalendar()
    })
  },

  onNextMonth() {
    let { currentYear, currentMonth } = this.data
    currentMonth++
    if (currentMonth > 12) {
      currentMonth = 1
      currentYear++
    }
    this.setData({ currentYear, currentMonth }, () => {
      this.generateCalendar()
    })
  },

  onMakeup(e) {
    wx.showToast({
      title: '补录功能开发中',
      icon: 'none'
    })
  },

  onViewMore() {
    wx.showToast({
      title: '查看更多',
      icon: 'none'
    })
  }
})