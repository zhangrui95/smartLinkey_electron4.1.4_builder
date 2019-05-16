/* eslint-disable */
const electron = require('electron');
const app = electron.app;
app.commandLine.appendSwitch('disable-pinch');
const BrowserWindow = electron.BrowserWindow;
const { ipcMain, shell } = require('electron');
const Menu = electron.Menu;
const Tray = electron.Tray;
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const request = require('request');
const md5File = require('md5-file');
const electronLocalshortcut = require('electron-localshortcut');
const setupPug = require('electron-pug');
// const mouse = require('win-mouse')(); "win-mouse": "^1.2.0",
const bunyan = require('bunyan');
const execa = require('execa');
const arch = require('arch');
const path = require('path');
const url = require('url');
const fs = require('fs');


// 控制程序单例
const gotTheLock = app.requestSingleInstanceLock()

if (!gotTheLock) {
  console.log("[INFO] App instance already running")
  app.quit()
}

// 如果用户尝试启动第二个应用实例，则显示已存在应用窗体
app.on('second-instance', (event, argv, cwd) => {
  if (mainWindow) {
   if (mainWindow.isMinimized()) {
     mainWindow.restore();
     mainWindow.focus();
   } else {
     mainWindow.show();
   }
 }
})

// 程序执行的文件夹, 开发模式, execDir 为 main.js 所在路径，打包后为 product.exe 所在路径
const execDir = fs.existsSync('node_modules') ? __dirname : path.join(__dirname, '../..');
const execDir_poxis = execDir.replace(/\\/g, '/');
console.log(execDir_poxis);
// fs.writeFileSync('D:\\execDir.txt', execDir);

// 用于决定是从src(开发)还是dist(打包后)寻找crates代码资源
const crates = execDir_poxis + '/.electron-crates.txt';
if (!fs.existsSync(crates)) {
  fs.writeFileSync(crates, 'dist');
}

// 用于从文件获取路径字符串"src"或者"dist"
// 备注: `yarn build` 命令会执行 prepare-electron-dep.bat 脚本, 自动修改其值为"dist"
let crates_top_dir = fs.readFileSync(execDir_poxis + '/.electron-crates.txt', 'utf-8');
let fetd = crates_top_dir.replace(/[\r\n]/g, '').replace(/(\s*$)/g, '');
console.log('electron use crates path: <' + fetd + '>');

// const { log } = require(`./${fetd}/for-electron/crates/logging`);
const { startIconProcess } = require(`./${fetd}/for-electron/crates/geticon`);
const { download_package } = require(`./${fetd}/for-electron/crates/down`);
const { uplaunch } = require(`./${fetd}/for-electron/crates/uplaunch`);
const { get_ie_proxy } = require(`./${fetd}/for-electron/crates/ieproxy`);
const { upversion } = require(`./${fetd}/for-electron/crates/upversion`);
const { setting_huaci_callback } = require(`./${fetd}/for-electron/crates/huaci_handler`);
const { start_huaci, stop_huaci } = require(`./${fetd}/for-electron/crates/huaci_handler`);
const config = require(`./${fetd}/for-electron/config.js`);
require(`./${fetd}/for-electron/crates/httpserver.js`);

if (config.auto_launch) {
  var auto_launch = require(`./${fetd}/for-electron/crates/launch`).auto_launch;
}
const icon_path = path.join(__dirname, `./${fetd}/for-electron/source/logo.ico`);
const icon_gray = path.join(__dirname, `./${fetd}/for-electron/source/gray.ico`);
const icon_warn = path.join(__dirname, `./${fetd}/for-electron/source/warning.ico`);
const icon_none_path = path.join(__dirname, `./${fetd}/for-electron/source/none.ico`);
const upgrade_tmp_dir = path.join(execDir, 'downloads');
const upgrade_tmp_file = path.join(upgrade_tmp_dir, 'package.zip');
const huaci_threshold = config.huaci_threshold;

// 获取代理信息
//const ie_proxy = get_ie_proxy()
// console.log("ie_proxy: " + JSON.stringify(ie_proxy));

// 初始化日志功能
const logs_dir = path.join(execDir, 'logs');
if (!fs.existsSync(logs_dir)) fs.mkdirSync(logs_dir);
const log = bunyan.createLogger({
  name: 'main',
  streams: [
    { path: path.join(execDir, 'logs', 'main.log') },
    { level: 'info', stream: process.stdout },
  ],
});

