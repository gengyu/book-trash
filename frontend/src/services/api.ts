import axios, { AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'

// API Types
export interface LearnRequest {
  url: string
  level: 'beginner' | 'advanced'
}

export interface LearnResponse {
  sessionId: string
  summary: string
  keys: Array<{
    concept: string
    description: string
  }>
  path: Array<{
    step: string
    time: string
    code: string
  }>
}

export interface AskRequest {
  sessionId: string
  question: string
}

export interface AskResponse {
  answer: string
}

export interface QuizAnswerRequest {
  sessionId: string
  questionIndex: number
  answer: string
}

export interface QuizAnswerResponse {
  correct: boolean
  explanation: string
}

export interface SessionResponse {
  sessionId: string
  url: string
  userLevel: 'beginner' | 'advanced'
  summary: string
  keys: Array<{
    concept: string
    description: string
  }>
  path: Array<{
    step: string
    time: string
    code: string
  }>
  quiz: Array<{
    question: string
    options: string[]
    correctAnswer: number
    explanation: string
  }>
  dialogHistory: Array<{
    question: string
    answer: string
    timestamp: string
  }>
  createdAt: string
}

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  timeout: 30000, // 30 seconds timeout for AI operations
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url)
    return config
  },
  (error) => {
    console.error('Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log('API Response:', response.status, response.config.url)
    return response
  },
  (error) => {
    console.error('Response Error:', error)
    
    let errorMessage = 'An unexpected error occurred'
    
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response
      errorMessage = data?.error || data?.message || `Server error (${status})`
      
      if (status === 400) {
        errorMessage = data?.error || 'Invalid request'
      } else if (status === 404) {
        errorMessage = 'Resource not found'
      } else if (status === 500) {
        errorMessage = 'Server error. Please try again later.'
      }
    } else if (error.request) {
      // Network error
      errorMessage = 'Network error. Please check your connection.'
    } else if (error.code === 'ECONNABORTED') {
      // Timeout error
      errorMessage = 'Request timeout. The operation is taking too long.'
    }
    
    // Show error message
    ElMessage.error(errorMessage)
    
    return Promise.reject({
      ...error,
      message: errorMessage
    })
  }
)

// API Methods
export const apiService = {
  // Start learning process
  async learn(request: LearnRequest): Promise<LearnResponse> {
    const response = await api.post<LearnResponse>('/learn', request)
    return response.data
  },

  // Ask question
  async ask(request: AskRequest): Promise<AskResponse> {
    const response = await api.post<AskResponse>('/ask', request)
    return response.data
  },

  // Submit quiz answer
  async submitQuizAnswer(request: QuizAnswerRequest): Promise<QuizAnswerResponse> {
    const response = await api.post<QuizAnswerResponse>('/quiz-answer', request)
    return response.data
  },

  // Get session data
  async getSession(sessionId: string): Promise<SessionResponse> {
    const response = await api.get<SessionResponse>(`/session/${sessionId}`)
    return response.data
  }
}

export default api