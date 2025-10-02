// JWT 토큰 관리 유틸리티

const TOKEN_KEY = 'jwt_token'

// 토큰 저장
export const setToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token)
}

// 토큰 가져오기
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY)
}

// 토큰 제거
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY)
}

// 토큰 존재 여부 확인
export const hasToken = () => {
  return !!getToken()
}

// Authorization 헤더 생성
export const getAuthHeader = () => {
  const token = getToken()
  return token ? `Bearer ${token}` : null
}

