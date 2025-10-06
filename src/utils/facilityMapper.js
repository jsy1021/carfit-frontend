// 시설 아이콘 컴포넌트 매핑
export const facilityIconComponents = {
  'gas-station': 'IconGasStation',
  'car-wash': 'IconCarWash',
  'store': 'IconStore',
  'wrench': 'IconWrench',
  'badge-check': 'IconBadgeCheck'
}

// 아이콘 컴포넌트 이름 가져오기
export const getFacilityIconComponent = (iconName) => {
  return facilityIconComponents[iconName] || 'IconGasStation'
}

// 시설정보 구성 (모든 항목 표시, Y/N에 따라 활성화/비활성화)
export const getFacilities = (detail) => {
  return [
    { 
      key: 'LPG_YN', 
      icon: 'gas-station',
      name: detail.LPG_YN === 'C' ? '주유소/충전소' : detail.LPG_YN === 'Y' ? '충전소' : '주유소',
      active: detail.LPG_YN !== 'N',
      description: '업종구분'
    },
    { 
      key: 'CAR_WASH_YN', 
      icon: 'car-wash',
      name: '세차장', 
      active: detail.CAR_WASH_YN === 'Y',
      description: '세차시설'
    },
    { 
      key: 'CVS_YN', 
      icon: 'store',
      name: '편의점', 
      active: detail.CVS_YN === 'Y',
      description: '편의점'
    },
    { 
      key: 'MAINT_YN', 
      icon: 'wrench',
      name: '경정비', 
      active: detail.MAINT_YN === 'Y',
      description: '경정비시설'
    },
    { 
      key: 'KPETRO_YN', 
      icon: 'badge-check',
      name: '품질인증', 
      active: detail.KPETRO_YN === 'Y',
      description: '품질인증주유소'
    }
  ]
}

// 활성화된 시설만 가져오기
export const getActiveFacilities = (detail) => {
  return getFacilities(detail).filter(facility => facility.active)
}

// 시설 개수 카운트
export const countActiveFacilities = (detail) => {
  return getActiveFacilities(detail).length
}

