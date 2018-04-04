const { app, BrowserWindow } = require('electron');

const fs = require('fs');
const path = require('path');
const url = require('url');

const files = process.argv.slice(2);
if (files.length === 0) {
    console.error(`Usage:
${path.basename(process.argv[1])} FILE [FILE ...]`);
    process.exit(1);
}

const indexUrl = url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
});

let windows = [];

function viewSchema(filename) {
    const absFilename = path.resolve(filename);

    fs.readFile(absFilename, (err, data) => {
        if (err) {
            console.error(`Error reading file ${filename}: ${err.stack}`);
            return;
        }
        console.log(`File ${filename} successfully read.`);

        let parsedSchema;
        try {
            parsedSchema = JSON.parse(data);
        } catch (parseErr) {
            console.error(`Error parsing file ${filename}: ${parseErr.stack}`);
            return;
        }
        console.log(`File ${filename} successfully parsed.`);

        let win = new BrowserWindow({ show: false, autoHideMenuBar: true });
        const winID = win.id;

        win.setRepresentedFilename(absFilename);

        win
            .on('closed', () => {
                win = null;
                windows[winID] = null;
            })
            .on('ready-to-show', () => {
                win.show();
            })
            .loadURL(indexUrl);

        win.webContents
            .on('did-finish-load', () => {
                console.log('sending:', ['viewSchema', parsedSchema, filename]);
                win && win.webContents.send('viewSchema', parsedSchema, filename);
            });

        //win.openDevTools();

        windows[winID] = win;
    });
}

app.on('ready', () => {
    console.log('Loading files:', files);
    files.forEach(viewSchema);
});

// Quit when all windows are closed. (except on macOS)
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (win === null) {
        //FIXME: Show file chooser dialog?
        //viewSchema();
    }
});
