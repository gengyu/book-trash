import { BaseAgent } from './base-agent.abstract';
import { AgentContext } from './base-agent.interface';
import { 
  QuizGeneratorInput, 
  QuizGeneratorOutput, 
  QuizQuestion,
  KeyPoint,
  AgentErrorType 
} from './agent-types';
import { PromptTemplate } from 'langchain/prompts';
import { LLMChain } from 'langchain/chains';

/**
 * 测验生成智能体
 * 负责根据文档内容和关键点生成各种类型的测试题目
 */
export class QuizAgent extends BaseAgent<QuizGeneratorInput, QuizGeneratorOutput> {
  private promptTemplate: PromptTemplate;
  private chain: LLMChain;
  private readonly maxContentLength = 2500; // 最大内容长度
  private readonly defaultQuestionCount = 5; // 默认题目数量

  constructor() {
    super({
      name: 'Quiz',
      description: '根据学习内容生成多种类型的测试题目',
      maxRetries: 2,
      timeout: 30000
    });

    this.initializePromptTemplate();
    this.chain = new LLMChain({
      llm: this.llm,
      prompt: this.promptTemplate,
      verbose: false
    });
  }

  /**
   * 初始化提示词模板
   */
  private initializePromptTemplate(): void {
    const templateString = `你是一个专业的教育测评专家。请根据提供的学习内容生成高质量的测试题目。

文档信息:
标题: {documentTitle}
内容: {documentContent}

关键概念:
{keyPointsText}

生成要求:
- 题目类型: {questionTypes}
- 题目数量: {questionCount}
- 难度级别: {difficultyLevel}
- 用户水平: {userLevel}

请严格按照以下JSON格式输出，确保JSON格式正确：

\`\`\`json
[
  {
    "id": "q1",
    "type": "multiple_choice",
    "question": "题目内容",
    "options": ["选项A", "选项B", "选项C", "选项D"],
    "correctAnswer": "选项A",
    "explanation": "答案解释",
    "difficulty": "easy",
    "concept": "相关概念",
    "points": 1
  },
  {
    "id": "q2",
    "type": "true_false",
    "question": "判断题内容",
    "options": ["正确", "错误"],
    "correctAnswer": "正确",
    "explanation": "答案解释",
    "difficulty": "medium",
    "concept": "相关概念",
    "points": 1
  },
  {
    "id": "q3",
    "type": "fill_blank",
    "question": "填空题内容，空白处用 _____ 表示",
    "options": [],
    "correctAnswer": "正确答案",
    "explanation": "答案解释",
    "difficulty": "hard",
    "concept": "相关概念",
    "points": 2
  }
]
\`\`\`

题目设计原则:
1. 题目要准确反映文档核心内容
2. 选择题要有4个选项，其中1个正确答案和3个合理的干扰项
3. 判断题要基于明确的事实或概念
4. 填空题要测试关键术语或概念
5. 每道题都要有清晰的解释说明
6. 根据用户水平调整题目难度
7. 确保题目覆盖不同的知识点
8. 避免过于简单或过于复杂的题目

难度级别说明:
- easy: 基础概念理解和记忆
- medium: 概念应用和分析
- hard: 综合运用和深度理解

请开始生成测试题目：`;

    this.promptTemplate = new PromptTemplate({
      template: templateString,
      inputVariables: [
        'documentTitle',
        'documentContent', 
        'keyPointsText',
        'questionTypes',
        'questionCount',
        'difficultyLevel',
        'userLevel'
      ]
    });
  }

  /**
   * 验证输入参数
   */
  validateInput(input: QuizGeneratorInput): boolean {
    if (!input || !input.documentContent) {
      return false;
    }

    if (!input.documentContent.content || input.documentContent.content.trim().length === 0) {
      return false;
    }

    // 验证题目数量
    if (input.questionCount && (input.questionCount < 1 || input.questionCount > 20)) {
      return false;
    }

    // 验证难度级别
    if (input.difficultyLevel && !['easy', 'medium', 'hard', 'mixed'].includes(input.difficultyLevel)) {
      return false;
    }

    // 验证用户水平
    if (input.userLevel && !['beginner', 'intermediate', 'advanced'].includes(input.userLevel)) {
      return false;
    }

    return true;
  }

