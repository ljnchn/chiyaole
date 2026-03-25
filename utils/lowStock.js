// 历史兼容：当后端未返回 lowStockThreshold 时，按 remaining/total < 0.2 回退
const DEFAULT_THRESHOLD_RATIO = 0.2

function isFiniteNumber(v) {
  if (v === null || v === undefined || v === '') return false
  return typeof v === 'number' ? Number.isFinite(v) : Number.isFinite(Number(v))
}

/**
 * 判断单个药品是否需要标记“库存告急”
 * 规则：
 * - 若 status 存在且不是 active，则不标记（与后端 stats 口径保持一致）
 * - 若 lowStockEnabled === false，则不标记
 * - 若提供 lowStockThreshold（数量），则 remaining <= threshold
 * - 否则回退到 remaining/total < 全局阈值比例（兼容历史数据）
 */
function calcLowStock(med) {
  if (!med) return false

  if (med.status && med.status !== 'active') return false

  if (med.lowStockEnabled === false || med.lowStockEnabled === 0 || med.lowStockEnabled === '0') return false

  const remaining = med.remaining
  const total = med.total

  if (isFiniteNumber(med.lowStockThreshold)) {
    const threshold = Number(med.lowStockThreshold)
    return isFiniteNumber(remaining) && Number(remaining) <= threshold
  }

  // 回退：按比例计算（历史数据）
  if (!isFiniteNumber(total) || Number(total) <= 0) return false
  if (!isFiniteNumber(remaining)) return false

  const ratio = DEFAULT_THRESHOLD_RATIO
  const r = Number(remaining) / Number(total)
  return r < ratio
}

/**
 * 计算“默认预警数量”（用于新增/编辑时的初始化）
 * 默认：按全局比例阈值 = floor(total * ratio)
 */
function calcDefaultLowStockThreshold(total) {
  if (!isFiniteNumber(total)) return 0
  const t = Number(total)
  if (t <= 0) return 0
  const ratio = DEFAULT_THRESHOLD_RATIO
  const v = Math.floor(t * ratio)
  return v >= 0 ? v : 0
}

module.exports = {
  calcLowStock,
  calcDefaultLowStockThreshold
}

