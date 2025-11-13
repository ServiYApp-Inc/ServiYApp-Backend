import { Controller, Get, Query } from '@nestjs/common';
import { ChatService } from '../chat/chat.service';

@Controller('chat-control')
export class ChatControlController {
  constructor(
    private readonly chatService: ChatService,
  ) {}

  @Get('messages-between')
  async getMessagesBetween(
    @Query('senderId') senderId: string,
    @Query('receiverId') receiverId: string,
  ) {
    return await this.chatService.getMessagesBetween(senderId, receiverId);
  }

  @Get('chat-list')
  async showChatList(
    @Query('userId') userId: string,
  ) {
    return await this.chatService.showChatList(userId);
  }
}
