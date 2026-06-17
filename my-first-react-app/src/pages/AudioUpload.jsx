import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getAudioLessons,
  createAudioLesson,
  deleteAudioLesson,
} from '../services/api'

export default function AudioUpload({ onBack }) {
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [lessons, setLessons] = useState([])
  const [fetching, setFetching] = useState(true)

  const [audioFile, setAudioFile] = useState(null)
  const [transcript, setTranscript] = useState('')
  const [title, setTitle] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getAudioLessons()
      .then(setLessons)
      .catch(() => setError('Không kết nối được backend. Hãy chạy server trước.'))
      .finally(() => setFetching(false))
  }, [])

  const handleSubmit = async () => {
    if (!audioFile || !transcript.trim() || loading) return
    setLoading(true)
    setError('')
    try {
      const lesson = await createAudioLesson({
        audioFile,
        transcript: transcript.trim(),
        title: title.trim(),
      })
      // Tạo xong -> vào luyện ngay
      navigate(`/upload/${lesson.id}`)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Xóa bài nghe này?')) return
    try {
      await deleteAudioLesson(id)
      setLessons((prev) => prev.filter((l) => l.id !== id))
    } catch {
      setError('Xóa thất bại')
    }
  }

  const formatDate = (dt) =>
    new Date(dt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div className="page">
      <div className="page-top">
        <button className="back-btn" onClick={onBack}>← 戻る</button>
        <span className="lib-page-title">🎼 音声アップロード</span>
      </div>

      {/* Form tải lên */}
      <div className="card">
        <p className="card-label">🎧 Tải file audio của bạn</p>

        <input
          ref={fileRef}
          className="fill-input upload-file-input"
          type="file"
          accept="audio/*"
          onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
        />
        {audioFile && <p className="lib-note">📎 {audioFile.name}</p>}

        <p className="card-label" style={{ marginTop: 16 }}>
          📝 Transcript (lời thoại tiếng Nhật)
        </p>
        <textarea
          className="fill-input upload-transcript"
          rows={6}
          placeholder={'Dán lời thoại của đoạn audio vào đây...\n田中：山田さん、週末は何か予定がありますか。\n山田：友達と映画を見に行く予定です。'}
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
        />

        <input
          className="fill-input"
          type="text"
          placeholder="タイトル（省略可）"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        {error && <p className="lib-error">⚠️ {error}</p>}

        <button
          className="btn-primary"
          onClick={handleSubmit}
          disabled={loading || !audioFile || !transcript.trim()}
          style={{ opacity: loading || !audioFile || !transcript.trim() ? 0.5 : 1 }}
        >
          {loading ? (
            <span className="loading-row" style={{ gap: 8 }}>
              <span className="spinner" /> AI đang tạo câu hỏi...
            </span>
          ) : (
            '✨ Tạo câu hỏi từ audio'
          )}
        </button>

        <p className="lib-note">
          ※ AI sẽ đọc transcript và tự tạo câu hỏi trắc nghiệm nghe hiểu (JLPT N3). File audio ≤ 25MB.
        </p>
      </div>

      {/* Danh sách bài đã lưu */}
      <div className="card">
        <p className="card-label">保存済みの音声 ({lessons.length})</p>

        {fetching && <p className="lib-loading">読み込み中...</p>}

        {!fetching && lessons.length === 0 && (
          <p className="lib-empty">まだありません。上に音声をアップロードしてください。</p>
        )}

        <div className="lesson-list">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="lesson-item">
              <div className="lesson-info">
                <p className="lesson-title">{lesson.title}</p>
                <div className="lesson-meta">
                  <span className="lesson-date">{formatDate(lesson.created_at)}</span>
                </div>
                {lesson.transcript && (
                  <p className="lesson-preview">{lesson.transcript.slice(0, 80)}…</p>
                )}
              </div>

              <div className="lesson-actions">
                <button
                  className="btn-primary btn-sm"
                  onClick={() => navigate(`/upload/${lesson.id}`)}
                >
                  🎧 練習
                </button>
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => navigate(`/upload/${lesson.id}/fill`)}
                >
                  ✍️ 穴埋め
                </button>
                <button
                  className="btn-delete btn-sm"
                  onClick={() => handleDelete(lesson.id)}
                >
                  削除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
