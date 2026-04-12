import { IsString, IsNumber, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 选项 DTO
 */
export class OptionDto {
  @IsString()
  @IsOptional()
  bh?: string;

  @IsString()
  content: string;

  @IsNumber()
  @IsOptional()
  score?: number;

  @IsBoolean()
  @IsOptional()
  other?: boolean;
}

/**
 * 问题 DTO
 */
export class QuestionDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  type: string;

  @IsString()
  title: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionDto)
  @IsOptional()
  options?: OptionDto[];

  @IsBoolean()
  @IsOptional()
  required?: boolean;

  @IsOptional()
  jump?: any;

  @IsString()
  bh: string;

  @IsNumber()
  @IsOptional()
  questionnaireId?: number;

  @IsNumber()
  @IsOptional()
  sort?: number;
}

/**
 * 保存问卷 DTO
 */
export class CreateQuestionnaireDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  creatorId?: number;

  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @IsNumber()
  @IsOptional()
  sort?: number;
}

/**
 * 更新问卷 DTO
 */
export class UpdateQuestionnaireDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  published?: boolean;

  @IsNumber()
  @IsOptional()
  sort?: number;
}

/**
 * 查询问卷 DTO
 */
export class QueryQuestionnaireDto {
  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  pageSize?: number;

  @IsString()
  @IsOptional()
  keyword?: string;
}

/**
 * 保存问题 DTO
 */
export class SaveQuestionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];
}

/**
 * 提交答卷 DTO
 */
export class SubmitAnswerDto {
  @IsNumber()
  questionnaireId: number;

  @IsNumber()
  @IsOptional()
  userId?: number;

  @IsArray()
  answers: {
    questionId: number;
    optionId?: number;
    content?: string;
    score?: number;
  }[];
}
