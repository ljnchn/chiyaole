// pages/settings/help.js
Page({
  data: {
    faqList: [
      {
        id: 1,
        question: '如何添加新药品？',
        answer: '在底部导航栏点击「药品管理」，然后点击右下角的绿色加号按钮，填写药品信息后保存即可。',
        expanded: false
      },
      {
        id: 2,
        question: '如何打卡记录服药？',
        answer: '在首页「今日提醒」中，点击对应药品卡片即可完成打卡。系统会自动记录服药时间并更新进度。',
        expanded: false
      },
      {
        id: 3,
        question: '漏服了怎么补录？',
        answer: '在「吃药记录」页面，选择漏服的日期，找到漏服的药品记录，点击「补录」按钮即可补充记录。',
        expanded: false
      },
      {
        id: 4,
        question: '如何管理库存？',
        answer: '进入药品详情页，可以看到当前库存数量。点击「补货」按钮输入补充数量，系统会自动更新库存。',
        expanded: false
      },
      {
        id: 5,
        question: '数据存储在哪里？',
        answer: '当前所有数据存储在您的手机本地。清除小程序数据或卸载小程序将丢失所有记录。请注意定期备份重要信息。',
        expanded: false
      },
      {
        id: 6,
        question: '如何修改服药时间？',
        answer: '目前暂不支持直接修改已有药品的服药时间，您可以删除药品后重新添加。后续版本将支持编辑功能。',
        expanded: false
      }
    ]
  },

  onToggleFaq(e) {
    const { id } = e.currentTarget.dataset
    const faqList = this.data.faqList.map(item => ({
      ...item,
      expanded: item.id === id ? !item.expanded : false
    }))
    this.setData({ faqList })
  },

  onContactUs() {
    wx.showModal({
      title: '联系我们',
      content: '如需帮助，请通过小程序「意见反馈」功能提交问题，我们会尽快处理。',
      showCancel: false
    })
  }
})
