<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const userId = ref('')
const userIdError = ref('')
const password = ref('')
const passwordConfirm = ref('')
const name = ref('')
const email = ref('')
const address = ref('') // 전체 주소 (서버 전송용)
const postcode = ref('') // 우편번호
const roadAddress = ref('') // 도로명 주소
const jibunAddress = ref('') // 지번 주소
const detailAddress = ref('') // 상세 주소
const extraAddress = ref('') // 참고 항목
const birthDate = ref('')
const allAgreed = ref(false)
const termsAgreed = ref(false)
const privacyAgreed = ref(false)
const marketingAgreed = ref(false)
const isLoading = ref(false)
const signupError = ref('')

// 이메일 인증 관련 상태
const verificationCode = ref('')
const isVerificationSent = ref(false)
const isVerificationLoading = ref(false)
const isEmailVerified = ref(false)
const verificationError = ref('')

// 아이디 중복확인 관련 상태
const isUserIdChecked = ref(false)
const isUserIdCheckLoading = ref(false)

const emit = defineEmits(['signup'])

onMounted(() => {
  // 시스템의 다크모드 설정 확인
  const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
  document.documentElement.classList.toggle('dark', isDarkMode)
  
  // 다크모드 변경 감지
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    document.documentElement.classList.toggle('dark', e.matches)
  })
})

const validateUserId = () => {
  const userIdRegex = /^[a-zA-Z0-9]{6,}$/
  if (!userId.value) {
    userIdError.value = '아이디를 입력해주세요.'
    return false
  }
  if (!userIdRegex.test(userId.value)) {
    userIdError.value = '아이디는 6자 이상의 영문 혹은 숫자 조합이어야 합니다.'
    return false
  }
  userIdError.value = ''
  return true
}

// 아이디 변경 시 중복확인 초기화
const handleUserIdChange = () => {
  isUserIdChecked.value = false
  validateUserId()
}

// 아이디 중복확인
const checkUserIdDuplicate = async () => {
  if (!validateUserId()) {
    return
  }
  
  try {
    isUserIdCheckLoading.value = true
    userIdError.value = ''
    
    const response = await axios.get('/user/check-duplicate', {
      params: {
        userId: userId.value
      }
    })
    
    if (response.status === 200) {
      const { isDuplicate, message } = response.data
      
      if (isDuplicate) {
        // 중복된 아이디
        userIdError.value = message || '이미 사용 중인 아이디입니다.'
        isUserIdChecked.value = false
      } else {
        // 사용 가능한 아이디
        isUserIdChecked.value = true
        alert(message || '사용 가능한 아이디입니다.')
      }
    }
  } catch (error) {
    console.error('아이디 중복확인 에러:', error)
    userIdError.value = error.response?.data?.error || error.response?.data?.message || '중복확인 중 오류가 발생했습니다.'
    isUserIdChecked.value = false
  } finally {
    isUserIdCheckLoading.value = false
  }
}

// 인증번호 발송
const sendVerificationCode = async () => {
  if (!email.value) {
    verificationError.value = '이메일을 입력해주세요.'
    return
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    verificationError.value = '올바른 이메일 형식이 아닙니다.'
    return
  }
  
  try {
    isVerificationLoading.value = true
    verificationError.value = ''
    
    const response = await axios.post('/user/send-auth-email', {
      email: email.value
    })
    
    if (response.status === 200 && response.data.success) {
      isVerificationSent.value = true
      alert('인증번호가 이메일로 발송되었습니다.')
    }
  } catch (error) {
    console.error('인증번호 발송 에러:', error)
    verificationError.value = error.response?.data?.message || '인증번호 발송 중 오류가 발생했습니다.'
  } finally {
    isVerificationLoading.value = false
  }
}

// 인증번호 확인
const verifyCode = async () => {
  if (!verificationCode.value) {
    verificationError.value = '인증번호를 입력해주세요.'
    return
  }
  
  try {
    isVerificationLoading.value = true
    verificationError.value = ''
    
    const response = await axios.post('/user/verify-auth-number', {
      email: email.value,
      authNumber: verificationCode.value
    })
    
    if (response.status === 200 && response.data.success) {
      isEmailVerified.value = true
      alert('이메일 인증이 완료되었습니다.')
    }
  } catch (error) {
    console.error('인증번호 확인 에러:', error)
    verificationError.value = error.response?.data?.message || '인증번호가 일치하지 않거나 만료되었습니다.'
  } finally {
    isVerificationLoading.value = false
  }
}

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
      address.value = fullRoadAddr + extraRoadAddr
      
      // 상세주소 입력 필드로 포커스 이동
      document.getElementById('detailAddress')?.focus()
    }
  }).open()
}

