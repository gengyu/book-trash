import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  HttpException, 
  HttpStatus 
} from '@nestjs/common';
import { 
  LearnService, 
  LearnRequestDto, 
  LearnResponseDto,
  AskRequestDto,
  AskResponseDto,
  QuizAnswerRequestDto,
  QuizAnswerResponseDto
} from './learn.service';

@Controller()
export class LearnController {
  constructor(private readonly learnService: LearnService) {}

  @Post('learn')
  async learn(@Body() request: LearnRequestDto): Promise<LearnResponseDto> {
    try {
      return await this.learnService.processLearningRequest(request);
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          error: error.message || 'Unable to process learning request'
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('ask')
  async ask(@Body() request: AskRequestDto): Promise<AskResponseDto> {
    try {
      return await this.learnService.handleQuestion(request);
    } catch (error) {
      const statusCode = error.message.includes('not found') 
        ? HttpStatus.NOT_FOUND 
        : HttpStatus.BAD_REQUEST;
      
      throw new HttpException(
        {
          statusCode,
          error: error.message || 'Unable to answer question'
        },
        statusCode
      );
    }
  }

  @Post('quiz-answer')
  async quizAnswer(@Body() request: QuizAnswerRequestDto): Promise<QuizAnswerResponseDto> {
    try {
      return await this.learnService.handleQuizAnswer(request);
    } catch (error) {
      const statusCode = error.message.includes('not found') 
        ? HttpStatus.NOT_FOUND 
        : HttpStatus.BAD_REQUEST;
      
      throw new HttpException(
        {
          statusCode,
          error: error.message || 'Unable to process quiz answer'
        },
        statusCode
      );
    }
  }

  @Get('session/:id')
  async getSession(@Param('id') sessionId: string) {
    try {
      const session = await this.learnService.getSession(sessionId);
      return {
        sessionId: session.id,
        url: session.url,
        userLevel: session.userLevel,
        summary: session.summary,
        keys: session.getKeys(),
        path: session.getPath(),
        quiz: session.getQuiz(),
        dialogHistory: session.getDialogHistory(),
        createdAt: session.createdAt
      };
    } catch (error) {
      const statusCode = error.message.includes('not found') 
        ? HttpStatus.NOT_FOUND 
        : HttpStatus.BAD_REQUEST;
      
      throw new HttpException(
        {
          statusCode,
          error: error.message || 'Unable to retrieve session'
        },
        statusCode
      );
    }
  }
}