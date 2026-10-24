import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller.js';
import { SiteController } from './site.controller.js';
import { AdminService } from './admin.service.js';
import { User } from '../users/entities/user.entity.js';
import { ApiKey } from '../server/entities/api-key.entity.js';
import { SystemSetting } from '../common/entities/system-setting.entity.js';
import { UsersModule } from '../users/users.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ApiKey, SystemSetting]),
    UsersModule,
  ],
  controllers: [AdminController, SiteController],
  providers: [AdminService],
})
export class AdminModule {}
