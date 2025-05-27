import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Session } from '../session/session.entity';

export enum UserRole {
  MASTER = 'Master',
  PLAYER = 'Player',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password_hash: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.PLAYER,
  })
  role: UserRole;

  @ManyToMany(() => Session, session => session.active_players)
  sessions: Session[]; // Sessions this user is an active player in
}
