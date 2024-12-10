import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('db_scripts')
export class DbScripts {
  @PrimaryGeneratedColumn({ default: 'nextval(model.db_scripts_script_id_seq)' })
  script_id: number;

  @PrimaryGeneratedColumn()
  version_id: number;

  @Column({ length: 50 })
  object_type: string;

  @Column({ length: 100 })
  object_name: string;

  @Column()
  execution_order: number;

  @Column()
  script_content: string;

  @Column({ nullable: true, default: false })
  applied: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}