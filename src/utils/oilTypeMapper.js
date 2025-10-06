// 유종 코드 매핑
export const oilTypeMapping = {
  'B027': { name: '휘발유', icon: '⛽', color: 'orange' },
  'D047': { name: '경유', icon: '🚛', color: 'green' },
  'B034': { name: '고급휘발유', icon: '✨', color: 'purple' },
  'C004': { name: '실내등유', icon: '🏠', color: 'amber' },
  'K015': { name: '자동차부탄', icon: '🔥', color: 'blue' }
}

// 유종 이름 가져오기
export const getOilTypeName = (code) => {
  return oilTypeMapping[code]?.name || code
}

// 유종 아이콘 가져오기
export const getOilTypeIcon = (code) => {
  return oilTypeMapping[code]?.icon || '⛽'
}

// 유종별 색상 클래스 가져오기 (현재는 사용 안함 - 모던 디자인)
export const getOilColorClass = (code) => {
  const colorMap = {
    'orange': 'from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-400',
    'green': 'from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-700 text-green-600 dark:text-green-400',
    'purple': 'from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-purple-200 dark:border-purple-700 text-purple-600 dark:text-purple-400',
    'blue': 'from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400',
    'amber': 'from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-amber-200 dark:border-amber-700 text-amber-600 dark:text-amber-400'
  }
  const color = oilTypeMapping[code]?.color || 'orange'
  return colorMap[color]
}

// 모든 유종 목록 가져오기
export const getAllOilTypes = () => {
  return Object.entries(oilTypeMapping).map(([code, info]) => ({
    code,
    ...info
  }))
}

