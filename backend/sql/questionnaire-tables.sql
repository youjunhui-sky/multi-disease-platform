-- 问卷管理相关表结构

-- 1. 问卷表
CREATE TABLE IF NOT EXISTS base.tsys_questionnaire (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL COMMENT '问卷标题',
    description TEXT COMMENT '问卷描述',
    creator_id INT COMMENT '创建人ID',
    published BOOLEAN DEFAULT false COMMENT '是否发布',
    deleted_at TIMESTAMP COMMENT '删除时间',
    sort INT DEFAULT 0 COMMENT '排序',
    created_at TIMESTAMPTZ DEFAULT NOW() COMMENT '创建时间',
    updated_at TIMESTAMPTZ DEFAULT NOW() COMMENT '更新时间'
);

COMMENT ON TABLE base.tsys_questionnaire IS '问卷表';

-- 2. 问题表
CREATE TABLE IF NOT EXISTS base.tsys_question (
    id SERIAL PRIMARY KEY,
    questionnaire_id INT NOT NULL COMMENT '所属问卷ID',
    title VARCHAR(500) NOT NULL COMMENT '问题标题',
    type VARCHAR(20) NOT NULL COMMENT '问题类型(single单选，multi多选，text填空)',
    sort INT DEFAULT 0 COMMENT '排序',
    required BOOLEAN DEFAULT false COMMENT '是否必填',
    jump TEXT COMMENT '跳转逻辑',
    bh VARCHAR(50) NOT NULL COMMENT '编号',
    created_at TIMESTAMPTZ DEFAULT NOW() COMMENT '创建时间',
    updated_at TIMESTAMPTZ DEFAULT NOW() COMMENT '更新时间',
    CONSTRAINT fk_question_questionnaire FOREIGN KEY (questionnaire_id) REFERENCES base.tsys_questionnaire(id) ON DELETE CASCADE
);

COMMENT ON TABLE base.tsys_question IS '问题表';

-- 3. 选项表
CREATE TABLE IF NOT EXISTS base.tsys_option (
    id SERIAL PRIMARY KEY,
    questionnaire_id INT NOT NULL COMMENT '所属问卷ID',
    question_id INT NOT NULL COMMENT '所属问题ID',
    content VARCHAR(255) NOT NULL COMMENT '选项内容',
    sort INT DEFAULT 0 COMMENT '排序',
    score INT COMMENT '选项分值',
    bh VARCHAR(50) NOT NULL COMMENT '编号',
    other BOOLEAN DEFAULT false COMMENT '其他',
    created_at TIMESTAMPTZ DEFAULT NOW() COMMENT '创建时间',
    updated_at TIMESTAMPTZ DEFAULT NOW() COMMENT '更新时间',
    CONSTRAINT fk_option_question FOREIGN KEY (question_id) REFERENCES base.tsys_question(id) ON DELETE CASCADE
);

COMMENT ON TABLE base.tsys_option IS '选项表';

-- 4. 答卷表
CREATE TABLE IF NOT EXISTS base.tsys_answer_sheet (
    id SERIAL PRIMARY KEY,
    questionnaire_id INT NOT NULL COMMENT '问卷ID',
    user_id INT COMMENT '答题人ID(匿名则为null)',
    submit_time TIMESTAMP DEFAULT NOW() COMMENT '提交时间',
    created_at TIMESTAMPTZ DEFAULT NOW() COMMENT '创建时间',
    updated_at TIMESTAMPTZ DEFAULT NOW() COMMENT '更新时间'
);

COMMENT ON TABLE base.tsys_answer_sheet IS '答卷表';

-- 5. 答案表
CREATE TABLE IF NOT EXISTS base.tsys_answer (
    id SERIAL PRIMARY KEY,
    answer_sheet_id INT NOT NULL COMMENT '答卷ID',
    question_id INT NOT NULL COMMENT '问题ID',
    option_id INT COMMENT '选项ID(单选/多选时有值，填空题为null)',
    content TEXT COMMENT '填空题答案内容',
    score DECIMAL(5,2) COMMENT '得分',
    created_at TIMESTAMPTZ DEFAULT NOW() COMMENT '创建时间',
    updated_at TIMESTAMPTZ DEFAULT NOW() COMMENT '更新时间',
    CONSTRAINT fk_answer_sheet FOREIGN KEY (answer_sheet_id) REFERENCES base.tsys_answer_sheet(id) ON DELETE CASCADE
);

COMMENT ON TABLE base.tsys_answer IS '答案表';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_questionnaire_id ON base.tsys_question(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_question_bh ON base.tsys_question(bh);
CREATE INDEX IF NOT EXISTS idx_option_question ON base.tsys_option(question_id);
CREATE INDEX IF NOT EXISTS idx_answer_sheet ON base.tsys_answer_sheet(questionnaire_id);
CREATE INDEX IF NOT EXISTS idx_answer_question ON base.tsys_answer(question_id);