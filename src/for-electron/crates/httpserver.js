const bodyParser = require('body-parser');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));

app.get('/status', function(req, res, next) {
  res.json({ code: 0 });
});

app.post('/auto_login', function(req, res, next) {
  console.log(req.body);
  try {
    let mainWindow = require('electron').BrowserWindow.fromId(0);
    mainWindow.webContents.send('auto-login', req.body);
  } catch (e) {
    console.log(e);
  }
  try {
    let mainWindow = require('electron').BrowserWindow.fromId(1);
    mainWindow.webContents.send('auto-login', req.body);
  } catch (e) {
    console.log(e);
  }
  res.json({ code: 0, debug: req.body });
});

app.get('/logout', function(req, res, next) {
  console.log(req.body);
  try {
    let mainWindow = require('electron').BrowserWindow.fromId(0);
    mainWindow.webContents.send('logout');
  } catch (e) {
    console.log(e);
  }
  try {
    let mainWindow = require('electron').BrowserWindow.fromId(1);
    mainWindow.webContents.send('logout');
  } catch (e) {
    console.log(e);
  }
  res.json({ code: 0 });
});

app.listen(1234, function() {
  console.log('CORS-enabled web server listening on port 1234');
});
