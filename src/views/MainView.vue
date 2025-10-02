<script setup>
import { ref } from 'vue'
import PriceTab from '../components/tabs/PriceTab.vue'
import StationTab from '../components/tabs/StationTab.vue'
import InsuranceTab from '../components/tabs/InsuranceTab.vue'
import CommunityTab from '../components/tabs/CommunityTab.vue'

const activeTab = ref('price')
const communityTabRef = ref(null)

const switchTab = (tab) => {
  activeTab.value = tab
  if (tab === 'community' && communityTabRef.value) {
    communityTabRef.value.loadPosts()
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="max-w-7xl mx-auto px-4 py-6">
      <!-- 헤더 -->
      <div class="text-center mb-6">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">CarFit</h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">정보 통합 플랫폼</p>
      </div>

      <!-- 탭 네비게이션 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div class="flex border-b border-gray-200 dark:border-gray-700">
          <button @click="switchTab('price')" 
                  :class="{'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400': activeTab === 'price'}"
                  class="flex-1 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
             유가 정보
          </button>
          <button @click="switchTab('station')"
                  :class="{'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400': activeTab === 'station'}"
                  class="flex-1 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
             주유소 찾기
          </button>
          <button @click="switchTab('insurance')"
                  :class="{'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400': activeTab === 'insurance'}"
                  class="flex-1 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
             보험료 계산
          </button>
          <button @click="switchTab('community')"
                  :class="{'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400': activeTab === 'community'}"
                  class="flex-1 px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
             커뮤니티
          </button>
        </div>
      </div>

      <!-- 탭 컨텐츠 -->
      <PriceTab v-if="activeTab === 'price'" />
      <StationTab v-if="activeTab === 'station'" />
      <InsuranceTab v-if="activeTab === 'insurance'" />
      <CommunityTab v-if="activeTab === 'community'" ref="communityTabRef" />
    </div>
  </div>
</template>

<style scoped>
/* 스크롤바 스타일링 */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

.dark ::-webkit-scrollbar-thumb {
  background: #4a5568;
}

.dark ::-webkit-scrollbar-thumb:hover {
  background: #718096;
}
</style>
