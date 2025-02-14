import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    ManyToOne, 
    JoinColumn, 
    CreateDateColumn,
    Index 
} from 'typeorm';
import { Chat } from './chat.entity';

@Entity('chat_messages')
@Index('chat_messages_chat_idx', ['chat'])
export class ChatMessage {
    @PrimaryGeneratedColumn('increment', { name: 'message_id' })
    messageId: number;

    @Column({ 
        name: 'chat_id', 
        type: 'int', 
        nullable: false 
    })
    chatId: number;

    @ManyToOne(() => Chat, chat => chat.messages)
    @JoinColumn({ name: 'chat_id' })
    chat: Chat;

    @Column({ 
        type: 'varchar', 
        length: 10, 
        nullable: false,
        transformer: {
            to: (value) => value,
            from: (value) => value
        },
        enum: ['INBOUND', 'OUTBOUND']
    })
    direction: 'INBOUND' | 'OUTBOUND';

    @Column({ 
        type: 'text', 
        nullable: false 
    })
    content: string;

    @Column({ 
        type: 'jsonb', 
        nullable: true,
        default: () => "'{}'"
    })
    metadata: Record<string, any>;

    @CreateDateColumn({ 
        name: 'created_at', 
        type: 'timestamp without time zone', 
        default: () => 'CURRENT_TIMESTAMP' 
    })
    createdAt: Date;
}
