require('dotenv').config()
const express = require('express')
const cors = require('cors')
const fs = require('fs')
const path = require('path')
const multer = require('multer')
const { YoutubeTranscript } = require('youtube-transcript')
const db = require('./database')
const { generateQuestions } = require('./generateQuestions')
const { generateFillBlanks } = require('./generateFillBlanks')
const { toFurigana } = require('./furigana')
const { translateSegments } = require('./translate')

const QUESTIONS_PATH = path.join(__dirname, 'data', 'questions.json')
const UPLOADS_DIR = path.join(__dirname, 'uploads')

// Thư mục lưu file audio người dùng tải lên
fs.mkdirSync(UPLOADS_DIR, { recursive: true })

const app = express()
const PORT = 3001

app.use(cors({ origin: 'http://localhost:5173' }))
app.use(express.json())
// Phục vụ file audio đã tải lên (dùng cho thẻ <audio> ở frontend)
app.use('/uploads', express.static(UPLOADS_DIR))

// Multer: lưu audio vào ổ đĩa với tên duy nhất, giới hạn 25MB, chỉ nhận audio
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp3'
    cb(null, `audio-${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`)
  },
})
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) cb(null, true)
    else cb(new Error('Chỉ chấp nhận file audio'))
  },
})

function extractVideoId(url) {
  const patterns = [
    /youtube\.com\/watch\?v=([^&\n?#]+)/,
    /youtu\.be\/([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ]
  for (const p of patterns) {
    const m = url.match(p)
    if (m) return m[1]
  }
  return null
}

// Trang gốc: chỉ để xác nhận backend đang chạy (app thật ở frontend cổng 5173)
app.get('/', (_req, res) => {
  res.json({
    ok: true,
    message: 'Backend đang chạy. Mở giao diện tại http://localhost:5173',
  })
})

// GET all practice questions (đọc file mỗi lần để sửa JSON không cần restart)
app.get('/api/questions', (_req, res) => {
  try {
    const questions = JSON.parse(fs.readFileSync(QUESTIONS_PATH, 'utf-8'))
    res.json(questions)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Không đọc được file câu hỏi' })
  }
})

// Parse cột segments (JSON) thành mảng cho frontend
function parseLesson(row) {
  let segments = []
  try {
    if (row.segments) segments = JSON.parse(row.segments)
  } catch {
    segments = []
  }
  return { ...row, segments }
}

// GET all lessons (không kèm segments cho nhẹ)
app.get('/api/lessons', (_req, res) => {
  const lessons = db.all(
    'SELECT id, title, youtube_url, video_id, transcript, created_at FROM lessons ORDER BY created_at DESC'
  )
  res.json(lessons)
})

// GET one lesson (kèm segments đã parse)
app.get('/api/lessons/:id', (req, res) => {
  const lesson = db.get('SELECT * FROM lessons WHERE id = ?', [req.params.id])
  if (!lesson) return res.status(404).json({ error: 'Không tìm thấy bài này' })
  res.json(parseLesson(lesson))
})

// POST sinh (hoặc lấy cache) câu điền-khuyết cho video YouTube
app.post('/api/lessons/:id/fill', async (req, res) => {
  const row = db.get('SELECT * FROM lessons WHERE id = ?', [req.params.id])
  if (!row) return res.status(404).json({ error: 'Không tìm thấy bài này' })

  if (req.query.force !== '1' && row.fill_questions) {
    try {
      const cached = JSON.parse(row.fill_questions)
      if (cached.length) return res.json(cached)
    } catch {
      // cache hỏng -> sinh lại
    }
  }

  try {
    const fill = await generateFillBlanks(row.transcript || '')
    if (fill.length === 0) {
      return res.status(422).json({ error: 'Không tạo được câu điền từ (transcript quá ngắn?).' })
    }
    db.run('UPDATE lessons SET fill_questions = ? WHERE id = ?', [JSON.stringify(fill), row.id])
    return res.json(fill)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message || 'Lỗi khi tạo câu điền từ' })
  }
})

// POST fetch transcript from YouTube and save
app.post('/api/lessons', async (req, res) => {
  const { url, title } = req.body
  if (!url) return res.status(400).json({ error: 'URL là bắt buộc' })

  const videoId = extractVideoId(url)
  if (!videoId) return res.status(400).json({ error: 'Link YouTube không hợp lệ' })

  const exists = db.get('SELECT id FROM lessons WHERE video_id = ?', [videoId])
  if (exists) return res.status(409).json({ error: 'Bài này đã được lưu rồi' })

  try {
    let items = []
    try {
      items = await YoutubeTranscript.fetchTranscript(videoId, { lang: 'ja' })
    } catch {
      items = await YoutubeTranscript.fetchTranscript(videoId)
    }

    if (!items || items.length === 0) {
      return res.status(404).json({
        error: 'Video này không có phụ đề. Hãy chọn video khác có caption tiếng Nhật.',
      })
    }

    // Chuẩn hoá đơn vị thời gian: srv3 trả ms, classic trả giây.
    // Clip học thường < 1 giờ -> nếu offset lớn (> 3600) thì đó là ms, chia 1000.
    const maxOffset = Math.max(...items.map((i) => i.offset || 0))
    const div = maxOffset > 3600 ? 1000 : 1

    // Dựng segment có timestamp, gộp các dòng rỗng
    const rawSegments = items
      .map((i) => ({
        start: (i.offset || 0) / div,
        dur: (i.duration || 0) / div,
        text: (i.text || '').replace(/\s+/g, ' ').trim(),
      }))
      .filter((s) => s.text)

    // Furigana cho từng dòng (kuromoji)
    for (const seg of rawSegments) {
      seg.tokens = await toFurigana(seg.text)
    }

    // Dịch tiếng Việt từng dòng (1 lần gọi Gemini)
    const translations = await translateSegments(rawSegments.map((s) => s.text))
    rawSegments.forEach((seg, i) => {
      seg.vi = translations[i] || ''
    })

    const transcript = rawSegments
      .map((s) => s.text)
      .join(' ')
      .trim()

    const lessonTitle =
      title?.trim() || `Bài nghe ${new Date().toLocaleDateString('vi-VN')}`

    const result = db.run(
      'INSERT INTO lessons (title, youtube_url, video_id, transcript, segments) VALUES (?, ?, ?, ?, ?)',
      [lessonTitle, url, videoId, transcript, JSON.stringify(rawSegments)]
    )

    const lesson = db.get('SELECT * FROM lessons WHERE id = ?', [result.lastInsertRowid])
    return res.status(201).json(parseLesson(lesson))
  } catch (err) {
    console.error(err)
    return res.status(500).json({
      error:
        'Không lấy được phụ đề. Video có thể bị tắt caption hoặc là video riêng tư.',
    })
  }
})

// PATCH update title
app.patch('/api/lessons/:id', (req, res) => {
  const { title } = req.body
  if (!title) return res.status(400).json({ error: 'Cần có title' })
  db.run('UPDATE lessons SET title = ? WHERE id = ?', [title, req.params.id])
  res.json({ ok: true })
})

// DELETE lesson
app.delete('/api/lessons/:id', (req, res) => {
  db.run('DELETE FROM lessons WHERE id = ?', [req.params.id])
  res.json({ ok: true })
})

// ===== Bài nghe từ file audio + câu hỏi do AI sinh =====

function parseAudioLesson(row) {
  return {
    id: row.id,
    title: row.title,
    audio_url: `/uploads/${row.audio_file}`,
    transcript: row.transcript,
    questions: JSON.parse(row.questions),
    created_at: row.created_at,
  }
}

// GET danh sách bài nghe (không kèm câu hỏi để nhẹ)
app.get('/api/audio-lessons', (_req, res) => {
  const rows = db.all(
    'SELECT id, title, audio_file, transcript, created_at FROM audio_lessons ORDER BY created_at DESC'
  )
  res.json(
    rows.map((r) => ({
      id: r.id,
      title: r.title,
      audio_url: `/uploads/${r.audio_file}`,
      transcript: r.transcript,
      created_at: r.created_at,
    }))
  )
})

// GET một bài nghe đầy đủ (kèm câu hỏi)
app.get('/api/audio-lessons/:id', (req, res) => {
  const row = db.get('SELECT * FROM audio_lessons WHERE id = ?', [req.params.id])
  if (!row) return res.status(404).json({ error: 'Không tìm thấy bài nghe này' })
  res.json(parseAudioLesson(row))
})

// POST sinh (hoặc lấy cache) câu điền-khuyết cho bài audio đã upload
app.post('/api/audio-lessons/:id/fill', async (req, res) => {
  const row = db.get('SELECT * FROM audio_lessons WHERE id = ?', [req.params.id])
  if (!row) return res.status(404).json({ error: 'Không tìm thấy bài nghe này' })

  if (req.query.force !== '1' && row.fill_questions) {
    try {
      const cached = JSON.parse(row.fill_questions)
      if (cached.length) return res.json(cached)
    } catch {
      // cache hỏng -> sinh lại
    }
  }

  try {
    const fill = await generateFillBlanks(row.transcript || '')
    if (fill.length === 0) {
      return res.status(422).json({ error: 'Không tạo được câu điền từ (transcript quá ngắn?).' })
    }
    db.run('UPDATE audio_lessons SET fill_questions = ? WHERE id = ?', [JSON.stringify(fill), row.id])
    return res.json(fill)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message || 'Lỗi khi tạo câu điền từ' })
  }
})

