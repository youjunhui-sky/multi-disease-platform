<template>
	<div class="survey-xing scrollable">
		<div style="display: flex; justify-content: flex-end; margin-bottom: 8px">
			<el-button type="primary" size="small" @click="showPreview = true">预览答题</el-button>
		</div>
		<div class="survey-progress">
			<span>共{{ questions.length }}题</span>
			<el-progress
				:percentage="Math.round(((currentIndex + 1) / questions.length) * 100)"
				:show-text="false"
				height="8"
				color="#409eff"
				style="width: 60%; margin-left: 16px"
			/>
		</div>
		<el-form :model="answers" ref="formRef" label-width="0">
			<div
				v-for="q in visibleQuestions"
				:key="q.id"
				class="question-block"
				:class="{ required: q.required }"
			>
				<div class="question-title">
					<span class="q-index">{{ currentIndex + 1 }}.</span>
					<span class="q-label">{{ q.title }}</span>
					<span class="q-type">【{{ typeLabel(q.type) }}】</span>
					<span v-if="q.required" class="q-required">*</span>
				</div>
				<!-- 单选题 -->
				<div v-if="q.type === 'single'" class="option-list">
					<div
						v-for="opt in normalizedOptions(q.options)"
						:key="getOptionKey(opt)"
						class="option-item"
						:class="{
							active: isSingleSelected(q, opt)
						}"
					>
						<el-radio
							:model-value="getSingleAnswer(q.id)"
							:label="getOptionValue(opt)"
							@click="onSingleSelect(q, opt)"
						>
							{{ getOptionLabel(opt) }}
						</el-radio>
						<!-- 其他选项输入框 -->
						<el-input
							v-if="isOtherOption(opt)"
							v-model="otherAnswers[`${q.id}_${getOptionKey(opt)}`]"
							placeholder="请输入其他内容"
							size="small"
							style="margin-left: 12px; width: 200px"
							@input="onOtherInput(q.id, opt)"
							@click.stop
						/>
					</div>
				</div>
				<!-- 多选题 -->
				<div v-else-if="q.type === 'multiple'" class="option-list">
					<div
						v-for="opt in normalizedOptions(q.options)"
						:key="getOptionKey(opt)"
						class="option-item"
						:class="{
							active: isMultiSelected(q, opt)
						}"
					>
						<el-checkbox
							:model-value="isMultiSelected(q, opt)"
							:label="getOptionValue(opt)"
							@click="toggleMulti(q.id, opt)"
						>
							{{ getOptionLabel(opt) }}
						</el-checkbox>
						<!-- 其他选项输入框 -->
						<el-input
							v-if="isOtherOption(opt)"
							v-model="otherAnswers[`${q.id}_${getOptionKey(opt)}`]"
							placeholder="请输入其他内容"
							size="small"
							style="margin-left: 12px; width: 200px"
							@input="onOtherInput(q.id, opt)"
							@click.stop
						/>
					</div>
				</div>
				<!-- 填空题 -->
				<div v-else-if="q.type === 'text'" class="option-list">
					<el-input
						v-if="q.inputType !== 'textarea'"
						v-model="answers[q.id]"
						:placeholder="q.placeholder || '请输入内容'"
						:type="q.inputType || 'text'"
						class="text-input"
						@input="onInputNumber($event, q)"
					/>
					<el-input
						v-else
						v-model="answers[q.id]"
						:placeholder="q.placeholder || '请输入内容'"
						type="textarea"
						:rows="4"
						class="text-input"
					/>
				</div>
				<!-- 数字填空 -->
				<div v-else-if="q.type === 'number'" class="option-list">
					<el-input
						v-model="answers[q.id]"
						:placeholder="q.placeholder || '请输入数字'"
						type="number"
						class="text-input"
						@input="onInputNumber($event, q)"
					/>
				</div>
				<!-- 大文本填空 -->
				<div v-else-if="q.type === 'textarea'" class="option-list">
					<el-input
						v-model="answers[q.id]"
						:placeholder="q.placeholder || '请输入内容'"
						type="textarea"
						:rows="4"
						class="text-input"
					/>
				</div>
				<!-- 年月 -->
				<div v-else-if="q.type === 'year-month'" class="option-list">
					<el-date-picker
						v-model="answers[q.id]"
						type="month"
						:placeholder="q.placeholder || '请选择年月'"
						class="text-input"
						style="width: 100%"
					/>
				</div>
				<!-- 年月日 -->
				<div v-else-if="q.type === 'date'" class="option-list">
					<el-date-picker
						v-model="answers[q.id]"
						type="date"
						:placeholder="q.placeholder || '请选择日期'"
						class="text-input"
						style="width: 100%"
					/>
				</div>
				<!-- 年月日时分秒 -->
				<div v-else-if="q.type === 'datetime'" class="option-list">
					<el-date-picker
						v-model="answers[q.id]"
						type="datetime"
						:placeholder="q.placeholder || '请选择日期时间'"
						class="text-input"
						style="width: 100%"
					/>
				</div>
			</div>
			<div class="submit-row">
				<el-button v-if="currentIndex > 0" @click="prev" style="margin-right: 16px"
					>上一题</el-button
				>
				<el-button
					v-if="!isLast"
					type="primary"
					@click="next"
					:disabled="!isAnswered(currentQuestion)"
				>
					下一题
				</el-button>
				<el-button
					v-else
					type="primary"
					size="large"
					@click="submit"
					:disabled="!isAnswered(currentQuestion)"
				>
					提交
				</el-button>
			</div>
		</el-form>
		<el-dialog
			v-model="showPreview"
			title="答题预览"
			width="800px"
			:close-on-click-modal="false"
		>
			<div class="preview-content">
				<div
					v-for="(q, idx) in questions"
					:key="q.id"
					class="preview-question-block"
					@click="jumpTo(idx)"
					:class="{ active: idx === currentIndex }"
				>
					<div class="preview-question-title">
						<span class="preview-q-index">{{ idx + 1 }}.</span>
						<span class="preview-q-label">{{ q.title }}</span>
						<span class="preview-q-type">【{{ typeLabel(q.type) }}】</span>
						<span v-if="q.required" class="preview-q-required">*</span>
						<el-tag
							v-if="!isAnswered(q)"
							type="danger"
							size="small"
							style="margin-left: 8px"
							>未填</el-tag
						>
					</div>
					<!-- 单选题预览 -->
					<div v-if="q.type === 'single'" class="preview-option-list">
						<div
							v-for="opt in normalizedOptions(q.options)"
							:key="getOptionKey(opt)"
							class="preview-option-item"
							:class="{ active: isSingleSelected(q, opt) }"
						>
							<el-radio
								:model-value="getSingleAnswer(q.id)"
								:label="getOptionValue(opt)"
								disabled
							>
								{{ getOptionLabel(opt) }}
							</el-radio>
							<!-- 其他选项输入框 -->
							<el-input
								v-if="isOtherOption(opt)"
								v-model="otherAnswers[`${q.id}_${getOptionKey(opt)}`]"
								placeholder="请输入其他内容"
								size="small"
								style="margin-left: 12px; width: 200px"
								@input="onOtherInput(q.id, opt)"
								@click.stop
							/>
						</div>
					</div>
					<!-- 多选题预览 -->
					<div v-else-if="q.type === 'multiple'" class="preview-option-list">
						<div
							v-for="opt in normalizedOptions(q.options)"
							:key="getOptionKey(opt)"
							class="preview-option-item"
							:class="{ active: isMultiSelected(q, opt) }"
						>
							<el-checkbox
								:model-value="isMultiSelected(q, opt)"
								:label="getOptionValue(opt)"
								disabled
							>
								{{ getOptionLabel(opt) }}
							</el-checkbox>
							<!-- 其他选项输入框 -->
							<el-input
								v-if="isOtherOption(opt)"
								v-model="otherAnswers[`${q.id}_${getOptionKey(opt)}`]"
								placeholder="请输入其他内容"
								size="small"
								style="margin-left: 12px; width: 200px"
								@input="onOtherInput(q.id, opt)"
								@click.stop
							/>
						</div>
					</div>
					<!-- 其他题型预览 -->
					<div v-else class="preview-answer">
						<template
							v-if="
								q.type === 'year-month' ||
								q.type === 'date' ||
								q.type === 'datetime'
							"
						>
							{{ answers[q.id] ? formatDateValue(answers[q.id], q.type) : '未填写' }}
						</template>
						<template v-else>
							{{ answers[q.id] || '未填写' }}
						</template>
					</div>
				</div>
			</div>
		</el-dialog>
	</div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue';
