# DockDeck 🐳

> Cliente desktop moderno, rápido e multiplataforma para gerenciamento de containers Docker locais e remotos (via túnel SSH), inspirado na agilidade do **lazydocker**.

---

## 🚀 Funcionalidades

- **Multi-Host (Local & SSH)**: Conexão automática ao socket local (`/var/run/docker.sock`) e suporte a múltiplos servidores remotos via túnel SSH (`ssh2`) com chave privada ou senha.
- **Métricas em Tempo Real**: Gráficos dinâmicos de consumo de CPU, memória, I/O de rede e disco.
- **Logs Inteligentes**: Visualizador com suporte a cores ANSI (`xterm.js`), busca textual, auto-scroll comutável e exportação em `.txt`.
- **Inspecionar Detalhado**: Variáveis de ambiente, volumes montados, portas e JSON raw com 1 clique de cópia.
- **Atalhos Estilo Lazydocker**: Navegação rápida pelo teclado (`↑`/`↓`, `R` para restart, `S` para stop, `1`/`2`/`3` para alternar abas).

---

## 🛠️ Stack Técnica

- **Electron** + **Vite** (`electron-vite`)
- **React 19** + **TypeScript**
- **Tailwind CSS v4** + **Lucide React**
- **Recharts** (gráficos de performance)
- **@xterm/xterm** (terminal de logs e comandos)
- **Dockerode** (integração direta com a Docker Engine API)
- **ssh2** (túneis SSH criptografados para sockets remotos)
- **Vitest** (testes unitários e de integração)

---

## 📦 Como Executar

```bash
# 1. Entrar na pasta
cd dockdeck

# 2. Executar em modo desenvolvimento
npm run dev

# 3. Rodar a suíte de testes (QA)
npm test

# 4. Gerar build de produção
npm run build
```
