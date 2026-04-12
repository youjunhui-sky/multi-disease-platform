import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Questionnaire } from './questionnaire.entity';
import { Option } from './option.entity';

/**
 * 问题实体
 */
@Entity({ schema: 'base', name: 'tsys_question' })
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'int', name: 'questionnaire_id', comment: '所属问卷ID' })
  questionnaireId: number;

  @ManyToOne(() => Questionnaire, (questionnaire) => questionnaire.questions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questionnaire_id' })
  questionnaire: Questionnaire;

  @Column({ type: 'varchar', length: 500, comment: '问题标题' })
  title: string;

  @Column({ type: 'varchar', length: 20, comment: '问题类型(single单选，multi多选，text填空)' })
  type: string;

  @Column({ type: 'int', default: 0, name: 'sort', comment: '排序' })
  sort: number;

  @Column({ type: 'boolean', default: false, name: 'required', comment: '是否必填' })
  required: boolean;

  @Column({ type: 'text', nullable: true, name: 'jump', comment: '跳转逻辑' })
  jump: string | null;

  @Column({ type: 'varchar', length: 50, name: 'bh', comment: '编号' })
  bh: string;


  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', comment: '更新时间' })
  updatedAt: Date;

  @OneToMany(() => Option, (option) => option.question)
  options: Option[];
}
