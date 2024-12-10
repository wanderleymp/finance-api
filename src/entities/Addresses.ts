import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('addresses')
export class Addresses {
  @PrimaryGeneratedColumn({ default: 'nextval(addresses_address_id_seq)' })
  address_id: number;

  @PrimaryGeneratedColumn()
  person_id: number;

  @Column({ length: 100 })
  street: string;

  @Column({ length: 20 })
  number: string;

  @Column({ nullable: true, length: 50 })
  complement: string;

  @Column({ nullable: true, length: 50 })
  neighborhood: string;

  @Column({ length: 50 })
  city: string;

  @Column({ length: 2 })
  state: string;

  @Column({ length: 10 })
  postal_code: string;

  @Column({ length: 50, default: 'Brasil' })
  country: string;

  @Column({ nullable: true, length: 100 })
  reference: string;

  @Column({ nullable: true })
  ibge: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}