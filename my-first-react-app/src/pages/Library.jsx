import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getLessons, addLesson, deleteLesson, updateLessonTitle } from '../services/api'

export default function Library({ onBack }) {
  const navigate = useNavigate()
  const [lessons, setLessons] = useState([])
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editId, setEditId] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    getLessons()
      .then(setLessons)
      .catch(() => setError('Không kết nối được backend. Hãy chạy server trước.'))
      .finally(() => setFetching(false))
  }, [])

  const handleAdd = async () => {
    if (!url.trim()) return
    setLoading(true)
    setError('')
    try {
      const lesson = await addLesson(url.trim(), title.trim())
      setLessons((prev) => [lesson, ...prev])
      setUrl('')
      setTitle('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Xóa bài này?')) return
    try {
      await deleteLesson(id)
      setLessons((prev) => prev.filter((l) => l.id !== id))
    } catch {
      setError('Xóa thất bại')
    }
  }

  const handleEditSave = async (id) => {
    if (!editTitle.trim()) return
    try {
      await updateLessonTitle(id, editTitle.trim())
      setLessons((prev) =>
        prev.map((l) => (l.id === id ? { ...l, title: editTitle.trim() } : l))
      )
      setEditId(null)
    } catch {
      setError('Cập nhật thất bại')
    }
  }

  const formatDate = (dt) =>
    new Date(dt).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

  return (
    <div className="page">
      <div className="page-top">
        <button className="back-btn" onClick={onBack}>← 戻る</button>
        <span className="lib-page-title">📚 ライブラリ</span>
      </div>

      {/* Add new lesson */}
      <div className="card">
        <p className="card-label">🔗 YouTube リンクを追加</p>

        <input
          className="fill-input"
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <input
          className="fill-input"
          type="text"
          placeholder="タイトル（省略可）"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />

        {error && <p className="lib-error">{error}</p>}

        <button
          className="btn-primary"
          onClick={handleAdd}
          disabled={loading || !url.trim()}
          style={{ opacity: loading || !url.trim() ? 0.5 : 1 }}
        >
          {loading ? '⏳ 字幕を取得中...' : '＋ 追加'}
        </button>

        <p className="lib-note">
          ※ 字幕（日本語キャプション）が有効な動画のみ対応しています
        </p>
      </div>

      {/* Lesson list */}
      <div className="card">
        <p className="card-label">保存済みの動画 ({lessons.length})</p>

        {fetching && <p className="lib-loading">読み込み中...</p>}

        {!fetching && lessons.length === 0 && (
          <p className="lib-empty">まだ動画がありません。上にリンクを追加してください。</p>
        )}

        <div className="lesson-list">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="lesson-item">
              <div className="lesson-info">
                {editId === lesson.id ? (
                  <div className="edit-title-row">
                    <input
                      className="fill-input edit-input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleEditSave(lesson.id)
                        if (e.key === 'Escape') setEditId(null)
                      }}
                      autoFocus
                    />
                    <button className="btn-primary btn-sm" onClick={() => handleEditSave(lesson.id)}>保存</button>
                    <button className="btn-secondary btn-sm" onClick={() => setEditId(null)}>✕</button>
                  </div>
                ) : (
                  <p className="lesson-title">{lesson.title}</p>
                )}
                <div className="lesson-meta">
                  <span className="lesson-date">{formatDate(lesson.created_at)}</span>
                  {lesson.youtube_url && (
                    <a
                      className="lesson-yt-link"
                      href={lesson.youtube_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      ▶ YouTube
                    </a>
                  )}
                </div>
                {lesson.transcript && (
                  <p className="lesson-preview">
                    {lesson.transcript.slice(0, 80)}…
                  </p>
                )}
              </div>

              <div className="lesson-actions">
                <button
                  className="btn-primary btn-sm"
                  onClick={() => navigate(`/watch/${lesson.id}`)}
                >
                  練習する
                </button>
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => { setEditId(lesson.id); setEditTitle(lesson.title) }}
                >
                  編集
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
