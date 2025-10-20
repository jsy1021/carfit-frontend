<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth.js'
import { getBrandName } from '@/utils/brandMapper'
import { getOilTypeName } from '@/utils/oilTypeMapper'
import { getFacilities } from '@/utils/facilityMapper'
import { getAllProvinces, getRegionNamesByProvinceCode, getCodeByProvinceName, getCodeByRegionName } from '@/utils/opinetRegionCodes.js'
import { extractRegionFromAddress, extractRegionFromUserAddress } from '@/utils/addressExtractor.js'
import IconGasStation from '@/components/icons/IconGasStation.vue'
import IconCarWash from '@/components/icons/IconCarWash.vue'
import IconStore from '@/components/icons/IconStore.vue'
import IconWrench from '@/components/icons/IconWrench.vue'
import IconBadgeCheck from '@/components/icons/IconBadgeCheck.vue'

// 스토어
const authStore = useAuthStore()

// 유가 정보 관련 상태
const gasolinePrices = ref([])
const premiumGasolinePrices = ref([])
const dieselPrices = ref([])
const lpgPrices = ref([])
const loading = ref(true)
const error = ref(null)
const selectedRegion = ref('')

// 지역 선택 관련 상태
const selectedProvince = ref('')
const selectedCity = ref('')
const availableProvinces = ref([])
const availableCities = ref([])

// 주유소 찾기 관련 상태
const gasolineStations = ref([])
const addressInput = ref('')
const searchError = ref('')
const stationLoading = ref(false)

// 사용자 주소 관련 상태
const userAddress = ref('')
const hasUserAddress = ref(false)
const isSavingAddress = ref(false)

// 지도 관련 상태
const mapContainer = ref(null)
const map = ref(null)
const markers = ref([])
const currentLocation = ref(null)

// 상세 정보 관련 상태
const selectedStation = ref(null)
const stationDetail = ref(null)
const isDetailLoading = ref(false)
const showDetailModal = ref(false)

// 아이콘 컴포넌트 매핑
const iconComponents = {
  'gas-station': IconGasStation,
  'car-wash': IconCarWash,
  'store': IconStore,
  'wrench': IconWrench,
  'badge-check': IconBadgeCheck
}

// 아이콘 컴포넌트 가져오기
const getIconComponent = (iconName) => {
  return iconComponents[iconName] || IconGasStation
}

// 날짜 포맷팅
const formatDate = (dateStr, timeStr) => {
  if (!dateStr) return '-'
  const year = dateStr.substring(0, 4)
  const month = dateStr.substring(4, 6)
  const day = dateStr.substring(6, 8)
  
  if (timeStr) {
    const hour = timeStr.substring(0, 2)
    const minute = timeStr.substring(2, 4)
    return `${year}.${month}.${day} ${hour}:${minute}`
  }
  return `${year}.${month}.${day}`
}

onMounted(async () => {
  try {
    // 기본 유가 정보 로드 (서울)
    const response = await axios.get('/api/oil/avg-sigun-price', {
      params: {
        sido: '01' // 서울을 기본으로 설정
      }
    })
    
    
    // 백엔드 응답 구조에 따라 분기 처리
    let oilPrices = []
    if (response.data && response.data.RESULT && response.data.RESULT.OIL) {
      // Opinet API 직접 응답 구조
      oilPrices = response.data.RESULT.OIL
    } else if (response.data && response.data.oilPrices) {
      // 백엔드에서 가공한 응답 구조
      oilPrices = response.data.oilPrices
    }
    
    if (oilPrices.length > 0) {
      
      // PRODCD로 유종 구분 (B034: 고급휘발유, B027: 보통휘발유, D047: 자동차경유, K015: 자동차부탄)
      const premiumGasolineData = oilPrices.find(item => item.PRODCD === 'B034') || { PRICE: 0, DIFF: 0 }
      const gasolineData = oilPrices.find(item => item.PRODCD === 'B027') || { PRICE: 0, DIFF: 0 }
      const dieselData = oilPrices.find(item => item.PRODCD === 'D047') || { PRICE: 0, DIFF: 0 }
      const lpgData = oilPrices.find(item => item.PRODCD === 'K015') || { PRICE: 0, DIFF: 0 }
      
      
      premiumGasolinePrices.value = [premiumGasolineData]
      gasolinePrices.value = [gasolineData]
      dieselPrices.value = [dieselData]
      lpgPrices.value = [lpgData]
    }
  } catch (err) {
    console.error('API 오류:', err)
    error.value = '데이터를 불러오는 중 오류가 발생했습니다.'
  } finally {
    loading.value = false
    // 지역 선택 초기화 (API 성공/실패와 관계없이 항상 실행)
    initializeRegionSelection()
  }
  
  // 사용자 주소 확인 (프로필 주소)
  checkUserAddress()
  
  // 지도 초기화
  await nextTick()
  await initMap()
  
  // 기본 위치 확인 및 자동 검색 (지도 초기화 후)
  await checkAndLoadDefaultLocation()
})

const filteredData = (data) => {
  // 이제 data는 단일 객체를 포함하는 배열이므로 첫 번째 요소를 반환
  return data[0] || {}
}

// 지역 선택 관련 함수들
const initializeRegionSelection = () => {
  // 시/도 목록 초기화
  availableProvinces.value = getAllProvinces()
  
  // 서울을 기본으로 설정
  selectedProvince.value = '서울'
  updateCitiesByProvince(selectedProvince.value)
}

