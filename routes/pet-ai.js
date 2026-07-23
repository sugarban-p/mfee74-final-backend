/**
 * 寵物 AI 導購 API。
 *
 * 完整流程：
 * 1. 驗證會員登入
 * 2. 確認寵物屬於目前會員
 * 3. 從資料庫篩選符合條件的候選商品
 * 4. 將候選商品交給 Azure 產生推薦理由
 * 5. 將商品資料與推薦理由回傳前端
 */

import { Router } from "express";

import { requireAuth } from "../utils/auth-session.js";

/**
 * 匯入寵物資料與商品規則篩選功能。
 *
 * 這一層負責查詢 MySQL，以及決定哪些商品可以被推薦。
 */
import {
  GUIDED_NEEDS,
  getOwnedPetRecommendationContext,
  getPetCandidateProducts,
  isValidGuidedNeedCode,
} from "../services/pet-recommendation.js";

/**
 * 匯入 Azure 推薦理由服務。
 *
 * Azure 只會替後端已經選好的商品撰寫推薦理由，
 * 不會自行新增或更換商品。
 */
import { generatePetRecommendationReasons } from "../services/azure-pet-ai.js";

const router = Router();

/**
 * 此檔案中的所有 API 都必須先登入。
 *
 * requireAuth 會：
 * 1. 讀取 Authorization header 或登入 Cookie
 * 2. 驗證 access token
 * 3. 將會員資料放進 req.currentUser
 *
 * 因此前端不需要傳送 userId。
 */
router.use(requireAuth);

/**
 * POST /api/pet-ai/recommendations
 *
 * 前端 Request body：
 * {
 *   "petId": 1,
 *   "needCode": "health_based"
 * }
 *
 * needCode 目前允許：
 * - health_based：依健康狀況推薦
 * - main_food：日常主食
 * - treat：零食與營養補充
 * - care：保健與生活照護
 */
router.post("/recommendations", async (req, res) => {
  try {
    /**
     * userId 必須來自登入驗證結果。
     *
     * 不接受前端自行傳入 userId，
     * 避免會員讀取其他會員的寵物。
     */
    const userId = req.currentUser.id;

    /**
     * req.body 的資料不一定是正確型別，
     * 因此先轉換成後端需要的格式。
     */
    const petId = Number(req.body?.petId);
    const needCode = String(req.body?.needCode || "").trim();

    /**
     * 驗證 petId。
     *
     * Number.isInteger() 確認它是整數，
     * 同時要求 petId 必須大於 0。
     */
    if (!Number.isInteger(petId) || petId <= 0) {
      return res.status(400).json({
        success: false,
        message: "寵物 id 格式不正確",
      });
    }

    /**
     * 驗證 needCode。
     *
     * 使用白名單方式，只接受 GUIDED_NEEDS
     * 已經定義好的引導式選項。
     */
    if (!isValidGuidedNeedCode(needCode)) {
      return res.status(400).json({
        success: false,
        message: "不支援的導購需求",
      });
    }

    /**
     * 查詢目前選擇的寵物資料。
     *
     * 查詢時會同時確認：
     * 1. 寵物存在
     * 2. 寵物屬於目前登入會員
     * 3. 寵物沒有被軟刪除
     */
    const petContext = await getOwnedPetRecommendationContext(userId, petId);

    /**
     * 找不到時統一回傳 404。
     *
     * 不特別告訴使用者寵物是否屬於別人，
     * 可以避免洩漏其他會員的資料。
     */
    if (!petContext) {
      return res.status(404).json({
        success: false,
        message: "找不到寵物資料",
      });
    }

    /**
     * 從 GUIDED_NEEDS 取得需求的完整設定。
     *
     * 例如 needCode 是 health_based 時：
     * guidedNeed.label 會是「依健康狀況推薦」。
     */
    const guidedNeed = GUIDED_NEEDS[needCode];

    /**
     * 從固定的 18 項展示商品中篩選候選商品。
     *
     * 這一層由後端規則處理：
     * - 寵物物種
     * - 使用者選擇的導購需求
     * - 寵物健康情況
     * - 過敏食材排除
     * - 商品與品項庫存
     *
     * Azure 不會參與這個篩選過程。
     */
    const products = await getPetCandidateProducts(petContext, needCode);

    /**
     * 將後端篩選好的候選商品交給 Azure。
     *
     * Azure 只會替每項商品新增 reason，
     * 不可以新增、刪除或替換 productId。
     */
    const aiRecommendation = await generatePetRecommendationReasons({
      petContext,
      guidedNeed,
      products,
    });

    /**
     * 回傳前端需要的完整 AI 導購資料。
     */
    return res.json({
      success: true,

      row: {
        /**
         * 回傳目前導購使用的寵物資料。
         *
         * 前端可用於顯示：
         * 「正在為哪隻毛孩導購」。
         */
        pet: {
          id: petContext.petId,
          name: petContext.petName,

          /**
           * 毛孩照片提供前端導購摘要卡使用。
           * 資料庫沒有照片時會回傳 null。
           */
          avatarUrl: petContext.avatarUrl,

          speciesCode: petContext.speciesCode,
          speciesLabel: petContext.speciesLabel,
          breed: petContext.breed,
          birthday: petContext.birthday,
          weight: petContext.weight,

          activityLevelCode: petContext.activityLevelCode,
          activityLevelLabel: petContext.activityLevelLabel,

          healthConditions: petContext.healthConditions,
          allergyIngredients: petContext.allergyIngredients,
        },

        /**
         * 回傳使用者本次選擇的導購需求。
         */
        guidedNeed: {
          code: needCode,
          label: guidedNeed.label,
        },

        /**
         * 推薦理由的來源。
         *
         * azure：
         * Azure 成功產生推薦理由。
         *
         * fallback：
         * Azure 呼叫失敗，使用後端備用理由。
         *
         * rules：
         * 沒有候選商品，所以沒有呼叫 Azure。
         */
        recommendationSource: aiRecommendation.source,

        /**
         * 回傳商品卡資料。
         *
         * 每項商品會包含原本商品資料，
         * 並新增 reason 推薦理由。
         */
        products: aiRecommendation.products,
      },
    });
  } catch (error) {
    /**
     * 捕捉資料庫或程式執行中的非預期錯誤。
     *
     * 詳細錯誤只顯示在後端 Terminal，
     * 不把資料庫資訊回傳給前端。
     */
    console.error("[POST /api/pet-ai/recommendations]", error);

    return res.status(500).json({
      success: false,
      message: "目前無法取得推薦商品",
    });
  }
});

export default router;
