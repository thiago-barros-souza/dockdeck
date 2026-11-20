import { ipcMain } from 'electron';
import { DockerService } from '../services/docker.service';
import { ConnectionManager } from '../services/connection.manager';
import { ContainerAction, ConnectionProfile } from '../../shared/types';

export function registerDockerIpcHandlers(
  dockerService: DockerService,
  connectionManager: ConnectionManager
): void {
  ipcMain.handle('docker:get-system-info', async () => {
    return await dockerService.getSystemInfo();
  });

  ipcMain.handle('docker:list-containers', async () => {
    return await dockerService.listContainers();
  });

  ipcMain.handle('docker:inspect-container', async (_, containerId: string) => {
    return await dockerService.inspectContainer(containerId);
  });

  ipcMain.handle(
    'docker:execute-action',
    async (_, containerId: string, action: ContainerAction) => {
      await dockerService.executeAction(containerId, action);
      return { success: true };
    }
  );

  // Stats stream
  ipcMain.handle('docker:start-stats', (event, containerId: string) => {
    const webContents = event.sender;
    dockerService.startStatsStream(containerId, (metrics) => {
      if (!webContents.isDestroyed()) {
        webContents.send(`docker:stats:${containerId}`, metrics);
      }
    });
    return { streaming: true };
  });

  ipcMain.handle('docker:stop-stats', (_, containerId: string) => {
    dockerService.stopStatsStream(containerId);
    return { streaming: false };
  });

  // Logs stream
  ipcMain.handle(
    'docker:start-logs',
    (event, containerId: string, tail: number = 250) => {
      const webContents = event.sender;
      dockerService.startLogsStream(containerId, tail, (logChunk) => {
        if (!webContents.isDestroyed()) {
          webContents.send(`docker:logs:${containerId}`, logChunk);
        }
      });
      return { streaming: true };
    }
  );

  ipcMain.handle('docker:stop-logs', (_, containerId: string) => {
    dockerService.stopLogsStream(containerId);
    return { streaming: false };
  });

  // Terminal Exec
  ipcMain.handle('docker:start-exec', async (event, containerId: string) => {
    const webContents = event.sender;
    const sessionId = await dockerService.startExecSession(
      containerId,
      (data) => {
        if (!webContents.isDestroyed()) {
          webContents.send(`docker:exec-data:${sessionId}`, data);
        }
      },
      () => {
        if (!webContents.isDestroyed()) {
          webContents.send(`docker:exec-exit:${sessionId}`);
        }
      }
    );
    return { sessionId };
  });

  ipcMain.handle(
    'docker:send-exec-input',
    (_, sessionId: string, data: string) => {
      dockerService.sendExecInput(sessionId, data);
      return { success: true };
    }
  );

  ipcMain.handle(
    'docker:resize-exec',
    (_, sessionId: string, width: number, height: number) => {
      dockerService.resizeExec(sessionId, width, height);
      return { success: true };
    }
  );

  ipcMain.handle('docker:stop-exec', (_, sessionId: string) => {
    dockerService.stopExecSession(sessionId);
    return { success: true };
  });

  // Images and Volumes
  ipcMain.handle('docker:list-images', async () => {
    return await dockerService.listImages();
  });

  ipcMain.handle('docker:remove-image', async (_, id: string) => {
    await dockerService.removeImage(id);
    return { success: true };
  });

  ipcMain.handle('docker:list-volumes', async () => {
    return await dockerService.listVolumes();
  });

  ipcMain.handle('docker:remove-volume', async (_, name: string) => {
    await dockerService.removeVolume(name);
    return { success: true };
  });

  ipcMain.handle('docker:prune-system', async () => {
    return await dockerService.pruneSystem();
  });

  // Profiles and Connection switching
  ipcMain.handle('docker:get-profiles', () => {
    return {
      profiles: connectionManager.getProfiles(),
      active: connectionManager.getActiveProfile()
    };
  });

  ipcMain.handle('docker:switch-connection', async (_, profileId: string) => {
    const active = await connectionManager.switchConnection(profileId);
    return { success: true, active };
  });

  ipcMain.handle('docker:save-profile', async (_, profile: ConnectionProfile) => {
    const profiles = await connectionManager.saveProfile(profile);
    return { success: true, profiles };
  });

  ipcMain.handle('docker:delete-profile', async (_, profileId: string) => {
    const profiles = await connectionManager.deleteProfile(profileId);
    return { success: true, profiles };
  });
}
