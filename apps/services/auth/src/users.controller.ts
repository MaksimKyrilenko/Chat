import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @MessagePattern('user.search')
  async searchUsers(
    @Payload() data: { query: string; userId: string; limit?: number },
  ) {
    return this.usersService.search(data.query, data.userId, data.limit);
  }

  @MessagePattern('user.get')
  async getUser(@Payload() data: { userId: string }) {
    return this.usersService.getById(data.userId);
  }

  @MessagePattern('user.getMany')
  async getUsers(@Payload() data: { userIds: string[] }) {
    return this.usersService.getByIds(data.userIds);
  }

  @MessagePattern('user.profile.update')
  async updateProfile(
    @Payload()
    data: {
      userId: string;
      displayName?: string;
      bio?: string;
      avatar?: string;
    },
  ) {
    const { userId, ...updateData } = data;
    return this.usersService.updateProfile(userId, updateData);
  }

  @MessagePattern('user.status.update')
  async updateStatus(
    @Payload() data: { userId: string; status: 'online' | 'offline' | 'away' | 'dnd' },
  ) {
    return this.usersService.updateStatus(data.userId, data.status);
  }
}
