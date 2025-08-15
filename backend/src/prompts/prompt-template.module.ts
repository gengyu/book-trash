import { Module } from '@nestjs/common';
import { PromptTemplateController } from './prompt-template.controller';
import { PromptTemplateService } from './prompt-template.service';
import { PromptTemplateManager } from './prompt-template.manager';

/**
 * 提示词模板模块
 */
@Module({
  controllers: [PromptTemplateController],
  providers: [
    PromptTemplateService,
    PromptTemplateManager
  ],
  exports: [
    PromptTemplateService,
    PromptTemplateManager
  ]
})
export class PromptTemplateModule {}