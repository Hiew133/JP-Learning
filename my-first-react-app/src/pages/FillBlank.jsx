import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import TTSPlayer from '../components/TTSPlayer'
import PageState from '../components/PageState'
import FillBlankRunner from '../components/FillBlankRunner'
import useQuestions from '../hooks/useQuestions'
import { getWrongIds } from '../services/progress'

export default function FillBlank({ onBack }) {
  const { questions: all, loading, error, retry } = useQuestions('fillBlank')
  const [searchParams] = useSearchParams()
  const reviewMode = searchParams.get('review') === '1'
  const [wrongIds] = useState(() => (reviewMode ? getWrongIds('fill') : []))

  const questions = useMemo(() => {
    if (!all) return null
    return reviewMode ? all.filter((q) => wrongIds.includes(q.id)) : all
  }, [all, reviewMode, wrongIds])

  if (loading || error) {
    return <PageState onBack={onBack} error={error} onRetry={retry} />
  }

  if (questions.length === 0) {
    return (
      <div className="page">
        <button className="back-btn" onClick={onBack}>← 戻る</button>
        <div className="card state-card">
          <p className="lib-empty">
            {reviewMode ? '🎉 Không có câu sai nào để ôn lại!' : 'まだ問題がありません。'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <FillBlankRunner
        questions={questions}
        mode="fill"
        onBack={onBack}
        reviewMode={reviewMode}
        renderAudio={(q) => <TTSPlayer key={q.id} text={q.script} />}
      />
    </div>
  )
}
