import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get('MONGODB_URI', 'mongodb://localhost:27017/ultrachat'),
      }),
    }),

    MongooseModule.forFeature([
      {
        name: 'File',
        schema: {
          userId: { type: String, required: true, index: true },
          filename: { type: String, required: true },
          originalName: { type: String, required: true },
          mimeType: { type: String, required: true },
          size: { type: Number, required: true },
          bucket: { type: String, required: true },
          path: { type: String, required: true },
          url: { type: String, default: '' },
          thumbnailUrl: { type: String },
          metadata: { type: Object, default: {} },
          chatId: { type: String, index: true },
          messageId: { type: String },
          isProcessed: { type: Boolean, default: false },
          createdAt: { type: Date, default: Date.now },
        },
      },
    ]),
  ],
  controllers: [FilesController],
  providers: [FilesService],
})
export class AppModule {}
