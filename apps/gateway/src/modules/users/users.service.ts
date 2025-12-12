import { Injectable, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';

@Injectable()
export class UsersService {
  constructor(
    @Inject('NATS_SERVICE') private readonly natsClient: ClientProxy,
  ) {}

  async search(query: string, userId: string, limit?: number) {
    return firstValueFrom(
      this.natsClient.send('user.search', { query, userId, limit }).pipe(timeout(5000)),
    );
  }

  async getById(userId: string) {
    return firstValueFrom(
      this.natsClient.send('user.get', { userId }).pipe(timeout(5000)),
    );
  }

  async getByIds(userIds: string[]) {
    return firstValueFrom(
      this.natsClient.send('user.getMany', { userIds }).pipe(timeout(5000)),
    );
  }

  async updateProfile(userId: string, data: { displayName?: string; bio?: string; avatar?: string }) {
    return firstValueFrom(
      this.natsClient.send('user.profile.update', { userId, ...data }).pipe(timeout(5000)),
    );
  }
}
