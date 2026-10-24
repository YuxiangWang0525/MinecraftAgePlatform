import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { PluginsService } from '../plugins/plugins.service.js';
import { calculateAgeFromBirthDate } from '../common/utils/age.util.js';
import { SystemSetting } from '../common/entities/system-setting.entity.js';

/** 默认熔断阈值（认证失败次数上限），0 表示不限制 */
const DEFAULT_MAX_VERIFY_ATTEMPTS = 5;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(SystemSetting)
    private systemSettingRepository: Repository<SystemSetting>,
    private pluginsService: PluginsService,
  ) {}

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: {
        id: true, username: true, region: true, isVerified: true,
        isMinor: true, ageRange: true, role: true, createdAt: true, updatedAt: true,
        verifyAttempts: true, verifyLocked: true,
      },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return user;
  }

  /**
   * 获取用户认证熔断状态
   */
  async getVerifyStatus(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: { isVerified: true, verifyAttempts: true, verifyLocked: true },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    const maxAttempts = await this.getMaxVerifyAttempts();
    return {
      isVerified: user.isVerified,
      verifyLocked: user.verifyLocked,
      verifyAttempts: user.verifyAttempts,
      maxAttempts,
      remaining: maxAttempts > 0 ? Math.max(0, maxAttempts - user.verifyAttempts) : null,
    };
  }

  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (dto.username && dto.username !== user.username) {
      const existing = await this.userRepository.findOne({
        where: { username: dto.username },
      });
      if (existing) {
        throw new ConflictException('用户名已存在');
      }
      user.username = dto.username;
    }

    if (dto.region !== undefined) {
      user.region = dto.region;
    }

    await this.userRepository.save(user);
    return this.getProfile(userId);
  }

  /**
   * 重新根据 birthDate 评估用户年龄段和是否成年
   */
  async reevaluateAge(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user || !user.birthDate) return;

    const { ageRange, isMinor } = calculateAgeFromBirthDate(user.birthDate);
    if (user.ageRange !== ageRange || user.isMinor !== isMinor) {
      user.ageRange = ageRange;
      user.isMinor = isMinor;
      await this.userRepository.save(user);
    }
  }

  async verifyIdentity(
    userId: number,
    realName: string,
    idNumber: string,
    pluginName?: string,
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 熔断检查：如果用户已被锁定，拒绝认证
    if (user.verifyLocked) {
      throw new BadRequestException('您的认证已被锁定，请联系管理员解除锁定后再试');
    }

    const maxAttempts = await this.getMaxVerifyAttempts();

    // 熔断检查：如果失败次数已达上限，锁定用户
    if (maxAttempts > 0 && user.verifyAttempts >= maxAttempts) {
      user.verifyLocked = true;
      await this.userRepository.save(user);
      throw new BadRequestException('认证失败次数已达上限，已被锁定，请联系管理员解除锁定');
    }

    const result = await this.pluginsService.verifyWithPlugin(
      pluginName,
      { name: realName, id_number: idNumber },
      userId,
    );

    if (result.success !== false) {
      user.realName = realName;
      user.idNumber = idNumber;
      user.isVerified = true;
      // 认证成功后重置失败计数
      user.verifyAttempts = 0;

      // 如果插件返回了出生年月，则保存并计算年龄段和是否成年
      if (result.birthDate) {
        user.birthDate = result.birthDate;
        const { ageRange, isMinor } = calculateAgeFromBirthDate(result.birthDate);
        user.ageRange = ageRange;
        user.isMinor = isMinor;
      }

      await this.userRepository.save(user);
    } else {
      // 认证失败，累计失败次数
      user.verifyAttempts += 1;

      // 检查是否达到熔断阈值
      if (maxAttempts > 0 && user.verifyAttempts >= maxAttempts) {
        user.verifyLocked = true;
        await this.userRepository.save(user);
        return {
          ...result,
          message: `认证失败，已达失败次数上限（${maxAttempts} 次），已被锁定，请联系管理员`,
        };
      }

      await this.userRepository.save(user);
      const remaining = maxAttempts > 0 ? maxAttempts - user.verifyAttempts : null;
      return {
        ...result,
        remaining,
        message: remaining !== null
          ? `${result.message}（剩余 ${remaining} 次机会）`
          : result.message,
      };
    }

    return result;
  }

  /**
   * 获取熔断阈值（从系统设置中读取，不存在则返回默认值）
   */
  async getMaxVerifyAttempts(): Promise<number> {
    const setting = await this.systemSettingRepository.findOne({
      where: { key: 'max_verify_attempts' },
    });
    if (!setting) return DEFAULT_MAX_VERIFY_ATTEMPTS;
    const val = parseInt(setting.value, 10);
    return isNaN(val) ? DEFAULT_MAX_VERIFY_ATTEMPTS : val;
  }

  /**
   * 设置熔断阈值
   */
  async setMaxVerifyAttempts(maxAttempts: number): Promise<void> {
    let setting = await this.systemSettingRepository.findOne({
      where: { key: 'max_verify_attempts' },
    });
    if (!setting) {
      setting = this.systemSettingRepository.create({
        key: 'max_verify_attempts',
        value: String(maxAttempts),
      });
    } else {
      setting.value = String(maxAttempts);
    }
    await this.systemSettingRepository.save(setting);
  }

  /**
   * 解除用户认证熔断锁定，同时重置失败计数
   */
  async unlockVerify(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    user.verifyLocked = false;
    user.verifyAttempts = 0;
    await this.userRepository.save(user);
  }
}