import { ElMessage, ElForm } from 'element-plus';
import { questionnaireApi } from '@/api/questionnaire';

interface Props {
  questionnaireId?: number;
  readonly?: boolean;
}

const props = defineProps<Props>();

interface QuestionOption {
	bh: string; // 编号
	content: string; // 内容
	score?: number | null; // 分值
	other?: boolean; // 是否其他选项
}

interface Question {
	id: string;
	type:
		| 'single'
		| 'multiple'
		| 'text'
		| 'number'
		| 'textarea'
		| 'year-month'
		| 'date'
		| 'datetime';
	title: string;
	options?: string[] | QuestionOption[]; // 兼容旧格式（string[]）和新格式（QuestionOption[]）
	required?: boolean;
	placeholder?: string;
	jump?: { [option: string]: number };
	inputType?: 'text' | 'number' | 'textarea'; // 新增
}

// 从API加载问卷题目
const questions = ref<Question[]>([]);

onMounted(async () => {
  if (props.questionnaireId) {
    try {
      const res = await questionnaireApi.getQuestions(props.questionnaireId);
      const data = (res as any).data?.data || [];
      if (data.length > 0) {
        questions.value = data.map((item: any) => ({
          id: item.id?.toString() || '',
          type: item.type,
          title: item.title || '',
          options: item.options || [],
          required: item.required || false,
          placeholder: item.placeholder || '',
          jump: item.jump ? (typeof item.jump === 'string' ? JSON.parse(item.jump) : item.jump) : {},
          bh: item.bh || ''
        }));
      }
    } catch (e) {
      console.error('加载问卷题目失败:', e);
    }
  }
});

