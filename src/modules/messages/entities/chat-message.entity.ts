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
import { Contact } from '../../contacts/entities/contact.entity';

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

    @Column({ 
        name: 'contact_id', 
        type: 'int', 
        nullable: false 
    })
    contactId: number;

    @ManyToOne(() => Chat, chat => chat.messages)
    @JoinColumn({ name: 'chat_id' })
    chat: Chat;

    @ManyToOne(() => Contact)
    @JoinColumn({ name: 'contact_id' })
    contact: Contact;

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
        type: 'varchar', 
        length: 20, 
        nullable: false,
        default: 'TEXT',
        name: 'content_type'
    })
    contentType: string;

    @Column({ 
        type: 'varchar', 
        length: 50, 
        nullable: true,
        name: 'external_id'
    })
    externalId: string;

    @Column({ 
        type: 'varchar', 
        length: 20, 
        nullable: false,
        default: 'PENDING',
        enum: ['PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED']
    })
    status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

    @Column({ 
        type: 'jsonb', 
        nullable: true,
        name: 'metadata'
    })
    metadata: Record<string, any>;

    @Column({ 
        type: 'jsonb', 
        nullable: true,
        name: 'delivery_metadata'
    })
    deliveryMetadata: Record<string, any>;

    @CreateDateColumn({ 
        name: 'created_at', 
        type: 'timestamp with time zone' 
    })
    createdAt: Date;

    @Column({ 
        name: 'updated_at', 
        type: 'timestamp with time zone',
        nullable: true
    })
    updatedAt: Date;
}
