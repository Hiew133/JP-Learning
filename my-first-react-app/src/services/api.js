const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
// Gốc server (không kèm /api) — dùng cho file tĩnh như audio
export const SERVER_ORIGIN = BASE.replace(/\/api\/?$/, '')

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  let data = null
  try {
    data = await res.json()
  } catch {
    // Server trả về nội dung không phải JSON (vd: lỗi 502 từ proxy)
  }

  if (!res.ok) {
    throw new Error(data?.error || `Lỗi server (${res.status})`)
  }
  if (data === null) throw new Error('Server trả về dữ liệu không hợp lệ')
  return data
}

export const getQuestions = () => request('/questions')

export const getLessons = () => request('/lessons')

export const getLesson = (id) => request(`/lessons/${id}`)

export const addLesson = (url, title = '') =>
  request('/lessons', {
    method: 'POST',
    body: JSON.stringify({ url, title }),
  })

export const updateLessonTitle = (id, title) =>
  request(`/lessons/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  })

export const deleteLesson = (id) =>
  request(`/lessons/${id}`, { method: 'DELETE' })

// ===== Bài nghe từ file audio (AI sinh câu hỏi) =====

export const getAudioLessons = () => request('/audio-lessons')

export const getAudioLesson = (id) => request(`/audio-lessons/${id}`)

// Sinh (hoặc lấy cache) câu điền-khuyết từ nội dung đã lưu
export const generateAudioFill = (id, force = false) =>
  request(`/audio-lessons/${id}/fill${force ? '?force=1' : ''}`, { method: 'POST' })

export const generateLessonFill = (id, force = false) =>
  request(`/lessons/${id}/fill${force ? '?force=1' : ''}`, { method: 'POST' })

export const deleteAudioLesson = (id) =>
  request(`/audio-lessons/${id}`, { method: 'DELETE' })

// Tải audio + transcript lên; backend gọi Claude sinh câu hỏi rồi trả về bài nghe đã lưu.
// Dùng FormData (không set Content-Type để trình duyệt tự thêm boundary).
export async function createAudioLesson({ audioFile, transcript, title }) {
  const form = new FormData()
  form.append('audio', audioFile)
  form.append('transcript', transcript)
  if (title) form.append('title', title)

  const res = await fetch(`${BASE}/audio-lessons`, { method: 'POST', body: form })

  let data = null
  try {
    data = await res.json()
  } catch {
    // không phải JSON
  }
  if (!res.ok) throw new Error(data?.error || `Lỗi server (${res.status})`)
  if (data === null) throw new Error('Server trả về dữ liệu không hợp lệ')
  return data
}
