const kuromoji = require('kuromoji')
const path = require('path')

let tokenizerPromise = null

// Thư mục từ điển của kuromoji. Không hardcode `backend/node_modules` nữa: khi
// deploy serverless, dependency được cài ở gốc project chứ không nằm cạnh file
// này, nên đường dẫn cứng sẽ không tồn tại. require.resolve tìm đúng chỗ gói
// thực sự nằm, dù là node_modules nào.
const DICT_PATH = path.join(
  path.dirname(require.resolve('kuromoji/package.json')),
  'dict',
)

// Khởi tạo tokenizer kuromoji 1 lần (nạp từ điển ~ vài giây lần đầu)
function getTokenizer() {
  if (!tokenizerPromise) {
    tokenizerPromise = new Promise((resolve, reject) => {
      kuromoji
        .builder({ dicPath: DICT_PATH })
        .build((err, tokenizer) => (err ? reject(err) : resolve(tokenizer)))
    })
  }
  return tokenizerPromise
}

// Katakana -> Hiragana (đọc furigana hiển thị dạng hiragana)
function kataToHira(s) {
  return s.replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60))
}

// Có chứa kanji không (cần furigana)
function hasKanji(s) {
  return /[㐀-鿿々]/.test(s)
}

// Tách 1 câu thành các token { s: bề mặt, r: furigana hiragana (rỗng nếu không cần) }
async function toFurigana(text) {
  const tokenizer = await getTokenizer()
  const tokens = tokenizer.tokenize(text)
  return tokens.map((t) => {
    const s = t.surface_form
    let r = ''
    if (hasKanji(s) && t.reading && t.reading !== '*') {
      const hira = kataToHira(t.reading)
      // Chỉ gắn furigana nếu khác bề mặt (tránh ghi đè lên từ thuần kana)
      if (hira !== s) r = hira
    }
    return { s, r }
  })
}

module.exports = { toFurigana }
