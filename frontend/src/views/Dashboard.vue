<template>
  <div class="dashboard">
    <div class="container">
      <!-- Session Info -->
      <div class="session-info" v-if="learningStore.hasSession">
        <el-card class="info-card">
          <div class="session-header">
            <h2>{{ $t('dashboard.title') }}</h2>
            <el-tag type="info" size="large">{{ learningStore.userLevel }}</el-tag>
          </div>
          <div class="session-url">
            <el-icon><Link /></el-icon>
            <a :href="learningStore.url" target="_blank" class="url-link">
              {{ learningStore.url }}
            </a>
          </div>
        </el-card>
      </div>

      <!-- Main Content Grid -->
      <div class="content-grid" v-if="learningStore.hasContent">
        <!-- Summary Section -->
        <div class="summary-section">
          <SummaryDisplay :summary="learningStore.summary" />
        </div>

        <!-- Key Points Section -->
        <div class="key-points-section">
          <el-card class="content-card">
            <template #header>
              <div class="card-header">
                <el-icon><Key /></el-icon>
                <span>{{ $t('dashboard.keyConcepts') }}</span>
              </div>
            </template>
            <div class="key-points-list">
              <div 
                v-for="(point, index) in learningStore.keyPoints" 
                :key="index"
                class="key-point-item"
              >
                <div class="point-concept">{{ point.concept }}</div>
                <div class="point-description">{{ point.description }}</div>
              </div>
            </div>
          </el-card>
        </div>

        <!-- Learning Path Section -->
        <div class="learning-path-section">
          <LearningPath :steps="learningStore.learningPath" />
        </div>

        <!-- Interactive Section -->
        <div class="interactive-section">
          <el-tabs v-model="activeTab" class="interactive-tabs">
            <el-tab-pane :label="$t('dashboard.chat')" name="chat">
              <Chat 
                :session-id="learningStore.sessionId"
                :dialog-history="learningStore.dialogHistory"
                @new-message="handleNewMessage"
              />
            </el-tab-pane>
            <el-tab-pane :label="$t('dashboard.quiz')" name="quiz" v-if="learningStore.hasQuiz">
              <Quiz 
                :session-id="learningStore.sessionId"
                :questions="learningStore.quiz"
              />
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <!-- Loading State -->
      <div v-else-if="uiStore.loading" class="loading-state">
        <el-card class="loading-card">
          <div class="loading-content">
            <el-icon class="loading-icon"><Loading /></el-icon>
            <h3>{{ $t('dashboard.processing') }}</h3>
            <p>{{ $t('dashboard.processingDesc') }}</p>
          </div>
        </el-card>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <el-card class="empty-card">
          <div class="empty-content">
            <el-icon class="empty-icon"><Document /></el-icon>
            <h3>{{ $t('dashboard.noSession') }}</h3>
            <p>{{ $t('dashboard.noSessionDesc') }}</p>
            <el-button type="primary" size="large" @click="$router.push('/')">
              {{ $t('dashboard.startLearning') }}
            </el-button>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLearningStore } from '../store/learning'
import { useUIStore } from '../store/ui'
import { apiService } from '../services/api'
import SummaryDisplay from '../components/SummaryDisplay.vue'
import LearningPath from '../components/LearningPath.vue'
import Chat from '../components/Chat.vue'
import Quiz from '../components/Quiz.vue'
import { Link, Key, Loading, Document } from '@element-plus/icons-vue'
import type { DialogMessage } from '../store/learning'

const route = useRoute()
const router = useRouter()
const learningStore = useLearningStore()
const uiStore = useUIStore()

const activeTab = ref('chat')

// Load session data if sessionId is provided in route
onMounted(async () => {
  const sessionId = route.params.sessionId as string
  
  if (sessionId && sessionId !== learningStore.sessionId) {
    try {
      uiStore.setLoading(true)
      const sessionData = await apiService.getSession(sessionId)
      learningStore.loadSessionData(sessionData)
      learningStore.saveToLocalStorage()
    } catch (error: any) {
      console.error('Failed to load session:', error)
      uiStore.setError('Failed to load learning session')
      router.push('/')
    } finally {
      uiStore.setLoading(false)
    }
  }
})

const handleNewMessage = (message: DialogMessage) => {
  learningStore.addDialogMessage(message)
}
</script>

<style scoped>
.dashboard {
  padding: 0;
}

.session-info {
  margin-bottom: 30px;
}

.info-card {
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.session-header h2 {
  margin: 0;
  color: #303133;
  font-size: 1.5rem;
  font-weight: 600;
}

.session-url {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #606266;
}

.url-link {
  color: #409eff;
  text-decoration: none;
  word-break: break-all;
}

.url-link:hover {
  text-decoration: underline;
}

.content-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 30px;
}

.summary-section,
.key-points-section,
.learning-path-section {
  grid-column: span 1;
}

.interactive-section {
  grid-column: span 2;
}

.content-card {
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

.key-points-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.key-point-item {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #409eff;
}

.point-concept {
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  font-size: 1.1rem;
}

.point-description {
  color: #606266;
  line-height: 1.6;
}

.interactive-tabs {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 20px;
}

.loading-state,
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.loading-card,
.empty-card {
  max-width: 500px;
  width: 100%;
  border-radius: 12px;
  border: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.loading-content,
.empty-content {
  text-align: center;
  padding: 40px 20px;
}

.loading-icon,
.empty-icon {
  font-size: 4rem;
  color: #409eff;
  margin-bottom: 20px;
}

.loading-content h3,
.empty-content h3 {
  color: #303133;
  margin-bottom: 12px;
  font-size: 1.5rem;
}

.loading-content p,
.empty-content p {
  color: #606266;
  margin-bottom: 24px;
  line-height: 1.6;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .content-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .summary-section,
  .key-points-section,
  .learning-path-section,
  .interactive-section {
    grid-column: span 1;
  }
}

@media (max-width: 768px) {
  .session-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .content-grid {
    gap: 15px;
  }
  
  .interactive-tabs {
    padding: 15px;
  }
}

@media (max-width: 480px) {
  .session-url {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .key-point-item {
    padding: 12px;
  }
  
  .point-concept {
    font-size: 1rem;
  }
}

/* Custom Element Plus Overrides */
:deep(.el-tabs__header) {
  margin-bottom: 20px;
}

:deep(.el-tabs__nav-wrap::after) {
  display: none;
}

:deep(.el-tabs__item) {
  font-weight: 500;
  font-size: 1rem;
}

:deep(.el-tabs__item.is-active) {
  color: #409eff;
  font-weight: 600;
}
</style>