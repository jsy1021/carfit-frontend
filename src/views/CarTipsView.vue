<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- 헤더 -->
    <div class="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-4xl mx-auto px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button @click="goBack" 
                    class="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">차량 관리 팁</h1>
          </div>
        </div>
      </div>
    </div>

    <!-- 메인 컨텐츠 -->
    <div class="max-w-4xl mx-auto px-4 py-8">
      <!-- 카테고리 탭 -->
      <div class="mb-8">
        <div class="flex flex-wrap gap-2">
          <button v-for="category in categories" :key="category.id"
                  @click="selectedCategory = category.id"
                  :class="[
                    'px-4 py-2 rounded-lg font-medium transition-colors',
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  ]">
            {{ category.name }}
          </button>
        </div>
      </div>

      <!-- 팁 목록 -->
      <div class="space-y-6">
        <div v-for="tip in filteredTips" :key="tip.id" 
             class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="p-6">
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <component :is="tip.icon" class="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ tip.title }}</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ tip.category }}</p>
                </div>
              </div>
            </div>
            
            <div class="prose dark:prose-invert max-w-none">
              <p class="text-gray-700 dark:text-gray-300 mb-4">{{ tip.description }}</p>
              
              <div v-if="tip.steps && tip.steps.length > 0" class="mb-4">
                <h4 class="font-semibold text-gray-900 dark:text-white mb-2">단계별 가이드:</h4>
                <ol class="list-decimal list-inside space-y-2">
                  <li v-for="(step, index) in tip.steps" :key="index" 
                      class="text-gray-700 dark:text-gray-300">
                    {{ step }}
                  </li>
                </ol>
              </div>

              <div v-if="tip.tips && tip.tips.length > 0" class="mb-4">
                <h4 class="font-semibold text-gray-900 dark:text-white mb-2">💡 추가 팁:</h4>
                <ul class="list-disc list-inside space-y-1">
                  <li v-for="(tipItem, index) in tip.tips" :key="index" 
                      class="text-gray-700 dark:text-gray-300">
                    {{ tipItem }}
                  </li>
                </ul>
              </div>

              <div v-if="tip.warning" class="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <div class="flex items-start gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p class="text-yellow-800 dark:text-yellow-200 text-sm font-medium">{{ tip.warning }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 빈 상태 -->
      <div v-if="filteredTips.length === 0" class="text-center py-16">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
        <p class="text-gray-500 dark:text-gray-400">해당 카테고리의 팁이 없습니다.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

// 아이콘 컴포넌트들
const WrenchIcon = {
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  `
}

const CarIcon = {
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
    </svg>
  `
}

const FuelIcon = {
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.879 16.121A3 3 0 1012.121 13.88a3 3 0 00-2.242 2.242z" />
    </svg>
  `
}

const ShieldIcon = {
  template: `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  `
}

const router = useRouter()

// 카테고리
const categories = ref([
  { id: 'all', name: '전체' },
  { id: '정비', name: '정비' },
  { id: '운전', name: '운전' },
  { id: '연비', name: '연비' },
  { id: '안전', name: '안전' }
])

const selectedCategory = ref('all')

// 차량 관리 팁 데이터
const tips = ref([
  {
    id: 1,
    title: '엔진 오일 교체 주기',
    category: '정비',
    icon: WrenchIcon,
    description: '엔진 오일은 차량의 심장과 같은 역할을 합니다. 정기적인 교체로 엔진을 보호하고 연비를 향상시킬 수 있습니다.',
    steps: [
      '주행거리 5,000km 또는 6개월마다 교체',
      '엔진이 차가운 상태에서 점검',
      '오일 레벨이 최적 범위에 있는지 확인',
      '오일 색상이 검은색으로 변했으면 교체 필요'
    ],
    tips: [
      '고품질 오일 사용 시 교체 주기를 늘릴 수 있음',
      '극한 환경에서 운전 시 교체 주기 단축',
      '오일 필터도 함께 교체하는 것이 좋음'
    ],
    warning: '오일 교체를 너무 자주 하거나 너무 늦게 하면 오히려 엔진에 해로울 수 있습니다.'
  },
  {
    id: 2,
    title: '연비 향상 운전법',
    category: '운전',
    icon: FuelIcon,
    description: '올바른 운전 습관으로 연비를 10-20% 향상시킬 수 있습니다.',
    steps: [
      '급가속과 급제동 피하기',
      '정속 주행 유지 (60-80km/h)',
      '불필요한 공회전 금지',
      '적절한 타이어 공기압 유지'
    ],
    tips: [
      '에어컨 사용을 줄이고 자연 환기 활용',
      '불필요한 짐 제거',
      '정기적인 정비로 최적 상태 유지'
    ]
  },
  {
    id: 8,
    title: '연비 절약 팁',
    category: '연비',
    icon: FuelIcon,
    description: '연료비를 절약하고 환경을 보호하는 연비 향상 방법들을 알아보세요.',
    steps: [
      '적절한 타이어 공기압 유지 (권장압력 +10%)',
      '불필요한 짐 제거 (100kg당 3% 연비 저하)',
      '에어컨 사용 최소화 (10-15% 연비 저하)',
      '정속 주행 유지 (60-80km/h가 가장 효율적)',
      '급가속·급제동 피하기',
      '불필요한 공회전 금지 (10분 공회전 = 1km 주행)'
    ],
    tips: [
      '주유는 아침이나 저녁에 하는 것이 좋음 (연료 밀도가 높음)',
      '정기적인 정비로 엔진 효율 유지',
      '고속도로에서는 크루즈 컨트롤 활용',
      '연료 첨가제 사용 시 신중하게 선택'
    ],
    warning: '과도한 연비 절약을 위해 안전을 소홀히 하지 마세요.'
  },
  {
    id: 3,
    title: '겨울철 차량 관리',
    category: '정비',
    icon: CarIcon,
    description: '겨울철 추운 날씨에 대비한 차량 관리 방법을 알아보세요.',
    steps: [
      '냉각수와 부동액 점검',
      '배터리 상태 확인',
      '타이어 체인 준비',
      '윈드실드 워셔액 교체'
    ],
    tips: [
      '아침에 시동 걸기 전 1-2분 예열',
      '문틈에 얼음이 얼지 않도록 관리',
      '연료탱크를 절반 이상 유지'
    ],
    warning: '겨울철 급격한 온도 변화로 인한 배터리 방전에 주의하세요.'
  },
  {
    id: 4,
    title: '안전 운전 수칙',
    category: '안전',
    icon: ShieldIcon,
    description: '모든 운전자가 지켜야 할 기본적인 안전 운전 수칙입니다.',
    steps: [
      '안전벨트 착용',
      '적절한 속도 유지',
      '앞차와의 안전거리 확보',
      '신호등과 도로표지 준수'
    ],
    tips: [
      '피로할 때는 운전 중단',
      '날씨가 나쁠 때는 더욱 신중하게',
      '정기적인 운전 교육 참여'
    ]
  },
  {
    id: 9,
    title: '안전한 운전 습관',
    category: '운전',
    icon: CarIcon,
    description: '안전하고 효율적인 운전을 위한 기본 습관들을 익혀보세요.',
    steps: [
      '출발 전 안전벨트 착용 확인',
      '미러 조정 및 사각지대 확인',
      '적절한 좌석 거리 설정',
      '핸들 10시 2시 자세 유지',
      '정속 주행으로 연비 향상',
      '앞차와의 안전거리 확보 (2초 법칙)'
    ],
    tips: [
      '운전 중 휴대폰 사용 금지',
      '음주 운전 절대 금지',
      '피로 시 충분한 휴식',
      '날씨에 따른 속도 조절'
    ],
    warning: '안전은 모든 것보다 우선입니다. 무리한 운전은 금물입니다.'
  },
  {
    id: 12,
    title: '고속도로 차선별 운행 규칙',
    category: '운전',
    icon: CarIcon,
    description: '고속도로에서 안전하고 효율적인 운행을 위한 차선별 규칙과 주의사항을 알아보세요.',
    steps: [
      '1차선 (최우측): 일반 차량 기본 주행 차선',
      '2차선: 추월용 차선 (추월 후 1차선으로 복귀)',
      '3차선: 추월용 차선 (고속 주행 시 사용)',
      '4차선 이상: 대형차량 전용 또는 고속 주행',
      '응급차량 통행 시 모든 차선에서 양보',
      '정체 시 2차선 이상에서만 주행 가능'
    ],
    tips: [
      '추월 시 좌측 차선 사용, 추월 완료 후 즉시 복귀',
      '1차선에서 80km/h 이하로 주행 금지',
      '2차선 이상에서 100km/h 이하로 주행 금지',
      '정체 시 1차선은 응급차량 통행로 확보',
      '차선 변경 시 3초 전 방향지시등 켜기',
      '사각지대 확인 후 안전한 차선 변경'
    ],
    warning: '고속도로에서의 차선 위반은 사고 위험을 크게 높입니다. 반드시 규칙을 준수하세요.'
  },
  {
    id: 5,
    title: '타이어 관리법',
    category: '정비',
    icon: WrenchIcon,
    description: '타이어는 차량의 유일한 접지면으로 안전과 직결됩니다.',
    steps: [
      '주 1회 타이어 공기압 점검',
      '타이어 마모 상태 확인',
      '타이어 회전 (10,000km마다)',
      '균형 조정 및 정렬 점검'
    ],
    tips: [
      '계절별 적절한 타이어 사용',
      '타이어 수명은 보통 3-5년',
      '마모 균등도를 위해 정기 회전'
    ],
    warning: '타이어 마모가 1.6mm 이하로 떨어지면 즉시 교체해야 합니다.'
  },
  {
    id: 6,
    title: '브레이크 시스템 점검',
    category: '정비',
    icon: WrenchIcon,
    description: '브레이크는 생명과 직결되는 중요한 부품입니다.',
    steps: [
      '브레이크 패드 마모 상태 확인',
      '브레이크 오일 레벨 점검',
      '브레이크 디스크 상태 확인',
      '브레이크 라인 점검'
    ],
    tips: [
      '브레이크 오일은 2년마다 교체',
      '이상 소음 발생 시 즉시 점검',
      '정기적인 브레이크 시스템 청소'
    ],
    warning: '브레이크 시스템에 문제가 있으면 즉시 정비소에 가세요.'
  },
  {
    id: 7,
    title: '기본 점검 & 주기적 관리',
    category: '정비',
    icon: WrenchIcon,
    description: '차량의 기본적인 점검 항목들과 관리 주기를 알아보세요. 정기적인 점검으로 안전하고 경제적인 운전을 할 수 있습니다.',
    steps: [
      '엔진오일: 5,000~10,000km마다 교체',
      '냉각수(부동액): 1년 또는 20,000km마다 교체',
      '브레이크 오일: 2년마다 교체',
      '에어필터/에어컨필터: 6개월~1년마다 교체',
      '타이어 공기압: 매월 1회 점검',
      '타이어 마모도: 10,000km마다 확인',
      '와이퍼 블레이드: 6개월~1년마다 교체',
      '배터리: 2~3년마다 교체'
    ],
    tips: [
      '엔진오일 오염 시 연비 저하 및 엔진 손상 가능',
      '냉각수 부족 시 엔진 과열 및 부식 유발',
      '타이어 공기압 부족 시 연비 하락 및 폭발 위험',
      '타이어 마모선 1.6mm 이하 시 즉시 교체',
      '와이퍼 균열이나 줄무늬 생기면 교체',
      '배터리 단자 부식 확인 필수'
    ],
    warning: '정기 점검을 소홀히 하면 큰 사고로 이어질 수 있습니다. 반드시 주기를 지켜 점검하세요.'
  },
  {
    id: 10,
    title: '비상 상황 대처법',
    category: '안전',
    icon: ShieldIcon,
    description: '예상치 못한 비상 상황에서 안전하게 대처하는 방법을 알아보세요.',
    steps: [
      '타이어 펑크 시: 안전한 곳에 정차 후 비상등 켜기',
      '엔진 과열 시: 즉시 정차 후 엔진 냉각 대기',
      '브레이크 고장 시: 저단 기어로 감속, 수동차는 핸드브레이크',
      '사고 발생 시: 즉시 119 신고, 부상자 응급처치',
      '차량 화재 시: 즉시 탈출, 소화기 사용'
    ],
    tips: [
      '비상용품 항상 준비 (삼각대, 비상등, 구급약품)',
      '정기적인 비상용품 점검',
      '응급처치 교육 이수 권장',
      '보험사 연락처 미리 저장'
    ],
    warning: '비상 상황에서는 침착함이 가장 중요합니다. 안전을 최우선으로 하세요.'
  },
  {
    id: 11,
    title: '야간 운전 안전 수칙',
    category: '안전',
    icon: ShieldIcon,
    description: '야간 운전 시 시야 확보와 안전 운전을 위한 수칙들을 알아보세요.',
    steps: [
      '헤드라이트 점검 및 조정',
      '전조등과 후미등 정상 작동 확인',
      '야간 운전 시 속도 10-20% 감속',
      '앞차와의 거리 2배 이상 확보',
      '피로 시 즉시 휴식',
      '야간 주차 시 안전한 곳 선택'
    ],
    tips: [
      '야간 운전 전 충분한 휴식',
      '반사판과 야간 표지판 활용',
      '상대방 시야를 고려한 라이트 사용',
      '야간 운전 시 음주 절대 금지'
    ],
    warning: '야간 운전은 시야가 제한되어 위험도가 높습니다. 더욱 신중하게 운전하세요.'
  }
])

// 필터링된 팁
const filteredTips = computed(() => {
  if (selectedCategory.value === 'all') {
    return tips.value
  }
  return tips.value.filter(tip => tip.category === selectedCategory.value)
})

const goBack = () => {
  router.go(-1)
}
</script>

<style scoped>
.prose {
  max-width: none;
}
</style>
