import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServerController } from './server.controller.js';
import { ServerService } from './server.service.js';
import { ApiKeyGuard } from './api-key.guard.js';
import { GameAccount } from './entities/game-account.entity.js';
import { ApiKey } from './entities/api-key.entity.js';
import { User } from '../users/entities/user.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([GameAccount, ApiKey, User])],
  controllers: [ServerController],
  providers: [ServerService, ApiKeyGuard],
  exports: [ServerService],
})
export class ServerModule {}
