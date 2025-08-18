import { BaseAgent } from './base-agent.abstract';
import { AgentContext } from './base-agent.interface';
import { 
  LearningPathInput, 
  LearningPathOutput, 
  LearningStep,
  KeyPoint,
  AgentErrorType 
} from './agent-types';
import { PromptTemplate } from '@langchain/core/prompts';
import { LLMChain } from 'langchain/chains';

/**
 * 学习路径生成智能体
 * 负责根据关键点和用户水平生成个性化的学习路径
 */
export class LearningPathAgent extends BaseAgent<LearningPathInput, LearningPathOutput> {
  private promptTemplate: PromptTemplate;
  private chain: LLMChain;

  constructor() {
    super({
      name: 'LearningPath',
      description: '根据关键点和用户水平生成个性化学习路径',
      maxRetries: 2,
      timeout: 30000
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
    const templateString = `你是一个专业的学习路径规划师。请根据以下关键点为用户生成一个结构化的学习路径。

关键点信息:
{keyPointsText}

用户水平: {userLevel}
时间约束: {timeConstraint}
重点领域: {focusAreas}

请按照以下要求生成学习路径：

1. 对于初学者(beginner)：
   - 从基础概念开始，循序渐进
   - 每个步骤包含实践练习
   - 提供详细的代码示例
   - 估算较为宽松的学习时间
   - 包含必要的前置知识

2. 对于高级用户(advanced)：
   - 重点关注高级特性和最佳实践
   - 包含复杂的实际应用场景
   - 提供优化和性能相关的内容
   - 估算较为紧凑的学习时间
   - 包含进阶资源链接

请以JSON格式返回学习路径，格式如下：
[
  {
    "step": "步骤标题",
    "time": "预估时间（如：30分钟、1小时）",
    "description": "详细描述",
    "code": "代码示例（可选）",
    "prerequisites": ["前置要求1", "前置要求2"],
    "resources": ["资源链接1", "资源链接2"]
  }
]

要求：
- 确保返回有效的JSON格式
- 学习步骤应该逻辑清晰，循序渐进
- 每个步骤都应该有明确的学习目标
- 时间估算要合理实际
- 代码示例要简洁实用
- 总共生成5-8个学习步骤

请开始生成学习路径：`;

    this.promptTemplate = new PromptTemplate({
      template: templateString,
      inputVariables: ['keyPointsText', 'userLevel', 'timeConstraint', 'focusAreas']
    });
  }

  /**
   * 验证输入参数
   */
  validateInput(input: LearningPathInput): boolean {
    if (!input || !input.keyPoints || !Array.isArray(input.keyPoints)) {
      return false;
    }

    if (input.keyPoints.length === 0) {
      return false;
    }

    if (!input.userLevel || !['beginner', 'advanced'].includes(input.userLevel)) {
      return false;
    }

    return true;
  }

  /**
   * 执行学习路径生成
   */
  protected async doExecute(
    input: LearningPathInput, 
    context: AgentContext
  ): Promise<LearningPathOutput> {
    try {
      const { keyPoints, userLevel, timeConstraint, focusAreas } = input;
      
      // 准备关键点文本
      const keyPointsText = this.formatKeyPointsForPrompt(keyPoints);
      
      // 准备输入数据
      const promptInput = {
        keyPointsText,
        userLevel,
        timeConstraint: timeConstraint || '无特殊要求',
        focusAreas: focusAreas ? focusAreas.join(', ') : '全面学习'
      };

      // 调用LLM生成学习路径
      const response = await this.chain.call(promptInput);
      const responseText = response.text || response.response || '';

      // 解析LLM响应
      const learningSteps = this.parseLearningPathResponse(responseText);
      
      // 验证和优化结果
      const optimizedSteps = this.optimizeLearningPath(learningSteps, userLevel);
      
      if (optimizedSteps.length === 0) {
        throw new Error('No valid learning steps generated');
      }

      return optimizedSteps;

    } catch (error) {
      if (error.message.includes('timeout')) {
        throw new Error(`${AgentErrorType.TIMEOUT_ERROR}: LLM request timeout`);
      } else if (error.message.includes('API') || error.message.includes('model')) {
        throw new Error(`${AgentErrorType.LLM_ERROR}: ${error.message}`);
      } else if (error.message.includes('parse') || error.message.includes('JSON')) {
        throw new Error(`${AgentErrorType.PARSING_ERROR}: Failed to parse LLM response`);
      } else {
        throw new Error(`${AgentErrorType.UNKNOWN_ERROR}: ${error.message}`);
      }
    }
  }

  /**
   * 格式化关键点为提示词文本
   */
  private formatKeyPointsForPrompt(keyPoints: KeyPoint[]): string {
    return keyPoints.map((kp, index) => {
      let text = `${index + 1}. ${kp.concept}\n   描述: ${kp.description}`;
      
      if (kp.importance) {
        text += `\n   重要性: ${kp.importance}`;
      }
      
      if (kp.category) {
        text += `\n   分类: ${kp.category}`;
      }
      
      if (kp.examples && kp.examples.length > 0) {
        text += `\n   示例: ${kp.examples.join(', ')}`;
      }
      
      return text;
    }).join('\n\n');
  }

  /**
   * 解析LLM响应中的学习路径
   */
  private parseLearningPathResponse(responseText: string): LearningStep[] {
    try {
      // 尝试直接解析JSON
      const parsed = this.safeJsonParse<LearningStep[]>(responseText, []);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }

      // 如果直接解析失败，尝试提取JSON部分
      const jsonMatch = responseText.match(/\[\s*{[\s\S]*}\s*\]/);
      if (jsonMatch) {
        const extracted = this.safeJsonParse<LearningStep[]>(jsonMatch[0], []);
        if (Array.isArray(extracted)) {
          return extracted;
        }
      }

      // 如果JSON解析失败，尝试文本解析
      return this.parseLearningPathFromText(responseText);

    } catch (error) {
      console.warn('Failed to parse learning path response:', error);
      return this.parseLearningPathFromText(responseText);
    }
  }

  /**
   * 从文本中解析学习路径（备用方法）
   */
  private parseLearningPathFromText(text: string): LearningStep[] {
    const steps: LearningStep[] = [];
    const lines = text.split('\n');
    
    let currentStep: Partial<LearningStep> = {};
    let stepCounter = 1;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // 检测步骤标题
      if (trimmedLine.match(/^\d+\.|^步骤\s*\d+|^Step\s*\d+/i)) {
        if (currentStep.step) {
          steps.push(this.completeLearningStep(currentStep));
        }
        currentStep = {
          step: trimmedLine.replace(/^\d+\.|^步骤\s*\d+:?|^Step\s*\d+:?/i, '').trim() || `学习步骤 ${stepCounter}`,
          time: '30分钟',
          description: '',
          prerequisites: [],
          resources: []
        };
        stepCounter++;
      } else if (trimmedLine.includes('时间') || trimmedLine.includes('Time')) {
        const timeMatch = trimmedLine.match(/(\d+\s*[分小时天]|\d+\s*(minutes?|hours?|days?))/i);
        if (timeMatch) {
          currentStep.time = timeMatch[0];
        }
      } else if (trimmedLine.length > 10 && currentStep.step) {
        currentStep.description = (currentStep.description || '') + ' ' + trimmedLine;
      }
    }
    
    if (currentStep.step) {
      steps.push(this.completeLearningStep(currentStep));
    }
    
    return steps;
  }

