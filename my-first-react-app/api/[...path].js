// Điểm vào serverless cho Vercel: bọc nguyên app Express trong backend/.
//
// File này là ESM (package.json gốc đặt "type": "module") còn backend là
// CommonJS, nên phải nạp qua createRequire chứ không import thẳng được.
//
// Vercel chạy code trên filesystem CHỈ ĐỌC, trừ /tmp. Backend vốn ghi hai chỗ
// xuống đĩa (file SQLite và thư mục audio người dùng tải lên), nên phải trỏ cả
// hai sang /tmp TRƯỚC khi nạp server.js — hai đường dẫn đó được chốt ngay lúc
// module nạp. Vì vậy phải dùng require() động, không dùng import tĩnh (import
// bị hoist lên trước mọi câu lệnh, env sẽ set muộn).
//
// Hệ quả cần biết: /tmp sống theo vòng đời một instance hàm. Bài học người dùng
// tự thêm (YouTube, audio upload) sẽ mất khi instance bị thu hồi. Bộ đề mẫu
// KHÔNG bị ảnh hưởng vì đọc từ backend/data/questions.json nằm trong repo.
// Muốn dữ liệu bền thì phải thay sql.js bằng một DB có host riêng.
import { createRequire } from 'node:module'

process.env.DB_PATH ||= '/tmp/data.db'
process.env.UPLOADS_DIR ||= '/tmp/uploads'
// Frontend và API cùng domain nên CORS không còn là ranh giới bảo vệ gì.
process.env.CLIENT_ORIGIN ||= '*'

const require = createRequire(import.meta.url)

export default require('../backend/server.js')
