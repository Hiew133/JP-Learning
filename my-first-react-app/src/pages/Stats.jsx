import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getTodayStats, getTotals, getWrongIds, clearProgress } from '../services/progress'

const pct = (correct, answered) =>
  answered === 0 ? 0 : Math.round((correct / answered) * 100)

export default function Stats({ onBack }) {
  const navigate = useNavigate()
  // Chỉ dùng để render lại sau khi xóa dữ liệu
  const [, setVersion] = useState(0)

  const today = getTodayStats()
  const totals = getTotals()
  const reviewModes = [
    { label: '🎧 聴解クイズ', path: '/multiple?review=1', wrong: getWrongIds('multiple').length },
    { label: '✍️ 穴埋め問題', path: '/fill?review=1', wrong: getWrongIds('fill').length },
  ]

  const handleClear = () => {
    if (!confirm('Xóa toàn bộ dữ liệu học tập? Hành động này không thể hoàn tác.')) return
    clearProgress()
    setVersion((v) => v + 1)
  }

  return (
    <div className="page">
      <div className="page-top">
        <button className="back-btn" onClick={onBack}>← 戻る</button>
        <span className="lib-page-title">📊 学習記録</span>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <p className="card-label">📅 Hôm nay</p>
          <p className="stat-big">{today.answered}<span className="stat-unit"> câu</span></p>
          <p className="stat-sub">
            Đúng {today.correct} câu ({pct(today.correct, today.answered)}%)
          </p>
        </div>

        <div className="card stat-card">
          <p className="card-label">📈 Tổng cộng</p>
          <p className="stat-big">{totals.answered}<span className="stat-unit"> câu</span></p>
          <p className="stat-sub">
            Chính xác {pct(totals.correct, totals.answered)}% ・ {totals.studyDays} ngày học
          </p>
        </div>
      </div>

      <div className="card">
        <p className="card-label">🔁 Ôn lại câu sai</p>
        {reviewModes.map((m) => (
          <div key={m.path} className="review-row">
            <span className="review-label">{m.label}</span>
            <span className="review-count">
              {m.wrong > 0 ? `${m.wrong} câu sai` : 'Không có câu sai 🎉'}
            </span>
            <button
              className="btn-primary btn-sm"
              onClick={() => navigate(m.path)}
              disabled={m.wrong === 0}
              style={{ opacity: m.wrong === 0 ? 0.4 : 1 }}
            >
              Ôn ngay
            </button>
          </div>
        ))}
        <p className="lib-note">
          ※ Câu được tính là "sai" khi lần trả lời gần nhất của bạn bị sai.
        </p>
      </div>

      {totals.answered > 0 && (
        <button className="btn-delete clear-progress-btn" onClick={handleClear}>
          🗑 Xóa toàn bộ dữ liệu học tập
        </button>
      )}
    </div>
  )
}