// 保持原有的固定数据作为后备
const defaultQuestions: Question[] = [
	{
		id: 'q1',
		type: 'single',
		title: '你喜欢的颜色？',
		options: ['红色', '蓝色', '绿色'],
		required: true,
		jump: { 红色: 1, 蓝色: 2 }
	},
	{
		id: 'q2',
		type: 'multiple',
		title: '你会的编程语言？',
		options: ['JavaScript', 'Python', 'Java', 'C++'],
		required: true,
		jump: { JavaScript: 3 }
	},
	{
		id: 'q3',
		type: 'single',
		title: '你喜欢的运动？',
		options: ['篮球', '足球', '羽毛球', '不喜欢运动'],
		required: true,
		jump: { 不喜欢运动: 4 }
	},
	{
		id: 'q4',
		type: 'text',
		title: '你最喜欢的运动原因？',
		placeholder: '请填写原因',
		inputType: 'text', // 字符填空
		required: false
	},
	{
		id: 'q5',
		type: 'text',
		title: '你每天锻炼多少分钟？',
		placeholder: '请输入数字',
		inputType: 'number', // 数字填空
		required: false
	},
	{
		id: 'q6',
		type: 'text',
		title: '请详细描述你的健康建议',
		placeholder: '请填写详细建议',
		inputType: 'textarea', // 大文本填空
		required: false
	},
	{
		id: 'q7',
		type: 'single',
		title: '你喜欢的饮品？',
		options: ['咖啡', '奶茶', '水', '不喝饮品'],
		required: true
	}
];

// 使用计算属性根据是否有API数据返回题目
const displayQuestions = computed(() => {
	if (questions.value.length > 0) {
		return questions.value;
	}
	return defaultQuestions;
});

