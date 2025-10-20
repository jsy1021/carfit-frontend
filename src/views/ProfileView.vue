<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth.js'
import { getToken } from '../utils/auth.js'
import axios from 'axios'

const authStore = useAuthStore()
const isEditing = ref(false)
const editForm = ref({
  name: '',
  email: '',
  address: ''
})

// 프로필 이미지 업로드 관련
const selectedFile = ref(null)
const isUploading = ref(false)
const fileInput = ref(null)

// 편집 모드 토글
const toggleEdit = () => {
  if (!isEditing.value) {
    // 편집 모드로 전환 시 현재 정보로 폼 초기화
    editForm.value = {
      name: authStore.userInfo?.name || '',
      email: authStore.userInfo?.email || '',
      address: authStore.userInfo?.address || ''
    }
  }
  isEditing.value = !isEditing.value
}

// 프로필 수정 저장
const saveProfile = async () => {
  try {
    // TODO: API 호출로 프로필 수정
    console.log('프로필 수정:', editForm.value)
    
    // 임시로 로컬 상태만 업데이트
    authStore.userInfo = {
      ...authStore.userInfo,
      ...editForm.value
    }
    
    // localStorage도 업데이트
    localStorage.setItem('userInfo', JSON.stringify(authStore.userInfo))
    
    isEditing.value = false
    alert('프로필이 수정되었습니다.')
  } catch (error) {
    console.error('프로필 수정 실패:', error)
    alert('프로필 수정에 실패했습니다.')
  }
}

// 편집 취소
const cancelEdit = () => {
  isEditing.value = false
  editForm.value = {
    name: '',
    email: '',
    address: ''
  }
}

// 파일 선택 핸들러
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    // 파일 타입 검증 (이미지만 허용)
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.')
      return
    }
    
    // 파일 크기 검증 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      alert('파일 크기는 5MB 이하여야 합니다.')
      return
    }
    
    selectedFile.value = file
    // fetch 버전과 axios 버전 중 선택
    // uploadProfileImage()  // fetch 버전
    uploadProfileImageWithAxios()  // axios 버전 (권장)
  }
}

