import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('script_execution_logs')
export class ScriptExecutionLogs {
  @PrimaryGeneratedColumn({ default: 'nextval(model.script_execution_logs_log_id_seq)' })
  log_id: number;

  @PrimaryGeneratedColumn({ nullable: true })
  script_id: number;

  @Column({ nullable: true })
  script_content: string;

  @Column({ nullable: true, default: new Date() })
  executed_at: Date;

  @Column({ nullable: true, length: 50 })
  status: string;

  @Column({ nullable: true })
  error_message: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}