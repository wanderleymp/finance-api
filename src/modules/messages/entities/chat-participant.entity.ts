import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    ManyToOne, 
    JoinColumn,
    CreateDateColumn 
} from 'typeorm';
import { Chat } from './chat.entity';

@Entity('chat_participants')
export class ChatParticipant {
    @PrimaryGeneratedColumn('increment', { name: 'participant_id' })
    participantId: number;

    @Column({ 
        name: 'chat_id', 
        type: 'int', 
        nullable: false 
    })
    chatId: number;

    @ManyToOne(() => Chat, chat => chat.participants)
    @JoinColumn({ name: 'chat_id' })
    chat: Chat;

    @Column({ 
        name: 'person_contact_id', 
        type: 'int', 
        nullable: false 
    })
    personContactId: number;

    @Column({ 
        type: 'varchar', 
        length: 20, 
        nullable: false,
        enum: ['OWNER', 'PARTICIPANT', 'ADMIN']
    })
    role: 'OWNER' | 'PARTICIPANT' | 'ADMIN';

    @CreateDateColumn({ 
        name: 'created_at', 
        type: 'timestamp without time zone', 
        default: () => 'CURRENT_TIMESTAMP' 
    })
    createdAt: Date;
}
