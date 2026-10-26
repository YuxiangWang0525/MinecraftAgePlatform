import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { User } from '../users/entities/user.entity.js';
import { ApiKey } from '../server/entities/api-key.entity.js';
import { SystemSetting } from '../common/entities/system-setting.entity.js';
import { Role } from '../common/enums/role.enum.js';
import { AgeRange } from '../common/enums/age-range.enum.js';
import { CreateAdminDto } from './dto/create-admin.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { CreateApiKeyDto } from './dto/create-api-key.dto.js';
import { UsersService } from '../users/users.service.js';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
    @InjectRepository(SystemSetting)
    private systemSettingRepository: Repository<SystemSetting>,
    private usersService: UsersService,
  ) {}

  async getAllUsers() {
    return this.userRepository.find({
      select: {
        id: true, username: true, region: true, isVerified: true,
        isMinor: true, ageRange: true, role: true, mustResetPassword: true,
        verifyAttempts: true, verifyLocked: true,
        createdAt: true, updatedAt: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async getUserById(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      select: {
        id: true, username: true, region: true, isVerified: true,
        isMinor: true, ageRange: true, role: true, mustResetPassword: true,
        verifyAttempts: true, verifyLocked: true,
        createdAt: true, updatedAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  async updateUserAge(id: number, dto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (dto.ageRange !== undefined) {
      const validRanges = Object.values(AgeRange);
      if (!validRanges.includes(dto.ageRange as AgeRange)) {
        throw new BadRequestException('无效的年龄段');
      }
      user.ageRange = dto.ageRange as AgeRange;
    }

    if (dto.isMinor !== undefined) {
      user.isMinor = dto.isMinor;
    }

    await this.userRepository.save(user);
    return { message: '更新成功' };
  }

  async deleteUser(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    if (user.role === Role.SUPER_ADMIN) {
      throw new BadRequestException('无法删除超级管理员');
    }
    await this.userRepository.remove(user);
    return { message: '用户已删除' };
  }

  async createAdmin(dto: CreateAdminDto) {
    const existing = await this.userRepository.findOne({
      where: { username: dto.username },
    });
    if (existing) {
      throw new ConflictException('用户名已存在');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const admin = this.userRepository.create({
      username: dto.username,
      password: hashedPassword,
      role: Role.ADMIN,
      mustResetPassword: true,
      region: 'default',
    });

    await this.userRepository.save(admin);
    return { message: '管理员创建成功' };
  }

  // ===== 认证熔断管理 =====

  /**
   * 解除用户认证熔断锁定，重置失败计数
   */
  async unlockUserVerify(userId: number) {
    await this.usersService.unlockVerify(userId);
    return { message: '已解除该用户的认证锁定，失败计数已重置' };
  }

  /**
   * 取消用户实名认证，清除所有认证信息
   */
  async revokeUserVerify(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    if (!user.isVerified) {
      throw new BadRequestException('该用户尚未完成实名认证');
    }

    await this.userRepository.update(userId, {
      isVerified: false,
      realName: undefined,
      idNumber: undefined,
      birthDate: undefined,
      isMinor: true,
      ageRange: AgeRange.FOUR_PLUS,
      verifyAttempts: 0,
      verifyLocked: false,
    });

    // Explicitly set nullable fields to null via query builder
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ realName: () => 'NULL', idNumber: () => 'NULL', birthDate: () => 'NULL' })
      .where('id = :id', { id: userId })
      .execute();

    return { message: '已取消该用户的实名认证' };
  }

  /**
   * 获取当前熔断阈值设置
   */
  async getVerifySettings() {
    const maxAttempts = await this.usersService.getMaxVerifyAttempts();
    return { maxAttempts };
  }

  /**
   * 设置熔断阈值
   */
  async setVerifySettings(maxAttempts: number) {
    if (maxAttempts < 0) {
      throw new BadRequestException('阈值不能为负数');
    }
    await this.usersService.setMaxVerifyAttempts(maxAttempts);
    return {
      message: maxAttempts === 0
        ? '已关闭认证熔断（不限制失败次数）'
        : `认证熔断阈值已设置为 ${maxAttempts} 次`,
    };
  }

  // ===== 站点设置 =====

  /**
   * 获取站点设置（公开信息）
   */
  async getSiteInfo(): Promise<{ siteName: string; siteDescription: string }> {
    const nameSetting = await this.systemSettingRepository.findOne({ where: { key: 'site_name' } });
    const descSetting = await this.systemSettingRepository.findOne({ where: { key: 'site_description' } });
    return {
      siteName: nameSetting?.value || 'MCAP 实名认证系统',
      siteDescription: descSetting?.value || '',
    };
  }

  /**
   * 获取站点设置（管理员）
   */
  async getSiteSettings(): Promise<{ siteName: string; siteDescription: string }> {
    return this.getSiteInfo();
  }

  /**
   * 设置站点名称和描述
   */
  async setSiteSettings(siteName: string, siteDescription: string) {
    const upsert = async (key: string, value: string) => {
      let setting = await this.systemSettingRepository.findOne({ where: { key } });
      if (!setting) {
        setting = this.systemSettingRepository.create({ key, value });
      } else {
        setting.value = value;
      }
      await this.systemSettingRepository.save(setting);
    };

    await upsert('site_name', siteName);
    await upsert('site_description', siteDescription);
    return { message: '站点设置已保存' };
  }

  // ===== API Key 管理 =====

  async getAllApiKeys() {
    return this.apiKeyRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async createApiKey(dto: CreateApiKeyDto) {
    const key = this.generateApiKey();
    const apiKey = this.apiKeyRepository.create({
      key,
      name: dto.name,
      isActive: true,
    });
    await this.apiKeyRepository.save(apiKey);
    return { id: apiKey.id, key, name: apiKey.name, isActive: true, createdAt: apiKey.createdAt };
  }

  async toggleApiKey(id: number, isActive: boolean) {
    const apiKey = await this.apiKeyRepository.findOne({ where: { id } });
    if (!apiKey) {
      throw new NotFoundException('API Key 不存在');
    }
    apiKey.isActive = isActive;
    await this.apiKeyRepository.save(apiKey);
    return { message: `API Key 已${isActive ? '启用' : '禁用'}` };
  }

  async deleteApiKey(id: number) {
    const apiKey = await this.apiKeyRepository.findOne({ where: { id } });
    if (!apiKey) {
      throw new NotFoundException('API Key 不存在');
    }
    await this.apiKeyRepository.remove(apiKey);
    return { message: 'API Key 已删除' };
  }

  async regenerateApiKey(id: number) {
    const apiKey = await this.apiKeyRepository.findOne({ where: { id } });
    if (!apiKey) {
      throw new NotFoundException('API Key 不存在');
    }
    const newKey = this.generateApiKey();
    apiKey.key = newKey;
    await this.apiKeyRepository.save(apiKey);
    return { id: apiKey.id, key: newKey, name: apiKey.name };
  }

  private generateApiKey(): string {
    return 'mcap_' + crypto.randomBytes(24).toString('hex');
  }
}
