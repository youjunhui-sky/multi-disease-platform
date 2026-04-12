import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Answer } from './answer.entity';

/**
 * 答卷实体
 */
@Entity({ schema: 'base', name: 'tsys_answer_sheet' })
export class AnswerSheet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'questionnaire_id', comment: '问卷ID' })
  questionnaireId: number;

  @Column({ type: 'int', nullable: true, name: 'user_id', comment: '答题人ID(匿名则为null)' })
  userId: number | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', name: 'submit_time', comment: '提交时间' })
  submitTime: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', comment: '更新时间' })
  updatedAt: Date;

  @OneToMany(() => Answer, (answer) => answer.answerSheet)
  answers: Answer[];
}
