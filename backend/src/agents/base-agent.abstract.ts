import { ChatOpenAI } from '@langchain/openai';
import { 
  IAgent, 
  AgentContext, 
  AgentResult, 
  AgentConfig, 
  AgentEvent, 
  AgentEventType, 
  IAgentEventListener 
} from './base-agent.interface';

/**
 * 基础智能体抽象类
 */
export abstract class BaseAgent<TInput = any, TOutput = any> implements IAgent<TInput, TOutput> {
  protected readonly config: AgentConfig;
  protected readonly llm: ChatOpenAI;
  protected status: 'idle' | 'running' | 'error' = 'idle';
  protected eventListeners: IAgentEventListener[] = [];

  constructor(config: AgentConfig) {
    this.config = {
      maxRetries: 3,
      timeout: 30000,
      ...config
    };
    
    this.llm = config.llm || new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 2000
    });
  }

  get name(): string {
    return this.config.name;
  }

  get description(): string {
    return this.config.description;
  }

  getStatus(): 'idle' | 'running' | 'error' {
    return this.status;
  }

  /**
   * 添加事件监听器
   */
  addEventListener(listener: IAgentEventListener): void {
    this.eventListeners.push(listener);
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(listener: IAgentEventListener): void {
    const index = this.eventListeners.indexOf(listener);
    if (index > -1) {
      this.eventListeners.splice(index, 1);
    }
  }

  /**
   * 触发事件
   */
  protected emitEvent(type: AgentEventType, sessionId: string, data?: any, error?: string): void {
    const event: AgentEvent = {
      type,
      agentName: this.name,
      sessionId,
      timestamp: new Date(),
      data,
      error
    };

    this.eventListeners.forEach(listener => {
      try {
        listener.onEvent(event);
      } catch (err) {
        console.error(`Error in event listener:`, err);
      }
    });
  }

  /**
   * 执行智能体任务（带重试和错误处理）
   */
  async execute(input: TInput, context: AgentContext): Promise<AgentResult<TOutput>> {
    if (!this.validateInput(input)) {
      return {
        success: false,
        error: `Invalid input for agent ${this.name}`
      };
    }

    this.status = 'running';
    this.emitEvent(AgentEventType.STARTED, context.sessionId, { input });

    let lastError: Error | null = null;
    const maxRetries = this.config.maxRetries || 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.executeWithTimeout(
          () => this.doExecute(input, context),
          this.config.timeout || 30000
        );

        this.status = 'idle';
        this.emitEvent(AgentEventType.COMPLETED, context.sessionId, result);
        
        return {
          success: true,
          data: result,
          metadata: {
            attempts: attempt,
            executionTime: Date.now()
          }
        };
      } catch (error) {
        lastError = error as Error;
        console.warn(`Agent ${this.name} attempt ${attempt}/${maxRetries} failed:`, error.message);
        
        if (attempt < maxRetries) {
          // 等待一段时间后重试
          await this.delay(1000 * attempt);
        }
      }
    }

    this.status = 'error';
    const errorMessage = `Agent ${this.name} failed after ${maxRetries} attempts: ${lastError?.message}`;
    this.emitEvent(AgentEventType.ERROR, context.sessionId, null, errorMessage);
    
    return {
      success: false,
      error: errorMessage
    };
  }

  /**
   * 具体的执行逻辑（由子类实现）
   */
  protected abstract doExecute(input: TInput, context: AgentContext): Promise<TOutput>;

  /**
   * 验证输入数据（由子类实现）
   */
  abstract validateInput(input: TInput): boolean;

  /**
   * 带超时的执行
   */
  private async executeWithTimeout<T>(operation: () => Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      operation(),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Operation timeout after ${timeout}ms`)), timeout);
      })
    ]);
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 安全的JSON解析
   */
  protected safeJsonParse<T>(text: string, fallback: T): T {
    try {
      return JSON.parse(text) as T;
    } catch {
      return fallback;
    }
  }

  /**
   * 清理文本内容
   */
  protected cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/[\r\n]+/g, ' ')
      .trim();
  }

  /**
   * 截断文本到指定长度
   */
  protected truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength - 3) + '...';
  }
}