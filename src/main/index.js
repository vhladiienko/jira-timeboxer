'use strict'

import { app, BrowserWindow, Tray, Menu, ipcMain } from 'electron'
var path = require('path')

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */
if (process.env.NODE_ENV !== 'development') {
  global.__static = path.join(__dirname, '/static').replace(/\\/g, '\\\\')
}

let mainWindow
let appTray
const winURL = process.env.NODE_ENV === 'development'
  ? `http://localhost:9080`
  : `file://${__dirname}/index.html`

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    minWidth: 590,
    icon: path.join(__static, 'timer_32.png'),
    useContentSize: true,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: process.env.NODE_ENV === 'development' ? false : true,
      enableRemoteModule: true
    }
  })

  mainWindow.loadURL(winURL)

  var iconPath = path.join(__static, 'timer_32_bw.png')

  appTray = new Tray(iconPath)

  var contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show',
      click: function () {
        mainWindow.show()
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Start/Pause',
      click: function () {
        mainWindow.webContents.send('toggle')
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Quit',
      click: function () {
        app.isQuiting = true
        app.quit()
      }
    }
  ])

  appTray.setContextMenu(contextMenu)
  appTray.on('click', () => {
    mainWindow.show()
  })
  appTray.on('right-click', () => {
    appTray.popUpContextMenu()
  })
  appTray.on('double-click', () => {
    mainWindow.webContents.send('toggle')
  })

  mainWindow.on('close', () => {
    mainWindow = null
  })

  mainWindow.on('minimize', (event) => {
    event.preventDefault()
    mainWindow.hide()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.setMenu(null)
}

ipcMain.on('changeTrayIcon', (event, action) => {
  if (action === 'on') {
    appTray.setImage(path.join(__static, 'timer_32.png'))
  } else {
    appTray.setImage(path.join(__static, 'timer_32_bw.png'))
  }
})

ipcMain.on('updateDurationTooltip', (event, tooltip) => {
  appTray.setToolTip(tooltip)
})

ipcMain.on('quitApplication', () => {
  app.quit()
})

ipcMain.on('notification-click', () => {
  mainWindow.show()
})

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

app.setAppUserModelId('com.vhladiienko.jira-timeboxer')

/**
 * Auto Updater
 *
 * Uncomment the following code below and install `electron-updater` to
 * support auto updating. Code Signing with a valid certificate is required.
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-electron-builder.html#auto-updating
 */

/*
import { autoUpdater } from 'electron-updater'

autoUpdater.on('update-downloaded', () => {
  autoUpdater.quitAndInstall()
})

app.on('ready', () => {
  if (process.env.NODE_ENV === 'production') autoUpdater.checkForUpdates()
})
 */
