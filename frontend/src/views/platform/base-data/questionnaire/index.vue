<template>
  <div class="questionnaire-management">
    <div class="page-header">
      <h1 class="page-title">问卷管理</h1>
      <div class="header-actions">
        <el-button type="primary" @click="handleAdd">
          <el-icon><Plus /></el-icon>
          新增问卷
        </el-button>
      </div>
    </div>

    <div class="search-form">
      <el-form :inline="true" :model="searchForm">
        <el-form-item label="关键词">
          <el-input v-model="searchForm.keyword" placeholder="问卷标题" clearable />
        </el-form-item>
        <el-form-item label="机构">
          <el-select v-model="searchForm.orgId" placeholder="请选择机构" clearable style="width: 180px">
            <el-option
              v-for="org in orgList"
              :key="org.id"
              :label="org.name"
              :value="org.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">
            <el-icon><Search /></el-icon>
            查询
          </el-button>
          <el-button @click="handleReset">
            <el-icon><Refresh /></el-icon>
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="tableData"
        border
        :header-cell-style="{ background: '#f5f7fa', color: '#333' }"
      >
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="orgName" label="机构" width="150" align="center">
          <template #default="{ row }">
            {{ getOrgName(row.orgId) }}
          </template>
        </el-table-column>
        <el-table-column prop="title" label="问卷标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="description" label="问卷描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column prop="published" label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.published ? 'success' : 'info'" size="small">
              {{ row.published ? '已发布' : '未发布' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" />
        <el-table-column label="操作" width="300" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link :disabled="row.published" @click="handleEdit(row)">编辑</el-button>
            <el-button type="primary" link :disabled="row.published" @click="handleDesign(row)">设计</el-button>
            <el-button type="primary" link @click="handlePreview(row)">预览</el-button>
            <el-button
              :type="row.published ? 'warning' : 'success'"
              link
              @click="handleTogglePublish(row)"
            >
              {{ row.published ? '取消发布' : '发布' }}
            </el-button>
            <el-button type="danger" link :disabled="row.published" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchData"
        @current-change="fetchData"
      />
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑问卷' : '新增问卷'"
      width="500px"
      destroy-on-close
    >
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="问卷标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入问卷标题" />
        </el-form-item>
        <el-form-item label="问卷描述" prop="description">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入问卷描述" />
        </el-form-item>
        <el-form-item label="机构" prop="orgId">
          <el-select v-model="form.orgId" placeholder="请选择机构" clearable style="width: 100%">
            <el-option
              v-for="org in orgList"
              :key="org.id"
              :label="org.name"
              :value="org.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <!-- 问卷设计器弹窗 -->
    <el-dialog
      v-model="designerVisible"
      title="问卷设计器"
      width="80%"
      top="5vh"
      destroy-on-close
    >
      <survey-designer
        v-if="designerVisible"
        :questionnaire-id="currentQuestionnaireId"
        :questionnaire-title="currentQuestionnaireTitle"
        @save="onDesignerSave"
        @close="designerVisible = false"
      />
    </el-dialog>

    <!-- 问卷预览弹窗 -->
    <el-dialog
      v-model="previewVisible"
      title="问卷预览"
      width="600px"
      destroy-on-close
    >
      <preview-dialog
        v-if="previewVisible"
        v-model="previewVisible"
        :questions="previewQuestions"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import { Plus, Search, Refresh } from '@element-plus/icons-vue'
import { questionnaireApi } from '@/api/questionnaire'
import { organizationApi } from '@/api/organization'
import { dataPermissionApi } from '@/api/data-permission'
import SurveyDesigner from './components/survey-designer.vue'
import Survey from './components/survey.vue'
import PreviewDialog from './components/preview-dialog.vue'

// 搜索表单
const searchForm = reactive({
  keyword: '',
  orgId: null as string | null
})

// 表格数据
const loading = ref(false)
const tableData = ref<any[]>([])

// 分页
const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

// 弹窗
const dialogVisible = ref(false)
const designerVisible = ref(false)
const previewVisible = ref(false)
const isEdit = ref(false)
const submitLoading = ref(false)
const formRef = ref<FormInstance>()
const currentQuestionnaireId = ref<number>(0)
const previewQuestions = ref<any[]>([])
const currentQuestionnaireTitle = ref<string>('')

// 机构列表
const orgList = ref<any[]>([])

// 用户可访问的机构ID列表，空数组表示全部权限
const accessibleOrgIds = ref<string[]>([])

// 表单数据
const form = reactive({
  id: 0,
  title: '',
  description: '',
  sort: 0,
  orgId: null as string | null
})

// 表单校验
const formRules: FormRules = {
  title: [{ required: true, message: '请输入问卷标题', trigger: 'blur' }]
}

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const res = await questionnaireApi.getList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: searchForm.keyword,
      orgId: searchForm.orgId
    })
    tableData.value = (res as any).data?.data || []
    pagination.total = (res as any).data?.data?.total || (res as any).data?.total || 0
  } catch (e: any) {
    ElMessage.error(e?.message || '获取数据失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

// 重置
const handleReset = () => {
  searchForm.keyword = ''
  searchForm.orgId = null
  pagination.page = 1
  fetchData()
}

// 新增
const handleAdd = () => {
  isEdit.value = false
  form.id = 0
  form.title = ''
  form.description = ''
  form.sort = 0
  form.orgId = null
  dialogVisible.value = true
}

// 编辑
const handleEdit = async (row: any) => {
  isEdit.value = true
  form.id = row.id
  form.title = row.title
  form.description = row.description || ''
  form.sort = row.sort || 0
  form.orgId = row.orgId || null
  dialogVisible.value = true
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate()

  submitLoading.value = true
  try {
    if (isEdit.value) {
      await questionnaireApi.update(form.id, {
        title: form.title,
        description: form.description,
        sort: form.sort,
        orgId: form.orgId
      })
      ElMessage.success('更新成功')
    } else {
      await questionnaireApi.create({
        title: form.title,
        description: form.description,
        sort: form.sort,
        orgId: form.orgId
      })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
  } finally {
    submitLoading.value = false
  }
}

// 设计问卷
const handleDesign = (row: any) => {
  currentQuestionnaireId.value = row.id
  currentQuestionnaireTitle.value = row.title
  designerVisible.value = true
}

// 预览问卷
const handlePreview = async (row: any) => {
  currentQuestionnaireId.value = row.id
  // 加载题目数据
  try {
    const res = await questionnaireApi.getQuestions(row.id)
    previewQuestions.value = (res as any).data?.data || []
  } catch (e) {
    console.error('加载题目失败:', e)
    previewQuestions.value = []
  }
  previewVisible.value = true
}

// 发布/取消发布
const handleTogglePublish = async (row: any) => {
  const action = row.published ? '取消发布' : '发布'
  try {
    await ElMessageBox.confirm(`确定要${action}该问卷吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    if (row.published) {
      await questionnaireApi.unpublish(row.id)
      ElMessage.success('已取消发布')
    } else {
      await questionnaireApi.publish(row.id)
      ElMessage.success('发布成功')
    }
    fetchData()
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e?.message || '操作失败')
    }
  }
}

// 删除
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除该问卷吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await questionnaireApi.delete(row.id)
    ElMessage.success('删除成功')
    fetchData()
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e?.message || '删除失败')
    }
  }
}

// 设计器保存回调
const onDesignerSave = () => {
  designerVisible.value = false
  fetchData()
}

// 加载机构列表
const loadOrganizations = async () => {
  try {
    // 先获取用户可访问的机构列表
    const accRes = await dataPermissionApi.getAccessibleOrgs()
    accessibleOrgIds.value = (accRes as any).data?.data || []

    // 获取所有机构
    const res = await organizationApi.getTree()
    const allOrgs: any[] = (res as any).data?.data || []

    // 如果有权限限制，过滤机构列表
    if (accessibleOrgIds.value.length > 0) {
      orgList.value = allOrgs.filter((org: any) => accessibleOrgIds.value.includes(org.id))
    } else {
      // 空数组表示全部权限，显示所有机构
      orgList.value = allOrgs
    }
  } catch (e) {
    console.error('加载机构列表失败:', e)
  }
}

// 根据orgId获取机构名称
const getOrgName = (orgId: string | null) => {
  if (!orgId) return '-'
  const org = orgList.value.find((o: any) => o.id === orgId)
  return org?.name || '-'
}

onMounted(() => {
  fetchData()
  loadOrganizations()
})
</script>

<style scoped>
.questionnaire-management {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin: 0;
}

.search-form {
  background: #fff;
  padding: 5px;
  border-radius: 4px;
  margin-bottom: 0px;
}

.table-container {
  background: #fff;
  border-radius: 4px;
  padding: 0px;
}

.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}
</style>
