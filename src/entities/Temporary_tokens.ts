import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('temporary_tokens')
export class TemporaryTokens {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  token: string;

  @Column({ default: new Date() })
  generated_at: Date;

  @Column()
  expires_at: Date;

  @PrimaryGeneratedColumn()
  credential_id: number;

  @Column({ nullable: true })
  expires_in_seconds: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}