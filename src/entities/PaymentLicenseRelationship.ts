import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('payment_license_relationship')
export class PaymentLicenseRelationship {
  @Column({ nullable: false, primary: true })
  payment_license_id: number;

  @Column({ nullable: false })
  payment_method_id: number;

  @Column({ nullable: false })
  license_id: number;

  @Column()
  created_at: string;

  @Column()
  updated_at: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
