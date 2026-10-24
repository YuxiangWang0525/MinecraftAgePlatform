# Minecraft Age Platform (MCAP)

> A real-name verification platform for Minecraft servers with minor protection management.

Internal Codename: [Promise Makes a Home](https://endfield.wiki.gg/wiki/A_Promise_Makes_a_Home)

[中文文档](README_CN.md)

---

## Features

- **Real-name Verification** — Users complete identity verification through a web frontend (supports ID card, passport, and other document types via plugins)
- **Minor Protection** — Automatically calculates age range from birth date and determines minor status in real-time
- **Game Account Binding** — Bind in-game UIDs to verified user accounts with a secure binding code system
- **Anti-addiction Query** — Game servers can query user verification status and age range at any time
- **Plugin System** — Extensible authentication plugins (e.g., Aliyun ID verification, face scan verification)
- **Circuit Breaker** — Configurable lockout after N failed verification attempts, admin can manually unlock
- **Admin Dashboard** — Full-featured web panel for user management, plugin configuration, and API key management
- **Self-hosted** — Single binary deployment with SQLite, no external database required

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | NestJS 12 + TypeScript (ESM) |
| Database | SQLite via TypeORM 1.1 + better-sqlite3 |
| Auth | JWT (passport-jwt) + bcrypt |
| Frontend | Vue 3 + Ant Design Vue 4 + Pinia + Vue Router (Hash mode) |
| Build | Vite 8 (frontend) + NestJS CLI (backend) |
| Lint | oxlint + Prettier |

---

## Prerequisites

- **Node.js** >= 20.0 (recommended: 22+)
- **pnpm** (or npm)
- A public domain name and reverse proxy (Nginx/Caddy) for production HTTPS

---

## Quick Start

### 1. Clone & Install

```bash
git clone <repository-url> minecraftageplatform
cd minecraftageplatform
pnpm install
cd webpanel && pnpm install && cd ..
```

### 2. Configure

```bash
cp .env.example .env
# Edit .env with your settings (see Configuration section below)
```

### 3. Build

**Windows:**
```cmd
build.cmd
```

**Linux:**
```bash
chmod +x build.sh
./build.sh
```

### 4. Run

```bash
node --env-file=.env dist/main.js
```

The server starts on the configured `PORT` (default: `3000`). Visit `http://localhost:3000` to access the web panel.

---

## Configuration

All settings are in the `.env` file (copied from `.env.example` on first build):

| Variable | Default | Description |
|----------|---------|-------------|
| `APP_URL` | `http://localhost:3000` | Public-facing URL of your MCAP instance (used in binding links) |
| `PORT` | `3000` | Port the server listens on |
| `DB_PATH` | `mcap.db` | SQLite database file path (relative to project root) |
| `JWT_SECRET` | `mcap-jwt-secret-key` | **Change this in production!** Secret key for JWT signing |

### Default Admin Account

| Username | Password | Notes |
|----------|----------|-------|
| `admin` | `mcapadmin` | First login requires password reset |

> **Important:** Change the default password and `JWT_SECRET` before deploying to production.

---

## Deployment Guides

### Windows (Manual)

1. Install [Node.js](https://nodejs.org/) (LTS recommended)
2. Clone the repository and install dependencies
3. Run `build.cmd` — it will:
   - Copy `.env.example` to `.env` if missing
   - Build the frontend (Vite)
   - Build the backend (NestJS)
   - Copy frontend assets to `dist/public/`
4. Start the server:
   ```cmd
   node --env-file=.env dist\main.js
   ```
5. (Optional) Use [PM2 for Windows](https://pm2.keymetrics.io/) or [NSSM](https://nssm.cc/) to run as a service:
   ```cmd
   nssm install MCAP "C:\path\to\node.exe" "--env-file=.env dist\main.js"
   nssm set MCAP AppDirectory "D:\minecraftageplatform"
   nssm start MCAP
   ```

### Linux CLI (Manual)

1. Install Node.js (via [NodeSource](https://github.com/nodesource/distributions) or [nvm](https://github.com/nvm-sh/nvm)):
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pnpm
   ```

2. Clone and build:
   ```bash
   git clone <repository-url> /opt/minecraftageplatform
   cd /opt/minecraftageplatform
   pnpm install
   cd webpanel && pnpm install && cd ..
   cp .env.example .env
   nano .env   # Edit configuration
   chmod +x build.sh
   ./build.sh
   ```

3. Run with PM2:
   ```bash
   sudo npm install -g pm2
   pm2 start dist/main.js --name mcap --node-args="--env-file=.env"
   pm2 save
   pm2 startup   # Auto-start on boot
   ```

4. (Recommended) Set up Nginx reverse proxy:
   ```nginx
   server {
       listen 80;
       server_name mcap.your-domain.com;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

### 1Panel (Linux)

[1Panel](https://1panel.cn/) is a modern Linux server management panel.

1. **Install 1Panel** (if not already installed):
   ```bash
   curl -sSL https://resource.fit2cloud.com/1panel/package/quick_start.sh -o quick_start.sh && sudo bash quick_start.sh
   ```

2. **Install Node.js environment** via 1Panel's App Store:
   - Go to **App Store** → search for **Node.js** → install
   - Or use 1Panel's **Runtime** → **Create Runtime** → select Node.js 22

3. **Deploy MCAP as a Node.js project**:
   - Go to **Website** → **Node Project** → **Create Node Project**
   - Project directory: upload the MCAP source to `/opt/minecraftageplatform`
   - Startup file: `dist/main.js`
   - Run command: `node --env-file=.env dist/main.js`
   - Port: `3000`

4. **Alternative: Deploy via Docker** (if using 1Panel's container management):
   - Create a `Dockerfile` in the project root:
     ```dockerfile
     FROM node:22-slim
     WORKDIR /app
     COPY package.json pnpm-lock.yaml ./
     RUN npm install -g pnpm && pnpm install --frozen-lockfile --prod
     COPY webpanel/package.json webpanel/pnpm-lock.yaml ./webpanel/
     RUN cd webpanel && pnpm install --frozen-lockfile --prod
     COPY . .
     RUN cd webpanel && npx vite build && npx nest build && \
         rm -rf /app/dist/public && cp -r webpanel/dist /app/dist/public
     EXPOSE 3000
     CMD ["node", "--env-file=.env", "dist/main.js"]
     ```
   - In 1Panel, go to **Container** → **Create Container** → use the built image
   - Map port 3000 and configure `.env` via volume mount

5. **Set up reverse proxy** in 1Panel:
   - Go to **Website** → **Create Website** → **Reverse Proxy**
   - Domain: `mcap.your-domain.com`
   - Proxy target: `http://127.0.0.1:3000`
   - Enable HTTPS with Let's Encrypt

### BT Panel / 宝塔面板 (Linux) / aaPanel

[BT Panel](https://www.bt.cn/) (aaPanel) is a popular Chinese Linux server management panel.

1. **Install BT Panel** (if not already installed):
   ```bash
   url=https://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash $url ed8484bec
   ```

2. **Install required software** via BT Panel's App Store:
   - **PM2 Manager** (Node.js version manager)
   - **Nginx** (reverse proxy)

3. **Deploy via PM2 Manager**:
   - Go to **App Store** → **PM2 Manager** → **Settings**
   - Click **Add Project**
   - Project directory: `/www/wwwroot/minecraftageplatform`
   - Startup file: `dist/main.js`
   - Project name: `mcap`
   - Run command: `node --env-file=.env dist/main.js`
   - Click **Submit**

4. **Build the project** (via SSH or BT Panel's terminal):
   ```bash
   cd /www/wwwroot/minecraftageplatform
   pnpm install
   cd webpanel && pnpm install && cd ..
   cp .env.example .env
   nano .env
   chmod +x build.sh
   ./build.sh
   # Then restart the PM2 project
   pm2 restart mcap
   ```

5. **Set up website with Nginx reverse proxy**:
   - Go to **Website** → **Add Website**
   - Domain: `mcap.your-domain.com`
   - PHP version: **Pure static** (no PHP needed)
   - After creation, go to **Settings** → **Reverse Proxy** → **Add Reverse Proxy**
   - Target URL: `http://127.0.0.1:3000`
   - Enable **SSL** with Let's Encrypt certificate

---

## Game Server Integration

MCAP provides REST APIs for game servers to integrate real-name verification and anti-addiction features.

### Quick Reference

| Endpoint | Auth | Description |
|----------|------|-------------|
| `GET /api/server/ping` | None | Health check |
| `GET /api/server/registerUserID?uid=UID&gameName=NAME` | API Key | Register a game UID and get a binding link |
| `GET /api/server/getUserInfo?uid=UID` | API Key | Query user's verification status and age range |

### Authentication

All game server APIs use API Key authentication via the `x-api-key` header:

```
x-api-key: mcap_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

API Keys can be created in the admin panel under **API Key Management**.

### Example Flow

```bash
# 1. Register a player's UID (returns a binding link)
curl -H "x-api-key: mcap_xxxx" \
  "https://mcap.example.com/api/server/registerUserID?uid=MC_10086&gameName=Steve"

# Response: { "bindLink": "https://mcap.example.com/#/user/bind-game?code=ABCD&uid=MC_10086&gameName=Steve", ... }

# 2. Send the bindLink to the player (in-game mail, chat, etc.)
# 3. Player opens the link, registers/logs in, completes real-name verification, and binds the game account

# 4. Query the player's verification status
curl -H "x-api-key: mcap_xxxx" \
  "https://mcap.example.com/api/server/getUserInfo?uid=MC_10086"

# Response: { "registered": true, "is_minor": false, "ageRange": "18+" }
```

For detailed API documentation, see [docs/API-GUIDE.md](docs/API-GUIDE.md).

---

## Plugin System

MCAP supports pluggable authentication providers. Plugins are placed in the `Plugin/` directory.

### Built-in Plugins

| Plugin | Description |
|--------|-------------|
| `basic-identity-verify` | Basic ID number format validation (offline) |
| `face-scan-verify` | Face recognition verification (placeholder) |
| `aliyun-identity-verify` | Aliyun Market ID verification API (2-factor) |

### Creating a Plugin

Create a directory under `Plugin/<your-plugin>/index.js`:

```javascript
const plugin = {
  name: 'your-plugin-name',
  is_face_scan: false,
  pluginDescription: 'Description for admins (supports HTML)',
  inputSchema: { name: 'Full Name', id_number: 'ID Number' },
  configSchema: [
    {
      key: 'apiKey',
      label: 'API Key',
      type: 'password',     // text | password | textarea
      required: true,
      placeholder: 'Enter your API key',
      description: 'Get it from the provider dashboard',
    },
  ],

  async handle(params, config) {
    // params: { name, id_number }
    // config: { apiKey: '...' } (from admin settings)
    // Return: { success: true, message: '...', isAdult: true, birthDate: 'YYYY-MM-DD' }
    // Or:     { success: false, message: 'Verification failed: ...' }
  },
};

export default plugin;
```

After adding the plugin, restart MCAP. The plugin will appear in the admin panel under **Plugin Management**, where admins can configure it and enable/disable it.

---

## Project Structure

```
minecraftageplatform/
├── src/                    # Backend source (NestJS)
│   ├── admin/              # Admin API endpoints
│   ├── auth/               # Authentication (JWT, login, register)
│   ├── common/             # Shared entities, enums, utils
│   ├── plugins/            # Plugin system (loader, config, execution)
│   ├── server/             # Game server API endpoints
│   ├── users/              # User management
│   ├── app.module.ts       # Root module
│   └── main.ts             # Entry point
├── webpanel/               # Frontend source (Vue 3)
│   └── src/
│       ├── api/            # HTTP API clients
│       ├── components/     # Shared UI components
│       ├── stores/         # Pinia stores
│       ├── views/          # Page components
│       └── router/         # Vue Router config
├── Plugin/                 # Authentication plugins
├── dist/                   # Build output
│   ├── main.js             # Compiled backend
│   └── public/             # Compiled frontend (served by backend)
├── docs/                   # Documentation
├── .env.example            # Environment config template
├── build.cmd               # Windows build script
├── build.sh                # Linux build script
└── package.json
```

---

## Development

```bash
# Install dependencies
pnpm install
cd webpanel && pnpm install && cd ..

# Start backend in dev mode (hot reload)
pnpm start:dev

# Start frontend dev server (separate terminal)
cd webpanel && npx vite

# Run tests
pnpm test
```

---

## License

Released under the [Apache License 2.0](LICENSE).

## Special Thanks

- **JetBrains WebStorm** — IDE support and open-source license
- **Qoder CN** — AI-assisted programming
