import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { User } from '../user/user.entity';

@Entity()
export class Campaign {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column({ type: 'jsonb', nullable: true }) // Or string, as per requirement
  map_details: any; // Can be a more specific type if map structure is known

  @ManyToOne(() => User)
  master: User;

  @Column()
  master_id: number;
}
