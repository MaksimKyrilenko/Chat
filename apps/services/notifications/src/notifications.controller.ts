import { Controller } from '@nestjs/common';
import { MessagePattern, EventPattern, Payload } from '@nestjs/microservices';
import { NotificationsService } from './notifications.service';

// NATS Subjects (local copy)
const NATS_SUBJECTS = {
  NOTIFICATION_SEND: 'notification.send',
  NOTIFICATION_BROADCAST: 'notification.broadcast',
  NOTIFICATION_SUBSCRIBE: 'notification.subscribe',
} as const;

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @EventPattern(NATS_SUBJECTS.NOTIFICATION_SEND)
  async handleSendNotification(
    @Payload()
    data: {
      userId: string;
      type: string;
      title: string;
      body: string;
      data?: Record<string, unknown>;
    },
  ) {
    await this.notificationsService.send(data as any);
  }

  @EventPattern(NATS_SUBJECTS.NOTIFICATION_BROADCAST)
  async handleBroadcastNotification(
    @Payload()
    data: {
      userIds: string[];
      type: string;
      title: string;
      body: string;
      data?: Record<string, unknown>;
    },
  ) {
    await this.notificationsService.broadcast(data as any);
  }

  @MessagePattern(NATS_SUBJECTS.NOTIFICATION_SUBSCRIBE)
  async handleSubscribe(
    @Payload()
    data: {
      userId: string;
      endpoint: string;
      keys: { p256dh: string; auth: string };
      deviceId: string;
      deviceName: string;
    },
  ) {
    await this.notificationsService.subscribe(data.userId, {
      endpoint: data.endpoint,
      keys: data.keys,
      deviceId: data.deviceId,
      deviceName: data.deviceName,
    });
    return { success: true };
  }

  @MessagePattern('notification.unsubscribe')
  async handleUnsubscribe(
    @Payload() data: { userId: string; endpoint: string },
  ) {
    await this.notificationsService.unsubscribe(data.userId, data.endpoint);
    return { success: true };
  }

  @MessagePattern('notification.list')
  async handleGetNotifications(
    @Payload()
    data: {
      userId: string;
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
    },
  ) {
    return this.notificationsService.getNotifications(data.userId, {
      limit: data.limit,
      offset: data.offset,
      unreadOnly: data.unreadOnly,
    });
  }

  @MessagePattern('notification.read')
  async handleMarkAsRead(
    @Payload() data: { userId: string; notificationIds: string[] },
  ) {
    await this.notificationsService.markAsRead(data.userId, data.notificationIds);
    return { success: true };
  }

  @MessagePattern('notification.read-all')
  async handleMarkAllAsRead(@Payload() data: { userId: string }) {
    await this.notificationsService.markAllAsRead(data.userId);
    return { success: true };
  }

  @MessagePattern('notification.unread-count')
  async handleGetUnreadCount(@Payload() data: { userId: string }) {
    const count = await this.notificationsService.getUnreadCount(data.userId);
    return { count };
  }
}
