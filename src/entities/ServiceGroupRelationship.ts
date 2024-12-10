import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('service_group_relationship')
export class ServiceGroupRelationship {
  @Column({ nullable: false, primary: true })
  service_group_relationship_id: number;

  @Column({ nullable: false })
  service_group_id: number;

  @Column()
  created_at: string;

  @Column()
  updated_at: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