const answers = reactive<{ [key: string]: any }>({});
const otherAnswers = reactive<{ [key: string]: string }>({}); // 存储"其他"选项的自定义内容
const formRef = ref<InstanceType<typeof ElForm>>();
const currentIndex = ref(0);
const history = ref<number[]>([]); // 跳转历史
const showPreview = ref(false);

const currentQuestion = computed(() => questions.value[currentIndex.value]);
const isLast = computed(() => currentIndex.value === questions.value.length - 1);

const visibleQuestions = computed(() => [currentQuestion.value]);

function typeLabel(type: string) {
	switch (type) {
		case 'single':
			return '单选题';
		case 'multiple':
			return '多选题';
		case 'text':
			return '填空题';
		case 'number':
			return '数字填空';
		case 'textarea':
			return '大文本填空';
		case 'year-month':
			return '年月';
		case 'date':
			return '年月日';
		case 'datetime':
			return '年月日时分秒';
		default:
			return '';
	}
}

/**
 * 规范化选项格式，兼容旧格式（string[]）和新格式（QuestionOption[]）
 */
function normalizedOptions(options?: string[] | QuestionOption[]): QuestionOption[] {
	if (!options) return [];
	if (options.length === 0) return [];
	// 如果是字符串数组，转换为对象数组
	if (typeof options[0] === 'string') {
		return (options as string[]).map((opt, index) => ({
			bh: String.fromCharCode(65 + index), // A, B, C...
			content: opt,
			other: false
		}));
	}
	return options as QuestionOption[];
}

/**
 * 获取选项的键值（用于 v-for 的 key）
 */
function getOptionKey(opt: QuestionOption | string): string {
	if (typeof opt === 'string') return opt;
	return opt.bh || opt.content;
}

/**
 * 获取选项的标签（显示文本）
 */
function getOptionLabel(opt: QuestionOption | string): string {
	if (typeof opt === 'string') return opt;
	return opt.content;
}

/**
 * 获取选项的值（用于 radio/checkbox 的 label）
 */
function getOptionValue(opt: QuestionOption | string): string {
	if (typeof opt === 'string') return opt;
	return opt.bh || opt.content;
}

/**
 * 判断是否为"其他"选项
 */
function isOtherOption(opt: QuestionOption | string): boolean {
	if (typeof opt === 'string') return false;
	return opt.other === true;
}

/**
 * 判断单选题选项是否被选中
 */
function isSingleSelected(q: Question, opt: QuestionOption | string): boolean {
	const value = getOptionValue(opt);
	return answers[q.id] === value;
}

/**
 * 获取单选题的答案
 */
function getSingleAnswer(qid: string): string | undefined {
	return answers[qid];
}

/**
 * 判断多选题选项是否被选中
 */
function isMultiSelected(q: Question, opt: QuestionOption | string): boolean {
	const value = getOptionValue(opt);
	const arr = answers[q.id] || [];
	return Array.isArray(arr) && arr.includes(value);
}

/**
 * 处理"其他"选项输入
 */
function onOtherInput(qid: string, opt: QuestionOption | string) {
	// 输入内容已通过 v-model 绑定到 otherAnswers，这里可以添加额外逻辑
}

function toggleMulti(qid: string, opt: QuestionOption | string) {
	if (!answers[qid]) answers[qid] = [];
	const arr = answers[qid] as string[];
	const value = getOptionValue(opt);
	const idx = arr.indexOf(value);
	if (idx === -1) {
		arr.push(value);
	} else {
		arr.splice(idx, 1);
		// 如果取消选择"其他"选项，清除对应的输入内容
		if (isOtherOption(opt)) {
			const key = `${qid}_${getOptionKey(opt)}`;
			delete otherAnswers[key];
		}
	}
}

