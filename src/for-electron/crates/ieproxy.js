/* eslint-disable */
const Key = require('windows-registry').Key;
const windef = require('windows-registry').windef;
const fs = require('fs');

/**
 * 本模块用于获取Internet Explorer默认代理配置信息
 */

function get_ie_proxy(exe_path) {

  const regedit_path = 'SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Internet Settings';

  // 从注册表获取程序安装路径
  var key = new Key(
    windef.HKEY.HKEY_CURRENT_USER,
    regedit_path,
    windef.KEY_ACCESS.KEY_QUERY_VALUE
  );
  var ProxyEnable = key.getValue('ProxyEnable');
  console.log("--- ProxyServer ---")
  console.log(ProxyEnable.readUIntLE())
  let enable = ProxyEnable.readUIntLE();
  if (enable) {
    var ProxyServer = key.getValue('ProxyServer');
    return { ProxyEnable: enable, ProxyServer }
  } else {
    return { ProxyEnable: enable, ProxyServer: '' }
  }
}

exports.get_ie_proxy = get_ie_proxy;
