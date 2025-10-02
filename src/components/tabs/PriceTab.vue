<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const gasolinePrices = ref([])
const dieselPrices = ref([])
const lpgPrices = ref([])
const loading = ref(true)
const error = ref(null)
const selectedRegion = ref('전국')

onMounted(async () => {
  try {
    const response = await axios.get('/api/oil')
    gasolinePrices.value = response.data.gasoline
    dieselPrices.value = response.data.diesel
    lpgPrices.value = response.data.lpg
  } catch (err) {
    console.error('API 오류:', err)
    error.value = '데이터를 불러오는 중 오류가 발생했습니다.'
  } finally {
    loading.value = false
  }
})

const filteredData = (data) => {
  if (selectedRegion.value === '전국') {
    const total = data.reduce((acc, curr) => ({
      PRICE: acc.PRICE + Number(curr.PRICE),
      DIFF: acc.DIFF + Number(curr.DIFF)
    }), { PRICE: 0, DIFF: 0 })
    return {
      PRICE: (total.PRICE / data.length).toFixed(2),
      DIFF: (total.DIFF / data.length).toFixed(2)
    }
  }
  return data.find(item => item.SIDONM === selectedRegion.value) || data[0] || {}
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
      <p class="mt-4 text-gray-600 dark:text-gray-400">데이터 로딩 중...</p>
    </div>

    <div v-else class="space-y-4">
      <!-- 지역 선택 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <select v-model="selectedRegion" 
                class="w-full md:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white">
          <option value="전국">전국</option>
          <option v-for="oil in gasolinePrices" :key="oil.SIDONM" :value="oil.SIDONM">
            {{ oil.SIDONM }}
          </option>
        </select>
      </div>

      <!-- 가격 카드 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- 휘발유 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">휘발유</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ filteredData(gasolinePrices).PRICE }}원
              </p>
            </div>
            <div class="text-right">
              <span :class="filteredData(gasolinePrices).DIFF >= 0 ? 'text-red-500' : 'text-blue-500'"
                    class="text-sm font-medium">
                {{ filteredData(gasolinePrices).DIFF >= 0 ? '▲' : '▼' }}
                {{ Math.abs(filteredData(gasolinePrices).DIFF) }}원
              </span>
            </div>
          </div>
        </div>

        <!-- 경유 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">경유</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ filteredData(dieselPrices).PRICE }}원
              </p>
            </div>
            <div class="text-right">
              <span :class="filteredData(dieselPrices).DIFF >= 0 ? 'text-red-500' : 'text-blue-500'"
                    class="text-sm font-medium">
                {{ filteredData(dieselPrices).DIFF >= 0 ? '▲' : '▼' }}
                {{ Math.abs(filteredData(dieselPrices).DIFF) }}원
              </span>
            </div>
          </div>
        </div>

        <!-- LPG -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">LPG</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ filteredData(lpgPrices).PRICE }}원
              </p>
            </div>
            <div class="text-right">
              <span :class="filteredData(lpgPrices).DIFF >= 0 ? 'text-red-500' : 'text-blue-500'"
                    class="text-sm font-medium">
                {{ filteredData(lpgPrices).DIFF >= 0 ? '▲' : '▼' }}
                {{ Math.abs(filteredData(lpgPrices).DIFF) }}원
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

