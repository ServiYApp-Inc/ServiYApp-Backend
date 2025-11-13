import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageEntity } from './entities/message.entity';
import { User } from '../users/entities/user.entity';
import { Provider } from '../providers/entities/provider.entity';
import { ServiceOrder } from '../service-orders/entities/service-order.entity';
import { ServiceOrdersModule } from '../service-orders/service-orders.module';


@Module({
  imports: [TypeOrmModule.forFeature([MessageEntity, User, Provider, ServiceOrder]), ServiceOrdersModule],
  providers: [ChatGateway, ChatService],
  exports: [ChatService],
})
export class ChatModule {}
