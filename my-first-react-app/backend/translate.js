const { GoogleGenAI, Type } = require('@google/genai')

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    translations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Bản dịch tiếng Việt, cùng số lượng và đúng thứ tự với câu đầu vào',
    },
  },
  required: ['translations'],
}

// Dịch một mảng câu tiếng Nhật sang tiếng Việt trong 1 lần gọi Gemini.
// Trả về mảng cùng độ dài (phần tử thiếu/để trống nếu lỗi).
async function translateSegments(texts) {
  if (!texts.length) return []

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return texts.map(() => '')

  const ai = new GoogleGenAI({ apiKey })

  // Đánh số để Gemini giữ đúng thứ tự / số lượng
  const numbered = texts.map((t, i) => `${i + 1}. ${t}`).join('\n')

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Dịch từng câu tiếng Nhật sau sang tiếng Việt tự nhiên, dễ hiểu. Giữ ĐÚNG số lượng và thứ tự câu (mỗi câu một bản dịch):\n\n${numbered}`,
      config: {
        systemInstruction:
          'Bạn là người dịch phụ đề Nhật-Việt. Dịch sát nghĩa, tự nhiên, ngắn gọn. Không thêm giải thích.',
        responseMimeType: 'application/json',
        responseSchema: SCHEMA,
      },
    })

    const parsed = JSON.parse(response.text || '{}')
    const out = parsed.translations || []
    // Đảm bảo độ dài khớp
    return texts.map((_, i) => out[i] || '')
  } catch (err) {
    console.error('Translate lỗi:', err.message)
    return texts.map(() => '')
  }
}

module.exports = { translateSegments }
