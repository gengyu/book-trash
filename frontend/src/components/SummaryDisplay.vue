<template>
  <el-card class="summary-card">
    <template #header>
      <div class="card-header">
        <el-icon><Document /></el-icon>
        <span>Summary</span>
      </div>
    </template>
    
    <div class="summary-content">
      <div class="summary-text">
        {{ summary }}
      </div>
      
      <div class="summary-actions" v-if="summary">
        <el-button 
          size="small" 
          type="text" 
          @click="copyToClipboard"
          :icon="CopyDocument"
        >
          Copy
        </el-button>
        <el-button 
          size="small" 
          type="text" 
          @click="toggleExpanded"
          :icon="expanded ? ArrowUp : ArrowDown"
        >
          {{ expanded ? 'Collapse' : 'Expand' }}
        </el-button>
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Document, CopyDocument, ArrowUp, ArrowDown } from '@element-plus/icons-vue'

// Props
interface Props {
  summary: string
}

const props = defineProps<Props>()

// State
const expanded = ref(false)

// Computed
const displaySummary = computed(() => {
  if (!props.summary) return ''
  
  if (expanded.value || props.summary.length <= 300) {
    return props.summary
  }
  
  return props.summary.substring(0, 300) + '...'
})

// Methods
const toggleExpanded = () => {
  expanded.value = !expanded.value
}

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(props.summary)
    ElMessage.success('Summary copied to clipboard')
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    ElMessage.error('Failed to copy to clipboard')
  }
}
</script>

<style scoped>
.summary-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  height: fit-content;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.summary-content {
  position: relative;
}

.summary-text {
  color: #606266;
  line-height: 1.8;
  font-size: 1rem;
  white-space: pre-wrap;
  word-wrap: break-word;
  margin-bottom: 16px;
}

.summary-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #ebeef5;
}

/* Responsive Design */
@media (max-width: 768px) {
  .summary-text {
    font-size: 0.9rem;
    line-height: 1.6;
  }
  
  .summary-actions {
    flex-direction: column;
    gap: 4px;
  }
}

/* Custom Element Plus Overrides */
:deep(.el-button--text) {
  padding: 4px 8px;
  font-size: 0.875rem;
}

:deep(.el-button--text:hover) {
  background-color: #f0f9ff;
  color: #409eff;
}
</style>