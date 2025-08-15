import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { PromptTemplateService } from './prompt-template.service';
import {
  PromptTemplate,
  PromptTemplateSearchCriteria,
  PromptRenderOptions,
  PromptTemplateExport
} from './prompt-template.interface';

/**
 * 提示词模板控制器
 */
@Controller('prompt-templates')
export class PromptTemplateController {
  private readonly logger = new Logger(PromptTemplateController.name);

  constructor(private readonly promptTemplateService: PromptTemplateService) {}

  /**
   * 获取所有模板
   */
  @Get()
  async getAllTemplates() {
    return await this.promptTemplateService.getAllTemplates();
  }

  /**
   * 根据ID获取模板
   */
  @Get(':id')
  async getTemplateById(@Param('id') id: string) {
    return await this.promptTemplateService.getTemplateById(id);
  }

  /**
   * 搜索模板
   */
  @Post('search')
  async searchTemplates(@Body() criteria: PromptTemplateSearchCriteria) {
    return await this.promptTemplateService.searchTemplates(criteria);
  }

  /**
   * 创建新模板
   */
  @Post()
  async createTemplate(@Body() template: PromptTemplate) {
    return await this.promptTemplateService.createTemplate(template);
  }

  /**
   * 更新模板
   */
  @Put(':id')
  async updateTemplate(
    @Param('id') id: string,
    @Body() updates: Partial<PromptTemplate>
  ) {
    return await this.promptTemplateService.updateTemplate(id, updates);
  }

  /**
   * 删除模板
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTemplate(@Param('id') id: string) {
    await this.promptTemplateService.deleteTemplate(id);
  }

  /**
   * 渲染模板
   */
  @Post(':id/render')
  async renderTemplate(
    @Param('id') id: string,
    @Body() options: PromptRenderOptions
  ) {
    return await this.promptTemplateService.renderTemplate(id, options);
  }

  /**
   * 验证模板
   */
  @Post('validate')
  async validateTemplate(@Body() template: PromptTemplate) {
    return await this.promptTemplateService.validateTemplate(template);
  }

  /**
   * 复制模板
   */
  @Post(':id/duplicate')
  async duplicateTemplate(
    @Param('id') id: string,
    @Body() body: { newId: string; newName?: string }
  ) {
    return await this.promptTemplateService.duplicateTemplate(id, body.newId, body.newName);
  }

  /**
   * 获取所有分类
   */
  @Get('meta/categories')
  async getCategories() {
    return await this.promptTemplateService.getCategories();
  }

  /**
   * 获取所有标签
   */
  @Get('meta/tags')
  async getTags() {
    return await this.promptTemplateService.getTags();
  }

  /**
   * 获取统计信息
   */
  @Get('meta/stats')
  async getStats() {
    return await this.promptTemplateService.getStats();
  }

  /**
   * 导出模板
   */
  @Post('export')
  async exportTemplates(@Body() body: { templateIds?: string[] }) {
    return await this.promptTemplateService.exportTemplates(body.templateIds);
  }

  /**
   * 导入模板
   */
  @Post('import')
  async importTemplates(@Body() exportData: PromptTemplateExport) {
    return await this.promptTemplateService.importTemplates(exportData);
  }

  /**
   * 批量操作
   */
  @Post('batch')
  async batchOperation(@Body() body: { operation: 'delete' | 'export'; templateIds: string[] }) {
    return await this.promptTemplateService.batchOperation(body.operation, body.templateIds);
  }

  /**
   * 根据变量搜索模板
   */
  @Get('search/by-variable/:variableName')
  async searchTemplatesByVariable(@Param('variableName') variableName: string) {
    return await this.promptTemplateService.searchTemplatesByVariable(variableName);
  }

  /**
   * 获取模板使用历史
   */
  @Get(':id/usage-history')
  async getTemplateUsageHistory(@Param('id') id: string) {
    return await this.promptTemplateService.getTemplateUsageHistory(id);
  }

  /**
   * 获取模板依赖关系
   */
  @Get(':id/dependencies')
  async getTemplateDependencies(@Param('id') id: string) {
    return await this.promptTemplateService.getTemplateDependencies(id);
  }

  /**
   * 快速搜索模板
   */
  @Get('quick-search')
  async quickSearch(
    @Query('q') query: string,
    @Query('category') category?: string,
    @Query('limit') limit?: number
  ) {
    const criteria: PromptTemplateSearchCriteria = {
      query,
      category,
      limit: limit || 10
    };
    return await this.promptTemplateService.searchTemplates(criteria);
  }
}