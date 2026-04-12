<template>
	<div class="survey-designer-container">
		<!-- 顶部保存按钮，左对齐，间距更紧凑 -->
		<div
			style="
				width: 100%;
				padding: 8px 0 4px 0;
				background: #fff;
				display: flex;
				justify-content: flex-start;
				align-items: center;
				border-bottom: 1px solid #f0f0f0;
				position: sticky;
				top: 0;
				z-index: 20;
				flex-shrink: 0;
			"
		>
			<!-- <el-button type="primary" @click="saveSurvey" :disabled="questions.length === 0"
				>保存问卷</el-button
			> -->
		</div>
		<div class="designer">
			<div class="designer-sidebar">
				<el-button
					type="primary"
					@click="addQuestion"
					style="width: 100%; margin-bottom: 12px"
					>添加题目</el-button
				>
				<draggable
					v-model="questions"
					handle=".drag-handle"
					item-key="id"
					animation="200"
					@end="onDragEnd"
				>
					<template #item="{ element, index }">
						<div
							@click="editQuestion(index)"
							:class="['designer-question-item', { active: index === editingIndex }]"
						>
							<span class="drag-handle">☰</span>
							<span>{{ element.bh }}. {{ element.title || '未命名题目' }}</span>
							<el-button
								@click.stop="copyQuestion(index)"
								:icon="DocumentCopy"
								circle
								size="small"
								title="复制题目"
								style="margin-left: auto"
							/>
							<el-button
								@click.stop="moveUp(index)"
								:icon="ArrowUp"
								circle
								size="small"
								title="上移"
								:disabled="index === 0"
								style="margin-left: 4px"
							/>
							<el-button
								@click.stop="moveDown(index)"
								:icon="ArrowDown"
								circle
								size="small"
								title="下移"
								:disabled="index === questions.length - 1"
								style="margin-left: 4px"
							/>
						</div>
					</template>
				</draggable>
			</div>
			<div class="designer-main">
				<el-form v-if="editingQuestion" label-width="90px" style="max-width: 420px">
					<el-form-item label="题目编号">
						<el-input
							v-model="editingQuestion.bh"
							maxlength="10"
							placeholder="如1、A、Q1等"
						/>
					</el-form-item>
					<el-form-item label="题型">
						<el-select v-model="editingQuestion.type">
							<el-option label="单选题" value="single" />
							<el-option label="多选题" value="multiple" />
							<el-option label="数字填空" value="number" />
							<el-option label="小文本填空" value="text" />
							<el-option label="大文本填空" value="textarea" />
							<el-option label="年月" value="year-month" />
							<el-option label="年月日" value="date" />
							<el-option label="年月日时分秒" value="datetime" />
						</el-select>
					</el-form-item>
					<el-form-item label="题目标题">
						<el-input v-model="editingQuestion.title" />
					</el-form-item>
					<el-form-item label="必填">
						<el-switch v-model="editingQuestion.required" />
					</el-form-item>
					<el-form-item
						v-if="
							editingQuestion.type === 'single' || editingQuestion.type === 'multiple'
						"
						label="选项"
					>
						<div
							v-for="(opt, i) in editingQuestion.options"
							:key="i"
							style="display: flex; align-items: center; margin-bottom: 6px"
						>
							<el-input
								v-model="editingQuestion.options[i].content"
								style="width: 60%"
							/>
							<div
								style="
									display: flex;
									align-items: center;
									margin-left: 8px;
									white-space: nowrap;
								"
							>
								<span
									style="
										font-size: 12px;
										color: #666;
										margin-right: 4px;
										line-height: 1;
									"
									>其他</span
								>
								<el-switch
									v-model="editingQuestion.options[i].other"
									size="small"
								/>
							</div>
							<div style="display: flex; align-items: center; margin-left: 8px">
								<el-input
									v-model="optionScoreBindings[i].value"
									type="number"
									:min="0"
									:max="100"
									style="width: 80px"
									placeholder="分值"
									@input="
										value => {
											const num = parseInt(value);
											optionScoreBindings[i].value = isNaN(num) ? null : num;
										}
									"
								/>
								<el-button
									v-if="optionScoreBindings[i].value !== null"
									@click.stop="optionScoreBindings[i].value = null"
									:icon="Close"
									size="small"
									style="margin-left: 4px"
									title="清除分值"
								/>
							</div>
							<el-button
								:icon="Delete"
								@click="removeOption(i)"
								circle
								size="small"
								style="margin-left: 8px"
							/>
						</div>
						<el-button @click="addOption" size="small">添加选项</el-button>
					</el-form-item>
					<el-form-item
						v-if="editingQuestion.type === 'single' && editingQuestion.options.length"
						label="跳转逻辑"
					>
						<div
							v-for="opt in editingQuestion.options"
							:key="opt.bh"
							style="margin-bottom: 6px"
						>
							<span>{{ opt.bh }} → </span>
							<el-select
								v-model="editingQuestion.jump[opt.bh]"
								placeholder="选择跳转题目"
								clearable
								style="width: 180px"
							>
								<el-option
									v-for="q in filteredQuestions"
									:key="q.id"
									:label="`${q.bh || ''}. ${q.title || '未命名题目'}`"
									:value="q.bh"
								/>
								<el-option label="结束" value="end" />
							</el-select>
							<span
								v-if="!editingQuestion.jump[opt.bh]"
								style="margin-left: 8px; color: #999"
								>顺序</span
							>
							<span
								v-else-if="editingQuestion.jump[opt.bh] === 'end'"
								style="margin-left: 8px; color: #999"
								>结束</span
							>
							<span v-else style="margin-left: 8px; color: #409eff"
								>跳转到: {{ editingQuestion.jump[opt.bh] }}</span
							>
						</div>
					</el-form-item>
					<el-form-item>
						<el-button type="primary" @click="saveQuestion">保存题目</el-button>
						<el-button @click="deleteQuestion" type="danger" v-if="questions.length > 1"
							>删除题目</el-button
						>
					</el-form-item>
				</el-form>
				<div v-else style="padding: 40px; text-align: center; color: #aaa">
					<div v-if="questions.length === 0">请点击左侧“添加题目”开始设计问卷</div>
					<div v-else>请选择左侧题目或添加新题</div>
				</div>
			</div>
			<div class="designer-preview">
				<div class="preview-actions">
					<el-button type="primary" @click="showPreview = true" size="small" plain
						>预览问卷</el-button
					>
					<el-button type="success" @click="exportConfig" size="small" plain
						>导出配置</el-button
					>
					<el-upload
						:show-file-list="false"
						accept=".json"
						:before-upload="beforeImportConfig"
					>
						<el-button type="warning" size="small" plain>导入配置</el-button>
					</el-upload>
				</div>
				<div v-if="questions.length === 0" style="color: #aaa; padding: 24px 0">
					暂无题目，添加后可实时预览
				</div>
				<pre
					v-else
					style="
						background: #f8f8f8;
						padding: 12px 8px 8px 8px;
						border-radius: 6px;
						overflow: auto;
					"
					>{{ questions }}</pre
				>
				<!-- 问卷预览对话框 -->
				<preview-dialog v-model="showPreview" :questions="questions" />
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import draggable from 'vuedraggable';
import { DocumentCopy, ArrowUp, ArrowDown, Delete, Close } from '@element-plus/icons-vue';
import { questionnaireApi } from '@/api/questionnaire';
import PreviewDialog from './preview-dialog.vue';

