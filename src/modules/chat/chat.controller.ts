import { Controller, Get, Query } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('messages')
  async getMessagesBetween(
    @Query('userA') userA: string,
    @Query('userB') userB: string,
  ) {
    return this.chatService.getMessagesBetween(userA, userB);
  }

  @Get('conversations')
  async getConversations(@Query('userId') userId: string) {
    return this.chatService.getConversations(userId);
  }

  
}
