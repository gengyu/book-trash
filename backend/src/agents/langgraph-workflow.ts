import { DocumentParserAgent } from './document-parser.agent';
import { KeyPointExtractorAgent } from './keypoint-extractor.agent';
import { LearningPathAgent } from './learning-path.agent';
import { QAAgent } from './qa.agent';
import { QuizAgent } from './quiz.agent';
import { AgentContext, AgentResult } from './base-agent.interface';
import { DocumentContent, KeyPoint, LearningStep, QuizQuestion } from './agent-types';

/**
 * 工作流步骤类型
 */
export type WorkflowStepType = 
  | 'parse_document'
  | 'extract_keypoints'
  | 'generate_learning_path'
  | 'generate_quiz'
  | 'answer_question';

/**
 * 工作流状态接口
 */
export interface WorkflowState {
  // 输入参数
  url?: string;
  documentContent?: DocumentContent;
  keyPoints?: KeyPoint[];
  question?: string;
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
  questionCount?: number;
  conversationHistory?: Array<{ question: string; answer: string }>;
  
  // 中间结果
  parsedDocument?: DocumentContent;
  extractedKeyPoints?: KeyPoint[];
  generatedLearningPath?: LearningStep[];
  generatedQuiz?: QuizQuestion[];
  answer?: string;
  
  // 元数据
  errors?: string[];
  currentStep?: string;
  sessionId?: string;
  completed?: boolean;
}

/**
 * 工作流步骤定义
 */
export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  condition?: (state: WorkflowState) => boolean;
  dependencies?: string[];
}

/**
 * 工作流定义
 */
export interface WorkflowDefinition {
  id: string;
  name: string;
  steps: WorkflowStep[];
  entryPoint: string;
}

/**
 * 简化的工作流执行器
 */
export class SimpleWorkflowExecutor {
  private documentParser: DocumentParserAgent;
  private keyPointExtractor: KeyPointExtractorAgent;
  private learningPathAgent: LearningPathAgent;
  private qaAgent: QAAgent;
  private quizAgent: QuizAgent;

  constructor() {
    this.documentParser = new DocumentParserAgent();
    this.keyPointExtractor = new KeyPointExtractorAgent();
    this.learningPathAgent = new LearningPathAgent();
    this.qaAgent = new QAAgent();
    this.quizAgent = new QuizAgent();
  }

  /**
   * 预定义的工作流
   */
  private getWorkflowDefinitions(): Record<string, WorkflowDefinition> {
    return {
      document_analysis: {
        id: 'document_analysis',
        name: 'Document Analysis Workflow',
        steps: [
          { id: 'parse', type: 'parse_document' },
          { id: 'extract', type: 'extract_keypoints', dependencies: ['parse'] }
        ],
        entryPoint: 'parse'
      },
      learning_generation: {
        id: 'learning_generation',
        name: 'Learning Path Generation Workflow',
        steps: [
          { id: 'extract', type: 'extract_keypoints' },
          { id: 'generate_path', type: 'generate_learning_path', dependencies: ['extract'] }
        ],
        entryPoint: 'extract'
      },
      quiz_generation: {
        id: 'quiz_generation',
        name: 'Quiz Generation Workflow',
        steps: [
          { id: 'generate_quiz', type: 'generate_quiz' }
        ],
        entryPoint: 'generate_quiz'
      },
      interactive_qa: {
        id: 'interactive_qa',
        name: 'Interactive Q&A Workflow',
        steps: [
          { id: 'answer', type: 'answer_question' }
        ],
        entryPoint: 'answer'
      },
      full_pipeline: {
        id: 'full_pipeline',
        name: 'Full Learning Pipeline',
        steps: [
          { id: 'parse', type: 'parse_document' },
          { id: 'extract', type: 'extract_keypoints', dependencies: ['parse'] },
          { id: 'generate_path', type: 'generate_learning_path', dependencies: ['extract'] },
          { 
            id: 'generate_quiz', 
            type: 'generate_quiz', 
            dependencies: ['extract'],
            condition: (state) => (state.questionCount || 0) > 0
          }
        ],
        entryPoint: 'parse'
      }
    };
  }

