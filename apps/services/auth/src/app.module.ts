import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { UserEntity, SessionEntity, UserSettingsEntity } from './entities';
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
        entities: [UserEntity, SessionEntity, UserSettingsEntity],
        synchronize: config.get('NODE_ENV') === 'development',
        logging: config.get('NODE_ENV') === 'development',
      }),
    }),

    TypeOrmModule.forFeature([UserEntity, SessionEntity, UserSettingsEntity]),
    RedisModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService],
})
export class AppModule {}
