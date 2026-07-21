/**
 * Azure OpenAI 推薦理由服務。
 *
 * 這個檔案的責任只有：
 * 1. 接收後端已篩選好的寵物與候選商品資料
 * 2. 呼叫 Azure OpenAI
 * 3. 請 AI 替商品撰寫推薦理由
 *
 * 這個檔案不會直接查詢、修改或刪除資料庫資料。
 */

import OpenAI from "openai";

/**
 * 取得並檢查 Azure 環境變數。
 *
 * 環境變數存放在後端的 .env：
 * AZURE_OPENAI_ENDPOINT
 * AZURE_OPENAI_API_KEY
 * AZURE_OPENAI_DEPLOYMENT
 */
function getAzureConfig() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const apiKey = process.env.AZURE_OPENAI_API_KEY;
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

  /**
   * 只要缺少其中一項，就不能呼叫 Azure。
   *
   * throw 會拋出錯誤，接著由下方的 catch 接住，
   * 最後改用 fallback 備用推薦理由。
   */
  if (!endpoint || !apiKey || !deployment) {
    throw new Error("Azure OpenAI 環境變數尚未設定完整");
  }

  return {
    /**
     * 先移除網址結尾多餘的斜線，再補上一個斜線。
     *
     * 最後會保持以下格式：
     * https://資源名稱.openai.azure.com/openai/v1/
     */
    endpoint: `${endpoint.replace(/\/+$/, "")}/`,

    apiKey,
    deployment,
  };
}

/**
 * Azure 無法使用時的備用推薦理由。
 *
 * 例如：
 * - 網路斷線
 * - Azure 暫時沒有回應
 * - 免費額度用完
 * - API Key 設定錯誤
 *
 * 發生這些情況時，商品卡仍然可以顯示，
 * 只是推薦理由會由後端固定格式產生。
 */
function createFallbackReason(product, guidedNeedLabel) {
  /**
   * matchedHealthConditions 是這項商品符合的寵物健康情況。
   *
   * 例如：
   * ["皮膚敏感", "腸胃敏感"]
   *
   * join("、") 會變成：
   * "皮膚敏感、腸胃敏感"
   */
  const matchedConditions =
    product.matchedHealthConditions?.join("、");

  if (matchedConditions) {
    return `${product.name}符合${matchedConditions}需求，可列入日常選購考量。`;
  }

  return `${product.name}符合「${guidedNeedLabel}」需求，可作為選購參考。`;
}

/**
 * 呼叫 Azure，替後端已篩選好的商品產生推薦理由。
 *
 * petContext：
 * 目前使用者選擇的寵物資料。
 *
 * guidedNeed：
 * 使用者選擇的導購需求，例如日常主食、健康需求。
 *
 * products：
 * pet-recommendation.js 已篩選完成的候選商品。
 */