// 开发模式下, 监听 dist 目录下文件, 发生变化自动刷新 electron
if (config.dev_auto_reload) {
  require('electron-reload')(path.join(__dirname, 'dist'));
}

let mainWindow; // 主页面
let huaci_win; // 划词搜索页
let sou_win; // 划词搜页面
let huaci_x; // 划词抬起鼠标后坐标X值
let huaci_y; // 划词抬起鼠标后坐标Y值
let already_login = false; // 登录前/后状态
let socketio_online = false;
let appTray = null; // 托盘
let willQuitApp = false; // 点击关闭时是否真的退出应用
let huaci_running = false; // 划词当前是否在运行
// let huaci_config = null;
let huaci_config = { status: false, huaci_list: [{ showtext: '复制', cid: 101 }] }; // 默认有复制功能

let desktop_width; // 桌面宽
let desktop_height; // 桌面高
let noticeWindowBox; // 消息通知盒子窗口

// 初始化发送获取工具图标的程序
const iconProcess = startIconProcess(execDir_poxis);

// 设置开机自启动
if (config.auto_launch) {
  auto_launch(execDir_poxis);
}

// 定义数据库位置
const db_json = app.getPath('userData');
console.log(db_json)
const adapter = new FileSync(path.join(db_json, 'db.json'));
const db = low(adapter);

// 取词功能区列表
// const quci_list = config.quci_list;

/**
 * 创建托盘图标及功能
 */
function createTray() {
  appTray = new Tray(icon_gray);
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '退出',
      click: function trayClick() {
        willQuitApp = true;
        iconProcess.kill('SIGINT');
        stop_huaci();
        huaci_running = false;
        appTray.destroy();
        mainWindow.close();
        setTimeout(() => {
          app.quit();
        }, 800);
      },
    },
  ]);
  appTray.setToolTip(config.traysay + '(未登录)');
  appTray.setContextMenu(contextMenu);

  appTray.on('click', () => {
    stop_flashing();
    if (!mainWindow.isVisible()) {
      mainWindow.show();
    } else {
      // mainWindow.hide();
      mainWindow.show();
    }
    // mainWindow.alwaysOnTop()
    // mainWindow.isVisible() ? mainWindow.hide() :
  });
}

/**
 * 创建主页面
 */
function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: config.login_page_width,
    height: config.login_page_height,
    autoHideMenuBar: true,
    frame: false,
    show: false,
    resizable: true,
    hasShadow: true,
    icon: icon_path,
    transparent: true,
  });

  // 
  let ie_proxy = get_ie_proxy()
  console.log("ie_proxy: " + JSON.stringify(ie_proxy));

  let proxy_data = db.get('proxy').value();
  if (proxy_data === undefined) {
    let proxy_info = {
      enable: ie_proxy.ProxyEnable ? true : false,
      user_setting: ie_proxy.ProxyServer,
      ie_proxy: {
        ProxyEnable: ie_proxy.ProxyEnable === 0 ? false: true,
        ProxyServer: ie_proxy.ProxyServer
      }
    };
    proxy_data = proxy_info;
    db.set('proxy', proxy_info).write();
  } else {
    let proxy_info = {
      ...proxy_data,
      ie_proxy: {
        ProxyEnable: ie_proxy.ProxyEnable === 0 ? false: true,
        ProxyServer: ie_proxy.ProxyServer
      }
    };
    proxy_data = proxy_info;
    db.set('proxy', proxy_info).write();
  }

  // and load the index.html of the app.
  if ( proxy_data.enable ) {
    console.log("page use ie-proxy: " + proxy_data.user_setting)
    mainWindow.webContents.session.setProxy({ proxyRules: proxy_data.user_setting }, function () {
      mainWindow.loadURL(
        url.format({
          pathname: path.join(__dirname, 'dist/index.html'),
          protocol: 'file:',
          slashes: true,
        })
      );
    });
  } else {
    console.log("page without proxy")
    mainWindow.loadURL(
      url.format({
        pathname: path.join(__dirname, 'dist/index.html'),
        protocol: 'file:',
        slashes: true,
      })
    );
  }

  if (config.use_devtools) {
    // F12 打开控制台
    electronLocalshortcut.register(mainWindow, 'F12', () => {
      mainWindow.webContents.openDevTools({ mode: 'undocked' });
    });
  }

  // 禁止触摸屏缩放(未测试)
  // let webContents = mainWindow.webContents;
  // webContents.on('did-finish-load', () => {
  //   webContents.setZoomFactor(1);
  //   webContents.setVisualZoomLevelLimits(1, 1);
  //   webContents.setLayoutZoomLevelLimits(0, 0);
  // });

  mainWindow.on('maximize', () => {
    // console.log("event: maximize");
    mainWindow.webContents.send('windows-now', { code: 1, desc: 'become max size' });
  });

  mainWindow.on('unmaximize', () => {
    // console.log("event: unmaximize");
    mainWindow.webContents.send('windows-now', { code: 0, desc: 'become normal size' });
  });

  mainWindow.on('resize', () => {});

  mainWindow.on('move', () => {});

  mainWindow.once('focus', () => mainWindow.flashFrame(false));

  mainWindow.on('ready-to-show', () => {
    mainWindow.webContents.send('proxy-info', proxy_data);
    mainWindow.show();
  });

  mainWindow.on('close', e => {
    if (willQuitApp) {
      mainWindow = null;
    } else {
      console.log('will hide');
      e.preventDefault();
      mainWindow.hide();
    }
  });

  // mainWindow.webContents.on('did-finish-load', mainPageReady);

}

