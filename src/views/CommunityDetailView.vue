<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'
import { useAuthStore } from '../stores/auth.js'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const post = ref(null)
const comments = ref([])
const newComment = ref('')
const isLoading = ref(true)
const isCommenting = ref(false)
const commentSortOrder = ref('asc') // 'asc': 과거순(오래된 순), 'desc': 최신순
const isEditing = ref(false)
const isUpdating = ref(false)
const editForm = ref({
  title: '',
  content: ''
})

// 댓글 수정 관련 상태
const editingCommentId = ref(null)
const editCommentContent = ref('')
const isUpdatingComment = ref(false)

const loadPost = async () => {
  isLoading.value = true
  try {
    const postId = route.params.id
    const response = await axios.get(`/api/community/posts/${postId}`)
    post.value = response.data
    
    // 댓글 로드
    await loadComments()
  } catch (error) {
    console.error('게시글 로딩 오류:', error)
    console.error('에러 상세:', error.response?.data)
    alert('게시글을 불러오는데 실패했습니다.')
    router.push('/')
  } finally {
    isLoading.value = false
  }
}

const loadComments = async () => {
  try {
    const postId = route.params.id
    const params = {
      sort: commentSortOrder.value === 'desc' ? 'createdAt,desc' : 'createdAt,asc'
    }
    
    const commentsResponse = await axios.get(`/api/community/posts/${postId}/comments`, { params })
    // 백엔드가 배열을 직접 반환하면 그대로, Page 객체면 .content 사용
    let commentsData = Array.isArray(commentsResponse.data) 
      ? commentsResponse.data 
      : (commentsResponse.data.content || [])
    
    // 프론트엔드에서 정렬 (백엔드가 정렬을 지원하지 않는 경우 대비)
    comments.value = commentsData.sort((a, b) => {
      const dateA = new Date(a.createdAt)
      const dateB = new Date(b.createdAt)
      return commentSortOrder.value === 'desc' ? dateB - dateA : dateA - dateB
    })
  } catch (error) {
    console.error('댓글 로딩 오류:', error)
    console.error('에러 상세:', error.response?.data)
  }
}

const changeCommentSortOrder = (newSort) => {
  commentSortOrder.value = newSort
  loadComments()
}

const submitComment = async () => {
  // 로그인 확인
  if (!authStore.isLoggedIn || !authStore.userInfo) {
    alert('로그인이 필요합니다.')
    router.push('/login')
    return
  }
  
  if (!newComment.value.trim()) {
    alert('댓글 내용을 입력해주세요.')
    return
  }
  
  isCommenting.value = true
  
  try {
    const postId = route.params.id
    const authorId = authStore.userInfo.userId
    
    await axios.post(`/api/community/posts/${postId}/comments`, {
      authorId: authorId,
      content: newComment.value
    })
    newComment.value = ''
    await loadComments()  // 댓글 목록만 새로고침
    alert('댓글이 작성되었습니다.')
  } catch (error) {
    console.error('댓글 작성 오류:', error)
    console.error('에러 상세:', error.response?.data)
    alert('댓글 작성에 실패했습니다.')
  } finally {
    isCommenting.value = false
  }
}

const goBack = () => {
  router.push('/')
}

// 본인이 작성한 게시글인지 확인
const isAuthor = computed(() => {
  if (!authStore.userInfo || !post.value) return false
  return authStore.userInfo.userId === post.value.authorId
})

// 본인이 작성한 댓글인지 확인
const isCommentAuthor = (comment) => {
  if (!authStore.userInfo || !comment) return false
  return authStore.userInfo.userId === comment.authorId
}

// 댓글 수정 모드 시작
const startEditComment = (comment) => {
  editingCommentId.value = comment.id
  editCommentContent.value = comment.content
}

// 댓글 수정 취소
const cancelEditComment = () => {
  editingCommentId.value = null
  editCommentContent.value = ''
}

// 댓글 수정
const updateComment = async (commentId) => {
  if (!editCommentContent.value.trim()) {
    alert('댓글 내용을 입력해주세요.')
    return
  }
  
  isUpdatingComment.value = true
  
  try {
    const postId = route.params.id
    
    await axios.put(`/api/community/posts/${postId}/comments/${commentId}`, {
      content: editCommentContent.value
    })
    
    editingCommentId.value = null
    editCommentContent.value = ''
    await loadComments()
    alert('댓글이 수정되었습니다.')
  } catch (error) {
    console.error('댓글 수정 오류:', error)
    console.error('에러 상세:', error.response?.data)
    alert('댓글 수정에 실패했습니다.')
  } finally {
    isUpdatingComment.value = false
  }
}

// 댓글 삭제
const deleteComment = async (commentId) => {
  if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) {
    return
  }
  
  try {
    const postId = route.params.id
    await axios.delete(`/api/community/posts/${postId}/comments/${commentId}`)
    
    await loadComments()
    alert('댓글이 삭제되었습니다.')
  } catch (error) {
    console.error('댓글 삭제 오류:', error)
    console.error('에러 상세:', error.response?.data)
    alert('댓글 삭제에 실패했습니다.')
  }
}

// 수정 모드 시작
const startEdit = () => {
  editForm.value.title = post.value.title
  editForm.value.content = post.value.content
  isEditing.value = true
}

