import { Controller, Get } from '@nestjs/common';
import { AdminService } from './admin.service.js';

/**
 * 公开站点信息接口（无需认证）
 * 用于登录页等未登录场景获取站点名称和描述
 */
@Controller('api/site')
export class SiteController {
  constructor(private readonly adminService: AdminService) {}

  @Get('info')
  getSiteInfo() {
    return this.adminService.getSiteInfo();
  }
}
