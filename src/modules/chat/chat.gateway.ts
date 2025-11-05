import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway } from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Socket } from 'socket.io';
import { MessageEntity } from './entities/message.entity';

@WebSocketGateway()
export class ChatGateway {
  constructor(private readonly chatService: ChatService) {}

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { senderId: string, receiverId: string, content: string },
    @ConnectedSocket() client: Socket,
  ): Promise<MessageEntity> {
    const message = await this.chatService.saveMessage(data);

    client.broadcast.emit(`chat_${data.receiverId}`, message);

    return message;
  }
}
