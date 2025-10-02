<script setup>
import { ref } from 'vue'
import axios from 'axios'

const insuranceError = ref('')
const insuranceResult = ref(null)
const insuranceForm = ref({
  age: '',
  gender: 'MALE',
  carType: '',
  carPrice: null,
  engineSize: null,
  carYear: '',
  annualMileage: null,
  licenseYear: '',
  accidentCount: 0,
  drunkDriving: false,
  trafficViolations: 0,
  region: '',
  isDirect: false,
  options: {
    blackBox: false,
    hasChild: false,
    hasMultipleChildren: false,
    adas: false,
    isMilitaryDriver: false,
    usesPublicTransport: false
  }
})

const sendInsuranceData = async () => {
  try {
    if (!insuranceForm.value.age || !insuranceForm.value.carType || !insuranceForm.value.carPrice) {
      insuranceError.value = '필수 항목을 입력해주세요.'
      return
    }

    const requestData = {
      age: parseInt(insuranceForm.value.age),
      gender: insuranceForm.value.gender,
      carType: insuranceForm.value.carType,
      carPrice: parseInt(insuranceForm.value.carPrice),
      engineSize: parseInt(insuranceForm.value.engineSize),
      carYear: parseInt(insuranceForm.value.carYear),
      annualMileage: parseInt(insuranceForm.value.annualMileage),
      licenseYear: parseInt(insuranceForm.value.licenseYear),
      accidentCount: parseInt(insuranceForm.value.accidentCount || '0'),
      drunkDriving: insuranceForm.value.drunkDriving,
      trafficViolations: parseInt(insuranceForm.value.trafficViolations || '0'),
      region: insuranceForm.value.region,
      isDirect: insuranceForm.value.isDirect,
      options: insuranceForm.value.options
    }

    const response = await axios.post('/api/calculate-insurance', requestData)
    insuranceResult.value = response.data
    insuranceError.value = ''
    console.log('✅ 보험료 계산 결과:', insuranceResult.value)
    console.log('보험료:', insuranceResult.value.insuranceFee)
  } catch (error) {
    console.error('보험료 계산 오류:', error)
    insuranceError.value = '보험료 계산 중 오류가 발생했습니다.'
    insuranceResult.value = null
  }
}

const formatNumber = (value) => {
  if (!value) return ''
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}
</script>

<template>
  <div class="space-y-4">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">자동차 보험료 계산</h3>
      
      <!-- 기본 정보 -->
      <div class="mb-4">
        <h4 class="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">기본 정보</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">나이 *</label>
            <input v-model="insuranceForm.age" type="number" placeholder="예: 30" 
                   class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"/>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">성별 *</label>
            <select v-model="insuranceForm.gender"
                    class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
              <option value="MALE">남성</option>
              <option value="FEMALE">여성</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">면허 취득 연도 *</label>
            <input v-model="insuranceForm.licenseYear" type="number" placeholder="예: 2015" 
                   class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"/>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">지역 *</label>
            <input v-model="insuranceForm.region" placeholder="예: 서울" 
                   class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"/>
          </div>
        </div>
      </div>

      <!-- 차량 정보 -->
      <div class="mb-4">
        <h4 class="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">차량 정보</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">차종 *</label>
            <input v-model="insuranceForm.carType" placeholder="예: 소나타" 
                   class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"/>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">차량 가격 (만원) *</label>
            <input v-model="insuranceForm.carPrice" type="number" placeholder="예: 3000" 
                   class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"/>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">배기량 (cc) *</label>
            <input v-model="insuranceForm.engineSize" type="number" placeholder="예: 2000" 
                   class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"/>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">차량 연식 *</label>
            <input v-model="insuranceForm.carYear" type="number" placeholder="예: 2020" 
                   class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"/>
          </div>
          <div class="md:col-span-2">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">연간 주행거리 (km) *</label>
            <input v-model="insuranceForm.annualMileage" type="number" placeholder="예: 15000" 
                   class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"/>
          </div>
        </div>
      </div>

      <!-- 운전 이력 -->
      <div class="mb-4">
        <h4 class="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">운전 이력</h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">사고 횟수</label>
            <input v-model="insuranceForm.accidentCount" type="number" placeholder="0" 
                   class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"/>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">음주운전 이력</label>
            <select v-model="insuranceForm.drunkDriving"
                    class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
              <option :value="false">없음</option>
              <option :value="true">있음</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">교통법규 위반</label>
            <input v-model="insuranceForm.trafficViolations" type="number" placeholder="0" 
                   class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"/>
          </div>
        </div>
      </div>

      <!-- 추가 옵션 -->
      <div class="mb-4">
        <h4 class="text-sm font-semibold mb-2 text-gray-800 dark:text-gray-200">추가 옵션</h4>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
          <label class="flex items-center space-x-2 cursor-pointer">
            <input v-model="insuranceForm.isDirect" type="checkbox" class="rounded text-blue-600"/>
            <span class="text-xs text-gray-700 dark:text-gray-300">다이렉트 보험</span>
          </label>
          <label class="flex items-center space-x-2 cursor-pointer">
            <input v-model="insuranceForm.options.blackBox" type="checkbox" class="rounded text-blue-600"/>
            <span class="text-xs text-gray-700 dark:text-gray-300">블랙박스 장착</span>
          </label>
          <label class="flex items-center space-x-2 cursor-pointer">
            <input v-model="insuranceForm.options.hasChild" type="checkbox" class="rounded text-blue-600"/>
            <span class="text-xs text-gray-700 dark:text-gray-300">자녀 있음</span>
          </label>
          <label class="flex items-center space-x-2 cursor-pointer">
            <input v-model="insuranceForm.options.hasMultipleChildren" type="checkbox" class="rounded text-blue-600"/>
            <span class="text-xs text-gray-700 dark:text-gray-300">다자녀</span>
          </label>
          <label class="flex items-center space-x-2 cursor-pointer">
            <input v-model="insuranceForm.options.adas" type="checkbox" class="rounded text-blue-600"/>
            <span class="text-xs text-gray-700 dark:text-gray-300">ADAS (첨단운전자보조)</span>
          </label>
          <label class="flex items-center space-x-2 cursor-pointer">
            <input v-model="insuranceForm.options.isMilitaryDriver" type="checkbox" class="rounded text-blue-600"/>
            <span class="text-xs text-gray-700 dark:text-gray-300">군운전 경력</span>
          </label>
          <label class="flex items-center space-x-2 cursor-pointer">
            <input v-model="insuranceForm.options.usesPublicTransport" type="checkbox" class="rounded text-blue-600"/>
            <span class="text-xs text-gray-700 dark:text-gray-300">대중교통 이용</span>
          </label>
        </div>
      </div>

      <button @click="sendInsuranceData"
              class="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium">
        보험료 계산하기
      </button>

      <p v-if="insuranceError" class="text-red-600 dark:text-red-400 text-sm mt-3 text-center">{{ insuranceError }}</p>

      <div v-if="insuranceResult" class="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
        <p class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">💰 예상 연간 보험료</p>
        <p class="text-3xl font-bold text-blue-600 dark:text-blue-400">
          {{ formatNumber(insuranceResult.insuranceFee) }}원
        </p>
        <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">* 실제 보험료는 보험사에 따라 다를 수 있습니다.</p>
      </div>
    </div>
  </div>
</template>

