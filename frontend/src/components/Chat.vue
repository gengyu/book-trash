<template>
  <div class="chat-container">
    <div class="chat-header">
      <el-icon><ChatDotRound /></el-icon>
      <span>{{ $t('chat.title') }}</span>
      <div class="chat-status">
        <el-tag size="small" type="success" v-if="!loading">{{ $t('chat.ready') }}</el-tag>
        <el-tag size="small" type="warning" v-else>{{ $t('chat.thinking') }}</el-tag>
      </div>
    </div>
    
    <div class="chat-messages" ref="messagesContainer">
      <div v-if="displayHistory.length === 0" class="empty-chat">
        <el-icon class="empty-icon"><ChatDotRound /></el-icon>
        <p>{{ $t('chat.startConversation') }}</p>
        <div class="suggested-questions">
          <div class="suggestions-title">{{ $t('chat.suggestedQuestions') }}</div>
          <el-button 
            v-for="suggestion in suggestedQuestions" 
            :key="suggestion"
            size="small"
            type="text"
            @click="askSuggestion(suggestion)"
            class="suggestion-btn"
          >
            {{ suggestion }}
          </el-button>
        </div>
      </div>
      
      <div 
        v-for="(message, index) in displayHistory" 
        :key="index"
        class="message-item"
      >
        <div class="message-question">
          <div class="message-avatar user-avatar">
            <el-icon><User /></el-icon>
          </div>
          <div class="message-content">
            <div class="message-text">{{ message.question }}</div>
            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
        
        <div class="message-answer">
          <div class="message-avatar ai-avatar">
            <el-icon><ChatDotRound /></el-icon>
          </div>
          <div class="message-content">
            <div class="message-text" v-html="formatAnswer(message.answer)"></div>
            <div class="message-actions">
              <el-button 
                size="small" 
                type="text" 
                @click="copyMessage(message.answer)"
                :icon="CopyDocument"
              >
                {{ $t('chat.copy') }}
              </el-button>
              <el-button 
                size="small" 
                type="text" 
                @click="likeMessage(index)"
                :icon="CircleCheck"
                :class="{ 'liked': likedMessages.includes(index) }"
              >
                {{ likedMessages.includes(index) ? $t('chat.liked') : $t('chat.like') }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Loading message -->
      <div v-if="loading" class="message-item loading-message">
        <div class="message-answer">
          <div class="message-avatar ai-avatar">
            <el-icon class="loading-icon"><ChatDotRound /></el-icon>
          </div>
          <div class="message-content">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="chat-input">
      <el-input
        v-model="currentQuestion"
        type="textarea"
        :rows="2"
        :placeholder="$t('chat.placeholder')"
        :disabled="loading"
        @keydown.enter.exact.prevent="sendMessage"
        @keydown.enter.shift.exact="() => {}"
        class="question-input"
      >
        <template #suffix>
          <div class="input-actions">
            <el-button 
              type="primary" 
              :disabled="!currentQuestion.trim() || loading"
              @click="sendMessage"
              :loading="loading"
              size="small"
            >
              <el-icon v-if="!loading"><Send /></el-icon>
              {{ $t('chat.send') }}
            </el-button>
          </div>
        </template>
      </el-input>
      <div class="input-hint">
        {{ $t('chat.inputHint') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { 
  ChatDotRound, 
  User, 
  CopyDocument, 
  Promotion,
  CircleCheck
} from '@element-plus/icons-vue'
import { apiService } from '../services/api'
import type { DialogMessage } from '../store/learning'

// Props
interface Props {
  sessionId: string
  dialogHistory: DialogMessage[]
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
  newMessage: [message: DialogMessage]
}>()

// I18n
const { t } = useI18n()

// State
const currentQuestion = ref('')
const loading = ref(false)
const messagesContainer = ref<HTMLElement>()
const likedMessages = ref<number[]>([])

// Computed
const displayHistory = computed(() => props.dialogHistory || [])

// Suggested questions
const suggestedQuestions = computed(() => [
  t('chat.suggestion1'),
  t('chat.suggestion2'),
  t('chat.suggestion3'),
  t('chat.suggestion4')
])

// Methods
const sendMessage = async () => {
  const question = currentQuestion.value.trim()
  if (!question || loading.value) return
  
  try {
    loading.value = true
    
    // Call API
    const response = await apiService.ask({
      sessionId: props.sessionId,
      question
    })
    
    // Create message object
    const newMessage: DialogMessage = {
      question,
      answer: response.answer,
      timestamp: new Date().toISOString()
    }
    
    // Emit new message
    emit('newMessage', newMessage)
    
    // Clear input
    currentQuestion.value = ''
    
    // Scroll to bottom
    await nextTick()
    scrollToBottom()
    
  } catch (error: any) {
    console.error('Failed to send message:', error)
    ElMessage.error(error.message || t('chat.sendError'))
  } finally {
    loading.value = false
  }
}

const askSuggestion = (suggestion: string) => {
  currentQuestion.value = suggestion
  sendMessage()
}

const copyMessage = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success(t('chat.copySuccess'))
  } catch (error) {
    console.error('Failed to copy message:', error)
    ElMessage.error(t('chat.copyError'))
  }
}

const likeMessage = (index: number) => {
  if (!likedMessages.value.includes(index)) {
    likedMessages.value.push(index)
    ElMessage.success(t('chat.feedbackThanks'))
  }
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const formatAnswer = (answer: string) => {
  // Simple formatting for better readability
  return answer
    .replace(/\n/g, '<br>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
}

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// Watch for new messages to auto-scroll
watch(
  () => props.dialogHistory.length,
  async () => {
    await nextTick()
    scrollToBottom()
  }
)
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 500px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: white;
}

.chat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
  font-weight: 600;
  color: #303133;
}

.chat-status {
  margin-left: auto;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.empty-chat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #909399;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  color: #c0c4cc;
}

.suggested-questions {
  margin-top: 20px;
}

.suggestions-title {
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 12px;
  color: #606266;
}

.suggestion-btn {
  display: block;
  margin-bottom: 8px;
  text-align: left;
}

.message-item {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-question,
.message-answer {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.message-question {
  justify-content: flex-end;
}

.message-question .message-content {
  background: #409eff;
  color: white;
  border-radius: 16px 16px 4px 16px;
}

.message-answer .message-content {
  background: #f0f2f5;
  color: #303133;
  border-radius: 16px 16px 16px 4px;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-avatar {
  background: #409eff;
  color: white;
}

.ai-avatar {
  background: #67c23a;
  color: white;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  position: relative;
}

.message-text {
  line-height: 1.6;
  word-wrap: break-word;
}

.message-time {
  font-size: 0.75rem;
  opacity: 0.7;
  margin-top: 4px;
}

.message-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
}

.liked {
  color: #f56c6c !important;
}

.loading-message .ai-avatar .loading-icon {
  animation: pulse 1.5s ease-in-out infinite;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  align-items: center;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #909399;
  animation: typing 1.4s ease-in-out infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

.chat-input {
  padding: 16px;
  border-top: 1px solid #ebeef5;
  background: #f8f9fa;
  border-radius: 0 0 8px 8px;
}

.question-input {
  margin-bottom: 8px;
}

.input-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-hint {
  font-size: 0.75rem;
  color: #909399;
  text-align: center;
}

/* Animations */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .chat-container {
    height: 400px;
  }
  
  .message-content {
    max-width: 85%;
    padding: 10px 12px;
  }
  
  .message-avatar {
    width: 28px;
    height: 28px;
  }
  
  .chat-messages {
    padding: 12px;
    gap: 16px;
  }
  
  .chat-input {
    padding: 12px;
  }
}

/* Custom Element Plus Overrides */
:deep(.el-textarea__inner) {
  border-radius: 8px;
  resize: none;
}

:deep(.el-button--text) {
  padding: 4px 8px;
  font-size: 0.875rem;
}

:deep(.el-input__suffix) {
  align-items: flex-end;
  padding-bottom: 8px;
}

/* Code styling in messages */
:deep(code) {
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 4px;
  border-radius: 3px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875em;
}

:deep(strong) {
  font-weight: 600;
}
</style>