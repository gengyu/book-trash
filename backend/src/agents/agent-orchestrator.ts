import { Injectable, Logger } from '@nestjs/common';
import { DocumentParserAgent } from './document-parser.agent';
import { KeyPointExtractorAgent } from './keypoint-extractor.agent';
import { LearningPathAgent } from './learning-path.agent';
import { QAAgent } from './qa.agent';
import { QuizAgent } from './quiz.agent';
import { 
  DocumentContent, 
  KeyPoint, 
  LearningStep, 
  QuizQuestion,
  AgentErrorType 
} from './agent-types';
import { AgentContext, AgentResult } from './base-agent.interface';

/**
 * 工作流类型定义
 */
export type WorkflowType = 
  | 'document_analysis'     // 文档分析工作流
  | 'learning_generation'   // 学习内容生成工作流
  | 'interactive_qa'        // 交互式问答工作流
  | 'quiz_generation'       // 测验生成工作流
  | 'full_pipeline';        // 完整流水线工作流

/**
 * 工作流输入接口
 */
export interface WorkflowInput {
  type: WorkflowType;
  url?: string;
  documentContent?: DocumentContent;
  keyPoints?: KeyPoint[];
  question?: string;
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
  questionCount?: number;
  timeConstraint?: string;
  focusAreas?: string[];
  conversationHistory?: Array<{ question: string; answer: string }>;
  options?: {
    skipSteps?: string[];
    customPrompts?: Record<string, string>;
    maxRetries?: number;
    timeout?: number;
  };
}

/**
 * 工作流输出接口
 */
export interface WorkflowOutput {
  success: boolean;
  workflowType: WorkflowType;
  results: {
    documentContent?: DocumentContent;
    keyPoints?: KeyPoint[];
    learningPath?: LearningStep[];
    answer?: string;
    quiz?: QuizQuestion[];
  };
  metadata: {
    executionTime: number;
    stepsExecuted: string[];
    errors?: Array<{
      step: string;
      error: string;
      timestamp: Date;
    }>;
  };
  context?: AgentContext;
}

/**
 * 智能体编排器
 * 负责协调多个智能体的协同工作，管理复杂的工作流程
 */
@Injectable()
export class AgentOrchestrator {
  private readonly logger = new Logger(AgentOrchestrator.name);
  
  private documentParser: DocumentParserAgent;
  private keyPointExtractor: KeyPointExtractorAgent;
  private learningPathAgent: LearningPathAgent;
  private qaAgent: QAAgent;
  private quizAgent: QuizAgent;
  
  private readonly defaultTimeout = 60000; // 默认超时时间
  private readonly maxConcurrentAgents = 3; // 最大并发智能体数量

  constructor() {
    this.initializeAgents();
  }

  /**
   * 初始化所有智能体
   */
  private initializeAgents(): void {
    try {
      this.documentParser = new DocumentParserAgent();
      this.keyPointExtractor = new KeyPointExtractorAgent();
      this.learningPathAgent = new LearningPathAgent();
      this.qaAgent = new QAAgent();
      this.quizAgent = new QuizAgent();
      
      this.logger.log('All agents initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize agents:', error);
      throw new Error(`Agent initialization failed: ${error.message}`);
    }
  }

  /**
   * 执行工作流
   */
  async executeWorkflow(input: WorkflowInput): Promise<WorkflowOutput> {
    const startTime = Date.now();
    const context: AgentContext = {
      sessionId: this.generateSessionId(),
      userId: input.options?.customPrompts?.userId || 'anonymous',
      timestamp: new Date(),
      userLevel: input.userLevel || 'intermediate',
      metadata: {
        workflowType: input.type
      }
    };

    const output: WorkflowOutput = {
      success: false,
      workflowType: input.type,
      results: {},
      metadata: {
        executionTime: 0,
        stepsExecuted: [],
        errors: []
      },
      context
    };

    try {
      this.logger.log(`Starting workflow: ${input.type}`);
      
      switch (input.type) {
        case 'document_analysis':
          await this.executeDocumentAnalysisWorkflow(input, output, context);
          break;
        case 'learning_generation':
          await this.executeLearningGenerationWorkflow(input, output, context);
          break;
        case 'interactive_qa':
          await this.executeInteractiveQAWorkflow(input, output, context);
          break;
        case 'quiz_generation':
          await this.executeQuizGenerationWorkflow(input, output, context);
          break;
        case 'full_pipeline':
          await this.executeFullPipelineWorkflow(input, output, context);
          break;
        default:
          throw new Error(`Unknown workflow type: ${input.type}`);
      }

      output.success = true;
      this.logger.log(`Workflow ${input.type} completed successfully`);
      
    } catch (error) {
      this.logger.error(`Workflow ${input.type} failed:`, error);
      output.metadata.errors?.push({
        step: 'workflow_execution',
        error: error.message,
        timestamp: new Date()
      });
    } finally {
      output.metadata.executionTime = Date.now() - startTime;
    }

    return output;
  }

