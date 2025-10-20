// 주소에서 첫 번째 쉼표 앞의 정보만 추출
export const extractRegionFromAddress = (fullAddress) => {
  if (!fullAddress) return ''
  
  // 첫 번째 쉼표 앞의 정보만 추출
  
  const commaIndex = fullAddress.indexOf(',')
  if (commaIndex !== -1) {
    return fullAddress.substring(0, commaIndex).trim()
  }
  
  // 쉼표가 없으면 원본 반환
  return fullAddress
}

// 주소에서 시/도, 시/군/구 추출
export const extractRegionFromUserAddress = (address) => {
  if (!address) return null
  
  // 간단한 정규식으로 시/도, 시/군/구 추출
  const patterns = [
    // 서울특별시 패턴
    { pattern: /서울\s*특별시?\s*([가-힣]+구)/, province: '서울', city: '서울 $1' },
    { pattern: /서울\s*([가-힣]+구)/, province: '서울', city: '서울 $1' },
    
    // 경기도 패턴
    { pattern: /경기도\s*([가-힣]+시(?:\s*[가-힣]+구)?)/, province: '경기', city: '$1' },
    { pattern: /경기도\s*([가-힣]+군)/, province: '경기', city: '$1' },
    { pattern: /경기\s*([가-힣]+시(?:\s*[가-힣]+구)?)/, province: '경기', city: '$1' },
    { pattern: /경기\s*([가-힣]+군)/, province: '경기', city: '$1' },
    
    // 부산광역시 패턴
    { pattern: /부산\s*광역시?\s*([가-힣]+구)/, province: '부산', city: '$1' },
    { pattern: /부산\s*([가-힣]+구)/, province: '부산', city: '$1' },
    
    // 인천광역시 패턴
    { pattern: /인천\s*광역시?\s*([가-힣]+구)/, province: '인천', city: '$1' },
    { pattern: /인천\s*([가-힣]+구)/, province: '인천', city: '$1' },
    
    // 대구광역시 패턴
    { pattern: /대구\s*광역시?\s*([가-힣]+구)/, province: '대구', city: '$1' },
    { pattern: /대구\s*([가-힣]+구)/, province: '대구', city: '$1' },
    
    // 광주광역시 패턴
    { pattern: /광주\s*광역시?\s*([가-힣]+구)/, province: '광주', city: '$1' },
    { pattern: /광주\s*([가-힣]+구)/, province: '광주', city: '$1' },
    
    // 대전광역시 패턴
    { pattern: /대전\s*광역시?\s*([가-힣]+구)/, province: '대전', city: '$1' },
    { pattern: /대전\s*([가-힣]+구)/, province: '대전', city: '$1' },
    
    // 울산광역시 패턴
    { pattern: /울산\s*광역시?\s*([가-힣]+구)/, province: '울산', city: '$1' },
    { pattern: /울산\s*([가-힣]+구)/, province: '울산', city: '$1' },
    
    // 세종특별자치시 패턴
    { pattern: /세종\s*특별자치시?/, province: '세종', city: '세종' },
    { pattern: /세종\s*시?/, province: '세종', city: '세종' },
    
    // 기타 도 패턴 (강원, 충북, 충남, 전북, 전남, 경북, 경남, 제주)
    { pattern: /강원도?\s*([가-힣]+시(?:\s*[가-힣]+구)?)/, province: '강원', city: '$1' },
    { pattern: /강원도?\s*([가-힣]+군)/, province: '강원', city: '$1' },
    { pattern: /충청북도?\s*([가-힣]+시(?:\s*[가-힣]+구)?)/, province: '충북', city: '$1' },
    { pattern: /충청북도?\s*([가-힣]+군)/, province: '충북', city: '$1' },
    { pattern: /충청남도?\s*([가-힣]+시(?:\s*[가-힣]+구)?)/, province: '충남', city: '$1' },
    { pattern: /충청남도?\s*([가-힣]+군)/, province: '충남', city: '$1' },
    { pattern: /전라북도?\s*([가-힣]+시(?:\s*[가-힣]+구)?)/, province: '전북', city: '$1' },
    { pattern: /전라북도?\s*([가-힣]+군)/, province: '전북', city: '$1' },
    { pattern: /전라남도?\s*([가-힣]+시(?:\s*[가-힣]+구)?)/, province: '전남', city: '$1' },
    { pattern: /전라남도?\s*([가-힣]+군)/, province: '전남', city: '$1' },
    { pattern: /경상북도?\s*([가-힣]+시(?:\s*[가-힣]+구)?)/, province: '경북', city: '$1' },
    { pattern: /경상북도?\s*([가-힣]+군)/, province: '경북', city: '$1' },
    { pattern: /경상남도?\s*([가-힣]+시(?:\s*[가-힣]+구)?)/, province: '경남', city: '$1' },
    { pattern: /경상남도?\s*([가-힣]+군)/, province: '경남', city: '$1' },
    { pattern: /제주도?\s*([가-힣]+시(?:\s*[가-힣]+구)?)/, province: '제주', city: '$1' },
    { pattern: /제주도?\s*([가-힣]+군)/, province: '제주', city: '$1' }
  ]
  
  for (const { pattern, province, city } of patterns) {
    const match = address.match(pattern)
    if (match) {
      const extractedCity = city.replace('$1', match[1])
      return { province, city: extractedCity }
    }
  }
  return null
}
