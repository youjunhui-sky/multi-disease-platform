import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Question } from './question.entity';

/**
 * 选项实体
 */
@Entity({ schema: 'base', name: 'tsys_option' })
export class Option {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'questionnaire_id', comment: '所属问卷ID' })
  questionnaireId: number;

  @Column({ type: 'int', name: 'question_id', comment: '所属问题ID' })
  questionId: number;

  @ManyToOne(() => Question, (question) => question.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'question_id' })
  question: Question;

  @Column({ type: 'varchar', length: 255, name: 'content', comment: '选项内容' })
  content: string;

  @Column({ type: 'int', default: 0, name: 'sort', comment: '排序' })
  sort: number;

  @Column({ type: 'int', nullable: true, name: 'score', comment: '选项分值' })
  score: number | null;

  @Column({ type: 'varchar', length: 50, name: 'bh', comment: '编号' })
  bh: string;

  @Column({ type: 'boolean', default: false, name: 'other', comment: '其他' })
  other: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', comment: '更新时间' })
  updatedAt: Date;
}