/**
 * 创建"搜"页面
 */
function createSouWindow(x, y) {
  // Create the browser window.
  sou_win = new BrowserWindow({
    width: 60,
    height: 60,
    autoHideMenuBar: true,
    useContentSize: true,
    frame: false,
    show: false,
    resizable: false,
    transparent: true,
    hasShadow: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    x: x,
    y: y,
  });

  sou_win.loadURL(`file://${__dirname}/${fetd}/for-electron/templates/sou.html`);

  sou_win.on('ready-to-show', () => {
    // 显示页面(不获取焦点)
    sou_win.showInactive();
  });

  sou_win.on('close', e => {
    sou_win = null;
  });
}

/**
 * 创建划词搜索页面
 */
async function createHuaci() {
  // quci_list = [{ cid: 101, showtext: '复制' }, { cid: 102, showtext: '核查背景信息' }]

  huaci_states = {
    data: huaci_config.huaci_list,
  };
  console.log('================>');
  console.log(huaci_config);

  console.log(huaci_states);
  try {
    let pug = await setupPug({ pretty: true }, huaci_states);
    pug.on('error', err => console.error('electron-pug error', err));
  } catch (err) {
    console.log(err);
    console.log("Could not initiate 'electron-pug'");
    // Could not initiate 'electron-pug'
  }
  // height: huaci_states.data.length * 30 + 30,

  huaci_win = new BrowserWindow({
    width: 150,
    height: huaci_states.data.length * 30 + 30,
    frame: false,
    useContentSize: true,
    // backgroundColor: '#89a4c7',
    resizable: false,
    transparent: true,
    show: false,
    hasShadow: false,
    skipTaskbar: true,
    x: huaci_x,
    y: huaci_y,
  });

  huaci_win.loadURL(`file://${__dirname}/${fetd}/for-electron/templates/index.pug`);

  huaci_win.on('ready-to-show', () => {
    huaci_win.show();
  });

  huaci_win.on('closed', function() {
    huaci_win = null;
  });
}

// 应用程序准备完成
app.on('ready', () => {
  log.info('app start standalone');

  var electronScreen = electron.screen;
  var size = electronScreen.getPrimaryDisplay().workAreaSize;
  desktop_width = size.width;
  desktop_height = size.height;

  createTray();
  createWindow();
});

function package_is_ok() {
  // 校验安装包是否存在
  if (!fs.existsSync(upgrade_tmp_file)) {
    return false;
  }

  // 校验文件是否下载完整
  let package_info = db.get('package_info').value();
  const remote_md5 = package_info.md5;
  const hash = _get_file_md5(upgrade_tmp_file);
  log.info(`check file md5 is: ${hash}`);
  log.info(`Remote MD5 is: ${remote_md5}`);

  if (remote_md5 == hash) {
    log.info('package is already in the cache');
  } else {
    log.info('Error: package.zip damaged!');
    return false;
  }
  return true;
}

