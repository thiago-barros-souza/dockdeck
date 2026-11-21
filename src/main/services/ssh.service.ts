import { Client, ConnectConfig } from 'ssh2';
import net from 'net';
import fs from 'fs';
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
        readyTimeout: 20000,
        keepaliveInterval: 10000
      };

      if (profile.authType === 'privateKey' && profile.privateKey) {
        config.privateKey = profile.privateKey;
        if (profile.passphrase) {
          config.passphrase = profile.passphrase;
        }
      } else if (profile.password) {
        config.password = profile.password;
      }

      let isResolved = false;

      client.on('ready', () => {
        const remoteSocketPath = profile.socketPath || '/var/run/docker.sock';
        const tmpSocketPath = `/tmp/dockdeck-${Date.now()}-${Math.floor(
          Math.random() * 10000
        )}.sock`;
        this.localSocketPath = tmpSocketPath;

        try {
          if (fs.existsSync(tmpSocketPath)) {
            fs.unlinkSync(tmpSocketPath);
          }
        } catch {
          // Ignore
        }

        const server = net.createServer((socket) => {
          // Use openssh_forwardOutStreamLocal (Direct StreamLocal -L forwarding)
          client.openssh_forwardOutStreamLocal(
            remoteSocketPath,
            (err, upstream) => {
              if (err || !upstream) {
                // Fallback: spawn nc or socat over SSH exec
                client.exec(
                  `nc -U ${remoteSocketPath} 2>/dev/null || socat - UNIX-CONNECT:${remoteSocketPath} 2>/dev/null`,
                  (execErr, stream) => {
                    if (execErr || !stream) {
                      socket.destroy();
                      return;
                    }
                    socket.pipe(stream).pipe(socket);
                    socket.on('error', () => stream.destroy());
                    stream.on('error', () => socket.destroy());
                  }
                );
                return;
              }

              socket.pipe(upstream).pipe(socket);
              socket.on('error', () => upstream.destroy());
              upstream.on('error', () => socket.destroy());
            }
          );
        });

        server.listen(tmpSocketPath, () => {
          this.localServer = server;
          isResolved = true;
          resolve(tmpSocketPath);
        });

        server.on('error', (err) => {
          if (!isResolved) {
            reject(
              new Error(
                `Falha ao criar socket local para túnel SSH: ${err.message}`
              )
            );
          }
        });
      });

      client.on('error', (err) => {
        if (!isResolved) {
          reject(
            new Error(
              `Falha na conexão SSH com ${profile.host}: ${err.message}`
            )
          );
        }
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
