/**
 * 药品数据服务
 * Storage key: 'medications'
 */
const storage = require('./storage')

const KEY = 'medications'

/**
 * 获取所有药品
 * @returns {Array}
 */
function getAll() {
  return storage.getList(KEY)
}

/**
 * 根据 ID 获取药品
 * @param {string} id
 * @returns {Object|null}
 */
function getById(id) {
  const list = getAll()
  return list.find(m => m.id === id) || null
}

/**
 * 按状态筛选药品
 * @param {string} status - 'active' | 'paused' | 'completed'
 * @returns {Array}
 */
function getByStatus(status) {
  return getAll().filter(m => m.status === status)
}

/**
 * 获取服用中的药品（首页、计划相关常用查询）
 * @returns {Array}
 */
function getActive() {
  return getByStatus('active')
}

/**
 * 获取库存告急药品（剩余量 < 20%）
 * @returns {Array}
 */
function getLowStock() {
  return getAll().filter(m => m.status === 'active' && m.total > 0 && m.remaining / m.total < 0.2)
}

/**
 * 添加药品
 * @param {Object} data - 药品数据（不含 id/createdAt/updatedAt）
 * @returns {Object} 完整药品对象
 */
function add(data) {
  const list = getAll()
  const now = Date.now()
  const medication = {
    id: storage.generateId(),
    name: data.name || '',
    dosage: data.dosage || '',
    specification: data.specification || '',
    icon: data.icon || 'pill',
    color: data.color || '#0058bc',
    remark: data.remark || '',
    remaining: data.remaining || 0,
    total: data.total || 0,
    unit: data.unit || '片',
    times: data.times || [],         // 每日服药时间点 ['08:00', '20:00']
    withFood: data.withFood || '',   // 'before' | 'after' | 'empty' | ''
    status: data.status || 'active',
    createdAt: now,
    updatedAt: now
  }
  list.push(medication)
  storage.setList(KEY, list)
  return medication
}

/**
 * 更新药品（部分更新）
 * @param {string} id
 * @param {Object} data - 要更新的字段
 * @returns {Object|null} 更新后的药品对象
 */
function update(id, data) {
  const list = getAll()
  const index = list.findIndex(m => m.id === id)
  if (index === -1) return null

  // 不允许外部修改 id 和 createdAt
  delete data.id
  delete data.createdAt

  list[index] = { ...list[index], ...data, updatedAt: Date.now() }
  storage.setList(KEY, list)
  return list[index]
}

/**
 * 删除药品
 * @param {string} id
 * @returns {boolean}
 */
function remove(id) {
  const list = getAll()
  const filtered = list.filter(m => m.id !== id)
  if (filtered.length === list.length) return false
  storage.setList(KEY, filtered)
  return true
}

/**
 * 更新库存（扣减或增加）
 * @param {string} id
 * @param {number} delta - 负数表示扣减，正数表示补充
 * @returns {Object|null}
 */
function updateStock(id, delta) {
  const medication = getById(id)
  if (!medication) return null

  const newRemaining = Math.max(0, medication.remaining + delta)
  return update(id, { remaining: newRemaining })
}

/**
 * 统计信息
 * @returns {{ total: number, active: number, lowStock: number }}
 */
function getStats() {
  const all = getAll()
  const active = all.filter(m => m.status === 'active')
  const lowStock = active.filter(m => m.total > 0 && m.remaining / m.total < 0.2)
  return {
    total: all.length,
    active: active.length,
    lowStock: lowStock.length
  }
}

/**
 * 初始化种子数据（首次启动调用）
 */
function initSeedData() {
  if (storage.hasData(KEY)) return

  const seeds = [
    {
      name: '阿莫西林胶囊',
      dosage: '1粒',
      specification: '0.25g x 24粒',
      icon: 'capsule',
      color: '#0058bc',
      remaining: 2,
      total: 24,
      unit: '粒',
      times: ['08:00', '20:00'],
      withFood: 'after',
      status: 'active'
    },
    {
      name: '维生素 C 片',
      dosage: '1片',
      specification: '100mg x 100片',
      icon: 'pill',
      color: '#006e28',
      remaining: 68,
      total: 100,
      unit: '片',
      times: ['12:30'],
      withFood: '',
      status: 'active'
    },
    {
      name: '布洛芬缓释胶囊',
      dosage: '1粒',
      specification: '0.3g x 10粒',
      icon: 'capsule',
      color: '#e53935',
      remaining: 1,
      total: 10,
      unit: '粒',
      times: ['20:00'],
      withFood: 'after',
      status: 'active'
    },
    {
      name: '辅酶 Q10',
      dosage: '1粒',
      specification: '100mg x 60粒',
      icon: 'capsule',
      color: '#4c4aca',
      remaining: 45,
      total: 60,
      unit: '粒',
      times: ['21:00'],
      withFood: '',
      status: 'active'
    }
  ]

  seeds.forEach(s => add(s))
}

module.exports = {
  getAll,
  getById,
  getByStatus,
  getActive,
  getLowStock,
  getStats,
  add,
  update,
  remove,
  updateStock,
  initSeedData
}
