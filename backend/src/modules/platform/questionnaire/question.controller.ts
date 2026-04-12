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
  Query,
} from '@nestjs/common';
import { QuestionnaireService } from './questionnaire.service';
import { QuestionService } from './question.service';

@Controller('questionnaire/questions')
export class QuestionController {
  constructor(
    private readonly questionnaireService: QuestionnaireService,
    private readonly questionService: QuestionService,
  ) {}

  /**
   * 获取问卷的问题和选项
   */
  @Get('by-questionnaire/:questionnaireId')
  async getByQuestionnaireId(@Param('questionnaireId') questionnaireId: number) {
    return this.questionnaireService.getQuestionsWithOptions(questionnaireId);
  }

  /**
   * 保存问题（含选项）
   */
  @Post('save')
  async saveQuestions(@Body() dto: any) {
    return this.questionnaireService.saveQuestions(dto);
  }

  /**
   * 更新问题排序
   */
  @Post('update-sort')
  async updateSort(@Body() body: { id: number; sort: number }) {
    return this.questionnaireService.updateQuestionSort(body.id, body.sort);
  }

  /**
   * 删除问题
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteQuestion(@Param('id') id: number) {
    await this.questionnaireService.deleteQuestion(id);
  }

  /**
   * 新增问题
   */
  @Post()
  async addQuestion(@Body() dto: any) {
    return this.questionService.add(dto);
  }

  /**
   * 更新问题
   */
  @Put(':id')
  async updateQuestion(@Param('id') id: number, @Body() dto: any) {
    return this.questionService.update(id, dto);
  }

  /**
   * 删除问题
   */
  @Delete('delete/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: number) {
    await this.questionService.delete(id);
  }
}
