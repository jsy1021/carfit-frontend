/**
 * 주유소 브랜드 코드 매핑 유틸리티
 * 오피넷 API의 POLL_DIV_CD 코드를 실제 브랜드명으로 변환
 */

// 주유소 브랜드 코드 매핑 테이블
export const BRAND_MAPPING = {
  // SK 계열
  'SK': 'SK에너지',
  'SKE': 'SK에너지',
  
  // GS 계열
  'GS': 'GS칼텍스',
  'GSC': 'GS칼텍스',
  
  // HD 계열
  'HDO': 'HD현대오일뱅크',
  'HD': 'HD현대오일뱅크',
  
  // S-OIL
  'SOL': 'S-OIL',
  'SO': 'S-OIL',
  
  // 알뜰주유소
  'AL': '알뜰주유소',
  'RTX': '알뜰주유소',
  
  // 기타
  'ETC': '기타',
  'E1': 'E1',
  'UNKNOWN': '알 수 없음'
}

// 브랜드별 색상 코드 (선택적으로 사용)
export const BRAND_COLORS = {
  'SK에너지': '#F7B500',
  'GS칼텍스': '#0066CC',
  'HD현대오일뱅크': '#00A0E9',
  'S-OIL': '#ED1C24',
  '알뜰주유소': '#00AA00',
  'E1': '#FF6600',
  '기타': '#999999',
  '알 수 없음': '#CCCCCC'
}

/**
 * 브랜드 코드를 브랜드명으로 변환
 * @param {string} code - 브랜드 코드 (POLL_DIV_CD)
 * @returns {string} 브랜드명
 */
export const getBrandName = (code) => {
  if (!code) return '알 수 없음'
  
  // 코드를 대문자로 변환하여 매칭
  const upperCode = code.toUpperCase().trim()
  
  return BRAND_MAPPING[upperCode] || code
}

/**
 * 브랜드명에 해당하는 색상 코드 가져오기
 * @param {string} brandName - 브랜드명
 * @returns {string} 색상 코드 (HEX)
 */
export const getBrandColor = (brandName) => {
  return BRAND_COLORS[brandName] || BRAND_COLORS['알 수 없음']
}

/**
 * 브랜드 코드로 색상 코드 가져오기 (편의 함수)
 * @param {string} code - 브랜드 코드
 * @returns {string} 색상 코드 (HEX)
 */
export const getBrandColorByCode = (code) => {
  const brandName = getBrandName(code)
  return getBrandColor(brandName)
}

/**
 * 모든 브랜드 목록 가져오기
 * @returns {Array<string>} 브랜드명 배열
 */
export const getAllBrands = () => {
  return [...new Set(Object.values(BRAND_MAPPING))]
}


