import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessageEntity } from './entities/message.entity';
import { User } from '../users/entities/user.entity';
import { Provider } from '../providers/entities/provider.entity';


@Module({
  imports: [TypeOrmModule.forFeature([MessageEntity, User, Provider])],
  providers: [ChatGateway, ChatService],
  exports: [ChatService],
})
export class ChatModule {}
