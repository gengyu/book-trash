<template>
  <div class="quiz-container">
    <div class="quiz-header">
      <el-icon><Edit /></el-icon>
      <span>{{ $t('quiz.title') }}</span>
      <div class="quiz-progress">
        <el-tag size="small" type="info">
          {{ currentQuestionIndex + 1 }} / {{ totalQuestions }}
        </el-tag>
      </div>
    </div>
    
    <div class="quiz-content" v-if="currentQuestion">
      <div class="question-section">
        <div class="question-number">
          {{ $t('quiz.questionNumber', { number: currentQuestionIndex + 1 }) }}
        </div>
        <div class="question-text">
          {{ currentQuestion.question }}
        </div>
        <div class="question-type">
          <el-tag size="small" :type="getQuestionTypeColor(currentQuestion.type)">
            {{ formatQuestionType(currentQuestion.type) }}
          </el-tag>
        </div>
      </div>
      
      <div class="answer-section">
        <!-- Multiple Choice -->
        <div v-if="currentQuestion.type === 'multiple_choice'" class="multiple-choice">
          <el-radio-group 
            v-model="selectedAnswer" 
            :disabled="isAnswered"
            class="answer-options"
          >
            <el-radio 
              v-for="(option, index) in currentQuestion.options" 
              :key="index"
              :label="option"
              class="answer-option"
              :class="getOptionClass(option)"
            >
              <span class="option-text">{{ option }}</span>
              <el-icon v-if="isAnswered && option === currentQuestion.correctAnswer" class="correct-icon">
                <Check />
              </el-icon>
              <el-icon v-if="isAnswered && option === selectedAnswer && option !== currentQuestion.correctAnswer" class="wrong-icon">
                <Close />
              </el-icon>
            </el-radio>
          </el-radio-group>
        </div>
        
        <!-- True/False -->
        <div v-else-if="currentQuestion.type === 'true_false'" class="true-false">
          <el-radio-group 
            v-model="selectedAnswer" 
            :disabled="isAnswered"
            class="answer-options"
          >
            <el-radio 
              label="True"
              class="answer-option"
              :class="getOptionClass('True')"
            >
              <span class="option-text">True</span>
              <el-icon v-if="isAnswered && 'True' === currentQuestion.correctAnswer" class="correct-icon">
                <Check />
              </el-icon>
              <el-icon v-if="isAnswered && 'True' === selectedAnswer && 'True' !== currentQuestion.correctAnswer" class="wrong-icon">
                <Close />
              </el-icon>
            </el-radio>
            <el-radio 
              label="False"
              class="answer-option"
              :class="getOptionClass('False')"
            >
              <span class="option-text">False</span>
              <el-icon v-if="isAnswered && 'False' === currentQuestion.correctAnswer" class="correct-icon">
                <Check />
              </el-icon>
              <el-icon v-if="isAnswered && 'False' === selectedAnswer && 'False' !== currentQuestion.correctAnswer" class="wrong-icon">
                <Close />
              </el-icon>
            </el-radio>
          </el-radio-group>
        </div>
        
        <!-- Short Answer -->
        <div v-else-if="currentQuestion.type === 'short_answer'" class="short-answer">
          <el-input
            v-model="selectedAnswer"
            type="textarea"
            :rows="3"
            :placeholder="$t('quiz.enterAnswer')"
            :disabled="isAnswered"
            class="answer-input"
          />
          <div v-if="isAnswered" class="answer-feedback">
            <div class="correct-answer">
              <strong>{{ $t('quiz.suggestedAnswer') }}</strong>
              <p>{{ currentQuestion.correctAnswer }}</p>
            </div>
            <div class="user-answer">
              <strong>{{ $t('quiz.yourAnswer') }}</strong>
              <p>{{ selectedAnswer }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Explanation -->
      <div v-if="isAnswered && currentQuestion.explanation" class="explanation-section">
        <div class="explanation-header">
          <el-icon><InfoFilled /></el-icon>
          <span>{{ $t('quiz.explanation') }}</span>
        </div>
        <div class="explanation-text">
          {{ currentQuestion.explanation }}
        </div>
      </div>
      
      <!-- Action Buttons -->
      <div class="quiz-actions">
        <el-button 
          v-if="!isAnswered"
          type="primary"
          :disabled="!selectedAnswer || submitting"
          :loading="submitting"
          @click="submitAnswer"
        >
          {{ $t('quiz.submitAnswer') }}
        </el-button>
        
        <div v-else class="answered-actions">
          <div class="result-indicator">
            <el-icon v-if="isCorrect" class="result-icon correct">
              <Check />
            </el-icon>
            <el-icon v-else class="result-icon incorrect">
              <Close />
            </el-icon>
            <span class="result-text">
              {{ isCorrect ? $t('quiz.correct') : $t('quiz.incorrect') }}
            </span>
          </div>
          
          <div class="navigation-buttons">
            <el-button 
              v-if="currentQuestionIndex > 0"
              @click="previousQuestion"
              :icon="ArrowLeft"
            >
              {{ $t('quiz.previous') }}
            </el-button>
            
            <el-button 
              v-if="currentQuestionIndex < totalQuestions - 1"
              type="primary"
              @click="nextQuestion"
            >
              {{ $t('quiz.nextQuestion') }}
              <el-icon><ArrowRight /></el-icon>
            </el-button>
            
            <el-button 
              v-else
              type="success"
              @click="finishQuiz"
              :icon="Trophy"
            >
              {{ $t('quiz.finishQuiz') }}
            </el-button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Quiz Summary -->
    <div v-if="showSummary" class="quiz-summary">
      <div class="summary-header">
        <el-icon class="summary-icon"><Trophy /></el-icon>
        <h3>{{ $t('quiz.complete') }}</h3>
      </div>
      
      <div class="summary-stats">
        <div class="stat-item">
          <div class="stat-value">{{ correctAnswers }}</div>
          <div class="stat-label">{{ $t('quiz.correct') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ totalQuestions }}</div>
          <div class="stat-label">{{ $t('quiz.total') }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ Math.round((correctAnswers / totalQuestions) * 100) }}%</div>
          <div class="stat-label">{{ $t('quiz.score') }}</div>
        </div>
      </div>
      
      <div class="summary-actions">
        <el-button @click="restartQuiz" :icon="Refresh">
          {{ $t('quiz.restart') }}
        </el-button>
        <el-button type="primary" @click="generateNewQuiz">
          {{ $t('quiz.generateNew') }}
        </el-button>
      </div>
    </div>
    
    <!-- Empty State -->
    <div v-if="!currentQuestion && !showSummary" class="empty-quiz">
      <el-icon class="empty-icon"><Edit /></el-icon>
      <p>{{ $t('quiz.noQuestions') }}</p>
      <el-button type="primary" @click="generateNewQuiz">
        {{ $t('quiz.generate') }}
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { 
  Edit, 
  Check, 
  Close, 
  InfoFilled, 
  ArrowLeft, 
  ArrowRight, 
  Trophy,
  Refresh
} from '@element-plus/icons-vue'
import { apiService } from '../services/api'
import type { QuizQuestion } from '../store/learning'

