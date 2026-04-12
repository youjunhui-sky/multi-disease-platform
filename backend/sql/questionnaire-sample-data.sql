-- 问卷管理示例数据

-- 示例问卷数据（患者满意度调查问卷）
INSERT INTO base.tsys_questionnaire (id, title, description, creator_id, published, sort) VALUES
(1, '患者满意度调查问卷', '请花费2分钟时间填写以下问卷，帮助我们改进服务质量', 1, true, 1),
(2, '医护人员工作体验调查', '关于我们医务人员工作环境和压力的匿名调查', 1, false, 2)
ON CONFLICT (id) DO NOTHING;

-- 示例问题数据（针对问卷1）
INSERT INTO base.tsys_question (id, questionnaire_id, title, type, sort, required, bh) VALUES
(1, 1, '您对本次就医的整体满意度如何？', 'single', 1, true, 'Q001'),
(2, 1, '您在挂号时的等待时间是多久？', 'single', 2, true, 'Q002'),
(3, 1, '医生解释病情的方式是否清晰易懂？', 'single', 3, true, 'Q003'),
(4, 1, '您对医院的哪些方面满意？（多选）', 'multi', 4, false, 'Q004'),
(5, 1, '您对医院的改进建议', 'text', 5, false, 'Q005')
ON CONFLICT (id) DO NOTHING;

-- 示例选项数据
INSERT INTO base.tsys_option (id, questionnaire_id, question_id, content, sort, score, bh) VALUES
-- Q001选项
(1, 1, 1, '非常满意', 1, 5, 'Q001A'),
(2, 1, 1, '满意', 2, 4, 'Q001B'),
(3, 1, 1, '一般', 3, 3, 'Q001C'),
(4, 1, 1, '不满意', 4, 2, 'Q001D'),
(5, 1, 1, '非常不满意', 5, 1, 'Q001E'),
-- Q002选项
(6, 1, 2, '10分钟以内', 1, 5, 'Q002A'),
(7, 1, 2, '10-30分钟', 2, 4, 'Q002B'),
(8, 1, 2, '30-60分钟', 3, 3, 'Q002C'),
(9, 1, 2, '60分钟以上', 4, 2, 'Q002D'),
-- Q003选项
(10, 1, 3, '非常清晰', 1, 5, 'Q003A'),
(11, 1, 3, '比较清晰', 2, 4, 'Q003B'),
(12, 1, 3, '一般', 3, 3, 'Q003C'),
(13, 1, 3, '不太清晰', 4, 2, 'Q003D'),
(14, 1, 3, '很不清晰', 5, 1, 'Q003E'),
-- Q004选项
(15, 1, 4, '医疗技术', 1, 0, 'Q004A'),
(16, 1, 4, '服务态度', 2, 0, 'Q004B'),
(17, 1, 4, '就医环境', 3, 0, 'Q004C'),
(18, 1, 4, '等待时间', 4, 0, 'Q004D'),
(19, 1, 4, '其他', 5, 0, 'Q004E')
ON CONFLICT (id) DO NOTHING;

-- 示例答卷数据
INSERT INTO base.tsys_answer_sheet (id, questionnaire_id, user_id, submit_time) VALUES
(1, 1, 1, NOW() - INTERVAL '1 day'),
(2, 1, 2, NOW() - INTERVAL '2 hours'),
(3, 1, NULL, NOW() - INTERVAL '1 hour')
ON CONFLICT (id) DO NOTHING;

-- 示例答案数据
INSERT INTO base.tsys_answer (id, answer_sheet_id, question_id, option_id, score) VALUES
-- 答卷1的答案
(1, 1, 1, 1, 5.00),
(2, 1, 2, 2, 4.00),
(3, 1, 3, 1, 5.00),
(4, 1, 4, 15, 0),
(5, 1, 4, 16, 0),
-- 答卷2的答案
(6, 2, 1, 2, 4.00),
(7, 2, 2, 3, 3.00),
(8, 2, 3, 10, 5.00),
(9, 2, 4, 15, 0),
-- 答卷3的答案（匿名）
(10, 3, 1, 1, 5.00),
(11, 3, 2, 1, 5.00),
(12, 3, 3, 10, 5.00),
(13, 3, 4, 15, 0),
(14, 3, 4, 17, 0),
(15, 3, 5, NULL, 0)
ON CONFLICT (id) DO NOTHING;