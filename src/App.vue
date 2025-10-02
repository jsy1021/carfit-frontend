<script setup>
import { ref, onMounted } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth.js'

const router = useRouter()
const authStore = useAuthStore()
const isDarkMode = ref(false)

// 다크모드 초기화 및 토글 함수
const initDarkMode = () => {
  // localStorage에서 저장된 다크모드 설정 확인
  const savedDarkMode = localStorage.getItem('darkMode')
  
  if (savedDarkMode !== null) {
    // 저장된 설정이 있으면 사용
    isDarkMode.value = savedDarkMode === 'true'
  } else {
    // 저장된 설정이 없으면 시스템 설정 사용
    isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  
  // 다크모드 적용
  document.documentElement.classList.toggle('dark', isDarkMode.value)
}

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  document.documentElement.classList.toggle('dark', isDarkMode.value)
  
  // 설정을 localStorage에 저장
  localStorage.setItem('darkMode', isDarkMode.value.toString())
}

// 로그아웃 함수
const logout = async () => {
  await authStore.logout()
  router.push('/login')  // 로그인 페이지로 이동
}

onMounted(() => {
  initDarkMode()
  authStore.checkAuthStatus()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- 상단 네비게이션 바 -->
    <nav class="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <!-- 로고/제목 -->
          <div class="flex items-center">
            <RouterLink to="/" class="text-2xl font-bold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              CarFit
            </RouterLink>
          </div>
          
          <!-- 네비게이션 메뉴 -->
          <div class="flex items-center space-x-4">
            <RouterLink 
              to="/" 
              class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              홈
            </RouterLink>
            
            <!-- 다크모드 토글 버튼 -->
            <button
              @click="toggleDarkMode"
              class="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              :title="isDarkMode ? '라이트 모드로 전환' : '다크 모드로 전환'"
            >
              <!-- 다크모드일 때는 태양 아이콘, 라이트모드일 때는 달 아이콘 -->
              <svg v-if="isDarkMode" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            </button>
            
            <!-- 로그인 상태에 따른 조건부 렌더링 -->
            <div v-if="authStore.isAuthenticated" class="flex items-center space-x-4">
              <span class="text-gray-700 dark:text-gray-300 text-sm">
                안녕하세요, {{ authStore.userName }}님
              </span>
              <button
                @click="logout"
                class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                로그아웃
              </button>
            </div>
            
            <div v-else class="flex items-center space-x-2">
              <RouterLink 
                to="/login" 
                class="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                로그인
              </RouterLink>
              <RouterLink 
                to="/signup" 
                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                회원가입
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
    </nav>

    <!-- 메인 콘텐츠 -->
    <main>
      <RouterView />
    </main>
  </div>
</template>

