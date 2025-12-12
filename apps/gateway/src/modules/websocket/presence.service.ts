import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

// Redis Keys (local copy)
const REDIS_KEYS = {
  USER_PRESENCE: (userId: string) => `presence:${userId}`,
  USER_SOCKETS: (userId: string) => `sockets:${userId}`,
  CHAT_TYPING: (chatId: string) => `typing:${chatId}`,
} as const;

@Injectable()
export class PresenceService {
  private readonly PRESENCE_TTL = 300; // 5 minutes

  constructor(private readonly redis: RedisService) {}

  async setOnline(userId: string): Promise<void> {
    const key = REDIS_KEYS.USER_PRESENCE(userId);
    await this.redis.hset(key, {
      status: 'online',
      lastSeen: new Date().toISOString(),
    });
    await this.redis.expire(key, this.PRESENCE_TTL);
  }

  async setOffline(userId: string): Promise<void> {
    const key = REDIS_KEYS.USER_PRESENCE(userId);
    await this.redis.hset(key, {
      status: 'offline',
      lastSeen: new Date().toISOString(),
    });
  }

  async setTyping(userId: string, chatId: string, isTyping: boolean): Promise<void> {
    const key = REDIS_KEYS.CHAT_TYPING(chatId);
    if (isTyping) {
      await this.redis.sadd(key, userId);
      await this.redis.expire(key, 10); // Auto-expire typing after 10s
    } else {
      await this.redis.srem(key, userId);
    }
  }

  async getTypingUsers(chatId: string): Promise<string[]> {
    const key = REDIS_KEYS.CHAT_TYPING(chatId);
    return this.redis.smembers(key);
  }

  async addSocket(userId: string, socketId: string): Promise<void> {
    const key = REDIS_KEYS.USER_SOCKETS(userId);
    await this.redis.sadd(key, socketId);
    await this.redis.expire(key, this.PRESENCE_TTL);
  }

  async removeSocket(userId: string, socketId: string): Promise<void> {
    const key = REDIS_KEYS.USER_SOCKETS(userId);
    await this.redis.srem(key, socketId);
  }

  async hasActiveSockets(userId: string): Promise<boolean> {
    const key = REDIS_KEYS.USER_SOCKETS(userId);
    const count = await this.redis.scard(key);
    return count > 0;
  }

  async getUserSockets(userId: string): Promise<string[]> {
    const key = REDIS_KEYS.USER_SOCKETS(userId);
    return this.redis.smembers(key);
  }

  async getPresence(userId: string): Promise<{ status: string; lastSeen: string } | null> {
    const key = REDIS_KEYS.USER_PRESENCE(userId);
    const data = await this.redis.hgetall(key);
    if (!data || Object.keys(data).length === 0) {
      return null;
    }
    return data as { status: string; lastSeen: string };
  }

  async getMultiplePresence(userIds: string[]): Promise<Map<string, { status: string; lastSeen: string }>> {
    const result = new Map();
    const pipeline = this.redis.pipeline();

    userIds.forEach((userId) => {
      pipeline.hgetall(REDIS_KEYS.USER_PRESENCE(userId));
    });

    const responses = await pipeline.exec();
    userIds.forEach((userId, index) => {
      const data = responses?.[index]?.[1];
      if (data && Object.keys(data).length > 0) {
        result.set(userId, data);
      }
    });

    return result;
  }

  async refreshPresence(userId: string): Promise<void> {
    const key = REDIS_KEYS.USER_PRESENCE(userId);
    await this.redis.expire(key, this.PRESENCE_TTL);
  }
}
