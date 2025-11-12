import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ChatControlService } from './chat-control.service';
import { ChatService } from '../chat/chat.service';
import { MessageEntity } from '../chat/entities/message.entity';
import { ChatGateway } from '../chat/chat.gateway';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/roles.enum';

@Controller('chat-control')
export class ChatControlController {
  constructor(
    private readonly chatControlService: ChatControlService,
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('messages-between')
  @Roles(Role.Admin, Role.User, Role.Provider)
  async getMessagesBetween(
    @Query('senderId') senderId: string,
    @Query('receiverId') receiverId: string,
  ) {
    return await this.chatService.getMessagesBetween(senderId, receiverId);
  }
}