function isAnswered(q: Question | undefined) {
	if (!q) return false;
	const val = answers[q.id];
	if (q.type === 'multiple') {
		if (!Array.isArray(val) || val.length === 0) return false;
		// 如果选择了"其他"选项，需要检查是否填写了内容
		const options = normalizedOptions(q.options);
		for (const opt of options) {
			if (isOtherOption(opt) && val.includes(getOptionValue(opt))) {
				const key = `${q.id}_${getOptionKey(opt)}`;
				if (!otherAnswers[key] || otherAnswers[key].trim() === '') {
					return false;
				}
			}
		}
		return true;
	}
	if (q.type === 'single') {
		if (val === undefined || val === '') return false;
		// 如果选择了"其他"选项，需要检查是否填写了内容
		const options = normalizedOptions(q.options);
		const selectedOpt = options.find(opt => getOptionValue(opt) === val);
		if (selectedOpt && isOtherOption(selectedOpt)) {
			const key = `${q.id}_${getOptionKey(selectedOpt)}`;
			if (!otherAnswers[key] || otherAnswers[key].trim() === '') {
				return false;
			}
		}
		return true;
	}
	if (q.type === 'text' && q.inputType === 'number') {
		return val !== undefined && val !== '' && !isNaN(Number(val));
	}
	if (q.type === 'number') {
		return val !== undefined && val !== '' && !isNaN(Number(val));
	}
	if (q.type === 'year-month' || q.type === 'date' || q.type === 'datetime') {
		return val !== undefined && val !== null && val !== '';
	}
	return !!val;
}

function onSingleSelect(q: Question, opt: QuestionOption | string) {
	const value = getOptionValue(opt);
	answers[q.id] = value;
	// 如果取消选择，清除"其他"选项的输入内容
	if (!isOtherOption(opt)) {
		// 清除之前可能存在的"其他"选项输入
		const otherOpt = normalizedOptions(q.options).find(o => isOtherOption(o));
		if (otherOpt) {
			const key = `${q.id}_${getOptionKey(otherOpt)}`;
			delete otherAnswers[key];
		}
	}
	// 如果有跳转，自动跳转
	if (q.jump && q.jump[value] !== undefined) {
		history.value.push(currentIndex.value);
		currentIndex.value = q.jump[value];
	}
}

function next() {
	const q = currentQuestion.value;
	if (!isAnswered(q)) {
		if (q?.type === 'text' && q.inputType === 'number') {
			ElMessage.warning(`请填写有效数字：${q.title}`);
		} else {
			ElMessage.warning(`请填写：${q?.title}`);
		}
		return;
	}
	// 跳转逻辑
	if (q.type === 'single' && q.jump && answers[q.id]) {
		const answerValue = answers[q.id];
		if (q.jump[answerValue] !== undefined) {
			history.value.push(currentIndex.value);
			currentIndex.value = q.jump[answerValue];
			return;
		}
	}
	history.value.push(currentIndex.value);
	currentIndex.value = Math.min(currentIndex.value + 1, questions.value.length - 1);
}

function prev() {
	if (history.value.length > 0) {
		currentIndex.value = history.value.pop()!;
	}
}

function submit() {
	const q = currentQuestion.value;
	if (!isAnswered(q)) {
		if (q?.type === 'text' && q.inputType === 'number') {
			ElMessage.warning(`请填写有效数字：${q.title}`);
		} else {
			ElMessage.warning(`请填写：${q?.title}`);
		}
		return;
	}
	//console.log('提交答案', JSON.stringify(answers));
	ElMessage.success('提交成功！');
}

// 1. 在 el-input 上添加 @input 事件，仅数字填空题时生效
// 填空题渲染部分：
// <el-input
//   v-if="q.inputType !== 'textarea'"
//   v-model="answers[q.id]"
//   :placeholder="q.placeholder || '请输入内容'"
//   :type="q.inputType || 'text'"
//   class="text-input"
//   @input="onInputNumber($event, q)"
// />

// 2. 添加 onInputNumber 方法
function onInputNumber(val: string, q: Question) {
	if (q.inputType === 'number') {
		// 只允许数字和小数点
		let filtered = val.replace(/[^\d.\-]/g, '');
		// 只允许一个小数点和一个负号
		filtered = filtered
			.replace(/(\..*)\./g, '$1') // 只保留第一个小数点
			.replace(/(\-.*)\-/g, '$1'); // 只保留第一个负号
		answers[q.id] = filtered;
	}
}

