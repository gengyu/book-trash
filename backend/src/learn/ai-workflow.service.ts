import { Injectable, Logger, Inject } from '@nestjs/common';
import { LLMManager } from '../llms';
import { AgentOrchestrator, WorkflowInput, WorkflowOutput } from '../agents/agent-orchestrator';
import { SimpleWorkflowExecutor } from '../agents/langgraph-workflow';
import { PromptTemplateService } from '../prompts/prompt-template.service';
import { 
  DocumentContent, 
  KeyPoint, 
  LearningStep, 
  QuizQuestion 
} from '../agents/agent-types';
import {ConfigService} from "@nestjs/config";

// 保持向后兼容的接口导出
export { DocumentContent, KeyPoint, LearningStep, QuizQuestion };

@Injectable()
export class AIWorkflowService {
  private readonly logger = new Logger(AIWorkflowService.name);
  private orchestrator: AgentOrchestrator;
  private workflowExecutor: SimpleWorkflowExecutor;

  constructor(
    private configService: ConfigService,
    private readonly promptTemplateService: PromptTemplateService,
    @Inject(LLMManager) private readonly llmManager?: LLMManager,
  ) {
    this.orchestrator = new AgentOrchestrator(this.configService.get('DEFAULT_LLM_PROVIDER'), this.llmManager);
    this.workflowExecutor = new SimpleWorkflowExecutor();
  }

  async parseDocument(url: string): Promise<DocumentContent> {
    try {
      this.logger.log(`Parsing document from URL: ${url}`);
      
      const workflowInput: WorkflowInput = {
        type: 'document_analysis',
        url
      };
      
      const result = await this.orchestrator.executeWorkflow(workflowInput);
      
      if (!result.success || !result.results.documentContent) {
        throw new Error('Failed to parse document using agent system');
      }
      
      return result.results.documentContent;
    } catch (error) {
      this.logger.error(`Document parsing failed: ${error.message}`);
      throw new Error(`Failed to parse document: ${error.message}`);
    }
  }

  async extractKeyPoints(content: string): Promise<KeyPoint[]> {
    try {
      this.logger.log('Extracting key points from content');
      
      // 如果传入的是字符串内容，我们需要创建一个DocumentContent对象
      const documentContent: DocumentContent = {
        title: 'Document',
        content,
        url: ''
      };
      
      const workflowInput: WorkflowInput = {
        type: 'document_analysis',
        documentContent,
        userLevel: 'intermediate'
      };
      
      const result = await this.orchestrator.executeWorkflow(workflowInput);
      
      if (!result.success || !result.results.keyPoints) {
        throw new Error('Failed to extract key points using agent system');
      }
      
      return result.results.keyPoints;
    } catch (error) {
      this.logger.error(`Key point extraction failed: ${error.message}`);
      throw new Error(`Failed to extract key points: ${error.message}`);
    }
  }

  async generateLearningPath(
    keyPoints: KeyPoint[],
    userLevel: 'beginner' | 'advanced'
  ): Promise<LearningStep[]> {
    try {
      this.logger.log(`Generating learning path for ${userLevel} level`);
      
      const workflowInput: WorkflowInput = {
        type: 'learning_generation',
        keyPoints,
        userLevel
      };
      
      const result = await this.orchestrator.executeWorkflow(workflowInput);
      
      if (!result.success || !result.results.learningPath) {
        throw new Error('Failed to generate learning path using agent system');
      }
      
      return result.results.learningPath;
    } catch (error) {
      this.logger.error(`Learning path generation failed: ${error.message}`);
      throw new Error(`Failed to generate learning path: ${error.message}`);
    }
  }

  async generateQuiz(keyPoints: KeyPoint[], documentContent?: DocumentContent): Promise<QuizQuestion[]> {
    try {
      this.logger.log('Generating quiz questions');
      
      const workflowInput: WorkflowInput = {
        type: 'quiz_generation',
        keyPoints,
        documentContent,
        questionCount: 5,
        userLevel: 'intermediate'
      };
      
      const result = await this.orchestrator.executeWorkflow(workflowInput);
      
      if (!result.success || !result.results.quiz) {
        throw new Error('Failed to generate quiz using agent system');
      }
      
      return result.results.quiz;
    } catch (error) {
      this.logger.error(`Quiz generation failed: ${error.message}`);
      throw new Error(`Failed to generate quiz: ${error.message}`);
    }
  }

  async answerQuestion(
    question: string,
    documentContent: string | DocumentContent,
    dialogHistory: Array<{ question: string; answer: string }>
  ): Promise<string> {
    try {
      this.logger.log(`Answering question: ${question}`);
      
      // 确保documentContent是DocumentContent对象
      const docContent: DocumentContent = typeof documentContent === 'string' 
        ? { title: 'Document', content: documentContent, url: '' }
        : documentContent;
      
      const workflowInput: WorkflowInput = {
        type: 'interactive_qa',
        question,
        documentContent: docContent,
        conversationHistory: dialogHistory
      };
      
      const result = await this.orchestrator.executeWorkflow(workflowInput);
      
      if (!result.success || !result.results.answer) {
        throw new Error('Failed to answer question using agent system');
      }
      
      return result.results.answer;
    } catch (error) {
      this.logger.error(`Question answering failed: ${error.message}`);
      throw new Error(`Failed to answer question: ${error.message}`);
    }
  }

