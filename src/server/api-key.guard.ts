import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from './entities/api-key.entity.js';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'] || request.headers['api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('缺少 API Key');
    }

    const keyRecord = await this.apiKeyRepository.findOne({
      where: { key: apiKey, isActive: true },
    });

    if (!keyRecord) {
      throw new UnauthorizedException('无效的 API Key');
    }

    request.apiKey = keyRecord;
    return true;
  }
}
