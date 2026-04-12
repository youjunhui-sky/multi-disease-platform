import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { QuestionnaireService } from './questionnaire.service';
import {
  CreateQuestionnaireDto,
  UpdateQuestionnaireDto,
  QueryQuestionnaireDto,
  SaveQuestionsDto,
  SubmitAnswerDto,
} from './dto/questionnaire.dto';

@Controller('questionnaire')
export class QuestionnaireController {
  constructor(private readonly questionnaireService: QuestionnaireService) {}

  /**
   * 分页查询问卷列表
   */
  @Get()
  async findAll(@Query() query: QueryQuestionnaireDto) {
    return this.questionnaireService.findAll(query);
  }

  /**
   * 获取问卷详情
   */
  @Get(':id')
  async findById(@Param('id') id: number) {
    return this.questionnaireService.findById(id);
  }

  /**
   * 获取问卷详情（含问题和选项）
   */
  @Get(':id/detail')
  async getDetail(@Param('id') id: number) {
    return this.questionnaireService.getDetail(id);
  }

  /**
   * 获取问卷的问题和选项
   */
  @Get(':id/questions')
  async getQuestions(@Param('id') id: number) {
    return this.questionnaireService.getQuestionsWithOptions(id);
  }

  /**
   * 创建问卷
   */
  @Post()
  async create(@Body() dto: CreateQuestionnaireDto) {
    return this.questionnaireService.create(dto);
  }

  /**
   * 更新问卷
   */
  @Put(':id')
  async update(@Param('id') id: number, @Body() dto: UpdateQuestionnaireDto) {
    return this.questionnaireService.update(id, dto);
  }

  /**
   * 删除问卷
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: number) {
    await this.questionnaireService.remove(id);
  }

  /**
   * 发布问卷
   */
  @Post(':id/publish')
  async publish(@Param('id') id: number) {
    await this.questionnaireService.publish(id);
    return { message: '问卷已发布' };
  }

  /**
   * 取消发布问卷
   */
  @Post(':id/unpublish')
  async unpublish(@Param('id') id: number) {
    await this.questionnaireService.unpublish(id);
    return { message: '问卷已取消发布' };
  }

  /**
   * 保存问题（含选项）
   */
  @Post('questions/save')
  async saveQuestions(@Body() dto: SaveQuestionsDto) {
    return this.questionnaireService.saveQuestions(dto);
  }

  /**
   * 提交答卷（APP端）
   */
  @Post('answer/submit')
  @HttpCode(HttpStatus.OK)
  async submitAnswer(@Body() dto: SubmitAnswerDto) {
    return this.questionnaireService.submitAnswer(dto);
  }

  /**
   * 获取答卷列表
   */
  @Get(':id/answers')
  async getAnswers(@Param('id') id: number) {
    return this.questionnaireService.getAnswerSheets(id);
  }

  /**
   * 获取答卷详情
   */
  @Get('answer/:id')
  async getAnswerDetail(@Param('id') id: number) {
    return this.questionnaireService.getAnswerSheetDetail(id);
  }
}
