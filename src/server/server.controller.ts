import {
  Controller,
  Get,
  Post,
  Put,
  Query,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ServerService } from './server.service.js';
import { ApiKeyGuard } from './api-key.guard.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('api/server')
export class ServerController {
  constructor(private readonly serverService: ServerService) {}

  @Get('ping')
  ping() {
    return { status: 'ok', message: 'MCAP 后端服务运行中' };
  }

  @Get('getUserInfo')
  @UseGuards(ApiKeyGuard)
  getUserInfo(@Query('uid') uid: string) {
    return this.serverService.getUserInfo(uid);
  }

  @Get('registerUserID')
  @UseGuards(ApiKeyGuard)
  registerUserID(
    @Query('uid') uid: string,
    @Query('gameName') gameName: string,
  ) {
    return this.serverService.registerUserID(uid, gameName);
  }

  @Get('bindCodeInfo')
  @UseGuards(JwtAuthGuard)
  getBindCodeInfo(@Query('code') code: string) {
    return this.serverService.getBindCodeInfo(code);
  }

  @Post('bind')
  @UseGuards(JwtAuthGuard)
  bindGameAccount(
    @Request() req: any,
    @Body() body: { bindCode: string; remark?: string },
  ) {
    return this.serverService.bindGameAccount(req.user.id, body.bindCode, body.remark);
  }

  @Get('gameAccounts')
  @UseGuards(JwtAuthGuard)
  getUserGameAccounts(@Request() req: any) {
    return this.serverService.getUserGameAccounts(req.user.id);
  }

  @Put('gameAccounts/:id/remark')
  @UseGuards(JwtAuthGuard)
  updateGameAccountRemark(
    @Request() req: any,
    @Param('id') id: string,
    @Body() body: { remark: string },
  ) {
    return this.serverService.updateGameAccountRemark(req.user.id, Number(id), body.remark);
  }
}