  /**
   * 完善学习步骤对象
   */
  private completeLearningStep(partial: Partial<LearningStep>): LearningStep {
    return {
      step: partial.step || 'Unknown Step',
      time: partial.time || '30分钟',
      description: partial.description?.trim() || 'No description available',
      code: partial.code,
      prerequisites: partial.prerequisites || [],
      resources: partial.resources || []
    };
  }

  /**
   * 优化学习路径
   */
  private optimizeLearningPath(steps: LearningStep[], userLevel: 'beginner' | 'advanced'): LearningStep[] {
    let optimizedSteps = steps
      .filter(step => step.step && step.step.trim().length > 0)
      .filter(step => step.description && step.description.trim().length > 10)
      .map(step => ({
        ...step,
        step: this.cleanText(step.step).substring(0, 100),
        description: this.cleanText(step.description).substring(0, 500),
        time: this.normalizeTimeEstimate(step.time, userLevel)
      }));

    // 确保步骤数量合理
    if (optimizedSteps.length > 8) {
      optimizedSteps = optimizedSteps.slice(0, 8);
    } else if (optimizedSteps.length < 3) {
      // 如果步骤太少，添加一些通用步骤
      optimizedSteps = this.addDefaultSteps(optimizedSteps, userLevel);
    }

    // 为步骤添加序号
    optimizedSteps = optimizedSteps.map((step, index) => ({
      ...step,
      step: step.step.startsWith(`${index + 1}.`) ? step.step : `${index + 1}. ${step.step}`
    }));

    return optimizedSteps;
  }

