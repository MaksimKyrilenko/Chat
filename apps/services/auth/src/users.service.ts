import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Not } from 'typeorm';
import { UserEntity } from './entities';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async search(query: string, currentUserId: string, limit = 20) {
    if (!query || query.length < 2) {
      return [];
    }

    const users = await this.userRepo.find({
      where: [
        { username: Like(`%${query}%`), id: Not(currentUserId) },
        { displayName: Like(`%${query}%`), id: Not(currentUserId) },
        { email: Like(`%${query}%`), id: Not(currentUserId) },
      ],
      select: ['id', 'username', 'displayName', 'avatar', 'status'],
      take: limit,
    });

    return users;
  }

  async getById(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      select: ['id', 'username', 'displayName', 'avatar', 'status', 'bio', 'lastSeen'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async getByIds(userIds: string[]) {
    if (userIds.length === 0) return [];

    return this.userRepo.find({
      where: userIds.map((id) => ({ id })),
      select: ['id', 'username', 'displayName', 'avatar', 'status'],
    });
  }

  async updateProfile(userId: string, data: { displayName?: string; bio?: string; avatar?: string }) {
    await this.userRepo.update(userId, data);
    return this.getById(userId);
  }

  async updateStatus(userId: string, status: 'online' | 'offline' | 'away' | 'dnd') {
    await this.userRepo.update(userId, { 
      status,
      lastSeen: status === 'offline' ? new Date() : undefined,
    });
  }
}