// Props
interface Props {
  sessionId: string
  questions: QuizQuestion[]
}

const props = withDefaults(defineProps<Props>(), {
  sessionId: '',
  questions: () => []
})

// Emits
const emit = defineEmits<{
  generateQuiz: []
  questionAnswered: [questionIndex: number, isCorrect: boolean]
}>()

// I18n
const { t } = useI18n()

// State
const currentQuestionIndex = ref(0)
const selectedAnswer = ref('')
const submitting = ref(false)
const answeredQuestions = ref<Set<number>>(new Set())
const correctAnswers = ref(0)
const showSummary = ref(false)

// Computed
const currentQuestion = computed(() => {
  return props.questions[currentQuestionIndex.value] || null
})

const totalQuestions = computed(() => props.questions.length)

const isAnswered = computed(() => {
  return answeredQuestions.value.has(currentQuestionIndex.value)
})

const isCorrect = computed(() => {
  if (!isAnswered.value || !currentQuestion.value) return false
  
  if (currentQuestion.value.type === 'short_answer') {
    // For short answer, we consider it correct if submitted (manual evaluation)
    return true
  }
  
  return selectedAnswer.value === currentQuestion.value.correctAnswer
})

// Methods
const submitAnswer = async () => {
  if (!selectedAnswer.value || !currentQuestion.value || submitting.value) return
  
  try {
    submitting.value = true
    
    // Call API to submit answer
    await apiService.submitQuizAnswer({
      sessionId: props.sessionId,
      questionIndex: currentQuestionIndex.value,
      answer: selectedAnswer.value
    })
    
    // Mark question as answered
    answeredQuestions.value.add(currentQuestionIndex.value)
    
    // Update correct answers count
    if (isCorrect.value) {
      correctAnswers.value++
    }
    
    // Emit event
    emit('questionAnswered', currentQuestionIndex.value, isCorrect.value)
    
    ElMessage.success('Answer submitted successfully!')
    
  } catch (error: any) {
    console.error('Failed to submit answer:', error)
    ElMessage.error(error.message || 'Failed to submit answer')
  } finally {
    submitting.value = false
  }
}

const nextQuestion = () => {
  if (currentQuestionIndex.value < totalQuestions.value - 1) {
    currentQuestionIndex.value++
    selectedAnswer.value = ''
  }
}

const previousQuestion = () => {
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--
    selectedAnswer.value = ''
  }
}

const finishQuiz = () => {
  showSummary.value = true
  ElMessage.success(`Quiz completed! You scored ${correctAnswers.value}/${totalQuestions.value}`)
}

const restartQuiz = () => {
  currentQuestionIndex.value = 0
  selectedAnswer.value = ''
  answeredQuestions.value.clear()
  correctAnswers.value = 0
  showSummary.value = false
}

