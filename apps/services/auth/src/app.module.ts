import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { ChatsController } from './chats.controller';
import { ChatsService } from './chats.service';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserEntity, SessionEntity, UserSettingsEntity } from './entities';
import { ChatEntity, ChatMemberEntity } from '@ultrachat/database';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.get('MYSQL_HOST', 'localhost'),
        port: config.get('MYSQL_PORT', 3306),
        username: config.get('MYSQL_USER', 'ultrachat'),
        password: config.get('MYSQL_PASSWORD', 'ultrachat_pass'),
        database: config.get('MYSQL_DATABASE', 'ultrachat'),
        entities: [UserEntity, SessionEntity, UserSettingsEntity, ChatEntity, ChatMemberEntity],
        synchronize: config.get('NODE_ENV') === 'development',
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),

    TypeOrmModule.forFeature([UserEntity, SessionEntity, UserSettingsEntity, ChatEntity, ChatMemberEntity]),
    RedisModule,
  ],
  controllers: [AuthController, ChatsController, UsersController],
  providers: [AuthService, TokenService, ChatsService, UsersService],
})
export class AppModule {}
