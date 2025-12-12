export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface JwtPayload {
  sub: string; // userId
  email: string;
  username: string;
  iat: number;
  exp: number;
  type: 'access' | 'refresh';
}

export interface LoginDto {
  email: string;
  password: string;
  deviceId?: string;
  deviceName?: string;
}

export interface RegisterDto {
  email: string;
  username: string;
  password: string;
  displayName?: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface OAuthProvider {
  provider: 'google' | 'github' | 'apple';
  accessToken: string;
}

export interface Session {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  ipAddress: string;
  userAgent: string;
  lastActiveAt: Date;
  createdAt: Date;
  expiresAt: Date;
  isRevoked: boolean;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface TwoFactorSetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface TwoFactorVerify {
  code: string;
}
