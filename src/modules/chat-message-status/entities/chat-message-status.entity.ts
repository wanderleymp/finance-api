import { 
    Entity, 
    Column, 
    PrimaryGeneratedColumn, 
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { ChatMessage } from '../../messages/entities/chat-message.entity';
import { Contact } from '../../contacts/entities/contact.entity';

@Entity('chat_message_status')
export class ChatMessageStatus {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'message_id' })
    messageId: number;

    @Column({ name: 'contact_id' })
    contactId: number;

    @Column({ 
        type: 'enum',
        enum: ['UNREAD', 'READ'],
        default: 'UNREAD'
    })
    status: string;

    @Column({ 
        name: 'read_at',
        type: 'timestamp',
        nullable: true 
    })
    readAt: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @ManyToOne(() => ChatMessage)
    @JoinColumn({ name: 'message_id' })
    message: ChatMessage;

    @ManyToOne(() => Contact)
    @JoinColumn({ name: 'contact_id' })
    contact: Contact;
}
