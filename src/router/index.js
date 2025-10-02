import { createRouter, createWebHistory } from "vue-router";
import MainView from "../views/MainView.vue";
import LoginView from "../views/LoginView.vue";
import SignupView from "../views/SignupView.vue";
import CommunityWriteView from "../views/CommunityWriteView.vue";
import CommunityDetailView from "../views/CommunityDetailView.vue";
import { getToken } from "../utils/auth.js";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: MainView,
      meta: { requiresAuth: true }, // 인증 필요
    },
    {
      path: "/login",
      name: "login",
      component: LoginView,
      meta: { requiresAuth: false }, // 인증 불필요
    },
    {
      path: "/signup",
      name: "signup",
      component: SignupView,
      meta: { requiresAuth: false }, // 인증 불필요
    },
    {
      path: "/about",
      name: "about",
      component: () => import("../views/AboutView.vue"),
      meta: { requiresAuth: false }, // 인증 불필요
    },
    {
      path: "/community/write",
      name: "community-write",
      component: CommunityWriteView,
      meta: { requiresAuth: true }, // 인증 필요
    },
    {
      path: "/community/:id",
      name: "community-detail",
      component: CommunityDetailView,
      meta: { requiresAuth: true }, // 인증 필요
    },
  ],
});

// JWT 기반 전역 네비게이션 가드
router.beforeEach((to, from, next) => {
  console.log("🔍 라우팅:", from.path, "→", to.path);

  // 해당 라우트가 인증을 필요로 하는지 확인
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  // JWT 토큰 확인
  const token = getToken();
  const isAuthenticated = !!token;

  console.log("인증 필요:", requiresAuth);
  console.log("인증 상태:", isAuthenticated);

  if (requiresAuth && !isAuthenticated) {
    // 인증이 필요한데 토큰이 없으면 로그인 페이지로
    console.log("인증 필요 - 로그인 페이지로 이동");
    next({
      path: "/login",
      query: { redirect: to.fullPath }, // 로그인 후 원래 가려던 페이지로 이동
    });
  } else if (to.path === "/login" && isAuthenticated) {
    // 이미 로그인된 상태에서 로그인 페이지 접근 시 홈으로
    console.log("이미 로그인됨 - 홈으로 이동");
    next("/");
  } else {
    // 그 외의 경우 정상 진행
    next();
  }
});

export default router;
