import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { LoginDto, RegisterDto } from './dto';

// NATS Subjects (local copy to avoid workspace dependency issues)
const NATS_SUBJECTS = {
  AUTH_LOGIN: 'auth.login',
  AUTH_REGISTER: 'auth.register',
  AUTH_REFRESH: 'auth.refresh',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_VALIDATE: 'auth.validate',
  USER_GET: 'user.get',
} as const;

interface RequestMeta {
  ipAddress: string;
  userAgent: string;
}

@Injectable()
export class AuthService {
  constructor(
    @Inject('AUTH_SERVICE') private readonly client: ClientProxy,
  ) {}

  async register(dto: RegisterDto, meta: RequestMeta) {
    return firstValueFrom(
      this.client
        .send(NATS_SUBJECTS.AUTH_REGISTER, { ...dto, ...meta })
        .pipe(timeout(5000)),
    );
  }

  async login(dto: LoginDto, meta: RequestMeta) {
    return firstValueFrom(
      this.client
        .send(NATS_SUBJECTS.AUTH_LOGIN, { ...dto, ...meta })
        .pipe(timeout(5000)),
    );
  }

  async refreshToken(refreshToken: string) {
    return firstValueFrom(
      this.client
        .send(NATS_SUBJECTS.AUTH_REFRESH, { refreshToken })
        .pipe(timeout(5000)),
    );
  }

  async logout(userId: string, refreshToken: string) {
    return firstValueFrom(
      this.client
        .send(NATS_SUBJECTS.AUTH_LOGOUT, { userId, refreshToken })
        .pipe(timeout(5000)),
    );
  }

  async validateToken(token: string) {
    return firstValueFrom(
      this.client
        .send(NATS_SUBJECTS.AUTH_VALIDATE, { token })
        .pipe(timeout(5000)),
    );
  }

  async getCurrentUser(userId: string) {
    return firstValueFrom(
      this.client
        .send(NATS_SUBJECTS.USER_GET, { userId })
        .pipe(timeout(5000)),
    );
  }

  async getSessions(userId: string) {
    return firstValueFrom(
      this.client
        .send('auth.sessions.list', { userId })
        .pipe(timeout(5000)),
    );
  }

  async revokeAllSessions(userId: string, exceptToken: string) {
    return firstValueFrom(
      this.client
        .send('auth.sessions.revoke-all', { userId, exceptToken })
        .pipe(timeout(5000)),
    );
  }
}
