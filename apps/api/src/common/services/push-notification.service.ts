import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from '../../users/users.service';

interface ExpoPushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
}

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(private readonly usersService: UsersService) {}

  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<void> {
    try {
      const user = await this.usersService.findById(userId);
      if (!user.pushToken) {
        this.logger.debug(`User ${userId} has no push token`);
        return;
      }

      await this.sendExpoPush([
        { to: user.pushToken, title, body, data },
      ]);
    } catch (err) {
      this.logger.error(`Push notification failed for user ${userId}:`, err);
    }
  }

  private async sendExpoPush(messages: ExpoPushMessage[]): Promise<void> {
    const chunks = this.chunkArray(messages, 100);

    for (const chunk of chunks) {
      try {
        const res = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chunk),
        });

        const result = await res.json();

        if (result.errors) {
          this.logger.error('Expo push errors:', result.errors);
        }
      } catch (err) {
        this.logger.error('Expo push request failed:', err);
      }
    }
  }

  private chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }
}
