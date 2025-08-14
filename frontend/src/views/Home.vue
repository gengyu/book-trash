<template>
  <div class="home">
    <div class="container">
      <div class="hero-section">
        <h2 class="hero-title">{{ $t('home.heroTitle') }}</h2>
        <p class="hero-description">
          {{ $t('home.heroDescription') }}
        </p>
      </div>

      <div class="input-section">
        <InputForm @submit="handleLearningRequest" />
      </div>

      <div class="features-section">
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">🤖</div>
            <h3>{{ $t('home.features.aiTitle') }}</h3>
            <p>{{ $t('home.features.aiDesc') }}</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📚</div>
            <h3>{{ $t('home.features.interactiveTitle') }}</h3>
            <p>{{ $t('home.features.interactiveDesc') }}</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">⚡</div>
            <h3>{{ $t('home.features.instantTitle') }}</h3>
            <p>{{ $t('home.features.instantDesc') }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useLearningStore } from '../store/learning'
import { useUIStore } from '../store/ui'
import { apiService, type LearnRequest } from '../services/api'
import InputForm from '../components/InputForm.vue'

const router = useRouter()
const learningStore = useLearningStore()
const uiStore = useUIStore()

const handleLearningRequest = async (request: LearnRequest) => {
  try {
    uiStore.setLoading(true)
    uiStore.clearMessages()
    
    // Call API to process learning request
    const response = await apiService.learn(request)
    
    // Store the session data
    learningStore.setSession({
      sessionId: response.sessionId,
      summary: response.summary,
      keys: response.keys,
      path: response.path,
      url: request.url,
      userLevel: request.level
    })
    
    // Save session ID to localStorage
    learningStore.saveToLocalStorage()
    
    // Show success message
    uiStore.setSuccess('Learning session created successfully!')
    
    // Navigate to dashboard
    router.push(`/dashboard/${response.sessionId}`)
    
  } catch (error: any) {
    console.error('Failed to create learning session:', error)
    uiStore.setError(error.message || 'Failed to process your request. Please try again.')
  } finally {
    uiStore.setLoading(false)
  }
}
</script>

<style scoped>
.home {
  padding: 0;
}

.hero-section {
  text-align: center;
  margin-bottom: 60px;
}

.hero-title {
  font-size: 3rem;
  font-weight: 700;
  color: white;
  margin-bottom: 20px;
  line-height: 1.2;
}

.hero-description {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.9);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
}

.input-section {
  margin-bottom: 80px;
}

.features-section {
  margin-top: 60px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
  margin-top: 40px;
}

.feature-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 30px;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.feature-icon {
  font-size: 3rem;
  margin-bottom: 20px;
}

.feature-card h3 {
  color: white;
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 15px;
}

.feature-card p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  line-height: 1.6;
}

/* Responsive Design */
@media (max-width: 768px) {
  .hero-title {
    font-size: 2.5rem;
  }
  
  .hero-description {
    font-size: 1.1rem;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .feature-card {
    padding: 20px;
  }
  
  .hero-section {
    margin-bottom: 40px;
  }
  
  .input-section {
    margin-bottom: 40px;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 2rem;
  }
  
  .hero-description {
    font-size: 1rem;
  }
}
</style>