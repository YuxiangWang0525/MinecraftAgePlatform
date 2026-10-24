import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { User } from './entities/user.entity.js';
import { PluginsModule } from '../plugins/plugins.module.js';
import { SystemSetting } from '../common/entities/system-setting.entity.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, SystemSetting]),
    forwardRef(() => PluginsModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
