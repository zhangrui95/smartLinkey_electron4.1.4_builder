/* eslint-disable */
const AutoLaunch = require('auto-launch');
const Key = require('windows-registry').Key;
const windef = require('windows-registry').windef;
const fs = require('fs');

/**
 * 本模块用于将程序设置为开机自启动
 * 程序路径从注册表获取
 */

function auto_launch(exe_path) {
  let contentText = fs.readFileSync(exe_path + '/guid.txt', 'utf-8');
  contentText = contentText.replace(/[\r\n]/g, '');

  const regedit_path = 'SOFTWARE\\' + contentText;

  console.log('=================');
  console.log(contentText);
  console.log(regedit_path);

  // 从注册表获取程序安装路径
  var key = new Key(
    windef.HKEY.HKEY_LOCAL_MACHINE,
    regedit_path,
    windef.KEY_ACCESS.KEY_QUERY_VALUE
  );
  var value = key.getValue('InstallLocation');

  let program_location = value + '\\SmartLinkey.exe';
  console.log(program_location);

  // 设置开机自启动
  var minecraftAutoLauncher = new AutoLaunch({
    name: 'smartlinkey',
    path: program_location,
  });

  minecraftAutoLauncher.enable();

  // minecraftAutoLauncher.disable();

  minecraftAutoLauncher
    .isEnabled()
    .then(function(isEnabled) {
      if (isEnabled) {
        return;
      }
      minecraftAutoLauncher.enable();
    })
    .catch(function(err) {
      // handle error
    });
}

exports.auto_launch = auto_launch;