const updateCitiesByProvince = (provinceName) => {
  const provinceCode = getCodeByProvinceName(provinceName)
  if (provinceCode) {
    availableCities.value = getRegionNamesByProvinceCode(provinceCode)
    // 첫 번째 시군구 선택
    if (availableCities.value.length > 0) {
      selectedCity.value = availableCities.value[0]
      selectedRegion.value = selectedCity.value
    }
  } else {
    availableCities.value = []
    selectedCity.value = ''
    selectedRegion.value = ''
  }
}

const onProvinceChange = async (provinceName) => {
  selectedProvince.value = provinceName
  updateCitiesByProvince(provinceName)
  // 첫 번째 시군구가 선택되면 해당 지역의 유가 정보 로드
  if (availableCities.value.length > 0) {
    const firstCity = availableCities.value[0]
    await loadOilPricesForRegion(provinceName, firstCity)
  }
  // 사용자 주소가 있으면 해당 지역의 유가 정보도 업데이트
  if (hasUserAddress.value) {
    await fetchUserRegionOilPrices()
  }
}

const onCityChange = async (cityName) => {
  selectedCity.value = cityName
  selectedRegion.value = cityName
  await loadOilPricesForRegion(selectedProvince.value, cityName)
  // 사용자 주소가 있으면 해당 지역의 유가 정보도 업데이트
  if (hasUserAddress.value) {
    await fetchUserRegionOilPrices()
  }
}

// 지역별 유가 정보 로드
const loadOilPricesForRegion = async (provinceName, cityName) => {
  try {
    const provinceCode = getCodeByProvinceName(provinceName)
    if (!provinceCode) {
      console.error('시/도 코드를 찾을 수 없습니다:', provinceName)
      return
    }

    let regionCode = null
    if (cityName) {
      const fullRegionName = `${provinceName} ${cityName}`
      regionCode = getCodeByRegionName(fullRegionName)
      }

    const response = await axios.get('/api/oil/avg-sigun-price', {
      params: {
        sido: provinceCode,
        sigun: regionCode
      }
    })

    if (response.data && response.data.oilPrices) {
      const oilPrices = response.data.oilPrices
      
      // PRODCD로 유종 구분 (B034: 고급휘발유, B027: 보통휘발유, C004: 경유, K015: LPG)
      const premiumGasolineData = oilPrices.find(item => item.PRODCD === 'B034')
      const gasolineData = oilPrices.find(item => item.PRODCD === 'B027')
      const dieselData = oilPrices.find(item => item.PRODCD === 'C004')
      const lpgData = oilPrices.find(item => item.PRODCD === 'K015')
      
      // 기본값 설정 (데이터가 없으면 0으로 설정)
      const finalPremiumGasolineData = premiumGasolineData ? {
        PRICE: premiumGasolineData.PRICE || 0,
        DIFF: premiumGasolineData.DIFF || 0
      } : { PRICE: 0, DIFF: 0 }
      
      const finalGasolineData = gasolineData ? {
        PRICE: gasolineData.PRICE || 0,
        DIFF: gasolineData.DIFF || 0
      } : { PRICE: 0, DIFF: 0 }
      
      const finalDieselData = dieselData ? {
        PRICE: dieselData.PRICE || 0,
        DIFF: dieselData.DIFF || 0
      } : { PRICE: 0, DIFF: 0 }
      
      const finalLpgData = lpgData ? {
        PRICE: lpgData.PRICE || 0,
        DIFF: lpgData.DIFF || 0
      } : { PRICE: 0, DIFF: 0 }
      
      premiumGasolinePrices.value = [finalPremiumGasolineData]
      gasolinePrices.value = [finalGasolineData]
      dieselPrices.value = [finalDieselData]
      lpgPrices.value = [finalLpgData]
      
      // currentRegionOilPrices 업데이트 (현재 선택된 지역의 유가 정보)
      currentRegionOilPrices.value = {
        premiumGasoline: finalPremiumGasolineData,
        gasoline: finalGasolineData,
        diesel: finalDieselData,
        lpg: finalLpgData
      }
      
      // userRegionOilPrices도 함께 업데이트 (사용자 주소가 있을 때)
      if (hasUserAddress.value) {
        userRegionOilPrices.value = {
          premiumGasoline: finalPremiumGasolineData,
          gasoline: finalGasolineData,
          diesel: finalDieselData,
          lpg: finalLpgData
        }
      }
    }
  } catch (error) {
    console.error('지역별 유가 정보 로드 실패:', error)
  }
}

// 사용자 주소 기반 유가 정보 (API에서 직접 조회)
const userRegionOilPrices = ref({
  gasoline: {},
  premiumGasoline: {},
  diesel: {},
  lpg: {}
})

// 현재 선택된 지역의 유가 정보 (loadOilPricesForRegion에서 받은 데이터)
const currentRegionOilPrices = ref({
  gasoline: {},
  premiumGasoline: {},
  diesel: {},
  lpg: {}
})

