import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('model.script_execution_logs')
export class Model.scriptExecutionLogs {
  @Column({ nullable: false, primary: true })
  log_id: number;

  @Column()
  script_id: number;

  @Column()
  executed_at: string;

  @Column()
  script_content: string;

  @Column({ length: 50 })
  status: string;

  @Column()
  error_message: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
