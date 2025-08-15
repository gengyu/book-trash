import { Injectable, Logger } from '@nestjs/common';
import {
  PromptTemplate,
  PromptTemplateContent,
  PromptTemplateMetadata,
  PromptTemplateSearchCriteria,
  PromptTemplateValidationResult,
  PromptRenderOptions,
  RenderedPrompt,
  PromptTemplateExport,
  PromptTemplateStats,
  PromptVariable
} from './prompt-template.interface';

/**
 * 提示词模板管理器
 */
@Injectable()
export class PromptTemplateManager {
  private readonly logger = new Logger(PromptTemplateManager.name);
  private templates: Map<string, PromptTemplate> = new Map();
  private templatesByCategory: Map<string, Set<string>> = new Map();
  private templatesByTag: Map<string, Set<string>> = new Map();

  constructor() {
    this.initializeDefaultTemplates();
  }

  /**
   * 初始化默认模板
   */
  private initializeDefaultTemplates() {
    const defaultTemplates = this.getDefaultTemplates();
    defaultTemplates.forEach(template => {
      this.addTemplate(template);
    });
    this.logger.log(`已加载 ${defaultTemplates.length} 个默认提示词模板`);
  }

  /**
   * 获取默认模板
   */
  private getDefaultTemplates(): PromptTemplate[] {
    return [
      {
        metadata: {
          id: 'document-analysis',
          name: '文档分析模板',
          description: '用于分析文档内容并提取关键信息',
          category: 'analysis',
          tags: ['document', 'analysis', 'extraction'],
          version: '1.0.0',
          author: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
          language: 'zh-CN'
        },
        content: {
          system: '你是一个专业的文档分析助手，擅长从各种文档中提取关键信息和核心概念。',
          user: '请分析以下文档内容，提取其中的关键信息：\n\n文档标题：{{title}}\n文档内容：{{content}}\n\n请按照以下格式输出：\n1. 文档摘要\n2. 关键概念\n3. 重要信息点\n4. 建议的学习重点',
          variables: [
            {
              name: 'title',
              type: 'string',
              description: '文档标题',
              required: true
            },
            {
              name: 'content',
              type: 'string',
              description: '文档内容',
              required: true,
              validation: {
                minLength: 10,
                maxLength: 50000
              }
            }
          ]
        }
      },
      {
        metadata: {
          id: 'learning-path-generation',
          name: '学习路径生成模板',
          description: '根据用户水平和关键点生成个性化学习路径',
          category: 'education',
          tags: ['learning', 'path', 'education', 'personalization'],
          version: '1.0.0',
          author: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
          language: 'zh-CN'
        },
        content: {
          system: '你是一个专业的学习规划师，能够根据学习者的水平和学习内容制定个性化的学习路径。',
          user: '请为{{userLevel}}水平的学习者制定学习路径。\n\n关键学习点：\n{{keyPoints}}\n\n请生成一个循序渐进的学习计划，包括：\n1. 学习步骤\n2. 预计时间\n3. 学习重点\n4. 实践建议\n\n用户水平说明：\n- beginner: 初学者，需要基础概念介绍\n- advanced: 高级学习者，可以深入技术细节',
          variables: [
            {
              name: 'userLevel',
              type: 'string',
              description: '用户学习水平',
              required: true,
              validation: {
                enum: ['beginner', 'advanced']
              }
            },
            {
              name: 'keyPoints',
              type: 'string',
              description: '关键学习点列表',
              required: true
            }
          ]
        }
      },
      {
        metadata: {
          id: 'quiz-generation',
          name: '测验生成模板',
          description: '根据学习内容生成多种类型的测验题目',
          category: 'assessment',
          tags: ['quiz', 'assessment', 'testing', 'evaluation'],
          version: '1.0.0',
          author: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
          language: 'zh-CN'
        },
        content: {
          system: '你是一个专业的教育评估专家，能够根据学习内容设计有效的测验题目。',
          user: '请根据以下学习内容生成{{questionCount}}道{{difficultyLevel}}难度的测验题。\n\n学习内容：\n{{content}}\n\n关键概念：\n{{keyPoints}}\n\n题目类型要求：{{questionTypes}}\n\n请为每道题提供：\n1. 题目内容\n2. 选项（如适用）\n3. 正确答案\n4. 解释说明\n\n确保题目能够有效测试学习者对关键概念的理解。',
          variables: [
            {
              name: 'questionCount',
              type: 'number',
              description: '题目数量',
              required: true,
              defaultValue: 5,
              validation: {
                minLength: 1,
                maxLength: 20
              }
            },
            {
              name: 'difficultyLevel',
              type: 'string',
              description: '难度级别',
              required: true,
              defaultValue: 'medium',
              validation: {
                enum: ['easy', 'medium', 'hard']
              }
            },
            {
              name: 'content',
              type: 'string',
              description: '学习内容',
              required: true
            },
            {
              name: 'keyPoints',
              type: 'string',
              description: '关键概念',
              required: true
            },
            {
              name: 'questionTypes',
              type: 'array',
              description: '题目类型列表',
              required: true,
              defaultValue: ['multiple_choice', 'true_false']
            }
          ]
        }
      },
      {
        metadata: {
          id: 'interactive-qa',
          name: '交互问答模板',
          description: '用于回答用户关于文档内容的问题',
          category: 'interaction',
          tags: ['qa', 'interaction', 'conversation', 'help'],
          version: '1.0.0',
          author: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
          language: 'zh-CN'
        },
        content: {
          system: '你是一个知识渊博的助手，能够基于提供的文档内容回答用户的问题。请确保回答准确、有帮助且易于理解。',
          user: '基于以下文档内容回答用户问题：\n\n文档内容：\n{{documentContent}}\n\n{{#if conversationHistory}}\n对话历史：\n{{conversationHistory}}\n{{/if}}\n\n用户问题：{{question}}\n\n请提供详细、准确的回答，如果文档中没有相关信息，请明确说明。',
          variables: [
            {
              name: 'documentContent',
              type: 'string',
              description: '文档内容',
              required: true
            },
            {
              name: 'question',
              type: 'string',
              description: '用户问题',
              required: true
            },
            {
              name: 'conversationHistory',
              type: 'array',
              description: '对话历史',
              required: false,
              defaultValue: []
            }
          ]
        }
      }
    ];
  }

