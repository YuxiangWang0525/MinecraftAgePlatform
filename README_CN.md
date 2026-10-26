# Minecraft Age Platform（MCAP）

> 面向 Minecraft 服务器的实名认证平台与未成年人保护管理系统。

内部代号：[Promise Makes a Home](https://endfield.wiki.gg/wiki/A_Promise_Makes_a_Home)

[English README](README.md)

---

## 功能特性

- **实名认证**——用户通过 Web 前端完成身份认证，可通过插件支持身份证、护照等多种证件类型
- **未成年人保护**——根据出生日期自动计算年龄段，实时判断用户是否成年
- **游戏账号绑定**——通过安全的绑定码机制，将游戏内 UID 绑定到已认证用户账号
- **防沉迷查询**——游戏服务端可随时查询用户的实名状态和年龄段
- **插件系统**——支持扩展认证服务，例如阿里云身份证核验、人脸识别认证
- **认证熔断**——用户认证失败达到设定次数后自动锁定，管理员可手动解除并重置计数
- **管理后台**——提供用户管理、插件配置、API Key 管理和站点设置等功能
- **自主托管**——使用 SQLite，无需独立数据库服务，可部署为单一 Node.js 应用

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | NestJS 12 + TypeScript（ESM） |
| 数据库 | SQLite + TypeORM 1.1 + better-sqlite3 |
| 身份认证 | JWT（passport-jwt）+ bcrypt |
| 前端 | Vue 3 + Ant Design Vue 4 + Pinia + Vue Router（Hash 模式） |
| 构建 | Vite 8（前端）+ NestJS CLI（后端） |
| 代码规范 | oxlint + Prettier |

---

## 环境要求

- **Node.js** >= 20.0（推荐 22 或更高版本）
- **pnpm**（也可以使用 npm）
- 生产环境建议准备域名及反向代理（Nginx/Caddy），并启用 HTTPS

---

## 快速开始

### 1. 克隆项目并安装依赖

```bash
git clone <repository-url> minecraftageplatform
cd minecraftageplatform
pnpm install
cd webpanel && pnpm install && cd ..
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 根据实际环境修改 .env，配置项见下文
```

### 3. 构建项目

**Windows：**

```cmd
build.cmd
```

**Linux：**

```bash
chmod +x build.sh
./build.sh
```

### 4. 启动服务

```bash
node --env-file=.env dist/main.js
```

服务默认监听 `6227` 端口，可通过 `.env` 中的 `PORT` 修改。访问 `http://localhost:6227` 即可打开 Web 面板。

或者使用包管理器提供的一键脚本（自动构建 + 启动）：

```bash
pnpm start:service
```

---

## 配置说明

所有环境配置均保存在 `.env` 文件中。首次执行构建脚本时，如果 `.env` 不存在，会自动从 `.env.example` 复制。

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| `APP_URL` | `http://localhost:6227` | MCAP 对外公开访问地址，用于生成游戏账号绑定链接 |
| `PORT` | `6227` | 后端服务监听端口 |
| `DB_PATH` | `mcap.db` | SQLite 数据库文件路径，相对于项目根目录 |
| `JWT_SECRET` | `mcap-jwt-secret-key` | JWT 签名密钥，**生产环境必须更换为强随机字符串** |

### 默认管理员账号

| 用户名 | 密码 | 说明 |
|--------|------|------|
| `admin` | `mcapadmin` | 首次登录需要重置密码 |

> **重要提示：** 部署到生产环境前，请务必修改默认管理员密码和 `JWT_SECRET`。

---

## 部署指南

### Docker Compose 部署（推荐）

项目根目录提供了 `docker-compose.yml`，这是**最简单、最推荐**的部署方式——一条命令即可完成镜像构建、端口映射、数据持久化、环境变量注入和健康检查。

**1. 准备配置：**

```bash
cp .env.example .env
# 编辑 .env，尤其是 JWT_SECRET（请更换为强随机字符串）
nano .env
```

**2. 启动服务：**

```bash
docker compose up -d --build
```

执行后，Docker Compose 会自动：
- 构建多阶段镜像（前后端在 builder 阶段编译完成）
- 创建命名卷 `mcap-data` 用于 SQLite 数据持久化
- 将宿主机 `6227` 端口（可通过 `.env` 中的 `PORT` 调整）映射到容器
- 以自动重启策略和健康检查启动容器

**3. 查看服务状态：**

```bash
docker compose ps
docker compose logs -f mcap
```

**4. 停止 / 重启 / 升级：**

```bash
docker compose down          # 停止并移除容器（数据卷会保留）
docker compose restart       # 重启容器
docker compose pull          # （如使用预构建镜像）拉取最新版本
docker compose up -d --build # 重新构建并重建容器
```

**5. 自定义端口或环境变量：**

直接编辑 `docker-compose.yml`，或在项目根目录的 `.env` 中覆盖变量。Compose 会自动替换 `${PORT:-6227}`、`${JWT_SECRET:-...}` 等占位。

> **提示：** 容器首次启动后，请访问 Web 面板并修改默认管理员密码（`admin` / `mcapadmin`）。

### Docker 手动部署（`docker run`）

如果不使用 Compose，也可以直接构建并运行镜像：

```bash
docker build -t mcap:latest .
docker run -d \
  --name mcap \
  -p 6227:6227 \
  -v mcap-data:/app/data \
  -e APP_URL=https://mcap.your-domain.com \
  -e JWT_SECRET=请更换为强随机字符串 \
  mcap:latest
```

数据持久化：SQLite 数据库存放在 `/app/data` 卷中。请务必挂载命名卷（或宿主机目录），避免容器重建后数据丢失。

环境变量可以通过 `-e KEY=VALUE` 传入，也可以通过挂载 `.env` 文件的方式提供：

```bash
docker run -d \
  --name mcap \
  -p 6227:6227 \
  -v mcap-data:/app/data \
  -v $(pwd)/.env:/app/.env:ro \
  mcap:latest
```

### Windows 手动部署

1. 安装 [Node.js](https://nodejs.org/)，建议使用 LTS 版本。
2. 克隆项目并安装后端、前端依赖。
3. 执行 `build.cmd`，脚本会自动完成：
   - 在 `.env` 不存在时从 `.env.example` 复制配置
   - 使用 Vite 构建前端
   - 使用 NestJS CLI 构建后端
   - 将前端构建产物复制到 `dist/public/`
4. 启动服务：

   ```cmd
   node --env-file=.env dist\main.js
   ```

5. （可选）使用 [PM2 for Windows](https://pm2.keymetrics.io/) 或 [NSSM](https://nssm.cc/) 将应用注册为后台服务。例如使用 NSSM：

   ```cmd
   nssm install MCAP "C:\path\to\node.exe" "--env-file=.env dist\main.js"
   nssm set MCAP AppDirectory "D:\minecraftageplatform"
   nssm start MCAP
   ```

### Linux CLI 手动部署

1. 通过 [NodeSource](https://github.com/nodesource/distributions) 或 [nvm](https://github.com/nvm-sh/nvm) 安装 Node.js。以下为 Ubuntu/Debian 示例：

   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt-get install -y nodejs
   sudo npm install -g pnpm
   ```

2. 克隆并构建项目：

   ```bash
   git clone <repository-url> /opt/minecraftageplatform
   cd /opt/minecraftageplatform
   pnpm install
   cd webpanel && pnpm install && cd ..
   cp .env.example .env
   nano .env   # 修改配置
   chmod +x build.sh
   ./build.sh
   ```

3. 使用 PM2 保持服务运行：

   ```bash
   sudo npm install -g pm2
   pm2 start dist/main.js --name mcap --node-args="--env-file=.env"
   pm2 save
   pm2 startup   # 配置开机自动启动
   ```

4. （推荐）配置 Nginx 反向代理：

   ```nginx
   server {
       listen 80;
       server_name mcap.your-domain.com;

       location / {
           proxy_pass http://127.0.0.1:6227;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

### 1Panel（Linux）

[1Panel](https://1panel.cn/) 是现代化的 Linux 服务器运维管理面板。

1. **安装 1Panel**（如果尚未安装）：

   ```bash
   curl -sSL https://resource.fit2cloud.com/1panel/package/quick_start.sh -o quick_start.sh && sudo bash quick_start.sh
   ```

2. **安装 Node.js 环境**：
   - 进入 **应用商店**，搜索并安装 **Node.js**；
   - 或进入 **运行环境** → **创建运行环境**，选择 Node.js 22。

3. **将 MCAP 部署为 Node.js 项目**：
   - 将 MCAP 源码上传到 `/opt/minecraftageplatform`；
   - 进入 **网站** → **Node 项目** → **创建 Node 项目**；
   - 项目目录选择 `/opt/minecraftageplatform`；
   - 启动文件填写 `dist/main.js`；
   - 启动命令设置为 `node --env-file=.env dist/main.js`；
   - 服务端口设置为 `6227`。

4. **可选：通过 Docker Compose 部署**（推荐——直接使用项目根目录的 `docker-compose.yml`）：

   ```bash
   cd /opt/minecraftageplatform
   cp .env.example .env && nano .env
   docker compose up -d --build
   ```

   在 1Panel 中进入 **容器** → **编排** → **创建编排**，指向 `/opt/minecraftageplatform/docker-compose.yml`。

5. **配置反向代理**：
   - 进入 **网站** → **创建网站** → **反向代理**；
   - 域名填写 `mcap.your-domain.com`；
   - 代理地址填写 `http://127.0.0.1:6227`；
   - 使用 Let's Encrypt 申请证书并启用 HTTPS。

### 宝塔面板（Linux）

[宝塔面板](https://www.bt.cn/) 是常用的 Linux 服务器管理面板。

1. **安装宝塔面板**（如果尚未安装）：

   ```bash
   url=https://download.bt.cn/install/install-ubuntu_6.0.sh && sudo bash $url ed8484bec
   ```

2. **通过应用商店安装所需软件**：
   - **PM2 管理器**，用于管理 Node.js 版本和项目；
   - **Nginx**，用于配置反向代理。

3. **通过 PM2 管理器部署**：
   - 将项目上传到 `/www/wwwroot/minecraftageplatform`；
   - 进入 **应用商店** → **PM2 管理器** → **设置**；
   - 点击 **添加项目**；
   - 项目目录填写 `/www/wwwroot/minecraftageplatform`；
   - 启动文件填写 `dist/main.js`；
   - 项目名称填写 `mcap`；
   - 启动命令设置为 `node --env-file=.env dist/main.js`；
   - 点击 **提交**。

4. **通过 SSH 或宝塔终端构建项目**：

   ```bash
   cd /www/wwwroot/minecraftageplatform
   pnpm install
   cd webpanel && pnpm install && cd ..
   cp .env.example .env
   nano .env
   chmod +x build.sh
   ./build.sh
   # 构建完成后重启 PM2 项目
   pm2 restart mcap
   ```

5. **配置网站和 Nginx 反向代理**：
   - 进入 **网站** → **添加站点**；
   - 域名填写 `mcap.your-domain.com`；
   - PHP 版本选择 **纯静态**，本项目不需要 PHP；
   - 创建后进入 **设置** → **反向代理** → **添加反向代理**；
   - 目标 URL 填写 `http://127.0.0.1:6227`；
   - 使用 Let's Encrypt 申请证书并启用 **SSL**。

---

## 游戏服务端接入

MCAP 为游戏服务端提供 REST API，用于接入实名认证和防沉迷功能。

### API 速查

| 接口 | 鉴权方式 | 说明 |
|------|----------|------|
| `GET /api/server/ping` | 无 | 服务健康检查 |
| `GET /api/server/registerUserID?uid=UID&gameName=NAME` | API Key | 注册游戏 UID 并获取绑定链接 |
| `GET /api/server/getUserInfo?uid=UID` | API Key | 查询用户实名状态和年龄段 |

### 鉴权方式

游戏服务端接口通过 HTTP 请求头 `x-api-key` 传递 API Key：

```text
x-api-key: mcap_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

管理员可以在后台的 **API Key 管理** 页面创建密钥。

### 接入流程示例

```bash
# 1. 注册玩家 UID，获取绑定链接
curl -H "x-api-key: mcap_xxxx" \
  "https://mcap.example.com/api/server/registerUserID?uid=MC_10086&gameName=Steve"

# 响应示例：
# { "bindLink": "https://mcap.example.com/#/user/bind-game?code=ABCD&uid=MC_10086&gameName=Steve", ... }

# 2. 将 bindLink 通过游戏内邮件、聊天等方式发送给玩家
# 3. 玩家打开链接，注册或登录账号，完成实名认证并绑定游戏账号

# 4. 查询玩家实名状态
curl -H "x-api-key: mcap_xxxx" \
  "https://mcap.example.com/api/server/getUserInfo?uid=MC_10086"

# 响应示例：{ "registered": true, "is_minor": false, "ageRange": "18+" }
```

详细接口文档请参阅 [docs/API-GUIDE.md](docs/API-GUIDE.md)。

---

## 插件系统

MCAP 支持可插拔的认证服务提供方，插件统一放置在 `Plugin/` 目录下。

### 内置插件

| 插件 | 说明 |
|------|------|
| `basic-identity-verify` | 基础身份证号格式校验，离线执行 |
| `face-scan-verify` | 人脸识别认证示例插件 |
| `aliyun-identity-verify` | 阿里云市场身份证二要素实名认证 |

### 创建插件

在 `Plugin/<your-plugin>/index.js` 中创建插件：

```javascript
const plugin = {
  name: 'your-plugin-name',
  is_face_scan: false,
  pluginDescription: '面向管理员的插件描述，支持 HTML',
  inputSchema: { name: '姓名', id_number: '证件号码' },
  configSchema: [
    {
      key: 'apiKey',
      label: 'API Key',
      type: 'password',     // text | password | textarea
      required: true,
      placeholder: '请输入 API Key',
      description: '请从认证服务商控制台获取',
    },
  ],

  async handle(params, config) {
    // params: { name, id_number }
    // config: { apiKey: '...' }，来自管理员后台配置
    // 成功返回：{ success: true, message: '...', isAdult: true, birthDate: 'YYYY-MM-DD' }
    // 失败返回：{ success: false, message: '认证失败：...' }
  },
};

export default plugin;
```

添加插件后重启 MCAP。插件会显示在管理后台的 **插件管理** 页面，管理员可以填写接口配置、设置认证描述并启用或禁用插件。

---

## 项目结构

```text
minecraftageplatform/
├── src/                    # 后端源码（NestJS）
│   ├── admin/              # 管理后台接口
│   ├── auth/               # 身份认证（JWT、登录、注册）
│   ├── common/             # 公共实体、枚举和工具
│   ├── plugins/            # 插件系统（加载、配置和执行）
│   ├── server/             # 游戏服务端 API
│   ├── users/              # 用户管理
│   ├── app.module.ts       # 根模块
│   └── main.ts             # 后端入口
├── webpanel/               # 前端源码（Vue 3）
│   └── src/
│       ├── api/            # HTTP API 客户端
│       ├── components/     # 公共 UI 组件
│       ├── stores/         # Pinia 状态管理
│       ├── views/          # 页面组件
│       └── router/         # Vue Router 配置
├── Plugin/                 # 实名认证插件
├── dist/                   # 构建产物
│   ├── main.js             # 编译后的后端
│   └── public/             # 编译后的前端，由后端托管
├── docs/                   # 项目文档
├── .env.example            # 环境配置模板
├── build.cmd               # Windows 构建脚本
├── build.sh                # Linux 构建脚本
├── Dockerfile              # 多阶段 Docker 构建文件
├── docker-compose.yml      # Docker Compose 部署（推荐）
├── .dockerignore           # Docker 构建上下文排除列表
└── package.json
```

---

## 本地开发

```bash
# 安装依赖
pnpm install
cd webpanel && pnpm install && cd ..

# 启动后端开发模式（支持热重载）
pnpm start:dev

# 在另一个终端启动前端开发服务器
cd webpanel && npx vite

# 一键构建并启动生产服务
pnpm start:service

# 运行测试
pnpm test
```

---

## 开源许可

本项目基于 [Apache License 2.0](LICENSE) 发布。

## 特别感谢

- **JetBrains WebStorm**——提供 IDE 技术支持和团队成员额外的开源许可证
- **Qoder CN**——为本项目提供 AI 辅助编程支持
