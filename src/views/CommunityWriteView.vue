<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const postForm = ref({
  title: '',
  content: ''
})
const isSubmitting = ref(false)

const submitPost = async () => {
  if (!postForm.value.title.trim()) {
    alert('제목을 입력해주세요.')
    return
  }
  
  if (!postForm.value.content.trim()) {
    alert('내용을 입력해주세요.')
    return
  }
  
  isSubmitting.value = true
  
  try {
    await axios.post('/api/community/posts', postForm.value)
    alert('게시글이 작성되었습니다.')
    router.push('/')  // 메인 페이지로 돌아가기
  } catch (error) {
    console.error('게시글 작성 오류:', error)
    alert('게시글 작성에 실패했습니다.')
  } finally {
    isSubmitting.value = false
  }
}

const goBack = () => {
  if (postForm.value.title || postForm.value.content) {
    if (confirm('작성 중인 내용이 있습니다. 정말 나가시겠습니까?')) {
      router.back()
    }
  } else {
    router.back()
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
    <div class="max-w-4xl mx-auto">
      <!-- 헤더 -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-4">
          <button @click="goBack"
                  class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">글 작성</h1>
        </div>
        <button @click="submitPost"
                :disabled="isSubmitting"
                class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
          <svg v-if="isSubmitting" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isSubmitting ? '작성 중...' : '작성 완료' }}
        </button>
      </div>

      <!-- 작성 폼 -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 space-y-4">
        <!-- 제목 입력 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            제목
          </label>
          <input 
            v-model="postForm.title"
            type="text"
            placeholder="제목을 입력하세요"
            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                   focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   dark:bg-gray-700 dark:text-white dark:placeholder-gray-400
                   transition-colors"
          />
        </div>

        <!-- 내용 입력 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            내용
          </label>
          <textarea 
            v-model="postForm.content"
            placeholder="내용을 입력하세요"
            rows="15"
            class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                   focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   dark:bg-gray-700 dark:text-white dark:placeholder-gray-400
                   transition-colors resize-none"
          ></textarea>
        </div>

        <!-- 작성 팁 -->
        <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="text-sm text-blue-800 dark:text-blue-300">
              <p class="font-semibold mb-1">작성 가이드</p>
              <ul class="list-disc list-inside space-y-1 text-xs">
                <li>다른 사용자에게 도움이 되는 정보를 공유해주세요.</li>
                <li>욕설이나 비방은 자제해주세요.</li>
                <li>구체적이고 명확한 제목을 작성해주세요.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
textarea {
  font-family: inherit;
}
</style>



