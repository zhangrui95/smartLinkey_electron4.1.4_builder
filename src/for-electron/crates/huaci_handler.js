const ffi = require('ffi');

const angel = ffi.Library('./angel', {
  SetStartHook: ['bool', []],
  SetStopHook: ['bool', []],
  SetCallback: ['void', ['pointer']],
});

// 定义回调函数用于接收扫描数据（UTF-8）
// const callback = ffi.Callback('void', ['string', 'int', 'int'], function(data, x, y) {
//   console.log(data, x, y);
// });

var callback;

function setting_huaci_callback(main_callback) {
  callback = ffi.Callback('void', ['string', 'int', 'int'], main_callback);

  // 设置回调函数
  angel.SetCallback(callback);
}

function start_huaci() {
  // 开始屏幕取词功能
  let status_code = angel.SetStartHook();
}

function stop_huaci() {
  // 停止屏幕取词功能
  angel.SetStopHook();
}

// 防止 callback 函数被垃圾回收机制销毁
process.on('exit', () => {
  callback;
});

exports.setting_huaci_callback = setting_huaci_callback;
exports.start_huaci = start_huaci;
exports.stop_huaci = stop_huaci;
