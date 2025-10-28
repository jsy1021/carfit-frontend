<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const userId = ref('')
const password = ref('')
const isDarkMode = ref(false)
const loginError = ref('')

const emit = defineEmits(['login'])

onMounted(() => {
  // 시스템의 다크모드 설정 확인
  isDarkMode.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  
  // 다크모드 변경 감지
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    isDarkMode.value = e.matches
    document.documentElement.classList.toggle('dark', e.matches)
  })
  
  // 초기 다크모드 설정 적용
  document.documentElement.classList.toggle('dark', isDarkMode.value)
})

const handleLogin = async () => {
  try {
    loginError.value = ''

    console.log('로그인 요청 데이터:', {
      userId: userId.value,
      password: password.value
    })

    const result = await authStore.login({
      userId: userId.value,
      password: password.value
    })

    if (result.success) {
      emit('login', result.data)
      router.push('/')
    }
  } catch (error) {
    console.error('로그인 에러:', error)
    console.error('에러 응답 데이터:', error.response?.data)
    console.error('에러 상태 코드:', error.response?.status)
    console.error('에러 헤더:', error.response?.headers)
    
    if (error.response?.status === 401) {
      loginError.value = '아이디 또는 비밀번호가 일치하지 않습니다.'
    } else {
      loginError.value = error.response?.data?.message || '로그인 중 오류가 발생했습니다.'
    }
  }
}

const goToSignup = () => {
  router.push('/signup')
}

// 소셜 로그인
const isKakaoLoading = ref(false)
const isNaverLoading = ref(false)
const isGoogleLoading = ref(false)

const handleKakaoLogin = () => {
  try {
    isKakaoLoading.value = true
    loginError.value = ''
    
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${import.meta.env.VITE_KAKAO_CLIENT_ID}&redirect_uri=${import.meta.env.VITE_KAKAO_REDIRECT_URI}&response_type=code`
    
    console.log('카카오 로그인 시작')
    console.log('이동할 URL:', kakaoAuthUrl)
    
    
    window.location.href = kakaoAuthUrl
  } catch (err) {
    console.error('❌ 카카오 로그인 URL 생성 실패:', err)
    loginError.value = '카카오 로그인을 시작할 수 없습니다.'
    isKakaoLoading.value = false
  }
}

const handleNaverLogin = () => {
  try {
    isNaverLoading.value = true
    loginError.value = ''
    
    // state는 CSRF 공격 방지를 위한 랜덤 문자열
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    localStorage.setItem('naver_oauth_state', state)
    
    const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?client_id=${import.meta.env.VITE_NAVER_CLIENT_ID}&redirect_uri=${import.meta.env.VITE_NAVER_REDIRECT_URI}&response_type=code&state=${state}`
    
    console.log('네이버 로그인 시작')
    console.log('이동할 URL:', naverAuthUrl)
    
    window.location.href = naverAuthUrl
  } catch (err) {
    console.error('❌ 네이버 로그인 URL 생성 실패:', err)
    loginError.value = '네이버 로그인을 시작할 수 없습니다.'
    isNaverLoading.value = false
  }
}

