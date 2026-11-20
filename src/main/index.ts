import { app, shell, BrowserWindow } from 'electron';
import { join } from 'path';
import { electronApp, optimizer, is } from '@electron-toolkit/utils';
import { DockerService } from './services/docker.service';
import { SshService } from './services/ssh.service';
import { ConnectionManager } from './services/connection.manager';
import { registerDockerIpcHandlers } from './ipc/docker.handlers';

let mainWindow: BrowserWindow | null = null;
let dockerService: DockerService;
let sshService: SshService;
let connectionManager: ConnectionManager;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    title: 'DockDeck — Docker Desktop Manager',
    backgroundColor: '#0d1117',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true
    }
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.dockdeck.app');

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window);
  });

  dockerService = new DockerService();
  sshService = new SshService();
  connectionManager = new ConnectionManager(dockerService, sshService);

  registerDockerIpcHandlers(dockerService, connectionManager);

  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', async () => {
  if (dockerService) dockerService.stopAllStreams();
  if (sshService) await sshService.disconnect();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});
