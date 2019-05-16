const { spawn } = require('child_process');

const fs = require('fs');

function uplaunch(exe_path) {
  const child = spawn('cscript.exe', [exe_path + '/uplaunch.vbs'], {
    detached: true,
    stdio: ['ignore', 'ignore', 'ignore'],
  });
  child.unref();

  return child;
}

exports.uplaunch = uplaunch;