const handleGoogleLogin = () => {
  try {
    isGoogleLoading.value = true
    loginError.value = ''
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${import.meta.env.VITE_GOOGLE_CLIENT_ID}&redirect_uri=${import.meta.env.VITE_GOOGLE_REDIRECT_URI}&response_type=code&scope=openid email profile`
    
    console.log('구글 로그인 시작')
    console.log('이동할 URL:', googleAuthUrl)
    
    window.location.href = googleAuthUrl
  } catch (err) {
    console.error('❌ 구글 로그인 URL 생성 실패:', err)
    loginError.value = '구글 로그인을 시작할 수 없습니다.'
    isGoogleLoading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8">
      <div class="space-y-8">
        <div>
          <h1 class="text-center text-4xl font-bold text-gray-900 dark:text-white mb-2">
            CarFit
          </h1>
          <p class="text-center text-sm text-gray-500 dark:text-gray-400">
            안전한 차량 관리의 시작
          </p>
        </div>
        <form class="space-y-6" @submit.prevent="handleLogin">
          <div class="space-y-4">
            <div class="relative">
              <input
                v-model="userId"
                id="userId"
                name="userId"
                type="text"
                required
                class="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-600
                       placeholder-gray-500 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                       dark:bg-gray-700 dark:placeholder-gray-400
                       transition-colors duration-200"
                placeholder="아이디"
              />
            </div>
            <div class="relative">
              <input
                v-model="password"
                id="password"
                name="password"
                type="password"
                required
                class="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-600
                       placeholder-gray-500 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                       dark:bg-gray-700 dark:placeholder-gray-400
                       transition-colors duration-200"
                placeholder="비밀번호"
              />
            </div>
          </div>

          <div class="space-y-3">
            <button
              type="submit"
              :disabled="authStore.isLoading"
              class="group relative w-full flex justify-center py-3 px-4 border border-transparent
                     text-sm font-medium rounded-lg text-white bg-orange-500 hover:bg-orange-600
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
                     transition-colors duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ authStore.isLoading ? '로그인 중...' : '로그인' }}
            </button>
            <button
              type="button"
              @click="goToSignup"
              class="group relative w-full flex justify-center py-3 px-4 border border-orange-500
                     text-sm font-medium rounded-lg text-orange-500 bg-white hover:bg-orange-50
                     dark:bg-transparent dark:text-orange-400 dark:hover:bg-orange-900/20
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
                     transition-colors duration-200"
            >
              회원가입
            </button>
            
            <!-- 구분선 -->
            <div class="relative flex items-center my-4">
              <div class="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
              <span class="flex-shrink-0 px-3 text-sm text-gray-500 dark:text-gray-400">또는</span>
              <div class="flex-grow border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            
            <!-- 카카오 로그인 버튼 -->
            <button
              type="button"
              class="kakao-btn"
              @click="handleKakaoLogin"
              :disabled="isKakaoLoading"
            >
              <svg class="social-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path
                  fill="#3c1e1e"
                  d="M12 2C6.48 2 2 5.91 2 10.5c0 3.11 2.4 5.82 5.86 7.12L6.5 22l5.31-3.07c.06 0 .13.01.19.01 5.52 0 10-3.91 10-8.5S17.52 2 12 2z" />
              </svg>
              카카오로 로그인
            </button>
            
            <!-- 네이버 로그인 버튼 -->
            <button
              type="button"
              class="naver-btn"
              @click="handleNaverLogin"
              :disabled="isNaverLoading"
            >
              <svg class="social-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path fill="white" d="M4 4h4l4 7V4h4v16h-4l-4-7v7H4z" />
              </svg>
              네이버로 로그인
            </button>
            
            <!-- 구글 로그인 버튼 -->
            <button
              type="button"
              class="google-btn"
              @click="handleGoogleLogin"
              :disabled="isGoogleLoading"
            >
              <svg class="social-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                <path
                  fill="#FFC107"
                  d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.4-5.8 7.5-11.3 7.5-6.9 0-12.5-5.6-12.5-12.5S17.1 10.5 24 10.5c3.1 0 5.9 1.1 8.1 3.1l5.7-5.7C34.5 4.4 29.6 2.5 24 2.5 12.4 2.5 3 11.9 3 23.5S12.4 44.5 24 44.5c11.6 0 21-9.4 21-21 0-1.5-.2-3-.4-4.5z" />
                <path
                  fill="#FF3D00"
                  d="M6.3 14.7l6.6 4.8c1.8-4.4 5.9-7.5 11.1-7.5 3.1 0 5.9 1.1 8.1 3.1l5.7-5.7C34.5 4.4 29.6 2.5 24 2.5 15.2 2.5 7.5 7.8 3.6 15.1z" />
                <path
                  fill="#4CAF50"
                  d="M24 44.5c5.4 0 10.3-2.1 14-5.5l-6.5-5.4c-2.1 1.5-4.8 2.4-7.5 2.4-5.5 0-10.2-3.6-11.8-8.5H6.3c2.4 7.1 9.2 12 17.7 12z" />
                <path
                  fill="#1976D2"
                  d="M43.6 20.5H42V20H24v8h11.3c-.7 2-1.9 3.8-3.4 5.2l.1.1 6.5 5.4c-1.8 1.7-4 3-6.4 3.8l.3.3c7-6.4 11.1-15.2 11.1-25.3 0-1.5-.2-3-.4-4.5z" />
              </svg>
              구글로 로그인
            </button>
          </div>
          
          <p v-if="loginError" class="mt-2 text-sm text-red-500 text-center">
            {{ loginError }}
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.appearance-none:focus {
  outline: 2px solid transparent;
  outline-offset: 2px;
}

/* 다크모드에서 input autofill 스타일 수정 */
@media (prefers-color-scheme: dark) {
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus {
    -webkit-box-shadow: 0 0 0px 1000px #374151 inset;
    -webkit-text-fill-color: white;
    transition: background-color 5000s ease-in-out 0s;
  }
}

/* 소셜 로그인 버튼 공통 스타일 */
.kakao-btn, .naver-btn, .google-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  cursor: pointer;
}

.kakao-btn {
  background-color: #FEE500;
  color: #3c1e1e;
}

.kakao-btn:hover:not(:disabled) {
  background-color: #FDD835;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.naver-btn {
  background-color: #03C75A;
  color: white;
}

.naver-btn:hover:not(:disabled) {
  background-color: #02b851;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.google-btn {
  background-color: #fff;
  color: #757575;
  border: 1px solid #dadce0;
}

.google-btn:hover:not(:disabled) {
  background-color: #f8f9fa;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.kakao-btn:disabled, .naver-btn:disabled, .google-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.social-icon {
  width: 24px;
  height: 24px;
}
</style>