interface Question {
	id: string;
	type:
		| 'single'
		| 'multiple'
		| 'number'
		| 'text'
		| 'textarea'
		| 'year-month'
		| 'date'
		| 'datetime';
	title: string;
	options: Array<{
		bh: string; // 编号
		content: string; // 内容
		score: number | null; // 分值
		other?: boolean; // 是否其他选项
	}>;
	required: boolean;
	jump: { [option: string]: string | 'end' }; // 跳转到题目的 bh 字段
	bh: string; // 题目编号字段，字符型
	placeholder?: string;
	questionnaireId?: number | null; // 问卷ID
}

// 定义props
const props = defineProps<{
	questionnaireId?: number | null;
}>();

function createDefaultQuestion(num?: string): Question {
	return {
		id: Math.random().toString(36).slice(2),
		type: 'single',
		title: '',
		options: [
			{ bh: 'A', content: '选项A', score: null, other: false },
			{ bh: 'B', content: '选项B', score: null, other: false }
		],
		required: false,
		jump: {},
		bh: num || '',
		placeholder: '',
		questionnaireId: props.questionnaireId || null // 设置问卷ID
	};
}

const questions = ref<Question[]>([]);
const editingIndex = ref(0);
const editingQuestion = ref<Question | null>(null);
const showPreview = ref(false);

