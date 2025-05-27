import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { Campaign } from '../campaign/campaign.entity';
import { User, UserRole } from '../user/user.entity';

export enum SessionStatus {
  PENDING = 'Pending',
  ACTIVE = 'Active',
  ENDED = 'Ended',
}

@Entity()
export class Session {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToOne(() => Campaign, { onDelete: 'CASCADE' }) // If a campaign is deleted, its sessions are also deleted.
  campaign: Campaign;

  @Column()
  campaign_id: number;

  @ManyToOne(() => User) // The master who owns/runs the session
  master: User;

  @Column()
  master_id: number;

  @Column({
    type: 'enum',
    enum: SessionStatus,
    default: SessionStatus.PENDING,
  })
  status: SessionStatus;

  @ManyToMany(() => User, user => user.sessions)
  @JoinTable({
    name: 'session_players', // name of the join table
    joinColumn: { name: 'session_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  active_players: User[];
}
