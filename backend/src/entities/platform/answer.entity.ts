import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AnswerSheet } from './answer-sheet.entity';

/**
 * 答案实体
 */
@Entity({ schema: 'base', name: 'tsys_answer' })
export class Answer {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'answer_sheet_id', comment: '答卷ID' })
  answerSheetId: number;

  @ManyToOne(() => AnswerSheet, (answerSheet) => answerSheet.answers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'answer_sheet_id' })
  answerSheet: AnswerSheet;

  @Column({ type: 'int', name: 'question_id', comment: '问题ID' })
  questionId: number;

  @Column({ type: 'int', nullable: true, name: 'option_id', comment: '选项ID(单选/多选时有值，填空题为null)' })
  optionId: number | null;

  @Column({ type: 'text', nullable: true, name: 'content', comment: '填空题答案内容' })
  content: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, name: 'score', comment: '得分' })
  score: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', comment: '更新时间' })
  updatedAt: Date;
}
