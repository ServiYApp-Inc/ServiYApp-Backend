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

  // 🟣 GUARDAR MENSAJE
  async saveMessage(data: {
    senderId: string;
    receiverId: string;
    content: string;
  }) {
    const msg = this.messageRepo.create({
      ...data,
      delivered: false,
      read: false,
    });

    return await this.messageRepo.save(msg);
  }

  // 🟣 HISTORIAL COMPLETO ENTRE DOS USUARIOS
  async getMessagesBetween(userA: string, userB: string) {
    return await this.messageRepo.find({
      where: [
        { senderId: userA, receiverId: userB },
        { senderId: userB, receiverId: userA },
      ],
      order: { time: 'ASC' },
    });
  }

  // 🟣 LISTA DE CONVERSACIONES (INBOX)
  async getConversations(userId: string) {
    const messages = await this.messageRepo.find({
      where: [{ senderId: userId }, { receiverId: userId }],
      order: { time: 'DESC' },
    });

    const conv: Record<string, any> = {};

    for (const msg of messages) {
      const other = msg.senderId === userId ? msg.receiverId : msg.senderId;

      if (!conv[other]) {
        conv[other] = {
          userId: other,
          lastMessage: msg.content,
          time: msg.time,
          read: msg.read,
        };
      }
    }

    return Object.values(conv);
  }

  // 🟩 ENTREGADO
  async markAsDelivered(messageId: string) {
    await this.messageRepo.update(messageId, { delivered: true });
  }

  // 🟩 LEÍDO UNO
  async markAsRead(messageId: string) {
    await this.messageRepo.update(messageId, { read: true, delivered: true });
  }

  // 🟩 LEER TODOS
  async markAllAsRead(senderId: string, receiverId: string) {
    await this.messageRepo.update(
      { senderId, receiverId, read: false },
      { read: true, delivered: true },
    );
  }
}
