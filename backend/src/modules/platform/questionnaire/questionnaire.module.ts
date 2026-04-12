import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionnaireController } from './questionnaire.controller';
import { QuestionController } from './question.controller';
import { OptionController } from './option.controller';
import { QuestionnaireService } from './questionnaire.service';
import { QuestionService } from './question.service';
import { Questionnaire } from '../../../entities/platform/questionnaire.entity';
import { Question } from '../../../entities/platform/question.entity';
import { Option } from '../../../entities/platform/option.entity';
import { AnswerSheet } from '../../../entities/platform/answer-sheet.entity';
import { Answer } from '../../../entities/platform/answer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Questionnaire, Question, Option, AnswerSheet, Answer]),
  ],
  controllers: [QuestionnaireController, QuestionController, OptionController],
  providers: [QuestionnaireService, QuestionService],
  exports: [QuestionnaireService, QuestionService],
})
export class QuestionnaireModule {}
