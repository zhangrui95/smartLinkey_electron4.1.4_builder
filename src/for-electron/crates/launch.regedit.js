/* eslint-disable */
const AutoLaunch = require('auto-launch');
const regedit = require('regedit');
const fs = require('fs');

/**
 * 本模块用于将程序设置为开机自启动
 * 程序路径从注册表获取
 */

function auto_launch(exe_path) {
  let contentText = fs.readFileSync(exe_path + '/guid.txt', 'utf-8');
  contentText = contentText.replace(/[\r\n]/g, '');

  const regedit_path = 'HKLM\\SOFTWARE\\' + contentText;

  console.log('=================');
  console.log(contentText);
  console.log(regedit_path);

  // 从注册表获取程序安装路径
  regedit
    .list([regedit_path])
    .on('data', function(entry) {
      console.log(entry.data);

      let program_location = entry.data.values.InstallLocation.value + '\\SmartLinkey.exe';
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
    })
    .on('finish', function() {
      console.log('Get location from regedit finished~');
    });
}

exports.auto_launch = auto_launch;
