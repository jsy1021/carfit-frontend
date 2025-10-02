<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const posts = ref([])
const communityLoading = ref(false)

const loadPosts = async () => {
  communityLoading.value = true
  try {
    const response = await axios.get('/api/community/posts')
    posts.value = response.data
  } catch (error) {
    console.error('게시글 로딩 오류:', error)
  } finally {
    communityLoading.value = false
  }
}

const goToWritePost = () => {
  router.push('/community/write')
}

const goToPostDetail = (postId) => {
  router.push(`/community/${postId}`)
}

// 초기 로드
onMounted(() => {
  loadPosts()
})

defineExpose({ loadPosts })
</script>

<template>
  <div class="space-y-4">
    <!-- 헤더와 글쓰기 버튼 -->
    <div class="flex items-center justify-between">
      <h3 class="text-xl font-bold text-gray-900 dark:text-white">커뮤니티</h3>
      <button @click="goToWritePost"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        글쓰기
      </button>
    </div>

    <!-- 게시글 목록 -->
    <div v-if="communityLoading" class="text-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
      <p class="mt-4 text-gray-500 dark:text-gray-400">게시글을 불러오는 중...</p>
    </div>

    <div v-else class="space-y-3">
      <div v-for="post in posts" :key="post.id"
           @click="goToPostDetail(post.id)"
           class="bg-white dark:bg-gray-800 rounded-lg shadow p-5 hover:shadow-lg transition-all cursor-pointer border border-transparent hover:border-blue-500 dark:hover:border-blue-400">
        <div class="flex items-start justify-between mb-2">
          <h4 class="font-semibold text-lg text-gray-900 dark:text-white">{{ post.title }}</h4>
          <span class="text-xs text-gray-500 dark:text-gray-500 whitespace-nowrap ml-4">
            {{ post.createdAt }}
          </span>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{{ post.content }}</p>
        <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
          <div class="flex items-center gap-4">
            <span class="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {{ post.author }}
            </span>
            <span class="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {{ post.views || 0 }}
            </span>
            <span class="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {{ post.commentCount || 0 }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="posts.length === 0" class="text-center py-16 bg-white dark:bg-gray-800 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-gray-500 dark:text-gray-400 mb-4">아직 게시글이 없습니다.</p>
        <button @click="goToWritePost"
                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          첫 게시글 작성하기
        </button>
      </div>
    </div>
  </div>
</template>