// 사용자 주소 기반 유가 정보 조회 (현재 선택된 지역 기준)
const fetchUserRegionOilPrices = async () => {
  if (!selectedProvince.value || !selectedCity.value) {
    return
  }
  
  try {
    
    // 선택된 시/도, 시/군/구를 코드로 변환
    const provinceCode = getCodeByProvinceName(selectedProvince.value)
    const regionCode = getCodeByRegionName(selectedCity.value)
    
    if (!provinceCode || !regionCode) {
      return
    }
    
    // API에 코드 전달하여 해당 지역의 유가 정보 조회
    const response = await axios.get('/api/oil/avg-sigun-price', {
      params: {
        sido: provinceCode,
        sigun: regionCode
      }
    })
    
    if (response.data && response.data.oilPrices) {
      // API 응답에서 oilPrices 배열을 가져와서 각 유종별로 분류
      const oilPrices = response.data.oilPrices
      
      // PRODCD로 유종 구분 (B034: 고급휘발유, B027: 보통휘발유, C004: 경유, K015: LPG)
      const premiumGasolineData = oilPrices.find(item => item.PRODCD === 'B034') || { PRICE: 0, DIFF: 0 }
      const gasolineData = oilPrices.find(item => item.PRODCD === 'B027') || { PRICE: 0, DIFF: 0 }
      const dieselData = oilPrices.find(item => item.PRODCD === 'C004') || { PRICE: 0, DIFF: 0 }
      const lpgData = oilPrices.find(item => item.PRODCD === 'K015') || { PRICE: 0, DIFF: 0 }
      
      userRegionOilPrices.value = {
        premiumGasoline: premiumGasolineData,
        gasoline: gasolineData,
        diesel: dieselData,
        lpg: lpgData
      }
    }
  } catch (error) {
    console.error('사용자 지역 유가 정보 조회 실패:', error)
    // API 호출 실패 시 기본 데이터 사용
    userRegionOilPrices.value = {
      premiumGasoline: premiumGasolinePrices.value[0] || {},
      gasoline: gasolinePrices.value[0] || {},
      diesel: dieselPrices.value[0] || {},
      lpg: lpgPrices.value[0] || {}
    }
  }
}


// 사용자 주소 확인 (프로필 주소)
const checkUserAddress = async () => {
  if (authStore.isAuthenticated && authStore.userInfo) {
    const fullAddress = authStore.userInfo.address || authStore.userInfo.location
    if (fullAddress) {
      // 첫 번째 쉼표 앞의 정보만 추출
      const regionAddress = extractRegionFromAddress(fullAddress)
      userAddress.value = regionAddress
      hasUserAddress.value = true
      // 주소에서 시/도, 시/군/구 추출하여 유가 정보 자동 조회
      const extractedRegion = extractRegionFromUserAddress(regionAddress)
      if (extractedRegion) {
        
        // 추출된 지역으로 드롭다운 업데이트
        selectedProvince.value = extractedRegion.province
        updateCitiesByProvince(extractedRegion.province)
        
        // availableCities에서 추출된 시/군/구 찾기 (이제 시/도 부분이 제거됨)
        const foundCity = availableCities.value.find(city => city === extractedRegion.city)
        
        if (foundCity) {
          selectedCity.value = foundCity
          selectedRegion.value = foundCity
        } else {
          // 정확한 매칭이 없으면 추출된 이름으로 설정
          selectedCity.value = extractedRegion.city
          selectedRegion.value = extractedRegion.city
        }
        
        // 해당 지역의 유가 정보 조회
        await loadOilPricesForRegion(extractedRegion.province, extractedRegion.city)
      }
    } else {
      hasUserAddress.value = false
    }
  } else {
    hasUserAddress.value = false
  }
}

// 기본 위치 확인 및 자동 검색
const checkAndLoadDefaultLocation = async () => {
  if (!authStore.isAuthenticated) {
    return
  }
  
  try {
    // 기본 위치 조회 API 호출
    const response = await axios.get('/api/locations/address')
    
    if (response.data && response.data.address) {
      // 기본 위치 설정
      userAddress.value = response.data.address
      hasUserAddress.value = true
      
      // 주소 입력창에 설정
      addressInput.value = response.data.address
      
      // 기본 위치에서 지역 추출하여 유가 정보 자동 조회
      const extractedRegion = extractRegionFromUserAddress(response.data.address)
      if (extractedRegion) {
        
        // 추출된 지역으로 드롭다운 업데이트
        selectedProvince.value = extractedRegion.province
        updateCitiesByProvince(extractedRegion.province)
        
        // availableCities에서 추출된 시/군/구 찾기 (이제 시/도 부분이 제거됨)
        const foundCity = availableCities.value.find(city => city === extractedRegion.city)
        
        if (foundCity) {
          selectedCity.value = foundCity
          selectedRegion.value = foundCity
        } else {
          // 정확한 매칭이 없으면 추출된 이름으로 설정
          selectedCity.value = extractedRegion.city
          selectedRegion.value = extractedRegion.city
        }
        
        // 해당 지역의 유가 정보 조회
        await loadOilPricesForRegion(extractedRegion.province, extractedRegion.city)
      }
      
      // 기본 위치 좌표가 있으면 직접 마커 표시
      if (response.data.latitude && response.data.longitude) {
        
        // 검색 위치 마커 추가
        nextTick(() => {
          if (map.value) {
            addSearchLocationMarker(response.data.longitude, response.data.latitude)
          }
        })
      }
      
      // 자동으로 주유소 검색 실행
      await searchGasStations()
    }
  } catch (error) {
    // 404 등은 정상 (기본 위치가 없는 경우)
  }
}

// 검색 입력창 지우기
const clearSearchInput = () => {
  addressInput.value = ''
  searchError.value = ''
  gasolineStations.value = []
  clearMarkers()
}

// 사용자 주소로 주유소 검색
const searchWithUserAddress = async () => {
  if (!hasUserAddress.value || !userAddress.value) {
    searchError.value = '사용자 주소 정보가 없습니다.'
    return
  }
  
  // 주소 입력 필드에 사용자 주소 설정 (임시로만)
  const originalAddress = addressInput.value
  addressInput.value = userAddress.value
  
  // 주유소 검색 실행
  await searchGasStations()
  
  // 검색 후 원래 주소로 복원 (사용자가 입력한 주소 유지)
  addressInput.value = originalAddress
}