function if_start_huaci() {
  let huaci = db.get('huaci').value();
  if (huaci === undefined) {
    huaci = huaci_config.status;
    db.set('huaci', huaci).write();
  }
  if (huaci) {
    // 启动划词监听
    start_huaci();
    huaci_running = true;
  }
}

function doSomeThingAfterLoginSuccess() {

  setTimeout(() => {
    if (socketio_online) {
      appTray.setToolTip(config.traysay);
      appTray.setImage(icon_path);
    } else {
      appTray.setToolTip("正在连接消息服务器...");
      appTray.setImage(icon_warn);
    }
  }, 3000);

  // 初始化划词的接收函数
  setting_huaci_callback(huaci_receiver);

  // 根据配置判断是否启用划词功能
  if_start_huaci();
  mainWindow.webContents.send('huaci_status', huaci_running);

  // 发送工具集数据
  let tools = db.get('tools').value();
  if (tools === undefined) {
    console.log('There is no tools info');
  } else {
    // console.log(tools);
    console.log('tools-info send~');
    mainWindow.webContents.send('tools-info', tools);
  }

  // 发送版本更新数据
  var options = {
    url: config.update_url,
    headers: {
      'User-Agent': 'request',
    },
  };

  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      var info = JSON.parse(body);
      log.info(body);
      console.log(body);

      mainWindow.webContents.send('update-info', info);
      console.log('update-info send~');
    }
  }
  request(options, callback);

  // 启动后需要不需要更新
  need_uplaunch = db.get('need_uplaunch').value();
  if (need_uplaunch) {
    log.info('app start after uplaunch');
    db.set('need_uplaunch', false).write();
    if (package_is_ok()) {
      console.log('send event: alert-update-notice');
      mainWindow.webContents.send('alert-update-notice');
    } else {
      log.info('package error (qjw12j)');
    }
  }

  // 获取版本号发送给前端
  // 当db.json中存在版本号，则从db.json中获取
  // 否则从config.js文件获取
  let current_version = db.get('current_version').value();
  if (current_version === undefined) {
    current_version = config.current_version;
    db.set('current_version', current_version).write();
  }
  mainWindow.webContents.send('current-version', current_version);

  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
  console.log(current_version);
  console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
}

function mainPageReady() {
  console.log("===> yes, main page renderer ready");
}



/**
 * 登录成功
 */
ipcMain.on('login-success', () => {
  already_login = true;

  mainWindow.setSize(config.main_page_width, config.main_page_height);

  mainWindow.webContents.send('windows-now', { code: 0, desc: 'become normal size' });

  doSomeThingAfterLoginSuccess();
});

/**
 * 恢复登录页面大小
 */
ipcMain.on('logout', () => {
  already_login = false;
  stop_huaci();
  huaci_running = false;
  console.log(config.login_page_width, config.login_page_height)
  mainWindow.setSize(config.login_page_width, config.login_page_height);
  appTray.setToolTip(config.traysay + '(未登录)');
  appTray.setImage(icon_gray);
});

/**
 * 最小化
 */
ipcMain.on('window-min', () => {
  mainWindow.minimize();
});

/**
 * 最大化
 */
ipcMain.on('window-max', () => {
  mainWindow.maximize();
  mainWindow.webContents.send('windows-now', { code: 1, desc: 'become max size' });
  // console.log("mainWindow.isMaximized()", mainWindow.isMaximized());
  // }
});

/**
 * 恢复主页面大小
 */
ipcMain.on('window-normal', () => {
  mainWindow.unmaximize();
  mainWindow.setSize(config.main_page_width, config.main_page_height);
  mainWindow.center();
  mainWindow.webContents.send('windows-now', { code: 0, desc: 'become normal size' });
});

/**
 * 退出程序
 */
ipcMain.on('window-close', () => {
  iconProcess.kill('SIGINT');
  stop_huaci();
  huaci_running = false;
  willQuitApp = true;
  mainWindow.close();
  app.quit();
});

/**
 * 关闭程序到托盘
 */
ipcMain.on('put-in-tray', () => {
  mainWindow.hide();
});

/**
 * 消息闪动
 */
