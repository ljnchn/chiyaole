/**
 * 打卡记录数据服务
 * Storage key: 'checkins'
 */
const storage = require('./storage')

const KEY = 'checkins'

/**
 * 获取所有打卡记录
 * @returns {Array}
 */
function getAll() {
  return storage.getList(KEY)
}

/**
 * 根据 ID 获取打卡记录
 * @param {string} id
 * @returns {Object|null}
 */
function getById(id) {
  return getAll().find(c => c.id === id) || null
}

/**
 * 获取指定日期的打卡记录
 * @param {string} date - "2026-03-25"
 * @returns {Array}
 */
function getByDate(date) {
  return getAll().filter(c => c.date === date)
}

/**
 * 获取今日打卡记录
 * @returns {Array}
 */
function getTodayCheckins() {
  return getByDate(storage.today())
}

/**
 * 获取指定药品的打卡记录
 * @param {string} medicationId
 * @returns {Array}
 */
function getByMedication(medicationId) {
  return getAll().filter(c => c.medicationId === medicationId)
}

/**
 * 获取日期范围内的打卡记录
 * @param {string} startDate - "2026-03-01"
 * @param {string} endDate - "2026-03-31"
 * @returns {Array}
 */
function getByDateRange(startDate, endDate) {
  return getAll().filter(c => c.date >= startDate && c.date <= endDate)
}

/**
 * 添加打卡记录
 * @param {Object} data
 * @returns {Object}
 */
function add(data) {
  const list = getAll()
  const checkin = {
    id: storage.generateId(),
    medicationId: data.medicationId || '',
    date: data.date || storage.today(),
    scheduledTime: data.scheduledTime || '',
    actualTime: data.actualTime || storage.formatTime(new Date()),
    status: data.status || 'taken',
    dosage: data.dosage || '',
    note: data.note || '',
    createdAt: Date.now()
  }
  list.push(checkin)
  storage.setList(KEY, list)
  return checkin
}

/**
 * 更新打卡记录（用于补录等场景）
 * @param {string} id
 * @param {Object} data
 * @returns {Object|null}
 */
function update(id, data) {
  const list = getAll()
  const index = list.findIndex(c => c.id === id)
  if (index === -1) return null

  delete data.id
  delete data.createdAt

  list[index] = { ...list[index], ...data }
  storage.setList(KEY, list)
  return list[index]
}

/**
 * 删除打卡记录
 * @param {string} id
 * @returns {boolean}
 */
function remove(id) {
  const list = getAll()
  const filtered = list.filter(c => c.id !== id)
  if (filtered.length === list.length) return false
  storage.setList(KEY, filtered)
  return true
}

/**
 * 检查某药品在某日某时间点是否已打卡
 * @param {string} medicationId
 * @param {string} date - "2026-03-25"
 * @param {string} scheduledTime - "08:00"
 * @returns {Object|null} 已有的打卡记录或 null
 */
function findCheckin(medicationId, date, scheduledTime) {
  return getAll().find(
    c => c.medicationId === medicationId && c.date === date && c.scheduledTime === scheduledTime
  ) || null
}

/**
 * 计算连续打卡天数（从今日往前推）
 * 逻辑：某日若有至少一条 taken 记录，算作当日已打卡
 * @returns {number}
 */
function getStreak() {
  const all = getAll().filter(c => c.status === 'taken')
  if (all.length === 0) return 0

  // 收集所有有打卡的日期（去重）
  const dateSet = new Set(all.map(c => c.date))
  const dates = Array.from(dateSet).sort().reverse()

  if (dates.length === 0) return 0

  // 从今日开始往前数连续天数
  const todayStr = storage.today()
  let streak = 0
  let checkDate = new Date(todayStr + 'T00:00:00')

  // 如果今天还没打卡，从昨天开始算
  if (!dateSet.has(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1)
  }

  while (true) {
    const y = checkDate.getFullYear()
    const m = String(checkDate.getMonth() + 1).padStart(2, '0')
    const d = String(checkDate.getDate()).padStart(2, '0')
    const dateStr = `${y}-${m}-${d}`

    if (dateSet.has(dateStr)) {
      streak++
      checkDate.setDate(checkDate.getDate() - 1)
    } else {
      break
    }
  }

  return streak
}

