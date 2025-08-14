<template>
  <div class="input-form">
    <el-card class="form-card">
      <template #header>
        <div class="card-header">
          <span class="card-title">{{ $t('inputForm.title') }}</span>
        </div>
      </template>
      
      <el-form 
        ref="formRef" 
        :model="form" 
        :rules="rules" 
        label-position="top"
        size="large"
        @submit.prevent="handleSubmit"
      >
        <el-form-item :label="$t('inputForm.urlLabel')" prop="url">
          <el-input
            v-model="form.url"
            :placeholder="$t('inputForm.urlPlaceholder')"
            clearable
            :prefix-icon="Link"
          >
            <template #prepend>https://</template>
          </el-input>
          <div class="form-help">
            {{ $t('inputForm.urlHelp') }}
          </div>
        </el-form-item>

        <el-form-item :label="$t('inputForm.levelLabel')" prop="level">
          <el-radio-group v-model="form.level" size="large">
            <el-radio-button label="beginner">
              <el-icon><User /></el-icon>
              {{ $t('inputForm.beginner') }}
            </el-radio-button>
            <el-radio-button label="advanced">
              <el-icon><Trophy /></el-icon>
              {{ $t('inputForm.advanced') }}
            </el-radio-button>
          </el-radio-group>
          <div class="form-help">
            {{ $t('inputForm.levelHelp') }}
          </div>
        </el-form-item>

        <el-form-item>
          <el-button 
            type="primary" 
            size="large" 
            :loading="loading"
            @click="handleSubmit"
            class="submit-button"
          >
            <el-icon v-if="!loading"><Star /></el-icon>
            {{ loading ? $t('inputForm.processing') : $t('inputForm.startLearning') }}
          </el-button>
        </el-form-item>
      </el-form>

      <div class="examples">
        <div class="examples-title">{{ $t('inputForm.examplesTitle') }}</div>
        <div class="examples-list">
          <el-tag 
            v-for="example in examples" 
            :key="example.url"
            class="example-tag"
            @click="selectExample(example)"
          >
            {{ example.name }}
          </el-tag>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElForm, ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { Link, User, Trophy, Star } from '@element-plus/icons-vue'
import type { LearnRequest } from '../services/api'

// Define emits
const emit = defineEmits<{
  submit: [request: LearnRequest]
}>()

// Define props
interface Props {
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

// I18n
const { t } = useI18n()

// Form reference
const formRef = ref<InstanceType<typeof ElForm>>()

// Form data
const form = reactive({
  url: '',
  level: 'beginner' as 'beginner' | 'advanced'
})

// Form validation rules
const rules = computed(() => ({
  url: [
    { required: true, message: t('inputForm.urlRequired'), trigger: 'blur' },
    { 
      pattern: /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
      message: t('inputForm.urlInvalid'),
      trigger: 'blur'
    }
  ],
  level: [
    { required: true, message: t('inputForm.levelRequired'), trigger: 'change' }
  ]
}))

// Example URLs
const examples = [
  {
    name: 'LangGraph',
    url: 'https://langchain-ai.github.io/langgraph/'
  },
  {
    name: 'Vue.js',
    url: 'https://vuejs.org/guide/'
  },
  {
    name: 'React',
    url: 'https://react.dev/learn'
  },
  {
    name: 'TypeScript',
    url: 'https://www.typescriptlang.org/docs/'
  }
]

// Methods
const handleSubmit = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    
    // Ensure URL has protocol
    let url = form.url.trim()
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url
    }
    
    emit('submit', {
      url,
      level: form.level
    })
    
  } catch (error) {
    ElMessage.error(t('inputForm.formError'))
  }
}

const selectExample = (example: { name: string; url: string }) => {
  form.url = example.url
  ElMessage.success(t('inputForm.exampleSelected', { name: example.name }))
}
</script>

<style scoped>
.input-form {
  max-width: 600px;
  margin: 0 auto;
}

.form-card {
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border: none;
}

.card-header {
  text-align: center;
}

.card-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #303133;
}

.form-help {
  font-size: 0.875rem;
  color: #909399;
  margin-top: 8px;
  line-height: 1.4;
}

.submit-button {
  width: 100%;
  height: 48px;
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 8px;
}

.examples {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #ebeef5;
}

.examples-title {
  font-size: 0.875rem;
  color: #606266;
  margin-bottom: 12px;
  font-weight: 500;
}

.examples-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.example-tag {
  cursor: pointer;
  transition: all 0.2s ease;
}

.example-tag:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Custom Element Plus Overrides */
:deep(.el-form-item__label) {
  font-weight: 600;
  color: #303133;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
}

:deep(.el-radio-button__inner) {
  border-radius: 8px;
  padding: 12px 20px;
  font-weight: 500;
}

:deep(.el-radio-button:first-child .el-radio-button__inner) {
  border-radius: 8px 0 0 8px;
}

:deep(.el-radio-button:last-child .el-radio-button__inner) {
  border-radius: 0 8px 8px 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .input-form {
    margin: 0 20px;
  }
  
  .card-title {
    font-size: 1.25rem;
  }
  
  .submit-button {
    height: 44px;
    font-size: 1rem;
  }
  
  :deep(.el-radio-button__inner) {
    padding: 10px 16px;
  }
}

@media (max-width: 480px) {
  .examples-list {
    flex-direction: column;
  }
  
  .example-tag {
    text-align: center;
  }
}
</style>