export async function generatePetRecommendationReasons({
  petContext,
  guidedNeed,
  products,
}) {
  /**
   * 如果後端沒有找到候選商品，
   * 就不需要呼叫 Azure，避免浪費 token。
   */
  if (products.length === 0) {
    return {
      // rules 表示只有執行後端篩選規則，沒有呼叫 Azure。
      source: "rules",

      products: [],
    };
  }

  /**
   * 整理要提供給 AI 的資料。
   *
   * Azure 不會直接連線 MySQL。
   * 是 Express 先讀取資料庫，再把必要資料放進 aiInput。
   *
   * 因此 Azure：
   * - 看不到 SQL
   * - 看不到資料庫密碼
   * - 看不到會員完整資料
   * - 不能修改資料庫
   */
  const aiInput = {
    pet: {
      // 寵物名稱，例如 Momo。
      name: petContext.petName,

      // 寵物物種，例如貓、狗。
      species: petContext.speciesLabel,

      // 寵物目前選擇的健康情況。
      healthConditions:
        petContext.healthConditions.map(
          (condition) => condition.label,
        ),
    },

    // 使用者這一次選擇的導購需求。
    guidedNeed: guidedNeed.label,

    /**
     * evidence 是 AI 可以使用的商品證據。
     *
     * 這不是資料庫資料表，
     * 而是後端暫時建立、傳給 AI 的 JavaScript 資料。
     */
    candidates: products.map((product) => ({
      productId: product.productId,
      productName: product.name,
      slogan: product.slogan,
      description: product.description,

      matchedHealthConditions:
        product.matchedHealthConditions,
    })),
  };

  /**
   * 取得後端候選商品的所有 ID。
   *
   * 之後會放進 JSON Schema 的 enum，
   * 限制 AI 只能回傳這些商品 ID。
   */
  const candidateIds = products.map(
    (product) => product.productId,
  );

  try {
    // 讀取並驗證 Azure 環境變數。
    const { endpoint, apiKey, deployment } =
      getAzureConfig();

    /**
     * 建立 OpenAI SDK client。
     *
     * OpenAI 官方 SDK 也支援 Azure OpenAI v1 endpoint。
     */
    const openai = new OpenAI({
      apiKey,

      /**
       * baseURL 必須包含 /openai/v1/。
       *
       * 例如：
       * https://xxx.openai.azure.com/openai/v1/
       */
      baseURL: endpoint,

      // 最多等待 Azure 20 秒。
      timeout: 20000,
    });

    /**
     * 呼叫 Azure Chat Completions API。
     */
    const completion =
      await openai.chat.completions.create({
        /**
         * Azure 這裡填的是「部署名稱」，
         * 不是模型原始名稱。
         *
         * 目前部署名稱是：
         * mofu-pet-ai
         */
        model: deployment,

        /**
         * 限制 AI 回覆使用的 token 數量，
         * 避免產生過長內容與不必要的費用。
         */
        max_completion_tokens: 1200,

        /**
         * 導購理由不需要很深入的推理。
         *
         * low 可以降低等待時間與 token 使用量。
         */
        reasoning_effort: "low",

        /**
         * response_format 使用 JSON Schema，
         * 強制 AI 按照指定的 JSON 結構回答。
         */
        response_format: {
          type: "json_schema",

          json_schema: {
            name: "pet_recommendations",

            // strict 表示必須嚴格遵守 schema。
            strict: true,

            schema: {
              type: "object",

              // 不允許 AI 增加其他欄位。
              additionalProperties: false,

              properties: {
                recommendations: {
                  type: "array",

                  /**
                   * AI 回傳的數量必須和候選商品相同。
                   *
                   * 如果後端選出兩項商品，
                   * AI 就必須回傳兩項理由。
                   */
                  minItems: products.length,
                  maxItems: products.length,

                  items: {
                    type: "object",
                    additionalProperties: false,

                    properties: {
                      productId: {
                        type: "integer",

                        /**
                         * enum 限制 AI 只能使用
                         * 後端候選商品的 ID。
                         */
                        enum: candidateIds,
                      },

                      reason: {
                        type: "string",
                      },
                    },

                    required: [
                      "productId",
                      "reason",
                    ],
                  },
                },
              },

              required: ["recommendations"],
            },
          },
        },

        messages: [
          {
            /**
             * developer message 是 AI 的工作規則。
             *
             * 正式串接後，規則放在後端程式裡，
             * 不依賴 Azure 遊樂場暫時輸入的設定。
             */
            role: "developer",

            content: `
你是 MOFU 寵物用品導購助手。

後端已經完成寵物物種、健康需求、過敏食材、商品庫存與候選商品篩選。
你只能替後端提供的候選商品撰寫推薦理由，不得新增、刪除、更換或虛構商品。

規則：
1. 使用繁體中文。
2. 每項候選商品都必須產生一個推薦理由。
3. 只能使用輸入資料中明確提供的事實。
4. 推薦理由必須結合寵物的健康情況與商品資料。
5. 不得顯示 tag、slug、keyword 或資料庫欄位名稱。
6. 不得宣稱商品可以治療疾病。
7. 不得保證商品絕對安全或保證不會過敏。
8. 不得自行推論沒有提供的成分、效果、適用族群或使用方式。
9. 避免使用「不刺激」、「容易消化」、「治療」、「改善」、「絕對安全」。
10. 使用一般消費者看得懂、自然且溫和的文字。
11. 優先使用「符合目前需求」、「可作為日常選項」、「可列入考量」等中性表達。
12. 每個推薦理由約 35 至 70 個中文字。
13. 理由只能重新組合 candidates 中提供的商品證據。
14. 如果商品資料不足，只說明已提供的符合原因，不得自行補充資訊。
15. 你只能分析資料，不得新增、修改或刪除任何資料。
            `.trim(),
          },

          {
            /**
             * user message 是這一次要分析的實際資料。
             *
             * JSON.stringify() 會把 JavaScript object
             * 轉成 AI 可以接收的 JSON 字串。
             */
            role: "user",
            content: JSON.stringify(aiInput),
          },
        ],
      });

    /**
     * SDK 回覆內容位於：
     * choices[0].message.content
     */
    const outputText =
      completion.choices[0]?.message?.content;

    if (!outputText) {
      throw new Error("Azure 回應中沒有推薦內容");
    }

    /**
     * AI 回傳的是 JSON 字串，
     * JSON.parse() 會將它轉成 JavaScript object。
     */
    const aiResult = JSON.parse(outputText);

    /**
     * 基本確認 recommendations 確實是陣列。
     *
     * 雖然 Structured Outputs 已有限制格式，
     * 後端仍保留基本防護。
     */
    if (
      !Array.isArray(aiResult.recommendations)
    ) {
      throw new Error("Azure 推薦格式不正確");
    }

    /**
     * 將推薦結果轉成 Map。
     *
     * 例如：
     * productId 8 → "推薦理由..."
     *
     * 之後可以快速把理由放回原本商品。
     */
    const reasonMap = new Map(
      aiResult.recommendations.map(
        (recommendation) => [
          recommendation.productId,
          recommendation.reason,
        ],
      ),
    );

    return {
      // azure 表示這次成功使用 Azure 產生理由。
      source: "azure",

      /**
       * 商品資料仍以後端原本的 products 為準。
       *
       * Azure 只能提供 reason，
       * 不能替換商品名稱、價格、圖片或商品 ID。
       */
      products: products.map((product) => ({
        ...product,

        /**
         * 找得到 Azure 理由就使用 Azure 理由。
         *
         * 如果某個商品意外沒有理由，
         * 就改用後端 fallback。
         */
        reason:
          reasonMap.get(product.productId) ??
          createFallbackReason(
            product,
            guidedNeed.label,
          ),
      })),
    };
  } catch (error) {
    /**
     * Azure 呼叫失敗時，
     * 在後端 Terminal 顯示真正的錯誤。
     *
     * 錯誤內容不會直接回傳前端，
     * 避免洩漏 API 或系統資訊。
     */
    console.error(
      "[Azure pet recommendation]",
      error,
    );

    /**
     * Azure 失敗不讓整支 API 變成 500。
     *
     * 商品仍然使用後端規則篩選結果，
     * 推薦理由則改成固定的 fallback。
     */
    return {
      source: "fallback",

      products: products.map((product) => ({
        ...product,

        reason: createFallbackReason(
          product,
          guidedNeed.label,
        ),
      })),
    };
  }
}