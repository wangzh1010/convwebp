const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const iconv = require('iconv-lite');
const jschardet = require('jschardet');
let mainWindow = null;
let filePaths = [];
let imagePath = '';
let prefix = '';
let config = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    app.quit();
}

const createWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false,
        webPreferences: {
            nodeIntegration: true
        }
    });

    // and load the index.html of the app.
    mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    mainWindow.once('ready-to-show', () => {
        fs.readFile(path.resolve(__dirname, 'config.json'), 'utf8', (err, config) => {
            if (err) {
                config = { 'minSize': 10240, 'extensions': ['png', 'jpg'], 'publicPath': 'https://himg.china.cn/img/' }
            } else {
                config = JSON.parse(config);
            }
            mainWindow.webContents.send('INIT', config);
            mainWindow.show();
        });
    })
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

ipcMain.handle('CHOOSE_FILES', (e) => {
    let results = null;
    try {
        results = dialog.showOpenDialogSync({ title: '选择文件', properties: ['openFile', 'multiSelections'] });
    } catch (err) {
        console.log(err)
    }
    filePaths = results;
    return results;
})

ipcMain.handle('CHOOSE_IMAGES', (e) => {
    let results = null;
    try {
        results = dialog.showOpenDialogSync({ title: '选择图片', properties: ['openDirectory'] });
    } catch (err) {
        console.log(err)
    }
    imagePath = results && results[0];
    if (imagePath) {
        prefix = path.basename(imagePath);
        imagePath = path.dirname(imagePath);
    }
    return results;
})

ipcMain.on('PROCESS', async (e, opts) => {
    if (!filePaths || !imagePath) {
        return;
    }
    config = Object.assign({}, config, opts);
    filePaths.forEach(filePath => {
        readFile(filePath).then(result => {
            let { data, processed } = convert(result.data);
            if (processed.length > 0) {
                saveFile(filePath, result.encoding, data);
            }
            mainWindow.webContents.send('PROCESS', filePath, processed);
        }).catch(err => {
            console.log(err);
        });
    });
})

function readFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, buffer) => {
            if (err) {
                reject(err)
            } else {
                let { encoding } = jschardet.detect(buffer);
                encoding = encoding === 'UTF-8' ? 'utf8' : 'GBK';
                let data = iconv.decode(buffer, encoding);
                resolve({ data, encoding });
            }
        });
    });
}

function saveFile(filePath, encoding, data) {
    fs.writeFile(filePath, iconv.encode(data, encoding), 'binary', err => {
        if (err) {
            throw err;
        }
    });
}

function convert(data) {
    let processed = [];
    let regExp = new RegExp(prefix + '\/.*\\.(' + config.extensions.join('|') + ')(?!\.webp)', 'g');
    let matches = data.match(regExp);
    if (matches && matches.length > 0) {
        matches.forEach(filePath => {
            let filename = path.basename(filePath);

            let stats = fs.statSync(path.join(imagePath, filePath));
            if (stats.size > config.minSize) {
                processed.push(filename);
                if (config.publicPath) {
                    data = data.replace(new RegExp('[./]*' + filePath + '(?!\.webp)'), config.publicPath + filePath.substr(prefix.length + 1) + '.webp');
                } else {
                    data = data.replace(new RegExp(filePath + '(?!\.webp)'), filePath + '.webp');
                }
            } else {
                if (config.publicPath) {
                    data = data.replace(new RegExp('[./]*' + filePath + '(?!\.webp)'), config.publicPath + filePath.substr(prefix.length + 1));
                }
            }
        });
    }
    return { data, processed };
}
