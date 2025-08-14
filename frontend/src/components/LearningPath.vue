<template>
  <el-card class="learning-path-card">
    <template #header>
      <div class="card-header">
        <el-icon><Guide /></el-icon>
        <span>Learning Path</span>
      </div>
    </template>
    
    <div class="learning-path-content">
      <el-collapse v-model="activeSteps" accordion>
        <el-collapse-item 
          v-for="(step, index) in steps" 
          :key="index"
          :title="`Step ${index + 1}: ${step.step}`"
          :name="index.toString()"
        >
          <template #title>
            <div class="step-title">
              <div class="step-number">{{ index + 1 }}</div>
              <div class="step-info">
                <div class="step-name">{{ step.step }}</div>
                <div class="step-time">
                  <el-icon><Clock /></el-icon>
                  {{ step.time }}
                </div>
              </div>
            </div>
          </template>
          
          <div class="step-content">
            <div class="step-description">
              {{ step.step }}
            </div>
            
            <div v-if="step.code" class="step-code">
              <div class="code-header">
                <span>Example Code:</span>
                <el-button 
                  size="small" 
                  type="text" 
                  @click="copyCode(step.code)"
                  :icon="CopyDocument"
                >
                  Copy
                </el-button>
              </div>
              <pre class="code-block"><code>{{ step.code }}</code></pre>
            </div>
            
            <div class="step-actions">
              <el-button 
                size="small" 
                type="success" 
                @click="markCompleted(index)"
                :disabled="completedSteps.includes(index)"
              >
                <el-icon><Check /></el-icon>
                {{ completedSteps.includes(index) ? 'Completed' : 'Mark Complete' }}
              </el-button>
            </div>
          </div>
        </el-collapse-item>
      </el-collapse>
      
      <div v-if="steps.length === 0" class="empty-state">
        <el-icon class="empty-icon"><Guide /></el-icon>
        <p>No learning steps available yet.</p>
      </div>
      
      <div v-if="completedSteps.length > 0" class="progress-section">
        <div class="progress-header">
          <span>Progress: {{ completedSteps.length }} / {{ steps.length }}</span>
          <span class="progress-percentage">
            {{ Math.round((completedSteps.length / steps.length) * 100) }}%
          </span>
        </div>
        <el-progress 
          :percentage="Math.round((completedSteps.length / steps.length) * 100)"
          :stroke-width="8"
          :show-text="false"
        />
      </div>
    </div>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Guide, Clock, CopyDocument, Check } from '@element-plus/icons-vue'
import type { LearningStep } from '../store/learning'

// Props
interface Props {
  steps: LearningStep[]
}

const props = defineProps<Props>()

// State
const activeSteps = ref<string[]>([])
const completedSteps = ref<number[]>([])

// Methods
const copyCode = async (code: string) => {
  try {
    await navigator.clipboard.writeText(code)
    ElMessage.success('Code copied to clipboard')
  } catch (error) {
    console.error('Failed to copy code:', error)
    ElMessage.error('Failed to copy code')
  }
}

const markCompleted = (stepIndex: number) => {
  if (!completedSteps.value.includes(stepIndex)) {
    completedSteps.value.push(stepIndex)
    ElMessage.success(`Step ${stepIndex + 1} marked as completed!`)
  }
}
</script>

<style scoped>
.learning-path-card {
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

.learning-path-content {
  position: relative;
}

.step-title {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.step-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: #409eff;
  color: white;
  border-radius: 50%;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.step-info {
  flex: 1;
  min-width: 0;
}

.step-name {
  font-weight: 500;
  color: #303133;
  margin-bottom: 4px;
  word-wrap: break-word;
}

.step-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.875rem;
  color: #909399;
}

.step-content {
  padding: 16px 0;
}

.step-description {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 16px;
}

.step-code {
  margin-bottom: 16px;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #606266;
}

.code-block {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
  padding: 12px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  color: #495057;
  overflow-x: auto;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.step-actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #909399;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  color: #c0c4cc;
}

.progress-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #606266;
}

.progress-percentage {
  color: #409eff;
  font-weight: 600;
}

/* Responsive Design */
@media (max-width: 768px) {
  .step-title {
    gap: 8px;
  }
  
  .step-number {
    width: 28px;
    height: 28px;
    font-size: 0.75rem;
  }
  
  .step-name {
    font-size: 0.9rem;
  }
  
  .step-time {
    font-size: 0.8rem;
  }
  
  .code-block {
    font-size: 0.8rem;
    padding: 10px;
  }
  
  .code-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .step-content {
    padding: 12px 0;
  }
  
  .progress-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

/* Custom Element Plus Overrides */
:deep(.el-collapse-item__header) {
  padding: 16px 0;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-collapse-item__content) {
  padding: 0;
}

:deep(.el-collapse-item__arrow) {
  margin-left: auto;
}

:deep(.el-button--text) {
  padding: 4px 8px;
  font-size: 0.875rem;
}

:deep(.el-progress-bar__outer) {
  border-radius: 4px;
}

:deep(.el-progress-bar__inner) {
  border-radius: 4px;
}
</style>