const { spawn } = require('child_process');
const { exec } = require('child_process');

const fs = require('fs');

function upversion(exe_path, latest_version) {
  let contentText = fs.readFileSync(exe_path + '/guid.txt', 'utf-8');
  contentText = contentText.replace(/[\r\n]/g, '');
  console.log(contentText);

  let cmd = exe_path + '/bin/update_version.exe ' + contentText + ' ' + latest_version;
  console.log(cmd);
  let child = exec(cmd);

  child.on('exit', function(code, signal) {
    console.log('update_version exited with ' + `code ${code} and signal ${signal}`);
    if (code === 0) {
      console.log('update version success');
    }
  });
}

exports.upversion = upversion;