/**
 * 计算某月的每日打卡状态（用于日历视图）
 * @param {number} year
 * @param {number} month - 1-12
 * @param {Array} activeMedications - 当前活跃药品列表（用于判断是否漏服）
 * @returns {Object} { "2026-03-25": "taken" | "partial" | "missed" | null }
 */
function getMonthlyStatus(year, month, activeMedications) {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const daysInMonth = new Date(year, month, 0).getDate()
  const endDate = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`

  const checkins = getByDateRange(startDate, endDate)
  const todayStr = storage.today()
  const result = {}

  // 计算每个药品每天应该打卡的总次数
  const dailyExpected = activeMedications.reduce((sum, m) => sum + (m.times ? m.times.length : 0), 0)

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`

    // 未来日期不标记
    if (dateStr > todayStr) {
      result[dateStr] = null
      continue
    }

    const dayCheckins = checkins.filter(c => c.date === dateStr)
    const takenCount = dayCheckins.filter(c => c.status === 'taken').length

    if (dailyExpected === 0) {
      result[dateStr] = null
    } else if (takenCount >= dailyExpected) {
      result[dateStr] = 'taken'
    } else if (takenCount > 0) {
      result[dateStr] = 'partial'
    } else {
      result[dateStr] = 'missed'
    }
  }

  return result
}

/**
 * 计算依从率（最近 N 天）
 * @param {number} days - 天数，默认 30
 * @param {Array} activeMedications - 活跃药品列表
 * @returns {number} 0-100 的百分比
 */
function getComplianceRate(days, activeMedications) {
  if (!activeMedications || activeMedications.length === 0) return 100

  const todayDate = new Date(storage.today() + 'T00:00:00')
  const startDate = new Date(todayDate)
  startDate.setDate(startDate.getDate() - days + 1)

  const startStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`
  const endStr = storage.today()

  const checkins = getByDateRange(startStr, endStr)
  const takenCount = checkins.filter(c => c.status === 'taken').length

  // 每日预期打卡次数
  const dailyExpected = activeMedications.reduce((sum, m) => sum + (m.times ? m.times.length : 0), 0)
  const totalExpected = dailyExpected * days

  if (totalExpected === 0) return 100
  return Math.min(100, Math.round((takenCount / totalExpected) * 100))
}

/**
 * 初始化种子数据
 * @param {Array} medications - 药品列表（需要 id 和 times 字段）
 */
function initSeedData(medications) {
  if (storage.hasData(KEY)) return

  const todayStr = storage.today()
  const todayDate = new Date(todayStr + 'T00:00:00')

  // 生成过去 7 天的打卡记录（模拟历史数据）
  for (let dayOffset = 6; dayOffset >= 0; dayOffset--) {
    const date = new Date(todayDate)
    date.setDate(date.getDate() - dayOffset)
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

    medications.forEach(med => {
      if (!med.times) return
      med.times.forEach(time => {
        // 随机漏服：约 10% 概率漏服（今天的不自动生成，让用户自己打卡）
        if (dayOffset === 0) return
        const isMissed = Math.random() < 0.1

        add({
          medicationId: med.id,
          date: dateStr,
          scheduledTime: time,
          actualTime: isMissed ? '' : time,
          status: isMissed ? 'missed' : 'taken',
          dosage: med.dosage
        })
      })
    })
  }
}

module.exports = {
  getAll,
  getById,
  getByDate,
  getTodayCheckins,
  getByMedication,
  getByDateRange,
  findCheckin,
  add,
  update,
  remove,
  getStreak,
  getMonthlyStatus,
  getComplianceRate,
  initSeedData
}
