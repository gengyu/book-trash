import { ChatOpenAI } from '@langchain/openai';
import { BaseLLM } from './base-llm.abstract';
import { LLMConfig } from './llm.interface';

/**
 * OpenAI大模型实现
 */
export class OpenAILLM extends BaseLLM {
  constructor(config: LLMConfig) {
    const mergedConfig = {
      ...config,
      provider: 'openai' as const
    };
    super(mergedConfig);
  }

  /**
   * 创建OpenAI模型实例
   */
  protected async createInstance(): Promise<ChatOpenAI> {
    const config = this.mergeConfig(this.config);
    
    const openaiConfig: any = {
      modelName: config.modelName,
      temperature: config.temperature ?? 0.7,
      maxTokens: config.maxTokens ?? 2000,
      timeout: config.timeout ?? 30000,
      ...config.additionalParams
    };

    // 设置API密钥
    if (config.apiKey) {
      openaiConfig.openAIApiKey = config.apiKey;
    }

    // 设置自定义基础URL
    if (config.baseURL) {
      openaiConfig.configuration = {
        baseURL: config.baseURL
      };
    }

    return new ChatOpenAI(openaiConfig);
  }

  /**
   * 执行健康检查
   */
  protected async performHealthCheck(): Promise<boolean> {
    try {
      // 发送一个简单的测试请求
      const response = await this._instance.invoke('Hello');
      return !!response;
    } catch (error) {
      console.error('OpenAI health check failed:', error);
      return false;
    }
  }

  /**
   * 获取默认配置
   */
  protected getDefaultConfig(): Partial<LLMConfig> {
    return {
      provider: 'openai',
      modelName: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 2000,
      timeout: 30000,
      additionalParams: {}
    };
  }

  /**
   * 验证OpenAI特定配置
   */
  protected validateConfig(config: LLMConfig): void {
    super.validateConfig(config);
    
    if (config.provider !== 'openai') {
      throw new Error('Provider must be "openai" for OpenAILLM');
    }

    // 验证模型名称是否为支持的OpenAI模型
    const supportedModels = [
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-16k',
      'gpt-4',
      'gpt-4-turbo',
      'gpt-4o',
      'gpt-4o-mini'
    ];

    if (!supportedModels.includes(config.modelName)) {
      console.warn(`Model ${config.modelName} may not be supported. Supported models: ${supportedModels.join(', ')}`);
    }
  }

  /**
   * 获取模型的估算成本信息
   */
  getModelCostInfo(): {
    inputTokenCost: number;
    outputTokenCost: number;
    currency: string;
  } {
    // 基于模型返回估算成本（每1000个token的美元价格）
    const costMap: Record<string, { input: number; output: number }> = {
      'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
      'gpt-3.5-turbo-16k': { input: 0.003, output: 0.004 },
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 }
    };

    const cost = costMap[this.config.modelName] || { input: 0, output: 0 };
    
    return {
      inputTokenCost: cost.input,
      outputTokenCost: cost.output,
      currency: 'USD'
    };
  }
}