import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('payment_license_relationship')
export class PaymentLicenseRelationship {
  @PrimaryGeneratedColumn({ default: 'nextval(payment_license_relationship_payment_license_id_seq)' })
  payment_license_id: number;

  @PrimaryGeneratedColumn()
  payment_method_id: number;

  @PrimaryGeneratedColumn()
  license_id: number;

  @Column({ nullable: true, default: new Date() })
  created_at: string;

  @Column({ nullable: true, default: new Date() })
  updated_at: string;
}