/* eslint-disable */
const bunyan = require('bunyan');
const fs = require('fs');

const logs_dir = 'logs';

if (!fs.existsSync(logs_dir)) {
  fs.mkdirSync(logs_dir);
}

var log = bunyan.createLogger({
  name: 'main',
  streams: [
    {
      path: 'logs/main.log',
    },
    {
      level: 'info',
      stream: process.stdout,
    },
  ],
});

exports.log = log;
