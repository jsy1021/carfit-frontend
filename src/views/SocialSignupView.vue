<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8">
      <div class="space-y-8">
        <div>
          <h1 class="text-center text-4xl font-bold text-gray-900 dark:text-white mb-2">
            추가 정보 입력
          </h1>
          <p class="text-center text-sm text-gray-500 dark:text-gray-400">
            서비스 이용을 위해 추가 정보를 입력해주세요
          </p>
        </div>
        
        <form class="space-y-6" @submit.prevent="handleSubmit">
          <div class="space-y-4">
            <!-- 생년월일 -->
            <div class="relative">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">생년월일</label>
              <input
                v-model="formData.birthDate"
                type="text"
                required
                class="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-600
                       placeholder-gray-500 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                       dark:bg-gray-700 dark:placeholder-gray-400
                       transition-colors duration-200"
                placeholder="YYYY/MM/DD"
              />
            </div>
            
            <!-- 주소 -->
            <div class="relative">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">주소</label>
              
              <!-- 우편번호 -->
              <div class="flex gap-2 mb-2">
                <input
                  v-model="postcode"
                  type="text"
                  readonly
                  placeholder="우편번호"
                  class="appearance-none rounded-lg relative block w-32 px-4 py-3 border border-gray-300 dark:border-gray-600
                         placeholder-gray-500 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                         dark:bg-gray-700 dark:placeholder-gray-400
                         transition-colors duration-200
                         cursor-not-allowed bg-gray-50 dark:bg-gray-600"
                />
                <button
                  type="button"
                  @click="openPostcode"
                  class="px-4 py-3 whitespace-nowrap rounded-lg text-sm font-medium
                         text-white bg-orange-500 hover:bg-orange-600
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
                         transition-colors duration-200"
                >
                  주소 찾기
                </button>
              </div>
              
              <!-- 도로명 주소 -->
              <input
                v-model="roadAddress"
                type="text"
                readonly
                required
                placeholder="도로명 주소"
                class="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-600
                       placeholder-gray-500 text-gray-900 dark:text-white mb-2
                       focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                       dark:bg-gray-700 dark:placeholder-gray-400
                       transition-colors duration-200
                       cursor-not-allowed bg-gray-50 dark:bg-gray-600"
              />
              
              <!-- 상세 주소 -->
              <input
                id="detailAddress"
                v-model="detailAddress"
                @input="updateFullAddress"
                type="text"
                placeholder="상세 주소 (동, 호수 등)"
                class="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-600
                       placeholder-gray-500 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                       dark:bg-gray-700 dark:placeholder-gray-400
                       transition-colors duration-200"
              />
            </div>
          </div>

          <div class="space-y-3">
            <button
              type="submit"
              :disabled="isLoading"
              class="group relative w-full flex justify-center py-3 px-4 border border-transparent
                     text-sm font-medium rounded-lg text-white bg-orange-500 hover:bg-orange-600
                     focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
                     transition-colors duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isLoading ? '처리 중...' : '완료' }}
            </button>
          </div>
          
          <p v-if="errorMessage" class="mt-2 text-sm text-red-500 text-center">
            {{ errorMessage }}
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()
const isLoading = ref(false)
const errorMessage = ref('')

const formData = ref({
  birthDate: '',
  address: '' // 전체 주소 (서버 전송용)
})

// 주소 관련 상태
const postcode = ref('') // 우편번호
const roadAddress = ref('') // 도로명 주소
const jibunAddress = ref('') // 지번 주소
const detailAddress = ref('') // 상세 주소
const extraAddress = ref('') // 참고 항목

onMounted(() => {
  // 소셜 로그인 정보가 없으면 로그인 페이지로 리다이렉트
  const token = localStorage.getItem('jwt_token')
  if (!token) {
    router.push('/login')
  }
})


// 카카오 우편번호 API 호출
const openPostcode = () => {
  new window.daum.Postcode({
    oncomplete: function(data) {
      // 도로명 주소 변수
      let fullRoadAddr = data.roadAddress
      let extraRoadAddr = ''

      // 건물명이 있고, 공동주택일 경우 추가
      if (data.buildingName !== '' && data.apartment === 'Y') {
        extraRoadAddr += (extraRoadAddr !== '' ? ', ' + data.buildingName : data.buildingName)
      }
      
      // 표시할 참고항목이 있을 경우, 괄호까지 추가한 문자열 생성
      if (extraRoadAddr !== '') {
        extraRoadAddr = ' (' + extraRoadAddr + ')'
      }

      // 우편번호와 주소 정보를 해당 필드에 입력
      postcode.value = data.zonecode
      roadAddress.value = fullRoadAddr
      jibunAddress.value = data.jibunAddress
      extraAddress.value = extraRoadAddr
      
      // 전체 주소 조합 (서버 전송용)
      formData.value.address = fullRoadAddr + extraRoadAddr
      
      // 상세주소 입력 필드로 포커스 이동
      document.getElementById('detailAddress')?.focus()
    }
  }).open()
}

// 상세주소 입력 시 전체 주소 업데이트
const updateFullAddress = () => {
  if (roadAddress.value) {
    formData.value.address = roadAddress.value + (extraAddress.value || '') + (detailAddress.value ? ', ' + detailAddress.value : '')
  }
}

const handleSubmit = async () => {
  try {
    isLoading.value = true
    errorMessage.value = ''

    // 백엔드에 추가 정보 전송
    const response = await axios.post('/user/social/profile', {
      birthDate: formData.value.birthDate,
      address: formData.value.address
    })

    if (response.data.success) {
      // 사용자 정보 업데이트
      if (response.data.user) {
        localStorage.setItem('userInfo', JSON.stringify(response.data.user))
        // auth 스토어의 사용자 정보도 업데이트
        authStore.userInfo = response.data.user
        authStore.isLoggedIn = true
      }
      
      // 성공 시 메인 페이지로 이동
      router.push('/')
    } else {
      throw new Error(response.data.message || '추가 정보 저장에 실패했습니다.')
    }
  } catch (error) {
    console.error('추가 정보 저장 오류:', error)
    errorMessage.value = error.response?.data?.message || '오류가 발생했습니다.'
  } finally {
    isLoading.value = false
  }
}
</script>

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
</style>