let count = 0;
let flashing = null;
let tray_lock = false;
ipcMain.on('start-flashing', () => {
  if (mainWindow.isVisible()) {
    mainWindow.flashFrame(true);
    if (mainWindow.isMinimized()) {
      // console.log("isMinimized, flashFrame~");
      log.info('isMinimized, flashFrame~');
      // mainWindow.flashFrame(true);
    } else {
      log.info('isVisible, no flashing~');
    }
  } else {
    if (!tray_lock) {
      log.info('starting flashing tray~');
      // console.log("starting flashing tray");
      tray_lock = true;
      flashing = setInterval(function() {
        count++;
        if (count % 2 == 0) {
          appTray.setImage(icon_path);
        } else {
          appTray.setImage(icon_none_path);
        }
      }, 500);
    } else {
      log.info('tray alreay flashing');
      // console.log("tray alreay flashing");
    }
  }
});

/**
 * 取消闪动
 */
ipcMain.on('stop-flashing', () => {
  clearInterval(flashing);
  tray_lock = false;
  if (!already_login) {
    appTray.setImage(icon_gray);
  } else {
    if (socketio_online) {
      appTray.setImage(icon_path);
    } else {
      appTray.setToolTip("正在连接消息服务器...");
      appTray.setImage(icon_warn);
    }
  }
});

function stop_flashing() {
  clearInterval(flashing);
  tray_lock = false;
  if (!already_login) {
    appTray.setImage(icon_gray);
  } else {
    if (socketio_online) {
      appTray.setImage(icon_path);
    } else {
      appTray.setToolTip("正在连接消息服务器...");
      appTray.setImage(icon_warn);
    }
  }
}

/**
 * 打开网页
 */
ipcMain.on('visit-page', (event, msg) => {
  shell.openExternal(msg.url)
});

/**
 * 气泡消息
 */
ipcMain.on('balloon-msg', (event, msg) => {
  appTray.displayBalloon({
    title: msg.title,
    content: msg.content,
  });
});

/**
 * 工具集（添加图标）
 * tool_path: exe or lnk
 */
function get_tool_icon(tool_path) {
  // let json_string = JSON.stringify({context: 'SomeContextLikeAName', path: 'C:/Users/Public/Desktop/Google Chrome.lnk'}) + "\n";
  let json_string = JSON.stringify({ context: 'SomeContextLikeAName', path: tool_path }) + '\n';
  iconProcess.stdin.write(json_string);
}
ipcMain.on('get-tool-icon', (event, tool_path) => {
  get_tool_icon(tool_path);
});

/**
 * 启动工具集的程序
 */
ipcMain.on('open-link', (event, link_path) => {
  shell.openItem(link_path)
});

/**
 * 存储/更新 工具集的工具信息
 */
ipcMain.on('save-tools-info', (event, info) => {
  db.set('tools', info).write();
});

function _get_file_md5(file) {
  return md5File.sync(file);
}

/**
 * 更新（下载包）
 */
function prepare_tmp_dir() {
  let tdir = upgrade_tmp_dir;
  if (!fs.existsSync(tdir)) {
    fs.mkdirSync(tdir);
  }
  return tdir;
}
function down_or_has_cache(event, info) {
  let package_saved_dir = prepare_tmp_dir();
  let package_url = info.package;

  log.info('--- down_or_has_cache ---');
  log.info(package_url);

  if (package_is_ok()) {
    mainWindow.webContents.send('progress', { percent: 1 });
  } else {
    log.info('start downloads package');
    download_package(event, upgrade_tmp_dir, package_url);
  }
}

ipcMain.on('download-package', (event, info) => {
  console.log('download-package event');
  db.set('package_info', info).write();
  down_or_has_cache(event, info);
});

function update_version(new_version) {
  l = new_version.split('.');
  l.pop();
  let cuver = l.join('.');
  upversion(execDir_poxis, cuver);
}

/**
 * 取消下次启动后更新提醒
 */
ipcMain.on('disable-uplaunch', () => {
  db.set('need_uplaunch', false).write();
});

/**
 * 更新（替换与重启）
 */
function update_relaunch() {
  // 当设置下次启动更新后, 又紧接着点击立即更新, 会导致更新后重启应用还会提示更新
  // 此处重置重启后提示更新的flag标识
  db.set('need_uplaunch', false).write();

  // 执行更新
  uplaunch(execDir_poxis);

  // 更新JSON数据文件内的版本号
  const package_info = db.get('package_info').value();
  const new_version = package_info.to;
  db.set('current_version', new_version).write();

  // 更新控制面板内的版本号
  update_version(new_version);

  setTimeout(() => {
    // app.exit();
    iconProcess.kill('SIGINT');
    stop_huaci();
    huaci_running = false;
    willQuitApp = true;
    mainWindow.close();
    app.quit();
  }, 500);
}

