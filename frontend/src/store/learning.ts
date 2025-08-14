import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface KeyPoint {
  concept: string
  description: string
}

export interface LearningStep {
  step: string
  time: string
  code: string
}

export interface DialogMessage {
  question: string
  answer: string
  timestamp: string
}

export interface QuizQuestion {
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
}

export const useLearningStore = defineStore('learning', () => {
  // State
  const sessionId = ref<string>('')
  const url = ref<string>('')
  const userLevel = ref<'beginner' | 'advanced'>('beginner')
  const summary = ref<string>('')
  const keyPoints = ref<KeyPoint[]>([])
  const learningPath = ref<LearningStep[]>([])
  const quiz = ref<QuizQuestion[]>([])
  const dialogHistory = ref<DialogMessage[]>([])
  const createdAt = ref<string>('')

  // Getters
  const hasSession = computed(() => !!sessionId.value)
  const hasContent = computed(() => !!summary.value && keyPoints.value.length > 0)
  const hasQuiz = computed(() => quiz.value.length > 0)
  const dialogCount = computed(() => dialogHistory.value.length)

  // Actions
  function setSession(data: {
    sessionId: string
    summary: string
    keys: KeyPoint[]
    path: LearningStep[]
    url?: string
    userLevel?: 'beginner' | 'advanced'
  }) {
    sessionId.value = data.sessionId
    summary.value = data.summary
    keyPoints.value = data.keys || []
    learningPath.value = data.path || []
    if (data.url) url.value = data.url
    if (data.userLevel) userLevel.value = data.userLevel
  }

  function setQuiz(quizData: QuizQuestion[]) {
    quiz.value = quizData || []
  }

  function addDialogMessage(message: DialogMessage) {
    dialogHistory.value.push(message)
  }

  function setDialogHistory(history: DialogMessage[]) {
    dialogHistory.value = history || []
  }

  function loadSessionData(data: {
    sessionId: string
    url: string
    userLevel: 'beginner' | 'advanced'
    summary: string
    keys: KeyPoint[]
    path: LearningStep[]
    quiz: QuizQuestion[]
    dialogHistory: DialogMessage[]
    createdAt: string
  }) {
    sessionId.value = data.sessionId
    url.value = data.url
    userLevel.value = data.userLevel
    summary.value = data.summary
    keyPoints.value = data.keys || []
    learningPath.value = data.path || []
    quiz.value = data.quiz || []
    dialogHistory.value = data.dialogHistory || []
    createdAt.value = data.createdAt
  }

  function clearSession() {
    sessionId.value = ''
    url.value = ''
    userLevel.value = 'beginner'
    summary.value = ''
    keyPoints.value = []
    learningPath.value = []
    quiz.value = []
    dialogHistory.value = []
    createdAt.value = ''
  }

  // Persistence
  function saveToLocalStorage() {
    if (sessionId.value) {
      localStorage.setItem('book-trash-session-id', sessionId.value)
    }
  }

  function loadFromLocalStorage(): string | null {
    return localStorage.getItem('book-trash-session-id')
  }

  function clearLocalStorage() {
    localStorage.removeItem('book-trash-session-id')
  }

  return {
    // State
    sessionId,
    url,
    userLevel,
    summary,
    keyPoints,
    learningPath,
    quiz,
    dialogHistory,
    createdAt,
    // Getters
    hasSession,
    hasContent,
    hasQuiz,
    dialogCount,
    // Actions
    setSession,
    setQuiz,
    addDialogMessage,
    setDialogHistory,
    loadSessionData,
    clearSession,
    saveToLocalStorage,
    loadFromLocalStorage,
    clearLocalStorage
  }
})