/**
 * 大模型配置接口
 */
export interface LLMConfig {
  /** 模型提供商 */
  provider: 'openai' | 'anthropic' | 'azure' | 'local';
  /** 模型名称 */
  modelName: string;
  /** API密钥 */
  apiKey?: string;
  /** API基础URL */
  baseURL?: string;
  /** 温度参数 */
  temperature?: number;
  /** 最大令牌数 */
  maxTokens?: number;
  /** 超时时间(毫秒) */
  timeout?: number;
  /** 其他配置参数 */
  additionalParams?: Record<string, any>;
}

/**
 * 大模型实例接口
 */
export interface ILLMInstance {
  /** 配置信息 */
  readonly config: LLMConfig;
  /** 模型实例 */
  readonly instance: any;
  /** 初始化模型 */
  initialize(): Promise<void>;
  /** 检查模型健康状态 */
  healthCheck(): Promise<boolean>;
  /** 获取模型信息 */
  getModelInfo(): {
    provider: string;
    modelName: string;
    isInitialized: boolean;
  };
}

/**
 * 大模型工厂接口
 */
export interface ILLMFactory {
  /** 创建大模型实例 */
  createLLM(config: LLMConfig): Promise<ILLMInstance>;
  /** 获取支持的提供商列表 */
  getSupportedProviders(): string[];
}

/**
 * 大模型管理器接口
 */
export interface ILLMManager {
  /** 注册大模型配置 */
  registerLLM(name: string, config: LLMConfig): Promise<void>;
  /** 获取大模型实例 */
  getLLM(name: string): Promise<ILLMInstance>;
  /** 获取默认大模型实例 */
  getDefaultLLM(): Promise<ILLMInstance>;
  /** 列出所有已注册的大模型 */
  listLLMs(): string[];
  /** 移除大模型配置 */
  removeLLM(name: string): Promise<void>;
  /** 检查所有大模型健康状态 */
  healthCheckAll(): Promise<Record<string, boolean>>;
}