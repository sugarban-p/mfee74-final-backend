import { GoogleGenAI } from "@google/genai";

import { MOFU_SYSTEM_PROMPT } from "../../utils/ai-prompt.js";

const client = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 8000);
const AI_MAX_TOKENS = Number(process.env.AI_MAX_TOKENS || 180);
const AI_TEMPERATURE = Number(process.env.AI_TEMPERATURE || 0.4);

function withTimeout(promise, timeoutMs) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return promise;

  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error("AI_TIMEOUT")), timeoutMs);
    }),
  ]);
}

export async function askGemini(message) {
  const response = await withTimeout(
    client.models.generateContent({
      model: process.env.AI_MODEL || "gemini-3.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                MOFU_SYSTEM_PROMPT +
                "\n\n請以 2 到 4 句簡潔回答。\n\n使用者問題：" +
                String(message || "").trim(),
            },
          ],
        },
      ],
      generationConfig: {
        maxOutputTokens: Number.isFinite(AI_MAX_TOKENS) ? AI_MAX_TOKENS : 180,
        temperature: Number.isFinite(AI_TEMPERATURE) ? AI_TEMPERATURE : 0.4,
      },
    }),
    AI_TIMEOUT_MS,
  );

  return response.text;
}
