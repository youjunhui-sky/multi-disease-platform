<template>
	<el-dialog
		v-model="dialogVisible"
		title="问卷预览"
		width="600px"
		:close-on-click-modal="false"
		class="preview-dialog"
		:append-to-body="true"
		@update:model-value="handleClose"
	>
		<el-form v-if="questions.length > 0" label-width="100px">
			<div v-for="q in questions" :key="q.id" class="preview-question-block">
				<div class="preview-question-title">
					<span class="q-index">{{ q.bh }}.</span>
					<span class="q-label">{{ q.title || '未命名题目' }}</span>
					<span class="q-type">【{{ typeLabel(q) }}】</span>
					<span v-if="q.required" class="q-required">*</span>
				</div>
				<el-form-item>
					<!-- 单选题 -->
					<div v-if="q.type === 'single'" class="preview-option-list">
						<div v-for="opt in q.options" :key="opt.bh" class="preview-option-item">
							<el-radio :label="opt.bh" disabled>{{ opt.content }}</el-radio>
							<!-- 其他选项输入框 -->
							<el-input
								v-if="opt.other"
								v-model="otherAnswers[`${q.id}_${opt.bh}`]"
								placeholder="请输入其他内容"
								size="small"
								style="margin-left: 12px; width: 200px"
								@click.stop
							/>
						</div>
					</div>
					<!-- 多选题 -->
					<div v-else-if="q.type === 'multiple'" class="preview-option-list">
						<div v-for="opt in q.options" :key="opt.bh" class="preview-option-item">
							<el-checkbox :label="opt.bh" disabled>{{ opt.content }}</el-checkbox>
							<!-- 其他选项输入框 -->
							<el-input
								v-if="opt.other"
								v-model="otherAnswers[`${q.id}_${opt.bh}`]"
								placeholder="请输入其他内容"
								size="small"
								style="margin-left: 12px; width: 200px"
								@click.stop
							/>
						</div>
					</div>
					<!-- 数字填空 -->
					<el-input
						v-else-if="q.type === 'number'"
						:placeholder="q.placeholder || '请输入数字'"
						type="number"
						disabled
						class="text-input"
					/>
					<!-- 小文本填空 -->
					<el-input
						v-else-if="q.type === 'text'"
						:placeholder="q.placeholder || '请输入内容'"
						type="text"
						disabled
						class="text-input"
					/>
					<!-- 大文本填空 -->
					<el-input
						v-else-if="q.type === 'textarea'"
						:placeholder="q.placeholder || '请输入内容'"
						type="textarea"
						:rows="4"
						disabled
						class="text-input"
					/>
				</el-form-item>
			</div>
		</el-form>
		<div v-else style="color: #aaa; padding: 32px; text-align: center">暂无题目</div>
	</el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';

/**
 * 组件 Props
 */
interface Props {
	modelValue: boolean;
	questions: any[];
}

const props = defineProps<Props>();

/**
 * 组件 Emits
 */
const emit = defineEmits<{
	'update:modelValue': [value: boolean];
}>();

/**
 * 对话框显示状态
 */
const dialogVisible = computed({
	get() {
		return props.modelValue;
	},
	set(value) {
		emit('update:modelValue', value);
	}
});

/**
 * 存储"其他"选项的自定义内容
 */
const otherAnswers = reactive<{ [key: string]: string }>({});

/**
 * 获取题目类型标签
 */
function typeLabel(question: any) {
	const typeMap: { [key: string]: string } = {
		single: '单选题',
		multiple: '多选题',
		text: '填空题',
		textarea: '文本题',
		number: '数字题',
		'year-month': '年月',
		date: '年月日',
		datetime: '年月日时分秒'
	};
	return typeMap[question.type] || '未知类型';
}

/**
 * 处理对话框关闭
 */
function handleClose(value: boolean) {
	if (!value) {
		// 清空"其他"选项的输入内容
		Object.keys(otherAnswers).forEach(key => {
			delete otherAnswers[key];
		});
	}
}
</script>

<style scoped>
/* 由于对话框是 append-to-body，需要添加全局样式 */
/* 预览弹框样式 */
.preview-question-block {
	margin-bottom: 24px;
	padding: 16px;
	border: 1px solid #e4e7ed;
	border-radius: 8px;
	background: #fafafa;
}

.preview-question-title {
	margin-bottom: 16px;
	font-size: 16px;
	font-weight: 500;
	color: #333;
}

.q-index {
	color: #409eff;
	font-weight: bold;
	margin-right: 8px;
}

.q-label {
	margin-right: 8px;
}

.q-type {
	color: #666;
	font-size: 14px;
	margin-right: 8px;
}

.q-required {
	color: #f56c6c;
	font-weight: bold;
}

.text-input {
	width: 100%;
}

.preview-option-list {
	display: flex;
	flex-direction: column;
	gap: 8px;
}

.preview-option-item {
	display: flex;
	align-items: center;
	padding: 8px 12px;
	border-radius: 6px;
	background: #fff;
}

/* 预览对话框固定高度和滚动条 */
:deep(.preview-dialog) {
	.el-dialog {
		display: flex !important;
		flex-direction: column !important;
		max-height: 80vh !important;
	}

	.el-dialog__header {
		flex-shrink: 0 !important;
		padding: 20px 20px 10px !important;
	}

	.el-dialog__body {
		flex: 1 !important;
		padding: 20px !important;
		height: 600px !important;
		max-height: 600px !important;
		overflow-y: auto !important;
		overflow-x: hidden !important;
		min-height: 0 !important;
	}

	.el-dialog__footer {
		flex-shrink: 0 !important;
	}
}
</style>

<style>
/* 全局样式：预览对话框 - 因为 dialog 是 append-to-body 的 */
body .preview-dialog .el-dialog {
	display: flex !important;
	flex-direction: column !important;
	max-height: 80vh !important;
}

body .preview-dialog .el-dialog__header {
	flex-shrink: 0 !important;
	padding: 20px 20px 10px !important;
}

body .preview-dialog .el-dialog__body {
	flex: 1 !important;
	padding: 20px !important;
	height: 600px !important;
	max-height: 600px !important;
	overflow-y: auto !important;
	overflow-x: hidden !important;
	min-height: 0 !important;
}

body .preview-dialog .el-dialog__footer {
	flex-shrink: 0 !important;
}
</style>
