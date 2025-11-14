import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageEntity } from './entities/message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(MessageEntity)
    private readonly messageRepo: Repository<MessageEntity>,
  ) {}

  async saveMessage(data: {
    senderId: string;
    receiverId: string;
    content: string;
  }) {
    const message = this.messageRepo.create(data);
    return this.messageRepo.save(message);
  }

  async getMessagesBetween(userA: string, userB: string) {
    return await this.messageRepo.find({
      where: [
        { senderId: userA, receiverId: userB },
        { senderId: userB, receiverId: userA },
      ],
      order: { time: 'ASC' },
    });
  }

  async getConversations(userId: string) {
    // 1. Obtener mensajes donde el usuario participa
    const messages = await this.messageRepo.find({
      where: [{ senderId: userId }, { receiverId: userId }],
      order: { time: 'DESC' },
    });

    // 2. Agrupar por la otra persona
    const conversations: Record<string, any> = {};

    for (const msg of messages) {
      const other = msg.senderId === userId ? msg.receiverId : msg.senderId;

      // si ya existe, solo saltar (ya tenemos el más reciente)
      if (!conversations[other]) {
        conversations[other] = {
          userId: other,
          lastMessage: msg.content,
          time: msg.time,
        };
      }
    }

    // retorna como lista ordenada
    return Object.values(conversations);
  }
}
