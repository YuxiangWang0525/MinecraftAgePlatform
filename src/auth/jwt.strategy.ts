import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'mcap-jwt-secret-key',
    });
  }

  async validate(payload: { sub: number; username: string; role: string }) {
    if (!payload.sub) {
      throw new UnauthorizedException();
    }
    return { id: payload.sub, username: payload.username, role: payload.role };
  }
}
