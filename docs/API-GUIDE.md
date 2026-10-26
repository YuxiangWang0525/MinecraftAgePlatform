# MCAP 游戏接入 API 指南

> **MCAP** — 第三方游戏服务器实名认证与未成年人管理系统  
> 本文档面向**游戏服务端开发者**，描述如何将 MCAP 接入您的游戏服务器。

---

## 目录

- [1. 系统概述](#1-系统概述)
- [2. 接入准备](#2-接入准备)
- [3. 核心流程](#3-核心流程)
- [4. API 接口详解](#4-api-接口详解)
  - [4.1 服务健康检查](#41-服务健康检查)
  - [4.2 注册游戏 UID（获取绑定链接）](#42-注册游戏-uid获取绑定链接)
  - [4.3 查询用户实名信息](#43-查询用户实名信息)
- [5. 数据模型参考](#5-数据模型参考)
- [6. 错误处理](#6-错误处理)
- [7. 最佳实践](#7-最佳实践)
- [8. 附录：Agent 指令](#8-附录agent-指令)

---

## 1. 系统概述

MCAP 为游戏服务器提供以下核心能力：

| 能力 | 说明 |
|------|------|
| **实名认证** | 用户通过 Web 前端完成实名认证（支持身份证、护照等多种插件） |
| **未成年人管理** | 系统自动根据出生日期计算年龄段，实时判断是否成年 |
| **游戏账号绑定** | 将游戏内 UID 绑定到已认证用户，建立游戏账号与真实身份的关联 |
| **防沉迷查询** | 游戏服务端可随时查询用户的实名状态和年龄段 |

### 整体架构

```
┌──────────────┐     API Key      ┌──────────────┐
│  游戏服务端   │ ◄──────────────► │  MCAP 后端    │
│  (您的服务器)  │   HTTP/JSON     │  /api/server  │
└──────┬───────┘                  └──────┬───────┘
       │                                 │
       │ 返回 bindLink                    │ 用户通过前端
       ▼                                 │ 完成实名认证
┌──────────────┐     JWT         ┌───────┴───────┐
│  游戏客户端   │ ──────────────► │  MCAP 前端     │
│  (玩家设备)   │  绑定游戏账号    │  (Web 面板)    │
└──────────────┘                 └───────────────┘
```

---

## 2. 接入准备

### 2.1 获取 API Key

1. 登录 MCAP 管理后台（`http://<mcap-host>/#/admin/login`）
2. 进入 **API Key 管理** 页面
3. 点击 **创建 API Key**，输入一个描述性名称（如 `MyGame-Production`）
4. **立即复制并安全保存**完整密钥（关闭弹窗后无法再次查看）

API Key 格式：`mcap_` + 48 位十六进制字符（共约 99 字符）

### 2.2 鉴权方式

所有游戏服务端 API 使用 **API Key 鉴权**，通过 HTTP 请求头传递：

```
Header: x-api-key: mcap_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

也支持备用头名称 `api-key`。

### 2.3 服务地址

| 环境 | 地址 |
|------|------|
| 开发环境 | `http://localhost:6227` |
| 生产环境 | 由管理员提供，格式 `https://mcap.your-domain.com` |

所有游戏服务端接口基础路径为 `/api/server`。

---

## 3. 核心流程

### 3.1 玩家首次进入游戏（绑定流程）

```
游戏服务端                          MCAP 后端                         游戏客户端/MCAP前端
    │                                  │                                  │
    │  1. GET /registerUserID          │                                  │
    │     ?uid=PLAYER_UID              │                                  │
    │     &gameName=角色名              │                                  │
    │ ───────────────────────────────► │                                  │
    │                                  │                                  │
    │  2. 返回 bindLink + bindCode     │                                  │
    │ ◄─────────────────────────────── │                                  │
    │                                  │                                  │
    │  3. 将 bindLink 发送给玩家 ─────────────────────────────────────────►│
    │     (游戏内邮件/弹窗/聊天)         │                                  │
    │                                  │                                  │
    │                                  │   4. 玩家点击链接打开 MCAP 前端    │
    │                                  │ ◄────────────────────────────────│
    │                                  │                                  │
    │                                  │   5. 玩家登录/注册并完成实名认证    │
    │                                  │ ◄────────────────────────────────│
    │                                  │                                  │
    │                                  │   6. 玩家输入绑定码确认绑定        │
    │                                  │ ◄────────────────────────────────│
    │                                  │                                  │
    │  7. 绑定完成，可查询用户信息       │                                  │
```

### 3.2 玩家登录游戏（查询流程）

```
游戏服务端                          MCAP 后端
    │                                  │
    │  1. GET /getUserInfo?uid=UID     │
    │ ───────────────────────────────► │
    │                                  │
    │  2. 返回实名状态 + 年龄段          │
    │ ◄─────────────────────────────── │
    │                                  │
    │  3. 根据结果执行防沉迷策略          │
```

### 3.3 年龄段说明

| 年龄段 | 含义 | 是否未成年 |
|--------|------|-----------|
| `4+` | 4 岁以上 | ✅ 是 |
| `8+` | 8 岁以上 | ✅ 是 |
| `12+` | 12 岁以上 | ✅ 是 |
| `16+` | 16 岁以上 | ✅ 是 |
| `18+` | 18 岁以上 | ❌ 否 |

> **重要**：系统每次查询时会重新根据出生日期计算年龄，确保年龄判断实时准确。

---

## 4. API 接口详解

### 4.1 服务健康检查

检测 MCAP 服务是否在线。

```
GET /api/server/ping
```

**鉴权**：无

**请求示例**：

```bash
curl http://localhost:6227/api/server/ping
```

**响应**：

```json
{
  "status": "ok",
  "message": "MCAP 后端服务运行中"
}
```

---

### 4.2 注册游戏 UID（获取绑定链接）

为游戏玩家 UID 发起绑定流程。系统会生成一个**绑定码**和**绑定链接**，玩家需要通过该链接完成实名认证和账号绑定。

```
GET /api/server/registerUserID?uid={uid}&gameName={gameName}
```

**鉴权**：`x-api-key` 请求头

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `uid` | string | ✅ 是 | 游戏内唯一玩家 UID |
| `gameName` | string | ❌ 否 | 游戏内角色名，用于前端展示 |

**请求示例**：

```bash
curl -H "x-api-key: mcap_xxxxxxxx" \
  "http://localhost:6227/api/server/registerUserID?uid=MC_10086&gameName=Steve"
```

**响应（首次注册，未绑定）**：

```json
{
  "bindLink": "http://localhost:6227/#/user/bind-game?code=A1B2C3D4&uid=MC_10086&gameName=Steve",
  "bindCode": "A1B2C3D4",
  "uid": "MC_10086",
  "gameName": "Steve",
  "alreadyBound": false,
  "expiresIn": "30分钟"
}
```

**响应（UID 已绑定）**：

```json
{
  "bindLink": "http://localhost:6227/#/user/bind-game?uid=MC_10086",
  "bindCode": null,
  "alreadyBound": true,
  "message": "该UID已绑定到用户"
}
```

**响应字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `bindLink` | string | 发送给玩家的绑定页面链接 |
| `bindCode` | string \| null | 8 位绑定码（已绑定时为 null） |
| `uid` | string | 游戏 UID |
| `gameName` | string \| null | 游戏角色名 |
| `alreadyBound` | boolean | 该 UID 是否已绑定到用户 |
| `expiresIn` | string | 绑定码有效期（仅未绑定时返回） |

**游戏服务端处理建议**：

1. 检查 `alreadyBound` 字段
   - `true`：该 UID 已完成绑定，可直接查询实名信息
   - `false`：将 `bindLink` 发送给玩家（游戏内邮件、弹窗等方式）
2. 绑定码有效期为 **30 分钟**，过期后需重新调用此接口
3. 绑定码采用**循环池机制**，绑定完成后自动释放回待用池

---

### 4.3 查询用户实名信息

查询已绑定 UID 对应用户的实名认证状态和年龄段。

```
GET /api/server/getUserInfo?uid={uid}
```

**鉴权**：`x-api-key` 请求头

**请求参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `uid` | string | ✅ 是 | 已绑定的游戏玩家 UID |

**请求示例**：

```bash
curl -H "x-api-key: mcap_xxxxxxxx" \
  "http://localhost:6227/api/server/getUserInfo?uid=MC_10086"
```

**响应（已绑定且已实名）**：

```json
{
  "registered": true,
  "is_minor": false,
  "ageRange": "18+"
}
```

**响应（未绑定）**：

```json
{
  "registered": false,
  "message": "该游戏账号未绑定，请访问 /api/server/registerUserID 进行注册绑定"
}
```

**响应字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| `registered` | boolean | 该 UID 是否已绑定到已认证用户 |
| `is_minor` | boolean | 用户是否为未成年人（仅 `registered=true` 时返回） |
| `ageRange` | string | 年龄段标识：`4+` / `8+` / `12+` / `16+` / `18+`（仅 `registered=true` 时返回） |

**游戏服务端防沉迷策略建议**：

```
if (!response.registered) {
    // 玩家未完成绑定 → 引导绑定或限制游玩
}

if (response.is_minor) {
    switch (response.ageRange) {
        case '4+':   // 严格限制，如每日 1 小时
        case '8+':   // 适度限制，如每日 1.5 小时
        case '12+':  // 一般限制，如每日 2 小时
        case '16+':  // 宽松限制，如每日 3 小时
    }
} else {
    // ageRange === '18+' → 无限制
}
```

---

## 5. 数据模型参考

### 用户 (User)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | number | 用户 ID |
| `username` | string | 用户名 |
| `region` | string | 所在地区 |
| `realName` | string | 真实姓名（认证后） |
| `idNumber` | string | 证件号码（认证后） |
| `birthDate` | string | 出生日期 `YYYY-MM-DD`（认证后） |
| `isVerified` | boolean | 是否已完成实名认证 |
| `isMinor` | boolean | 是否未成年 |
| `ageRange` | string | 年龄段 |

### 游戏账号 (GameAccount)

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | number | 记录 ID |
| `uid` | string | 游戏 UID（唯一） |
| `gameName` | string \| null | 游戏角色名 |
| `remark` | string \| null | 用户备注 |
| `userId` | number \| null | 绑定的用户 ID |
| `isBound` | boolean | 是否已绑定 |
| `boundAt` | datetime \| null | 绑定时间 |

---

## 6. 错误处理

### HTTP 状态码

| 状态码 | 含义 | 场景 |
|--------|------|------|
| `200` | 成功 | 正常响应 |
| `401` | 未授权 | 缺少或无效的 API Key |
| `404` | 未找到 | 绑定码无效/过期、用户不存在 |
| `409` | 冲突 | 无法生成绑定码（请稍后重试） |

### 错误响应格式

```json
{
  "statusCode": 401,
  "message": "缺少 API Key",
  "error": "Unauthorized"
}
```

### API Key 相关错误

| 场景 | 错误消息 |
|------|----------|
| 未提供 API Key | `缺少 API Key` |
| Key 无效或已禁用 | `无效的 API Key` |

---

## 7. 最佳实践

### 7.1 安全

- **API Key 安全存储**：将 API Key 存放在环境变量或密钥管理服务中，切勿硬编码在源代码中
- **HTTPS 传输**：生产环境务必使用 HTTPS，防止 API Key 在传输中被截获
- **定期轮换**：通过管理后台的「重新生成」功能定期轮换 API Key

### 7.2 性能

- **缓存策略**：`getUserInfo` 结果可在游戏服务端缓存 **5-10 分钟**，避免高频查询
- **健康检查**：启动时调用 `ping` 验证连通性，运行期间定时探测
- **重试机制**：网络异常时建议指数退避重试（最多 3 次）

### 7.3 绑定流程

- **绑定码有效期**：30 分钟，过期需重新调用 `registerUserID` 获取新码
- **循环池机制**：绑定完成后绑定码自动释放，无需手动管理
- **重复调用**：对已绑定的 UID 重复调用 `registerUserID` 会返回 `alreadyBound: true`，不会生成新绑定码
- **bindLink 分发**：建议通过游戏内邮件系统发送绑定链接，确保玩家在游戏环境中直接点击

### 7.4 防沉迷

- **实时判断**：系统每次 `getUserInfo` 都会重新计算年龄，无需担心用户年龄增长导致判断过期
- **未绑定处理**：`registered: false` 时建议限制玩家功能，引导完成绑定
- **日志记录**：建议记录每次查询结果，便于后续审计和争议处理

---

## 8. 附录：Agent 指令

> 以下指令供 AI Agent / 自动化脚本参考，用于快速集成 MCAP API。

### 快速集成指令

```
你是一名游戏服务端开发者，需要将 MCAP 实名认证系统集成到你的游戏服务器中。

## 环境信息
- MCAP 服务地址: {{MCAP_BASE_URL}}
- API Key: {{MCAP_API_KEY}}
- 游戏服务端语言: {{LANGUAGE}}  (如 Java / C# / Go / Python / Node.js)

## 任务要求

1. 实现 MCAP API 客户端封装类，包含以下方法：
   - ping() → 健康检查
   - registerUserID(uid: string, gameName?: string) → 注册 UID，获取绑定链接
   - getUserInfo(uid: string) → 查询用户实名信息和年龄段

2. 实现绑定流程：
   - 玩家首次登录时调用 registerUserID
   - 将返回的 bindLink 通过游戏内邮件/弹窗发送给玩家
   - 绑定完成后标记玩家状态为已绑定

3. 实现防沉迷逻辑：
   - 玩家每次登录时调用 getUserInfo
   - 根据 is_minor 和 ageRange 决定游戏时长限制
   - 未绑定玩家限制核心功能

4. 错误处理：
   - API Key 失效时提示管理员更换
   - 网络超时自动重试（最多 3 次，指数退避）
   - 记录所有 API 调用日志

5. 缓存策略：
   - getUserInfo 结果缓存 5 分钟
   - 缓存 key 为 uid
```

### HTTP 请求模板

```
## MCAP API 调用模板

### 健康检查
GET {{MCAP_BASE_URL}}/api/server/ping
Headers: (无)

### 注册 UID
GET {{MCAP_BASE_URL}}/api/server/registerUserID?uid={{PLAYER_UID}}&gameName={{PLAYER_NAME}}
Headers:
  x-api-key: {{MCAP_API_KEY}}

### 查询实名信息
GET {{MCAP_BASE_URL}}/api/server/getUserInfo?uid={{PLAYER_UID}}
Headers:
  x-api-key: {{MCAP_API_KEY}}
```

### 防沉迷策略配置模板

```yaml
# mcap-anti-addiction-config.yaml
mcap:
  base_url: "https://mcap.example.com"
  api_key_env: "MCAP_API_KEY"
  cache_ttl_seconds: 300
  retry:
    max_attempts: 3
    backoff_ms: [1000, 2000, 4000]

  # 年龄段 → 每日游戏时长限制（分钟），0 = 无限制
  age_limits:
    "4+":   60
    "8+":   90
    "12+":  120
    "16+":  180
    "18+":  0

  # 未绑定玩家策略
  unregistered_policy: "restrict"  # restrict | allow_with_warning

  # 禁止游玩时段（仅未成年）
  curfew:
    enabled: true
    start: "21:00"
    end: "08:00"
```

---

*文档版本：v1.0 | 最后更新：2026-10-21*
