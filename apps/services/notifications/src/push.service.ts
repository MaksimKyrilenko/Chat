import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webPush from 'web-push';

interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{ action: string; title: string; icon?: string }>;
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

@Injectable()
export class PushService implements OnModuleInit {
  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    // Configure web-push with VAPID keys
    const vapidPublicKey = this.config.get('VAPID_PUBLIC_KEY');
    const vapidPrivateKey = this.config.get('VAPID_PRIVATE_KEY');
    const vapidSubject = this.config.get('VAPID_SUBJECT', 'mailto:admin@ultrachat.example.com');

    if (vapidPublicKey && vapidPrivateKey) {
      webPush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    }
  }

  async send(subscription: PushSubscription, payload: PushPayload): Promise<boolean> {
    try {
      await webPush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: subscription.keys,
        },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          icon: payload.icon || '/icon-192x192.png',
          badge: payload.badge || '/badge-72x72.png',
          image: payload.image,
          tag: payload.tag,
          data: payload.data,
          actions: payload.actions,
          timestamp: Date.now(),
        }),
        {
          TTL: 60 * 60 * 24, // 24 hours
          urgency: 'high',
        },
      );

      return true;
    } catch (error: any) {
      // Handle expired subscriptions
      if (error.statusCode === 410 || error.statusCode === 404) {
        // Subscription is no longer valid, should be removed
        console.log('Push subscription expired:', subscription.endpoint);
        return false;
      }

      console.error('Push notification failed:', error);
      return false;
    }
  }

  async sendToMultiple(
    subscriptions: PushSubscription[],
    payload: PushPayload,
  ): Promise<{ success: number; failed: number }> {
    const results = await Promise.all(
      subscriptions.map((sub) => this.send(sub, payload)),
    );

    return {
      success: results.filter(Boolean).length,
      failed: results.filter((r) => !r).length,
    };
  }

  // Generate VAPID keys (run once during setup)
  static generateVapidKeys(): { publicKey: string; privateKey: string } {
    return webPush.generateVAPIDKeys();
  }
}