// 현재 검색한 주소를 기본 위치로 등록
const saveAsDefaultAddress = async () => {
  if (!addressInput.value.trim()) {
    searchError.value = '저장할 주소가 없습니다. 먼저 주소를 검색해주세요.'
    return
  }
  
  if (!authStore.isAuthenticated) {
    searchError.value = '로그인이 필요합니다.'
    return
  }
  
  isSavingAddress.value = true
  
  try {
    // 사용자 프로필 업데이트 API 호출
    const response = await axios.post('/api/locations/address', {
      address: addressInput.value
    })
    
    // 백엔드에서 UserDefaultLocation 객체를 직접 반환하므로 성공으로 처리
    if (response.data && response.data.address) {
      // 로컬 상태 업데이트 (기본 위치 등록용)
      userAddress.value = addressInput.value
      hasUserAddress.value = true
      
      // authStore의 userInfo는 업데이트하지 않음 (프로필 주소와 기본 위치는 별개)
      // 기본 위치는 별도로 관리되므로 프로필 주소를 변경하지 않음
      
      // 새로운 주소에서 지역 추출하여 유가 정보 자동 업데이트
      const extractedRegion = extractRegionFromUserAddress(addressInput.value)
      if (extractedRegion) {
        
        // 추출된 지역으로 드롭다운 업데이트
        selectedProvince.value = extractedRegion.province
        updateCitiesByProvince(extractedRegion.province)
        
        // availableCities에서 추출된 시/군/구 찾기 (이제 시/도 부분이 제거됨)
        const foundCity = availableCities.value.find(city => city === extractedRegion.city)
        
        if (foundCity) {
          selectedCity.value = foundCity
          selectedRegion.value = foundCity
        } else {
          // 정확한 매칭이 없으면 추출된 이름으로 설정
          selectedCity.value = extractedRegion.city
          selectedRegion.value = extractedRegion.city
        }
        
        // 해당 지역의 유가 정보 조회
        await loadOilPricesForRegion(extractedRegion.province, extractedRegion.city)
      }
      
      // 성공 메시지 표시
      searchError.value = ''
      alert('기본 위치가 등록되었습니다!')
    } else {
      throw new Error('주소 저장에 실패했습니다.')
    }
  } catch (error) {
    console.error('주소 저장 오류:', error)
    searchError.value = error.response?.data?.message || '주소 저장에 실패했습니다.'
  } finally {
    isSavingAddress.value = false
  }
}

// 주유소 검색 함수들
const searchGasStations = async () => {
  if (!addressInput.value.trim()) {
    searchError.value = '주소를 입력해주세요.'
    gasolineStations.value = []
    clearMarkers()
    return
  }

  stationLoading.value = true
  try {
    searchError.value = ''
    
    const { x, y } = await getCoordinatesFromBackend(addressInput.value)
    
    // 검색 위치 저장(KATEC 좌표를 기준으로 저장)
    currentLocation.value = { x, y }
    
    const response = await axios.get('/api/stations/nearby', {
      params: { x, y, radius: 5000, sort: 1, limit: 10 }
    })
    
    // 주유소 데이터를 거리순으로 정렬 
    const stations = response.data.stations.slice(0, 10)
    
    // 거리순으로 정렬 (거리가 같으면 가격순으로 정렬)
    stations.sort((a, b) => {
      const distanceA = parseFloat(a.DISTANCE) || 0
      const distanceB = parseFloat(b.DISTANCE) || 0
      
      if (distanceA !== distanceB) {
        return distanceA - distanceB // 거리순
      }
      
      // 거리가 같으면 가격순 (낮은 가격 우선)
      const priceA = parseFloat(a.PRICE) || 0
      const priceB = parseFloat(b.PRICE) || 0
      return priceA - priceB
    })
    
    gasolineStations.value = stations
    
    if (gasolineStations.value.length === 0) {
      searchError.value = '주변에 주유소가 없습니다.'
      clearMarkers()
    } else {
      // 지도에 마커 표시
      nextTick(() => {
        if (!map.value) {
          return
        }
        
        createStationMarkers(gasolineStations.value) // 주유소 마커들 (WGS84)
      })
    }
  } catch (err) {
    searchError.value = err.response?.data?.message || '주소를 찾을 수 없습니다. 올바른 주소를 입력해주세요.'
    gasolineStations.value = []
    clearMarkers()
  } finally {
    stationLoading.value = false
  }
}

const getCoordinatesFromBackend = async (address) => {
  const res = await axios.get('/api/geocode', { params: { address } })
  
  // original_x, original_y가 있으면 전역 변수에 저장 (나중에 마커 추가용)
  if (res.data.original_x && res.data.original_y) {
    // 검색 위치 좌표를 전역 변수에 저장
    window.searchLocation = {
      x: res.data.original_x,
      y: res.data.original_y
    }
  }
  
  return res.data
}

// 네이버 지도 API 동적 로드
const loadNaverMapsAPI = () => {
  return new Promise((resolve, reject) => {
    // 이미 로드되어 있으면 바로 resolve
    if (window.naver && window.naver.maps) {
      resolve()
      return
    }

    const clientId = import.meta.env.VITE_NAVER_MAPS_CLIENT_ID
    
    if (!clientId) {
      reject(new Error('네이버 지도 API 클라이언트 ID가 설정되지 않았습니다.'))
      return
    }
    
    // 스크립트 태그 생성
    const script = document.createElement('script')
    script.type = 'text/javascript'
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('네이버 지도 API 로드에 실패했습니다.'))
    
    document.head.appendChild(script)
  })
}

