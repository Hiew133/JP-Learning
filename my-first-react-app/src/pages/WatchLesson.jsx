import { useState, useEffect, useRef, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PageState from '../components/PageState'
import Furigana from '../components/Furigana'
import { getLesson } from '../services/api'
import { loadYouTubeAPI } from '../services/youtube'

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

export default function WatchLesson({ onBack }) {
  const { id } = useParams()
  const navigate = useNavigate()

  const [lesson, setLesson] = useState(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)

  const [currentTime, setCurrentTime] = useState(0)
  const [showFurigana, setShowFurigana] = useState(true)
  const [showTrans, setShowTrans] = useState(true)

  const mountRef = useRef(null)
  const playerRef = useRef(null)
  const segRefs = useRef([])

  useEffect(() => {
    let cancelled = false
    getLesson(id)
      .then((l) => !cancelled && setLesson(l))
      .catch((err) => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [id, attempt])

  const retry = () => {
    setLesson(null)
    setError('')
    setAttempt((a) => a + 1)
  }

  const segments = useMemo(() => lesson?.segments || [], [lesson])
  const videoId = lesson ? extractVideoId(lesson.youtube_url) : null
  const synced = segments.length > 0 && Boolean(videoId)

  // Tạo YouTube player + theo dõi thời gian phát (chỉ khi có segments để đồng bộ)
  useEffect(() => {
    if (!synced || !mountRef.current) return
    let cancelled = false
    let timer = null

    const tick = () => {
      if (cancelled) return
      const p = playerRef.current
      if (p && p.getCurrentTime) setCurrentTime(p.getCurrentTime())
      timer = setTimeout(tick, 250)
    }

    loadYouTubeAPI().then((YT) => {
      if (cancelled || !mountRef.current) return
      playerRef.current = new YT.Player(mountRef.current, {
        videoId,
        playerVars: { rel: 0, cc_load_policy: 0, modestbranding: 1 },
        events: { onReady: tick },
      })
    })

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      const p = playerRef.current
      if (p && p.destroy) p.destroy()
      playerRef.current = null
    }
  }, [synced, videoId])

  // Dòng đang phát = segment cuối có start <= thời gian hiện tại
  const activeIndex = useMemo(() => {
    let idx = -1
    for (let i = 0; i < segments.length; i++) {
      if (segments[i].start <= currentTime + 0.2) idx = i
      else break
    }
    return idx
  }, [currentTime, segments])

  // Tự cuộn dòng đang phát vào giữa khung transcript
  useEffect(() => {
    const el = segRefs.current[activeIndex]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeIndex])

  const seekTo = (seg) => {
    const p = playerRef.current
    if (p && p.seekTo) {
      p.seekTo(seg.start, true)
      if (p.playVideo) p.playVideo()
    }
  }

  if (error || !lesson) {
    return <PageState onBack={onBack} error={error} onRetry={retry} />
  }

  // Bài cũ chưa có segments: hiện video thường + ghi chú
  if (!synced) {
    return (
      <div className="page">
        <button className="back-btn" onClick={onBack} aria-label="Quay lại"><span aria-hidden="true">←</span> <span lang="ja">戻る</span></button>
        <div className="card shadow-header-card">
          <h2 className="shadow-title">{lesson.title}</h2>
        </div>
        {videoId && (
          <div className="card">
            <div className="yt-embed-wrap">
              <iframe
                className="yt-embed"
                src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                title={lesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}
        <div className="card state-card">
          <p className="lib-note">
            ⚠️ Bài này được lưu trước khi có tính năng đồng bộ. Hãy xóa và thêm lại
            trong Thư viện để bật phụ đề chạy theo video + dịch + furigana.
          </p>
          {lesson.transcript && (
            <div className="script-box"><p>{lesson.transcript}</p></div>
          )}
        </div>
      </div>
    )
  }

  const active = activeIndex >= 0 ? segments[activeIndex] : null

  return (
    <div className="page watch-page">
      <div className="page-top">
        <button className="back-btn" onClick={onBack} aria-label="Quay lại"><span aria-hidden="true">←</span> <span lang="ja">戻る</span></button>
        <span className="lib-page-title">{lesson.title}</span>
      </div>

      <div className="watch-layout">
        {/* Cột trái: video + dòng đang phát */}
        <div className="watch-main">
          <div className="watch-video">
            <div ref={mountRef} />
          </div>

          <div className="watch-controls">
            <button
              className={`yt-source-btn ${showFurigana ? 'active' : ''}`}
              onClick={() => setShowFurigana((v) => !v)}
            >
              <span aria-hidden="true">👁</span> Furigana
            </button>
            <button
              className={`yt-source-btn ${showTrans ? 'active' : ''}`}
              onClick={() => setShowTrans((v) => !v)}
            >
              <span aria-hidden="true">🇻🇳</span> Bản dịch
            </button>
            <button
              className="yt-source-btn"
              onClick={() => navigate(`/watch/${id}/fill`)}
            >
              <span aria-hidden="true">✍️</span> Bài điền từ
            </button>
          </div>

          <div className="current-line">
            {active ? (
              <>
                <div className="current-jp">
                  <Furigana tokens={active.tokens} show={showFurigana} />
                </div>
                {showTrans && active.vi && <p className="current-vi">{active.vi}</p>}
              </>
            ) : (
              <p className="lib-note">▶ Bấm play để bắt đầu — phụ đề sẽ chạy theo video.</p>
            )}
          </div>
        </div>

        {/* Cột phải: transcript đồng bộ */}
        <div className="watch-transcript">
          <div className="transcript-head">BẢN CHÉP</div>
          <div className="transcript-list">
            {segments.map((seg, i) => (
              <div
                key={i}
                ref={(el) => (segRefs.current[i] = el)}
                className={`seg-item ${i === activeIndex ? 'seg-active' : ''}`}
                onClick={() => seekTo(seg)}
                role="button"
                tabIndex={0}
                aria-label={`Tua đến dòng ${i + 1}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    seekTo(seg)
                  }
                }}
              >
                <span className="seg-num">#{i + 1}</span>
                <div className="seg-jp">
                  <Furigana tokens={seg.tokens} show={showFurigana} />
                </div>
                {showTrans && seg.vi && <p className="seg-vi">{seg.vi}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
