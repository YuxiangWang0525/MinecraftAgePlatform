import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { CreateAdminDto } from './dto/create-admin.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { CreateApiKeyDto } from './dto/create-api-key.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { Role } from '../common/enums/role.enum.js';

@Controller('api/admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN, Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  getAllUsers() {
    return this.adminService.getAllUsers();
  }

  @Get('users/:id')
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(Number(id));
  }

  @Put('users/:id/age')
  updateUserAge(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUserAge(Number(id), dto);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(Number(id));
  }

  @Post('create')
  @Roles(Role.SUPER_ADMIN)
  createAdmin(@Body() dto: CreateAdminDto) {
    return this.adminService.createAdmin(dto);
  }

  // ===== 认证熔断管理 =====

  /** 解除用户认证熔断锁定 */
  @Post('users/:id/unlock-verify')
  unlockUserVerify(@Param('id') id: string) {
    return this.adminService.unlockUserVerify(Number(id));
  }

  /** 取消用户实名认证 */
  @Post('users/:id/revoke-verify')
  revokeUserVerify(@Param('id') id: string) {
    return this.adminService.revokeUserVerify(Number(id));
  }

  /** 获取认证熔断设置 */
  @Get('verify-settings')
  getVerifySettings() {
    return this.adminService.getVerifySettings();
  }

  /** 设置认证熔断阈值 */
  @Put('verify-settings')
  setVerifySettings(@Body() body: { maxAttempts: number }) {
    return this.adminService.setVerifySettings(body.maxAttempts);
  }

  // ===== 站点设置 =====

  /** 获取站点设置 */
  @Get('site-settings')
  getSiteSettings() {
    return this.adminService.getSiteSettings();
  }

  /** 设置站点名称和描述 */
  @Put('site-settings')
  setSiteSettings(@Body() body: { siteName: string; siteDescription: string }) {
    return this.adminService.setSiteSettings(body.siteName, body.siteDescription);
  }

  // ===== API Key 管理 =====

  @Get('api-keys')
  getAllApiKeys() {
    return this.adminService.getAllApiKeys();
  }

  @Post('api-keys')
  createApiKey(@Body() dto: CreateApiKeyDto) {
    return this.adminService.createApiKey(dto);
  }

  @Put('api-keys/:id/toggle')
  toggleApiKey(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.adminService.toggleApiKey(Number(id), body.isActive);
  }

  @Post('api-keys/:id/regenerate')
  regenerateApiKey(@Param('id') id: string) {
    return this.adminService.regenerateApiKey(Number(id));
  }

  @Delete('api-keys/:id')
  deleteApiKey(@Param('id') id: string) {
    return this.adminService.deleteApiKey(Number(id));
  }
}