// 네이버 지도 초기화
const initMap = async () => {
  try {
    // 네이버 지도 API 로드
    await loadNaverMapsAPI()
    
    if (!mapContainer.value) {
      return
    }

    // 기본 위치 (서울시청)
    const defaultLocation = new window.naver.maps.LatLng(37.5665, 126.9780)
    
    const mapOptions = {
      center: defaultLocation,
      zoom: 13,
      zoomControl: true,
      zoomControlOptions: {
        position: window.naver.maps.Position.TOP_RIGHT
      }
    }
    
    map.value = new window.naver.maps.Map(mapContainer.value, mapOptions)
  } catch (error) {
    searchError.value = '지도를 불러올 수 없습니다. API 키를 확인해주세요.'
  }
}

// 기존 마커 제거
const clearMarkers = () => {
  markers.value.forEach(marker => marker.setMap(null))
  markers.value = []
}

// 검색 위치 마커 추가
const addSearchLocationMarker = (x, y) => {
  if (!map.value) {
    return
  }
  
  // WGS84 좌표로 변환 (original_x, original_y는 WGS84 좌표)
  const latLng = new window.naver.maps.LatLng(y, x)
  
  // 검색 위치 마커 생성
  const searchMarker = new window.naver.maps.Marker({
    position: latLng,
    map: map.value,
    title: '검색 위치',
    icon: {
      content: `
        <div class="search-marker" style="
          background: #EF4444;
          color: white;
          width: 25px;
          height: 25px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: bold;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">📍</div>
      `,
      size: new window.naver.maps.Size(25, 25),
      anchor: new window.naver.maps.Point(12, 12)
    }
  })
  
  // 마커 배열에 추가
  markers.value.push(searchMarker)
  
  // 지도 중심을 검색 위치로 이동 (애니메이션과 함께)
  map.value.setCenter(latLng)
  map.value.setZoom(15) // 적절한 줌 레벨 설정
  
  // 부드러운 이동을 위한 애니메이션
  setTimeout(() => {
    map.value.panTo(latLng)
  }, 100)
}

// 주유소 마커 생성
const createStationMarkers = (stations) => {
  if (!map.value) {
    return
  }
  
  if (!stations.length) {
    return
  }

  clearMarkers()
  
  // 검색 위치 마커 먼저 추가 (있다면)
  if (window.searchLocation) {
    addSearchLocationMarker(window.searchLocation.x, window.searchLocation.y)
    // 사용 후 삭제
    delete window.searchLocation
  }

  stations.forEach((station, index) => {
    
    // WGS84 좌표
    const latLng = new window.naver.maps.LatLng(
      parseFloat(station.GIS_Y_COOR), 
      parseFloat(station.GIS_X_COOR)
    )

    // 마커 생성
    const marker = new window.naver.maps.Marker({
      position: latLng,
      map: map.value,
      title: station.OS_NM,
      icon: {
        content: `
          <div class="station-marker" style="
            background: #3B82F6;
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          ">${index + 1}</div>
        `,
        size: new window.naver.maps.Size(30, 30),
        anchor: new window.naver.maps.Point(15, 15)
      }
    })

    // 정보창 생성
    const infoWindow = new window.naver.maps.InfoWindow({
      content: `
        <div style="padding: 10px; min-width: 200px;">
          <h3 style="margin: 0 0 5px 0; font-size: 14px; font-weight: bold;">${station.OS_NM || '주유소명 없음'}</h3>
          ${station.VAN_ADR ? `<p style="margin: 0 0 3px 0; font-size: 12px; color: #666;">${station.VAN_ADR}</p>` : ''}
          <p style="margin: 0 0 3px 0; font-size: 12px; color: #666;">거리: ${station.DISTANCE}m</p>
          <p style="margin: 0 0 3px 0; font-size: 12px; color: #666;">브랜드: ${getBrandName(station.POLL_DIV_CD)}</p>
          <p style="margin: 0; font-size: 16px; font-weight: bold; color: #3B82F6;">${station.PRICE}원</p>
        </div>
      `,
      backgroundColor: 'white',
      borderColor: '#ddd',
      borderWidth: 1,
      anchorSize: new window.naver.maps.Size(10, 10),
      pixelOffset: new window.naver.maps.Point(0, -10)
    })

    // 마커 클릭 이벤트
    window.naver.maps.Event.addListener(marker, 'click', () => {
      infoWindow.open(map.value, marker)
    })

    markers.value.push(marker)
  })

  // 지도 중심을 첫 번째 주유소로 이동
  if (stations.length > 0) {
    const firstStation = stations[0]
    const centerLatLng = new window.naver.maps.LatLng(
      parseFloat(firstStation.GIS_Y_COOR),
      parseFloat(firstStation.GIS_X_COOR)
    )
    map.value.setCenter(centerLatLng)
    map.value.setZoom(14)
  }
}

// 주유소 상세 정보 조회
const fetchStationDetail = async (stationId) => {
  try {
    isDetailLoading.value = true
    
    const response = await axios.get('/api/stations/details', {
      params: { id: stationId }
    })
    
    // RESULT.OIL[0]에서 실제 데이터 추출
    const oilData = response.data?.RESULT?.OIL?.[0]
    
    if (!oilData) {
      alert('주유소 상세 정보를 불러올 수 없습니다.')
      return null
    }
    
    stationDetail.value = oilData
    
    return oilData
  } catch (error) {
    alert('주유소 상세 정보를 불러올 수 없습니다.')
    return null
  } finally {
    isDetailLoading.value = false
  }
}

