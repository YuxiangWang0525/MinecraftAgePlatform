import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

@Entity('game_accounts')
export class GameAccount {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  uid: string;

  /** 游戏名称（由游戏服务端提供） */
  @Column({ nullable: true })
  gameName: string;

  /** 用户备注（用户可自行修改） */
  @Column({ nullable: true })
  remark: string;

  @Column({ nullable: true })
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  bindCode: string;

  @Column({ type: 'datetime', nullable: true })
  bindCodeExpiry: Date;

  @Column({ default: false })
  isBound: boolean;

  @Column({ type: 'datetime', nullable: true })
  boundAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
