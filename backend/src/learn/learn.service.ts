import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { LearningSession } from '../database/learning-session.entity';
import { AIWorkflowService } from './ai-workflow.service';
import * as validator from 'validator';

export interface LearnRequestDto {
  url: string;
  level: 'beginner' | 'advanced';
}

export interface LearnResponseDto {
  sessionId: string;
  summary: string;
  keys: any[];
  path: any[];
}

export interface AskRequestDto {
  sessionId: string;
  question: string;
}

export interface AskResponseDto {
  answer: string;
}

export interface QuizAnswerRequestDto {
  sessionId: string;
  answer: string;
}

export interface QuizAnswerResponseDto {
  correct: boolean;
  explanation: string;
}

@Injectable()
export class LearnService {
  constructor(
    @InjectRepository(LearningSession)
    private readonly learningSessionRepository: Repository<LearningSession>,
    private readonly aiWorkflowService: AIWorkflowService,
  ) {}

  async processLearningRequest(request: LearnRequestDto): Promise<LearnResponseDto> {
    // Validate URL
    if (!validator.isURL(request.url)) {
      throw new Error('Invalid URL provided');
    }

    // Validate level
    if (!['beginner', 'advanced'].includes(request.level)) {
      throw new Error('Invalid level. Must be "beginner" or "advanced"');
    }

    // Generate session ID
    const sessionId = uuidv4();

    try {
      // Execute AI workflow
      const documentContent = await this.aiWorkflowService.parseDocument(request.url);
      const keyPoints = await this.aiWorkflowService.extractKeyPoints(documentContent.content);
      const learningPath = await this.aiWorkflowService.generateLearningPath(keyPoints, request.level);
      const quiz = await this.aiWorkflowService.generateQuiz(keyPoints);

      // Generate summary
      const summary = this.generateSummary(documentContent.content, keyPoints);

      // Create and save learning session
      const learningSession = new LearningSession();
      learningSession.id = sessionId;
      learningSession.url = request.url;
      learningSession.userLevel = request.level;
      learningSession.summary = summary;
      learningSession.setKeys(keyPoints);
      learningSession.setPath(learningPath);
      learningSession.setQuiz(quiz);
      learningSession.setDialogHistory([]);

      await this.learningSessionRepository.save(learningSession);

      return {
        sessionId,
        summary,
        keys: keyPoints,
        path: learningPath,
      };
    } catch (error) {
      throw new Error(`Failed to process learning request: ${error.message}`);
    }
  }

  async handleQuestion(request: AskRequestDto): Promise<AskResponseDto> {
    // Find learning session
    const session = await this.learningSessionRepository.findOne({
      where: { id: request.sessionId }
    });

    if (!session) {
      throw new NotFoundException('Learning session not found');
    }

    try {
      // Get document content (we'll need to re-parse or store it)
      const documentContent = await this.aiWorkflowService.parseDocument(session.url);
      
      // Get dialog history
      const dialogHistory = session.getDialogHistory();

      // Get AI answer
      const answer = await this.aiWorkflowService.answerQuestion(
        request.question,
        documentContent.content,
        dialogHistory
      );

      // Update dialog history
      session.addToDialogHistory({
        question: request.question,
        answer: answer as string,
        timestamp: new Date().toISOString()
      });

      await this.learningSessionRepository.save(session);

      return { answer };
    } catch (error) {
      throw new Error(`Failed to answer question: ${error.message}`);
    }
  }

  async handleQuizAnswer(request: QuizAnswerRequestDto): Promise<QuizAnswerResponseDto> {
    // Find learning session
    const session = await this.learningSessionRepository.findOne({
      where: { id: request.sessionId }
    });

    if (!session) {
      throw new NotFoundException('Learning session not found');
    }

    const quiz = session.getQuiz();
    if (!quiz || !Array.isArray(quiz) || quiz.length === 0) {
      throw new Error('No quiz available for this session');
    }

    // For simplicity, check against the first quiz question
    // In a real implementation, you'd track which question is being answered
    const firstQuestion = quiz[0];
    const isCorrect = request.answer.toLowerCase() === firstQuestion.correctAnswer.toLowerCase();

    return {
      correct: isCorrect,
      explanation: firstQuestion.explanation || 'Answer explanation not available'
    };
  }

  async getSession(sessionId: string): Promise<LearningSession> {
    const session = await this.learningSessionRepository.findOne({
      where: { id: sessionId }
    });

    if (!session) {
      throw new NotFoundException('Learning session not found');
    }

    return session;
  }

  private generateSummary(content: string, keyPoints: any[]): string {
    const maxSummaryLength = 500;
    let summary = content.substring(0, maxSummaryLength);
    
    if (content.length > maxSummaryLength) {
      summary += '...';
    }

    // Add key points summary
    if (keyPoints.length > 0) {
      const keyConceptsList = keyPoints.map(kp => kp.concept).join(', ');
      summary += `\n\nKey concepts covered: ${keyConceptsList}`;
    }

    return summary;
  }
}