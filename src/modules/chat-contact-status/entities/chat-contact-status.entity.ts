import { 
    Entity, 
    Column, 
    PrimaryGeneratedColumn, 
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique
} from 'typeorm';
import { Chat } from '../../chats/entities/chat.entity';
import { Contact } from '../../contacts/entities/contact.entity';

@Entity('chat_contact_status')
@Unique(['chatId', 'contactId']) // Garante que cada contato tenha apenas um status por chat
export class ChatContactStatus {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'chat_id' })
    chatId: number;

    @Column({ name: 'contact_id' })
    contactId: number;

    @Column({ 
        name: 'is_online',
        type: 'boolean',
        default: false
    })
    isOnline: boolean;

    @Column({ 
        name: 'is_typing',
        type: 'boolean',
        default: false
    })
    isTyping: boolean;

    @Column({ 
        name: 'last_seen',
        type: 'timestamp',
        nullable: true 
    })
    lastSeen: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @ManyToOne(() => Chat)
    @JoinColumn({ name: 'chat_id' })
    chat: Chat;

    @ManyToOne(() => Contact)
    @JoinColumn({ name: 'contact_id' })
    contact: Contact;
}
