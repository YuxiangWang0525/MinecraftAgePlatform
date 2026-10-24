import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PluginsService } from './plugins.service.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '../common/enums/role.enum.js';
import {
  SetPluginEnabledDto,
  SetPluginDescriptionDto,
  SetPluginConfigValuesDto,
} from './dto/plugin-config.dto.js';

@Controller('api/plugins')
export class PluginsController {
  constructor(private readonly pluginsService: PluginsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  getPlugins() {
    return this.pluginsService.getPlugins();
  }

  /** 普通用户获取已启用的插件列表（不含敏感配置） */
  @Get('enabled')
  @UseGuards(JwtAuthGuard)
  getEnabledPlugins() {
    return this.pluginsService.getEnabledPlugins();
  }

  @Get('logs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  getPluginLogs() {
    return this.pluginsService.getPluginLogs();
  }

  @Put(':name/enabled')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  setPluginEnabled(
    @Param('name') name: string,
    @Body() dto: SetPluginEnabledDto,
  ) {
    return this.pluginsService.setPluginEnabled(name, dto.enabled, dto.description);
  }

  @Put(':name/description')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  setPluginDescription(
    @Param('name') name: string,
    @Body() dto: SetPluginDescriptionDto,
  ) {
    return this.pluginsService.setPluginDescription(name, dto.description);
  }

  @Put(':name/config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  setPluginConfigValues(
    @Param('name') name: string,
    @Body() dto: SetPluginConfigValuesDto,
  ) {
    return this.pluginsService.setPluginConfigValues(name, dto.configValues);
  }

  @Post('verify')
  @UseGuards(JwtAuthGuard)
  async verify(
    @Request() req: any,
    @Body() body: { pluginName?: string; name: string; id_number: string },
  ) {
    const result = await this.pluginsService.verifyWithPlugin(
      body.pluginName,
      { name: body.name, id_number: body.id_number },
      req.user.id,
    );
    return result;
  }
}
