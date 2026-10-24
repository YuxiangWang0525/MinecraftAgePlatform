import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module.js';
import { UsersModule } from './users/users.module.js';
import { AdminModule } from './admin/admin.module.js';
import { ServerModule } from './server/server.module.js';
import { PluginsModule } from './plugins/plugins.module.js';
import { User } from './users/entities/user.entity.js';
import { GameAccount } from './server/entities/game-account.entity.js';
import { ApiKey } from './server/entities/api-key.entity.js';
import { PluginLog } from './plugins/entities/plugin-log.entity.js';
import { PluginConfig } from './plugins/entities/plugin-config.entity.js';
import { SystemSetting } from './common/entities/system-setting.entity.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DB_PATH || 'mcap.db',
      entities: [User, GameAccount, ApiKey, PluginLog, PluginConfig, SystemSetting],
      synchronize: true,
    }),
    AuthModule,
    UsersModule,
    AdminModule,
    ServerModule,
    PluginsModule,
  ],
})
export class AppModule {}
