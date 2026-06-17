import { useNavigate } from 'react-router-dom'
import JapanScenery from '../components/JapanScenery'
import { getTodayStats, getTotals, getStreak } from '../services/progress'

const modes = [
  {
    path: '/multiple',
    icon: '🎧',
    title: '聴解クイズ',
    titleVi: 'Nghe + Chọn đáp án',
    desc: 'Nghe hội thoại tiếng Nhật, chọn đáp án đúng — đúng format thi JLPT thật.',
    count: 'Câu hỏi N3',
    color: 'mode-red',
  },
  {
    path: '/fill',
    icon: '✍️',
    title: '穴埋め問題',
    titleVi: 'Nghe + Điền vào chỗ trống',
    desc: 'Nghe đoạn hội thoại rồi điền từ còn thiếu vào chỗ trống.',
    count: 'Câu hỏi N3',
    color: 'mode-blue',
  },
  {
    path: '/shadow',
    icon: '🗣️',
    title: 'シャドーイング',
    titleVi: 'Shadowing',
    desc: 'Nghe từng câu tiếng Nhật và nhắc lại — luyện tai và phát âm cùng lúc.',
    count: 'Hội thoại N3',
    color: 'mode-green',
  },
]

const contentModes = [
  {
    path: '/upload',
    icon: '🎼',
    title: '音声アップロード',
    titleVi: 'Tải audio của bạn',
    desc: 'Upload file nghe + transcript, AI tự tạo câu trắc nghiệm & điền từ.',
    count: 'AI',
  },
  {
    path: '/library',
    icon: '📺',
    title: 'YouTube ライブラリ',
    titleVi: 'Video từ YouTube',
    desc: 'Lưu video có phụ đề: transcript chạy theo + furigana + dịch tiếng Việt.',
    count: 'AI',
  },
]

export default function Home() {
  const navigate = useNavigate()
  const today = getTodayStats()
  const totals = getTotals()
  const streak = getStreak()
  const accuracy = totals.answered ? Math.round((totals.correct / totals.answered) * 100) : 0

  const renderCard = (m) => (
    <button
      key={m.path}
      className={`mode-card ${m.color}`}
      onClick={() => navigate(m.path)}
    >
      <span className="mode-icon" aria-hidden="true">{m.icon}</span>
      <div className="mode-titles">
        <span className="mode-title-jp" lang="ja">{m.title}</span>
        <span className="mode-title-vi">{m.titleVi}</span>
      </div>
      <p className="mode-desc">{m.desc}</p>
      <span className="mode-count">{m.count}</span>
    </button>
  )

  return (
    <div className="home">
      <header className="home-header">
        <div className="home-logo">
          <span className="logo-jp" lang="ja">日本語</span>
          <span className="hanko" lang="ja" aria-hidden="true">聴</span>
        </div>
        <span className="logo-sub" lang="ja">JLPT N3 リスニング</span>
        <p className="home-desc">
          Luyện kỹ năng nghe tiếng Nhật N3 — học bằng đề mẫu hoặc nội dung của bạn
        </p>
      </header>

      {/* Thống kê nhanh */}
      <div className="stat-bar">
        <button className="stat-tile" onClick={() => navigate('/stats')}>
          <span className="stat-num">{today.answered}</span>
          <span className="stat-lbl">今日 · Hôm nay</span>
        </button>
        <button className="stat-tile" onClick={() => navigate('/stats')}>
          <span className="stat-num">{accuracy}<small>%</small></span>
          <span className="stat-lbl">正解率 · Chính xác</span>
        </button>
        <button className="stat-tile" onClick={() => navigate('/stats')}>
          <span className="stat-num">{streak}<small>日</small></span>
          <span className="stat-lbl">連続 · Chuỗi ngày</span>
        </button>
      </div>

      <JapanScenery />

      <section className="home-section">
        <div className="section-head">
          <span className="section-label-jp" lang="ja">練習モード</span>
          <span className="section-label-vi">Chế độ luyện tập</span>
        </div>
        <div className="mode-grid">{modes.map(renderCard)}</div>
      </section>

      <section className="home-section">
        <div className="section-head">
          <span className="section-label-jp" lang="ja">あなたのコンテンツ</span>
          <span className="section-label-vi">Nội dung của bạn · AI tạo câu hỏi</span>
        </div>
        <div className="mode-grid mode-grid-2">
          {contentModes.map((m) => renderCard({ ...m, color: 'mode-gold' }))}
        </div>
      </section>

      <button className="stats-link" onClick={() => navigate('/stats')}>
        <span>📊 学習記録 — Thống kê & ôn lại câu sai</span>
        {today.answered > 0 && (
          <span className="home-today-badge">
            Hôm nay {today.answered} câu ・ đúng {Math.round((today.correct / today.answered) * 100)}%
          </span>
        )}
      </button>

      <footer className="home-footer">
        <span>⛩️ N3レベル ・ AI 搭載 ・ 随時更新</span>
      </footer>
    </div>
  )
}
