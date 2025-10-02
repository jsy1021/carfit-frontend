import "./assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import axios from "axios";
import { getAuthHeader } from "./utils/auth.js";
import { setupTokenRefreshInterceptor } from "./utils/tokenRefresh.js";

// axios 기본 설정
axios.defaults.baseURL = 'http://localhost:8080'
axios.defaults.withCredentials = true  // httpOnly 쿠키 포함

// Pinia 인스턴스 및 앱 생성
const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// 요청 인터셉터 - 모든 요청에 Access Token 자동 추가
axios.interceptors.request.use(
  (config) => {
    const authHeader = getAuthHeader()
    if (authHeader) {
      config.headers.Authorization = authHeader
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 토큰 갱신 인터셉터 설정 (401 에러 시 자동으로 Refresh Token으로 갱신)
setupTokenRefreshInterceptor()

app.mount("#app");