function jumpTo(idx: number) {
	showPreview.value = false;
	currentIndex.value = idx;
}

/**
 * 格式化日期值用于预览显示
 */
function formatDateValue(value: any, type: string): string {
	if (!value) return '';

	// 如果是 Date 对象，转换为字符串
	if (value instanceof Date) {
		const year = value.getFullYear();
		const month = String(value.getMonth() + 1).padStart(2, '0');
		const day = String(value.getDate()).padStart(2, '0');
		const hours = String(value.getHours()).padStart(2, '0');
		const minutes = String(value.getMinutes()).padStart(2, '0');
		const seconds = String(value.getSeconds()).padStart(2, '0');

		if (type === 'year-month') {
			return `${year}-${month}`;
		} else if (type === 'date') {
			return `${year}-${month}-${day}`;
		} else if (type === 'datetime') {
			return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
		}
	}

	// 如果是字符串，直接返回
	return String(value);
}
</script>

<style scoped>
.survey-xing {
	max-width: 600px;
	margin: 40px auto;
	background: #fff;
	padding: 32px 24px 40px 24px;
	border-radius: 12px;
	box-shadow: 0 2px 16px 0 #e6e6e6;
	/* 滚动条样式 */
	max-height: 90vh;
	overflow-y: auto;
}
.survey-xing::-webkit-scrollbar {
	width: 8px;
	background: #f5f5f5;
	border-radius: 8px;
}
.survey-xing::-webkit-scrollbar-thumb {
	background: #e0e0e0;
	border-radius: 8px;
}
.question-block {
	margin-bottom: 32px;
	padding: 24px 20px 18px 20px;
	border-radius: 8px;
	background: #f8f9fa;
	border: 1px solid #f0f0f0;
	transition: box-shadow 0.2s;
}
.question-block.required {
	border-left: 4px solid #f56c6c;
}
.question-title {
	font-size: 17px;
	font-weight: 500;
	margin-bottom: 16px;
	display: flex;
	align-items: center;
	gap: 8px;
}
.q-index {
	color: #409eff;
	font-weight: bold;
}
.q-type {
	color: #999;
	font-size: 13px;
	margin-left: 8px;
}
.q-required {
	color: #f56c6c;
	font-size: 18px;
	margin-left: 4px;
}
.option-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}
.option-item {
	display: flex;
	align-items: center;
	padding: 10px 16px;
	border-radius: 6px;
	cursor: pointer;
	transition:
		background 0.2s,
		box-shadow 0.2s;
	border: 1px solid transparent;
}
.option-item:hover {
	background: #f0f7ff;
}
.option-item.active {
	background: #e6f7ff;
	border-color: #409eff;
}
.text-input {
	width: 100%;
}
.submit-row {
	text-align: center;
	margin-top: 32px;
}
.preview-content {
	max-height: 600px;
	overflow-y: auto;
	padding: 8px;
}
.preview-question-block {
	margin-bottom: 24px;
	padding: 18px 16px;
	border-radius: 8px;
	background: #f8f9fa;
	border: 1px solid #f0f0f0;
	cursor: pointer;
	transition: all 0.2s;
}
.preview-question-block:hover {
	background: #f0f7ff;
	border-color: #409eff;
}
.preview-question-block.active {
	background: #e6f7ff;
	border-color: #409eff;
	border-width: 2px;
}
.preview-question-title {
	font-size: 15px;
	font-weight: 500;
	margin-bottom: 12px;
	display: flex;
	align-items: center;
	gap: 8px;
}
.preview-q-index {
	color: #409eff;
	font-weight: bold;
}
.preview-q-label {
	flex: 1;
}
.preview-q-type {
	color: #999;
	font-size: 13px;
}
.preview-q-required {
	color: #f56c6c;
	font-size: 18px;
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
	border: 1px solid transparent;
}
.preview-option-item.active {
	background: #e6f7ff;
	border-color: #409eff;
}
.preview-answer {
	color: #666;
	padding: 8px 12px;
	background: #fff;
	border-radius: 6px;
}
</style>
