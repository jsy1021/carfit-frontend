// Token Refresh 유틸리티
import axios from 'axios'
import { setToken, getToken, removeToken } from './auth.js'

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  
  failedQueue = []
}

// Access Token 갱신 함수
export const refreshAccessToken = async () => {
  try {
    console.log('🔄 Access Token 갱신 시도...')
    
    const response = await axios.post('/user/refresh', {}, {
      withCredentials: true  // httpOnly 쿠키 포함
    })
    
    const newAccessToken = response.data.token
    
    if (newAccessToken) {
      setToken(newAccessToken)
      console.log('Access Token 갱신 성공')
      return newAccessToken
    }
    
    throw new Error('새 토큰을 받지 못했습니다.')
  } catch (error) {
    console.error('Access Token 갱신 실패:', error)
    removeToken()
    localStorage.removeItem('userInfo')
    throw error
  }
}

// axios 인터셉터 설정
export const setupTokenRefreshInterceptor = () => {
  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config
      
      // 401 에러이고, 재시도하지 않은 요청인 경우
      if (error.response?.status === 401 && !originalRequest._retry) {
        
        // refresh 요청 자체가 실패한 경우 로그아웃 처리
        if (originalRequest.url === '/user/refresh') {
          console.log('Refresh Token 만료 - 로그인 필요')
          window.location.href = '/login'
          return Promise.reject(error)
        }
        
        if (isRefreshing) {
          // 이미 갱신 중이면 대기열에 추가
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject })
          }).then(token => {
            originalRequest.headers['Authorization'] = 'Bearer ' + token
            return axios(originalRequest)
          }).catch(err => {
            return Promise.reject(err)
          })
        }
        
        originalRequest._retry = true
        isRefreshing = true
        
        try {
          const newToken = await refreshAccessToken()
          processQueue(null, newToken)
          
          // 원래 요청 재시도
          originalRequest.headers['Authorization'] = 'Bearer ' + newToken
          return axios(originalRequest)
        } catch (refreshError) {
          processQueue(refreshError, null)
          window.location.href = '/login'
          return Promise.reject(refreshError)
        } finally {
          isRefreshing = false
        }
      }
      
      return Promise.reject(error)
    }
  )
}

