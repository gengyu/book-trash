import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PromptTemplateManager } from './prompt-template.manager';
import {
  PromptTemplate,
  PromptTemplateSearchCriteria,
  PromptRenderOptions,
  RenderedPrompt,
  PromptTemplateExport,
  PromptTemplateStats
} from './prompt-template.interface';

/**
 * 提示词模板服务
 */
@Injectable()
export class PromptTemplateService {
  private readonly logger = new Logger(PromptTemplateService.name);

  constructor(private readonly templateManager: PromptTemplateManager) {}

  /**
   * 获取所有模板
   */
  async getAllTemplates(): Promise<PromptTemplate[]> {
    return this.templateManager.getAllTemplates();
  }

  /**
   * 根据ID获取模板
   */
  async getTemplateById(id: string): Promise<PromptTemplate> {
    const template = this.templateManager.getTemplate(id);
    if (!template) {
      throw new NotFoundException(`模板不存在: ${id}`);
    }
    return template;
  }

  /**
   * 搜索模板
   */
  async searchTemplates(criteria: PromptTemplateSearchCriteria): Promise<PromptTemplate[]> {
    try {
      return this.templateManager.searchTemplates(criteria);
    } catch (error) {
      this.logger.error('搜索模板失败', error);
      throw new BadRequestException('搜索参数无效');
    }
  }

  /**
   * 创建新模板
   */
  async createTemplate(template: PromptTemplate): Promise<PromptTemplate> {
    // 验证模板
    const validation = this.templateManager.validateTemplate(template);
    if (!validation.isValid) {
      const errorMessages = validation.errors.map(e => e.message).join(', ');
      throw new BadRequestException(`模板验证失败: ${errorMessages}`);
    }

    // 检查ID是否已存在
    if (this.templateManager.getTemplate(template.metadata.id)) {
      throw new BadRequestException(`模板ID已存在: ${template.metadata.id}`);
    }

    // 设置创建时间
    template.metadata.createdAt = new Date();
    template.metadata.updatedAt = new Date();
    template.metadata.usageCount = 0;

    this.templateManager.addTemplate(template);
    this.logger.log(`创建新模板: ${template.metadata.name} (${template.metadata.id})`);
    
    return template;
  }

  /**
   * 更新模板
   */
  async updateTemplate(id: string, updates: Partial<PromptTemplate>): Promise<PromptTemplate> {
    const existingTemplate = this.templateManager.getTemplate(id);
    if (!existingTemplate) {
      throw new NotFoundException(`模板不存在: ${id}`);
    }

    // 合并更新
    const updatedTemplate = {
      ...existingTemplate,
      ...updates,
      metadata: {
        ...existingTemplate.metadata,
        ...updates.metadata,
        id, // 保持ID不变
        updatedAt: new Date()
      }
    };

    // 验证更新后的模板
    const validation = this.templateManager.validateTemplate(updatedTemplate);
    if (!validation.isValid) {
      const errorMessages = validation.errors.map(e => e.message).join(', ');
      throw new BadRequestException(`模板验证失败: ${errorMessages}`);
    }

    const success = this.templateManager.updateTemplate(id, updates);
    if (!success) {
      throw new BadRequestException('更新模板失败');
    }

    this.logger.log(`更新模板: ${id}`);
    return this.templateManager.getTemplate(id)!;
  }

  /**
   * 删除模板
   */
  async deleteTemplate(id: string): Promise<void> {
    const template = this.templateManager.getTemplate(id);
    if (!template) {
      throw new NotFoundException(`模板不存在: ${id}`);
    }

    const success = this.templateManager.deleteTemplate(id);
    if (!success) {
      throw new BadRequestException('删除模板失败');
    }

    this.logger.log(`删除模板: ${id}`);
  }

