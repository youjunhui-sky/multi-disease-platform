import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Question } from './question.entity';

/**
 * 问卷实体
 */
@Entity({ schema: 'base', name: 'tsys_questionnaire' })
export class Questionnaire {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255, comment: '问卷标题' })
  title: string;

  @Column({ type: 'text', nullable: true, comment: '问卷描述' })
  description: string;

  @Column({ type: 'int', nullable: true, name: 'creator_id', comment: '创建人ID' })
  creatorId: number | null;

  @Column({ type: 'uuid', nullable: true, name: 'org_id', comment: '机构ID' })
  orgId: string | null;

  @Column({ type: 'boolean', default: false, name: 'published', comment: '是否发布' })
  published: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'deleted_at', comment: '删除时间' })
  deletedAt: Date | null;

  @Column({ type: 'int', default: 0, name: 'sort', comment: '排序' })
  sort: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz', comment: '更新时间' })
  updatedAt: Date;

  @OneToMany(() => Question, (question) => question.questionnaire)
  questions: Question[];
}