  /**
   * 标准化时间估算
   */
  private normalizeTimeEstimate(time: string, userLevel: 'beginner' | 'advanced'): string {
    if (!time || time.trim().length === 0) {
      return userLevel === 'beginner' ? '45分钟' : '30分钟';
    }

    // 提取数字
    const numberMatch = time.match(/\d+/);
    if (!numberMatch) {
      return userLevel === 'beginner' ? '45分钟' : '30分钟';
    }

    const number = parseInt(numberMatch[0]);
    
    // 根据用户水平调整时间
    const adjustedNumber = userLevel === 'beginner' ? 
      Math.max(30, Math.ceil(number * 1.2)) : 
      Math.max(15, Math.ceil(number * 0.8));

    // 确定单位
    if (time.includes('小时') || time.includes('hour')) {
      return `${adjustedNumber}分钟`;
    } else {
      return `${adjustedNumber}分钟`;
    }
  }

  /**
   * 添加默认学习步骤
   */
  private addDefaultSteps(existingSteps: LearningStep[], userLevel: 'beginner' | 'advanced'): LearningStep[] {
    const defaultSteps: LearningStep[] = [];

    if (userLevel === 'beginner') {
      defaultSteps.push(
        {
          step: '环境准备和基础设置',
          time: '30分钟',
          description: '安装必要的开发环境和工具，配置基本设置',
          prerequisites: [],
          resources: []
        },
        {
          step: '核心概念理解',
          time: '45分钟',
          description: '学习和理解基础概念，掌握基本原理',
          prerequisites: [],
          resources: []
        },
        {
          step: '实践练习',
          time: '60分钟',
          description: '通过实际练习巩固所学知识',
          prerequisites: [],
          resources: []
        }
      );
    } else {
      defaultSteps.push(
        {
          step: '高级特性探索',
          time: '30分钟',
          description: '深入了解高级功能和特性',
          prerequisites: [],
          resources: []
        },
        {
          step: '最佳实践应用',
          time: '45分钟',
          description: '学习和应用行业最佳实践',
          prerequisites: [],
          resources: []
        }
      );
    }

    return [...existingSteps, ...defaultSteps].slice(0, 8);
  }

  /**
   * 估算总学习时间
   */
  static estimateTotalTime(steps: LearningStep[]): string {
    let totalMinutes = 0;
    
    for (const step of steps) {
      const timeMatch = step.time.match(/\d+/);
      if (timeMatch) {
        const minutes = parseInt(timeMatch[0]);
        if (step.time.includes('小时') || step.time.includes('hour')) {
          totalMinutes += minutes * 60;
        } else {
          totalMinutes += minutes;
        }
      }
    }
    
    if (totalMinutes >= 60) {
      const hours = Math.floor(totalMinutes / 60);
      const remainingMinutes = totalMinutes % 60;
      return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`;
    } else {
      return `${totalMinutes}分钟`;
    }
  }
}