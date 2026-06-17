import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import PageState from '../components/PageState'
import TTSPlayer from '../components/TTSPlayer'
import FillBlankRunner from '../components/FillBlankRunner'
import {
  getAudioLesson,
  getLesson,
  generateAudioFill,
  generateLessonFill,
  SERVER_ORIGIN,
} from '../services/api'

// Quiz nghe-điền-khuyết sinh bởi AI.
// source: 'audio' (file đã upload — phát file thật) | 'lesson' (YouTube — đọc TTS từng câu)
export default function ContentFillQuiz({ source, onBack }) {
  const { id } = useParams()

  const [meta, setMeta] = useState(null)
  const [questions, setQuestions] = useState(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false

    const fetchMeta = source === 'audio' ? getAudioLesson(id) : getLesson(id)
    const fetchFill = source === 'audio' ? generateAudioFill(id) : generateLessonFill(id)

    Promise.all([fetchMeta, fetchFill])
      .then(([m, qs]) => {
        if (!cancelled) {
          setMeta(m)
          setQuestions(qs)
        }
      })
      .catch((err) => !cancelled && setError(err.message))

    return () => {
      cancelled = true
    }
  }, [id, source, attempt])

  const retry = () => {
    setQuestions(null)
    setMeta(null)
    setError('')
    setAttempt((a) => a + 1)
  }

  if (error) return <PageState onBack={onBack} error={error} onRetry={retry} />

  if (!questions || !meta) {
    return (
      <div className="page">
        <button className="back-btn" onClick={onBack} aria-label="Quay lại"><span aria-hidden="true">←</span> <span lang="ja">戻る</span></button>
        <div className="card state-card">
          <div className="loading-row">
            <span className="spinner" />
            <p className="lib-loading">AI đang tạo câu điền từ... (lần đầu hơi lâu)</p>
          </div>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="page">
        <button className="back-btn" onClick={onBack} aria-label="Quay lại"><span aria-hidden="true">←</span> <span lang="ja">戻る</span></button>
        <div className="card state-card">
          <p className="lib-empty">Không tạo được câu điền từ cho nội dung này.</p>
        </div>
      </div>
    )
  }

  const renderAudio =
    source === 'audio'
      ? () => (
          <audio
            className="audio-player"
            controls
            src={`${SERVER_ORIGIN}${meta.audio_url}`}
          />
        )
      : (q) => <TTSPlayer key={q.id} text={q.script} />

  return (
    <div className="page">
      <FillBlankRunner
        questions={questions}
        mode={`fill-${source}-${id}`}
        onBack={onBack}
        renderAudio={renderAudio}
      />
    </div>
  )
}
