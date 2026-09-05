<h1 align="center">日本語 — Luyện nghe JLPT N3</h1>

<p align="center">
  Biến <b>bất kỳ đoạn audio hay video YouTube tiếng Nhật nào</b><br/>
  thành một bài luyện nghe JLPT hoàn chỉnh — bằng AI.
</p>

<p align="center">
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" />
  <img alt="Express" src="https://img.shields.io/badge/Express-000000?logo=express&logoColor=white" />
  <img alt="SQLite" src="https://img.shields.io/badge/sql.js-SQLite%20WASM-003B57?logo=sqlite&logoColor=white" />
  <img alt="Gemini" src="https://img.shields.io/badge/Gemini-2.5%20Flash-4285F4?logo=googlegemini&logoColor=white" />
</p>

---

## Vấn đề

Đề luyện nghe N3 thì hữu hạn, làm hết là hết. Trong khi đó nội dung tiếng Nhật
ngoài kia thì vô tận — chỉ có điều nó không đi kèm câu hỏi, không có furigana,
không có bản dịch, và không chấm điểm cho bạn.

## Cách app này giải quyết

Dán link YouTube có phụ đề tiếng Nhật, hoặc tải lên file audio kèm transcript.
Backend sẽ:

1. Lấy phụ đề (`youtube-transcript`) và chuẩn hoá mốc thời gian.
2. Tách hình vị bằng **kuromoji**, gắn **furigana** — chỉ cho token có kanji, và
   chỉ khi cách đọc khác mặt chữ, để không chú thích thừa lên từ thuần kana.
3. Dịch toàn bộ sang tiếng Việt trong **một** lời gọi Gemini.
4. Sinh **câu hỏi trắc nghiệm nghe hiểu** và **câu điền từ** đúng format JLPT.

Kết quả: một bài học có transcript chạy đồng bộ theo video, furigana, bản dịch,
và bộ câu hỏi có chấm điểm — từ nội dung mà chính bạn quan tâm.

## Các chế độ luyện

| | |
|---|---|
| **聴解クイズ** | Nghe hội thoại (TTS) rồi chọn đáp án, đúng format thi JLPT |
| **穴埋め問題** | Nghe rồi điền từ còn thiếu vào chỗ trống |
| **シャドーイング** | Nghe từng câu, nhắc lại, có ghi âm để tự so sánh |
| **音声アップロード** | Tải audio + transcript, AI sinh đề cho bạn |
| **YouTube ライブラリ** | Lưu video, transcript chạy theo video kèm furigana + bản dịch |
| **学習記録** | Số câu, độ chính xác, chuỗi ngày học, và ôn lại câu sai |

Giao diện song ngữ có chủ đích: **tiếng Nhật cho nội dung học** (tiêu đề chế độ,
nhãn mục), **tiếng Việt cho hướng dẫn và giải thích**.

## Thiết kế

Bản sắc thị giác là **thủ công Kyoto**: giấy washi, đỏ chu (朱色), matcha, chàm,
vàng kim, chữ minh triều, dấu hanko, sóng seigaiha. Ba từ khoá: *chăm chỉ, tĩnh,
Nhật rõ rệt*.

Cố tình **không** làm: mascot hoạt hình, UI bong bóng, confetti, dashboard SaaS
kem-nhạt, gamification ồn ào. Streak và độ chính xác là động lực trầm, không phải
cơ chế gây áp lực. Mục tiêu accessibility: **WCAG 2.1 AA** — audio là cốt lõi
nên không bao giờ chỉ có audio; luôn kèm transcript, furigana và giải thích tiếng Việt.

Chi tiết định hướng sản phẩm: [`PRODUCT.md`](my-first-react-app/PRODUCT.md).

## Kiến trúc

| Phần | Công nghệ |
|------|-----------|
| Frontend | React 19 + Vite + React Router |
| Backend | Express, sql.js (SQLite chạy trên WASM, serialize ra file mỗi lần ghi), Multer |
| AI | Google Gemini `gemini-2.5-flash` với `responseSchema` bắt buộc JSON có cấu trúc, kèm bước validate sau khi parse |
| Furigana | kuromoji (phân tích hình vị tiếng Nhật) |
| Phụ đề | youtube-transcript |
| Tiến độ | `localStorage` — không gửi lên server |

Đề mẫu có sẵn chạy được **không cần** API key; chỉ các tính năng AI mới cần.

## Chạy thử

Cần hai tiến trình — backend (cổng 3001) và frontend (cổng 5173):

```bash
cd my-first-react-app/backend && npm install && cp .env.example .env && npm run dev
```

```bash
cd my-first-react-app && npm install && npm run dev
```

Điền `GEMINI_API_KEY` vào `backend/.env` (lấy miễn phí tại
[aistudio.google.com/apikey](https://aistudio.google.com/apikey)), rồi mở
http://localhost:5173.

Hướng dẫn đầy đủ: [`my-first-react-app/README.md`](my-first-react-app/README.md).
