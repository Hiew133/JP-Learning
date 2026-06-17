import { useState, useEffect, useCallback } from 'react'
import { getQuestions } from '../services/api'

// Load một bộ câu hỏi từ backend: 'multipleChoice' | 'fillBlank' | 'shadowing'
export default function useQuestions(type) {
  const [questions, setQuestions] = useState(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    getQuestions()
      .then((data) => {
        if (!cancelled) setQuestions(data[type] || [])
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [type, attempt])

  const retry = useCallback(() => {
    setQuestions(null)
    setError('')
    setAttempt((a) => a + 1)
  }, [])

  return { questions, loading: questions === null && !error, error, retry }
}
