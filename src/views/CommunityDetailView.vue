<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const post = ref(null)
const comments = ref([])
const newComment = ref('')
const isLoading = ref(true)
const isCommenting = ref(false)

const loadPost = async () => {
  isLoading.value = true
  try {
    const postId = route.params.id
    const response = await axios.get(`/api/community/posts/${postId}`)
    post.value = response.data
    
    // 댓글 로드
    const commentsResponse = await axios.get(`/api/community/posts/${postId}/comments`)
    comments.value = commentsResponse.data
  } catch (error) {
    console.error('게시글 로딩 오류:', error)
    alert('게시글을 불러오는데 실패했습니다.')
    router.push('/')
  } finally {
    isLoading.value = false
  }
}

const submitComment = async () => {
  if (!newComment.value.trim()) {
    alert('댓글 내용을 입력해주세요.')
    return
  }
  
  isCommenting.value = true
  
  try {
    const postId = route.params.id
    await axios.post(`/api/community/posts/${postId}/comments`, {
      content: newComment.value
    })
    newComment.value = ''
    loadPost()  // 댓글 목록 새로고침
  } catch (error) {
    console.error('댓글 작성 오류:', error)
    alert('댓글 작성에 실패했습니다.')
  } finally {
    isCommenting.value = false
  }
}

const goBack = () => {
  router.push('/')
}

onMounted(() => {
  loadPost()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
    <div class="max-w-4xl mx-auto">
      <!-- 로딩 상태 -->
      <div v-if="isLoading" class="text-center py-16">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="mt-4 text-gray-500 dark:text-gray-400">게시글을 불러오는 중...</p>
      </div>

      <!-- 게시글 내용 -->
      <div v-else-if="post">
        <!-- 헤더 -->
        <div class="flex items-center gap-4 mb-6">
          <button @click="goBack"
                  class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">게시글</h1>
        </div>

        <!-- 게시글 본문 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">{{ post.title }}</h2>
          
          <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            <span class="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {{ post.author }}
            </span>
            <span>{{ post.createdAt }}</span>
            <span class="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {{ post.views || 0 }}
            </span>
          </div>

          <div class="prose dark:prose-invert max-w-none">
            <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ post.content }}</p>
          </div>
        </div>

        <!-- 댓글 섹션 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            댓글 {{ comments.length }}개
          </h3>

          <!-- 댓글 작성 -->
          <div class="mb-6">
            <textarea 
              v-model="newComment"
              placeholder="댓글을 입력하세요"
              rows="3"
              class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     dark:bg-gray-700 dark:text-white dark:placeholder-gray-400
                     transition-colors resize-none mb-2"
            ></textarea>
            <div class="flex justify-end">
              <button @click="submitComment"
                      :disabled="isCommenting"
                      class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                {{ isCommenting ? '작성 중...' : '댓글 작성' }}
              </button>
            </div>
          </div>

          <!-- 댓글 목록 -->
          <div class="space-y-4">
            <div v-for="comment in comments" :key="comment.id"
                 class="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-b-0">
              <div class="flex items-center gap-2 mb-2">
                <span class="font-semibold text-sm text-gray-900 dark:text-white">{{ comment.author }}</span>
                <span class="text-xs text-gray-500 dark:text-gray-400">{{ comment.createdAt }}</span>
              </div>
              <p class="text-sm text-gray-700 dark:text-gray-300">{{ comment.content }}</p>
            </div>

            <div v-if="comments.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400">
              첫 댓글을 작성해보세요!
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.prose {
  max-width: none;
}
</style>



