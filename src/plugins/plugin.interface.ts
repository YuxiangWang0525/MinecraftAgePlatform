/** 插件配置项声明（插件告诉后台需要管理员填写哪些配置） */
export interface ConfigSchemaItem {
  key: string;
  label: string;
  type: 'text' | 'password' | 'textarea';
  placeholder?: string;
  required?: boolean;
  description?: string;
}

/** 插件传给认证处理函数的输入参数 */
export interface AuthPluginInput {
  name: string;
  id_number: string;
  [key: string]: string;
}

/** 插件认证处理函数的返回结果 */
export interface AuthPluginResult {
  message: string;
  'qr-data'?: string;
  success?: boolean;
  /** 是否成年 */
  isAdult?: boolean;
  /** 出生年月 (YYYY-MM-DD) */
  birthDate?: string;
}

/** 插件接口定义 */
export interface AuthPlugin {
  name: string;
  is_face_scan: boolean;
  inputSchema: Record<string, string>;

  /** 插件描述（面向管理员：说明认证服务由谁提供，可含链接） */
  pluginDescription?: string;

  /** 配置项声明（插件要求管理员在后台填写的配置，如 AppCode） */
  configSchema?: ConfigSchemaItem[];

  /**
   * 执行认证
   * @param params 用户提交的认证参数（姓名、证件号等）
   * @param config 管理员在后台配置的参数值（如 AppCode）
   */
  handle(params: AuthPluginInput, config: Record<string, string>): Promise<AuthPluginResult>;
}