// 리스트에서 주유소 클릭 시 지도에서 해당 마커로 포커스 + 상세 정보 표시
const focusOnStation = async (station, index) => {
  // 선택된 주유소 저장
  selectedStation.value = station
  
  // 상세 정보 조회
  if (station.UNI_ID) {
    await fetchStationDetail(station.UNI_ID)
    showDetailModal.value = true
  }
  
  // 지도 포커스
  if (!map.value) return

  const latLng = new window.naver.maps.LatLng(
    parseFloat(station.GIS_Y_COOR),
    parseFloat(station.GIS_X_COOR)
  )

  // 지도 중심을 해당 주유소로 이동
  map.value.setCenter(latLng)
  map.value.setZoom(17)

  // 해당 마커의 정보창 열기
  if (markers.value[index]) {
    const infoWindow = new window.naver.maps.InfoWindow({
      content: `
        <div style="padding: 10px; min-width: 200px;">
          <h3 style="margin: 0 0 5px 0; font-size: 14px; font-weight: bold;">${station.OS_NM || '주유소명 없음'}</h3>
          ${station.VAN_ADR ? `<p style="margin: 0 0 3px 0; font-size: 12px; color: #666;">${station.VAN_ADR}</p>` : ''}
          <p style="margin: 0 0 3px 0; font-size: 12px; color: #666;">거리: ${station.DISTANCE}m</p>
          <p style="margin: 0 0 3px 0; font-size: 12px; color: #666;">브랜드: ${getBrandName(station.POLL_DIV_CD)}</p>
          <p style="margin: 0; font-size: 16px; font-weight: bold; color: #3B82F6;">${station.PRICE}원</p>
        </div>
      `,
      backgroundColor: 'white',
      borderColor: '#ddd',
      borderWidth: 1,
      anchorSize: new window.naver.maps.Size(10, 10),
      pixelOffset: new window.naver.maps.Point(0, -10)
    })
    infoWindow.open(map.value, markers.value[index])
  }
}

// 상세 정보 모달 닫기
const closeDetailModal = () => {
  showDetailModal.value = false
  selectedStation.value = null
  stationDetail.value = null
}
</script>

