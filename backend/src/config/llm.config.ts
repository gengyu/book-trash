import { LLMConfig } from '../llms';

export interface LLMConfigOptions {
  defaultProvider: string;
  providers: {
    [key: string]: LLMConfig;
  };
}

export const llmConfig: LLMConfigOptions = {
  defaultProvider: process.env.DEFAULT_LLM_PROVIDER || 'openai',
  providers: {
    openai: {
      provider: 'openai',
      apiKey: process.env.OPENAI_API_KEY || '',
      baseURL: process.env.OPENAI_BASE_URL,
      modelName: process.env.OPENAI_MODEL_NAME || 'gpt-3.5-turbo',
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '2048'),
      timeout: parseInt(process.env.OPENAI_TIMEOUT || '30000'),
      additionalParams: {
        streaming: process.env.OPENAI_STREAMING === 'true',
        customHeaders: process.env.OPENAI_CUSTOM_HEADERS ? 
          JSON.parse(process.env.OPENAI_CUSTOM_HEADERS) : undefined,
      },
    },
    // 可以在这里添加其他LLM提供商的配置
    // anthropic: {
    //   provider: 'anthropic',
    //   apiKey: process.env.ANTHROPIC_API_KEY || '',
    //   modelName: process.env.ANTHROPIC_MODEL_NAME || 'claude-3-sonnet-20240229',
    //   temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE || '0.7'),
    //   maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '2048'),
    //   timeout: parseInt(process.env.ANTHROPIC_TIMEOUT || '30000'),

    // },
  },
};

/**
 * 获取指定提供商的LLM配置
 */
export function getLLMConfig(provider?: string): LLMConfig {
  const targetProvider = provider || llmConfig.defaultProvider;
  const config = llmConfig.providers[targetProvider];
  
  if (!config) {
    throw new Error(`LLM provider '${targetProvider}' not found in configuration`);
  }
  
  return config;
}

/**
 * 获取默认LLM配置
 */
export function getDefaultLLMConfig(): LLMConfig {
  return getLLMConfig();
}

/**
 * 获取所有可用的LLM提供商
 */
export function getAvailableLLMProviders(): string[] {
  return Object.keys(llmConfig.providers);
}

/**
 * 验证LLM配置是否有效
 */
export function validateLLMConfig(config: LLMConfig): boolean {
  if (!config.provider || !config.apiKey) {
    return false;
  }
  
  if (config.provider === 'openai' && !config.modelName) {
    return false;
  }
  
  return true;
}