  /**
   * 执行测验生成
   */
  protected async doExecute(
    input: QuizGeneratorInput, 
    context: AgentContext
  ): Promise<QuizGeneratorOutput> {
    try {
      const {
        documentContent,
        keyPoints,
        questionCount = this.defaultQuestionCount,
        questionTypes = ['multiple_choice', 'true_false'],
        difficultyLevel = 'mixed',
        userLevel = 'intermediate'
      } = input;

      // 预处理文档内容
      const processedContent = this.preprocessDocumentContent(documentContent.content);
      
      // 准备关键点文本
      const keyPointsText = keyPoints ? this.formatKeyPointsText(keyPoints) : '无关键点信息';
      
      // 格式化题目类型
      const formattedTypes = this.formatQuestionTypes(questionTypes);
      
      // 准备输入数据
      const promptInput = {
        documentTitle: documentContent.title || 'Untitled',
        documentContent: processedContent,
        keyPointsText,
        questionTypes: formattedTypes,
        questionCount: questionCount.toString(),
        difficultyLevel,
        userLevel
      };

      // 调用LLM生成测验
      const response = await this.chain.call(promptInput);
      const rawOutput = response.text || response.response || '';

      // 解析和验证生成的题目
      const questions = this.parseQuizQuestions(rawOutput);
      
      if (!questions || questions.length === 0) {
        throw new Error('No valid questions generated');
      }

      // 后处理和优化题目
      const optimizedQuestions = this.optimizeQuestions(questions, questionCount);
      
      return optimizedQuestions;

    } catch (error) {
      if (error.message.includes('timeout')) {
        throw new Error(`${AgentErrorType.TIMEOUT_ERROR}: LLM request timeout`);
      } else if (error.message.includes('API') || error.message.includes('model')) {
        throw new Error(`${AgentErrorType.LLM_ERROR}: ${error.message}`);
      } else if (error.message.includes('parse') || error.message.includes('JSON')) {
        throw new Error(`${AgentErrorType.PARSING_ERROR}: Failed to parse quiz questions`);
      } else {
        throw new Error(`${AgentErrorType.UNKNOWN_ERROR}: ${error.message}`);
      }
    }
  }

  /**
   * 预处理文档内容
   */
  private preprocessDocumentContent(content: string): string {
    let processedContent = this.cleanText(content);
    
    // 限制内容长度
    if (processedContent.length > this.maxContentLength) {
      // 智能截取：保留重要部分
      const sections = processedContent.split(/\n\s*\n/);
      let result = '';
      let currentLength = 0;
      
      for (const section of sections) {
        if (currentLength + section.length <= this.maxContentLength) {
          result += section + '\n\n';
          currentLength += section.length + 2;
        } else {
          break;
        }
      }
      
      processedContent = result.trim();
    }
    
    return processedContent;
  }

  /**
   * 格式化关键点文本
   */
  private formatKeyPointsText(keyPoints: KeyPoint[]): string {
    if (!keyPoints || keyPoints.length === 0) {
      return '无关键点信息';
    }

    return keyPoints.map((kp, index) => {
      return `${index + 1}. ${kp.concept}: ${kp.description}`;
    }).join('\n');
  }

  /**
   * 格式化题目类型
   */
  private formatQuestionTypes(types: string[]): string {
    const typeMap = {
      'multiple_choice': '选择题',
      'true_false': '判断题',
      'fill_blank': '填空题',
      'short_answer': '简答题'
    };

    return types.map(type => typeMap[type] || type).join('、');
  }

