import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ChatControlService } from './chat-control.service';
import { ChatService } from '../chat/chat.service';
import { MessageEntity } from '../chat/entities/message.entity';
import { ChatGateway } from '../chat/chat.gateway';

@Controller('chat-control')
export class ChatControlController {
  constructor(
    private readonly chatControlService: ChatControlService,
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Get('messages-between')
  async getMessagesBetween(
    @Query('senderId') senderId: string,
    @Query('receiverId') receiverId: string,
  ) {
    return await this.chatService.getMessagesBetween(senderId, receiverId);
  }
}