  /**
   * 执行完整的学习流水线
   * 从URL解析文档到生成完整的学习内容
   */
  async executeFullPipeline(
     url: string,
     userLevel: 'beginner' | 'advanced' = 'beginner'
   ): Promise<{
     documentContent: DocumentContent;
     keyPoints: KeyPoint[];
     learningPath: LearningStep[];
     quiz: QuizQuestion[];
   }> {
    try {
      this.logger.log(`Executing full pipeline for URL: ${url}`);
      
      const workflowInput: WorkflowInput = {
        type: 'full_pipeline',
        url,
        userLevel,
        questionCount: 5
      };
      
      const result = await this.orchestrator.executeWorkflow(workflowInput);
      
      if (!result.success) {
        throw new Error('Full pipeline execution failed');
      }
      
      return {
        documentContent: result.results.documentContent!,
        keyPoints: result.results.keyPoints!,
        learningPath: result.results.learningPath!,
        quiz: result.results.quiz!
      };
    } catch (error) {
      this.logger.error(`Full pipeline execution failed: ${error.message}`);
      throw new Error(`Failed to execute full pipeline: ${error.message}`);
    }
  }

  /**
   * 获取智能体系统健康状态
   */
  async getHealthStatus(): Promise<Record<string, boolean>> {
    return this.orchestrator.getAgentsHealthStatus();
  }

  /**
   * 重置智能体系统
   */
  async resetAgents(): Promise<void> {
    return this.orchestrator.resetAllAgents();
  }

  /**
   * 使用LangGraph工作流执行完整流程
   */
  async executeWorkflow(
    workflowId: string,
    initialState: {
      url?: string;
      documentContent?: DocumentContent;
      keyPoints?: KeyPoint[];
      question?: string;
      userLevel?: 'beginner' | 'intermediate' | 'advanced';
      questionCount?: number;
      conversationHistory?: Array<{ question: string; answer: string }>;
    }
  ) {
    try {
      this.logger.log(`执行工作流: ${workflowId}`);
      
      const result = await this.workflowExecutor.executeWorkflow(workflowId, initialState);
      
      if (!result.completed && result.errors && result.errors.length > 0) {
        this.logger.error(`工作流执行失败: ${result.errors.join(', ')}`);
        throw new Error(`工作流执行失败: ${result.errors.join(', ')}`);
      }
      
      return result;
    } catch (error) {
      this.logger.error(`工作流执行错误: ${error.message}`);
      throw new Error(`工作流执行错误: ${error.message}`);
    }
  }

  /**
   * 流式执行工作流
   */
  async *streamWorkflow(
    workflowId: string,
    initialState: {
      url?: string;
      documentContent?: DocumentContent;
      keyPoints?: KeyPoint[];
      question?: string;
      userLevel?: 'beginner' | 'intermediate' | 'advanced';
      questionCount?: number;
      conversationHistory?: Array<{ question: string; answer: string }>;
    }
  ) {
    try {
      this.logger.log(`流式执行工作流: ${workflowId}`);
      
      for await (const state of this.workflowExecutor.streamWorkflow(workflowId, initialState)) {
        yield state;
      }
    } catch (error) {
      this.logger.error(`流式工作流执行错误: ${error.message}`);
      throw new Error(`流式工作流执行错误: ${error.message}`);
    }
  }

  /**
   * 获取可用的工作流列表
   */
  getAvailableWorkflows() {
    return this.workflowExecutor.getAvailableWorkflows();
  }

  /**
   * 获取工作流可视化
   */
  getWorkflowVisualization(workflowId: string) {
    return this.workflowExecutor.getWorkflowVisualization(workflowId);
  }

  /**
   * 使用模板渲染提示词
   */
  async renderPromptTemplate(templateId: string, variables: Record<string, any>): Promise<any> {
    try {
      const rendered = await this.promptTemplateService.renderTemplate(templateId, {
        variables,
        validateVariables: true,
        escapeHtml: false,
        trimWhitespace: true,
        preserveFormatting: false
      });
      
      this.logger.log(`成功渲染模板: ${templateId}`);
      return rendered;
    } catch (error) {
      this.logger.error(`渲染模板失败: ${templateId}`, error);
      throw error;
    }
  }

  /**
   * 获取可用的提示词模板
   */
  async getAvailablePromptTemplates(category?: string): Promise<any[]> {
    const criteria: any = {};
    if (category) {
      criteria.category = category;
    }
    
    return await this.promptTemplateService.searchTemplates(criteria);
  }

  /**
   * 创建自定义提示词模板
   */
  async createCustomPromptTemplate(template: any): Promise<any> {
    return await this.promptTemplateService.createTemplate(template);
  }
}