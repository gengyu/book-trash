import { Injectable, Logger } from '@nestjs/common';
import { ILLMManager, ILLMInstance, LLMConfig } from './llm.interface';
import { LLMFactory } from './llm.factory';

/**
 * 大模型管理器实现
 */
@Injectable()
export class LLMManager implements ILLMManager {
  private readonly logger = new Logger(LLMManager.name);
  private readonly llmInstances = new Map<string, ILLMInstance>();
  private readonly llmConfigs = new Map<string, LLMConfig>();
  private readonly factory: LLMFactory;
  private defaultLLMName: string | null = null;

  constructor() {
    this.factory = LLMFactory.getInstance();
  }

  /**
   * 注册大模型配置
   */
  async registerLLM(name: string, config: LLMConfig): Promise<void> {
    try {
      this.logger.log(`Registering LLM: ${name} (${config.provider}:${config.modelName})`);
      
      // 验证名称
      if (!name || typeof name !== 'string') {
        throw new Error('LLM name must be a non-empty string');
      }

      // 如果已存在，先移除旧实例
      if (this.llmInstances.has(name)) {
        await this.removeLLM(name);
      }

      // 创建新实例
      const llmInstance = await this.factory.createLLM(config);
      
      // 存储配置和实例
      this.llmConfigs.set(name, config);
      this.llmInstances.set(name, llmInstance);

      // 如果是第一个注册的LLM，设为默认
      if (!this.defaultLLMName) {
        this.defaultLLMName = name;
        this.logger.log(`Set ${name} as default LLM`);
      }

      this.logger.log(`Successfully registered LLM: ${name}`);
    } catch (error) {
      this.logger.error(`Failed to register LLM ${name}:`, error);
      throw error;
    }
  }

  /**
   * 获取大模型实例
   */
  async getLLM(name: string): Promise<ILLMInstance> {
    const instance = this.llmInstances.get(name);
    if (!instance) {
      throw new Error(`LLM '${name}' not found. Available LLMs: ${this.listLLMs().join(', ')}`);
    }
    return instance;
  }

  /**
   * 获取默认大模型实例
   */
  async getDefaultLLM(): Promise<ILLMInstance> {
    if (!this.defaultLLMName) {
      throw new Error('No default LLM configured. Please register at least one LLM.');
    }
    return this.getLLM(this.defaultLLMName);
  }

  /**
   * 列出所有已注册的大模型
   */
  listLLMs(): string[] {
    return Array.from(this.llmInstances.keys());
  }

  /**
   * 移除大模型配置
   */
  async removeLLM(name: string): Promise<void> {
    try {
      this.logger.log(`Removing LLM: ${name}`);
      
      if (!this.llmInstances.has(name)) {
        throw new Error(`LLM '${name}' not found`);
      }

      // 移除实例和配置
      this.llmInstances.delete(name);
      this.llmConfigs.delete(name);

      // 如果移除的是默认LLM，重新设置默认
      if (this.defaultLLMName === name) {
        const remainingLLMs = this.listLLMs();
        this.defaultLLMName = remainingLLMs.length > 0 ? remainingLLMs[0] : null;
        if (this.defaultLLMName) {
          this.logger.log(`Set ${this.defaultLLMName} as new default LLM`);
        }
      }

      this.logger.log(`Successfully removed LLM: ${name}`);
    } catch (error) {
      this.logger.error(`Failed to remove LLM ${name}:`, error);
      throw error;
    }
  }

  /**
   * 检查所有大模型健康状态
   */
  async healthCheckAll(): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    
    const healthCheckPromises = Array.from(this.llmInstances.entries()).map(
      async ([name, instance]) => {
        try {
          const isHealthy = await instance.healthCheck();
          results[name] = isHealthy;
        } catch (error) {
          this.logger.error(`Health check failed for ${name}:`, error);
          results[name] = false;
        }
      }
    );

    await Promise.all(healthCheckPromises);
    return results;
  }

  /**
   * 设置默认大模型
   */
  setDefaultLLM(name: string): void {
    if (!this.llmInstances.has(name)) {
      throw new Error(`LLM '${name}' not found`);
    }
    this.defaultLLMName = name;
    this.logger.log(`Set ${name} as default LLM`);
  }

  /**
   * 获取默认大模型名称
   */
  getDefaultLLMName(): string | null {
    return this.defaultLLMName;
  }

  /**
   * 获取大模型配置
   */
  getLLMConfig(name: string): LLMConfig | undefined {
    return this.llmConfigs.get(name);
  }

  /**
   * 获取所有大模型信息
   */
  getAllLLMInfo(): Array<{
    name: string;
    config: LLMConfig;
    info: ReturnType<ILLMInstance['getModelInfo']>;
    isDefault: boolean;
  }> {
    return Array.from(this.llmInstances.entries()).map(([name, instance]) => ({
      name,
      config: this.llmConfigs.get(name)!,
      info: instance.getModelInfo(),
      isDefault: name === this.defaultLLMName
    }));
  }

  /**
   * 重新初始化所有大模型
   */
  async reinitializeAll(): Promise<void> {
    this.logger.log('Reinitializing all LLMs...');
    
    const configs = Array.from(this.llmConfigs.entries());
    
    // 清空现有实例
    this.llmInstances.clear();
    
    // 重新创建所有实例
    for (const [name, config] of configs) {
      try {
        const instance = await this.factory.createLLM(config);
        this.llmInstances.set(name, instance);
        this.logger.log(`Reinitialized LLM: ${name}`);
      } catch (error) {
        this.logger.error(`Failed to reinitialize LLM ${name}:`, error);
      }
    }
  }
}