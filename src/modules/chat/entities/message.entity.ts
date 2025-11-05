import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'messsage' })
export class MessageEntity {
    @PrimaryGeneratedColumn('uuid')
    id: string

    @Column({ length: 300 })
    content: string;

    @Column({ type: 'timestamp' })
    time: Date;

    @Column()
    senderId: string // Puede ser User o Provider
    
    @Column()
    receiverId: string; // Puede ser User o Provider
}