function start_update_relaunch(updatetime) {
  if (updatetime === 'now') {
    if (package_is_ok()) {
      update_relaunch();
    } else {
      mainWindow.webContents.send('package-damaged');
    }
  } else if (updatetime === 'next-launch') {
    db.set('need_uplaunch', true).write();
  }
}

ipcMain.on('update-relaunch', (event, updatetime) => {
  setTimeout(() => {
    start_update_relaunch(updatetime);
  }, 500);
});

// 如果页面上已经存在"查"或选择框，则关闭它们
function close_sou_or_select_page() {
  if (sou_win) sou_win.close();
  if (huaci_win) huaci_win.close();
}

/**
 * 显示"查"选项框
 */
function create_sou_card(x, y) {
  close_sou_or_select_page();
  createSouWindow(x, y);
}

/**
 * 显示划词功能选项框
 */
function create_huaci_card() {
  close_sou_or_select_page();
  createHuaci();
}
/**
 * 接收划词配置
 */
ipcMain.on('huaci-config', (event, config) => {
  console.log('---------------------');
  // console.log("huaci-config: ", config.system.huaci)
  huaci_config = config.system.huaci;
});

/**
 * 接收打开选择框的事件
 */
ipcMain.on('open-select-card', () => {
  console.log('user wanna search something~');
  create_huaci_card();
});

/**
 * 接收划词内容
 */
var huaci_original = '';
function process_huaci(message) {
  // 获取到划词内容后将内容保存到全局变量
  huaci_original = message.data;

  // 如果消息类型为huaci，则创建提示窗体
  huaci_x = message.x;
  huaci_y = message.y;
  create_sou_card(message.x, message.y);
}

// 接收来自DLL的数据
function huaci_receiver(data, x, y) {
  console.log(data, x, y);
  if (data === '') {
    console.log('close_sou_or_select_page');
    close_sou_or_select_page();
  } else {
    console.log('close_sou_or_select_page123123 ');
    let message = { data: data, x: x, y: y };
    if (already_login && huaci_running) {
      process_huaci(message);
    }
  }
}

// 鼠标移动时接收光标位置, 当光标距离划词弹窗距离超过阈值后关闭划词窗口
// mouse.on('move', function(x, y) {
//   // console.log("move", x, y)
//   if (sou_win || huaci_win) {
//     if (
//       x < huaci_x - huaci_threshold ||
//       x > huaci_x + huaci_threshold ||
//       y < huaci_y - huaci_threshold ||
//       y > huaci_y + huaci_threshold
//     ) {
//       close_sou_or_select_page();
//     }
//   }
// });

// Binaries from: https://github.com/sindresorhus/win-clipboard
const winBinPath =
  arch() === 'x64'
    ? execDir_poxis + '/bin/clipboard_x86_64.exe'
    : execDir_poxis + '/bin/clipboard_i686.exe';

/**
 * 当划词功能选项框点选后，接收功能的id唯一标识
 */
ipcMain.on('huaci-choice', (event, cid) => {
  console.log(cid);

  if (cid === '101') {
    console.log('101: copy content to clipboard');
    // clipboardy.writeSync(huaci_original);
    execa.sync(winBinPath, ['--copy'], { input: huaci_original });
  } else {
    console.log(`${cid}: do some query`);
    // 处于托盘则显示页面，否则主窗口聚焦
    if (mainWindow.isVisible()) {
      mainWindow.focus();
    } else {
      mainWindow.show();
    }
    console.log('send huaci message');
    mainWindow.webContents.send('huaci', {
      original: huaci_original,
      query_type: cid,
    });
  }
});

ipcMain.on('setting-huaci', (event, huaci_status) => {
  db.set('huaci', huaci_status).write();
  if (huaci_status && !huaci_running) {
    start_huaci();
    huaci_running = true;
  } else if (!huaci_status && huaci_running) {
    stop_huaci();
    huaci_running = false;
  } else {
    console.log('嘤嘤嘤？');
  }
});

