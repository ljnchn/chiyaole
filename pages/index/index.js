// pages/index/index.js
const medicationService = require('../../utils/medicationService')
const checkinService = require('../../utils/checkinService')
const storage = require('../../utils/storage')
const subscribeService = require('../../utils/subscribeService')

const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六']
const WEEKDAY_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
const FOOD_LABELS = { before: '饭前服用', after: '饭后服用', empty: '空腹服用' }

/**
 * 获取时间段标签和图标
 */
function getTimePeriod(time) {
  if (!time) return { label: '未设定时间', icon: 'time', period: 'other' }
  const h = parseInt(time.split(':')[0], 10)
  if (h < 12) return { label: `早晨 ${time}`, icon: 'sunny', period: 'morning' }
  if (h < 18) return { label: `中午 ${time}`, icon: 'app', period: 'noon' }
  return { label: `晚上 ${time}`, icon: 'moon', period: 'evening' }
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
    timeGroups: [],
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

  /**
   * 初始化周日历：生成当前周的 7 天数据
   */
  initWeekCalendar() {
    const today = new Date()
    const todayStr = storage.today()
    const dayOfWeek = today.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek

    const monday = new Date(today)
    monday.setDate(today.getDate() + mondayOffset)

    const weekDays = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      const dateStr = formatDateStr(d)
      weekDays.push({
        shortName: WEEKDAY_SHORT[(d.getDay() + 7) % 7],
        day: d.getDate(),
        date: dateStr,
        isToday: dateStr === todayStr,
        selected: dateStr === todayStr
      })
    }

    const weekNum = getISOWeekNumber(today)

    this.setData({
      yearMonth: `${today.getFullYear()}年${today.getMonth() + 1}月`,
      weekNumber: weekNum,
      weekDays,
      selectedDate: todayStr
    })

    this.loadDayData(todayStr)
  },

  /**
   * 点击周日历中的某一天
   */
  onSelectDay(e) {
    const { date } = e.currentTarget.dataset
    const weekDays = this.data.weekDays.map(d => ({
      ...d,
      selected: d.date === date
    }))
    this.setData({ weekDays, selectedDate: date })
    this.loadDayData(date)
  },

  /**
   * 加载指定日期的用药数据，按时间段分组
   */
  loadDayData(dateStr) {
    const medications = medicationService.getActive()

    const items = []
    medications.forEach(med => {
      const times = med.times || []
      const usagePercent = med.total > 0 ? Math.round((med.remaining / med.total) * 100) : 0
      const foodLabel = FOOD_LABELS[med.withFood] || ''
      const dosageDesc = `${med.dosage}${foodLabel ? ' · ' + foodLabel : ''}`

      if (times.length === 0) {
        const existing = checkinService.findCheckin(med.id, dateStr, '')
        items.push({
          id: med.id,
          medicationId: med.id,
          name: med.name,
          dosage: med.dosage,
          dosageDesc,
          specification: med.specification,
          time: '',
          scheduledTime: '',
          taken: existing ? existing.status === 'taken' : false,
          icon: med.icon,
          color: med.color,
          remaining: med.remaining,
          total: med.total,
          unit: med.unit,
          usagePercent,
          urgent: false,
          period: 'other'
        })
        return
      }

      times.forEach(time => {
        const existing = checkinService.findCheckin(med.id, dateStr, time)
        const taken = existing ? existing.status === 'taken' : false
        let urgent = false
        if (!taken && dateStr === storage.today()) {
          urgent = storage.formatTime(new Date()) > time
        }
        const tp = getTimePeriod(time)

        items.push({
          id: `${med.id}_${time}`,
          medicationId: med.id,
          name: med.name,
          dosage: med.dosage,
          dosageDesc,
          specification: med.specification,
          time,
          scheduledTime: time,
          taken,
          icon: med.icon,
          color: med.color,
          remaining: med.remaining,
          total: med.total,
          unit: med.unit,
          usagePercent,
          urgent,
          period: tp.period
        })
      })
    })

    items.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'))

    const groupMap = {}
    const groupOrder = []
    items.forEach(item => {
      const tp = getTimePeriod(item.time)
      const key = item.time || 'no-time'
      if (!groupMap[key]) {
        groupMap[key] = { time: item.time, label: tp.label, icon: tp.icon, period: tp.period, items: [] }
        groupOrder.push(key)
      }
      groupMap[key].items.push(item)
    })
    const timeGroups = groupOrder.map(k => groupMap[k])

    const total = items.length
    const completed = items.filter(m => m.taken).length
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0
    const streak = checkinService.getStreak()

    this.setData({
      timeGroups,
      totalCount: total,
      completedCount: completed,
      progress,
      streakDays: streak
    })
  },

  /**
   * 打卡
   */
  onCheckIn(e) {
    const { id } = e.currentTarget.dataset
    let targetItem = null
    this.data.timeGroups.forEach(g => {
      const found = g.items.find(m => m.id === id)
      if (found) targetItem = found
    })
    if (!targetItem) return

    if (targetItem.taken) {
      wx.showToast({ title: '已经打卡过了', icon: 'none' })
      return
    }

    if (this.data.selectedDate !== storage.today()) {
      wx.showToast({ title: '只能对今天打卡', icon: 'none' })
      return
    }

    checkinService.add({
      medicationId: targetItem.medicationId,
      date: storage.today(),
      scheduledTime: targetItem.scheduledTime,
      actualTime: storage.formatTime(new Date()),
      status: 'taken',
      dosage: targetItem.dosage
    })

    medicationService.updateStock(targetItem.medicationId, -1)
    wx.showToast({ title: '打卡成功', icon: 'success' })
    this.loadDayData(this.data.selectedDate)

    if (subscribeService.isConfigured() && !subscribeService.hasAuthorized()) {
      setTimeout(() => { subscribeService.promptSubscribe() }, 1500)
    }
  },

  onAddMedication() {
    wx.navigateTo({ url: '/pages/medication/add' })
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
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function getISOWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7)
}