const filteredQuestions = computed(() => {
	if (!editingQuestion.value) return [];
	// 只允许跳到当前题目之后的题目
	const idx = questions.value.findIndex(q => q.id === editingQuestion.value!.id);
	return questions.value.filter((q, i) => i > idx);
});

watch(editingIndex, idx => {
	editingQuestion.value =
		idx !== null && questions.value.length > 0 && questions.value[idx]
			? JSON.parse(JSON.stringify(questions.value[idx]))
			: null;
});

const emit = defineEmits(['save']);

// 在组件挂载时加载题目数据
onMounted(async () => {
	if (props.questionnaireId) {
		await loadQuestionsByQuestionnaireId();
	}
});

/**
 * 根据问卷ID加载题目数据
 */
async function loadQuestionsByQuestionnaireId() {
	try {
		// 固定测试数据
		/*
		const mockQuestions = [
			{
				id: '1',
				type: 'single' as const,
				title: '您的性别是？',
				options: [
					{ bh: 'A', content: '男', score: 1 },
					{ bh: 'B', content: '女', score: 2 }
				],
				required: true,
				jump: {},
				bh: '1',
				placeholder: '',
				questionnaireId: props.questionnaireId
			},
			{
				id: '2',
				type: 'multiple' as const,
				title: '您喜欢的运动项目有哪些？',
				options: [
					{ bh: 'A', content: '足球', score: 1 },
					{ bh: 'B', content: '篮球', score: 2 },
					{ bh: 'C', content: '游泳', score: 3 },
					{ bh: 'D', content: '跑步', score: 4 },
					{ bh: 'E', content: '健身', score: 5 }
				],
				required: false,
				jump: {},
				bh: '2',
				placeholder: '',
				questionnaireId: props.questionnaireId
			},
			{
				id: '3',
				type: 'text' as const,
				title: '您对当前服务的满意度如何？',
				options: [],
				required: true,
				jump: {},
				bh: '3',
				placeholder: '请输入您的意见',
				questionnaireId: props.questionnaireId
			}
		] as Question[];

		questions.value = mockQuestions;
		// 设置第一个题目为编辑状态
		editingIndex.value = 0;
		editingQuestion.value = JSON.parse(JSON.stringify(questions.value[0]));

		// 使用nextTick确保DOM更新
		await nextTick();

		ElMessage.success('题目数据加载成功');
     */
		// 原来的API调用代码（已注释）

		// 调用后端接口获取题目列表
		const response = await questionnaireApi.getQuestions(props.questionnaireId);
		const questionList = (response as any).data?.data || [];

		if (questionList && questionList.length > 0) {
			// 转换后端数据格式为前端Question格式
			questions.value = questionList.map((item: any) => {
				// 解析 jump 字段：如果是字符串，先解析；如果是对象，直接使用
				let jumpData: { [option: string]: string | 'end' } = {};
				if (item.jump) {
					if (typeof item.jump === 'string') {
						try {
							jumpData = JSON.parse(item.jump);
						} catch {
							jumpData = {};
						}
					} else if (typeof item.jump === 'object') {
						jumpData = item.jump;
					}

					// 兼容旧数据：如果 jump 中存储的是索引（数字），转换为 bh
					const convertedJump: { [option: string]: string | 'end' } = {};
					for (const [key, value] of Object.entries(jumpData)) {
						if (value === 'end') {
							convertedJump[key] = 'end';
						} else if (typeof value === 'number') {
							// 旧数据：索引转换为 bh
							const targetQuestion = questionList[value];
							if (targetQuestion && targetQuestion.bh) {
								convertedJump[key] = targetQuestion.bh;
							}
						} else if (typeof value === 'string') {
							// 新数据：直接使用 bh
							convertedJump[key] = value;
						}
					}
					jumpData = convertedJump;
				}

				// 处理选项数据，确保每个选项都有 other 字段
				const processedOptions = (item.options || []).map((opt: any) => ({
					...opt,
					other: opt.other || false
				}));

				return {
					id: item.id?.toString() || Math.random().toString(36).slice(2),
					type: item.type,
					title: item.title || '',
					options: processedOptions,
					required: item.required || false,
					jump: jumpData,
					bh: item.bh || '',
					placeholder: item.placeholder || '',
					questionnaireId: item.questionnaireId || props.questionnaireId
				};
			});

			// 设置第一个题目为编辑状态
			editingIndex.value = 0;
			editingQuestion.value = JSON.parse(JSON.stringify(questions.value[0]));
			ElMessage.success('题目数据加载成功');
		} else {
			ElMessage.info('该问卷暂无题目，请添加新题目');
		}
	} catch (error) {
		console.error('加载题目数据失败:', error);
		ElMessage.error('加载题目数据失败');
	}
}

