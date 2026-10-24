import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity.js';
import { Role } from '../common/enums/role.enum.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { calculateAgeFromBirthDate } from '../common/utils/age.util.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async onModuleInit() {
    const adminExists = await this.userRepository.findOne({
      where: { username: 'admin' },
    });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('mcapadmin', 10);
      const admin = this.userRepository.create({
        username: 'admin',
        password: hashedPassword,
        role: Role.SUPER_ADMIN,
        mustResetPassword: true,
        region: 'default',
      });
      await this.userRepository.save(admin);
    }
  }

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { username: loginDto.username },
    });

    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    // 每次登录时重新判断年龄段和是否成年
    if (user.birthDate) {
      const { ageRange, isMinor } = calculateAgeFromBirthDate(user.birthDate);
      if (user.ageRange !== ageRange || user.isMinor !== isMinor) {
        user.ageRange = ageRange;
        user.isMinor = isMinor;
        await this.userRepository.save(user);
      }
    }

    const payload = { sub: user.id, username: user.username, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        mustResetPassword: user.mustResetPassword,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existing = await this.userRepository.findOne({
      where: { username: registerDto.username },
    });
    if (existing) {
      throw new ConflictException('用户名已存在');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = this.userRepository.create({
      username: registerDto.username,
      password: hashedPassword,
      region: registerDto.region,
      role: Role.USER,
    });

    await this.userRepository.save(user);

    const payload = { sub: user.id, username: user.username, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  async refreshToken(user: { id: number; username: string; role: string }) {
    const payload = { sub: user.id, username: user.username, role: user.role };
    return { access_token: this.jwtService.sign(payload) };
  }

  async resetPassword(
    userId: number,
    oldPassword: string,
    newPassword: string,
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    if (user.mustResetPassword) {
      const isOldValid = await bcrypt.compare(oldPassword, user.password);
      if (!isOldValid) {
        throw new BadRequestException('原密码错误');
      }
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.mustResetPassword = false;
    await this.userRepository.save(user);

    return { message: '密码重置成功' };
  }
}
