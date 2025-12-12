import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { FilesService, FileDocument } from './files.service';

// NATS Subjects (local copy)
const NATS_SUBJECTS = {
  FILE_UPLOAD_URL: 'file.upload.url',
  FILE_UPLOAD_COMPLETE: 'file.upload.complete',
  FILE_GET: 'file.get',
  FILE_DELETE: 'file.delete',
} as const;

@Controller()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @MessagePattern(NATS_SUBJECTS.FILE_UPLOAD_URL)
  async getUploadUrl(
    @Payload()
    data: {
      userId: string;
      filename: string;
      mimeType: string;
      size: number;
    },
  ) {
    return this.filesService.getUploadUrl(
      data.userId,
      data.filename,
      data.mimeType,
      data.size,
    );
  }

  @MessagePattern(NATS_SUBJECTS.FILE_UPLOAD_COMPLETE)
  async completeUpload(
    @Payload()
    data: {
      uploadId: string;
      chatId?: string;
    },
  ): Promise<FileDocument> {
    return this.filesService.completeUpload(data.uploadId, data.chatId);
  }

  @MessagePattern(NATS_SUBJECTS.FILE_GET)
  async getFile(@Payload() data: { fileId: string }): Promise<FileDocument | null> {
    return this.filesService.getFile(data.fileId);
  }

  @MessagePattern(NATS_SUBJECTS.FILE_DELETE)
  async deleteFile(@Payload() data: { fileId: string; userId: string }): Promise<void> {
    return this.filesService.deleteFile(data.fileId, data.userId);
  }

  @MessagePattern('file.list.chat')
  async getFilesByChat(@Payload() data: { chatId: string; limit?: number }): Promise<FileDocument[]> {
    return this.filesService.getFilesByChat(data.chatId, data.limit);
  }
}
