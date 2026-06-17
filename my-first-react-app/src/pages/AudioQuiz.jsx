import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import PageState from '../components/PageState'
import { getAudioLesson, SERVER_ORIGIN } from '../services/api'
import { recordAnswer } from '../services/progress'

const SPEEDS = [0.75, 1.0, 1.25, 1.5]

export default function AudioQuiz({ onBack }) {
  const { id } = useParams()
  const audioRef = useRef(null)

  const [lesson, setLesson] = useState(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [showScript, setShowScript] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const [speed, setSpeed] = useState(1.0)

  useEffect(() => {
    let cancelled = false
    getAudioLesson(id)
      .then((l) => {
        if (!cancelled) setLesson(l)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [id, attempt])

  const retry = () => {
    setLesson(null)
    setError('')
    setAttempt((a) => a + 1)
  }

  const handleSpeed = (s) => {
    setSpeed(s)
    if (audioRef.current) audioRef.current.playbackRate = s
  }

  if (error || !lesson) {
    return (
      <PageState onBack={onBack} error={error} onRetry={retry} />
    )
  }

  const questions = lesson.questions
  const q = questions[index]
  const answered = selected !== null
  const isCorrect = answered && selected === q.answer

  const handleSelect = (i) => {
    if (answered) return
    setSelected(i)
    const correct = i === q.answer
    if (correct) setScore((s) => s + 1)
    recordAnswer('audio', `${lesson.id}-${index}`, correct)
  }

  const handleNext = () => {
    if (index + 1 >= questions.length) {
      setFinished(true)
    } else {
      setIndex((i) => i + 1)
      setSelected(null)
      setShowScript(false)
    }
  }

  const handleRestart = () => {
    setIndex(0)
    setSelected(null)
    setShowScript(false)
    setScore(0)
    setFinished(false)
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <div className="page">
        <button className="back-btn" onClick={onBack}>← 戻る</button>
        <div className="result-screen">
          <div className="result-circle" style={{ '--pct': pct }}>
            <span className="result-score">{score}/{questions.length}</span>
            <span className="result-pct">{pct}%</span>
          </div>
          <div className={`result-stamp ${pct < 80 ? 'stamp-small' : ''}`}>
            {pct >= 80 ? '合格' : pct >= 60 ? 'もう一歩' : '要練習'}
          </div>
          <p className="result-msg">
            {pct >= 80 ? '素晴らしい！よくできました！🎉' : pct >= 60 ? 'もう少し！もう一度挑戦しよう 💪' : 'もっと練習しよう！頑張れ！🔥'}
          </p>
          <button className="btn-primary" onClick={handleRestart}>もう一度</button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="page-top">
        <button className="back-btn" onClick={onBack}>← 戻る</button>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${(index / questions.length) * 100}%` }}
          />
        </div>
        <span className="progress-label">{index + 1} / {questions.length}</span>
      </div>

      <div className="card shadow-header-card">
        <h2 className="shadow-title">{lesson.title}</h2>
      </div>

      {/* Trình phát audio thật */}
      <div className="card">
        <p className="card-label">🎧 音声を聞いてください</p>
        <audio
          ref={audioRef}
          className="audio-player"
          controls
          src={`${SERVER_ORIGIN}${lesson.audio_url}`}
        />
        <div className="tts-speeds">
          {SPEEDS.map((s) => (
            <button
              key={s}
              className={`tts-speed-btn ${speed === s ? 'active' : ''}`}
              onClick={() => handleSpeed(s)}
            >
              {s}×
            </button>
          ))}
        </div>

        <button className="toggle-btn" onClick={() => setShowScript((v) => !v)}>
          {showScript ? '▲ スクリプトを隠す' : '▼ スクリプトを見る'}
        </button>

        {showScript && (
          <div className="script-box">
            {lesson.transcript.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}
      </div>

      {/* Câu hỏi trắc nghiệm */}
      <div className="card">
        <p className="question-text">{q.question}</p>

        <div className="options-list">
          {q.options.map((opt, i) => {
            let cls = 'option-btn'
            if (answered) {
              if (i === q.answer) cls += ' correct'
              else if (i === selected) cls += ' wrong'
            }
            return (
              <button
                key={i}
                className={cls}
                onClick={() => handleSelect(i)}
                disabled={answered}
              >
                <span className="option-letter">{['A', 'B', 'C', 'D'][i]}</span>
                <span>{opt}</span>
              </button>
            )
          })}
        </div>

        {answered && (
          <div className={`feedback-box ${isCorrect ? 'fb-correct' : 'fb-wrong'}`}>
            <p className="fb-title">{isCorrect ? '✓ 正解！' : '✗ 不正解'}</p>
            <p className="fb-exp">{q.explanation}</p>
          </div>
        )}

        {answered && (
          <button className="btn-primary next-btn" onClick={handleNext}>
            {index + 1 >= questions.length ? '結果を見る →' : '次の問題 →'}
          </button>
        )}
      </div>
    </div>
  )
}
