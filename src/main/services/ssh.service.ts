import { Client, ConnectConfig } from 'ssh2';
import net from 'net';
import fs from 'fs';
import { ConnectionProfile } from '../../shared/types';

export class SshService {
  private client: Client | null = null;
  private localServer: net.Server | null = null;
  private localSocketPath: string | null = null;

  /**
   * Estabelece conexão TCP prévia com retries antes do handshake SSH.
   * Isso evita falsos timeouts no SSH2 quando ocorrem perdas de pacotes SYN em conexões instáveis.
   */
  private async connectTcpWithRetry(
    host: string,
    port: number,
    retries = 3,
    timeoutMs = 9000
  ): Promise<net.Socket> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const sock = await new Promise<net.Socket>((resolve, reject) => {
          const s = net.createConnection({ host, port });
          let resolved = false;

          const timer = setTimeout(() => {
            if (!resolved) {
              resolved = true;
              s.destroy(new Error(`Timeout na conexão TCP com ${host}:${port}`));
            }
          }, timeoutMs);

          s.once('connect', () => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timer);
              resolve(s);
            }
          });

          s.once('error', (err) => {
            if (!resolved) {
              resolved = true;
              clearTimeout(timer);
              reject(err);
            }
          });
        });

        return sock;
      } catch (err: any) {
        lastError = err;
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 800));
        }
      }
    }

    throw lastError || new Error(`Não foi possível conectar a ${host}:${port}`);
  }

  async connectAndTunnel(profile: ConnectionProfile): Promise<string> {
    await this.disconnect();

    const host = profile.host || '127.0.0.1';
    const port = profile.port || 22;

    // 1. Conexão TCP prévia resiliente
    const tcpSocket = await this.connectTcpWithRetry(host, port, 3, 10000);

    return new Promise((resolve, reject) => {
      const client = new Client();
      this.client = client;

      const config: ConnectConfig = {
        sock: tcpSocket,
        username: profile.username || 'root',
        readyTimeout: 35000,
        keepaliveInterval: 10000,
        tryKeyboard: true
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

      // Resposta para PAM / keyboard-interactive
      client.on('keyboard-interactive', (_name, _inst, _lang, _prompts, finish) => {
        if (profile.password) {
          finish([profile.password]);
        } else {
          finish([]);
        }
      });

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
          // Direct StreamLocal -L forwarding via openssh_forwardOutStreamLocal
          client.openssh_forwardOutStreamLocal(
            remoteSocketPath,
            (err, upstream) => {
              if (err || !upstream) {
                // Fallback para socat ou netcat caso o sshd remoto não permita streamlocal
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
          let msg = err.message;
          if (msg.includes('All configured authentication methods failed')) {
            msg = 'Autenticação recusada: usuário, senha ou chave incorretos.';
          } else if (msg.includes('Timed out while waiting for handshake')) {
            msg = 'Tempo limite de handshake SSH esgotado na rede remota.';
          }
          reject(
            new Error(
              `Falha na conexão SSH com ${profile.host}: ${msg}`
            )
          );
        }
      });

      client.connect(config);
    });
  }

  async disconnect(): Promise<void> {
    if (this.localServer) {
      try {
        this.localServer.close();
      } catch {
        // Ignore
      }
      this.localServer = null;
    }
    if (this.client) {
      try {
        this.client.end();
      } catch {
        // Ignore
      }
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
