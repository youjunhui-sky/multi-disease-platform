import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QuestionnaireService } from './questionnaire.service';

@Controller('questionnaire/options')
export class OptionController {
  constructor(private readonly questionnaireService: QuestionnaireService) {}

  /**
   * 根据问题ID获取选项列表
   */
  @Get('by-question/:questionId')
  async getByQuestionId(@Param('questionId') questionId: number) {
    return this.questionnaireService.getOptionsByQuestionId(questionId);
  }
}
