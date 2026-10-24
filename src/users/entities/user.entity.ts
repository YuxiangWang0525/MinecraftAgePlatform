import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from '../../common/enums/role.enum.js';
import { AgeRange } from '../../common/enums/age-range.enum.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  region: string;

  @Column({ nullable: true })
  realName: string;

  @Column({ nullable: true })
  idNumber: string;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ nullable: true })
  birthDate: string;

  @Column({ default: true })
  isMinor: boolean;

  @Column({ type: 'varchar', default: AgeRange.FOUR_PLUS })
  ageRange: AgeRange;

  @Column({ type: 'varchar', default: Role.USER })
  role: Role;

  @Column({ default: false })
  mustResetPassword: boolean;

  /** 认证失败累计次数 */
  @Column({ default: 0 })
  verifyAttempts: number;

  /** 是否被熔断锁定（认证失败次数超过阈值后禁止继续认证） */
  @Column({ default: false })
  verifyLocked: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