// 상세주소 입력 시 전체 주소 업데이트
const updateFullAddress = () => {
  if (roadAddress.value) {
    address.value = roadAddress.value + (extraAddress.value || '') + (detailAddress.value ? ', ' + detailAddress.value : '')
  }
}

const handleSignup = async () => {
  try {
    if (!validateUserId()) {
      return
    }
    if (!isUserIdChecked.value) {
      alert('아이디 중복확인을 해주세요.')
      return
    }
    if (password.value !== passwordConfirm.value) {
      alert('비밀번호가 일치하지 않습니다.')
      return
    }
    if (!isEmailVerified.value) {
      alert('이메일 인증을 완료해주세요.')
      return
    }

    isLoading.value = true
    signupError.value = ''

    const response = await axios.post("/user/signup", {
      userId: userId.value,
      password: password.value,
      name: name.value,
      email: email.value,
      address: address.value,
      birthDate: birthDate.value,
      termsAgreed: termsAgreed.value,
      privacyAgreed: privacyAgreed.value,
      marketingAgreed: marketingAgreed.value
    });

    if (response.status === 200) {
      alert('회원가입이 완료되었습니다.')
      emit('signup', response.data)
      router.push('/login')
    } else {
      signupError.value = response.data || '회원가입 중 오류가 발생했습니다.'
    }
  } catch (error) {
    console.error('회원가입 에러:', error)
    console.error('에러 응답 데이터:', error.response?.data)
    console.error('에러 상태 코드:', error.response?.status)
    
    if (error.response?.status === 400) {
      userIdError.value = '이미 존재하는 아이디입니다.'
    } 
    else {
      signupError.value = error.response?.data?.message || '회원가입 중 오류가 발생했습니다.'
    }
  } finally {
    isLoading.value = false
  }
}

const toggleAllAgreements = () => {
  const isAllTrue = termsAgreed.value && privacyAgreed.value && marketingAgreed.value
  
  termsAgreed.value = !isAllTrue
  privacyAgreed.value = !isAllTrue
  marketingAgreed.value = !isAllTrue
  allAgreed.value = !isAllTrue
}

