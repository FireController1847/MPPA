const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');

const defaults = {
  'width': 1200,
  'height': 932,
  'show': false
};
let loadWindow;
let window;

app.on('ready', () => {
  loadWindow = new BrowserWindow(Object.assign({}, defaults, {
    backgroundColor: '#212121', 
    width: 400, 
    height: 400, 
    frame: false
  }));

  loadWindow.once('show', () => {
    window = new BrowserWindow(defaults);

    window.webContents.once('dom-ready', () => {
      window.show();
      loadWindow.hide();
      loadWindow.close();
    });

    window.loadURL(url.format({
      pathname: path.join(__dirname, 'html/index.html'),
      protocol: 'file:',
      slashes: true
    }));
  });

  loadWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'html/load.html'),
    protocol: 'file:',
    slashes: true
  }));

  loadWindow.show();
});