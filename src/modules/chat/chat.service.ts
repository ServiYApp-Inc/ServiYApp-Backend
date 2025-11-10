import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MessageEntity } from './entities/message.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Provider } from '../providers/entities/provider.entity';

type EnrichedMessage = MessageEntity & {
        sender: { type: 'user' | 'provider', data: User | Provider } | null,
        receiver: { type: 'user' | 'provider', data: User | Provider } | null,
    };

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(MessageEntity)
        private readonly messageRepository: Repository<MessageEntity>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Provider)
        private readonly providerRepository: Repository<Provider>
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
        const messages = await this.messageRepository.find({
            where: [
                { senderId, receiverId},
                { senderId: receiverId, receiverId: senderId },
            ],
            order: { time: 'ASC' },
        });

        // Buscar si es Usuario o Proveedor
        const findUserOrProvider = async (
            id: string
        ): Promise<{ type: 'user'; data: User } | { type: 'provider'; data: Provider } | null> => {
            let user = await this.userRepository.findOne({ where: { id } });
            if (user) return { type: 'user', data: user };
            let provider = await this.providerRepository.findOne({ where: { id } });
            if (provider) return { type: 'provider', data: provider };
            return null;
        }

        // Agregar info de sender y receiver
        const result: EnrichedMessage[] = [];
        for (const msg of messages) {
            const sender = await findUserOrProvider(msg.senderId);
            const receiver = await findUserOrProvider(msg.receiverId);
            result.push({
                ...msg,
                sender,
                receiver,
            });
        }
        return result;
    }
}
