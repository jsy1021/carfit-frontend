<script setup>
import { ref } from 'vue'
import axios from 'axios'

const gasolineStations = ref([])
const addressInput = ref('')
const searchError = ref('')
const stationLoading = ref(false)

const searchGasStations = async () => {
  if (!addressInput.value.trim()) {
    searchError.value = '주소를 입력해주세요.'
    gasolineStations.value = []
    return
  }

  stationLoading.value = true
  try {
    searchError.value = ''
    console.log('🔍 주유소 검색 시작:', addressInput.value)
    
    const { x, y } = await getCoordinatesFromBackend(addressInput.value)
    console.log('📍 좌표 변환 성공:', { x, y })
    
    const response = await axios.get('/api/stations/nearby', {
      params: { x, y, radius: 5000, sort: 1, limit: 10 }
    })
    console.log('⛽ 주유소 데이터:', response.data)
    
    gasolineStations.value = response.data.stations.slice(0, 10)
    
    if (gasolineStations.value.length === 0) {
      searchError.value = '주변에 주유소가 없습니다.'
    } else {
      console.log(`✅ ${gasolineStations.value.length}개 주유소 검색 완료`)
      console.log('첫 번째 주유소 데이터 구조:', gasolineStations.value[0])
      console.log('사용 가능한 속성들:', Object.keys(gasolineStations.value[0]))
    }
  } catch (err) {
    console.error('❌ 주유소 검색 오류:', err)
    console.error('에러 상세:', err.response?.data)
    searchError.value = err.response?.data?.message || '주소를 찾을 수 없습니다. 올바른 주소를 입력해주세요.'
    gasolineStations.value = []
  } finally {
    stationLoading.value = false
  }
}

const getCoordinatesFromBackend = async (address) => {
  const res = await axios.get('/api/geocode', { params: { address } })
  return res.data
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
    <div class="flex gap-2 mb-4">
      <input v-model="addressInput" 
             @keyup.enter="searchGasStations"
             :disabled="stationLoading"
             placeholder="주소 입력 (예: 서울시 강남구)"
             class="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white disabled:opacity-50"/>
      <button @click="searchGasStations"
              :disabled="stationLoading"
              class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        {{ stationLoading ? '검색중...' : '검색' }}
      </button>
    </div>

    <p v-if="searchError" class="text-red-600 dark:text-red-400 text-sm mb-4">{{ searchError }}</p>

    <!-- 로딩 상태 -->
    <div v-if="stationLoading" class="text-center py-8">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
      <p class="mt-3 text-gray-600 dark:text-gray-400 text-sm">주유소 검색 중...</p>
    </div>

    <!-- 검색 결과 -->
    <div v-else-if="gasolineStations.length > 0" class="space-y-2 max-h-96 overflow-y-auto">
      <div v-for="(station, index) in gasolineStations" :key="station.POLL_DIV_CD || index"
           class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <div class="flex justify-between items-start gap-4">
          <div class="flex-1 min-w-0">
            <p class="font-medium text-gray-900 dark:text-white truncate">
              {{ station.OS_NM }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 truncate">
              {{ station.VAN_ADR }}
            </p>
            <div class="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span>거리: {{ station.DISTANCE }}m</span>
              <span>•</span>
              <span>브랜드: {{ station.POLL_DIV_CD }}</span>
            </div>
          </div>
          <div class="flex flex-col items-end">
            <p class="text-lg font-bold text-blue-600 dark:text-blue-400">
              {{ station.PRICE }}원
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              GIS_X: {{ station.GIS_X_COOR }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- 검색 전 안내 메시지 -->
    <div v-else-if="!searchError && !stationLoading" class="text-center py-12">
      <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      <p class="mt-3 text-gray-600 dark:text-gray-400">주소를 입력하고 검색 버튼을 눌러주세요</p>
    </div>
  </div>
</template>