// 프로필 이미지 업로드
const uploadProfileImage = async () => {
  if (!selectedFile.value) return
  
  try {
    isUploading.value = true
    
    const token = getToken()
    if (!token) {
      alert('로그인이 필요합니다.')
      return
    }
    
    console.log('🔍 토큰 확인:', token ? '토큰 있음' : '토큰 없음')
    console.log('🔍 토큰 길이:', token ? token.length : 0)
    console.log('🔍 토큰 앞 20자:', token ? token.substring(0, 20) + '...' : '없음')
    
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    
    console.log('🔍 요청 URL:', '/api/profile/image/upload')
    console.log('🔍 요청 헤더:', {
      'Authorization': `Bearer ${token}`
    })
    
    const response = await fetch('/api/profile/image/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    })
    
    console.log('🔍 응답 상태:', response.status)
    console.log('🔍 응답 헤더:', Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (result.success && result.profileImageUrl) {
      // 사용자 정보 업데이트
      authStore.userInfo = {
        ...authStore.userInfo,
        profileImageUrl: result.profileImageUrl
      }
      
      // localStorage도 업데이트
      localStorage.setItem('userInfo', JSON.stringify(authStore.userInfo))
      
      alert('프로필 이미지가 성공적으로 변경되었습니다.')
      console.log('새 프로필 이미지 URL:', result.profileImageUrl)
    } else {
      throw new Error(result.message || '이미지 업로드에 실패했습니다.')
    }
  } catch (error) {
    console.error('프로필 이미지 업로드 실패:', error)
    alert('프로필 이미지 업로드에 실패했습니다: ' + error.message)
  } finally {
    isUploading.value = false
    selectedFile.value = null
    // 파일 입력 초기화
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

// 파일 선택 버튼 클릭
const triggerFileSelect = () => {
  fileInput.value?.click()
}

// axios를 사용한 프로필 이미지 업로드 (대안)
const uploadProfileImageWithAxios = async () => {
  if (!selectedFile.value) return
  
  try {
    isUploading.value = true
    
    const formData = new FormData()
    formData.append('file', selectedFile.value)
    
    console.log('🔍 axios로 업로드 시도')
    
    const response = await axios.post('/api/profile/image/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    
    console.log('🔍 axios 응답:', response.data)
    
    if (response.data.success && response.data.profileImageUrl) {
      // 사용자 정보 업데이트
      authStore.userInfo = {
        ...authStore.userInfo,
        profileImageUrl: response.data.profileImageUrl
      }
      
      // localStorage도 업데이트
      localStorage.setItem('userInfo', JSON.stringify(authStore.userInfo))
      
      alert('프로필 이미지가 성공적으로 변경되었습니다.')
      console.log('새 프로필 이미지 URL:', response.data.profileImageUrl)
    } else {
      throw new Error(response.data.message || '이미지 업로드에 실패했습니다.')
    }
  } catch (error) {
    console.error('axios 프로필 이미지 업로드 실패:', error)
    alert('프로필 이미지 업로드에 실패했습니다: ' + (error.response?.data?.message || error.message))
  } finally {
    isUploading.value = false
    selectedFile.value = null
    // 파일 입력 초기화
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

onMounted(() => {
  // 사용자 정보가 없으면 메인 페이지로 리다이렉트
  if (!authStore.isAuthenticated) {
    window.location.href = '/'
  }
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- 페이지 헤더 -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">마이페이지</h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">프로필 정보를 확인하고 수정할 수 있습니다.</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- 프로필 카드 -->
        <div class="lg:col-span-1">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <!-- 프로필 이미지 -->
            <div class="text-center">
              <div class="w-32 h-32 mx-auto rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 mb-4">
                <img 
                  v-if="authStore.userInfo?.profileImageUrl" 
                  :src="authStore.userInfo.profileImageUrl" 
                  :alt="authStore.userName + ' 프로필 이미지'"
                  class="w-full h-full object-cover"
                  @error="handleImageError"
                />
                <!-- 기본 아바타 -->
                <div v-else class="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              </div>
              
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ authStore.userName }}
              </h2>
              <p class="text-gray-600 dark:text-gray-400 mt-1">
                {{ authStore.userInfo?.role || 'USER' }}
              </p>
            </div>

            <!-- 프로필 이미지 업로드 버튼 -->
            <div class="mt-6 text-center">
              <input 
                ref="fileInput"
                type="file" 
                accept="image/*" 
                @change="handleFileSelect"
                class="hidden"
              />
              <button 
                @click="triggerFileSelect"
                :disabled="isUploading"
                class="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center mx-auto"
              >
                <svg v-if="isUploading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else class="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {{ isUploading ? '업로드 중...' : '프로필 이미지 변경' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 프로필 정보 -->
        <div class="lg:col-span-2">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-white">프로필 정보</h3>
              <button 
                v-if="!isEditing"
                @click="toggleEdit"
                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                수정하기
              </button>
            </div>

            <!-- 편집 모드가 아닐 때 -->
            <div v-if="!isEditing" class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">이름</label>
                <div class="text-lg text-gray-900 dark:text-white">
                  {{ authStore.userInfo?.name || '정보 없음' }}
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">이메일</label>
                <div class="text-lg text-gray-900 dark:text-white">
                  {{ authStore.userInfo?.email || '정보 없음' }}
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">주소</label>
                <div class="text-lg text-gray-900 dark:text-white">
                  {{ authStore.userInfo?.address || '정보 없음' }}
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">사용자 ID</label>
                <div class="text-lg text-gray-900 dark:text-white">
                  {{ authStore.userInfo?.userId || '정보 없음' }}
                </div>
              </div>
            </div>

            <!-- 편집 모드일 때 -->
            <div v-else class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">이름</label>
                <input 
                  v-model="editForm.name"
                  type="text"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="이름을 입력하세요"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">이메일</label>
                <input 
                  v-model="editForm.email"
                  type="email"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="이메일을 입력하세요"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">주소</label>
                <textarea 
                  v-model="editForm.address"
                  rows="3"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="주소를 입력하세요"
                ></textarea>
              </div>

              <!-- 편집 버튼들 -->
              <div class="flex space-x-3 pt-4">
                <button 
                  @click="saveProfile"
                  class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  저장하기
                </button>
                <button 
                  @click="cancelEdit"
                  class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
// 이미지 로드 실패 처리
const handleImageError = (event) => {
  console.log('프로필 이미지 로드 실패')
  event.target.style.display = 'none'
}
</script>
