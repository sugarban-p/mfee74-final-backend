import { askGemini } from "./gemini.js";

export async function askAI(message) {
  if (process.env.AI_ENABLED !== "true") {
    return "AI 功能目前關閉";
  }

  switch (String(process.env.AI_PROVIDER || "gemini").toLowerCase()) {
    case "gemini":
      return await askGemini(message);
    default:
      throw new Error("Unsupported AI provider");
  }
}
