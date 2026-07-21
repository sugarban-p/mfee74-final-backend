import "dotenv/config";

import { ai } from "./utils/ai.js";

const response = await ai.models.generateContent({
  model: "gemini-3.5-flash",
  contents: "請介紹 MOFU Natural Living 寵物商城。",
});

console.log(response.text);