  /**
   * 文档分析工作流
   */
  private async executeDocumentAnalysisWorkflow(
    input: WorkflowInput, 
    output: WorkflowOutput, 
    context: AgentContext
  ): Promise<void> {
    if (!input.url) {
      throw new Error('URL is required for document analysis workflow');
    }

    // 步骤1: 解析文档
    const documentResult = await this.executeStep(
      'document_parsing',
      () => this.documentParser.execute({ url: input.url! }, context),
      output
    );
    const documentContent = documentResult;

    // 步骤2: 提取关键点
    const keyPoints = await this.executeStep(
      'keypoint_extraction',
      () => this.keyPointExtractor.execute({
        documentContent,
        userLevel: input.userLevel === 'intermediate' ? 'beginner' : (input.userLevel || 'beginner') as 'beginner' | 'advanced'
      }, context),
      output
    );

    output.results.documentContent = documentContent;
    output.results.keyPoints = keyPoints;
  }

  /**
   * 学习内容生成工作流
   */
  private async executeLearningGenerationWorkflow(
    input: WorkflowInput, 
    output: WorkflowOutput, 
    context: AgentContext
  ): Promise<void> {
    if (!input.keyPoints || input.keyPoints.length === 0) {
      throw new Error('Key points are required for learning generation workflow');
    }

    // 生成学习路径
    const learningPathResult = await this.executeStep(
      'learning_path_generation',
      () => this.learningPathAgent.execute({
        keyPoints: input.keyPoints!,
        userLevel: input.userLevel === 'intermediate' ? 'beginner' : (input.userLevel || 'beginner') as 'beginner' | 'advanced',
        timeConstraint: input.timeConstraint,
        focusAreas: input.focusAreas
      }, context),
      output
    );
    const learningPath = learningPathResult;

    output.results.learningPath = learningPath;
  }

  /**
   * 交互式问答工作流
   */
  private async executeInteractiveQAWorkflow(
    input: WorkflowInput, 
    output: WorkflowOutput, 
    context: AgentContext
  ): Promise<void> {
    if (!input.question || !input.documentContent) {
      throw new Error('Question and document content are required for QA workflow');
    }

    // 回答问题
    const answerResult = await this.executeStep(
      'question_answering',
      () => this.qaAgent.execute({
        question: input.question!,
        documentContent: input.documentContent!,
        keyPoints: input.keyPoints,
        conversationHistory: input.conversationHistory
      }, context),
      output
    );
    const answer = answerResult;

    output.results.answer = answer;
  }

  /**
   * 测验生成工作流
   */
  private async executeQuizGenerationWorkflow(
    input: WorkflowInput, 
    output: WorkflowOutput, 
    context: AgentContext
  ): Promise<void> {
    if (!input.documentContent) {
      throw new Error('Document content is required for quiz generation workflow');
    }

    // 生成测验
    const quizResult = await this.executeStep(
      'quiz_generation',
      () => this.quizAgent.execute({
        documentContent: input.documentContent!,
        keyPoints: input.keyPoints,
        userLevel: input.userLevel || 'intermediate',
        questionCount: input.questionCount || 5
      }, context),
      output
    );
    const quiz = quizResult;

    output.results.quiz = quiz;
  }

  /**
   * 完整流水线工作流
   */
  private async executeFullPipelineWorkflow(
    input: WorkflowInput, 
    output: WorkflowOutput, 
    context: AgentContext
  ): Promise<void> {
    if (!input.url) {
      throw new Error('URL is required for full pipeline workflow');
    }

    // 步骤1: 解析文档
    const documentContent = await this.executeStep(
      'document_parsing',
      () => this.documentParser.execute({ url: input.url! }, context),
      output
    );

    // 步骤2: 提取关键点
    const keyPoints = await this.executeStep(
      'keypoint_extraction',
      () => this.keyPointExtractor.execute({
        documentContent,
        userLevel: input.userLevel === 'intermediate' ? 'beginner' : (input.userLevel || 'beginner') as 'beginner' | 'advanced'
      }, context),
      output
    );

    // 步骤3: 生成学习路径
    const learningPath = await this.executeStep(
      'learning_path_generation',
      () => this.learningPathAgent.execute({
        keyPoints,
        userLevel: input.userLevel === 'intermediate' ? 'beginner' : (input.userLevel || 'beginner') as 'beginner' | 'advanced',
        timeConstraint: input.timeConstraint,
        focusAreas: input.focusAreas
      }, context),
      output
    );

    // 步骤4: 生成测验（可选）
    let quiz: QuizQuestion[] | undefined;
    if (!input.options?.skipSteps?.includes('quiz_generation')) {
      quiz = await this.executeStep(
        'quiz_generation',
        () => this.quizAgent.execute({
          documentContent,
          keyPoints,
          userLevel: input.userLevel || 'intermediate',
          questionCount: input.questionCount || 5
        }, context),
        output
      );
    }

    output.results = {
      documentContent,
      keyPoints,
      learningPath,
      quiz
    };
  }

