// pages/medication/list.js
const medicationService = require('../../utils/medicationService')
const lowStock = require('../../utils/lowStock')

function getAvatarText(name) {
  var t = (name || '').toString().trim()
  return t ? t.charAt(0) : '药'
}

Page({
  data: {
    medications: [],
    filteredList: [],
    stats: { total: 0, lowStock: 0 },
    showSearch: false,
    showFilter: false,
    searchKeyword: '',
    filterType: 'all'
  },

  onLoad() {
    this.loadMedications()
  },

  onShow() {
    this.loadMedications()
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ value: 'medication' })
    }
  },

  async loadMedications() {
    try {
      var medications = await medicationService.getAll()

      var list = medications.map(function (m) {
        var pct = m.total > 0 ? Math.round((m.remaining / m.total) * 100) : 0
        return Object.assign({}, m, {
          avatarText: getAvatarText(m.name),
          lowStock: lowStock.calcLowStock(m),
          stockPercent: pct
        })
      })

      this.setData({
        medications: list,
        stats: {
          total: list.length,
          lowStock: list.filter(function (m) { return m.lowStock }).length
        }
      })

      this.applyFilter()
    } catch (err) {
      console.error('[MedicationList] 加载失败:', err)
      wx.showToast({ title: '加载失败', icon: 'none' })
    }
  },

  applyFilter() {
    var list = this.data.medications
    var keyword = this.data.searchKeyword.trim().toLowerCase()
    var filterType = this.data.filterType

    if (keyword) {
      list = list.filter(function (m) {
        return m.name.toLowerCase().indexOf(keyword) !== -1
      })
    }

    if (filterType === 'lowStock') {
      list = list.filter(function (m) { return m.lowStock })
    } else if (filterType === 'active') {
      list = list.filter(function (m) { return m.status === 'active' })
    } else if (filterType === 'paused') {
      list = list.filter(function (m) { return m.status === 'paused' })
    }

    this.setData({ filteredList: list })
  },

  onSearch() {
    this.setData({ showSearch: !this.data.showSearch })
    if (!this.data.showSearch) {
      this.setData({ searchKeyword: '' })
      this.applyFilter()
    }
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
    this.applyFilter()
  },

  onClearSearch() {
    this.setData({ searchKeyword: '' })
    this.applyFilter()
  },

  onFilter() {
    this.setData({ showFilter: !this.data.showFilter })
  },

  onFilterChange(e) {
    var type = e.currentTarget.dataset.type
    this.setData({ filterType: type })
    this.applyFilter()
  },

  onMedicationTap(e) {
    var id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/medication/detail?id=' + id })
  },

  onAddMedication() {
    wx.navigateTo({ url: '/pages/medication/add' })
  }
})
