import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity, SessionEntity, UserSettingsEntity } from './entities';
import { TokenService, TokenPayload } from './token.service';

interface RegisterData {
  email: string;
  username: string;
  password: string;
  displayName?: string;
  ipAddress: string;
  userAgent: string;
}

interface LoginData {
  email: string;
  password: string;
  deviceId?: string;
  deviceName?: string;
  ipAddress: string;
  userAgent: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(SessionEntity)
    private readonly sessionRepo: Repository<SessionEntity>,
    @InjectRepository(UserSettingsEntity)
    private readonly settingsRepo: Repository<UserSettingsEntity>,
    private readonly tokenService: TokenService,
  ) {}

  async register(data: RegisterData) {
    // Check existing user
    const existing = await this.userRepo.findOne({
      where: [{ email: data.email }, { username: data.username }],
    });

    if (existing) {
      if (existing.email === data.email) {
        throw new ConflictException('Email already registered');
      }
      throw new ConflictException('Username already taken');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = this.userRepo.create({
      email: data.email,
      username: data.username,
      displayName: data.displayName || data.username,
      password: hashedPassword,
    });

    await this.userRepo.save(user);

    // Create default settings
    const settings = this.settingsRepo.create({
      userId: user.id,
      notificationSettings: {
        pushEnabled: true,
        soundEnabled: true,
        showPreview: true,
      },
      privacySettings: {
        showOnlineStatus: true,
        showLastSeen: true,
        showReadReceipts: true,
        allowDirectMessages: 'everyone',
      },
    });

    await this.settingsRepo.save(settings);

    // Create session and tokens
    const tokens = await this.createSession(user, data);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(data: LoginData) {
    const user = await this.userRepo.findOne({
      where: { email: data.email },
      select: ['id', 'email', 'username', 'displayName', 'password', 'isBanned', 'twoFactorEnabled'],
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.isBanned) {
      throw new UnauthorizedException('Account is banned');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Create session and tokens
    const tokens = await this.createSession(user, data);

    // Update last seen
    await this.userRepo.update(user.id, { lastSeen: new Date() });

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    const payload = await this.tokenService.verifyRefreshToken(refreshToken);
    if (!payload) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Find session
    const session = await this.sessionRepo.findOne({
      where: {
        userId: payload.sub,
        isRevoked: false,
      },
    });

    if (!session || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Session expired');
    }

    // Verify token hash
    const tokenHash = this.tokenService.hashToken(refreshToken);
    if (session.refreshTokenHash !== tokenHash) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Generate new tokens
    const user = await this.userRepo.findOne({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const tokens = this.tokenService.generateTokens(user);

    // Update session
    session.refreshTokenHash = this.tokenService.hashToken(tokens.refreshToken);
    session.lastActiveAt = new Date();
    session.expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await this.sessionRepo.save(session);

    return tokens;
  }

  async logout(userId: string, refreshToken: string) {
    const tokenHash = this.tokenService.hashToken(refreshToken);

    await this.sessionRepo.update(
      { userId, refreshTokenHash: tokenHash },
      { isRevoked: true },
    );

    return { success: true };
  }

  async validateToken(token: string): Promise<TokenPayload> {
    const payload = await this.tokenService.verifyAccessToken(token);
    if (!payload) {
      throw new UnauthorizedException('Invalid token');
    }
    return payload;
  }

  async getSessions(userId: string) {
    const sessions = await this.sessionRepo.find({
      where: { userId, isRevoked: false },
      order: { lastActiveAt: 'DESC' },
    });

    return sessions.map((s) => ({
      id: s.id,
      deviceName: s.deviceName,
      ipAddress: s.ipAddress,
      lastActiveAt: s.lastActiveAt,
      createdAt: s.createdAt,
    }));
  }

  async revokeSession(userId: string, sessionId: string) {
    await this.sessionRepo.update(
      { id: sessionId, userId },
      { isRevoked: true },
    );
    return { success: true };
  }

  async revokeAllSessions(userId: string, exceptToken: string) {
    const tokenHash = this.tokenService.hashToken(exceptToken);

    await this.sessionRepo.update(
      { userId, refreshTokenHash: Not(tokenHash) },
      { isRevoked: true },
    );

    return { success: true };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'password'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.userRepo.update(userId, { password: hashedPassword });

    // Revoke all sessions
    await this.sessionRepo.update({ userId }, { isRevoked: true });

    return { success: true };
  }

  private async createSession(user: UserEntity, data: { deviceId?: string; deviceName?: string; ipAddress: string; userAgent: string }) {
    const tokens = this.tokenService.generateTokens(user);

    const session = this.sessionRepo.create({
      userId: user.id,
      deviceId: data.deviceId || uuidv4(),
      deviceName: data.deviceName || this.parseDeviceName(data.userAgent),
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      refreshTokenHash: this.tokenService.hashToken(tokens.refreshToken),
      lastActiveAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });

    await this.sessionRepo.save(session);

    return tokens;
  }

  private sanitizeUser(user: UserEntity) {
    const { password, twoFactorSecret, ...sanitized } = user;
    return sanitized;
  }

  private parseDeviceName(userAgent: string): string {
    if (userAgent.includes('Mobile')) return 'Mobile Device';
    if (userAgent.includes('Windows')) return 'Windows PC';
    if (userAgent.includes('Mac')) return 'Mac';
    if (userAgent.includes('Linux')) return 'Linux PC';
    return 'Unknown Device';
  }
}
