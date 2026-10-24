import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PluginsController } from './plugins.controller.js';
import { PluginsService } from './plugins.service.js';
import { PluginLog } from './entities/plugin-log.entity.js';
import { PluginConfig } from './entities/plugin-config.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([PluginLog, PluginConfig])],
  controllers: [PluginsController],
  providers: [PluginsService],
  exports: [PluginsService],
})
export class PluginsModule {}
