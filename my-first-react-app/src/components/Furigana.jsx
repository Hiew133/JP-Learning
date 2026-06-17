// Hiển thị câu tiếng Nhật với furigana (ruby) trên các từ có kanji.
// tokens: [{ s: bề mặt, r: furigana hiragana (rỗng nếu không cần) }]
export default function Furigana({ tokens, show = true }) {
  if (!tokens || tokens.length === 0) return null
  return (
    <>
      {tokens.map((t, i) =>
        show && t.r ? (
          <ruby key={i}>
            {t.s}
            <rt>{t.r}</rt>
          </ruby>
        ) : (
          <span key={i}>{t.s}</span>
        )
      )}
    </>
  )
}