function addQuestion() {
	let nextNum = '';
	if (questions.value.length > 0) {
		// 自动递增编号（如A、B、C...或1、2、3...）
		const last = questions.value[questions.value.length - 1].bh;
		if (/^\d+$/.test(last)) {
			nextNum = (parseInt(last) + 1).toString();
		} else if (/^[A-Z]$/.test(last)) {
			nextNum = String.fromCharCode(last.charCodeAt(0) + 1);
		} else {
			nextNum = '';
		}
	} else {
		nextNum = '1';
	}
	questions.value.push(createDefaultQuestion(nextNum));
	editingIndex.value = questions.value.length - 1;
	editingQuestion.value = JSON.parse(JSON.stringify(questions.value[editingIndex.value]));
}
function editQuestion(idx: number) {
	editingIndex.value = idx;
}
async function saveQuestion() {
	if (!editingQuestion.value) return;

	// 检查是否有问卷ID
	if (!props.questionnaireId) {
		ElMessage.warning('请先保存问卷，再保存题目');
		return;
	}

	try {
		// 保存到本地
		const savedQuestion = JSON.parse(JSON.stringify(editingQuestion.value));
		questions.value[editingIndex.value] = savedQuestion;

		// 判断是新增还是更新：如果 id 是数字字符串或可以转换为数字，说明已存在
		const questionId = savedQuestion.id;
		const isUpdate = questionId && !isNaN(Number(questionId)) && Number(questionId) > 0;

		// 准备保存到后端的数据
		const saveData: any = {
			questionnaireId: props.questionnaireId,
			title: savedQuestion.title || '',
			type: savedQuestion.type,
			required: savedQuestion.required || false,
			bh: savedQuestion.bh || '',
			sort: editingIndex.value + 1, // 使用当前索引作为排序
			jump:
				typeof savedQuestion.jump === 'object'
					? JSON.stringify(savedQuestion.jump)
					: savedQuestion.jump || '{}',
			placeholder: savedQuestion.placeholder || ''
		};

		// 处理选项数据：确保格式正确
		if (savedQuestion.options && Array.isArray(savedQuestion.options)) {
			saveData.options = savedQuestion.options.map((opt: any, index: number) => ({
				questionnaireId: props.questionnaireId,
				questionId: isUpdate ? Number(questionId) : undefined, // 如果是更新，需要 questionId
				content: opt.content || '',
				bh: opt.bh || '',
				score: opt.score !== null && opt.score !== undefined ? Number(opt.score) : null,
				other: opt.other || false,
				sort: index + 1,
				// 如果选项已有 id（更新时），保留 id
				...(opt.id && !isNaN(Number(opt.id)) ? { id: Number(opt.id) } : {})
			}));
		} else {
			saveData.options = [];
		}

		// 如果是更新，添加 id
		if (isUpdate) {
			saveData.id = Number(questionId);
		}

		// 调用后端接口保存
		let result;
		if (isUpdate) {
			// 更新题目
			result = await questionnaireApi.updateQuestion(Number(questionId), saveData);
		} else {
			// 新增题目
			result = await questionnaireApi.addQuestion(saveData);

			// 如果是新增，更新本地 id
			if (result && (result as any).data?.id) {
				const newId = (result as any).data.id;
				savedQuestion.id = newId.toString();
				questions.value[editingIndex.value].id = newId.toString();
				editingQuestion.value.id = newId.toString();
			}
		}

		ElMessage.success('题目已保存到数据库');
	} catch (error: any) {
		console.error('保存题目失败:', error);
		ElMessage.error('保存题目失败: ' + (error.message || '未知错误'));
	}
}
async function deleteQuestion() {
	// if (questions.value.length <= 1) {
	// 	ElMessage.warning('至少需要保留一个题目');
	// 	return;
	// }

	// 获取要删除的题目
	const questionToDelete = questions.value[editingIndex.value];
	if (!questionToDelete) return;

	// 检查是否有数据库记录（通过 id 判断）
	const questionId = questionToDelete.id;
	const hasDbRecord = questionId && !isNaN(Number(questionId)) && Number(questionId) > 0;

	// 如果有数据库记录，需要确认删除
	if (hasDbRecord) {
		try {
			await ElMessageBox.confirm(
				`确定要删除题目"${questionToDelete.title || questionToDelete.bh || '未命名题目'}"吗？删除后不可恢复。`,
				'删除确认',
				{
					confirmButtonText: '确定删除',
					cancelButtonText: '取消',
					type: 'warning',
					confirmButtonClass: 'el-button--danger'
				}
			);
		} catch {
			// 用户取消删除
			ElMessage.info('已取消删除');
			return;
		}
	}

	try {
		// 如果有数据库记录，先删除数据库中的记录
		if (hasDbRecord) {
			await questionnaireApi.deleteQuestionById(Number(questionId))
		}

		// 从本地数组中删除
		questions.value.splice(editingIndex.value, 1);

		// 调整编辑索引
		editingIndex.value = Math.max(0, editingIndex.value - 1);

		// 更新编辑中的题目
		if (questions.value.length > 0) {
			editingQuestion.value = JSON.parse(JSON.stringify(questions.value[editingIndex.value]));
		} else {
			editingQuestion.value = null;
		}

		ElMessage.success('题目已删除');
	} catch (error: any) {
		console.error('删除题目失败:', error);
		ElMessage.error('删除题目失败: ' + (error.message || '未知错误'));
	}
}
function addOption() {
	if (editingQuestion.value) {
		// 生成新选项编号
		const existingBh = editingQuestion.value.options.map(opt => opt.bh);
		let newBh = 'A';
		if (existingBh.length > 0) {
			const lastBh = existingBh[existingBh.length - 1];
			if (/^[A-Z]$/.test(lastBh)) {
				newBh = String.fromCharCode(lastBh.charCodeAt(0) + 1);
			} else if (/^\d+$/.test(lastBh)) {
				newBh = (parseInt(lastBh) + 1).toString();
			}
		}

		const newOption = { bh: newBh, content: '新选项', score: null, other: false };
		editingQuestion.value.options.push(newOption);
	}
}

