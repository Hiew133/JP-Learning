import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Home from './pages/Home'
import MultipleChoice from './pages/MultipleChoice'
import FillBlank from './pages/FillBlank'
import Shadowing from './pages/Shadowing'
import Library from './pages/Library'
import Stats from './pages/Stats'
import AudioUpload from './pages/AudioUpload'
import AudioQuiz from './pages/AudioQuiz'
import WatchLesson from './pages/WatchLesson'
import ContentFillQuiz from './pages/ContentFillQuiz'

export default function App() {
  const navigate = useNavigate()

  // Dừng TTS đang đọc dở trước khi rời trang
  const backTo = (path) => () => {
    window.speechSynthesis.cancel()
    navigate(path)
  }

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/multiple" element={<MultipleChoice onBack={backTo('/')} />} />
        <Route path="/fill" element={<FillBlank onBack={backTo('/')} />} />
        <Route path="/shadow" element={<Shadowing onBack={backTo('/')} />} />
        <Route path="/shadow/:lessonId" element={<Shadowing onBack={backTo('/library')} />} />
        <Route path="/library" element={<Library onBack={backTo('/')} />} />
        <Route path="/watch/:id" element={<WatchLesson onBack={backTo('/library')} />} />
        <Route path="/upload" element={<AudioUpload onBack={backTo('/')} />} />
        <Route path="/upload/:id" element={<AudioQuiz onBack={backTo('/upload')} />} />
        <Route path="/upload/:id/fill" element={<ContentFillQuiz source="audio" onBack={backTo('/upload')} />} />
        <Route path="/watch/:id/fill" element={<ContentFillQuiz source="lesson" onBack={backTo('/library')} />} />
        <Route path="/stats" element={<Stats onBack={backTo('/')} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}
