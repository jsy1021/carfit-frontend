<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
    <div class="max-w-md w-full bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8 text-center">
      <!-- 로딩 스피너 -->
      <div v-if="isLoading" class="space-y-6">
        <div class="flex justify-center">
          <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500"></div>
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {{ currentProvider }} 로그인 처리 중...
          </h2>
          <p class="text-gray-600 dark:text-gray-400">
            잠시만 기다려주세요
          </p>
        </div>
      </div>

      <!-- 성공 메시지 -->
      <div v-else-if="isSuccess" class="space-y-6">
        <div class="flex justify-center">
          <div class="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            로그인 성공!
          </h2>
          <p class="text-gray-600 dark:text-gray-400">
            {{ redirectMessage }}
          </p>
        </div>
      </div>

      <!-- 에러 메시지 -->
      <div v-else-if="isError" class="space-y-6">
        <div class="flex justify-center">
          <div class="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
            <svg class="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
        </div>
        <div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            로그인 실패
          </h2>
          <p class="text-gray-600 dark:text-gray-400">
            {{ errorMessage }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import { setToken, getToken } from '../utils/auth.js'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const isLoading = ref(true)
const isSuccess = ref(false)
const isError = ref(false)
const errorMessage = ref('')
const redirectMessage = ref('')
const currentProvider = ref('카카오') // 현재 로그인 중인 provider

onMounted(() => {
  handleSocialCallback()
})

// 소셜 로그인 콜백 처리 (카카오/구글)
const handleSocialCallback = async () => {
  const code = route.query.code
  const accessToken = route.query.accessToken
  const expiresIn = route.query.expiresIn
  const isNewUser = route.query.isNewUser

  // 디버깅을 위한 URL 파라미터 확인
  console.log('🔍 소셜 로그인 콜백 파라미터:')
  console.log('📍 현재 URL:', window.location.href)
  console.log('📍 현재 경로:', route.path)
  console.log('🔑 code:', code)
  console.log('🎫 accessToken:', accessToken)
  console.log('⏰ expiresIn:', expiresIn)
  console.log('👤 isNewUser:', isNewUser)
  console.log('🌐 전체 query:', route.query)
  
  console.log('🔐 토큰 확인:', getToken())
  console.log('🔐 localStorage accessToken:', localStorage.getItem('accessToken'))

  // 카카오, 구글, 네이버 로그인인 경우 (code가 있는 경우)
  if (code) {
    // provider 확인 (URL 경로 또는 추가 로직으로 판단)
    const path = route.path
    const href = window.location.href
    let provider = 'kakao' // 기본값
    
    if (path.includes('google') || href.includes('google')) {
      provider = 'google'
      currentProvider.value = '구글'
    } else if (path.includes('naver') || href.includes('naver')) {
      provider = 'naver'
      currentProvider.value = '네이버'
      // 네이버는 state 파라미터가 있음
      const state = route.query.state
      const savedState = localStorage.getItem('naver_oauth_state')
      
      // state 검증
      if (!state || state !== savedState) {
        throw new Error('네이버 로그인 state 검증 실패')
      }
      localStorage.removeItem('naver_oauth_state')
    } else {
      currentProvider.value = '카카오'
    }
    
    console.log(`✅ ${provider} 로그인 감지 - code 처리`)
    
    try {
      // 소셜 로그인 API 호출
      let apiEndpoint
      if (provider === 'google') {
        apiEndpoint = 'http://localhost:8080/oauth/google/login'
      } else if (provider === 'naver') {
        apiEndpoint = 'http://localhost:8080/oauth/naver/login'
      } else {
        apiEndpoint = 'http://localhost:8080/oauth/kakao/login'
      }
      
      console.log(`📤 백엔드로 ${provider} 로그인 요청 전송...`)
      console.log('📍 요청 URL:', apiEndpoint)
      console.log('🔑 전송할 code:', code)
      
      const response = await axios.get(apiEndpoint, {
        params: { code },
        withCredentials: true // 쿠키로 refreshToken을 받기 위해 필요
      })
      
      console.log(`✅ ${provider} 로그인 API 응답 수신!`)
      console.log('📋 전체 응답 객체:', response)
      console.log('📋 응답 상태 코드:', response.status)
      console.log('📋 응답 헤더:', response.headers)
      console.log('📋 응답 데이터:', response.data)
      
      // 백엔드 응답 구조: { success, message, token, tokenType, expiresIn, user, timestamp }
      const { token, user } = response.data
      
      console.log('📦 파싱된 데이터:')
      console.log('- token (accessToken):', token)
      console.log('- user:', user)
      
      // 토큰 저장 (백엔드에서는 refreshToken을 쿠키로 보냄)
      if (token) {
        setToken(token)
      }
      
      // 사용자 정보 저장 (백엔드 user 객체 구조에 맞춤)
      const userInfo = {
        id: user.userId || user.id,
        name: user.name,
        email: user.email,
        profileImage: user.profileImageUrl || user.profileImage,
        address: user.address,
        role: user.role
      }
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
      
      // auth 스토어 상태 업데이트
      authStore.userInfo = userInfo
      authStore.isLoggedIn = true
      
      // 성공 처리
      isLoading.value = false
      isSuccess.value = true
      console.log(`✅ ${provider} 로그인 성공!`)
      
      // 사용자 정보 완성도 확인 (address가 null이거나 비어있으면 추가 정보 필요)
      const needsAdditionalInfo = !userInfo.address || userInfo.address === null
      
      // 리다이렉트 메시지 설정
      redirectMessage.value = needsAdditionalInfo 
        ? '추가 정보 입력 페이지로 이동합니다' 
        : '메인 페이지로 이동합니다'
      
      // 2초 후 조건부 리다이렉트
      setTimeout(() => {
        if (needsAdditionalInfo) {
          console.log('추가 정보가 필요합니다. 추가 정보 입력 페이지로 이동합니다.')
          router.push('/social-signup')
        } else {
          console.log('사용자 정보가 완전합니다. 메인 페이지로 이동합니다.')
          router.push('/')
        }
      }, 2000)
    } catch (error) {
      console.error(`🚨 ${provider} 로그인 처리 오류!`)
      console.error('📊 에러 객체 전체:', error)
      console.error('📊 에러 상세 정보:')
      console.error('- 에러 메시지:', error.message)
      console.error('- 에러 코드:', error.code)
      console.error('- 에러 이름:', error.name)
      console.error('- 에러 스택:', error.stack)
      
      if (error.response) {
        // 서버가 응답을 반환했지만 에러 상태 코드
        console.error('📊 응답 에러 정보:')
        console.error('- 응답 상태:', error.response.status)
        console.error('- 응답 상태 텍스트:', error.response.statusText)
        console.error('- 응답 헤더:', error.response.headers)
        console.error('- 응답 데이터:', error.response.data)
      } else if (error.request) {
        // 요청은 했지만 응답을 받지 못함
        console.error('📊 요청 에러 정보:')
        console.error('- 요청 객체:', error.request)
        console.error('- 요청 URL:', error.config?.url)
      }
      
      console.error('📋 요청 설정 정보:')
      console.error('- 요청 URL:', error.config?.url)
      console.error('- 요청 메서드:', error.config?.method)
      console.error('- 요청 파라미터:', error.config?.params)
      console.error('- 요청 데이터:', error.config?.data)
      console.error('- 요청 헤더:', error.config?.headers)
      
      // 에러 처리
      isLoading.value = false
      isError.value = true
      errorMessage.value = error.response?.data?.error || error.response?.data?.message || error.message || `${provider} 로그인 중 오류가 발생했습니다.`
      
      // 에러 발생 시 자동으로 /login으로 리다이렉트하지 않음 - 콘솔에서 확인 가능
      console.error('⚠️ 에러 발생으로 인해 페이지가 유지됩니다. 콘솔을 확인하세요.')
    }
  } else {
    // 인증 정보가 없는 경우
    console.error('❌ 인증 정보를 받을 수 없습니다.')
    console.log('🔍 받은 파라미터:', route.query)
    isLoading.value = false
    isError.value = true
    errorMessage.value = '인증 정보를 받을 수 없습니다.'
  }
}

</script>

<style scoped>
/* 스타일 제거 */
</style>