function removeOption(i: number) {
	if (editingQuestion.value) {
		const removedOption = editingQuestion.value.options[i];
		editingQuestion.value.options.splice(i, 1);
	}
}

function preview() {
	ElMessage.info('可在右侧实时预览JSON结构，或导出配置用于问卷页面');
}
function exportConfig() {
	const data = JSON.stringify(questions.value, null, 2);
	const blob = new Blob([data], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = 'survey-config.json';
	a.click();
	URL.revokeObjectURL(url);
}

/**
 * 复制题目
 * @param idx 题目索引
 */
async function copyQuestion(idx: number) {
	const orig = questions.value[idx];

	// 检查是否有问卷ID
	if (!props.questionnaireId) {
		ElMessage.warning('请先保存问卷，再复制题目');
		return;
	}

	// 深拷贝（不设置 id，这样后端会认为是新增）
	const newQ = JSON.parse(JSON.stringify(orig));
	delete newQ.id; // 移除 id，确保后端创建新题目

	try {
		// 编号自动+1或加后缀
		if (/^\d+$/.test(orig.bh)) {
			newQ.bh = (parseInt(orig.bh) + 1).toString();
		} else if (/^[A-Z]$/.test(orig.bh)) {
			newQ.bh = String.fromCharCode(orig.bh.charCodeAt(0) + 1);
		} else {
			newQ.bh = orig.bh + '_copy';
		}

		// 清空跳转逻辑（复制后的题目不应该继承跳转逻辑）
		newQ.jump = {};

		// 处理选项：确保复制所有选项，并移除选项的 id（因为这是新题目）
		if (newQ.options && Array.isArray(newQ.options)) {
			newQ.options = newQ.options.map((opt: any) => {
				const newOpt: any = {
					bh: opt.bh || '',
					content: opt.content || '',
					score: opt.score !== null && opt.score !== undefined ? opt.score : null,
					other: opt.other || false
				};
				delete newOpt.id; // 移除选项 id，确保后端创建新选项
				return newOpt;
			});
		}

		// 插入到当前题目下方
		const insertIndex = idx + 1;
		questions.value.splice(insertIndex, 0, newQ);
		editingIndex.value = insertIndex;
		editingQuestion.value = JSON.parse(JSON.stringify(newQ));

		// 准备保存到后端的数据
		const saveData: any = {
			questionnaireId: props.questionnaireId,
			title: newQ.title || '',
			type: newQ.type,
			required: newQ.required || false,
			bh: newQ.bh || '',
			sort: insertIndex + 1, // 新的排序位置
			jump: typeof newQ.jump === 'object' ? JSON.stringify(newQ.jump) : newQ.jump || '{}',
			placeholder: newQ.placeholder || ''
		};

		// 处理选项数据：复制原题目的所有选项（已在上面的处理中确保选项完整）
		if (newQ.options && Array.isArray(newQ.options) && newQ.options.length > 0) {
			saveData.options = newQ.options.map((opt: any, optIndex: number) => ({
				questionnaireId: props.questionnaireId,
				content: opt.content || '',
				bh: opt.bh || '',
				score: opt.score !== null && opt.score !== undefined ? Number(opt.score) : null,
				other: opt.other || false,
				sort: optIndex + 1
				// 注意：复制的选项不应该包含原选项的 id，因为这是新题目
			}));
		} else {
			saveData.options = [];
		}

		// 调用后端接口保存新题目
		await questionnaireApi.saveQuestions(questions.value)

		ElMessage.success('题目已添加');
	} catch (error: any) {
		console.error('复制题目失败:', error);
		ElMessage.error('复制题目失败: ' + (error.message || '未知错误'));
		// 如果保存失败，移除已插入的题目
		if (questions.value.length > idx + 1 && questions.value[idx + 1].id === newQ.id) {
			questions.value.splice(idx + 1, 1);
			if (editingIndex.value > idx) {
				editingIndex.value = idx;
				editingQuestion.value = JSON.parse(JSON.stringify(questions.value[idx]));
			}
		}
	}
}

/**
 * 上移题目
 * @param idx 题目索引
 */
async function moveUp(idx: number) {
	if (idx <= 0) return;

	// 检查是否有问卷ID
	if (!props.questionnaireId) {
		ElMessage.warning('请先保存问卷，再调整题目顺序');
		return;
	}

	try {
		const arr = questions.value;
		const currentQuestion = arr[idx];
		const prevQuestion = arr[idx - 1];

		// 交换位置
		[arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];

		// 更新编辑索引
		if (editingIndex.value === idx) {
			editingIndex.value = idx - 1;
		} else if (editingIndex.value === idx - 1) {
			editingIndex.value = idx;
		}

		// 更新所有题目的排序
		for (let i = 0; i < arr.length; i++) {
			const qId = arr[i].id
			if (qId && !isNaN(Number(qId)) && Number(qId) > 0) {
				await questionnaireApi.updateQuestionSort(Number(qId), i + 1)
			}
		}
	} catch (error: any) {
		console.error('上移题目失败:', error);
		ElMessage.error('上移题目失败: ' + (error.message || '未知错误'));
	}
}

/**
 * 下移题目
 * @param idx 题目索引
 */
async function moveDown(idx: number) {
	if (idx >= questions.value.length - 1) return;

	// 检查是否有问卷ID
	if (!props.questionnaireId) {
		ElMessage.warning('请先保存问卷，再调整题目顺序');
		return;
	}

	try {
		const arr = questions.value;
		const currentQuestion = arr[idx];
		const nextQuestion = arr[idx + 1];

		// 交换位置
		[arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];

		// 更新编辑索引
		if (editingIndex.value === idx) {
			editingIndex.value = idx + 1;
		} else if (editingIndex.value === idx + 1) {
			editingIndex.value = idx;
		}

		// 更新所有题目的排序
		for (let i = 0; i < arr.length; i++) {
			const qId = arr[i].id
			if (qId && !isNaN(Number(qId)) && Number(qId) > 0) {
				await questionnaireApi.updateQuestionSort(Number(qId), i + 1)
			}
		}
	} catch (error: any) {
		console.error('下移题目失败:', error);
		ElMessage.error('下移题目失败: ' + (error.message || '未知错误'));
	}
}

/**
 * 拖拽结束后的处理
 * @param evt 拖拽事件
 */
async function onDragEnd(evt: any) {
	// 拖拽后保持当前编辑题目高亮和同步
	if (editingQuestion.value) {
		const idx = questions.value.findIndex(q => q.id === editingQuestion.value!.id);
		if (idx !== -1) {
			editingIndex.value = idx;
			editingQuestion.value = JSON.parse(JSON.stringify(questions.value[idx]));
		} else {
			editingIndex.value = 0;
			editingQuestion.value =
				questions.value.length > 0 ? JSON.parse(JSON.stringify(questions.value[0])) : null;
		}
	}

	// 检查是否有问卷ID
	if (!props.questionnaireId) {
		return; // 如果没有问卷ID，不更新数据库
	}

	// 更新数据库中所有题目的排序
	for (let i = 0; i < questions.value.length; i++) {
		const qId = questions.value[i].id
		if (qId && !isNaN(Number(qId)) && Number(qId) > 0) {
			await questionnaireApi.updateQuestionSort(Number(qId), i + 1)
		}
	}
}

function beforeImportConfig(file: File) {
	const reader = new FileReader();
	reader.onload = e => {
		try {
			const data = JSON.parse(e.target?.result as string);
			if (Array.isArray(data) && data.every(q => q.id && q.type && q.title)) {
				questions.value = data;
				editingIndex.value = 0;
				editingQuestion.value =
					questions.value.length > 0
						? JSON.parse(JSON.stringify(questions.value[0]))
						: null;
				ElMessage.success('导入成功');
			} else {
				ElMessage.error('配置格式不正确');
			}
		} catch {
			ElMessage.error('解析失败，请检查文件内容');
		}
	};
	reader.readAsText(file);
	return false; // 阻止 el-upload 默认上传
}

function saveSurvey() {
	if (questions.value.length === 0) {
		ElMessage.warning('请先添加题目');
		return;
	}
	// 可以在此处做校验（如题目标题、选项等必填）
	emit('save', questions.value);
	//ElMessage.success('问卷已保存');
}

// 添加计算属性来处理选项分值
const optionScores = computed({
	get() {
		if (!editingQuestion.value) return [];
		return editingQuestion.value.options.map(opt => opt.score);
	},
	set(values: (number | null)[]) {
		if (!editingQuestion.value) return;
		values.forEach((value, index) => {
			if (editingQuestion.value!.options[index]) {
				editingQuestion.value!.options[index].score = value;
			}
		});
	}
});

// 创建选项分值的计算属性
const optionScoreBindings = computed(() => {
	if (!editingQuestion.value) return [];
	return editingQuestion.value.options.map((_, index) => ({
		get value() {
			return getOptionScore(index);
		},
		set value(val: number | null) {
			setOptionScore(index, val);
		}
	}));
});

// 获取单个选项分值的方法
function getOptionScore(index: number): number | null {
	if (!editingQuestion.value || !editingQuestion.value.options[index]) return null;
	const score = editingQuestion.value.options[index].score;
	//console.log(`获取选项${index}的分值:`, score);
	return score;
}

// 设置单个选项分值的方法
function setOptionScore(index: number, value: number | null) {
	if (!editingQuestion.value || !editingQuestion.value.options[index]) return;
	//console.log(`设置选项${index}的分值为:`, value);
	editingQuestion.value.options[index].score = value;
}
</script>

<style scoped>
.survey-designer-container {
	display: flex;
	flex-direction: column;
	height: 100%;
	overflow: hidden;
}
.designer {
	display: flex;
	max-width: 1300px;
	margin: 0 auto;
	background: #fff;
	border-radius: 10px;
	box-shadow: 0 2px 16px 0 #e6e6e6;
	flex: 1;
	min-height: 0;
	overflow: hidden;
}
.designer-sidebar {
	width: 300px;
	flex-shrink: 0;
	border-right: 1px solid #f0f0f0;
	padding: 24px 12px 24px 12px;
	background: #fafbfc;
	overflow-y: auto;
	overflow-x: hidden;
	height: 100%;
}
.designer-question-item {
	padding: 8px 10px;
	border-radius: 6px;
	margin-bottom: 6px;
	cursor: pointer;
	display: flex;
	align-items: center;
	gap: 8px;
	transition: background 0.2s;
}
.designer-question-item.active {
	background: #e6f7ff;
	color: #409eff;
}
.drag-handle {
	cursor: grab;
	color: #bbb;
	font-size: 16px;
	transition: color 0.2s;
}
.drag-handle:hover {
	color: #409eff;
	cursor: grabbing;
}
.designer-main {
	width: 600px;
	flex-shrink: 0;
	padding: 32px 32px 32px 32px;
	overflow-y: auto;
	overflow-x: hidden;
	height: 100%;
}
.designer-preview {
	width: 300px;
	flex-shrink: 0;
	border-left: 1px solid #f0f0f0;
	padding: 24px 16px 24px 16px;
	background: #fafbfc;
	display: flex;
	flex-direction: column;
	align-items: flex-start;
	overflow-y: auto;
	overflow-x: hidden;
	height: 100%;
}
.designer-preview .preview-actions {
	display: flex;
	gap: 12px;
	margin-bottom: 16px;
	width: 100%;
}
.designer-preview pre {
	white-space: pre-wrap;
	word-break: break-all;
	box-sizing: border-box;
	width: 100%;
	flex: 1;
	min-height: 0;
	overflow-y: auto;
}
</style>
