import { ChatOpenAI } from '@langchain/openai';

/**
 * 智能体执行上下文
 */
export interface AgentContext {
  sessionId: string;
  userId?: string;
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
  documentContent?: string;
  dialogHistory?: Array<{ question: string; answer: string }>;
  timestamp?: Date;
  metadata?: Record<string, any>;
}

/**
 * 智能体执行结果
 */
export interface AgentResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

/**
 * 智能体配置接口
 */
export interface AgentConfig {
  name: string;
  description: string;
  llm?: ChatOpenAI;
  maxRetries?: number;
  timeout?: number;
}

/**
 * 基础智能体接口
 */
export interface IAgent<TInput = any, TOutput = any> {
  /**
   * 智能体名称
   */
  readonly name: string;

  /**
   * 智能体描述
   */
  readonly description: string;

  /**
   * 执行智能体任务
   * @param input 输入数据
   * @param context 执行上下文
   * @returns 执行结果
   */
  execute(input: TInput, context: AgentContext): Promise<AgentResult<TOutput>>;

  /**
   * 验证输入数据
   * @param input 输入数据
   * @returns 是否有效
   */
  validateInput(input: TInput): boolean;

  /**
   * 获取智能体状态
   */
  getStatus(): 'idle' | 'running' | 'error';
}

/**
 * 智能体事件类型
 */
export enum AgentEventType {
  STARTED = 'started',
  COMPLETED = 'completed',
  ERROR = 'error',
  PROGRESS = 'progress'
}

/**
 * 智能体事件
 */
export interface AgentEvent {
  type: AgentEventType;
  agentName: string;
  sessionId: string;
  timestamp: Date;
  data?: any;
  error?: string;
}

/**
 * 智能体事件监听器
 */
export interface IAgentEventListener {
  onEvent(event: AgentEvent): void;
}