  /**
   * 执行单个步骤
   */
  private async executeStep<T>(
    stepName: string,
    stepFunction: () => Promise<AgentResult<T>>,
    output: WorkflowOutput
  ): Promise<T> {
    const stepStartTime = Date.now();
    
    try {
      this.logger.log(`Executing step: ${stepName}`);
      
      const result = await Promise.race([
        stepFunction(),
        this.createTimeoutPromise<AgentResult<T>>(this.defaultTimeout)
      ]);
      
      output.metadata.stepsExecuted.push(stepName);
      
      const stepDuration = Date.now() - stepStartTime;
      this.logger.log(`Step ${stepName} completed in ${stepDuration}ms`);
      
      if (!result.success) {
        throw new Error(result.error || `Step ${stepName} failed`);
      }
      
      return result.data!;
      
    } catch (error) {
      const stepError = {
        step: stepName,
        error: error.message,
        timestamp: new Date()
      };
      
      output.metadata.errors?.push(stepError);
      this.logger.error(`Step ${stepName} failed:`, error);
      
      throw error;
    }
  }

  /**
   * 创建超时Promise
   */
  private createTimeoutPromise<T>(timeout: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * 生成会话ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 并行执行多个智能体
   */
  async executeParallelAgents<T>(
    agents: Array<() => Promise<T>>,
    maxConcurrency: number = this.maxConcurrentAgents
  ): Promise<T[]> {
    const results: T[] = [];
    const executing: Promise<void>[] = [];
    
    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      
      const promise = agent().then(result => {
        results[i] = result;
      });
      
      executing.push(promise);
      
      if (executing.length >= maxConcurrency) {
        await Promise.race(executing);
        executing.splice(executing.findIndex(p => p === promise), 1);
      }
    }
    
    await Promise.all(executing);
    return results;
  }

  /**
   * 获取工作流状态
   */
  getWorkflowStatus(sessionId: string): {
    status: 'running' | 'completed' | 'failed' | 'not_found';
    progress?: number;
    currentStep?: string;
    estimatedTimeRemaining?: number;
  } {
    // 这里可以实现会话状态跟踪
    // 目前返回基本状态
    return {
      status: 'not_found'
    };
  }

  /**
   * 取消工作流
   */
  async cancelWorkflow(sessionId: string): Promise<boolean> {
    // 这里可以实现工作流取消逻辑
    this.logger.log(`Cancelling workflow: ${sessionId}`);
    return true;
  }

  /**
   * 获取智能体健康状态
   */
  async getAgentsHealthStatus(): Promise<Record<string, boolean>> {
    const agents = {
      documentParser: this.documentParser,
      keyPointExtractor: this.keyPointExtractor,
      learningPathAgent: this.learningPathAgent,
      qaAgent: this.qaAgent,
      quizAgent: this.quizAgent
    };

    const healthStatus: Record<string, boolean> = {};
    
    for (const [name, agent] of Object.entries(agents)) {
      try {
        // 检查智能体状态
        const status = agent.getStatus();
        healthStatus[name] = status === 'idle';
      } catch (error) {
        healthStatus[name] = false;
        this.logger.warn(`Agent ${name} health check failed:`, error);
      }
    }
    
    return healthStatus;
  }

  /**
   * 重置所有智能体
   */
  async resetAllAgents(): Promise<void> {
    this.logger.log('Resetting all agents');
    
    try {
      this.initializeAgents();
      this.logger.log('All agents reset successfully');
    } catch (error) {
      this.logger.error('Failed to reset agents:', error);
      throw error;
    }
  }

  /**
   * 获取工作流统计信息
   */
  getWorkflowStatistics(): {
    totalWorkflowsExecuted: number;
    averageExecutionTime: number;
    successRate: number;
    mostUsedWorkflowType: WorkflowType;
    agentUsageStats: Record<string, number>;
  } {
    // 这里可以实现统计信息收集
    // 目前返回模拟数据
    return {
      totalWorkflowsExecuted: 0,
      averageExecutionTime: 0,
      successRate: 0,
      mostUsedWorkflowType: 'full_pipeline',
      agentUsageStats: {
        documentParser: 0,
        keyPointExtractor: 0,
        learningPathAgent: 0,
        qaAgent: 0,
        quizAgent: 0
      }
    };
  }
}