// custom-tab-bar/index.js
Component({
  data: {
    value: 'index',
    list: [
      { value: 'index', label: '今日提醒', icon: 'home', path: '/pages/index/index' },
      { value: 'record', label: '吃药记录', icon: 'calendar', path: '/pages/record/record' },
      { value: 'medication', label: '药品管理', icon: 'pill', path: '/pages/medication/list' },
      { value: 'user', label: '个人中心', icon: 'user', path: '/pages/user/user' }
    ]
  },

  methods: {
    onChange(e) {
      const value = e.detail.value
      const item = this.data.list.find(i => i.value === value)
      if (item) {
        wx.switchTab({ url: item.path })
      }
      this.setData({ value })
    }
  }
})
