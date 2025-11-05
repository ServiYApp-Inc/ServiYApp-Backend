import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageEntity } from './entities/message.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(MessageEntity)
        private readonly messageRepository: Repository<MessageEntity>,
    ) {}

    // Servicio Guardar mensajes
    async saveMessage(data: { senderId: string, receiverId: string, content: string }): Promise <MessageEntity> {
        const message = this.messageRepository.create({
            senderId: data.senderId,
            receiverId: data.receiverId,
            content: data.content,
            time: new Date()
        });

        return await this.messageRepository.save(message);
    }

    async getMessagesBetween(senderId: string, receiverId: string): Promise<MessageEntity[]> {
        return await this.messageRepository.find({
            where: [
                { senderId, receiverId},
                { senderId: receiverId, receiverId: senderId },
            ],
            order: { time: 'ASC' },
        });
    }
}
