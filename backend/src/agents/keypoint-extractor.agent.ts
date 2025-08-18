import {BaseAgent} from './base-agent.abstract';
import {AgentContext} from './base-agent.interface';
import {AgentErrorType, KeyPoint, KeyPointExtractorInput, KeyPointExtractorOutput} from './agent-types';

import {PromptTemplate} from "@langchain/core/prompts";
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Runnable } from '@langchain/core/runnables';

/**
 * 关键点提取智能体
 * 负责从文档内容中提取核心概念和关键点
 */
export class KeyPointExtractorAgent extends BaseAgent<KeyPointExtractorInput, KeyPointExtractorOutput> {
	private promptTemplate: PromptTemplate;
	private chain: Runnable<any, string>;

	constructor(llmName?: string) {
		super({
			name: 'KeyPointExtractor',
			description: '从文档内容中提取核心概念和关键点',
			maxRetries: 2,
			timeout: 30000
		}, llmName);

		this.initializePromptTemplate();
		// 注意：chain的初始化将在execute方法中进行，因为llm需要异步初始化
	}

	/**
	 * 初始化提示词模板
	 */
	private initializePromptTemplate(): void {
		const templateString = `你是一个专业的技术文档分析专家。请从以下文档内容中提取核心概念和关键点。

文档标题: {title}
文档内容: {content}
用户水平: {userLevel}
最大关键点数量: {maxKeyPoints}

请按照以下要求提取关键点：

1. 对于初学者(beginner)：
   - 重点关注基础概念、入门知识
   - 提供简单易懂的描述
   - 包含实用的例子

2. 对于高级用户(advanced)：
   - 重点关注高级特性、最佳实践
   - 提供深入的技术细节
   - 包含复杂的应用场景

请以JSON格式返回结果，格式如下：
[
  {{
    "concept": "概念名称",
    "description": "详细描述",
    "importance": "high|medium|low",
    "category": "分类（可选）",
    "examples": ["示例1", "示例2"]
  }}
]

要求：
- 确保返回有效的JSON格式
- 关键点应该按重要性排序
- 描述应该清晰、准确、有用
- 避免重复或过于相似的概念
- 每个关键点的描述控制在100-200字以内

请开始分析：`;
		this.promptTemplate = new PromptTemplate({
			inputVariables: ['title', 'content', 'userLevel', 'maxKeyPoints'],
			template: templateString
		});
	}

	/**
	 * 验证输入参数
	 */
	validateInput(input: KeyPointExtractorInput): boolean {
		if (!input || !input.documentContent) {
			return false;
		}

		if (!input.documentContent.content || input.documentContent.content.trim().length === 0) {
			return false;
		}

		if (!input.userLevel || !['beginner', 'advanced'].includes(input.userLevel)) {
			return false;
		}

		return true;
	}

