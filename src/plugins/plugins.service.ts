import { Injectable, OnModuleInit, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';
import { AuthPlugin, AuthPluginInput, AuthPluginResult, ConfigSchemaItem } from './plugin.interface.js';
import { PluginLog } from './entities/plugin-log.entity.js';
import { PluginConfig } from './entities/plugin-config.entity.js';

@Injectable()
export class PluginsService implements OnModuleInit {
  private readonly logger = new Logger(PluginsService.name);
  private plugins: Map<string, AuthPlugin> = new Map();
  private pluginDir: string;

  constructor(
    @InjectRepository(PluginLog)
    private pluginLogRepository: Repository<PluginLog>,
    @InjectRepository(PluginConfig)
    private pluginConfigRepository: Repository<PluginConfig>,
  ) {
    this.pluginDir = path.resolve(process.cwd(), 'Plugin');
  }

  async onModuleInit() {
    await this.loadPlugins();
    await this.syncPluginConfigs();
  }

  private async loadPlugins() {
    if (!fs.existsSync(this.pluginDir)) {
      fs.mkdirSync(this.pluginDir, { recursive: true });
      this.logger.log(`Plugin directory created: ${this.pluginDir}`);
      return;
    }

    const entries = fs.readdirSync(this.pluginDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const pluginPath = path.join(this.pluginDir, entry.name, 'index.js');
        if (fs.existsSync(pluginPath)) {
          try {
            const pluginUrl = pathToFileURL(pluginPath).href;
            const pluginModule = await import(pluginUrl);
            const plugin: AuthPlugin = pluginModule.default || pluginModule;

            if (plugin.name && plugin.inputSchema && typeof plugin.handle === 'function') {
              this.plugins.set(plugin.name, plugin);
              this.logger.log(`Plugin loaded: ${plugin.name} (face_scan: ${plugin.is_face_scan})`);
            } else {
              this.logger.warn(`Plugin ${entry.name} missing required fields`);
            }
          } catch (err) {
            this.logger.error(`Failed to load plugin ${entry.name}: ${err}`);
          }
        }
      }
    }

    this.logger.log(`Total plugins loaded: ${this.plugins.size}`);
  }

  /**
   * 将加载的插件同步到数据库配置表
   * - 新增插件自动创建配置记录
   * - 已有插件同步 pluginDescription 和 isFaceScan
   */
  private async syncPluginConfigs() {
    for (const [name, plugin] of this.plugins) {
      const existing = await this.pluginConfigRepository.findOne({ where: { name } });
      if (!existing) {
        const config = this.pluginConfigRepository.create({
          name,
          enabled: false,
          isFaceScan: plugin.is_face_scan,
          pluginDescription: plugin.pluginDescription || undefined,
        });
        await this.pluginConfigRepository.save(config);
        this.logger.log(`Plugin config created for: ${name} (default: disabled)`);
      } else {
        let changed = false;
        if (existing.isFaceScan !== plugin.is_face_scan) {
          existing.isFaceScan = plugin.is_face_scan;
          changed = true;
        }
        if (plugin.pluginDescription && existing.pluginDescription !== plugin.pluginDescription) {
          existing.pluginDescription = plugin.pluginDescription;
          changed = true;
        }
        if (changed) {
          await this.pluginConfigRepository.save(existing);
        }
      }
    }
  }

  /**
   * 获取所有插件及其配置信息（含 configSchema、configValues）
   */
  async getPlugins() {
    const configs = await this.pluginConfigRepository.find();
    const configMap = new Map(configs.map((c) => [c.name, c]));

    return Array.from(this.plugins.values()).map((p) => {
      const config = configMap.get(p.name);
      let configValues: Record<string, string> = {};
      try {
        configValues = config?.configValues ? JSON.parse(config.configValues) : {};
      } catch {
        configValues = {};
      }
      return {
        name: p.name,
        is_face_scan: p.is_face_scan,
        inputSchema: p.inputSchema,
        configSchema: p.configSchema || [],
        enabled: config?.enabled ?? false,
        description: config?.description ?? null,
        pluginDescription: config?.pluginDescription ?? p.pluginDescription ?? null,
        configValues,
      };
    });
  }

  /**
   * 获取插件的管理员配置值
   */
  private getConfigValues(pluginName: string): Record<string, string> {
    // synchronous helper — config is passed from caller
    return {};
  }

  /**
   * 获取已启用的插件公开信息（面向普通用户，不含 configSchema/configValues）
   */
  async getEnabledPlugins() {
    const configs = await this.pluginConfigRepository.find({ where: { enabled: true } });
    const enabledNames = new Set(configs.map((c) => c.name));
    const configMap = new Map(configs.map((c) => [c.name, c]));

    return Array.from(this.plugins.values())
      .filter((p) => enabledNames.has(p.name))
      .map((p) => {
        const config = configMap.get(p.name);
        return {
          name: p.name,
          is_face_scan: p.is_face_scan,
          inputSchema: p.inputSchema,
          description: config?.description ?? null,
          pluginDescription: config?.pluginDescription ?? p.pluginDescription ?? null,
        };
      });
  }

  /**
   * 执行插件（不检查启停状态，内部使用）
   */
  async executePlugin(
    pluginName: string,
    params: AuthPluginInput,
    userId?: number,
  ): Promise<AuthPluginResult> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginName}`);
    }

    // 读取管理员配置值，传递给插件
    const config = await this.pluginConfigRepository.findOne({ where: { name: pluginName } });
    let configValues: Record<string, string> = {};
    try {
      configValues = config?.configValues ? JSON.parse(config.configValues) : {};
    } catch {
      configValues = {};
    }

    const result = await plugin.handle(params, configValues);

    await this.pluginLogRepository.save(
      this.pluginLogRepository.create({
        pluginName: plugin.name,
        isFaceScan: plugin.is_face_scan,
        inputParams: JSON.stringify(params),
        outputResult: JSON.stringify(result),
        userId,
      }),
    );

    return result;
  }

  /**
   * 使用插件认证（只使用已启用的插件）
   */
  async verifyWithPlugin(
    pluginName: string | undefined,
    params: AuthPluginInput,
    userId?: number,
  ): Promise<AuthPluginResult> {
    if (pluginName) {
      // 指定了插件名，检查是否启用
      const config = await this.pluginConfigRepository.findOne({ where: { name: pluginName } });
      if (!config || !config.enabled) {
        return { message: `插件 ${pluginName} 未启用`, success: false };
      }
      return this.executePlugin(pluginName, params, userId);
    }

    // 未指定插件，使用第一个已启用的插件
    const enabledConfigs = await this.pluginConfigRepository.find({ where: { enabled: true } });
    for (const config of enabledConfigs) {
      if (this.plugins.has(config.name)) {
        return this.executePlugin(config.name, params, userId);
      }
    }

    return { message: '没有已启用的认证插件', success: false };
  }

  async getPluginLogs() {
    return this.pluginLogRepository.find({
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  /**
   * 启用/禁用插件
   * 启用前要求：
   *  1. 已设置认证描述（description）
   *  2. 已填写所有 required 的配置项（configValues）
   */
  async setPluginEnabled(pluginName: string, enabled: boolean, description?: string) {
    const config = await this.pluginConfigRepository.findOne({ where: { name: pluginName } });
    if (!config) {
      throw new NotFoundException(`插件 ${pluginName} 不存在`);
    }

    if (!this.plugins.has(pluginName)) {
      throw new NotFoundException(`插件 ${pluginName} 未加载`);
    }

    if (enabled) {
      if (!config.description) {
        throw new BadRequestException('启用插件前必须先设置认证描述（说明接受的证件类型）');
      }
      // 检查必填配置项
      const plugin = this.plugins.get(pluginName)!;
      if (plugin.configSchema) {
        let storedValues: Record<string, string> = {};
        try {
          storedValues = config.configValues ? JSON.parse(config.configValues) : {};
        } catch {
          storedValues = {};
        }
        const missing = plugin.configSchema
          .filter((item: ConfigSchemaItem) => item.required && !storedValues[item.key]?.trim())
          .map((item: ConfigSchemaItem) => item.label);
        if (missing.length > 0) {
          throw new BadRequestException(`请先配置以下必填项：${missing.join('、')}`);
        }
      }
    }

    config.enabled = enabled;
    if (description !== undefined) {
      config.description = description;
    }
    await this.pluginConfigRepository.save(config);
    return { message: `插件 ${pluginName} 已${enabled ? '启用' : '禁用'}` };
  }

  /**
   * 设置插件认证描述（面向用户的说明：接受的证件类型等）
   */
  async setPluginDescription(pluginName: string, description: string) {
    const config = await this.pluginConfigRepository.findOne({ where: { name: pluginName } });
    if (!config) {
      throw new NotFoundException(`插件 ${pluginName} 不存在`);
    }

    config.description = description;
    await this.pluginConfigRepository.save(config);
    return { message: `插件 ${pluginName} 认证描述已更新` };
  }

  /**
   * 设置插件管理员配置值（如 AppCode）
   */
  async setPluginConfigValues(pluginName: string, configValues: Record<string, string>) {
    const config = await this.pluginConfigRepository.findOne({ where: { name: pluginName } });
    if (!config) {
      throw new NotFoundException(`插件 ${pluginName} 不存在`);
    }

    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new NotFoundException(`插件 ${pluginName} 未加载`);
    }

    // 校验 configSchema 中声明的字段类型（可选）
    config.configValues = JSON.stringify(configValues);
    await this.pluginConfigRepository.save(config);
    return { message: `插件 ${pluginName} 配置已更新` };
  }
}
