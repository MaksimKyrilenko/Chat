import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatsService } from './chats.service';
import { CreateChatDto } from './dto/create-chat.dto';

@ApiTags('Chats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('api/chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new chat' })
  async create(@Request() req: any, @Body() dto: CreateChatDto) {
    return this.chatsService.create(req.user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get user chats' })
  async findAll(@Request() req: any) {
    return this.chatsService.getUserChats(req.user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get chat by ID' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.chatsService.getChatById(id, req.user.sub);
  }
}