const generateNewQuiz = () => {
  emit('generateQuiz')
  restartQuiz()
}

const getQuestionTypeColor = (type: string) => {
  switch (type) {
    case 'multiple_choice': return 'primary'
    case 'true_false': return 'success'
    case 'short_answer': return 'warning'
    default: return 'info'
  }
}

const formatQuestionType = (type: string) => {
  switch (type) {
    case 'multiple_choice': return 'Multiple Choice'
    case 'true_false': return 'True/False'
    case 'short_answer': return 'Short Answer'
    default: return type
  }
}

const getOptionClass = (option: string) => {
  if (!isAnswered.value) return ''
  
  const isCorrectOption = option === currentQuestion.value?.correctAnswer
  const isSelectedOption = option === selectedAnswer.value
  
  if (isCorrectOption) return 'correct-option'
  if (isSelectedOption && !isCorrectOption) return 'wrong-option'
  
  return ''
}

// Watch for question changes to reset selected answer
watch(currentQuestionIndex, () => {
  selectedAnswer.value = ''
})

// Watch for questions prop changes to reset quiz
watch(
  () => props.questions,
  () => {
    restartQuiz()
  },
  { deep: true }
)
</script>

<style scoped>
.quiz-container {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background: white;
  overflow: hidden;
}

.quiz-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border-bottom: 1px solid #ebeef5;
  background: #f8f9fa;
  font-weight: 600;
  color: #303133;
}

.quiz-progress {
  margin-left: auto;
}

.quiz-content {
  padding: 24px;
}

.question-section {
  margin-bottom: 24px;
}

.question-number {
  font-size: 0.875rem;
  color: #909399;
  margin-bottom: 8px;
}

.question-text {
  font-size: 1.125rem;
  font-weight: 500;
  color: #303133;
  line-height: 1.6;
  margin-bottom: 12px;
}

.question-type {
  margin-bottom: 16px;
}

.answer-section {
  margin-bottom: 24px;
}

.answer-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.answer-option {
  padding: 16px;
  border: 2px solid #ebeef5;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.answer-option:hover {
  border-color: #409eff;
  background: #f0f8ff;
}

.answer-option.correct-option {
  border-color: #67c23a;
  background: #f0f9ff;
}

.answer-option.wrong-option {
  border-color: #f56c6c;
  background: #fef0f0;
}

.option-text {
  flex: 1;
  font-weight: 500;
}

.correct-icon {
  color: #67c23a;
  margin-left: 8px;
}

.wrong-icon {
  color: #f56c6c;
  margin-left: 8px;
}

.answer-input {
  margin-bottom: 16px;
}

.answer-feedback {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}

.correct-answer,
.user-answer {
  margin-bottom: 12px;
}

.correct-answer:last-child,
.user-answer:last-child {
  margin-bottom: 0;
}

.correct-answer strong,
.user-answer strong {
  color: #303133;
  display: block;
  margin-bottom: 4px;
}

.correct-answer p,
.user-answer p {
  margin: 0;
  color: #606266;
  line-height: 1.5;
}

.explanation-section {
  background: #f0f8ff;
  border: 1px solid #b3d8ff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 24px;
}

.explanation-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 8px;
}

.explanation-text {
  color: #303133;
  line-height: 1.6;
}

.quiz-actions {
  display: flex;
  justify-content: center;
}

.answered-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.result-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.125rem;
  font-weight: 600;
}

.result-icon {
  font-size: 1.5rem;
}

.result-icon.correct {
  color: #67c23a;
}

.result-icon.incorrect {
  color: #f56c6c;
}

.result-text {
  color: #303133;
}

.navigation-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: center;
}

.quiz-summary {
  padding: 32px;
  text-align: center;
}

.summary-header {
  margin-bottom: 24px;
}

.summary-icon {
  font-size: 3rem;
  color: #f7ba2a;
  margin-bottom: 16px;
}

.summary-header h3 {
  margin: 0;
  color: #303133;
  font-size: 1.5rem;
}

.summary-stats {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 32px;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.875rem;
  color: #909399;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.summary-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
}

.empty-quiz {
  padding: 48px;
  text-align: center;
  color: #909399;
}

.empty-icon {
  font-size: 3rem;
  margin-bottom: 16px;
  color: #c0c4cc;
}

/* Responsive Design */
@media (max-width: 768px) {
  .quiz-content {
    padding: 16px;
  }
  
  .summary-stats {
    gap: 20px;
  }
  
  .stat-value {
    font-size: 1.5rem;
  }
  
  .navigation-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .summary-actions {
    flex-direction: column;
    align-items: center;
  }
}

/* Custom Element Plus Overrides */
:deep(.el-radio) {
  width: 100%;
  margin-right: 0;
  height: auto;
}

:deep(.el-radio__label) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding-left: 8px;
}

:deep(.el-radio__input) {
  margin-right: 12px;
}

:deep(.el-textarea__inner) {
  border-radius: 8px;
  resize: vertical;
  min-height: 80px;
}
</style>