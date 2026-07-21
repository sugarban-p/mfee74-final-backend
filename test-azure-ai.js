// 自動讀取後端根目錄的 .env。
import 'dotenv/config';

// 匯入 OpenAI 官方 Node.js SDK。
import OpenAI from 'openai';

// 從環境變數取得 Azure 連線設定。
const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT;

// 提前檢查設定，避免缺少環境變數時得到難以理解的 Azure 錯誤。
if (!endpoint || !apiKey || !deploymentName) {
  throw new Error('缺少 Azure OpenAI 環境變數，請檢查後端 .env');
}

// 建立 SDK client。
// baseURL 必須是 Azure OpenAI Endpoint，而且應以 /openai/v1/ 結尾。
const openai = new OpenAI({
  apiKey,
  baseURL: endpoint,
});

try {
  // 呼叫剛才部署的 mofu-pet-ai。
  const completion = await openai.chat.completions.create({
    // Azure 這裡使用的是「部署名稱」，不是原始模型名稱。
    model: deploymentName,

    // GPT-5 mini 使用 max_completion_tokens 控制輸出上限。
    max_completion_tokens: 500,

    // 這次只是簡單 JSON 測試，不需要大量推理。
    reasoning_effort: 'low',

    // 要求模型輸出有效 JSON。
    response_format: {
      type: 'json_object',
    },

    messages: [
      {
        // developer message 用來設定模型必須遵守的規則。
        role: 'developer',
        content:
          '你是 MOFU 寵物用品導購助理。只能回傳有效 JSON，不要加入 Markdown。',
      },
      {
        // 這是本次測試問題。
        role: 'user',
        content:
          '請回傳 {"success": true, "message": "Azure 連線成功"}。',
      },
    ],
  });

  // 取得模型實際回傳的文字。
  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error('Azure 有回應，但沒有產生文字內容');
  }

  // 嘗試解析 JSON，同時驗證模型是否遵守格式要求。
  const result = JSON.parse(content);

  console.log('Azure SDK 測試成功：');
  console.log(result);
} catch (error) {
  // 顯示 HTTP 狀態碼和錯誤訊息，方便判斷是哪項設定有誤。
  console.error('Azure SDK 測試失敗：');
  console.error('status:', error.status);
  console.error('message:', error.message);
}