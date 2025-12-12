import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { UserEntity } from './entities';

export interface TokenPayload {
  sub: string;
  email: string;
  username: string;
  type: 'access' | 'refresh';
}

@Injectable()
export class TokenService {
  private readonly jwtSecret: string;
  private readonly jwtRefreshSecret: string;
  private readonly accessTokenExpiry = '15m';
  private readonly refreshTokenExpiry = '30d';

  constructor(private readonly config: ConfigService) {
    this.jwtSecret = config.get('JWT_SECRET', 'your-super-secret-jwt-key');
    this.jwtRefreshSecret = config.get('JWT_REFRESH_SECRET', 'your-refresh-secret');
  }

  generateTokens(user: UserEntity) {
    const payload: Omit<TokenPayload, 'type'> = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    const accessToken = jwt.sign(
      { ...payload, type: 'access' },
      this.jwtSecret,
      { expiresIn: this.accessTokenExpiry },
    );

    const refreshToken = jwt.sign(
      { ...payload, type: 'refresh' },
      this.jwtRefreshSecret,
      { expiresIn: this.refreshTokenExpiry },
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
      tokenType: 'Bearer' as const,
    };
  }

  async verifyAccessToken(token: string): Promise<TokenPayload | null> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as TokenPayload;
      if (payload.type !== 'access') {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload | null> {
    try {
      const payload = jwt.verify(token, this.jwtRefreshSecret) as TokenPayload;
      if (payload.type !== 'refresh') {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  }

  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  generateRandomToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }
}
