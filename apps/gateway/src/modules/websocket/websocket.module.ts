import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ChatGateway } from './chat.gateway';
import { WebSocketController } from './websocket.controller';
import { PresenceService } from './presence.service';
import { RedisService } from './redis.service';
import { WsAuthGuard } from './guards/ws-auth.guard';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    ClientsModule.register([
      {
        name: 'NATS_SERVICE',
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL || 'nats://localhost:4222'],
        },
      },
    ]),
  ],
  controllers: [WebSocketController],
  providers: [ChatGateway, PresenceService, RedisService, WsAuthGuard],
  exports: [ChatGateway, PresenceService],
})
export class WebSocketModule {}
