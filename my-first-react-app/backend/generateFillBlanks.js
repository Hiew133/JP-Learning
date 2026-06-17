const { GoogleGenAI, Type } = require('@google/genai')

const BLANK = '＿＿＿'

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          script: {
            type: Type.STRING,
            description: 'Câu đầy đủ (đúng như trong transcript) mà người học sẽ nghe',
          },
          answer: {
            type: Type.STRING,
            description: 'Từ cần điền — PHẢI là một đoạn con xuất hiện y nguyên trong script',
          },
          hint: { type: Type.STRING, description: 'Gợi ý ngắn (cách đọc hoặc nghĩa)' },
          explanation: {
            type: Type.STRING,
            description: 'Giải thích ngắn bằng tiếng Nhật',
          },
        },
        required: ['script', 'answer', 'hint', 'explanation'],
        propertyOrdering: ['script', 'answer', 'hint', 'explanation'],
      },
    },
  },
  required: ['questions'],
}

const SYSTEM_PROMPT = `Bạn là giáo viên ra đề nghe hiểu tiếng Nhật JLPT N3, dạng "nghe và điền vào chỗ trống".
Dựa trên transcript một đoạn audio tiếng Nhật, tạo các câu điền-khuyết:
- Mỗi câu chọn MỘT từ khóa có nghĩa để khoét: danh từ, động từ, số, tên riêng, từ vựng quan trọng — KHÔNG chọn trợ từ (は・が・を・に・で...).
- "script" là câu đầy đủ lấy ĐÚNG NGUYÊN VĂN từ transcript (có chứa từ cần điền).
- "answer" là từ cần điền, PHẢI xuất hiện y nguyên bên trong "script".
- "hint": gợi ý ngắn (cách đọc hiragana hoặc nghĩa), không lộ thẳng đáp án.
- "explanation": giải thích ngắn bằng tiếng Nhật.
- Số câu: 3-6 tùy độ dài transcript. Chỉ dùng nội dung có trong transcript.`

// Sinh câu điền-khuyết từ transcript.
// Trả về [{ script, sentence, blank, answer, hint, explanation }]
async function generateFillBlanks(transcript) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error(
      'Chưa cấu hình GEMINI_API_KEY. Tạo file backend/.env từ .env.example và điền key.'
    )
  }

  const ai = new GoogleGenAI({ apiKey })

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Transcript đoạn audio tiếng Nhật. Hãy tạo câu nghe-điền-khuyết:\n\n${transcript}`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      responseSchema: SCHEMA,
    },
  })

  const text = response.text
  if (!text) throw new Error('Gemini không trả về nội dung hợp lệ')

  let parsed
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error('Không phân tích được câu hỏi do Gemini trả về')
  }

  const raw = parsed.questions || []

  return raw
    .map((q, i) => {
      if (!q || typeof q.script !== 'string' || typeof q.answer !== 'string') return null
      const script = q.script.trim()
      const answer = q.answer.trim()
      // answer phải nằm trong script để tạo được chỗ trống
      if (!answer || !script.includes(answer)) return null
      const sentence = script.replace(answer, BLANK)
      return {
        id: i + 1,
        script,
        sentence,
        blank: BLANK,
        answer,
        hint: (q.hint || '').trim(),
        explanation: (q.explanation || '').trim(),
      }
    })
    .filter(Boolean)
}

module.exports = { generateFillBlanks }
