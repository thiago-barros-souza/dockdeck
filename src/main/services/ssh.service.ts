import { Client, ConnectConfig } from 'ssh2';
import net from 'net';
import { ConnectionProfile } from '../../shared/types';

export class SshService {
  private client: Client | null = null;
  private localServer: net.Server | null = null;
  private localSocketPath: string | null = null;

  async connectAndTunnel(profile: ConnectionProfile): Promise<string> {
    await this.disconnect();

    return new Promise((resolve, reject) => {
      const client = new Client();
      this.client = client;

      const config: ConnectConfig = {
        host: profile.host,
        port: profile.port || 22,
        username: profile.username || 'root',
        readyTimeout: 20000
      };

      if (profile.authType === 'privateKey' && profile.privateKey) {
        config.privateKey = profile.privateKey;
        if (profile.passphrase) {
          config.passphrase = profile.passphrase;
        }
      } else if (profile.password) {
        config.password = profile.password;
      }

      client.on('ready', () => {
        // Create an ephemeral local unix domain socket proxying to the remote docker socket
        const tmpSocketPath = `/tmp/dockdeck-${Date.now()}-${Math.floor(Math.random() * 10000)}.sock`;
        this.localSocketPath = tmpSocketPath;

        const server = net.createServer((socket) => {
          // Forward stream to remote unix socket /var/run/docker.sock
          client.openssh_forwardInStreamLocal(
            '/var/run/docker.sock',
            (err, upstream) => {
              if (err) {
                socket.destroy();
                return;
              }
              socket.pipe(upstream).pipe(socket);
            }
          );
        });

        server.listen(tmpSocketPath, () => {
          this.localServer = server;
          resolve(tmpSocketPath);
        });

        server.on('error', (err) => {
          reject(new Error(`Falha ao criar socket local para túnel SSH: ${err.message}`));
        });
      });

      client.on('error', (err) => {
        reject(new Error(`Falha na conexão SSH com ${profile.host}: ${err.message}`));
      });

      client.connect(config);
    });
  }

  async disconnect(): Promise<void> {
    if (this.localServer) {
      this.localServer.close();
      this.localServer = null;
    }
    if (this.client) {
      this.client.end();
      this.client = null;
    }
    if (this.localSocketPath) {
      try {
        const fs = await import('fs');
        if (fs.existsSync(this.localSocketPath)) {
          fs.unlinkSync(this.localSocketPath);
        }
      } catch {
        // Ignore cleanup error
      }
      this.localSocketPath = null;
    }
  }

  isConnected(): boolean {
    return this.client !== null;
  }
}