  /**
   * 渲染模板
   */
  async renderTemplate(templateId: string, options: PromptRenderOptions): Promise<RenderedPrompt> {
    try {
      const rendered = this.templateManager.renderTemplate(templateId, options);
      this.logger.log(`渲染模板: ${templateId}`);
      return rendered;
    } catch (error) {
      this.logger.error(`渲染模板失败: ${templateId}`, error);
      if (error.message.includes('模板不存在')) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }

  /**
   * 验证模板
   */
  async validateTemplate(template: PromptTemplate) {
    return this.templateManager.validateTemplate(template);
  }

  /**
   * 获取所有分类
   */
  async getCategories(): Promise<string[]> {
    return this.templateManager.getCategories();
  }

  /**
   * 获取所有标签
   */
  async getTags(): Promise<string[]> {
    return this.templateManager.getTags();
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<PromptTemplateStats> {
    return this.templateManager.getStats();
  }

  /**
   * 导出模板
   */
  async exportTemplates(templateIds?: string[]): Promise<PromptTemplateExport> {
    if (templateIds) {
      // 验证所有模板ID都存在
      const missingIds = templateIds.filter(id => !this.templateManager.getTemplate(id));
      if (missingIds.length > 0) {
        throw new NotFoundException(`以下模板不存在: ${missingIds.join(', ')}`);
      }
    }

    const exportData = this.templateManager.exportTemplates(templateIds);
    this.logger.log(`导出 ${exportData.templates.length} 个模板`);
    return exportData;
  }

  /**
   * 导入模板
   */
  async importTemplates(exportData: PromptTemplateExport): Promise<{ imported: number; skipped: number; errors: string[] }> {
    try {
      const result = this.templateManager.importTemplates(exportData);
      this.logger.log(`导入完成: 成功 ${result.imported} 个，跳过 ${result.skipped} 个，错误 ${result.errors.length} 个`);
      return result;
    } catch (error) {
      this.logger.error('导入模板失败', error);
      throw new BadRequestException('导入数据格式无效');
    }
  }

  /**
   * 复制模板
   */
  async duplicateTemplate(id: string, newId: string, newName?: string): Promise<PromptTemplate> {
    const originalTemplate = this.templateManager.getTemplate(id);
    if (!originalTemplate) {
      throw new NotFoundException(`模板不存在: ${id}`);
    }

    if (this.templateManager.getTemplate(newId)) {
      throw new BadRequestException(`新模板ID已存在: ${newId}`);
    }

    const duplicatedTemplate: PromptTemplate = {
      ...originalTemplate,
      metadata: {
        ...originalTemplate.metadata,
        id: newId,
        name: newName || `${originalTemplate.metadata.name} (副本)`,
        createdAt: new Date(),
        updatedAt: new Date(),
        usageCount: 0
      }
    };

    this.templateManager.addTemplate(duplicatedTemplate);
    this.logger.log(`复制模板: ${id} -> ${newId}`);
    
    return duplicatedTemplate;
  }

  /**
   * 获取模板使用历史
   */
  async getTemplateUsageHistory(templateId: string): Promise<any> {
    const template = this.templateManager.getTemplate(templateId);
    if (!template) {
      throw new NotFoundException(`模板不存在: ${templateId}`);
    }

    // 这里可以扩展为从数据库获取详细的使用历史
    return {
      templateId,
      totalUsage: template.metadata.usageCount || 0,
      lastUsed: template.metadata.updatedAt,
      // 可以添加更多历史数据
    };
  }

  /**
   * 批量操作模板
   */
  async batchOperation(operation: 'delete' | 'export', templateIds: string[]): Promise<any> {
    // 验证所有模板ID都存在
    const missingIds = templateIds.filter(id => !this.templateManager.getTemplate(id));
    if (missingIds.length > 0) {
      throw new NotFoundException(`以下模板不存在: ${missingIds.join(', ')}`);
    }

    switch (operation) {
      case 'delete':
        let deletedCount = 0;
        const deleteErrors: string[] = [];
        
        for (const id of templateIds) {
          try {
            await this.deleteTemplate(id);
            deletedCount++;
          } catch (error) {
            deleteErrors.push(`删除模板 ${id} 失败: ${error.message}`);
          }
        }
        
        return {
          operation: 'delete',
          total: templateIds.length,
          success: deletedCount,
          errors: deleteErrors
        };

      case 'export':
        return await this.exportTemplates(templateIds);

      default:
        throw new BadRequestException(`不支持的批量操作: ${operation}`);
    }
  }

  /**
   * 搜索模板变量
   */
  async searchTemplatesByVariable(variableName: string): Promise<PromptTemplate[]> {
    const allTemplates = this.templateManager.getAllTemplates();
    return allTemplates.filter(template => 
      template.content.variables.some(variable => 
        variable.name.toLowerCase().includes(variableName.toLowerCase())
      )
    );
  }

  /**
   * 获取模板依赖关系
   */
  async getTemplateDependencies(templateId: string): Promise<{ dependencies: string[]; dependents: string[] }> {
    const template = this.templateManager.getTemplate(templateId);
    if (!template) {
      throw new NotFoundException(`模板不存在: ${templateId}`);
    }

    // 这里可以实现模板间的依赖关系分析
    // 目前返回空数组，可以根据需要扩展
    return {
      dependencies: [], // 该模板依赖的其他模板
      dependents: []    // 依赖该模板的其他模板
    };
  }
}