import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { TokenPayload } from './token.service';

// NATS Subjects (local copy to avoid workspace dependency issues)
const NATS_SUBJECTS = {
  AUTH_LOGIN: 'auth.login',
  AUTH_REGISTER: 'auth.register',
  AUTH_REFRESH: 'auth.refresh',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_VALIDATE: 'auth.validate',
} as const;

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(NATS_SUBJECTS.AUTH_REGISTER)
  async register(
    @Payload()
    data: {
      email: string;
      username: string;
      password: string;
      displayName?: string;
      ipAddress: string;
      userAgent: string;
    },
  ) {
    return this.authService.register(data);
  }

  @MessagePattern(NATS_SUBJECTS.AUTH_LOGIN)
  async login(
    @Payload()
    data: {
      email: string;
      password: string;
      deviceId?: string;
      deviceName?: string;
      ipAddress: string;
      userAgent: string;
    },
  ) {
    return this.authService.login(data);
  }

  @MessagePattern(NATS_SUBJECTS.AUTH_REFRESH)
  async refresh(@Payload() data: { refreshToken: string }) {
    return this.authService.refreshToken(data.refreshToken);
  }

  @MessagePattern(NATS_SUBJECTS.AUTH_LOGOUT)
  async logout(@Payload() data: { userId: string; refreshToken: string }) {
    return this.authService.logout(data.userId, data.refreshToken);
  }

  @MessagePattern(NATS_SUBJECTS.AUTH_VALIDATE)
  async validate(@Payload() data: { token: string }): Promise<TokenPayload> {
    return this.authService.validateToken(data.token);
  }

  @MessagePattern('auth.sessions.list')
  async getSessions(@Payload() data: { userId: string }) {
    return this.authService.getSessions(data.userId);
  }

  @MessagePattern('auth.sessions.revoke')
  async revokeSession(@Payload() data: { userId: string; sessionId: string }) {
    return this.authService.revokeSession(data.userId, data.sessionId);
  }

  @MessagePattern('auth.sessions.revoke-all')
  async revokeAllSessions(
    @Payload() data: { userId: string; exceptToken: string },
  ) {
    return this.authService.revokeAllSessions(data.userId, data.exceptToken);
  }

  @MessagePattern('auth.password.change')
  async changePassword(
    @Payload()
    data: { userId: string; currentPassword: string; newPassword: string },
  ) {
    return this.authService.changePassword(
      data.userId,
      data.currentPassword,
      data.newPassword,
    );
  }
}
