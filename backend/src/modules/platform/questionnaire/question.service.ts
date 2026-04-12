import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from '../../../entities/platform/question.entity';
import { Option } from '../../../entities/platform/option.entity';
import { QuestionDto } from './dto/questionnaire.dto';

@Injectable()
export class QuestionService {
  private readonly logger = new Logger(QuestionService.name);

  constructor(
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(Option)
    private readonly optionRepo: Repository<Option>,
  ) { }

  /**
   * 新增问题
   */
  async add(dto: QuestionDto) {
    const { questionnaireId, title, type, bh, required, jump, sort, options } = dto;

    if (!questionnaireId) {
      throw new Error('问卷ID不能为空');
    }

    const question = this.questionRepo.create({
      questionnaireId,
      title,
      type,
      bh: bh || '',
      required: required !== undefined ? required : false,
      jump: jump ? JSON.stringify(jump) : null,
      sort: sort || 0,
    });

    const savedQuestion = await this.questionRepo.save(question);

    // 保存选项
    if (options && options.length > 0) {
      await this.saveOptions(savedQuestion.id, options, questionnaireId);
    }

    return savedQuestion;
  }

  /**
   * 更新问题
   */
  async update(id: number, dto: QuestionDto) {
    const { title, type, bh, required, jump, sort, options } = dto;

    const question = await this.questionRepo.findOne({ where: { id } });
    if (!question) {
      throw new Error('问题不存在');
    }

    // 先删除选项
    await this.optionRepo.delete({ questionId: id });

    // 更新问题
    await this.questionRepo.update(id, {
      title: title !== undefined ? title : question.title,
      type: type !== undefined ? type : question.type,
      bh: bh !== undefined ? bh : question.bh,
      required: required !== undefined ? required : question.required,
      jump: jump ? JSON.stringify(jump) : (question.jump || null),
      sort: sort !== undefined ? sort : question.sort,
    });

    // 保存选项
    if (options && options.length > 0) {
      await this.saveOptions(id, options, question.questionnaireId);
    }

    return this.questionRepo.findOne({ where: { id } });
  }

  /**
   * 删除问题（同时删除选项）
   */
  async delete(id: number) {
    const question = await this.questionRepo.findOne({ where: { id } });
    if (!question) {
      throw new Error('问题不存在');
    }

    // 先删除选项
    await this.optionRepo.delete({ questionId: id });
    // 再删除问题
    await this.questionRepo.delete({ id });

    return { success: true };
  }

  /**
   * 更新问题排序
   */
  async updateSort(id: number, sort: number) {
    await this.questionRepo.update(id, { sort });
    return { success: true };
  }

  /**
   * 获取问题详情（含选项）
   */
  async getById(id: number) {
    const question = await this.questionRepo.findOne({
      where: { id },
      relations: ['options'],
    });
    return question;
  }

  /**
   * 获取问卷下所有问题
   */
  async getByQuestionnaireId(questionnaireId: number) {
    return this.questionRepo.find({
      where: { questionnaireId },
      order: { sort: 'ASC' },
    });
  }

  /**
   * 保存选项
   */
  async saveOptions(questionId: number, options: any[], questionnaireId: number) {
    // 先删除该问题下的所有选项
    await this.optionRepo.delete({ questionId });

    // 再保存新选项
    if (options && options.length > 0) {
      const newOptions = options.map((opt, index) =>
        this.optionRepo.create({
          questionnaireId,
          questionId,
          content: opt.content || '',
          bh: opt.bh || '',
          score: opt.score !== undefined ? opt.score : null,
          other: opt.other || false,
          sort: index + 1,
        }),
      );
      await this.optionRepo.save(newOptions);
    }

    return { success: true };
  }
}