function createNoticeBox() {
  // Create the browser window

  noticeWindowBox = new BrowserWindow({
    width: 280,
    height: 400,
    autoHideMenuBar: false,
    frame: false,
    useContentSize: true,
    resizable: false,
    transparent: true,
    // backgroundColor: '#5986b4',
    // backgroundColor: '#de7ce7',
    skipTaskbar: true,
    show: false,
    alwaysOnTop: true,
    x: desktop_width - 280 - 20,
    y: desktop_height - 400 - 10,
  });
  // and load the index.html of the app.
  noticeWindowBox.loadURL(`file://${__dirname}/${fetd}/for-electron/templates/noticebox.html`);

  noticeWindowBox.on('ready-to-show', () => {
    noticeWindowBox.show();
  });

  noticeWindowBox.on('close', e => {
    noticeWindowBox = null;
  });
}

ipcMain.on('notice-box-message', function(event, msg) {
  console.log('notice-box-message');
  if (noticeWindowBox) {
    noticeWindowBox.webContents.send('new', msg);
  } else {
    createNoticeBox();
    setTimeout(() => {
      noticeWindowBox.webContents.send('new', msg);
    }, 300);
  }
  console.log(noticeWindowBox);
});

ipcMain.on('socketio-status', function(event, flag) {

  if (flag) {
    socketio_online = true;
  } else {
    socketio_online = false;
  }
  if (already_login) {
    if (flag) {
      appTray.setToolTip(config.traysay);
      appTray.setImage(icon_path);
    } else {
      appTray.setToolTip("正在连接消息服务器...");
      appTray.setImage(icon_warn);
    }
  }
});

ipcMain.on('socketio-status', function(event, flag) {

  if (flag) {
    socketio_online = true;
  } else {
    socketio_online = false;
  }
  if (already_login) {
    if (flag) {
      appTray.setToolTip(config.traysay);
      appTray.setImage(icon_path);
    } else {
      appTray.setToolTip("正在连接消息服务器...");
      appTray.setImage(icon_warn);
    }
  }
});

ipcMain.on('proxy-info', function(event, proxy_info) {
  db.set('proxy', proxy_info).write();

  let proxy_server = proxy_info.user_setting;
  if (!proxy_info.enable ) {
    proxy_server = ""
  }

  mainWindow.webContents.session.setProxy({ proxyRules: proxy_server }, function () {
    console.log("update proxy info success: " + proxy_server)
	log.info("update proxy info success");
    log.info(JSON.stringify(proxy_info));
  });
})


// ----------------------------------------

// 检查更新包
// (function () {
//   setTimeout(() => {
//     doSomeThingAfterLoginSuccess()
//   }, 1000);
// })();

// 下载更新包
// (function () {
//   setTimeout(() => {
//     console.log("=-=-=-=-=-=-=-=-=-=-");
//     console.log(package_url);
//     update(null, 'now')
//   }, 5000);
// })();

// 替换文件并重启
// (function () {
//   setTimeout(() => {
//     update_relaunch();
//   }, 3000);
// })();

const msg_list = [
  {
    system: '案管',
    desc: '案件处理超期',
    datetime: '19:23',
    color: 'bg-blue',
    btns: [
      {
        text: '督办',
        url: 'http://www.baidu.com/',
      },
      {
        text: '详情',
        url: 'http://www.baidu.com/',
      },
    ],
  },
  {
    system: '办案区',
    desc: '流程告警',
    datetime: '23:23',
    color: 'bg-green',
    btns: [
      {
        text: '处置',
        url: 'http://www.baidu.com/',
      },
      {
        text: '告警',
        url: 'http://www.baidu.com/',
      },
    ],
  },
  {
    system: '卷宗',
    desc: '分类调整提醒',
    datetime: '17:20',
    color: 'bg-yellow',
    btns: [
      {
        text: '核查',
        url: 'http://www.baidu.com/',
      },
      {
        text: '详情',
        url: 'http://www.baidu.com/',
      },
    ],
  },
];

//setInterval(() => {
//  let idx = Math.floor(Math.random() * 3);
//  if (noticeWindowBox) {
//    noticeWindowBox.webContents.send('new', msg_list[idx]);
//  } else {
//    createNoticeBox();
//    setTimeout(() => {
//      noticeWindowBox.webContents.send('new', msg_list[idx]);
//    }, 300);
//  }
//}, 6000);
