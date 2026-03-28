/**
 * 用药间隔与「用药日」判断（与 server/src/utils/doseSchedule.ts 一致）
 */

var VALID_INTERVALS = [0, 1, 2, 3, 7]

var INTERVAL_LABELS = {
  0: '必要时',
  1: '每日',
  2: '隔日一次',
  3: '每3日一次',
  7: '每周一次'
}

function legacyFrequencyToInterval(frequency) {
  if (frequency === '隔日1次') return 2
  if (frequency === '每周1次') return 7
  if (frequency === '必要时') return 0
  return 1
}

function getDoseIntervalDays(med) {
  if (!med) return 1
  var n = med.doseIntervalDays
  if (n !== undefined && n !== null && n !== '') {
    var num = typeof n === 'number' ? n : parseInt(n, 10)
    if (VALID_INTERVALS.indexOf(num) !== -1) return num
  }
  return legacyFrequencyToInterval(med.frequency || '')
}

function isMedicationDueOnDate(startDate, dateStr, intervalDays) {
  if (!startDate || dateStr < startDate) return false
  if (intervalDays === 0) return true
  var d0 = new Date(startDate + 'T12:00:00')
  var d1 = new Date(dateStr + 'T12:00:00')
  var diffDays = Math.round((d1 - d0) / (24 * 60 * 60 * 1000))
  if (diffDays < 0) return false
  var interval = intervalDays <= 0 ? 1 : intervalDays
  return diffDays % interval === 0
}

function getIntervalLabel(days) {
  var d = typeof days === 'number' ? days : parseInt(days, 10)
  return INTERVAL_LABELS[d] || '每日'
}

module.exports = {
  getDoseIntervalDays,
  isMedicationDueOnDate,
  legacyFrequencyToInterval,
  getIntervalLabel,
  INTERVAL_LABELS: INTERVAL_LABELS
}
