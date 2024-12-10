import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('_prisma_migrations')
export class PrismaMigrations {
  @Column({ nullable: false })
  applied_steps_count: number;

  @Column()
  finished_at: string;

  @Column()
  rolled_back_at: string;

  @Column({ nullable: false })
  started_at: string;

  @Column({ nullable: false, length: 64 })
  checksum: string;

  @Column()
  logs: string;

  @Column({ nullable: false, length: 255 })
  migration_name: string;

  @Column({ nullable: false, primary: true, length: 36 })
  id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
