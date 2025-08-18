import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LLMFactory } from './llm.factory';
import { LLMManager } from './llm.manager';
import { llmConfig } from '../config/llm.config';

/**
 * LLM模块 - 全局模块，提供大模型相关服务
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'LLM_CONFIG',
      useValue: llmConfig,
    },
    {
      provide: 'LLM_FACTORY',
      useFactory: () => LLMFactory.getInstance(),
    },
    {
      provide: LLMManager,
      useFactory: async () => {
        const manager = new LLMManager();
        
        // 初始化默认LLM
        try {
          const defaultProvider = llmConfig.defaultProvider;
          const defaultConfig = llmConfig.providers[defaultProvider];
          
          if (defaultConfig && defaultConfig.apiKey) {
            await manager.registerLLM('default', defaultConfig);
            manager.setDefaultLLM('default');
          }
        } catch (error) {
          console.warn('Failed to initialize default LLM:', error.message);
        }
        
        return manager;
      },
    },
  ],
  exports: ['LLM_FACTORY', LLMManager, 'LLM_CONFIG'],
})
export class LLMModule {}