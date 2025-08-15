import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearnController } from './learn.controller';
import { LearnService } from './learn.service';
import { AIWorkflowService } from './ai-workflow.service';
import { LearningSession } from '../database/learning-session.entity';
import { PromptTemplateModule } from '../prompts/prompt-template.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LearningSession]),
    PromptTemplateModule
  ],
  controllers: [LearnController],
  providers: [LearnService, AIWorkflowService],
  exports: [LearnService, AIWorkflowService],
})
export class LearnModule {}