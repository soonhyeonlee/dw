import { Module, Global } from '@nestjs/common';
import { PushNotificationService } from './services/push-notification.service';
import { UsersModule } from '../users/users.module';

@Global()
@Module({
  imports: [UsersModule],
  providers: [PushNotificationService],
  exports: [PushNotificationService],
})
export class CommonModule {}
