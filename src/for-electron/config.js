/* eslint-disable */
/**
 * 配置项说明
 * title             - 页面标题
 * traysay           - 鼠标悬浮在托盘图标上显示的文字
 * use_devtools      - 主页面是否默认打开控制台
 * login_page_width  - 登录窗口宽度
 * login_page_height - 登录窗口高度
 * main_page_width   - 主窗口宽度
 * main_page_height  - 主窗口高度
 */

var config = {
  title: 'SmartLinkey',
  traysay: '海邻科消息助手',
  current_version: '2.2.0.1',
  use_devtools: true,
  auto_launch: true,
  dev_auto_reload: false,
  huaci_threshold: 160,
  huaci: true,

  login_page_width: 320,
  login_page_height: 470,
  main_page_width: 960,
  main_page_height: 640,

  update_url: 'http://172.19.12.206:8000/info.json',
  quci_list: [{ cid: 101, showtext: '复制' }, { cid: 102, showtext: '核查背景信息' }],
};

module.exports = config;
