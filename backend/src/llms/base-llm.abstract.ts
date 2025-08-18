import { ILLMInstance, LLMConfig } from './llm.interface';

/**
 * 大模型基础抽象类
 */
export abstract class BaseLLM implements ILLMInstance {
  protected _instance: any = null;
  protected _isInitialized: boolean = false;

  constructor(public readonly config: LLMConfig) {
    this.validateConfig(config);
  }

  get instance(): any {
    if (!this._isInitialized) {
      throw new Error(`LLM ${this.config.provider}:${this.config.modelName} is not initialized`);
    }
    return this._instance;
  }

  /**
   * 初始化模型实例
   */
  async initialize(): Promise<void> {
    try {
      this._instance = await this.createInstance();
      this._isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize LLM ${this.config.provider}:${this.config.modelName}: ${error.message}`);
    }
  }

  /**
   * 检查模型健康状态
   */
  async healthCheck(): Promise<boolean> {
    try {
      if (!this._isInitialized) {
        return false;
      }
      return await this.performHealthCheck();
    } catch (error) {
      console.error(`Health check failed for ${this.config.provider}:${this.config.modelName}:`, error);
      return false;
    }
  }

  /**
   * 获取模型信息
   */
  getModelInfo(): {
    provider: string;
    modelName: string;
    isInitialized: boolean;
  } {
    return {
      provider: this.config.provider,
      modelName: this.config.modelName,
      isInitialized: this._isInitialized
    };
  }

  /**
   * 验证配置
   */
  protected validateConfig(config: LLMConfig): void {
    if (!config.provider) {
      throw new Error('Provider is required');
    }
    if (!config.modelName) {
      throw new Error('Model name is required');
    }
  }

  /**
   * 创建具体的模型实例（由子类实现）
   */
  protected abstract createInstance(): Promise<any>;

  /**
   * 执行健康检查（由子类实现）
   */
  protected abstract performHealthCheck(): Promise<boolean>;

  /**
   * 获取默认配置（由子类实现）
   */
  protected abstract getDefaultConfig(): Partial<LLMConfig>;

  /**
   * 合并配置
   */
  protected mergeConfig(config: LLMConfig): LLMConfig {
    const defaultConfig = this.getDefaultConfig();
    return {
      ...defaultConfig,
      ...config,
      additionalParams: {
        ...defaultConfig.additionalParams,
        ...config.additionalParams
      }
    };
  }
}