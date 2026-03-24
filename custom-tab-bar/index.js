// custom-tab-bar/index.js
Component({
  data: {
    selected: 0,
    color: '#414755',
    selectedColor: '#0058bc',
    backgroundColor: '#ffffff',
    list: [
      {
        pagePath: '/pages/index/index',
        text: '今日提醒',
        icon: 'home',
        selectedIcon: 'home'
      },
      {
        pagePath: '/pages/record/record',
        text: '吃药记录',
        icon: 'calendar',
        selectedIcon: 'calendar'
      },
      {
        pagePath: '/pages/medication/list',
        text: '药品管理',
        icon: 'pill',
        selectedIcon: 'pill'
      },
      {
        pagePath: '/pages/user/user',
        text: '个人中心',
        icon: 'user',
        selectedIcon: 'user'
      }
    ]
  },

  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.path
      wx.switchTab({ url })
      this.setData({
        selected: data.index
      })
    }
  }
})
