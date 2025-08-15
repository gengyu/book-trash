/**
 * 提示词模板变量类型
 */
export type PromptVariableType = 'string' | 'number' | 'boolean' | 'array' | 'object';

/**
 * 提示词模板变量定义
 */
export interface PromptVariable {
  name: string;
  type: PromptVariableType;
  description: string;
  required: boolean;
  defaultValue?: any;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    enum?: any[];
  };
}

/**
 * 提示词模板元数据
 */
export interface PromptTemplateMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  version: string;
  author: string;
  createdAt: Date;
  updatedAt: Date;
  language: string;
  usageCount?: number;
  rating?: number;
}

/**
 * 提示词模板内容
 */
export interface PromptTemplateContent {
  system?: string;
  user: string;
  assistant?: string;
  variables: PromptVariable[];
  examples?: Array<{
    input: Record<string, any>;
    output: string;
    description?: string;
  }>;
}

/**
 * 完整的提示词模板
 */
export interface PromptTemplate {
  metadata: PromptTemplateMetadata;
  content: PromptTemplateContent;
}

/**
 * 提示词模板渲染结果
 */
export interface RenderedPrompt {
  system?: string;
  user: string;
  assistant?: string;
  variables: Record<string, any>;
  templateId: string;
  renderedAt: Date;
}

/**
 * 提示词模板搜索条件
 */
export interface PromptTemplateSearchCriteria {
  query?: string;
  category?: string;
  tags?: string[];
  language?: string;
  author?: string;
  minRating?: number;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'usageCount' | 'rating';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * 提示词模板验证结果
 */
export interface PromptTemplateValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    code: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

/**
 * 提示词模板渲染选项
 */
export interface PromptRenderOptions {
  variables: Record<string, any>;
  validateVariables?: boolean;
  escapeHtml?: boolean;
  trimWhitespace?: boolean;
  preserveFormatting?: boolean;
}

/**
 * 提示词模板导入/导出格式
 */
export interface PromptTemplateExport {
  version: string;
  exportedAt: Date;
  templates: PromptTemplate[];
  metadata: {
    totalCount: number;
    exportedBy: string;
    description?: string;
  };
}

/**
 * 提示词模板统计信息
 */
export interface PromptTemplateStats {
  totalTemplates: number;
  categoriesCount: number;
  languagesCount: number;
  averageRating: number;
  mostUsedTemplates: Array<{
    templateId: string;
    name: string;
    usageCount: number;
  }>;
  recentlyCreated: Array<{
    templateId: string;
    name: string;
    createdAt: Date;
  }>;
}