import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('_prisma_migrations')
export class PrismaMigrations {
  @PrimaryGeneratedColumn({ length: 36 })
  id: string;

  @Column({ length: 64 })
  checksum: string;

  @Column({ nullable: true })
  finished_at: string;

  @Column({ length: 255 })
  migration_name: string;

  @Column({ nullable: true })
  logs: string;

  @Column({ nullable: true })
  rolled_back_at: string;

  @Column({ default: new Date() })
  started_at: string;

  @Column({ default: 0 })
  applied_steps_count: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}