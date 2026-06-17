import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import TTSPlayer from '../components/TTSPlayer'
import Recorder from '../components/Recorder'
import PageState from '../components/PageState'
import useQuestions from '../hooks/useQuestions'
import { getLesson } from '../services/api'

function extractVideoId(url) {
  const patterns = [
    /youtube\.com\/watch\?v=([^&\n?#]+)/,
    /youtu\.be\/([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ]
  for (const p of patterns) {
    const m = url?.match(p)
    if (m) return m[1]
  }
  return null
}

export default function Shadowing({ onBack }) {
  const { lessonId } = useParams()
  const isLibraryMode = Boolean(lessonId)

  const { questions: builtinScripts, loading, error, retry } = useQuestions('shadowing')

  const [lesson, setLesson] = useState(null)
  const [lessonError, setLessonError] = useState('')
  const [lessonAttempt, setLessonAttempt] = useState(0)

  const [index, setIndex] = useState(0)
  const [showScript, setShowScript] = useState(false)
  const [showTrans, setShowTrans] = useState(false)
  const [useYT, setUseYT] = useState(true)

  useEffect(() => {
    if (!lessonId) return
    let cancelled = false
    getLesson(lessonId)
      .then((l) => {
        if (!cancelled) setLesson(l)
      })
      .catch((err) => {
        if (!cancelled) setLessonError(err.message)
      })
    return () => {
      cancelled = true
    }
  }, [lessonId, lessonAttempt])

  const retryLesson = () => {
    setLesson(null)
    setLessonError('')
    setLessonAttempt((a) => a + 1)
  }

  if (isLibraryMode) {
    if (lessonError || !lesson) {
      return (
        <PageState onBack={onBack} error={lessonError} onRetry={retryLesson} />
      )
    }
  } else if (loading || error) {
    return <PageState onBack={onBack} error={error} onRetry={retry} />
  }

  const scripts = isLibraryMode
    ? [{ id: `lib-${lesson.id}`, title: lesson.title, category: 'ライブラリ', script: lesson.transcript, translation: '' }]
    : builtinScripts

  const s = scripts[index]
  const videoId = isLibraryMode ? extractVideoId(lesson.youtube_url) : null

  const goTo = (i) => {
    setIndex(i)
    setShowScript(false)
    setShowTrans(false)
  }

  return (
    <div className="page">
      <div className="page-top">
        <button className="back-btn" onClick={onBack} aria-label="Quay lại"><span aria-hidden="true">←</span> <span lang="ja">戻る</span></button>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${((index + 1) / scripts.length) * 100}%` }} />
        </div>
        <span className="progress-label">{index + 1} / {scripts.length}</span>
      </div>

      <div className="card shadow-header-card">
        <div className="shadow-meta">
          <span className="shadow-category">{s.category}</span>
          {!isLibraryMode && <span className="shadow-level">N3</span>}
        </div>
        <h2 className="shadow-title" lang="ja">{s.title}</h2>
      </div>

      {/* Audio source */}
      <div className="card">
        <p className="card-label"><span aria-hidden="true">🔊 </span><span lang="ja">音声</span></p>

        {/* YouTube embed (library mode only) */}
        {isLibraryMode && videoId && (
          <>
            <div className="yt-toggle-row">
              <button
                className={`yt-source-btn ${useYT ? 'active' : ''}`}
                onClick={() => setUseYT(true)}
              >
                ▶ YouTube（本物の声）
              </button>
              <button
                className={`yt-source-btn ${!useYT ? 'active' : ''}`}
                onClick={() => setUseYT(false)}
              >
                🤖 TTS（自動音声）
              </button>
            </div>

            {useYT ? (
              <div className="yt-embed-wrap">
                <iframe
                  className="yt-embed"
                  src={`https://www.youtube.com/embed/${videoId}?cc_load_policy=0&rel=0`}
                  title={lesson.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <TTSPlayer key={s.id} text={s.script} />
            )}
          </>
        )}

        {/* TTS only (built-in scripts or no video ID) */}
        {(!isLibraryMode || !videoId) && <TTSPlayer key={s.id} text={s.script} />}

        <div className="shadow-steps" lang="ja">
          <div className="shadow-step"><span className="step-num">一</span><span>音声を聞く</span></div>
          <div className="shadow-step"><span className="step-num">二</span><span>同時に声を出す</span></div>
          <div className="shadow-step"><span className="step-num">三</span><span>スクリプトで確認</span></div>
        </div>
      </div>

      {/* Record your own voice */}
      <div className="card">
        <p className="card-label">🎤 録音 — Ghi âm giọng bạn và so sánh với audio gốc</p>
        <Recorder key={s.id} />
      </div>

      {/* Script / Translation */}
      <div className="card">
        <div className="toggle-row">
          <button className="toggle-btn" onClick={() => setShowScript((v) => !v)} aria-expanded={showScript} lang="ja">
            {showScript ? '▲ スクリプトを隠す' : '📄 スクリプトを見る'}
          </button>
          {s.translation && (
            <button className="toggle-btn" onClick={() => setShowTrans((v) => !v)} aria-expanded={showTrans} lang="ja">
              {showTrans ? '▲ 翻訳を隠す' : '🇻🇳 翻訳を見る'}
            </button>
          )}
        </div>

        {showScript && (
          <div className="script-box shadow-script" lang="ja">
            <p>{s.script}</p>
          </div>
        )}

        {showTrans && s.translation && (
          <div className="trans-box">
            <p>{s.translation}</p>
          </div>
        )}
      </div>

      {/* Navigation (built-in mode only) */}
      {!isLibraryMode && (
        <div className="nav-row">
          <button className="btn-secondary" onClick={() => goTo(index - 1)} disabled={index === 0}>
            ← 前へ
          </button>
          <div className="dot-nav">
            {scripts.map((_, i) => (
              <button key={i} className={`dot ${i === index ? 'dot-active' : ''}`} onClick={() => goTo(i)} />
            ))}
          </div>
          <button className="btn-secondary" onClick={() => goTo(index + 1)} disabled={index === scripts.length - 1}>
            次へ →
          </button>
        </div>
      )}
    </div>
  )
}