  /**
   * 执行单个工作流步骤
   */
  private async executeStep(
     stepType: WorkflowStepType,
     state: WorkflowState
   ): Promise<Partial<WorkflowState>> {
     const context: AgentContext = {
        sessionId: state.sessionId || 'default',
        userLevel: this.normalizeUserLevel(state.userLevel),
        documentContent: (state.parsedDocument || state.documentContent)?.content,
        dialogHistory: state.conversationHistory || [],
        metadata: {}
      };

    try {
      switch (stepType) {
        case 'parse_document':
          return await this.executeParseDocument(state, context);
        case 'extract_keypoints':
          return await this.executeExtractKeypoints(state, context);
        case 'generate_learning_path':
          return await this.executeGenerateLearningPath(state, context);
        case 'generate_quiz':
          return await this.executeGenerateQuiz(state, context);
        case 'answer_question':
          return await this.executeAnswerQuestion(state, context);
        default:
          throw new Error(`Unknown step type: ${stepType}`);
      }
    } catch (error) {
      return {
        errors: [...(state.errors || []), `Step ${stepType} failed: ${error.message}`]
      };
    }
  }

  /**
   * 标准化用户级别
   */
  private normalizeUserLevel(userLevel?: string): 'beginner' | 'advanced' {
    if (userLevel === 'advanced') return 'advanced';
    return 'beginner'; // 默认为beginner，包括intermediate
  }

  /**
   * 执行文档解析步骤
   */
  private async executeParseDocument(
    state: WorkflowState,
    context: AgentContext
  ): Promise<Partial<WorkflowState>> {
    if (!state.url) {
      throw new Error('URL is required for document parsing');
    }

    const result: AgentResult<DocumentContent> = await this.documentParser.execute({
      url: state.url
    }, context);

    if (!result.success) {
      throw new Error(result.error || 'Document parsing failed');
    }

    return {
      parsedDocument: result.data,
      documentContent: result.data,
      currentStep: 'document_parsed'
    };
  }

  /**
   * 执行关键点提取步骤
   */
  private async executeExtractKeypoints(
    state: WorkflowState,
    context: AgentContext
  ): Promise<Partial<WorkflowState>> {
    const documentContent = state.parsedDocument || state.documentContent;
    if (!documentContent) {
      throw new Error('Document content is required for key point extraction');
    }

    const result: AgentResult<KeyPoint[]> = await this.keyPointExtractor.execute({
      documentContent,
      userLevel: this.normalizeUserLevel(state.userLevel)
    }, context);

    if (!result.success) {
      throw new Error(result.error || 'Key point extraction failed');
    }

    return {
      extractedKeyPoints: result.data,
      keyPoints: result.data,
      currentStep: 'keypoints_extracted'
    };
  }

  /**
   * 执行学习路径生成步骤
   */
  private async executeGenerateLearningPath(
    state: WorkflowState,
    context: AgentContext
  ): Promise<Partial<WorkflowState>> {
    const keyPoints = state.extractedKeyPoints || state.keyPoints;
    if (!keyPoints || keyPoints.length === 0) {
      throw new Error('Key points are required for learning path generation');
    }

    const result: AgentResult<LearningStep[]> = await this.learningPathAgent.execute({
      keyPoints,
      userLevel: this.normalizeUserLevel(state.userLevel)
    }, context);

    if (!result.success) {
      throw new Error(result.error || 'Learning path generation failed');
    }

    return {
      generatedLearningPath: result.data,
      currentStep: 'learning_path_generated'
    };
  }

  /**
   * 执行测验生成步骤
   */
  private async executeGenerateQuiz(
    state: WorkflowState,
    context: AgentContext
  ): Promise<Partial<WorkflowState>> {
    const keyPoints = state.extractedKeyPoints || state.keyPoints;
    if (!keyPoints || keyPoints.length === 0) {
      throw new Error('Key points are required for quiz generation');
    }

    const result: AgentResult<QuizQuestion[]> = await this.quizAgent.execute({
      keyPoints,
      documentContent: state.parsedDocument || state.documentContent,
      questionCount: state.questionCount || 5,
      userLevel: this.normalizeUserLevel(state.userLevel),
      questionTypes: ['multiple_choice', 'true_false', 'fill_blank'],
      difficultyLevel: 'medium'
    }, context);

    if (!result.success) {
      throw new Error(result.error || 'Quiz generation failed');
    }

    return {
      generatedQuiz: result.data,
      currentStep: 'quiz_generated'
    };
  }

  /**
   * 执行问答步骤
   */
  private async executeAnswerQuestion(
    state: WorkflowState,
    context: AgentContext
  ): Promise<Partial<WorkflowState>> {
    if (!state.question || !state.documentContent) {
      throw new Error('Question and document content are required for QA');
    }

    const result: AgentResult<string> = await this.qaAgent.execute({
      question: state.question,
      documentContent: state.documentContent,
      conversationHistory: state.conversationHistory || []
    }, context);

    if (!result.success) {
      throw new Error(result.error || 'Question answering failed');
    }

    return {
      answer: result.data,
      currentStep: 'question_answered'
    };
  }