const checkAllAgreed = () => {
  allAgreed.value = termsAgreed.value && privacyAgreed.value && marketingAgreed.value
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
            회원가입
          </p>
        </div>
        
        <form class="space-y-6" @submit.prevent="handleSignup">
          <div class="space-y-4">
            <!-- 아이디 -->
            <div class="relative">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">아이디</label>
              <div class="flex gap-2">
                <input
                  v-model="userId"
                  type="text"
                  required
                  :disabled="isUserIdChecked"
                  @input="handleUserIdChange"
                  class="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-600
                         placeholder-gray-500 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                         dark:bg-gray-700 dark:placeholder-gray-400
                         transition-colors duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="6자 이상의 영문 혹은 숫자 조합"
                />
                <button
                  type="button"
                  @click="checkUserIdDuplicate"
                  :disabled="isUserIdCheckLoading || isUserIdChecked"
                  class="px-4 py-3 whitespace-nowrap rounded-lg text-sm font-medium
                         text-white bg-orange-500 hover:bg-orange-600
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
                         transition-colors duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ isUserIdChecked ? '확인완료' : '중복확인' }}
                </button>
              </div>
              <p v-if="userIdError" class="mt-1 text-sm text-red-500">{{ userIdError }}</p>
              <p v-if="isUserIdChecked && !userIdError" class="mt-1 text-sm text-green-600">사용 가능한 아이디입니다.</p>
            </div>

            <!-- 비밀번호 -->
            <div class="relative">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">비밀번호</label>
              <input
                v-model="password"
                type="password"
                required
                class="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-600
                       placeholder-gray-500 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                       dark:bg-gray-700 dark:placeholder-gray-400
                       transition-colors duration-200"
                placeholder="비밀번호를 입력해주세요"
              />
            </div>

            <!-- 비밀번호 확인 -->
            <div class="relative">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">비밀번호 확인</label>
              <input
                v-model="passwordConfirm"
                type="password"
                required
                class="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-600
                       placeholder-gray-500 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                       dark:bg-gray-700 dark:placeholder-gray-400
                       transition-colors duration-200"
                placeholder="비밀번호 확인"
              />
            </div>

            <!-- 이름 -->
            <div class="relative">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">이름</label>
              <input
                v-model="name"
                type="text"
                required
                class="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-600
                       placeholder-gray-500 text-gray-900 dark:text-white
                       focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                       dark:bg-gray-700 dark:placeholder-gray-400
                       transition-colors duration-200"
                placeholder="이름"
              />
            </div>

            <!-- 이메일 -->
            <div class="relative">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">이메일</label>
              <div class="flex gap-2">
                <input
                  v-model="email"
                  type="email"
                  required
                  :disabled="isEmailVerified"
                  class="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-600
                         placeholder-gray-500 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                         dark:bg-gray-700 dark:placeholder-gray-400
                         transition-colors duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="이메일 주소"
                />
                <button
                  type="button"
                  @click="sendVerificationCode"
                  :disabled="isVerificationLoading || isEmailVerified"
                  class="px-4 py-3 whitespace-nowrap rounded-lg text-sm font-medium
                         text-white bg-orange-500 hover:bg-orange-600
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
                         transition-colors duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ isEmailVerified ? '인증완료' : '인증번호 발송' }}
                </button>
              </div>
              <p v-if="verificationError && !isEmailVerified" class="mt-1 text-sm text-red-500">{{ verificationError }}</p>
            </div>

            <!-- 인증번호 입력 -->
            <div v-if="isVerificationSent && !isEmailVerified" class="relative">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">인증번호</label>
              <div class="flex gap-2">
                <input
                  v-model="verificationCode"
                  type="text"
                  required
                  class="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-600
                         placeholder-gray-500 text-gray-900 dark:text-white
                         focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500
                         dark:bg-gray-700 dark:placeholder-gray-400
                         transition-colors duration-200"
                  placeholder="인증번호 6자리"
                />
                <button
                  type="button"
                  @click="verifyCode"
                  :disabled="isVerificationLoading"
                  class="px-4 py-3 whitespace-nowrap rounded-lg text-sm font-medium
                         text-white bg-orange-500 hover:bg-orange-600
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
                         transition-colors duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  인증 확인
                </button>
              </div>
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

            <!-- 생년월일 -->
            <div class="relative">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">생년월일</label>
              <input
                v-model="birthDate"
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
          </div>

          <!-- 약관 동의 -->
          <div class="space-y-4">
            <div class="flex items-center">
              <input
                type="checkbox"
                v-model="allAgreed"
                @change="toggleAllAgreements"
                class="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded
                       dark:border-gray-600 dark:bg-gray-700"
              />
              <label class="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                전체 동의합니다.
              </label>
            </div>
            
            <div class="space-y-2 pl-6">
              <div class="flex items-center">
                <input
                  type="checkbox"
                  v-model="termsAgreed"
                  @change="checkAllAgreed"
                  required
                  class="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded
                         dark:border-gray-600 dark:bg-gray-700"
                />
                <label class="ml-2 block text-sm text-gray-500 dark:text-gray-400">
                  이용약관 동의 (필수)
                </label>
              </div>
              
              <div class="flex items-center">
                <input
                  type="checkbox"
                  v-model="privacyAgreed"
                  @change="checkAllAgreed"
                  required
                  class="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded
                         dark:border-gray-600 dark:bg-gray-700"
                />
                <label class="ml-2 block text-sm text-gray-500 dark:text-gray-400">
                  개인정보 수집 이용 동의 (필수)
                </label>
              </div>
              
              <div class="flex items-center">
                <input
                  type="checkbox"
                  v-model="marketingAgreed"
                  @change="checkAllAgreed"
                  class="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded
                         dark:border-gray-600 dark:bg-gray-700"
                />
                <label class="ml-2 block text-sm text-gray-500 dark:text-gray-400">
                  마케팅 수신 동의 (선택)
                </label>
              </div>
            </div>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg
                   text-sm font-medium text-white bg-orange-500 hover:bg-orange-600
                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
                   transition-colors duration-200
                   disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? '처리중...' : '회원가입' }}
          </button>
          
          <p v-if="signupError" class="mt-2 text-sm text-red-500 text-center">
            {{ signupError }}
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
</style>


