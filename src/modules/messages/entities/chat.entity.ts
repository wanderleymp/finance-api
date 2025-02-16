import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    CreateDateColumn,
    OneToMany 
} from 'typeorm';
import { ChatMessage } from './chat-message.entity';
import { ChatParticipant } from './chat-participant.entity';

@Entity('chats')
export class Chat {
    @PrimaryGeneratedColumn('increment', { name: 'chat_id' })
    chatId: number;

    @Column({ 
        type: 'varchar', 
        length: 20, 
        nullable: false,
        default: 'ACTIVE',
        enum: ['ACTIVE', 'PENDING', 'CLOSED']
    })
    status: 'ACTIVE' | 'PENDING' | 'CLOSED';

    @Column({ 
        name: 'last_message_id', 
        type: 'int', 
        nullable: true 
    })
    lastMessageId?: number;

    @Column({ 
        name: 'allow_reply', 
        type: 'boolean', 
        default: true 
    })
    allowReply: boolean;

    @CreateDateColumn({ 
        name: 'created_at', 
        type: 'timestamp without time zone', 
        default: () => 'CURRENT_TIMESTAMP' 
    })
    createdAt: Date;

    @OneToMany(() => ChatMessage, message => message.chat)
    messages: ChatMessage[];

    @OneToMany(() => ChatParticipant, participant => participant.chat)
    participants: ChatParticipant[];
}
