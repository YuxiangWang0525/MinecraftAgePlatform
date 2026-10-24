import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('plugin_configs')
export class PluginConfig {
  @PrimaryGeneratedColumn()
  id: number;

  /** 插件名称，与加载的插件 name 对应 */
  @Column({ unique: true })
  name: string;

  /** 是否启用 */
  @Column({ default: false })
  enabled: boolean;

  /** 认证描述，说明接受的证件类型（如身份证、护照等），面向用户展示 */
  @Column({ type: 'text', nullable: true })
  description: string;

  /** 插件描述，说明认证服务由谁提供、可含链接，面向管理员展示 */
  @Column({ type: 'text', nullable: true })
  pluginDescription: string;

  /** 是否人脸识别 */
  @Column({ default: false })
  isFaceScan: boolean;

  /** 管理员配置值（JSON），如 { appCode: "xxx" } */
  @Column({ type: 'text', nullable: true })
  configValues: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
