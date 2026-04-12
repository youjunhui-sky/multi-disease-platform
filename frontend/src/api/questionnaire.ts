import { request } from './request'

interface Questionnaire {
  id: number
  title: string
  description: string | null
  creatorId: number | null
  published: boolean
  sort: number
  deletedAt: Date | null
  createdAt: string
  updatedAt: string
}

interface Question {
  id: string
  questionnaireId: number
  title: string
  type: string
  sort: number
  required: boolean
  jump: string | null
  bh: string
  options: Option[]
}

interface Option {
  id: number
  bh: string
  content: string
  score: number | null
  other: boolean
}

interface PageResult<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

export const questionnaireApi = {
  /**
   * 获取问卷列表
   */
  getList(params?: { page?: number; pageSize?: number; keyword?: string }) {
    return request.get<PageResult<Questionnaire>>('/questionnaire', params)
  },

  /**
   * 获取问卷详情
   */
  getById(id: number) {
    return request.get<Questionnaire>(`/questionnaire/${id}`)
  },

  /**
   * 获取问卷详情（含问题和选项）
   */
  getDetail(id: number) {
    return request.get<any>(`/questionnaire/${id}/detail`)
  },

  /**
   * 获取问卷的问题和选项
   */
  getQuestions(id: number) {
    return request.get<Question[]>(`/questionnaire/${id}/questions`)
  },

  /**
   * 创建问卷
   */
  create(data: { title: string; description?: string; sort?: number }) {
    return request.post<Questionnaire>('/questionnaire', data)
  },

  /**
   * 更新问卷
   */
  update(id: number, data: { title?: string; description?: string; sort?: number; published?: boolean }) {
    return request.put<Questionnaire>(`/questionnaire/${id}`, data)
  },

  /**
   * 删除问卷
   */
  delete(id: number) {
    return request.delete(`/questionnaire/${id}`)
  },

  /**
   * 发布问卷
   */
  publish(id: number) {
    return request.post(`/questionnaire/${id}/publish`)
  },

  /**
   * 取消发布问卷
   */
  unpublish(id: number) {
    return request.post(`/questionnaire/${id}/unpublish`)
  },

  /**
   * 保存问题（含选项）
   */
  saveQuestions(questions: any[]) {
    return request.post('/questionnaire/questions/save', { questions })
  },

  /**
   * 新增问题
   */
  addQuestion(data: any) {
    return request.post('/questionnaire/questions', data)
  },

  /**
   * 更新问题
   */
  updateQuestion(id: number, data: any) {
    return request.put(`/questionnaire/questions/${id}`, data)
  },

  /**
   * 删除问题
   */
  deleteQuestionById(id: number) {
    return request.delete(`/questionnaire/questions/delete/${id}`)
  },

  /**
   * 更新问题排序
   */
  updateQuestionSort(id: number, sort: number) {
    return request.post('/questionnaire/questions/update-sort', { id, sort })
  },

  /**
   * 删除问题
   */
  deleteQuestion(id: number) {
    return request.delete(`/questionnaire/questions/${id}`)
  },

  /**
   * 提交答卷
   */
  submitAnswer(data: { questionnaireId: number; userId?: number; answers: any[] }) {
    return request.post('/questionnaire/answer/submit', data)
  },

  /**
   * 获取答卷列表
   */
  getAnswers(questionnaireId: number) {
    return request.get<any[]>(`/questionnaire/${questionnaireId}/answers`)
  },

  /**
   * 获取答卷详情
   */
  getAnswerDetail(id: number) {
    return request.get<any>(`/questionnaire/answer/${id}`)
  }
}