  /**
   * 添加模板
   */
  addTemplate(template: PromptTemplate): void {
    this.templates.set(template.metadata.id, template);
    
    // 更新分类索引
    if (!this.templatesByCategory.has(template.metadata.category)) {
      this.templatesByCategory.set(template.metadata.category, new Set());
    }
    this.templatesByCategory.get(template.metadata.category)!.add(template.metadata.id);
    
    // 更新标签索引
    template.metadata.tags.forEach(tag => {
      if (!this.templatesByTag.has(tag)) {
        this.templatesByTag.set(tag, new Set());
      }
      this.templatesByTag.get(tag)!.add(template.metadata.id);
    });
    
    this.logger.log(`已添加模板: ${template.metadata.name} (${template.metadata.id})`);
  }

  /**
   * 获取模板
   */
  getTemplate(id: string): PromptTemplate | undefined {
    return this.templates.get(id);
  }

  /**
   * 更新模板
   */
  updateTemplate(id: string, updates: Partial<PromptTemplate>): boolean {
    const template = this.templates.get(id);
    if (!template) {
      return false;
    }

    const updatedTemplate = {
      ...template,
      ...updates,
      metadata: {
        ...template.metadata,
        ...updates.metadata,
        updatedAt: new Date()
      }
    };

    this.templates.set(id, updatedTemplate);
    this.logger.log(`已更新模板: ${id}`);
    return true;
  }

  /**
   * 删除模板
   */
  deleteTemplate(id: string): boolean {
    const template = this.templates.get(id);
    if (!template) {
      return false;
    }

    this.templates.delete(id);
    
    // 清理索引
    this.templatesByCategory.get(template.metadata.category)?.delete(id);
    template.metadata.tags.forEach(tag => {
      this.templatesByTag.get(tag)?.delete(id);
    });
    
    this.logger.log(`已删除模板: ${id}`);
    return true;
  }

