const KEY = 'jlpt-n3-progress'

function dateKey(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function todayKey() {
  return dateKey(new Date())
}

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(KEY))
    return { answers: {}, daily: {}, ...data }
  } catch {
    return { answers: {}, daily: {} }
  }
}

function save(data) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

// Ghi lại một lần trả lời. mode: 'multiple' | 'fill'
export function recordAnswer(mode, questionId, correct) {
  const data = load()

  const key = `${mode}-${questionId}`
  const entry = data.answers[key] || { mode, questionId, correct: 0, wrong: 0 }
  if (correct) entry.correct += 1
  else entry.wrong += 1
  entry.lastCorrect = correct
  entry.lastAt = new Date().toISOString()
  data.answers[key] = entry

  const t = todayKey()
  const day = data.daily[t] || { answered: 0, correct: 0 }
  day.answered += 1
  if (correct) day.correct += 1
  data.daily[t] = day

  save(data)
}

export function getProgress() {
  return load()
}

export function getTodayStats() {
  return load().daily[todayKey()] || { answered: 0, correct: 0 }
}

// Chuỗi ngày học liên tiếp (nếu hôm nay chưa học thì tính từ hôm qua)
export function getStreak() {
  const daily = load().daily
  const d = new Date()
  if (!(daily[dateKey(d)]?.answered > 0)) d.setDate(d.getDate() - 1)
  let streak = 0
  while (daily[dateKey(d)]?.answered > 0) {
    streak += 1
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export function getTotals() {
  const data = load()
  const days = Object.values(data.daily)
  return {
    answered: days.reduce((sum, d) => sum + d.answered, 0),
    correct: days.reduce((sum, d) => sum + d.correct, 0),
    studyDays: days.length,
  }
}

// Các câu mà lần trả lời gần nhất bị sai
export function getWrongIds(mode) {
  return Object.values(load().answers)
    .filter((e) => e.mode === mode && e.lastCorrect === false)
    .map((e) => e.questionId)
}

export function clearProgress() {
  localStorage.removeItem(KEY)
}
