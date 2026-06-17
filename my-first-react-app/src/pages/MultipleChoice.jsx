import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import TTSPlayer from '../components/TTSPlayer'
import PageState from '../components/PageState'
import useQuestions from '../hooks/useQuestions'
import { recordAnswer, getWrongIds } from '../services/progress'

export default function MultipleChoice({ onBack }) {
  const { questions: all, loading, error, retry } = useQuestions('multipleChoice')
  const [searchParams] = useSearchParams()
  const reviewMode = searchParams.get('review') === '1'
  // Chụp danh sách câu sai một lần lúc vào trang, để trả lời đúng không làm câu biến mất giữa chừng
  const [wrongIds] = useState(() => (reviewMode ? getWrongIds('multiple') : []))

  const questions = useMemo(() => {
    if (!all) return null
    return reviewMode ? all.filter((q) => wrongIds.includes(q.id)) : all
  }, [all, reviewMode, wrongIds])

  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [showScript, setShowScript] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)

  if (loading || error) {
    return <PageState onBack={onBack} error={error} onRetry={retry} />
  }

  if (questions.length === 0) {
    return (
      <div className="page">
        <button className="back-btn" onClick={onBack} aria-label="Quay lại"><span aria-hidden="true">←</span> <span lang="ja">戻る</span></button>
        <div className="card state-card">
          <p className="lib-empty">
            {reviewMode ? '🎉 Không có câu sai nào để ôn lại!' : 'まだ問題がありません。'}
          </p>
        </div>
      </div>
    )
  }

  const q = questions[index]
  const answered = selected !== null
  const isCorrect = selected === q.answer

  const handleSelect = (i) => {
    if (answered) return
    setSelected(i)
    const correct = i === q.answer
    if (correct) setScore((s) => s + 1)
    recordAnswer('multiple', q.id, correct)
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
        <button className="back-btn" onClick={onBack} aria-label="Quay lại"><span aria-hidden="true">←</span> <span lang="ja">戻る</span></button>
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
        <button className="back-btn" onClick={onBack} aria-label="Quay lại"><span aria-hidden="true">←</span> <span lang="ja">戻る</span></button>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((index) / questions.length) * 100}%` }}
          />
        </div>
        <span className="progress-label">{index + 1} / {questions.length}</span>
      </div>

      {reviewMode && (
        <div className="review-badge">🔁 復習モード — Ôn lại các câu đã sai</div>
      )}

      <div className="card">
        <p className="card-label"><span aria-hidden="true">🎧 </span><span lang="ja">音声を聞いてください</span></p>
        <TTSPlayer key={q.id} text={q.script} />

        <button
          className="toggle-btn"
          onClick={() => setShowScript((v) => !v)}
          aria-expanded={showScript}
          lang="ja"
        >
          {showScript ? '▲ スクリプトを隠す' : '▼ スクリプトを見る'}
        </button>

        {showScript && (
          <div className="script-box" lang="ja">
            {q.script.split('\n').map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <p className="question-text" lang="ja">{q.question}</p>

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
                aria-label={`Đáp án ${['A', 'B', 'C', 'D'][i]}`}
              >
                <span className="option-letter" aria-hidden="true">
                  {['A', 'B', 'C', 'D'][i]}
                </span>
                <span lang="ja">{opt}</span>
              </button>
            )
          })}
        </div>

        {answered && (
          <div className={`feedback-box ${isCorrect ? 'fb-correct' : 'fb-wrong'}`} role="status" aria-live="polite">
            <p className="fb-title" lang="ja">{isCorrect ? '✓ 正解！' : '✗ 不正解'}</p>
            <p className="fb-exp" lang="ja">{q.explanation}</p>
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