  /**
   * 搜索模板
   */
  searchTemplates(criteria: PromptTemplateSearchCriteria): PromptTemplate[] {
    let results = Array.from(this.templates.values());

    // 按查询条件过滤
    if (criteria.query) {
      const query = criteria.query.toLowerCase();
      results = results.filter(template => 
        template.metadata.name.toLowerCase().includes(query) ||
        template.metadata.description.toLowerCase().includes(query) ||
        template.content.user.toLowerCase().includes(query)
      );
    }

    // 按分类过滤
    if (criteria.category) {
      results = results.filter(template => 
        template.metadata.category === criteria.category
      );
    }

    // 按标签过滤
    if (criteria.tags && criteria.tags.length > 0) {
      results = results.filter(template => 
        criteria.tags!.some(tag => template.metadata.tags.includes(tag))
      );
    }

    // 按语言过滤
    if (criteria.language) {
      results = results.filter(template => 
        template.metadata.language === criteria.language
      );
    }

    // 按作者过滤
    if (criteria.author) {
      results = results.filter(template => 
        template.metadata.author === criteria.author
      );
    }

    // 按评分过滤
    if (criteria.minRating !== undefined) {
      results = results.filter(template => 
        (template.metadata.rating || 0) >= criteria.minRating!
      );
    }

    // 排序
    if (criteria.sortBy) {
      results.sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (criteria.sortBy) {
          case 'name':
            aValue = a.metadata.name;
            bValue = b.metadata.name;
            break;
          case 'createdAt':
            aValue = a.metadata.createdAt;
            bValue = b.metadata.createdAt;
            break;
          case 'updatedAt':
            aValue = a.metadata.updatedAt;
            bValue = b.metadata.updatedAt;
            break;
          case 'usageCount':
            aValue = a.metadata.usageCount || 0;
            bValue = b.metadata.usageCount || 0;
            break;
          case 'rating':
            aValue = a.metadata.rating || 0;
            bValue = b.metadata.rating || 0;
            break;
          default:
            return 0;
        }

        if (criteria.sortOrder === 'desc') {
          return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
        } else {
          return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        }
      });
    }

    // 分页
    const offset = criteria.offset || 0;
    const limit = criteria.limit || results.length;
    
    return (results as PromptTemplate[]).slice(offset, offset + limit);
  }

  /**
   * 验证模板
   */
  validateTemplate(template: PromptTemplate): PromptTemplateValidationResult {
    const errors: Array<{ field: string; message: string; code: string }> = [];
    const warnings: Array<{ field: string; message: string; code: string }> = [];

    // 验证元数据
    if (!template.metadata.id) {
      errors.push({ field: 'metadata.id', message: '模板ID不能为空', code: 'REQUIRED' });
    }
    
    if (!template.metadata.name) {
      errors.push({ field: 'metadata.name', message: '模板名称不能为空', code: 'REQUIRED' });
    }
    
    if (!template.metadata.category) {
      errors.push({ field: 'metadata.category', message: '模板分类不能为空', code: 'REQUIRED' });
    }

    // 验证内容
    if (!template.content.user) {
      errors.push({ field: 'content.user', message: '用户提示词不能为空', code: 'REQUIRED' });
    }

    // 验证变量
    template.content.variables.forEach((variable, index) => {
      if (!variable.name) {
        errors.push({ 
          field: `content.variables[${index}].name`, 
          message: '变量名称不能为空', 
          code: 'REQUIRED' 
        });
      }
      
      if (!variable.type) {
        errors.push({ 
          field: `content.variables[${index}].type`, 
          message: '变量类型不能为空', 
          code: 'REQUIRED' 
        });
      }
    });

    // 检查模板中的变量引用
    const templateText = template.content.user + (template.content.system || '') + (template.content.assistant || '');
    const variableReferences = templateText.match(/\{\{\w+\}\}/g) || [];
    const definedVariables = new Set(template.content.variables.map(v => v.name));
    
    variableReferences.forEach((ref: string) => {
      const varName = ref.slice(2, -2); // 移除 {{ }}
      if (!definedVariables.has(varName)) {
        warnings.push({
          field: 'content.variables',
          message: `模板中引用了未定义的变量: ${varName}`,
          code: 'UNDEFINED_VARIABLE'
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * 渲染模板
   */
  renderTemplate(templateId: string, options: PromptRenderOptions): RenderedPrompt {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`模板不存在: ${templateId}`);
    }

    // 验证变量
    if (options.validateVariables !== false) {
      this.validateVariables(template, options.variables);
    }

    // 渲染模板
    const rendered: RenderedPrompt = {
      system: this.renderText(template.content.system, options.variables, options),
      user: this.renderText(template.content.user, options.variables, options),
      assistant: this.renderText(template.content.assistant, options.variables, options),
      variables: options.variables,
      templateId,
      renderedAt: new Date()
    };

    // 更新使用统计
    const currentUsage = template.metadata.usageCount || 0;
    this.updateTemplate(templateId, {
      metadata: {
        ...template.metadata,
        usageCount: currentUsage + 1
      }
    });

    return rendered;
  }

  /**
   * 渲染文本
   */
  private renderText(text: string | undefined, variables: Record<string, any>, options: PromptRenderOptions): string | undefined {
    if (!text) return undefined;

    let rendered = text;
    
    // 替换变量
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      let replacement = String(value);
      
      if (options.escapeHtml) {
        replacement = this.escapeHtml(replacement);
      }
      
      rendered = rendered.replace(regex, replacement);
    });

    // 处理条件语句 (简单的 if 语句)
    rendered = rendered.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, varName, content) => {
      return variables[varName] ? content : '';
    });

    // 处理格式化
    if (options.trimWhitespace) {
      rendered = rendered.trim();
    }
    
    if (!options.preserveFormatting) {
      rendered = rendered.replace(/\s+/g, ' ');
    }

    return rendered;
  }

  /**
   * 验证变量
   */
  private validateVariables(template: PromptTemplate, variables: Record<string, any>): void {
    template.content.variables.forEach(variable => {
      const value = variables[variable.name];
      
      // 检查必需变量
      if (variable.required && (value === undefined || value === null)) {
        throw new Error(`必需变量缺失: ${variable.name}`);
      }
      
      if (value !== undefined && value !== null) {
        // 类型检查
        if (!this.validateVariableType(value, variable.type)) {
          throw new Error(`变量 ${variable.name} 类型错误，期望 ${variable.type}`);
        }
        
        // 验证规则检查
        if (variable.validation) {
          this.validateVariableRules(variable.name, value, variable.validation);
        }
      }
    });
  }

  /**
   * 验证变量类型
   */
  private validateVariableType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && !Array.isArray(value);
      default:
        return true;
    }
  }

  /**
   * 验证变量规则
   */
  private validateVariableRules(name: string, value: any, validation: any): void {
    if (validation.minLength !== undefined && value.length < validation.minLength) {
      throw new Error(`变量 ${name} 长度不能少于 ${validation.minLength}`);
    }
    
    if (validation.maxLength !== undefined && value.length > validation.maxLength) {
      throw new Error(`变量 ${name} 长度不能超过 ${validation.maxLength}`);
    }
    
    if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
      throw new Error(`变量 ${name} 格式不正确`);
    }
    
    if (validation.enum && !validation.enum.includes(value)) {
      throw new Error(`变量 ${name} 值必须是: ${validation.enum.join(', ')}`);
    }
  }

  /**
   * HTML转义
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * 获取所有分类
   */
  getCategories(): string[] {
    return Array.from(this.templatesByCategory.keys());
  }

  /**
   * 获取所有标签
   */
  getTags(): string[] {
    return Array.from(this.templatesByTag.keys());
  }

  /**
   * 获取统计信息
   */
  getStats(): PromptTemplateStats {
    const templates = Array.from(this.templates.values());
    
    return {
      totalTemplates: templates.length,
      categoriesCount: this.templatesByCategory.size,
      languagesCount: new Set(templates.map(t => t.metadata.language)).size,
      averageRating: templates.reduce((sum, t) => sum + (t.metadata.rating || 0), 0) / templates.length,
      mostUsedTemplates: templates
        .sort((a, b) => (b.metadata.usageCount || 0) - (a.metadata.usageCount || 0))
        .slice(0, 5)
        .map(t => ({
          templateId: t.metadata.id,
          name: t.metadata.name,
          usageCount: t.metadata.usageCount || 0
        })),
      recentlyCreated: templates
        .sort((a, b) => b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime())
        .slice(0, 5)
        .map(t => ({
          templateId: t.metadata.id,
          name: t.metadata.name,
          createdAt: t.metadata.createdAt
        }))
    };
  }

  /**
   * 导出模板
   */
  exportTemplates(templateIds?: string[]): PromptTemplateExport {
    const templatesToExport = templateIds 
      ? templateIds.map(id => this.templates.get(id)).filter(Boolean) as PromptTemplate[]
      : Array.from(this.templates.values());

    return {
      version: '1.0.0',
      exportedAt: new Date(),
      templates: templatesToExport,
      metadata: {
        totalCount: templatesToExport.length,
        exportedBy: 'system',
        description: `导出了 ${templatesToExport.length} 个提示词模板`
      }
    };
  }

  /**
   * 导入模板
   */
  importTemplates(exportData: PromptTemplateExport): { imported: number; skipped: number; errors: string[] } {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    exportData.templates.forEach(template => {
      try {
        const validation = this.validateTemplate(template);
        if (!validation.isValid) {
          errors.push(`模板 ${template.metadata.id} 验证失败: ${validation.errors.map(e => e.message).join(', ')}`);
          return;
        }

        if (this.templates.has(template.metadata.id)) {
          skipped++;
          return;
        }

        this.addTemplate(template);
        imported++;
      } catch (error) {
        errors.push(`导入模板 ${template.metadata.id} 失败: ${error.message}`);
      }
    });

    return { imported, skipped, errors };
  }

  /**
   * 获取所有模板
   */
  getAllTemplates(): PromptTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * 清空所有模板
   */
  clearAllTemplates(): void {
    this.templates.clear();
    this.templatesByCategory.clear();
    this.templatesByTag.clear();
    this.logger.log('已清空所有模板');
  }
}