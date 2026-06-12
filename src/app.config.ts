export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/publish/index',
    'pages/borrow/index',
    'pages/mine/index',
    'pages/detail/index',
    'pages/search/index',
    'pages/report/index',
    'pages/contacts/index',
    'pages/chat/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '邻里借还',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#86909C',
    selectedColor: '#52C41A',
    backgroundColor: '#ffffff',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/publish/index',
        text: '发布'
      },
      {
        pagePath: 'pages/borrow/index',
        text: '借还'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
