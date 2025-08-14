<template>
  <el-dropdown @command="handleLanguageChange" trigger="click">
    <el-button type="primary" class="language-switcher-btn">
      <el-icon class="language-icon"><Switch /></el-icon>
      {{ currentLanguageLabel }}
      <el-icon class="el-icon--right"><arrow-down /></el-icon>
    </el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="zh" :class="{ active: locale === 'zh' }">
          🇨🇳 中文
        </el-dropdown-item>
        <el-dropdown-item command="en" :class="{ active: locale === 'en' }">
          🇺🇸 English
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Switch, ArrowDown } from '@element-plus/icons-vue'

const { locale, t } = useI18n()

const currentLanguageLabel = computed(() => {
  return locale.value === 'zh' ? '中文' : 'English'
})

const handleLanguageChange = (lang: string) => {
  locale.value = lang
  // 保存到本地存储
  localStorage.setItem('language', lang)
}

// 初始化时从本地存储读取语言设置
const savedLanguage = localStorage.getItem('language')
if (savedLanguage && ['zh', 'en'].includes(savedLanguage)) {
  locale.value = savedLanguage
}
</script>

<style scoped>
.language-switcher-btn {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 20px;
  font-weight: 500;
}

.language-switcher-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  border-color: rgba(255, 255, 255, 0.5);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.language-icon {
  font-size: 16px;
}

.el-dropdown-menu .el-dropdown-item.active {
  background-color: var(--el-color-primary);
  color: white;
}

.el-dropdown-menu .el-dropdown-item {
  padding: 8px 16px;
  font-weight: 500;
}
</style>