import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'yourSecretKey', // Use environment variable in production
    });
  }

  async validate(payload: any) {
    // Align returned object with User entity shape used throughout the services
    // so `req.user.id` is available instead of `userId`.
    return { id: payload.sub, username: payload.username, role: payload.role };
  }
}