// POST tải audio + transcript -> Claude sinh câu hỏi -> lưu
app.post('/api/audio-lessons', upload.single('audio'), async (req, res) => {
  const { transcript, title } = req.body
  const file = req.file

  if (!file) return res.status(400).json({ error: 'Cần tải lên một file audio' })
  if (!transcript || !transcript.trim()) {
    fs.unlink(path.join(UPLOADS_DIR, file.filename), () => {})
    return res.status(400).json({ error: 'Cần nhập transcript (lời thoại) của audio' })
  }

  try {
    const questions = await generateQuestions(transcript.trim())
    if (questions.length === 0) {
      fs.unlink(path.join(UPLOADS_DIR, file.filename), () => {})
      return res.status(422).json({ error: 'Không tạo được câu hỏi từ transcript này. Thử transcript dài/rõ hơn.' })
    }

    const lessonTitle =
      title?.trim() || `Bài nghe ${new Date().toLocaleDateString('vi-VN')}`

    const result = db.run(
      'INSERT INTO audio_lessons (title, audio_file, transcript, questions) VALUES (?, ?, ?, ?)',
      [lessonTitle, file.filename, transcript.trim(), JSON.stringify(questions)]
    )

    const row = db.get('SELECT * FROM audio_lessons WHERE id = ?', [result.lastInsertRowid])
    return res.status(201).json(parseAudioLesson(row))
  } catch (err) {
    console.error(err)
    fs.unlink(path.join(UPLOADS_DIR, file.filename), () => {})
    return res.status(500).json({ error: err.message || 'Lỗi khi tạo câu hỏi' })
  }
})

// DELETE bài nghe (xóa cả file audio)
app.delete('/api/audio-lessons/:id', (req, res) => {
  const row = db.get('SELECT audio_file FROM audio_lessons WHERE id = ?', [req.params.id])
  if (row) {
    fs.unlink(path.join(UPLOADS_DIR, row.audio_file), () => {})
    db.run('DELETE FROM audio_lessons WHERE id = ?', [req.params.id])
  }
  res.json({ ok: true })
})

// Báo lỗi gọn cho multer (vd: file quá lớn / sai định dạng).
// Express nhận diện middleware lỗi qua 4 tham số nên phải giữ đủ.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  res.status(400).json({ error: err.message || 'Lỗi server' })
})

// Init DB then start server
db.init().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Backend chạy tại http://localhost:${PORT}`)
  })
}).catch((err) => {
  console.error('Không thể khởi động DB:', err)
  process.exit(1)
})
