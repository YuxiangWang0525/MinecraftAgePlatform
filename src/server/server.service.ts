import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { GameAccount } from './entities/game-account.entity.js';
import { User } from '../users/entities/user.entity.js';
import { calculateAgeFromBirthDate } from '../common/utils/age.util.js';

@Injectable()
export class ServerService {
  constructor(
    @InjectRepository(GameAccount)
    private gameAccountRepository: Repository<GameAccount>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getUserInfo(uid: string) {
    const gameAccount = await this.gameAccountRepository.findOne({
      where: { uid },
      relations: { user: true },
    });

    if (!gameAccount || !gameAccount.isBound || !gameAccount.user) {
      return {
        registered: false,
        message: '该游戏账号未绑定，请访问 /api/server/registerUserID 进行注册绑定',
      };
    }

    const user = gameAccount.user;

    // 每次获取信息时重新判断年龄段和是否成年
    if (user.birthDate) {
      const { ageRange, isMinor } = calculateAgeFromBirthDate(user.birthDate);
      if (user.ageRange !== ageRange || user.isMinor !== isMinor) {
        user.ageRange = ageRange;
        user.isMinor = isMinor;
        await this.userRepository.save(user);
      }
    }

    return {
      registered: true,
      is_minor: user.isMinor,
      ageRange: user.ageRange,
    };
  }

  async registerUserID(uid: string, gameName?: string) {
    const existing = await this.gameAccountRepository.findOne({
      where: { uid },
    });

    // UID 已绑定到用户，直接返回已绑定信息
    if (existing && existing.isBound) {
      const bindLink = `${process.env.APP_URL}/#/user/bind-game?uid=${encodeURIComponent(uid)}`;
      return {
        bindLink,
        bindCode: null,
        alreadyBound: true,
        message: '该UID已绑定到用户',
      };
    }

    // 从待用池生成一个当前未被使用的绑定码
    const bindCode = await this.generateAvailableBindCode();
    const bindCodeExpiry = new Date(Date.now() + 30 * 60 * 1000);

    let gameAccount = existing;
    if (!gameAccount) {
      gameAccount = this.gameAccountRepository.create({ uid });
    }
    gameAccount.bindCode = bindCode;
    gameAccount.bindCodeExpiry = bindCodeExpiry;
    gameAccount.isBound = false;
    if (gameName) {
      gameAccount.gameName = gameName;
    }

    await this.gameAccountRepository.save(gameAccount);

    const bindLink = `${process.env.APP_URL}/#/user/bind-game?code=${bindCode}&uid=${encodeURIComponent(uid)}${gameName ? `&gameName=${encodeURIComponent(gameName)}` : ''}`;

    return {
      bindLink,
      bindCode,
      uid,
      gameName: gameName || null,
      alreadyBound: false,
      expiresIn: '30分钟',
    };
  }

  async bindGameAccount(userId: number, bindCode: string, remark?: string) {
    // 通过绑定码查找待绑定的游戏账号
    const gameAccount = await this.gameAccountRepository.findOne({
      where: { bindCode, isBound: false },
    });

    if (!gameAccount) {
      throw new NotFoundException('绑定码无效或已被使用');
    }

    if (new Date() > gameAccount.bindCodeExpiry) {
      throw new NotFoundException('绑定码已过期');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 将游戏UID绑定到用户
    gameAccount.userId = userId;
    gameAccount.isBound = true;
    gameAccount.boundAt = new Date();
    if (remark) {
      gameAccount.remark = remark;
    }

    // 绑定完成后释放绑定码回待用池（清除临时令牌）
    gameAccount.bindCode = null as any;
    gameAccount.bindCodeExpiry = null as any;

    await this.gameAccountRepository.save(gameAccount);
    return { message: '绑定成功', uid: gameAccount.uid, gameName: gameAccount.gameName };
  }

  /**
   * 通过绑定码查询游戏账号信息（供前端绑定页面展示）
   */
  async getBindCodeInfo(bindCode: string) {
    const gameAccount = await this.gameAccountRepository.findOne({
      where: { bindCode, isBound: false },
    });

    if (!gameAccount) {
      throw new NotFoundException('绑定码无效或已被使用');
    }

    if (new Date() > gameAccount.bindCodeExpiry) {
      throw new NotFoundException('绑定码已过期');
    }

    return {
      uid: gameAccount.uid,
      gameName: gameAccount.gameName || null,
      expiresIn: Math.max(0, Math.floor((gameAccount.bindCodeExpiry.getTime() - Date.now()) / 60000)) + '分钟',
    };
  }

  /**
   * 获取用户已绑定的游戏账号列表
   */
  async getUserGameAccounts(userId: number) {
    const accounts = await this.gameAccountRepository.find({
      where: { userId, isBound: true },
      order: { boundAt: 'DESC' },
    });

    return accounts.map((a) => ({
      id: a.id,
      uid: a.uid,
      gameName: a.gameName || null,
      remark: a.remark || null,
      boundAt: a.boundAt,
    }));
  }

  /**
   * 更新游戏账号备注
   */
  async updateGameAccountRemark(userId: number, gameId: number, remark: string) {
    const account = await this.gameAccountRepository.findOne({
      where: { id: gameId, userId, isBound: true },
    });

    if (!account) {
      throw new NotFoundException('游戏账号不存在或无权操作');
    }

    account.remark = remark;
    await this.gameAccountRepository.save(account);
    return { message: '备注已更新', uid: account.uid };
  }

  /**
   * 从待用池生成一个当前未被使用的绑定码（循环复用）
   */
  private async generateAvailableBindCode(): Promise<string> {
    for (let i = 0; i < 100; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 8);
      const inUse = await this.gameAccountRepository.findOne({ where: { bindCode: code } });
      if (!inUse) {
        return code;
      }
    }
    throw new ConflictException('无法生成可用绑定码，请稍后重试');
  }
}
