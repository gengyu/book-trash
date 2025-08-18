import { ILLMFactory, ILLMInstance, LLMConfig } from './llm.interface';
import { OpenAILLM } from './openai-llm';

/**
 * 大模型工厂实现
 */
export class LLMFactory implements ILLMFactory {
  private static instance: LLMFactory;
  private readonly supportedProviders = ['openai'];

  private constructor() {}

  /**
   * 获取工厂单例实例
   */
  static getInstance(): LLMFactory {
    if (!LLMFactory.instance) {
      LLMFactory.instance = new LLMFactory();
    }
    return LLMFactory.instance;
  }

  /**
   * 创建大模型实例
   */
  async createLLM(config: LLMConfig): Promise<ILLMInstance> {
    this.validateConfig(config);

    let llmInstance: ILLMInstance;

    switch (config.provider) {
      case 'openai':
        llmInstance = new OpenAILLM(config);
        break;
      
      case 'anthropic':
        throw new Error('Anthropic provider is not implemented yet');
      
      case 'azure':
        throw new Error('Azure provider is not implemented yet');
      
      case 'local':
        throw new Error('Local provider is not implemented yet');
      
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }

    // 初始化模型实例
    await llmInstance.initialize();
    
    return llmInstance;
  }

  /**
   * 获取支持的提供商列表
   */
  getSupportedProviders(): string[] {
    return [...this.supportedProviders];
  }

  /**
   * 验证配置
   */
  private validateConfig(config: LLMConfig): void {
    if (!config) {
      throw new Error('LLM config is required');
    }

    if (!config.provider) {
      throw new Error('Provider is required');
    }

    if (!this.supportedProviders.includes(config.provider)) {
      throw new Error(`Unsupported provider: ${config.provider}. Supported providers: ${this.supportedProviders.join(', ')}`);
    }

    if (!config.modelName) {
      throw new Error('Model name is required');
    }
  }

  /**
   * 获取提供商的默认配置
   */
  getProviderDefaultConfig(provider: string): Partial<LLMConfig> {
    switch (provider) {
      case 'openai':
        return {
          provider: 'openai',
          modelName: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 2000,
          timeout: 30000
        };
      
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * 创建带有默认配置的大模型实例
   */
  async createLLMWithDefaults(provider: string, overrides: Partial<LLMConfig> = {}): Promise<ILLMInstance> {
    const defaultConfig = this.getProviderDefaultConfig(provider);
    const config: LLMConfig = {
      ...defaultConfig,
      ...overrides,
      provider: provider as any,
      modelName: overrides.modelName || defaultConfig.modelName!
    };

    return this.createLLM(config);
  }

  /**
   * 批量创建大模型实例
   */
  async createMultipleLLMs(configs: LLMConfig[]): Promise<ILLMInstance[]> {
    const promises = configs.map(config => this.createLLM(config));
    return Promise.all(promises);
  }
}