import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('model.db_scripts')
export class Model.dbScripts {
  @Column({ nullable: false, primary: true })
  script_id: number;

  @Column({ nullable: false })
  version_id: number;

  @Column({ nullable: false })
  execution_order: number;

  @Column()
  applied: boolean;

  @Column({ nullable: false, length: 50 })
  object_type: string;

  @Column({ nullable: false, length: 100 })
  object_name: string;

  @Column({ nullable: false })
  script_content: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
