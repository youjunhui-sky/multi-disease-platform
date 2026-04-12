import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Questionnaire } from '../../../entities/platform/questionnaire.entity';
import { Question } from '../../../entities/platform/question.entity';
import { Option } from '../../../entities/platform/option.entity';
import {
  CreateQuestionnaireDto,
  UpdateQuestionnaireDto,
  QueryQuestionnaireDto,
  SaveQuestionsDto,
  SubmitAnswerDto,
} from './dto/questionnaire.dto';
import { AnswerSheet } from '../../../entities/platform/answer-sheet.entity';
import { Answer } from '../../../entities/platform/answer.entity';

@Injectable()
export class QuestionnaireService {
  private readonly logger = new Logger(QuestionnaireService.name);

  constructor(
    @InjectRepository(Questionnaire)
    private readonly questionnaireRepo: Repository<Questionnaire>,
    @InjectRepository(Question)
    private readonly questionRepo: Repository<Question>,
    @InjectRepository(Option)
    private readonly optionRepo: Repository<Option>,
    @InjectRepository(AnswerSheet)
    private readonly answerSheetRepo: Repository<AnswerSheet>,
    @InjectRepository(Answer)
    private readonly answerRepo: Repository<Answer>,
  ) {}

  /**
   * 分页查询问卷列表
   */
  async findAll(query: QueryQuestionnaireDto) {
    const { keyword, page = 1, pageSize = 20, orgId, accessibleOrgs } = query;
    const queryBuilder = this.questionnaireRepo.createQueryBuilder('q');

    if (keyword) {
      queryBuilder.andWhere('(q.title LIKE :keyword OR q.description LIKE :keyword)', {
        keyword: `%${keyword}%`,
      });
    }

    if (orgId) {
      // 用户指定了机构，按指定机构过滤
      queryBuilder.andWhere('q.orgId = :orgId', { orgId });
    } else if (accessibleOrgs && accessibleOrgs.length > 0) {
      // 用户未指定机构但有权限限制，按可访问机构过滤
      queryBuilder.andWhere('q.orgId IN (:...accessibleOrgs)', { accessibleOrgs });
    }

    queryBuilder.andWhere('q.deletedAt IS NULL');

    const [items, total] = await queryBuilder
      .orderBy('q.sort', 'ASC')
      .addOrderBy('q.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { items, total, page, pageSize };
  }

  /**
   * 获取问卷详情
   */
  async findById(id: number) {
    const questionnaire = await this.questionnaireRepo.findOne({
      where: { id },
    });
    if (!questionnaire) {
      throw new NotFoundException('问卷不存在');
    }
    return questionnaire;
  }

  /**
   * 获取问卷详情（含问题和选项）
   */
  async getDetail(id: number) {
    const questionnaire = await this.findById(id);

    const questions = await this.questionRepo.find({
      where: { questionnaireId: id },
      order: { sort: 'ASC' },
    });

    const questionIds = questions.map((q) => q.id);
    const options = await this.optionRepo.find({
      where: { questionId: In(questionIds) },
      order: { sort: 'ASC' },
    });

    const optionsByQuestionId: Record<number, Option[]> = {};
    options.forEach((opt) => {
      if (!optionsByQuestionId[opt.questionId]) {
        optionsByQuestionId[opt.questionId] = [];
      }
      optionsByQuestionId[opt.questionId].push(opt);
    });

    const questionsWithOptions = questions.map((q) => ({
      ...q,
      options: optionsByQuestionId[q.id] || [],
    }));

    return {
      ...questionnaire,
      questions: questionsWithOptions,
    };
  }

  /**
   * 创建问卷
   */
  async create(dto: CreateQuestionnaireDto) {
    const questionnaire = this.questionnaireRepo.create(dto);
    return this.questionnaireRepo.save(questionnaire);
  }

  /**
   * 更新问卷
   */
  async update(id: number, dto: UpdateQuestionnaireDto) {
    await this.findById(id);
    await this.questionnaireRepo.update(id, dto);
    return this.findById(id);
  }

  /**
   * 删除问卷
   */
  async remove(id: number) {
    await this.findById(id);
    await this.questionnaireRepo.update(id, { deletedAt: new Date() });
  }

  /**
   * 发布问卷
   */
  async publish(id: number) {
    await this.findById(id);
    await this.questionnaireRepo.update(id, { published: true });
  }

  /**
   * 取消发布问卷
   */
  async unpublish(id: number) {
    await this.findById(id);
    await this.questionnaireRepo.update(id, { published: false });
  }

  /**
   * 保存问题（含选项）
   */
  async saveQuestions(dto: SaveQuestionsDto) {
    const { questions } = dto;
    if (!questions || questions.length === 0) {
      return [];
    }

    const questionnaireId = questions[0].questionnaireId;
    if (!questionnaireId) {
      throw new Error('问卷ID不能为空');
    }

    // 获取当前问卷下已有的问题ID列表
    const existingQuestions = await this.questionRepo.find({ where: { questionnaireId } });
    const existingQuestionIds = existingQuestions.map(q => q.id);

    // 收集需要保留的问题ID（在前端传来的问题中有id的）
    const questionIdsToKeep: number[] = [];
    for (const q of questions) {
      const numId = Number(q.id);
      if (q.id && !isNaN(numId) && numId > 0) {
        questionIdsToKeep.push(numId);
      }
    }

    // 删除不在需要保留列表中的问题（先删除选项再删除问题）
    const questionIdsToDelete = existingQuestionIds.filter(id => !questionIdsToKeep.includes(id));
    if (questionIdsToDelete.length > 0) {
      await this.optionRepo.createQueryBuilder()
        .delete()
        .where('question_id IN (:...ids)', { ids: questionIdsToDelete })
        .execute();
      await this.questionRepo.createQueryBuilder()
        .delete()
        .where('id IN (:...ids)', { ids: questionIdsToDelete })
        .execute();
    }

    const result = [];

    for (const questionData of questions) {
      let savedQuestion;
      const questionId = Number(questionData.id);
      const isValidId = questionData.id && !isNaN(questionId) && questionId > 0;

      if (isValidId) {
        // 更新现有问题
        await this.questionRepo.update(questionId, {
          title: questionData.title,
          type: questionData.type,
          sort: questionData.sort || 0,
          required: questionData.required !== undefined ? questionData.required : true,
          jump: questionData.jump ? JSON.stringify(questionData.jump) : null,
          bh: questionData.bh,
        });
        savedQuestion = await this.questionRepo.findOne({ where: { id: questionId } });
      } else {
        // 创建新问题
        const question = this.questionRepo.create({
          questionnaireId,
          title: questionData.title,
          type: questionData.type,
          sort: questionData.sort || 0,
          required: questionData.required !== undefined ? questionData.required : true,
          jump: questionData.jump ? JSON.stringify(questionData.jump) : null,
          bh: questionData.bh,
        });
        savedQuestion = await this.questionRepo.save(question);
      }

      if (!savedQuestion) continue;

      // 处理选项：先删除该问题下的所有选项
      await this.optionRepo.delete({ questionId: savedQuestion.id });

      if (questionData.options && questionData.options.length > 0) {
        const options = questionData.options.map((opt, index) =>
          this.optionRepo.create({
            questionnaireId,
            questionId: savedQuestion.id,
            content: opt.content,
            score: opt.score || null,
            sort: index + 1,
            bh: opt.bh || '',
            other: opt.other || false,
          }),
        );
        await this.optionRepo.save(options);
      }

      result.push({
        question: savedQuestion,
        options: questionData.options || [],
      });
    }

    return result;
  }

  /**
   * 获取问卷的问题和选项
   */
  async getQuestionsWithOptions(questionnaireId: number) {
    const questions = await this.questionRepo.find({
      where: { questionnaireId },
      order: { sort: 'ASC' },
    });

    const questionIds = questions.map((q) => q.id);
    const options = await this.optionRepo.find({
      where: { questionId: In(questionIds) },
      order: { sort: 'ASC' },
    });

    const optionsByQuestionId: Record<number, Option[]> = {};
    options.forEach((opt) => {
      if (!optionsByQuestionId[opt.questionId]) {
        optionsByQuestionId[opt.questionId] = [];
      }
      optionsByQuestionId[opt.questionId].push(opt);
    });

    return questions.map((q) => ({
      id: q.id.toString(),
      type: q.type,
      title: q.title,
      options: (optionsByQuestionId[q.id] || []).map((opt) => ({
        id: opt.id,
        bh: opt.bh,
        content: opt.content,
        score: opt.score,
        other: opt.other,
      })),
      required: q.required,
      jump: q.jump ? JSON.parse(q.jump) : {},
      bh: q.bh,
      questionnaireId: q.questionnaireId,
    }));
  }

  /**
   * 提交答卷
   */
  async submitAnswer(dto: SubmitAnswerDto) {
    const { questionnaireId, userId, answers } = dto;

    const answerSheet = this.answerSheetRepo.create({
      questionnaireId,
      userId: userId || null,
      submitTime: new Date(),
    });
    const savedSheet = await this.answerSheetRepo.save(answerSheet);

    const answerEntities = answers.map((a) =>
      this.answerRepo.create({
        answerSheetId: savedSheet.id,
        questionId: a.questionId,
        optionId: a.optionId || null,
        content: a.content || null,
        score: a.score || 0,
      }),
    );
    await this.answerRepo.save(answerEntities);

    return savedSheet;
  }

  /**
   * 获取答卷列表
   */
  async getAnswerSheets(questionnaireId: number) {
    return this.answerSheetRepo.find({
      where: { questionnaireId },
      order: { submitTime: 'DESC' },
    });
  }

  /**
   * 获取答卷详情
   */
  async getAnswerSheetDetail(id: number) {
    const answerSheet = await this.answerSheetRepo.findOne({
      where: { id },
    });
    if (!answerSheet) {
      throw new NotFoundException('答卷不存在');
    }

    const answers = await this.answerRepo.find({
      where: { answerSheetId: id },
    });

    return {
      ...answerSheet,
      answers,
    };
  }

  /**
   * 更新问题排序
   */
  async updateQuestionSort(id: number, sort: number) {
    await this.questionRepo.update(id, { sort });
    return { success: true };
  }

  /**
   * 删除问题
   */
  async deleteQuestion(id: number) {
    await this.optionRepo.delete({ questionId: id });
    await this.questionRepo.delete({ id });
  }

  /**
   * 根据问题ID获取选项列表
   */
  async getOptionsByQuestionId(questionId: number) {
    return this.optionRepo.find({
      where: { questionId },
      order: { sort: 'ASC' },
    });
  }

  /**
   * 删除答卷
   */
  async deleteAnswerSheet(id: number) {
    await this.answerRepo.delete({ answerSheetId: id });
    await this.answerSheetRepo.delete({ id });
  }

  /**
   * 根据答卷ID获取答案列表
   */
  async getAnswersBySheetId(answerSheetId: number) {
    return this.answerRepo.find({
      where: { answerSheetId },
    });
  }

  /**
   * 根据问题ID获取答案列表
   */
  async getAnswersByQuestionId(questionId: number) {
    return this.answerRepo.find({
      where: { questionId },
    });
  }
}
