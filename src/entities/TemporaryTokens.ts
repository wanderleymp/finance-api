import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('temporary_tokens')
export class TemporaryTokens {
  @Column({ nullable: false, primary: true })
  id: number;

  @Column({ nullable: false })
  generated_at: string;

  @Column({ nullable: false })
  expires_at: string;

  @Column({ nullable: false })
  credential_id: number;

  @Column()
  expires_in_seconds: number;

  @Column({ nullable: false })
  token: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
