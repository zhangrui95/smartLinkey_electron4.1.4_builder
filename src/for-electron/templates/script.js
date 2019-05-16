const { ipcRenderer } = require('electron');

function send_event(cid) {
  console.log(cid);
  ipcRenderer.send('huaci-choice', cid);
  document.getElementById('app').className = 'animated bounceOut';
  setTimeout(() => {
    window.close();
  }, 1000);
}

ipcRenderer.on('please-close', () => {
  console.log('main tell me close');
  window.close();
});

// setTimeout(() => {
//   document.getElementById('app').className = 'animated fadeOut';
// }, 4000);
// setTimeout(() => {
//   window.close();
// }, 5000);
