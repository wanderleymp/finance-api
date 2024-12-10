import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('integration_mappings')
export class IntegrationMappings {
  @Column({ nullable: false, primary: true })
  mapping_id: number;

  @Column()
  integration_id: number;

  @Column({ nullable: false })
  entity_id: number;

  @Column()
  external_data: any;

  @Column()
  created_at: string;

  @Column()
  updated_at: string;

  @Column()
  entity_type_id: number;

  @Column({ nullable: false, length: 50 })
  entity_type: string;

  @Column({ nullable: false, length: 255 })
  external_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
