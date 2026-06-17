const initSqlJs = require('sql.js')
const fs = require('fs')
const path = require('path')

const DB_PATH = path.join(__dirname, 'data.db')
let db = null

async function init() {
  const SQL = await initSqlJs()

  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH)
    db = new SQL.Database(buf)
  } else {
    db = new SQL.Database()
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS lessons (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL,
      youtube_url TEXT,
      video_id    TEXT,
      transcript  TEXT,
      segments    TEXT,
      fill_questions TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // Migration: thêm cột cho DB cũ (bỏ qua nếu đã có)
  for (const col of ['segments TEXT', 'fill_questions TEXT']) {
    try {
      db.run(`ALTER TABLE lessons ADD COLUMN ${col}`)
    } catch {
      // cột đã tồn tại
    }
  }

  // Bài nghe từ file audio người dùng tải lên + câu hỏi do AI sinh (lưu dạng JSON)
  db.run(`
    CREATE TABLE IF NOT EXISTS audio_lessons (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL,
      audio_file  TEXT    NOT NULL,
      transcript  TEXT    NOT NULL,
      questions   TEXT    NOT NULL,
      fill_questions TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  try {
    db.run('ALTER TABLE audio_lessons ADD COLUMN fill_questions TEXT')
  } catch {
    // cột đã tồn tại
  }
  persist()
  return db
}

function persist() {
  if (!db) return
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()))
}

function all(sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) rows.push(stmt.getAsObject())
  stmt.free()
  return rows
}

function run(sql, params = []) {
  db.run(sql, params)
  // Phải đọc last_insert_rowid() TRƯỚC khi persist() — db.export() reset nó về 0
  const lastId = db.exec('SELECT last_insert_rowid()')[0]?.values[0][0]
  persist()
  return { lastInsertRowid: lastId }
}

function get(sql, params = []) {
  return all(sql, params)[0] ?? null
}

module.exports = { init, all, run, get }
