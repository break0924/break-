import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { ChatService } from './chat.service';
import { CreateChatMessageDto } from './dto/create-chat-message.dto';

@Controller('chat/messages')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  listMessages() {
    return this.chatService.listMessages();
  }

  @Post()
  createMessage(@Body() dto: CreateChatMessageDto, @Req() request: Request) {
    return this.chatService.createMessage(dto, this.clientIp(request));
  }

  private clientIp(request: Request) {
    const forwardedFor = request.headers['x-forwarded-for'];
    if (Array.isArray(forwardedFor)) {
      return forwardedFor[0] || request.ip || 'unknown';
    }

    return forwardedFor?.split(',')[0]?.trim() || request.ip || 'unknown';
  }
}
