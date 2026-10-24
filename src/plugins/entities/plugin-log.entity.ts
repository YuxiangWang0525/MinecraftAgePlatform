import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('plugin_logs')
export class PluginLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  pluginName: string;

  @Column({ default: false })
  isFaceScan: boolean;

  @Column({ type: 'text', nullable: true })
  inputParams: string;

  @Column({ type: 'text', nullable: true })
  outputResult: string;

  @Column({ nullable: true })
  userId: number;

  @CreateDateColumn()
  createdAt: Date;
}
