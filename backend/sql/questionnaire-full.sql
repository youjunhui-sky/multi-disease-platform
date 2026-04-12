-- =====================================================
-- 问卷管理相关表结构及示例数据（PostgreSQL版本）
-- =====================================================

-- 1. 问卷表
CREATE TABLE IF NOT EXISTS base.tsys_questionnaire (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    creator_id INT,
    published BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP,
    sort INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE base.tsys_questionnaire IS '问卷表';
COMMENT ON COLUMN base.tsys_questionnaire.title IS '问卷标题';
COMMENT ON COLUMN base.tsys_questionnaire.description IS '问卷描述';
COMMENT ON COLUMN base.tsys_questionnaire.creator_id IS '创建人ID';
COMMENT ON COLUMN base.tsys_questionnaire.published IS '是否发布';
COMMENT ON COLUMN base.tsys_questionnaire.deleted_at IS '删除时间';
COMMENT ON COLUMN base.tsys_questionnaire.sort IS '排序';
COMMENT ON COLUMN base.tsys_questionnaire.created_at IS '创建时间';
COMMENT ON COLUMN base.tsys_questionnaire.updated_at IS '更新时间';

-- 2. 问题表
CREATE TABLE IF NOT EXISTS base.tsys_question (
    id SERIAL PRIMARY KEY,
    questionnaire_id INT NOT NULL,
    title VARCHAR(500) NOT NULL,
    type VARCHAR(20) NOT NULL,
    sort INT DEFAULT 0,
    required BOOLEAN DEFAULT false,
    jump TEXT,
    bh VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_questionnaire FOREIGN KEY (questionnaire_id) REFERENCES base.tsys_questionnaire(id) ON DELETE CASCADE
);

COMMENT ON TABLE base.tsys_question IS '问题表';
COMMENT ON COLUMN base.tsys_question.questionnaire_id IS '所属问卷ID';
COMMENT ON COLUMN base.tsys_question.title IS '问题标题';
COMMENT ON COLUMN base.tsys_question.type IS '问题类型(single单选，multi多选，text填空)';
COMMENT ON COLUMN base.tsys_question.sort IS '排序';
COMMENT ON COLUMN base.tsys_question.required IS '是否必填';
COMMENT ON COLUMN base.tsys_question.jump IS '跳转逻辑';
COMMENT ON COLUMN base.tsys_question.bh IS '编号';

-- 3. 选项表
CREATE TABLE IF NOT EXISTS base.tsys_option (
    id SERIAL PRIMARY KEY,
    questionnaire_id INT NOT NULL,
    question_id INT NOT NULL,
    content VARCHAR(255) NOT NULL,
    sort INT DEFAULT 0,
    score INT,
    bh VARCHAR(50) NOT NULL,
    other BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_option_question FOREIGN KEY (question_id) REFERENCES base.tsys_question(id) ON DELETE CASCADE
);

COMMENT ON TABLE base.tsys_option IS '选项表';
COMMENT ON COLUMN base.tsys_option.questionnaire_id IS '所属问卷ID';
COMMENT ON COLUMN base.tsys_option.question_id IS '所属问题ID';
COMMENT ON COLUMN base.tsys_option.content IS '选项内容';
COMMENT ON COLUMN base.tsys_option.sort IS '排序';
COMMENT ON COLUMN base.tsys_option.score IS '选项分值';
COMMENT ON COLUMN base.tsys_option.bh IS '编号';
COMMENT ON COLUMN base.tsys_option.other IS '其他';

-- 4. 答卷表
CREATE TABLE IF NOT EXISTS base.tsys_answer_sheet (
    id SERIAL PRIMARY KEY,
    questionnaire_id INT NOT NULL,
    user_id INT,
    submit_time TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE base.tsys_answer_sheet IS '答卷表';
COMMENT ON COLUMN base.tsys_answer_sheet.questionnaire_id IS '问卷ID';
COMMENT ON COLUMN base.tsys_answer_sheet.user_id IS '答题人ID(匿名则为null)';
COMMENT ON COLUMN base.tsys_answer_sheet.submit_time IS '提交时间';

-- 5. 答案表
CREATE TABLE IF NOT EXISTS base.tsys_answer (
    id SERIAL PRIMARY KEY,
    answer_sheet_id INT NOT NULL,
    question_id INT NOT NULL,
    option_id INT,
    content TEXT,
    score DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_answer_sheet FOREIGN KEY (answer_sheet_id) REFERENCES base.tsys_answer_sheet(id) ON DELETE CASCADE
);

COMMENT ON TABLE base.tsys_answer IS '答案表';
COMMENT ON COLUMN base.tsys_answer.answer_sheet_id IS '答卷ID';
COMMENT ON COLUMN base.tsys_answer.question_id IS '问题ID';
COMMENT ON COLUMN base.tsys_answer.option_id IS '选项ID(单选/多选时有值，填空题为null)';
COMMENT ON COLUMN base.tsys_answer.content IS '填空题答案内容';
COMMENT ON COLUMN base.tsys_answer.score IS '得分';

-- =====================================================
-- 示例数据
-- =====================================================

-- 示例问卷数据
INSERT INTO base.tsys_questionnaire (id, title, description, creator_id, published, sort) VALUES
(1, '患者满意度调查问卷', '请花费2分钟时间填写以下问卷，帮助我们改进服务质量', 1, true, 1),
(2, '医护人员工作体验调查', '关于我们医务人员工作环境和压力的匿名调查', 1, false, 2);

-- 示例问题数据
INSERT INTO base.tsys_question (id, questionnaire_id, title, type, sort, required, bh) VALUES
(1, 1, '您对本次就医的整体满意度如何？', 'single', 1, true, 'Q001'),
(2, 1, '您在挂号时的等待时间是多久？', 'single', 2, true, 'Q002'),
(3, 1, '医生解释病情的方式是否清晰易懂？', 'single', 3, true, 'Q003'),
(4, 1, '您对医院的哪些方面满意？（多选）', 'multi', 4, false, 'Q004'),
(5, 1, '您对医院的改进建议', 'text', 5, false, 'Q005');

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
(19, 1, 4, '其他', 5, 0, 'Q004E');

-- 示例答卷数据
INSERT INTO base.tsys_answer_sheet (id, questionnaire_id, user_id, submit_time) VALUES
(1, 1, 1, NOW() - INTERVAL '1 day'),
(2, 1, 2, NOW() - INTERVAL '2 hours'),
(3, 1, NULL, NOW() - INTERVAL '1 hour');

-- 示例答案数据
INSERT INTO base.tsys_answer (id, answer_sheet_id, question_id, option_id, score) VALUES
-- 答卷1
(1, 1, 1, 1, 5.00),
(2, 1, 2, 2, 4.00),
(3, 1, 3, 1, 5.00),
(4, 1, 4, 15, 0),
(5, 1, 4, 16, 0),
-- 答卷2
(6, 2, 1, 2, 4.00),
(7, 2, 2, 3, 3.00),
(8, 2, 3, 10, 5.00),
(9, 2, 4, 15, 0),
-- 答卷3（匿名）
(10, 3, 1, 1, 5.00),
(11, 3, 2, 1, 5.00),
(12, 3, 3, 10, 5.00),
(13, 3, 4, 15, 0),
(14, 3, 4, 17, 0),
(15, 3, 5, NULL, 0);