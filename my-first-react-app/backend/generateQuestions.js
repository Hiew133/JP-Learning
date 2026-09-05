const { GoogleGenAI, Type } = require('@google/genai')

// Schema bắt buộc cho output — đảm bảo Gemini trả về đúng cấu trúc câu hỏi
const QUESTION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING, description: 'Câu hỏi bằng tiếng Nhật' },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Đúng 4 lựa chọn bằng tiếng Nhật',
          },
          answer: {
            type: Type.INTEGER,
            description: 'Chỉ số (0-3) của đáp án đúng trong options',
          },
          explanation: {
            type: Type.STRING,
            description: 'Giải thích ngắn bằng tiếng Nhật vì sao đáp án đúng',
          },
        },
        required: ['question', 'options', 'answer', 'explanation'],
        propertyOrdering: ['question', 'options', 'answer', 'explanation'],
      },
    },
  },
  required: ['questions'],
}

const SYSTEM_PROMPT = `Bạn là giáo viên ra đề nghe hiểu tiếng Nhật.
Dựa trên transcript (lời thoại) một đoạn audio tiếng Nhật, hãy tạo các câu hỏi trắc nghiệm đúng format đề thi nghe thật:
- Mỗi câu hỏi có đúng 4 lựa chọn, chỉ 1 đáp án đúng.
- Câu hỏi và các lựa chọn viết bằng tiếng Nhật tự nhiên, bám sát độ khó của chính transcript.
- Các lựa chọn sai phải hợp lý (gây nhiễu dựa trên nội dung), không quá lộ liễu.
- Giải thích ngắn gọn bằng tiếng Nhật, trích dẫn phần liên quan trong hội thoại.
- Số câu hỏi: 3-6 câu tùy độ dài và lượng thông tin của transcript.
- Chỉ dùng thông tin có trong transcript, không bịa thêm.`

// Sinh câu hỏi trắc nghiệm từ transcript. Trả về mảng { question, options, answer, explanation }.
async function generateQuestions(transcript) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error(
      'Chưa cấu hình GEMINI_API_KEY. Tạo file backend/.env từ .env.example và điền key (miễn phí tại aistudio.google.com/apikey).'
    )
  }

  const ai = new GoogleGenAI({ apiKey })

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Đây là transcript đoạn audio tiếng Nhật. Hãy tạo câu hỏi trắc nghiệm nghe hiểu:\n\n${transcript}`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: 'application/json',
      responseSchema: QUESTION_SCHEMA,
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

  const questions = parsed.questions || []
  // Lọc bỏ câu hỏi không hợp lệ (đủ 4 lựa chọn, answer trong khoảng)
  return questions.filter(
    (q) =>
      q &&
      typeof q.question === 'string' &&
      Array.isArray(q.options) &&
      q.options.length === 4 &&
      Number.isInteger(q.answer) &&
      q.answer >= 0 &&
      q.answer <= 3
  )
}

module.exports = { generateQuestions }
