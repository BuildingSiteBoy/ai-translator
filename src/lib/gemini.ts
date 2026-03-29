import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

export const genAI = new GoogleGenerativeAI(apiKey || 'dummy-key');

export const getGeminiModel = (modelName: string) => {
  // 兼容性处理：如果模型名不包含版本号，可以尝试补全或映射
  // 1.5-pro 对应的准确 ID 通常是 gemini-1.5-pro-latest 或 gemini-1.5-pro
  // 这里我们直接透传，但在调用前确保 API Key 有权限
  return genAI.getGenerativeModel({ 
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
    }
  });
};
