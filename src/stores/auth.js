import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import axios from 'axios'
import { setToken, getToken, removeToken, getAuthHeader } from '../utils/auth.js'
import { refreshAccessToken } from '../utils/tokenRefresh.js'

export const useAuthStore = defineStore('auth', () => {
  // 상태
  const isLoggedIn = ref(false)
  const userInfo = ref(null)
  const isLoading = ref(false)

  // 계산된 속성
  const isAuthenticated = computed(() => isLoggedIn.value && !!getToken())
  const userName = computed(() => userInfo.value?.name || userInfo.value?.email || '사용자')

  // 액션들
  const login = async (credentials) => {
    try {
      isLoading.value = true
      
      const response = await axios.post('/user/login', credentials)
      
      console.log('백엔드 응답:', response.data)
      
      // 응답이 성공인 경우
      if (response.status === 200 && response.data.success) {
        // Access Token 저장 (localStorage)
        const accessToken = response.data.token
        if (accessToken) {
          setToken(accessToken)
          console.log('Access Token이 저장되었습니다.')
          console.log('토큰 타입:', response.data.tokenType)
          console.log('Access Token 만료:', response.data.expiresIn, '초 (', response.data.expiresIn / 60, '분)')
          console.log('Refresh Token은 httpOnly 쿠키에 저장됨')
        } else {
          console.error('Access Token이 응답에 없습니다!')
          throw new Error('Access Token을 받지 못했습니다.')
        }
        
        // 사용자 정보 저장
        userInfo.value = response.data.user
        isLoggedIn.value = true
        
        // 사용자 정보를 localStorage에도 저장 (새로고침 시 복원용)
        if (response.data.user) {
          localStorage.setItem('userInfo', JSON.stringify(response.data.user))
        }
        
        console.log('✅ 로그인 성공:', response.data.message)
        console.log('👤 사용자 정보:', userInfo.value)
        console.log('🕐 타임스탬프:', response.data.timestamp)
        
        return { success: true, data: response.data }
      } else {
        throw new Error(response.data?.message || '로그인 실패')
      }
    } catch (error) {
      console.error('❌ 로그인 에러:', error)
      console.error('📋 에러 상세:', error.response?.data)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  const logout = async () => {
    try {
      // 서버에 로그아웃 요청 (토큰을 블랙리스트에 추가)
      // axios 인터셉터가 자동으로 Authorization: Bearer {token} 헤더 추가
      await axios.post('/user/logout')
      console.log('서버 로그아웃 성공 - 토큰이 블랙리스트에 추가됨')
    } catch (error) {
      console.error('서버 로그아웃 오류:', error)
      // 서버 요청 실패해도 클라이언트는 로그아웃 처리
    } finally {
      // 클라이언트에서 상태 초기화 (항상 실행)
      removeToken()                              // localStorage에서 JWT 토큰 삭제
      localStorage.removeItem('userInfo')        // localStorage에서 사용자 정보 삭제
      isLoggedIn.value = false                   // 로그인 상태 false
      userInfo.value = null                      // 사용자 정보 초기화
      console.log('클라이언트 로그아웃 완료')
    }
  }

  const checkAuthStatus = async () => {
    const token = getToken()
    if (!token) {
      console.log('토큰 없음 - 로그인 필요')
      isLoggedIn.value = false
      userInfo.value = null
      return false
    }

    console.log('토큰 있음 - 로그인 상태 복원')
    
    // JWT 토큰이 있으면 로그인 상태로 설정
    // 실제 사용자 정보는 필요할 때 API로 가져옴
    isLoggedIn.value = true
    
    // 사용자 정보를 localStorage에서 가져오거나 기본값 설정
    const savedUserInfo = localStorage.getItem('userInfo')
    if (savedUserInfo) {
      try {
        userInfo.value = JSON.parse(savedUserInfo)
        console.log('사용자 정보 복원:', userInfo.value)
      } catch (e) {
        console.error('사용자 정보 파싱 오류:', e)
      }
    }
    
    return true
  }

  const clearAuth = () => {
    removeToken()
    localStorage.removeItem('userInfo')
    isLoggedIn.value = false
    userInfo.value = null
  }

  // OAuth 리다이렉트 경로 저장
  const oauthRedirectPath = ref(null)
  
  const setOAuthRedirect = (path) => {
    oauthRedirectPath.value = path
    console.log('OAuth 리다이렉트 경로 저장:', path)
  }
  
  const getOAuthRedirect = () => {
    const path = oauthRedirectPath.value
    oauthRedirectPath.value = null // 사용 후 초기화
    return path
  }

  // 토큰 갱신 (Refresh Token 사용)
  const refreshToken = async () => {
    try {
      const newAccessToken = await refreshAccessToken()
      console.log('스토어: Access Token 갱신 완료')
      return newAccessToken
    } catch (error) {
      console.error('스토어: Access Token 갱신 실패')
      clearAuth()
      throw error
    }
  }

  // 카카오 로그인 (OAuth 인증 코드 처리)
  const kakaoLogin = async (kakaoData) => {
    try {
      isLoading.value = true
      const response = await axios.post('/user/kakao-login', kakaoData)
      
      if (response.data && response.data.accessToken) {
        // 토큰 저장
        localStorage.setItem('accessToken', response.data.accessToken)
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken)
        }
        
        // 사용자 정보 저장
        userInfo.value = response.data.user || {
          id: response.data.userId,
          nickname: response.data.nickname || '카카오 사용자',
          email: response.data.email || '',
          profileImage: response.data.profileImage || ''
        }
        
        // 사용자 정보를 localStorage에 저장
        localStorage.setItem('userInfo', JSON.stringify(userInfo.value))
        
        isLoggedIn.value = true
        
        return { success: true, data: response.data }
      } else {
        throw new Error('카카오 로그인 응답 데이터가 올바르지 않습니다.')
      }
    } catch (error) {
      console.error('카카오 로그인 에러:', error)
      throw error
    } finally {
      isLoading.value = false
    }
  }

  return {
    // 상태
    isLoggedIn,
    userInfo,
    isLoading,
    
    // 계산된 속성
    isAuthenticated,
    userName,
    
    // 액션
    login,
    logout,
    checkAuthStatus,
    clearAuth,
    refreshToken,  // 토큰 갱신 함수 추가
    kakaoLogin,     // 카카오 로그인 함수 추가
    setOAuthRedirect, // OAuth 리다이렉트 경로 저장
    getOAuthRedirect  // OAuth 리다이렉트 경로 가져오기
  }
})

