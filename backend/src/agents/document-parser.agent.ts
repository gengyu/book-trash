import { CheerioWebBaseLoader } from 'langchain/document_loaders/web/cheerio';
import { BaseAgent } from './base-agent.abstract';
import { AgentContext } from './base-agent.interface';
import { 
  DocumentParserInput, 
  DocumentParserOutput, 
  AgentErrorType 
} from './agent-types';
import * as validator from 'validator';

/**
 * 文档解析智能体
 * 负责从URL加载和解析文档内容
 */
export class DocumentParserAgent extends BaseAgent<DocumentParserInput, DocumentParserOutput> {
  constructor() {
    super({
      name: 'DocumentParser',
      description: '解析网页文档内容，提取标题和正文',
      maxRetries: 3,
      timeout: 15000
    });
  }

  /**
   * 验证输入参数
   */
  validateInput(input: DocumentParserInput): boolean {
    if (!input || !input.url) {
      return false;
    }

    // 验证URL格式
    if (!validator.isURL(input.url, {
      protocols: ['http', 'https'],
      require_protocol: true
    })) {
      return false;
    }

    return true;
  }

  /**
   * 执行文档解析
   */
  protected async doExecute(
    input: DocumentParserInput, 
    context: AgentContext
  ): Promise<DocumentParserOutput> {
    try {
      // 使用LangChain CheerioWebBaseLoader加载文档
      const loader = new CheerioWebBaseLoader(input.url);
      
      // 设置加载选项
      const docs = await loader.load();
      
      if (!docs || docs.length === 0) {
        throw new Error('No content found at the provided URL');
      }

      const doc = docs[0];
      let content = doc.pageContent;
      
      // 清理和处理内容
      content = this.cleanText(content);
      
      // 限制内容长度
      const maxLength = input.options?.maxContentLength || 10000;
      if (content.length > maxLength) {
        content = this.truncateText(content, maxLength);
      }

      // 提取标题
      let title = 'Untitled Document';
      if (doc.metadata?.title) {
        title = doc.metadata.title;
      } else {
        // 尝试从内容中提取标题
        const titleMatch = content.match(/^(.{1,100}?)(?:\n|\.|:|$)/);
        if (titleMatch) {
          title = titleMatch[1].trim();
        }
      }

      // 构建结果
      const result: DocumentParserOutput = {
        title: this.cleanText(title),
        content,
        url: input.url
      };

      // 添加元数据（如果需要）
      if (input.options?.includeMetadata) {
        result.metadata = {
          wordCount: content.split(/\s+/).length,
          language: this.detectLanguage(content),
          lastModified: new Date()
        };
      }

      return result;

    } catch (error) {
      // 根据错误类型抛出相应的错误
      if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
        throw new Error(`${AgentErrorType.TIMEOUT_ERROR}: Failed to load document within timeout period`);
      } else if (error.message.includes('network') || error.message.includes('ENOTFOUND')) {
        throw new Error(`${AgentErrorType.NETWORK_ERROR}: Unable to access the URL: ${error.message}`);
      } else if (error.message.includes('parse') || error.message.includes('invalid')) {
        throw new Error(`${AgentErrorType.PARSING_ERROR}: Failed to parse document content: ${error.message}`);
      } else {
        throw new Error(`${AgentErrorType.UNKNOWN_ERROR}: ${error.message}`);
      }
    }
  }

  /**
   * 简单的语言检测
   */
  private detectLanguage(content: string): string {
    // 简单的中英文检测
    const chineseChars = content.match(/[\u4e00-\u9fff]/g);
    const englishChars = content.match(/[a-zA-Z]/g);
    
    if (!chineseChars && !englishChars) {
      return 'unknown';
    }
    
    const chineseRatio = chineseChars ? chineseChars.length / content.length : 0;
    const englishRatio = englishChars ? englishChars.length / content.length : 0;
    
    if (chineseRatio > englishRatio) {
      return 'zh';
    } else {
      return 'en';
    }
  }

  /**
   * 清理文档内容
   */
  protected cleanText(text: string): string {
    return text
      // 移除多余的空白字符
      .replace(/\s+/g, ' ')
      // 移除特殊字符和控制字符
      .replace(/[\x00-\x1F\x7F-\x9F]/g, '')
      // 移除HTML标签残留
      .replace(/<[^>]*>/g, '')
      // 移除多余的换行
      .replace(/\n\s*\n/g, '\n')
      .trim();
  }

  /**
   * 获取支持的URL模式
   */
  static getSupportedUrlPatterns(): string[] {
    return [
      'https://*.github.io/*',
      'https://docs.*',
      'https://*.readthedocs.io/*',
      'https://developer.*',
      'https://*.org/docs/*',
      'https://*.com/docs/*'
    ];
  }

  /**
   * 检查URL是否为支持的文档类型
   */
  static isSupportedDocumentUrl(url: string): boolean {
    const patterns = this.getSupportedUrlPatterns();
    return patterns.some(pattern => {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(url);
    });
  }
}