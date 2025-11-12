import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WsException } from '@nestjs/websockets';
import { ChatService } from './chat.service';
import { Socket } from 'socket.io';
import { MessageEntity } from './entities/message.entity';
import { ServiceOrdersService } from '../service-orders/service-orders.service';
import { UseFilters } from '@nestjs/common';
import { WebsocketExceptionsFilter } from './filters/websocketExceptions.filter';

@UseFilters(new WebsocketExceptionsFilter())
@WebSocketGateway({ transport: ['websocket'], cors: true })
export class ChatGateway {
  constructor(
    private readonly chatService: ChatService,
    private readonly serviceOrdersService: ServiceOrdersService,
  ) {}

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: { senderId: string, receiverId: string, content: string, serviceOrderId: string },
    @ConnectedSocket() client: Socket,
  ): Promise<MessageEntity> {
    const isValidOrder = await this.serviceOrdersService.findOne(data.serviceOrderId);
    
    if (!isValidOrder) {
      throw new WsException('La orden de servicio no existe o no es valida')
    }

    const message = await this.chatService.saveMessage(data);

    client.broadcast.emit(`chat_${data.receiverId}`, message);

    return message;
  }
}
