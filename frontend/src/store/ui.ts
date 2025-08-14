import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  // State
  const loading = ref<boolean>(false)
  const error = ref<string>('')
  const successMessage = ref<string>('')

  // Actions
  function setLoading(isLoading: boolean) {
    loading.value = isLoading
  }

  function setError(errorMessage: string) {
    error.value = errorMessage
    if (errorMessage) {
      // Auto clear error after 5 seconds
      setTimeout(() => {
        error.value = ''
      }, 5000)
    }
  }

  function setSuccess(message: string) {
    successMessage.value = message
    if (message) {
      // Auto clear success message after 3 seconds
      setTimeout(() => {
        successMessage.value = ''
      }, 3000)
    }
  }

  function clearMessages() {
    error.value = ''
    successMessage.value = ''
  }

  return {
    // State
    loading,
    error,
    successMessage,
    // Actions
    setLoading,
    setError,
    setSuccess,
    clearMessages
  }
})