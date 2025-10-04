<script setup>
import { ref, onMounted, nextTick } from 'vue'
import axios from 'axios'

const gasolineStations = ref([])
const addressInput = ref('')
const searchError = ref('')
const stationLoading = ref(false)

// 지도 관련 상태
const mapContainer = ref(null)
const map = ref(null)
const markers = ref([])
const currentLocation = ref(null)

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
    console.log('🔍 주유소 검색 시작:', addressInput.value)
    
    const { x, y } = await getCoordinatesFromBackend(addressInput.value)
    console.log('📍 좌표 변환 성공:', { x, y })
    
    // 검색 위치 저장(KATEC 좌표를 기준으로 저장)
    currentLocation.value = { x, y }
    
    const response = await axios.get('/api/stations/nearby', {
      params: { x, y, radius: 5000, sort: 1, limit: 10 }
    })
    console.log('⛽ 주유소 데이터:', response.data)
    
    gasolineStations.value = response.data.stations.slice(0, 10)
    
    if (gasolineStations.value.length === 0) {
      searchError.value = '주변에 주유소가 없습니다.'
      clearMarkers()
    } else {
      console.log(`✅ ${gasolineStations.value.length}개 주유소 검색 완료`)
      console.log('첫 번째 주유소 데이터 구조:', gasolineStations.value[0])
      console.log('사용 가능한 속성들:', Object.keys(gasolineStations.value[0]))
      console.log('주소 필드 확인:', {
        VAN_ADR: gasolineStations.value[0].VAN_ADR,
        address: gasolineStations.value[0].address,
        addr: gasolineStations.value[0].addr,
        location: gasolineStations.value[0].location
      })
      
      // 지도에 마커 표시
      nextTick(() => {
        console.log('🗺️ 지도 객체 확인:', map.value ? '존재' : '없음')
        console.log('📍 검색 위치 좌표 (TM):', { x, y })
        console.log('⛽ 주유소 개수:', gasolineStations.value.length)
        console.log('🔍 첫 번째 주유소 좌표:', {
          x: gasolineStations.value[0]?.GIS_X_COOR,
          y: gasolineStations.value[0]?.GIS_Y_COOR
        })
        
        if (!map.value) {
          console.error('❌ 지도가 초기화되지 않았습니다!')
          return
        }
        
        // createLocationMarker(x, y) // 검색 위치 마커 (TM 좌표라서 제외)
        createStationMarkers(gasolineStations.value) // 주유소 마커들 (WGS84)
      })
    }
  } catch (err) {
    console.error('❌ 주유소 검색 오류:', err)
    console.error('에러 상세:', err.response?.data)
    searchError.value = err.response?.data?.message || '주소를 찾을 수 없습니다. 올바른 주소를 입력해주세요.'
    gasolineStations.value = []
    clearMarkers()
  } finally {
    stationLoading.value = false
  }
}

const getCoordinatesFromBackend = async (address) => {
  const res = await axios.get('/api/geocode', { params: { address } })
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
    console.error('❌ 네이버 지도 초기화 실패:', error)
    searchError.value = '지도를 불러올 수 없습니다. API 키를 확인해주세요.'
  }
}

// 기존 마커 제거
const clearMarkers = () => {
  markers.value.forEach(marker => marker.setMap(null))
  markers.value = []
}

// 주유소 마커 생성
const createStationMarkers = (stations) => {
  console.log('🎯 createStationMarkers 호출됨, 주유소 개수:', stations.length)
  
  if (!map.value) {
    console.error('❌ 지도 객체가 없습니다!')
    return
  }
  
  if (!stations.length) {
    console.warn('⚠️ 주유소 데이터가 없습니다!')
    return
  }

  clearMarkers()
  console.log('🧹 기존 마커 제거 완료')

  stations.forEach((station, index) => {
    console.log(`📍 마커 ${index + 1} 생성 중:`, {
      name: station.OS_NM,
      lat: station.GIS_Y_COOR,
      lng: station.GIS_X_COOR
    })
    
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
    console.log(`✅ 마커 ${index + 1} 생성 완료`)
  })

  console.log(`🎉 총 ${markers.value.length}개 마커 생성 완료`)

  // 지도 중심을 첫 번째 주유소로 이동
  if (stations.length > 0) {
    const firstStation = stations[0]
    const centerLatLng = new window.naver.maps.LatLng(
      parseFloat(firstStation.GIS_Y_COOR),
      parseFloat(firstStation.GIS_X_COOR)
    )
    console.log('🎯 지도 중심 이동:', centerLatLng)
    map.value.setCenter(centerLatLng)
    map.value.setZoom(14)
    console.log('✅ 지도 중심 이동 완료')
  }
}

// 검색 위치 마커 생성
const createLocationMarker = (x, y) => {
  if (!map.value) return

  const latLng = new window.naver.maps.LatLng(y, x)
  
  const locationMarker = new window.naver.maps.Marker({
    position: latLng,
    map: map.value,
    icon: {
      content: `
        <div style="
          background: #EF4444;
          color: white;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          border: 3px solid white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        ">📍</div>
      `,
      size: new window.naver.maps.Size(20, 20),
      anchor: new window.naver.maps.Point(10, 10)
    }
  })

  // 검색 위치로 지도 중심 이동
  map.value.setCenter(latLng)
  map.value.setZoom(14)

  return locationMarker
}

// 리스트에서 주유소 클릭 시 지도에서 해당 마커로 포커스
const focusOnStation = (station, index) => {
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

onMounted(async () => {
  await nextTick()
  await initMap()
})
</script>

<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
    <!-- 검색 입력 -->
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
          class="w-full h-80 rounded-lg border border-gray-200 dark:border-gray-700 relative"
          style="min-height: 320px;"
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
        <div v-else-if="gasolineStations.length > 0" class="space-y-2 max-h-80 overflow-y-auto">
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
                  브랜드: {{ station.POLL_DIV_CD }} • ID: {{ station.UNI_ID }}
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
                  {{ station.POLL_DIV_CD }}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 검색 전 안내 메시지 -->
        <div v-else class="text-center py-12 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p class="mt-3 text-gray-600 dark:text-gray-400">주소를 입력하고 검색 버튼을 눌러주세요</p>
        </div>
      </div>
    </div>
  </div>
</template>

