import { useState, useRef, useEffect } from 'react'

// Ghi âm giọng của người học bằng MediaRecorder để so sánh với audio gốc.
// Parent nên truyền prop key={id của đoạn script} để đổi bài là xóa bản ghi cũ.
export default function Recorder() {
  const [recording, setRecording] = useState(false)
  const [audioUrl, setAudioUrl] = useState(null)
  const [error, setError] = useState('')
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const urlRef = useRef(null)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      const rec = recorderRef.current
      if (rec && rec.state !== 'inactive') rec.stop()
      if (urlRef.current) URL.revokeObjectURL(urlRef.current)
    }
  }, [])

  const stopRecorder = () => {
    const rec = recorderRef.current
    if (rec && rec.state !== 'inactive') rec.stop()
  }

  const start = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const rec = new MediaRecorder(stream)
      chunksRef.current = []

      rec.ondataavailable = (e) => chunksRef.current.push(e.data)
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        if (!mountedRef.current) return
        const blob = new Blob(chunksRef.current, { type: rec.mimeType })
        if (urlRef.current) URL.revokeObjectURL(urlRef.current)
        urlRef.current = URL.createObjectURL(blob)
        setAudioUrl(urlRef.current)
        setRecording(false)
      }

      recorderRef.current = rec
      rec.start()
      setRecording(true)
    } catch {
      setError('Không truy cập được micro. Hãy cho phép quyền micro trong trình duyệt.')
    }
  }

  return (
    <div className="recorder">
      <div className="recorder-row">
        <button
          className={`rec-btn ${recording ? 'is-recording' : ''}`}
          onClick={recording ? stopRecorder : start}
        >
          {recording ? '⏹ 録音を停止' : audioUrl ? '🎤 もう一度録音' : '🎤 録音する'}
        </button>
        {recording && <span className="rec-indicator">● 録音中...</span>}
      </div>

      {error && <p className="lib-error">{error}</p>}

      {audioUrl && !recording && (
        <div className="rec-playback">
          <p className="lib-note">あなたの声 — nghe lại và so sánh với audio gốc:</p>
          <audio controls src={audioUrl} className="rec-audio" />
        </div>
      )}
    </div>
  )
}
