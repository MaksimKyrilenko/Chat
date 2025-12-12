import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MessagesService } from './messages.service';

@ApiTags('Messages')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/chats/:chatId/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @ApiOperation({ summary: 'Get chat messages' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'before', required: false, description: 'Message ID for pagination' })
  async getMessages(
    @Request() req: any,
    @Param('chatId') chatId: string,
    @Query('limit') limit?: number,
    @Query('before') before?: string,
  ) {
    return this.messagesService.getMessages(chatId, req.user.sub, { limit, before });
  }

  @Get('pinned')
  @ApiOperation({ summary: 'Get pinned messages' })
  async getPinnedMessages(
    @Request() req: any,
    @Param('chatId') chatId: string,
  ) {
    return this.messagesService.getPinnedMessages(chatId, req.user.sub);
  }
}
