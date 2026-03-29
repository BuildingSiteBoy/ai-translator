import { NextResponse } from 'next/server';
import { getGeminiModel } from '@/lib/gemini';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const { text, style, model: modelName } = await req.json();

    if (!text) {
      return NextResponse.json({ error: '请输入待翻译的内容' }, { status: 400 });
    }

    const model = getGeminiModel(modelName || 'gemini-1.5-flash');

    const stylePrompts: Record<string, string> = {
      technical: `
【风格：专业技术翻译】
要求：
- 精准翻译 IT / 前端 / 后端 / 数据库 / API / 云计算 等术语。
- 使用工程师真实的表达方式（自然，不呆板）。
- 中→英：自然且专业，适合 PR、技术文档、Slack 沟通。
- 英→中：技术准确，不追求华丽辞藻，保持清晰。
- 重点词汇：解释出现的关键技术词汇（如 API / VPC / S3 等）。
- 优化说明：简述为何这样优化，帮助学习。
      `,
      casual: `
【风格：美式口语 (Casual American English)】
要求：
- 像洛杉矶（LA）年轻人聊天一样（Chill + Attitude）。
- 尽量非正式，可以使用缩写（gonna / wanna / kinda / lmk 等）。
- 根据语境可以适度使用感叹词或语气词（shit / damn / wtf / for real 等）。
- 自然流畅，不要刻意装酷。
- 重点词汇：解释俚语（Slang）或地道的口语表达。
- 优化说明：解释这个表达在口语中的真实意境。
      `
    };

    const prompt = `
你是一位顶尖的 AI 翻译官，精通中英文互译。
你的任务是自动识别输入文本的语言，并将其翻译为另一种语言。

输入内容：
"""
${text}
"""

${stylePrompts[style] || stylePrompts.technical}

【自动处理逻辑】
1. 如果输入是中文 -> 翻译为英文。
2. 如果输入是英文 -> 翻译为中文。
3. 保持语义高度准确，并根据选定风格进行优化。

【输出要求】
必须严格输出 JSON 格式，结构如下：
{
 "translation": "翻译后的最终文本",
 "explanation": "对整体句子的优化说明和风格处理解释（朋友式口吻，不要学术化）",
 "notes": [
  {
   "term": "原文中的重点词汇或短语",
   "explain": "针对该词汇在该风格下的意思及用法说明"
  }
 ]
}
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    if (!content) throw new Error('Gemini 返回内容为空');

    // 处理可能的 markdown 代码块包裹
    let cleanJson = content.trim();
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.replace(/^```(json)?/, '').replace(/```$/, '');
    }

    return NextResponse.json(JSON.parse(cleanJson));
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error.message || '翻译失败，请检查配置或 API 状态' },
      { status: 500 }
    );
  }
}