<template>
  <div class="space-y-6">
    <!-- 유가 정보 섹션 -->
  <div class="space-y-4">
      <div class="flex items-center justify-between">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white">유가 정보</h2>
        <div v-if="hasUserAddress && userRegionOilPrices.gasoline.SIGUNNM" 
             class="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
          {{ userRegionOilPrices.gasoline.SIGUNNM }} 기준
        </div>
      </div>
      
      <!-- 지역 선택 영역 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div class="flex items-center gap-4">
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">시/도</label>
            <select v-model="selectedProvince" 
                    @change="onProvinceChange(selectedProvince)"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option v-for="province in availableProvinces" :key="province" :value="province">
                {{ province }}
              </option>
            </select>
          </div>
          <div class="flex-1">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">시/군/구</label>
            <select v-model="selectedCity" 
                    @change="onCityChange(selectedCity)"
                    class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option v-for="city in availableCities" :key="city" :value="city">
                {{ city }}
              </option>
            </select>
          </div>
        </div>
      </div>
      
    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
      <p class="mt-4 text-gray-600 dark:text-gray-400">데이터 로딩 중...</p>
    </div>

    <div v-else class="space-y-4">


      <!-- 가격 카드 -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <!-- 고급휘발유 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">고급휘발유</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ currentRegionOilPrices.premiumGasoline.PRICE || 0 }}원
              </p>
            </div>
            <div class="text-right">
              <span v-if="currentRegionOilPrices.premiumGasoline.DIFF !== 0"
                    :class="currentRegionOilPrices.premiumGasoline.DIFF > 0 ? 'text-red-500' : 'text-blue-500'"
                    class="text-sm font-medium">
                {{ currentRegionOilPrices.premiumGasoline.DIFF > 0 ? '▲' : '▼' }}
                {{ Math.abs(currentRegionOilPrices.premiumGasoline.DIFF) }}원
              </span>
              <span v-else class="text-sm font-medium text-gray-500 dark:text-gray-400">
                -
              </span>
            </div>
          </div>
      </div>

        <!-- 휘발유 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">휘발유</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">
                {{ currentRegionOilPrices.gasoline.PRICE || 0 }}원
              </p>
            </div>
            <div class="text-right">
              <span v-if="currentRegionOilPrices.gasoline.DIFF !== 0"
                    :class="currentRegionOilPrices.gasoline.DIFF > 0 ? 'text-red-500' : 'text-blue-500'"
                    class="text-sm font-medium">
                {{ currentRegionOilPrices.gasoline.DIFF > 0 ? '▲' : '▼' }}
                {{ Math.abs(currentRegionOilPrices.gasoline.DIFF) }}원
              </span>
              <span v-else class="text-sm font-medium text-gray-500 dark:text-gray-400">
                -
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
                {{ currentRegionOilPrices.diesel.PRICE || 0 }}원
              </p>
            </div>
            <div class="text-right">
              <span v-if="currentRegionOilPrices.diesel.DIFF !== 0"
                    :class="currentRegionOilPrices.diesel.DIFF > 0 ? 'text-red-500' : 'text-blue-500'"
                    class="text-sm font-medium">
                {{ currentRegionOilPrices.diesel.DIFF > 0 ? '▲' : '▼' }}
                {{ Math.abs(currentRegionOilPrices.diesel.DIFF) }}원
              </span>
              <span v-else class="text-sm font-medium text-gray-500 dark:text-gray-400">
                -
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
                {{ currentRegionOilPrices.lpg.PRICE || 0 }}원
              </p>
            </div>
            <div class="text-right">
              <span v-if="currentRegionOilPrices.lpg.DIFF !== 0"
                    :class="currentRegionOilPrices.lpg.DIFF > 0 ? 'text-red-500' : 'text-blue-500'"
                    class="text-sm font-medium">
                {{ currentRegionOilPrices.lpg.DIFF > 0 ? '▲' : '▼' }}
                {{ Math.abs(currentRegionOilPrices.lpg.DIFF) }}원
              </span>
              <span v-else class="text-sm font-medium text-gray-500 dark:text-gray-400">
                -
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>

    <!-- 주유소 찾기 섹션 -->
    <div class="space-y-4">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-white">주유소 찾기</h2>
      
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <!-- 검색 입력 -->
        <div class="space-y-3 mb-4">
          <!-- 사용자 주소로 검색 버튼 -->
          <div v-if="hasUserAddress" class="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div class="flex-1">
              <p class="text-sm text-blue-700 dark:text-blue-300 font-medium">등록 주소로 검색</p>
              <p class="text-xs text-blue-600 dark:text-blue-400">{{ userAddress }}</p>
            </div>
            <div class="flex items-center gap-2">
              <button @click="searchWithUserAddress"
                      :disabled="stationLoading"
                      class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                {{ stationLoading ? '검색중...' : '등록 주소로 검색' }}
              </button>
            </div>
          </div>
          
          <!-- 일반 검색 입력 -->
          <div class="flex gap-2">
            <div class="relative flex-1">
              <input v-model="addressInput" 
                     @keyup.enter="searchGasStations"
                     :disabled="stationLoading"
                     placeholder="주소 입력 (예: 서울시 강남구)"
                     class="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white disabled:opacity-50"/>
              
              <!-- x 버튼 (입력값이 있을 때만 표시) -->
              <button v-if="addressInput.trim() && !stationLoading"
                      @click="clearSearchInput"
                      class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <!-- 등록 주소 버튼 -->
            <button v-if="authStore.isAuthenticated && addressInput.trim()"
                    @click="saveAsDefaultAddress"
                    :disabled="isSavingAddress || stationLoading"
                    :class="[
                      'flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
                      hasUserAddress 
                        ? 'bg-green-600 text-white hover:bg-green-700 border border-green-600' 
                        : 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 border border-green-300 dark:border-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                    ]">
              <svg v-if="!isSavingAddress" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              <div v-else class="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
              {{ isSavingAddress ? '저장중...' : '주소 등록' }}
            </button>
            
            <button @click="searchGasStations"
                    :disabled="stationLoading"
                    class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {{ stationLoading ? '검색중...' : '검색' }}
            </button>
          </div>
        </div>

        <p v-if="searchError" class="text-red-600 dark:text-red-400 text-sm mb-4">{{ searchError }}</p>

        <!-- 지도와 검색 결과 레이아웃 -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- 지도 영역 -->
          <div class="order-2 lg:order-1">
            <div class="mb-2 flex items-center gap-2">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">지도</h3>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                ({{ gasolineStations.length }}개 주유소)
              </span>
            </div>
            
            <!-- 지도 컨테이너 -->
            <div 
              ref="mapContainer"
              class="w-full rounded-lg border border-gray-200 dark:border-gray-700 relative"
              style="height: 500px; min-height: 500px;"
            >
              <!-- 지도 로딩 중 -->
              <div v-if="!map" class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div class="text-center">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p class="text-sm text-gray-600 dark:text-gray-400">지도 로딩 중...</p>
                </div>
              </div>
              
              <!-- 지도 로드 실패 시 -->
              <div v-else-if="searchError && searchError.includes('지도')" class="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div class="text-center p-4">
                  <svg class="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">지도를 불러올 수 없습니다</p>
                  <p class="text-xs text-gray-500 dark:text-gray-500">API 키를 확인해주세요</p>
                </div>
              </div>
            </div>
            
            <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span class="inline-flex items-center gap-1">
                <div class="w-3 h-3 bg-red-500 rounded-full"></div>
                검색 위치
              </span>
              <span class="ml-4 inline-flex items-center gap-1">
                <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                주유소
              </span>
            </div>
          </div>

          <!-- 검색 결과 리스트 -->
          <div class="order-1 lg:order-2">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">검색 결과</h3>
            
            <!-- 로딩 상태 -->
            <div v-if="stationLoading" class="text-center py-12">
              <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
              <p class="mt-3 text-gray-600 dark:text-gray-400 text-sm">주유소 검색 중...</p>
            </div>
            
            <!-- 검색 결과 있을 때 -->
            <div v-else-if="gasolineStations.length > 0" class="space-y-2 overflow-y-auto" style="max-height: 480px;">
              <div v-for="(station, index) in gasolineStations" :key="station.POLL_DIV_CD || index"
                   class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                   @click="focusOnStation(station, index)">
                <div class="flex justify-between items-start gap-4">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {{ index + 1 }}
                      </span>
                      <p class="font-medium text-gray-900 dark:text-white truncate">
                        {{ station.OS_NM }}
                      </p>
                    </div>
                    <p v-if="station.VAN_ADR" class="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {{ station.VAN_ADR }}
                    </p>
                    <p v-else class="text-sm text-gray-500 dark:text-gray-400 truncate">
                      브랜드: {{ getBrandName(station.POLL_DIV_CD) }} • ID: {{ station.UNI_ID }}
                    </p>
                    <div class="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>거리: {{ station.DISTANCE }}m</span>
                      <span>•</span>
                      <span>브랜드: {{ getBrandName(station.POLL_DIV_CD) }}</span>
                    </div>
                  </div>
                  <div class="flex flex-col items-end">
                    <p class="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {{ station.PRICE }}원
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {{ getBrandName(station.POLL_DIV_CD) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 검색 전 안내 메시지 -->
            <div v-else class="flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600" style="height: 480px;">
              <div class="text-center">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p class="mt-3 text-gray-600 dark:text-gray-400">주소를 입력하고 검색 버튼을 눌러주세요</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 배경 오버레이 (사이드바 열릴 때) -->
    <Transition name="fade">
      <div 
        v-if="showDetailModal" 
        class="fixed inset-0 bg-black bg-opacity-30 z-40"
        @click="closeDetailModal"
      ></div>
    </Transition>

    <!-- 주유소 상세 정보 사이드바 -->
    <Transition name="slide">
      <div 
        v-if="showDetailModal" 
        class="fixed top-0 right-0 h-full w-full md:w-[600px] lg:w-[700px] bg-white dark:bg-gray-800 shadow-2xl z-50 overflow-y-auto"
      >
        <!-- 사이드바 헤더 -->
        <div class="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center z-10">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ selectedStation?.OS_NM || '주유소 상세 정보' }}
          </h2>
          <button 
            @click="closeDetailModal"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 사이드바 내용 -->
        <div class="px-6 py-6">
          <!-- 로딩 상태 -->
          <div v-if="isDetailLoading" class="text-center py-12">
            <div class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p class="text-gray-600 dark:text-gray-400">상세 정보를 불러오는 중...</p>
          </div>

          <!-- 상세 정보 표시 -->
          <div v-else-if="stationDetail" class="space-y-8">
            <!-- 브랜드 정보 -->
            <div class="pb-6 border-b border-gray-200 dark:border-gray-700">
              <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">브랜드</p>
              <p class="text-3xl font-bold text-gray-900 dark:text-white">
                {{ getBrandName(stationDetail.POLL_DIV_CO) }}
              </p>
            </div>

            <!-- 가격 정보 (OIL_PRICE 배열) -->
            <div v-if="stationDetail.OIL_PRICE && stationDetail.OIL_PRICE.length > 0">
              <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">가격 정보</h3>
              <div class="space-y-3">
                <div 
                  v-for="oil in stationDetail.OIL_PRICE" 
                  :key="oil.PRODCD"
                  class="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div class="flex-1">
                    <p class="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {{ getOilTypeName(oil.PRODCD) }}
                    </p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                      {{ formatDate(oil.TRADE_DT, oil.TRADE_TM) }}
                    </p>
                  </div>
                  <div class="text-right">
                    <p class="text-3xl font-bold text-gray-900 dark:text-white">{{ oil.PRICE.toLocaleString() }}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">원/L</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 주소 정보 -->
            <div v-if="stationDetail.NEW_ADR || stationDetail.VAN_ADR">
              <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">위치</h3>
              <div class="space-y-4">
                <!-- 도로명 주소 -->
                <div v-if="stationDetail.NEW_ADR">
                  <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">도로명</p>
                  <p class="text-base text-gray-900 dark:text-white leading-relaxed">{{ stationDetail.NEW_ADR }}</p>
                </div>
                <!-- 지번 주소 -->
                <div v-if="stationDetail.VAN_ADR">
                  <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">지번</p>
                  <p class="text-base text-gray-900 dark:text-white leading-relaxed">{{ stationDetail.VAN_ADR }}</p>
                </div>
              </div>
            </div>

            <!-- 전화번호 -->
            <div v-if="stationDetail.TEL">
              <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">연락처</h3>
              <div class="flex items-center justify-between p-5 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p class="text-xl font-semibold text-gray-900 dark:text-white">{{ stationDetail.TEL }}</p>
                <a 
                  :href="`tel:${stationDetail.TEL}`"
                  class="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-lg text-base font-medium transition-colors"
                >
                  전화걸기
                </a>
              </div>
            </div>

            <!-- 시설정보 -->
            <div>
              <h3 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-6">시설정보</h3>
              <div class="grid grid-cols-5 gap-6">
                <div 
                  v-for="facility in getFacilities(stationDetail)" 
                  :key="facility.key"
                  class="flex flex-col items-center gap-3"
                >
                  <!-- SVG 아이콘 -->
                  <component
                    :is="getIconComponent(facility.icon)"
                    :class="[
                      'w-12 h-12 transition-all',
                      facility.active 
                        ? 'text-gray-900 dark:text-white opacity-100' 
                        : 'text-gray-400 dark:text-gray-600 opacity-30'
                    ]"
                  />
                  <!-- 이름 -->
                  <p 
                    :class="[
                      'text-sm font-medium text-center transition-colors',
                      facility.active 
                        ? 'text-gray-900 dark:text-white' 
                        : 'text-gray-400 dark:text-gray-600'
                    ]"
                  >
                    {{ facility.name }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- 에러 상태 -->
          <div v-else class="text-center py-12">
            <p class="text-gray-600 dark:text-gray-400">상세 정보를 불러올 수 없습니다.</p>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* 배경 페이드 애니메이션 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 사이드바 슬라이드 애니메이션 */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}

.slide-enter-to,
.slide-leave-from {
  transform: translateX(0);
}
</style>

