import { useState, useRef } from 'react'
import { recordAnswer } from '../services/progress'

// Chuẩn hoá để chấm: gộp full/half-width (NFKC), bỏ khoảng trắng đầu/cuối, không phân biệt hoa thường
const normalize = (s) => (s || '').normalize('NFKC').trim().toLowerCase()

// Chạy một bộ câu nghe-điền-khuyết.
// props:
//  - questions: [{ id, script, sentence, blank, answer, hint, explanation }]
//  - mode: khoá lưu tiến độ (vd 'fill', 'fill-audio-3')
//  - renderAudio(q): node phát audio cho câu hiện tại
//  - reviewMode: hiện badge ôn tập
export default function FillBlankRunner({ questions, mode, renderAudio, onBack, reviewMode = false }) {
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [showScript, setShowScript] = useState(false)
  const [score, setScore] = useState(0)
  const [finished, setFinished] = useState(false)
  const inputRef = useRef(null)

  const q = questions[index]
  const isCorrect = normalize(input) === normalize(q.answer)

  const handleSubmit = () => {
    if (!input.trim()) return
    setSubmitted(true)
    const correct = normalize(input) === normalize(q.answer)
    if (correct) setScore((s) => s + 1)
    recordAnswer(mode, q.id, correct)
  }

  const handleNext = () => {
    if (index + 1 >= questions.length) {
      setFinished(true)
    } else {
      setIndex((i) => i + 1)
      setInput('')
      setSubmitted(false)
      setShowHint(false)
      setShowScript(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  const handleRestart = () => {
    setIndex(0)
    setInput('')
    setSubmitted(false)
    setShowHint(false)
    setShowScript(false)
    setScore(0)
    setFinished(false)
  }

  if (finished) {
    const pct = Math.round((score / questions.length) * 100)
    return (
      <>
        {onBack && <button className="back-btn" onClick={onBack}>← 戻る</button>}
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
      </>
    )
  }

  const parts = q.sentence.split(q.blank)

  return (
    <>
      <div className="page-top">
        {onBack && <button className="back-btn" onClick={onBack}>← 戻る</button>}
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(index / questions.length) * 100}%` }} />
        </div>
        <span className="progress-label">{index + 1} / {questions.length}</span>
      </div>

      {reviewMode && (
        <div className="review-badge">🔁 復習モード — Ôn lại các câu đã sai</div>
      )}

      <div className="card">
        <p className="card-label">🎧 音声を聞いてください</p>
        {renderAudio(q)}
        <button className="toggle-btn" onClick={() => setShowScript((v) => !v)}>
          {showScript ? '▲ スクリプトを隠す' : '▼ スクリプトを見る'}
        </button>
        {showScript && (
          <div className="script-box">
            <p>{q.script}</p>
          </div>
        )}
      </div>

      <div className="card">
        <p className="card-label">✍️ 空欄を埋めてください</p>
        <p className="fill-sentence">
          {parts[0]}
          <span className={`fill-blank-slot ${submitted ? (isCorrect ? 'slot-correct' : 'slot-wrong') : ''}`}>
            {submitted ? q.answer : '＿＿＿'}
          </span>
          {parts[1]}
        </p>

        {!submitted && (
          <div className="fill-input-row">
            <input
              ref={inputRef}
              className="fill-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              placeholder="答えを入力..."
              autoFocus
            />
            <button className="btn-primary" onClick={handleSubmit}>確認</button>
          </div>
        )}

        {!submitted && q.hint && (
          <button className="toggle-btn hint-btn" onClick={() => setShowHint((v) => !v)}>
            {showHint ? '▲ ヒントを隠す' : '💡 ヒントを見る'}
          </button>
        )}
        {showHint && !submitted && q.hint && <div className="hint-box">{q.hint}</div>}

        {submitted && (
          <div className={`feedback-box ${isCorrect ? 'fb-correct' : 'fb-wrong'}`}>
            <p className="fb-title">
              {isCorrect ? '✓ 正解！' : `✗ 不正解 — 正解：${q.answer}`}
            </p>
            {!isCorrect && input && <p className="fb-your-ans">あなたの答え：{input}</p>}
            {q.explanation && <p className="fb-exp">{q.explanation}</p>}
          </div>
        )}

        {submitted && (
          <button className="btn-primary next-btn" onClick={handleNext}>
            {index + 1 >= questions.length ? '結果を見る →' : '次の問題 →'}
          </button>
        )}
      </div>
    </>
  )
}
