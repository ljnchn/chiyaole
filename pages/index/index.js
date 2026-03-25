// pages/index/index.js
const medicationService = require('../../utils/medicationService')
const checkinService = require('../../utils/checkinService')
const storage = require('../../utils/storage')

Page({
  data: {
    currentDate: '',
    weekDay: '',
    streakDays: 0,
    progress: 0,
    completedCount: 0,
    totalCount: 0,
    todayMedications: []
  },

  onLoad() {
    this.updateDate()
  },

  onShow() {
    this.updateDate()
    this.loadTodayData()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ value: 'index' })
    }
  },

  /**
   * 加载今日数据：活跃药品 + 时间点 → 今日待办列表 → 比对打卡记录
   */
  loadTodayData() {
    const medications = medicationService.getActive()
    const todayCheckins = checkinService.getTodayCheckins()
    const todayStr = storage.today()

    // 将每个药品的每个时间点展开为独立的待办项
    const todayMedications = []
    medications.forEach(med => {
      const times = med.times || []
      if (times.length === 0) {
        // 没有设定时间的药品，显示一条不带时间的
        const existing = checkinService.findCheckin(med.id, todayStr, '')
        todayMedications.push({
          id: med.id,
          medicationId: med.id,
          name: med.name,
          dosage: med.dosage,
          time: '',
          scheduledTime: '',
          taken: existing ? existing.status === 'taken' : false,
          icon: med.icon,
          color: med.color,
          urgent: false
        })
        return
      }

      times.forEach(time => {
        const existing = checkinService.findCheckin(med.id, todayStr, time)
        const taken = existing ? existing.status === 'taken' : false

        // 判断是否紧急：未服用且当前时间已过计划时间
        let urgent = false
        if (!taken) {
          const now = storage.formatTime(new Date())
          urgent = now > time
        }

        todayMedications.push({
          id: `${med.id}_${time}`,
          medicationId: med.id,
          name: med.name,
          dosage: med.dosage,
          time: time,
          scheduledTime: time,
          taken,
          icon: med.icon,
          color: med.color,
          urgent
        })
      })
    })

    // 按时间排序
    todayMedications.sort((a, b) => (a.time || '99:99').localeCompare(b.time || '99:99'))

    // 计算进度
    const total = todayMedications.length
    const completed = todayMedications.filter(m => m.taken).length
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0
    const streak = checkinService.getStreak()

    this.setData({
      todayMedications,
      totalCount: total,
      completedCount: completed,
      progress,
      streakDays: streak
    })
  },

  updateDate() {
    const now = new Date()
    const month = now.getMonth() + 1
    const date = now.getDate()
    const weekDays = ['日', '一', '二', '三', '四', '五', '六']
    const weekDay = weekDays[now.getDay()]

    this.setData({
      currentDate: `${month}月${date}日`,
      weekDay: `星期${weekDay}`
    })
  },

  /**
   * 打卡：点击药品项
   */
  onCheckIn(e) {
    const { id } = e.currentTarget.dataset
    const item = this.data.todayMedications.find(m => m.id === id)
    if (!item) return

    if (item.taken) {
      wx.showToast({ title: '已经打卡过了', icon: 'none' })
      return
    }

    // 写入打卡记录
    checkinService.add({
      medicationId: item.medicationId,
      date: storage.today(),
      scheduledTime: item.scheduledTime,
      actualTime: storage.formatTime(new Date()),
      status: 'taken',
      dosage: item.dosage
    })

    // 扣减库存
    medicationService.updateStock(item.medicationId, -1)

    wx.showToast({ title: '打卡成功', icon: 'success' })

    // 刷新数据
    this.loadTodayData()
  },

  onAddMedication() {
    wx.navigateTo({ url: '/pages/medication/add' })
  },

  onViewAll() {
    wx.switchTab({ url: '/pages/record/record' })
  },

  onPullDownRefresh() {
    this.loadTodayData()
    wx.stopPullDownRefresh()
  }
})