  /**
   * 解析测验题目
   */
  private parseQuizQuestions(rawOutput: string): QuizQuestion[] {
    try {
      // 提取JSON部分
      const jsonMatch = rawOutput.match(/```json\s*([\s\S]*?)\s*```/) || 
                       rawOutput.match(/\[\s*[\s\S]*?\]/);
      
      if (!jsonMatch) {
        // 尝试文本解析
        return this.parseTextQuestions(rawOutput);
      }

      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonStr);
      
      if (!Array.isArray(parsed)) {
        throw new Error('Parsed result is not an array');
      }

      return parsed.map((q, index) => this.validateAndNormalizeQuestion(q, index + 1));
      
    } catch (error) {
      console.warn('JSON parsing failed, trying text parsing:', error.message);
      return this.parseTextQuestions(rawOutput);
    }
  }

  /**
   * 文本解析题目（备用方案）
   */
  private parseTextQuestions(text: string): QuizQuestion[] {
    const questions: QuizQuestion[] = [];
    const lines = text.split('\n').filter(line => line.trim());
    
    let currentQuestion: Partial<QuizQuestion> = {};
    let questionIndex = 1;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // 检测题目开始
      if (trimmedLine.match(/^\d+[.、]/) || trimmedLine.includes('题目')) {
        if (currentQuestion.question) {
          questions.push(this.completeQuestion(currentQuestion, questionIndex++));
          currentQuestion = {};
        }
        currentQuestion.question = trimmedLine.replace(/^\d+[.、]\s*/, '');
        currentQuestion.type = 'multiple_choice';
      }
      // 检测选项
      else if (trimmedLine.match(/^[A-D][.、)]/)) {
        if (!currentQuestion.options) currentQuestion.options = [];
        currentQuestion.options.push(trimmedLine.replace(/^[A-D][.、)]\s*/, ''));
      }
      // 检测答案
      else if (trimmedLine.includes('答案') || trimmedLine.includes('正确答案')) {
        const answerMatch = trimmedLine.match(/[A-D]/);
        if (answerMatch && currentQuestion.options) {
          const answerIndex = answerMatch[0].charCodeAt(0) - 'A'.charCodeAt(0);
          currentQuestion.correctAnswer = currentQuestion.options[answerIndex];
        }
      }
    }
    
    // 添加最后一个题目
    if (currentQuestion.question) {
      questions.push(this.completeQuestion(currentQuestion, questionIndex));
    }
    
    return questions;
  }

  /**
   * 完善题目信息
   */
  private completeQuestion(partial: Partial<QuizQuestion>, index: number): QuizQuestion {
    return {
      id: partial.id || `q${index}`,
      type: partial.type || 'multiple_choice',
      question: partial.question || `题目 ${index}`,
      options: partial.options || ['选项A', '选项B', '选项C', '选项D'],
      correctAnswer: partial.correctAnswer || (partial.options?.[0] || '选项A'),
      explanation: partial.explanation || '暂无解释',
      difficulty: partial.difficulty || 'medium',
      concept: partial.concept || '基础概念',
      points: partial.points || 1
    };
  }

  /**
   * 验证和标准化题目
   */
  private validateAndNormalizeQuestion(question: any, index: number): QuizQuestion {
    const normalized: QuizQuestion = {
      id: question.id || `q${index}`,
      type: question.type || 'multiple_choice',
      question: this.cleanText(question.question || `题目 ${index}`),
      options: Array.isArray(question.options) ? 
        question.options.map(opt => this.cleanText(opt)) : 
        ['选项A', '选项B', '选项C', '选项D'],
      correctAnswer: this.cleanText(question.correctAnswer || question.options?.[0] || '选项A'),
      explanation: this.cleanText(question.explanation || '暂无解释'),
      difficulty: ['easy', 'medium', 'hard'].includes(question.difficulty) ? 
        question.difficulty : 'medium',
      concept: this.cleanText(question.concept || '基础概念'),
      points: typeof question.points === 'number' && question.points > 0 ? 
        question.points : 1
    };

    // 验证选择题选项数量
    if (normalized.type === 'multiple_choice' && normalized.options.length < 2) {
      normalized.options = ['选项A', '选项B', '选项C', '选项D'];
      normalized.correctAnswer = '选项A';
    }

    // 验证判断题选项
    if (normalized.type === 'true_false') {
      normalized.options = ['正确', '错误'];
      if (!['正确', '错误'].includes(normalized.correctAnswer)) {
        normalized.correctAnswer = '正确';
      }
    }

    // 验证填空题
    if (normalized.type === 'fill_blank') {
      normalized.options = [];
      if (!normalized.question.includes('_____')) {
        normalized.question += ' _____';
      }
    }

    return normalized;
  }

  /**
   * 优化题目集合
   */
  private optimizeQuestions(questions: QuizQuestion[], targetCount: number): QuizQuestion[] {
    // 去重
    const uniqueQuestions = this.removeDuplicateQuestions(questions);
    
    // 调整数量
    let result = uniqueQuestions.slice(0, targetCount);
    
    // 如果题目不足，生成补充题目
    if (result.length < targetCount) {
      const additionalQuestions = this.generateFallbackQuestions(
        targetCount - result.length,
        result.length + 1
      );
      result = result.concat(additionalQuestions);
    }
    
    // 平衡难度分布
    result = this.balanceDifficulty(result);
    
    return result;
  }

  /**
   * 移除重复题目
   */
  private removeDuplicateQuestions(questions: QuizQuestion[]): QuizQuestion[] {
    const seen = new Set<string>();
    return questions.filter(q => {
      const key = q.question.toLowerCase().replace(/\s+/g, '');
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  /**
   * 生成备用题目
   */
  private generateFallbackQuestions(count: number, startIndex: number): QuizQuestion[] {
    const fallbackQuestions: QuizQuestion[] = [];
    
    for (let i = 0; i < count; i++) {
      fallbackQuestions.push({
        id: `q${startIndex + i}`,
        type: 'multiple_choice',
        question: `关于本文档内容，以下哪个说法是正确的？`,
        options: ['选项A', '选项B', '选项C', '选项D'],
        correctAnswer: '选项A',
        explanation: '请参考文档内容进行理解',
        difficulty: 'medium',
        concept: '综合理解',
        points: 1
      });
    }
    
    return fallbackQuestions;
  }

  /**
   * 平衡难度分布
   */
  private balanceDifficulty(questions: QuizQuestion[]): QuizQuestion[] {
    const easyCount = Math.ceil(questions.length * 0.3);
    const hardCount = Math.ceil(questions.length * 0.2);
    const mediumCount = questions.length - easyCount - hardCount;
    
    const easy = questions.filter(q => q.difficulty === 'easy').slice(0, easyCount);
    const medium = questions.filter(q => q.difficulty === 'medium').slice(0, mediumCount);
    const hard = questions.filter(q => q.difficulty === 'hard').slice(0, hardCount);
    
    // 如果某个难度的题目不足，从其他难度补充
    const result = [...easy, ...medium, ...hard];
    
    if (result.length < questions.length) {
      const remaining = questions.filter(q => !result.includes(q));
      result.push(...remaining.slice(0, questions.length - result.length));
    }
    
    return result;
  }

  /**
   * 生成题目统计信息
   */
  static generateQuizStatistics(questions: QuizQuestion[]): {
    totalQuestions: number;
    byType: Record<string, number>;
    byDifficulty: Record<string, number>;
    totalPoints: number;
    averagePoints: number;
  } {
    const stats = {
      totalQuestions: questions.length,
      byType: {} as Record<string, number>,
      byDifficulty: {} as Record<string, number>,
      totalPoints: 0,
      averagePoints: 0
    };
    
    questions.forEach(q => {
      // 统计题目类型
      stats.byType[q.type] = (stats.byType[q.type] || 0) + 1;
      
      // 统计难度分布
      stats.byDifficulty[q.difficulty] = (stats.byDifficulty[q.difficulty] || 0) + 1;
      
      // 统计分数
      stats.totalPoints += q.points;
    });
    
    stats.averagePoints = stats.totalQuestions > 0 ? 
      stats.totalPoints / stats.totalQuestions : 0;
    
    return stats;
  }

  /**
   * 验证测验答案
   */
  static validateQuizAnswers(
    questions: QuizQuestion[], 
    userAnswers: Record<string, string>
  ): {
    score: number;
    totalPoints: number;
    correctCount: number;
    results: Array<{
      questionId: string;
      correct: boolean;
      userAnswer: string;
      correctAnswer: string;
      points: number;
    }>;
  } {
    let score = 0;
    let correctCount = 0;
    const results = [];
    
    for (const question of questions) {
      const userAnswer = userAnswers[question.id] || '';
      const isCorrect = userAnswer === question.correctAnswer;
      
      if (isCorrect) {
        score += question.points;
        correctCount++;
      }
      
      results.push({
        questionId: question.id,
        correct: isCorrect,
        userAnswer,
        correctAnswer: question.correctAnswer,
        points: isCorrect ? question.points : 0
      });
    }
    
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    
    return {
      score,
      totalPoints,
      correctCount,
      results
    };
  }
}