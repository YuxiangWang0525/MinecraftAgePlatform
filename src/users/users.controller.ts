import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('api/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  getProfile(@Request() req: any) {
    return this.usersService.getProfile(req.user.id);
  }

  @Put('profile')
  updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  /** 查询当前用户认证熔断状态 */
  @Get('verify-status')
  getVerifyStatus(@Request() req: any) {
    return this.usersService.getVerifyStatus(req.user.id);
  }

  @Post('verify')
  verifyIdentity(
    @Request() req: any,
    @Body() body: { realName: string; idNumber: string; pluginName?: string },
  ) {
    return this.usersService.verifyIdentity(
      req.user.id,
      body.realName,
      body.idNumber,
      body.pluginName,
    );
  }
}