// 수정 취소
const cancelEdit = () => {
  if (confirm('수정을 취소하시겠습니까?')) {
    isEditing.value = false
    editForm.value.title = ''
    editForm.value.content = ''
  }
}

// 게시글 수정
const updatePost = async () => {
  if (!editForm.value.title.trim()) {
    alert('제목을 입력해주세요.')
    return
  }
  
  if (!editForm.value.content.trim()) {
    alert('내용을 입력해주세요.')
    return
  }
  
  isUpdating.value = true
  
  try {
    const postId = route.params.id
    
    // JSON 형식으로 전송 (백엔드가 @RequestBody 사용)
    await axios.put(`/api/community/posts/${postId}`, {
      title: editForm.value.title,
      content: editForm.value.content
    })
    
    alert('게시글이 수정되었습니다.')
    isEditing.value = false
    await loadPost()  // 게시글 다시 불러오기
  } catch (error) {
    console.error('게시글 수정 오류:', error)
    console.error('에러 상세:', error.response?.data)
    alert('게시글 수정에 실패했습니다.')
  } finally {
    isUpdating.value = false
  }
}

// 게시글 삭제
const deletePost = async () => {
  if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) {
    return
  }
  
  try {
    const postId = route.params.id
    await axios.delete(`/api/community/posts/${postId}`)
    
    alert('게시글이 삭제되었습니다.')
    router.push('/')
  } catch (error) {
    console.error('게시글 삭제 오류:', error)
    console.error('에러 상세:', error.response?.data)
    alert('게시글 삭제에 실패했습니다.')
  }
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
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-4">
            <button @click="goBack"
                    class="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">게시글</h1>
          </div>
          
          <!-- 수정/삭제 버튼 (작성자만) -->
          <div v-if="isAuthor && !isEditing" class="flex items-center gap-2">
            <button @click="startEdit"
                    class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              수정
            </button>
            <button @click="deletePost"
                    class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              삭제
            </button>
          </div>
        </div>

        <!-- 게시글 본문 (읽기 모드) -->
        <div v-if="!isEditing" class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
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

        <!-- 게시글 본문 (수정 모드) -->
        <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <div class="space-y-4">
            <!-- 제목 입력 -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                제목
              </label>
              <input 
                v-model="editForm.title"
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
                v-model="editForm.content"
                placeholder="내용을 입력하세요"
                rows="15"
                class="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                       focus:ring-2 focus:ring-blue-500 focus:border-transparent
                       dark:bg-gray-700 dark:text-white dark:placeholder-gray-400
                       transition-colors resize-none"
              ></textarea>
            </div>

            <!-- 수정 버튼 -->
            <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button @click="cancelEdit"
                      class="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                취소
              </button>
              <button @click="updatePost"
                      :disabled="isUpdating"
                      class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                <svg v-if="isUpdating" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {{ isUpdating ? '수정 중...' : '수정 완료' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 댓글 섹션 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              댓글 {{ comments.length }}개
            </h3>
            <div class="flex items-center gap-2">
              <span class="text-sm text-gray-600 dark:text-gray-400">정렬:</span>
              <div class="flex gap-2">
                <button @click="changeCommentSortOrder('asc')"
                        :class="[
                          'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                          commentSortOrder === 'asc'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        ]">
                  과거순
                </button>
                <button @click="changeCommentSortOrder('desc')"
                        :class="[
                          'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                          commentSortOrder === 'desc'
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        ]">
                  최신순
                </button>
              </div>
            </div>
          </div>

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
              
              <!-- 댓글 읽기 모드 -->
              <div v-if="editingCommentId !== comment.id">
                <div class="flex items-center justify-between mb-2">
                  <div class="flex items-center gap-2">
                    <span class="font-semibold text-sm text-gray-900 dark:text-white">{{ comment.author }}</span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">{{ comment.createdAt }}</span>
                  </div>
                  
                  <!-- 수정/삭제 버튼 (본인 댓글만) -->
                  <div v-if="isCommentAuthor(comment)" class="flex items-center gap-1">
                    <button @click="startEditComment(comment)"
                            class="px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors">
                      수정
                    </button>
                    <button @click="deleteComment(comment.id)"
                            class="px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors">
                      삭제
                    </button>
                  </div>
                </div>
                <p class="text-sm text-gray-700 dark:text-gray-300">{{ comment.content }}</p>
              </div>
              
              <!-- 댓글 수정 모드 -->
              <div v-else>
                <div class="flex items-center gap-2 mb-2">
                  <span class="font-semibold text-sm text-gray-900 dark:text-white">{{ comment.author }}</span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{ comment.createdAt }}</span>
                </div>
                <div class="space-y-2">
                  <textarea 
                    v-model="editCommentContent"
                    rows="3"
                    class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent
                           dark:bg-gray-700 dark:text-white dark:placeholder-gray-400
                           transition-colors resize-none"
                  ></textarea>
                  <div class="flex items-center justify-end gap-2">
                    <button @click="cancelEditComment"
                            class="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                      취소
                    </button>
                    <button @click="updateComment(comment.id)"
                            :disabled="isUpdatingComment"
                            class="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                      {{ isUpdatingComment ? '수정 중...' : '수정 완료' }}
                    </button>
                  </div>
                </div>
              </div>
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



