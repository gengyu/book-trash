/**
 * 文档内容接口
 */
export interface DocumentContent {
  title: string;
  content: string;
  url: string;
  metadata?: {
    wordCount: number;
    language?: string;
    lastModified?: Date;
  };
}

/**
 * 关键点接口
 */
export interface KeyPoint {
  concept: string;
  description: string;
  importance: 'high' | 'medium' | 'low';
  category?: string;
  examples?: string[];
}

/**
 * 学习步骤接口
 */
export interface LearningStep {
  step: string;
  time: string;
  code?: string;
  description: string;
  prerequisites?: string[];
  resources?: string[];
}

/**
 * 测验问题接口
 */
export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'fill_blank';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category?: string;
  concept?: string;
  points?: number;
}

/**
 * 文档解析智能体输入
 */
export interface DocumentParserInput {
  url: string;
  options?: {
    maxContentLength?: number;
    includeMetadata?: boolean;
  };
}

/**
 * 关键点提取智能体输入
 */
export interface KeyPointExtractorInput {
  documentContent: DocumentContent;
  userLevel: 'beginner' | 'advanced';
  maxKeyPoints?: number;
}

/**
 * 学习路径生成智能体输入
 */
export interface LearningPathInput {
  keyPoints: KeyPoint[];
  userLevel: 'beginner' | 'advanced';
  timeConstraint?: string;
  focusAreas?: string[];
}

/**
 * 问答智能体输入
 */
export interface QAInput {
  question: string;
  documentContent: DocumentContent;
  keyPoints?: KeyPoint[];
  conversationHistory?: Array<{ question: string; answer: string }>;
}

/**
 * 测验生成智能体输入
 */
export interface QuizGeneratorInput {
  documentContent: DocumentContent;
  keyPoints?: KeyPoint[];
  userLevel?: 'beginner' | 'intermediate' | 'advanced';
  questionCount?: number;
  questionTypes?: ('multiple_choice' | 'true_false' | 'short_answer' | 'fill_blank')[];
  difficultyLevel?: 'easy' | 'medium' | 'hard' | 'mixed';
}

/**
 * 智能体输出类型
 */
export type DocumentParserOutput = DocumentContent;
export type KeyPointExtractorOutput = KeyPoint[];
export type LearningPathOutput = LearningStep[];
export type QAOutput = string;
export type QuizGeneratorOutput = QuizQuestion[];

/**
 * 智能体错误类型
 */
export enum AgentErrorType {
  INVALID_INPUT = 'INVALID_INPUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  LLM_ERROR = 'LLM_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * 智能体错误接口
 */
export interface AgentError {
  type: AgentErrorType;
  message: string;
  details?: any;
  timestamp: Date;
}