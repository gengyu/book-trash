import { BaseAgent } from './base-agent.abstract';
import { AgentContext } from './base-agent.interface';
import { 
  QAInput, 
  QAOutput, 
  KeyPoint,
  DocumentContent,
  AgentErrorType 
} from './agent-types';
import { PromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';

/**
 * 问答智能体
 * 负责处理用户问题，基于文档内容和对话历史提供准确回答
 */
export class QAAgent extends BaseAgent<QAInput, QAOutput> {
  private promptTemplate: PromptTemplate;
  private chain: LLMChain;
  private readonly maxHistoryLength = 10; // 最大对话历史长度
  private readonly maxContextLength = 3000; // 最大上下文长度

  constructor() {
    super({
      name: 'QA',
      description: '基于文档内容回答用户问题，维护对话上下文',
      maxRetries: 2,
      timeout: 25000
    });

    this.initializePromptTemplate();
    this.chain = new LLMChain({
      llm: this.llm,
      prompt: this.promptTemplate
    });
  }

  /**
   * 初始化提示词模板
   */
  private initializePromptTemplate(): void {
    const templateString = `你是一个专业的技术学习助手。请基于提供的文档内容和对话历史，准确回答用户的问题。

文档信息:
标题: {documentTitle}
内容: {documentContent}

关键点:
{keyPointsText}

对话历史:
{conversationHistory}

用户问题: {question}

请按照以下要求回答：

1. 回答要准确、有用、易懂
2. 优先基于提供的文档内容回答
3. 如果文档中没有相关信息，请明确说明
4. 结合对话历史提供连贯的回答
5. 适当提供代码示例或实际应用场景
6. 如果问题不清楚，请要求用户澄清
7. 保持友好和专业的语调
8. 回答长度控制在200-500字之间

特殊情况处理：
- 如果用户问候或表示感谢，请友好回应
- 如果问题超出文档范围，建议相关的学习资源
- 如果问题涉及代码，提供简洁的示例
- 如果问题很复杂，可以分步骤解答

请开始回答：`;

    this.promptTemplate = new PromptTemplate({
      template: templateString,
      inputVariables: [
        'documentTitle', 
        'documentContent', 
        'keyPointsText', 
        'conversationHistory', 
        'question'
      ]
    });
  }

  /**
   * 验证输入参数
   */
  validateInput(input: QAInput): boolean {
    if (!input || !input.question) {
      return false;
    }

    if (input.question.trim().length === 0) {
      return false;
    }

    if (!input.documentContent || !input.documentContent.content) {
      return false;
    }

    return true;
  }

  /**
   * 执行问答
   */
  protected async doExecute(
    input: QAInput, 
    context: AgentContext
  ): Promise<QAOutput> {
    try {
      const { question, documentContent, keyPoints, conversationHistory } = input;
      
      // 预处理问题
      const processedQuestion = this.preprocessQuestion(question);
      
      // 准备文档内容
      const processedContent = this.preprocessDocumentContent(documentContent.content);
      
      // 准备关键点文本
      const keyPointsText = keyPoints ? this.formatKeyPointsText(keyPoints) : '无关键点信息';
      
      // 准备对话历史
      const historyText = this.formatConversationHistory(conversationHistory || []);
      
      // 准备输入数据
      const promptInput = {
        documentTitle: documentContent.title || 'Untitled',
        documentContent: processedContent,
        keyPointsText,
        conversationHistory: historyText,
        question: processedQuestion
      };

      // 调用LLM生成回答
      const response = await this.chain.call(promptInput);
      const answer = response.text || response.response || '';

      // 后处理回答
      const processedAnswer = this.postprocessAnswer(answer, processedQuestion);
      
      if (!processedAnswer || processedAnswer.trim().length === 0) {
        throw new Error('Generated answer is empty');
      }

      return processedAnswer;

    } catch (error) {
      if (error.message.includes('timeout')) {
        throw new Error(`${AgentErrorType.TIMEOUT_ERROR}: LLM request timeout`);
      } else if (error.message.includes('API') || error.message.includes('model')) {
        throw new Error(`${AgentErrorType.LLM_ERROR}: ${error.message}`);
      } else if (error.message.includes('empty') || error.message.includes('invalid')) {
        throw new Error(`${AgentErrorType.PARSING_ERROR}: Invalid response generated`);
      } else {
        throw new Error(`${AgentErrorType.UNKNOWN_ERROR}: ${error.message}`);
      }
    }
  }

  /**
   * 预处理用户问题
   */
  private preprocessQuestion(question: string): string {
    return this.cleanText(question)
      .replace(/[？]/g, '?')
      .replace(/[！]/g, '!')
      .trim();
  }

  /**
   * 预处理文档内容
   */
  private preprocessDocumentContent(content: string): string {
    let processedContent = this.cleanText(content);
    
    // 限制内容长度
    if (processedContent.length > this.maxContextLength) {
      // 智能截取：保留开头和相关部分
      const headLength = Math.floor(this.maxContextLength * 0.6);
      const tailLength = this.maxContextLength - headLength - 50;
      
      const head = processedContent.substring(0, headLength);
      const tail = processedContent.substring(processedContent.length - tailLength);
      
      processedContent = `${head}\n\n... [内容已截取] ...\n\n${tail}`;
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
   * 格式化对话历史
   */
  private formatConversationHistory(history: Array<{ question: string; answer: string }>): string {
    if (!history || history.length === 0) {
      return '无对话历史';
    }

    // 限制历史长度
    const recentHistory = history.slice(-this.maxHistoryLength);
    
    return recentHistory.map((item, index) => {
      return `Q${index + 1}: ${item.question}\nA${index + 1}: ${item.answer}`;
    }).join('\n\n');
  }

  /**
   * 后处理回答
   */
  private postprocessAnswer(answer: string, question: string): string {
    let processedAnswer = this.cleanText(answer);
    
    // 移除可能的提示词残留
    processedAnswer = processedAnswer
      .replace(/^(回答|答案|Answer)[:：]?\s*/i, '')
      .replace(/请开始回答[:：]?\s*$/i, '')
      .trim();
    
    // 确保回答不为空
    if (processedAnswer.length === 0) {
      processedAnswer = '抱歉，我无法基于当前文档内容回答您的问题。请尝试重新表述您的问题或提供更多上下文。';
    }
    
    // 限制回答长度
    if (processedAnswer.length > 1000) {
      processedAnswer = this.truncateText(processedAnswer, 1000);
    }
    
    return processedAnswer;
  }

  /**
   * 检测问题类型
   */
  private detectQuestionType(question: string): 'greeting' | 'thanks' | 'how_to' | 'what_is' | 'why' | 'code' | 'general' {
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.match(/^(hi|hello|你好|嗨)/)) {
      return 'greeting';
    }
    
    if (lowerQuestion.match(/(thank|谢谢|感谢)/)) {
      return 'thanks';
    }
    
    if (lowerQuestion.match(/(how to|如何|怎么|怎样)/)) {
      return 'how_to';
    }
    
    if (lowerQuestion.match(/(what is|什么是|是什么)/)) {
      return 'what_is';
    }
    
    if (lowerQuestion.match(/(why|为什么|为啥)/)) {
      return 'why';
    }
    
    if (lowerQuestion.match(/(code|代码|示例|example)/)) {
      return 'code';
    }
    
    return 'general';
  }

  /**
   * 生成相关问题建议
   */
  static generateRelatedQuestions(documentContent: DocumentContent, keyPoints?: KeyPoint[]): string[] {
    const suggestions: string[] = [];
    
    // 基于文档标题生成问题
    if (documentContent.title) {
      suggestions.push(`${documentContent.title}的主要特性是什么？`);
      suggestions.push(`如何开始使用${documentContent.title}？`);
    }
    
    // 基于关键点生成问题
    if (keyPoints && keyPoints.length > 0) {
      keyPoints.slice(0, 3).forEach(kp => {
        suggestions.push(`请详细解释${kp.concept}`);
        suggestions.push(`${kp.concept}有哪些实际应用场景？`);
      });
    }
    
    // 添加通用问题
    suggestions.push('有什么最佳实践建议吗？');
    suggestions.push('常见的问题和解决方案有哪些？');
    suggestions.push('能提供一些代码示例吗？');
    
    return suggestions.slice(0, 6); // 返回最多6个建议
  }

  /**
   * 评估回答质量
   */
  static evaluateAnswerQuality(answer: string, question: string): {
    score: number;
    feedback: string[];
  } {
    const feedback: string[] = [];
    let score = 100;
    
    // 检查回答长度
    if (answer.length < 50) {
      score -= 20;
      feedback.push('回答过于简短');
    } else if (answer.length > 800) {
      score -= 10;
      feedback.push('回答过于冗长');
    }
    
    // 检查是否包含代码示例（如果问题需要）
    if (question.toLowerCase().includes('code') || question.includes('代码')) {
      if (!answer.includes('```') && !answer.includes('`')) {
        score -= 15;
        feedback.push('缺少代码示例');
      }
    }
    
    // 检查是否有明确的回答
    if (answer.includes('无法回答') || answer.includes('不知道')) {
      score -= 30;
      feedback.push('回答不够明确');
    }
    
    return {
      score: Math.max(0, score),
      feedback
    };
  }
}