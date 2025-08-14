<template>
  <div id="app">
    <!-- Global Loading Overlay -->
    <div v-if="uiStore.loading" class="global-loading">
      <el-loading-service 
        lock="true" 
        text="Processing your request..."
        background="rgba(0, 0, 0, 0.7)"
      />
    </div>

    <!-- Header -->
    <header class="app-header">
      <div class="container">
        <div class="header-left">
          <h1 class="app-title" @click="$router.push('/')">
            📚 {{ $t('home.title') }}
          </h1>
          <p class="app-subtitle">{{ $t('home.subtitle') }}</p>
        </div>
        <div class="header-right">
          <LanguageSwitcher />
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="app-main">
      <router-view />
    </main>

    <!-- Global Error Message -->
    <el-alert
      v-if="uiStore.error"
      :title="uiStore.error"
      type="error"
      class="global-error"
      show-icon
      closable
      @close="uiStore.setError('')"
    />

    <!-- Global Success Message -->
    <el-alert
      v-if="uiStore.successMessage"
      :title="uiStore.successMessage"
      type="success"
      class="global-success"
      show-icon
      closable
      @close="uiStore.setSuccess('')"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUIStore } from './store/ui'
import { useLearningStore } from './store/learning'
import { apiService } from './services/api'
import { useRouter } from 'vue-router'
import LanguageSwitcher from './components/LanguageSwitcher.vue'

const uiStore = useUIStore()
const learningStore = useLearningStore()
const router = useRouter()

// Load session from localStorage on app start
onMounted(async () => {
  const savedSessionId = learningStore.loadFromLocalStorage()
  if (savedSessionId) {
    try {
      uiStore.setLoading(true)
      const sessionData = await apiService.getSession(savedSessionId)
      learningStore.loadSessionData(sessionData)
      
      // Navigate to dashboard if we have session data
      if (router.currentRoute.value.path === '/') {
        router.push(`/dashboard/${savedSessionId}`)
      }
    } catch (error) {
      console.error('Failed to load saved session:', error)
      learningStore.clearLocalStorage()
    } finally {
      uiStore.setLoading(false)
    }
  }
})
</script>

<style>
/* Global Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', '微软雅黑', Arial, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

#app {
  min-height: 100vh;
  position: relative;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* Header Styles */
.app-header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 20px 0;
}

.app-header .container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  text-align: left;
}

.header-right {
  display: flex;
  align-items: center;
}

.app-title {
  color: white;
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.app-title:hover {
  transform: scale(1.05);
}

.app-subtitle {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  font-weight: 300;
}

/* Main Content */
.app-main {
  padding: 40px 0;
  min-height: calc(100vh - 140px);
}

/* Global Loading */
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 9999;
}

/* Global Messages */
.global-error,
.global-success {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9998;
  max-width: 400px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Responsive Design */
@media (max-width: 768px) {
  .app-title {
    font-size: 2rem;
  }
  
  .app-subtitle {
    font-size: 1rem;
  }
  
  .container {
    padding: 0 15px;
  }
  
  .app-main {
    padding: 20px 0;
  }
  
  .global-error,
  .global-success {
    right: 15px;
    left: 15px;
    max-width: none;
  }
}

/* Custom Element Plus Overrides */
.el-loading-mask {
  background-color: rgba(0, 0, 0, 0.7) !important;
}

.el-loading-spinner .el-loading-text {
  color: white !important;
  font-size: 16px !important;
}

/* Utility Classes */
.text-center {
  text-align: center;
}

.mb-20 {
  margin-bottom: 20px;
}

.mt-20 {
  margin-top: 20px;
}

.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 20px;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}
</style>