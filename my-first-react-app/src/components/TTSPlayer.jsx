import { useState, useEffect, useCallback, useRef } from 'react'

export default function TTSPlayer({ text, compact = false }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1.0)
  const keepAliveRef = useRef(null)

  const stopAll = useCallback(() => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
    if (keepAliveRef.current) clearInterval(keepAliveRef.current)
  }, [])

  // Dọn dẹp khi unmount — đổi câu hỏi sẽ remount nhờ prop key từ parent
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel()
      if (keepAliveRef.current) clearInterval(keepAliveRef.current)
    }
  }, [])

  const play = useCallback(
    (overrideSpeed) => {
      if (window.speechSynthesis.speaking) {
        stopAll()
        return
      }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'ja-JP'
      utterance.rate = overrideSpeed ?? speed

      const voices = window.speechSynthesis.getVoices()
      const jpVoice =
        voices.find((v) => v.lang === 'ja-JP') ||
        voices.find((v) => v.lang.startsWith('ja'))
      if (jpVoice) utterance.voice = jpVoice

      utterance.onend = () => {
        setIsPlaying(false)
        if (keepAliveRef.current) clearInterval(keepAliveRef.current)
      }
      utterance.onerror = () => {
        setIsPlaying(false)
        if (keepAliveRef.current) clearInterval(keepAliveRef.current)
      }

      window.speechSynthesis.speak(utterance)
      setIsPlaying(true)

      // Chrome bug: TTS stops after ~15s — keep alive by pause/resume
      keepAliveRef.current = setInterval(() => {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          window.speechSynthesis.pause()
          window.speechSynthesis.resume()
        }
      }, 10000)
    },
    [text, speed, stopAll]
  )

  const handleSpeed = (s) => {
    setSpeed(s)
    if (isPlaying) {
      stopAll()
    }
  }

  const speeds = [0.75, 1.0, 1.25, 1.5]

  return (
    <div className={`tts-player ${compact ? 'tts-compact' : ''}`}>
      <button
        className={`tts-play-btn ${isPlaying ? 'is-playing' : ''}`}
        onClick={() => play()}
        aria-label={isPlaying ? 'Dừng phát âm thanh' : 'Phát âm thanh tiếng Nhật'}
        aria-pressed={isPlaying}
      >
        {isPlaying ? (
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
        <span lang="ja">{isPlaying ? '停止' : '再生'}</span>
      </button>

      <div className="tts-speeds" role="group" aria-label="Tốc độ phát">
        {speeds.map((s) => (
          <button
            key={s}
            className={`tts-speed-btn ${speed === s ? 'active' : ''}`}
            onClick={() => handleSpeed(s)}
            aria-label={`Tốc độ ${s} lần`}
            aria-pressed={speed === s}
          >
            {s}×
          </button>
        ))}
      </div>
    </div>
  )
}