	/**
	 * 执行关键点提取
	 */
	protected async doExecute(
		input: KeyPointExtractorInput,
		context: AgentContext
	): Promise<KeyPointExtractorOutput> {
		// 确保chain已初始化
		if (!this.chain) {
			this.chain = this.promptTemplate.pipe(this.llm).pipe(new StringOutputParser());
		}
		try {
			const {documentContent, userLevel, maxKeyPoints = 8} = input;

			// 准备输入数据
			const promptInput = {
				title: documentContent.title || 'Untitled',
				content: this.preprocessContent(documentContent.content),
				userLevel: userLevel,
				maxKeyPoints: maxKeyPoints.toString()
			};

			// 调用LLM进行关键点提取
			const responseText = await this.chain.invoke(promptInput);

			// 解析LLM响应
			const keyPoints = this.parseKeyPointsResponse(responseText);

			// 验证和清理结果
			const validatedKeyPoints = this.validateAndCleanKeyPoints(keyPoints, maxKeyPoints);

			if (validatedKeyPoints.length === 0) {
				throw new Error('No valid key points extracted from the document');
			}

			return validatedKeyPoints;

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
	 * 预处理文档内容
	 */
	private preprocessContent(content: string): string {
		// 限制内容长度以避免超出LLM token限制
		const maxLength = 4000;
		let processedContent = this.cleanText(content);

		if (processedContent.length > maxLength) {
			// 智能截取：优先保留开头和结尾部分
			const headLength = Math.floor(maxLength * 0.7);
			const tailLength = maxLength - headLength - 50; // 留50字符给省略号

			const head = processedContent.substring(0, headLength);
			const tail = processedContent.substring(processedContent.length - tailLength);

			processedContent = `${head}\n\n... [内容已截取] ...\n\n${tail}`;
		}

		return processedContent;
	}

	/**
	 * 解析LLM响应中的关键点
	 */
	private parseKeyPointsResponse(responseText: string): KeyPoint[] {
		try {
			// 尝试直接解析JSON
			const parsed = this.safeJsonParse<KeyPoint[]>(responseText, []);
			if (Array.isArray(parsed) && parsed.length > 0) {
				return parsed;
			}

			// 如果直接解析失败，尝试提取JSON部分
			const jsonMatch = responseText.match(/\[\s*{[\s\S]*}\s*\]/);
			if (jsonMatch) {
				const extracted = this.safeJsonParse<KeyPoint[]>(jsonMatch[0], []);
				if (Array.isArray(extracted)) {
					return extracted;
				}
			}

			// 如果JSON解析失败，尝试文本解析
			return this.parseKeyPointsFromText(responseText);

		} catch (error) {
			console.warn('Failed to parse key points response:', error);
			return this.parseKeyPointsFromText(responseText);
		}
	}

	/**
	 * 从文本中解析关键点（备用方法）
	 */
	private parseKeyPointsFromText(text: string): KeyPoint[] {
		const keyPoints: KeyPoint[] = [];
		const lines = text.split('\n');

		let currentKeyPoint: Partial<KeyPoint> = {};

		for (const line of lines) {
			const trimmedLine = line.trim();

			// 检测概念名称
			if (trimmedLine.match(/^\d+\.|^-|^\*/) && trimmedLine.length > 5) {
				if (currentKeyPoint.concept) {
					keyPoints.push(this.completeKeyPoint(currentKeyPoint));
				}
				currentKeyPoint = {
					concept: trimmedLine.replace(/^\d+\.|^-|^\*/, '').trim(),
					importance: 'medium'
				};
			} else if (trimmedLine.length > 10 && currentKeyPoint.concept) {
				currentKeyPoint.description = (currentKeyPoint.description || '') + ' ' + trimmedLine;
			}
		}

		if (currentKeyPoint.concept) {
			keyPoints.push(this.completeKeyPoint(currentKeyPoint));
		}

		return keyPoints;
	}

	/**
	 * 完善关键点对象
	 */
	private completeKeyPoint(partial: Partial<KeyPoint>): KeyPoint {
		return {
			concept: partial.concept || 'Unknown Concept',
			description: partial.description || 'No description available',
			importance: partial.importance || 'medium',
			category: partial.category,
			examples: partial.examples || []
		};
	}

	/**
	 * 验证和清理关键点
	 */
	private validateAndCleanKeyPoints(keyPoints: KeyPoint[], maxCount: number): KeyPoint[] {
		const validKeyPoints = keyPoints
			.filter(kp => kp.concept && kp.concept.trim().length > 0)
			.filter(kp => kp.description && kp.description.trim().length > 10)
			.map(kp => ({
				...kp,
				concept: this.cleanText(kp.concept).substring(0, 100),
				description: this.cleanText(kp.description).substring(0, 300),
				importance: ['high', 'medium', 'low'].includes(kp.importance) ? kp.importance : 'medium'
			}))
			.slice(0, maxCount);

		// 去重
		const uniqueKeyPoints = validKeyPoints.filter((kp, index, arr) =>
			arr.findIndex(other => other.concept.toLowerCase() === kp.concept.toLowerCase()) === index
		);

		return uniqueKeyPoints;
	}

	/**
	 * 获取支持的文档类型
	 */
	static getSupportedDocumentTypes(): string[] {
		return [
			'technical_documentation',
			'api_reference',
			'tutorial',
			'guide',
			'specification',
			'manual'
		];
	}
}