  /**
   * 检查步骤依赖是否满足
   */
  private checkDependencies(
    step: WorkflowStep,
    completedSteps: Set<string>
  ): boolean {
    if (!step.dependencies) return true;
    return step.dependencies.every(dep => completedSteps.has(dep));
  }

  /**
   * 检查步骤条件是否满足
   */
  private checkCondition(step: WorkflowStep, state: WorkflowState): boolean {
    if (!step.condition) return true;
    return step.condition(state);
  }

  /**
   * 执行工作流
   */
  async executeWorkflow(
    workflowId: string,
    initialState: Partial<WorkflowState>
  ): Promise<WorkflowState> {
    const workflows = this.getWorkflowDefinitions();
    const workflow = workflows[workflowId];
    
    if (!workflow) {
      throw new Error(`Unknown workflow: ${workflowId}`);
    }

    let state: WorkflowState = {
      ...initialState,
      errors: [],
      sessionId: initialState.sessionId || `session_${Date.now()}`,
      completed: false
    };

    const completedSteps = new Set<string>();
    const pendingSteps = [...workflow.steps];

    while (pendingSteps.length > 0) {
      let progressMade = false;

      for (let i = pendingSteps.length - 1; i >= 0; i--) {
        const step = pendingSteps[i];
        
        // 检查依赖和条件
        if (this.checkDependencies(step, completedSteps) && 
            this.checkCondition(step, state)) {
          
          try {
            const stepResult = await this.executeStep(step.type, state);
            state = { ...state, ...stepResult };
            completedSteps.add(step.id);
            pendingSteps.splice(i, 1);
            progressMade = true;
          } catch (error) {
            state.errors = [...(state.errors || []), 
              `Step ${step.id} failed: ${error.message}`];
            pendingSteps.splice(i, 1);
            progressMade = true;
          }
        }
      }

      // 如果没有进展，可能存在循环依赖或无法满足的条件
      if (!progressMade) {
        state.errors = [...(state.errors || []), 
          'Workflow execution stalled - possible circular dependencies or unmet conditions'];
        break;
      }
    }

    state.completed = pendingSteps.length === 0 && (state.errors?.length || 0) === 0;
    return state;
  }

  /**
   * 流式执行工作流
   */
  async *streamWorkflow(
    workflowId: string,
    initialState: Partial<WorkflowState>
  ): AsyncGenerator<WorkflowState> {
    const workflows = this.getWorkflowDefinitions();
    const workflow = workflows[workflowId];
    
    if (!workflow) {
      throw new Error(`Unknown workflow: ${workflowId}`);
    }

    let state: WorkflowState = {
      ...initialState,
      errors: [],
      sessionId: initialState.sessionId || `session_${Date.now()}`,
      completed: false
    };

    yield state;

    const completedSteps = new Set<string>();
    const pendingSteps = [...workflow.steps];

    while (pendingSteps.length > 0) {
      let progressMade = false;

      for (let i = pendingSteps.length - 1; i >= 0; i--) {
        const step = pendingSteps[i];
        
        if (this.checkDependencies(step, completedSteps) && 
            this.checkCondition(step, state)) {
          
          try {
            const stepResult = await this.executeStep(step.type, state);
            state = { ...state, ...stepResult };
            completedSteps.add(step.id);
            pendingSteps.splice(i, 1);
            progressMade = true;
            yield state;
          } catch (error) {
            state.errors = [...(state.errors || []), 
              `Step ${step.id} failed: ${error.message}`];
            pendingSteps.splice(i, 1);
            progressMade = true;
            yield state;
          }
        }
      }

      if (!progressMade) {
        state.errors = [...(state.errors || []), 
          'Workflow execution stalled'];
        yield state;
        break;
      }
    }

    state.completed = pendingSteps.length === 0 && (state.errors?.length || 0) === 0;
    yield state;
  }

  /**
   * 获取可用的工作流列表
   */
  getAvailableWorkflows(): WorkflowDefinition[] {
    return Object.values(this.getWorkflowDefinitions());
  }

  /**
   * 获取工作流的可视化表示
   */
  getWorkflowVisualization(workflowId: string): string {
    const workflows = this.getWorkflowDefinitions();
    const workflow = workflows[workflowId];
    
    if (!workflow) {
      return `Workflow '${workflowId}' not found`;
    }

    let mermaid = `graph TD\n`;
    
    workflow.steps.forEach(step => {
      mermaid += `  ${step.id}[${step.type}]\n`;
      
      if (step.dependencies) {
        step.dependencies.forEach(dep => {
          mermaid += `  ${dep} --> ${step.id}\n`;
        });
      }
    });

    return mermaid;
  }
}

// 导出简化的工作流执行器作为默认的LangGraph实现
export const LangGraphWorkflow = SimpleWorkflowExecutor;