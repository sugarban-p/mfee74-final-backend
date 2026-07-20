// 寵物管理 API

import { Router } from "express";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import multer from "multer";
import pool from "../utils/connect-mysql.js";
import { requireAuth } from "../utils/auth-session.js";

const router = Router();

// ===== 共用設定 =====
/**
 * 取得本次 API 請求要查詢的會員 id。
 *
 * 正式登入完成後，會員 id 會由 req.session.user.id 提供。
 * 目前 auth 路由尚未建立登入 session，因此開發期間從 .env 的
 * PET_DEMO_USER_ID 讀取「已經寫進 MySQL」的會員假資料 id。
 * 這不是在程式中另建一份假資料，只是指定要查哪一位假會員的資料。
 */

router.use(requireAuth);

// ===== 寵物照片上傳設定 =====
const MAX_PET_AVATAR_SIZE = 5 * 1024 * 1024;
const PET_AVATAR_UPLOAD_DIR = path.join(
  process.cwd(),
  "public",
  "uploads",
  "pets",
);

/**
 * 先將檔案保留在記憶體中，確認真實檔案格式後才寫入硬碟。
 * limits.fileSize 會在檔案超過 5MB 時中止接收。
 */
const petAvatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_PET_AVATAR_SIZE,
    files: 1,
  },
});

/**
 * 同時檢查副檔名、瀏覽器提供的 MIME，以及檔案真實開頭。
 * 因此把 MP4、GIF 等檔案改名成 .jpg 仍然會被拒絕。
 */
const getValidPetAvatarExtension = (file) => {
  const originalExtension = path.extname(file.originalname).toLowerCase();
  const buffer = file.buffer;

  const hasJpegSignature =
    buffer.length >= 3 &&
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff;

  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const hasPngSignature =
    buffer.length >= pngSignature.length &&
    pngSignature.every((byte, index) => buffer[index] === byte);

  const isJpeg =
    [".jpg", ".jpeg"].includes(originalExtension) &&
    file.mimetype === "image/jpeg" &&
    hasJpegSignature;

  const isPng =
    originalExtension === ".png" &&
    file.mimetype === "image/png" &&
    hasPngSignature;

  if (isJpeg) {
    return ".jpg";
  }

  if (isPng) {
    return ".png";
  }

  return null;
};

// ===== 查詢 helper =====
const getPetListData = async (userId) => {
  /**
   * 查目前會員的寵物列表。
   *
   * pets 表只存 species_option_id_fk、gender_option_id_fk 這種選項 id，
   * 前台需要看到「貓」「女生」「已結紮」這種文字，
   * 所以這裡 JOIN pet_attr_details，把 id 轉成 attr_option。
   *
   * DATE_FORMAT 只改 API 回傳格式，不會改資料庫原始 birthday。
   */
  const sql = `
    SELECT
      p.id,
      p.pet_name AS name,
      p.avatar_url AS avatarUrl,
      species.attr_option AS species,
      p.breed_text AS breed,
      gender.attr_option AS gender,
      neutered.attr_option AS neutered,
      activity.attr_option AS activityLevel,
      DATE_FORMAT(p.birthday, '%Y-%m-%d') AS birthday,
      p.weight,
      p.special_note AS specialNote
    FROM pets p
    JOIN pet_attr_details species
      ON species.id = p.species_option_id_fk
    LEFT JOIN pet_attr_details gender
      ON gender.id = p.gender_option_id_fk
    LEFT JOIN pet_attr_details neutered
      ON neutered.id = p.neutered_option_id_fk
    LEFT JOIN pet_attr_details activity
      ON activity.id = p.activity_level_option_id_fk
    WHERE p.user_id_fk = ?
      AND p.is_deleted = 0
    ORDER BY p.id ASC;
  `;

  /**
   * pool.query(sql, [userId])
   * [userId] 會依序放進 SQL 裡的 ?。
   * 這樣不用字串拼接，比較不容易出 SQL injection。
   */
  const [rows] = await pool.query(sql, [userId]);

  /**
   * success 不是資料庫欄位，是 API 自己包的狀態。
   * rows 才是真正查出來的寵物資料陣列。
   */
  return {
    success: true,
    rows,
  };
};

const getPetDetailData = async (petId, userId) => {
  /**
   * 第一個查詢：取得 pets 表中的基本資料與單選選項。
   *
   * 這裡同時回傳：
   * - species：給詳情頁顯示「貓」
   * - speciesOptionId：給編輯頁預設選中「貓」這個 select 選項
   *
   * 同一份資料同時保留「文字」和「id」，前端會比較好使用。
   */
  const petSql = `
    SELECT
      p.id,
      p.pet_name AS name,
      p.avatar_url AS avatarUrl,

      p.species_option_id_fk AS speciesOptionId,
      species.attr_option AS species,

      p.breed_text AS breed,

      p.gender_option_id_fk AS genderOptionId,
      gender.attr_option AS gender,

      p.neutered_option_id_fk AS neuteredOptionId,
      neutered.attr_option AS neutered,

      p.activity_level_option_id_fk AS activityLevelOptionId,
      activity.attr_option AS activityLevel,

      DATE_FORMAT(p.birthday, '%Y-%m-%d') AS birthday,
      p.weight,
      p.special_note AS specialNote
    FROM pets AS p
    JOIN pet_attr_details AS species
      ON species.id = p.species_option_id_fk
    LEFT JOIN pet_attr_details AS gender
      ON gender.id = p.gender_option_id_fk
    LEFT JOIN pet_attr_details AS neutered
      ON neutered.id = p.neutered_option_id_fk
    LEFT JOIN pet_attr_details AS activity
      ON activity.id = p.activity_level_option_id_fk
    WHERE p.id = ?
      AND p.user_id_fk = ?
      AND p.is_deleted = 0
    LIMIT 1;
  `;

  // ? 依序代入 petId、userId；避免將資料直接拼進 SQL 字串。
  const [petRows] = await pool.query(petSql, [petId, userId]);
  const pet = petRows[0];

  // 找不到資料時，直接讓 route 回傳 404。
  if (!pet) {
    return {
      success: false,
      message: "找不到寵物資料",
      row: null,
    };
  }

  /**
   * 第二個查詢：取得此寵物「多選」的健康情況與過敏食材。
   *
   * 不把它們硬塞在 pets 表，是因為一隻寵物可選多個健康情況、
   * 也可選多個過敏食材，因此資料存在 pet_selected_options。
   */
  const selectedOptionsSql = `
    SELECT
      pa.group_code AS groupCode,
      pad.id AS id,
      pad.attr_option AS label,
      pad.option_code AS code
    FROM pet_selected_options AS pso
    JOIN pet_attributes AS pa
      ON pa.id = pso.option_group_id_fk
    JOIN pet_attr_details AS pad
      ON pad.id = pso.option_id_fk
    WHERE pso.pet_id_fk = ?
      AND pa.group_code IN ('health_condition', 'allergy_ingredient')
    ORDER BY pa.id ASC, pad.sort_order ASC;
  `;

  const [selectedOptionRows] = await pool.query(selectedOptionsSql, [petId]);

  /**
   * filter 是 JavaScript 陣列方法：
   * 從所有多選答案中，分別挑出健康情況與過敏食材。
   */
  const healthConditions = selectedOptionRows.filter(
    (option) => option.groupCode === "health_condition",
  );

  const allergyIngredients = selectedOptionRows.filter(
    (option) => option.groupCode === "allergy_ingredient",
  );

  return {
    success: true,
    row: {
      ...pet,

      // 完整物件陣列：詳情頁可直接顯示 label；AI 也可使用 code。
      healthConditions,
      allergyIngredients,

      /**
       * 純 id 陣列：編輯頁的 checkbox 最方便判斷是否要預設勾選。
       *
       * 例如 healthConditionOptionIds = [12, 18]
       * 代表此寵物選了「皮膚敏感」和「挑食」。
       */
      healthConditionOptionIds: healthConditions.map((option) => option.id),
      allergyIngredientOptionIds: allergyIngredients.map((option) => option.id),
    },
  };
};

const getPetOptionsData = async () => {
  /**
   * 取得所有仍可使用的寵物表單選項。
   *
   * pet_attributes：選項群組，例如 health_condition。
   * pet_attr_details：群組底下的實際選項，例如 skin_sensitive。
   */
  const sql = `
    SELECT
      pa.group_code AS groupCode,
      pa.group_name AS groupName,
      pa.selection_type AS selectionType,
      pa.is_required AS isRequired,

      pad.id AS id,
      pad.attr_option AS label,
      pad.option_code AS code,
      pad.sort_order AS sortOrder
    FROM pet_attributes AS pa
    JOIN pet_attr_details AS pad
      ON pad.pet_attr_id_fk = pa.id
    WHERE pa.is_active = 1
    ORDER BY pa.sort ASC, pad.sort_order ASC;
  `;

  const [rows] = await pool.query(sql);

  /**
   * reduce 是 JavaScript 的陣列方法：
   * 把 SQL 查出的平面資料，整理成前端方便使用的群組物件。
   *
   * 例如原本每列都有 groupCode = "species"，
   * 整理後會變成 options.species.options。
   */
  const options = rows.reduce((result, row) => {
    // 第一次遇到這個群組時，先建立群組基本資料與空陣列。
    if (!result[row.groupCode]) {
      result[row.groupCode] = {
        name: row.groupName,
        selectionType: row.selectionType,
        isRequired: Boolean(row.isRequired),
        options: [],
      };
    }

    // 將該群組底下的一個選項推進 options 陣列。
    result[row.groupCode].options.push({
      id: row.id,
      label: row.label,
      code: row.code,
    });

    return result;
  }, {});

  return {
    success: true,
    rows: options,
  };
};

// ===== 新增寵物 helper =====

// 建立可讓 route 判斷 HTTP 狀態碼的錯誤物件。
const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

// 將前端傳來的 id 轉成正整數；不合法時回傳 null。
const toPositiveInteger = (value) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
};

// 多選欄位只保留不重複的正整數 id。
const normalizeOptionIds = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map(toPositiveInteger).filter((id) => id !== null))];
};

// 驗證 YYYY-MM-DD，並避免收到不存在或未來的日期。
const isValidBirthday = (birthday) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
    return false;
  }

  const date = new Date(`${birthday}T00:00:00Z`);

  return (
    !Number.isNaN(date.getTime()) &&
    date.toISOString().slice(0, 10) === birthday &&
    birthday <= new Date().toISOString().slice(0, 10)
  );
};

/**
 * 驗證並整理新增寵物的 request body。
 * 回傳值會直接交給 SQL，避免 route 裡同時混著驗證與資料庫操作。
 */
const normalizeCreatePetBody = (body = {}) => {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const avatarUrl =
    typeof body.avatarUrl === "string" && body.avatarUrl.trim()
      ? body.avatarUrl.trim()
      : null;
  const breed =
    typeof body.breed === "string" && body.breed.trim()
      ? body.breed.trim()
      : null;
  const specialNote =
    typeof body.specialNote === "string" && body.specialNote.trim()
      ? body.specialNote.trim()
      : null;

  const speciesOptionId = toPositiveInteger(body.speciesOptionId);
  const genderOptionId = toPositiveInteger(body.genderOptionId);
  const neuteredOptionId = toPositiveInteger(body.neuteredOptionId);
  const hasActivityLevel =
    body.activityLevelOptionId !== undefined &&
    body.activityLevelOptionId !== null &&
    body.activityLevelOptionId !== "";
  const activityLevelOptionId = hasActivityLevel
    ? toPositiveInteger(body.activityLevelOptionId)
    : null;
  const healthConditionOptionIds = normalizeOptionIds(
    body.healthConditionOptionIds,
  );
  const allergyIngredientOptionIds = normalizeOptionIds(
    body.allergyIngredientOptionIds,
  );
  const birthday = typeof body.birthday === "string" ? body.birthday : "";
  const weight = Number(body.weight);

  if (!name || name.length > 50) {
    throw createHttpError(400, "寵物名稱為必填，且不可超過 50 個字");
  }

  if (avatarUrl && avatarUrl.length > 255) {
    throw createHttpError(400, "寵物照片網址不可超過 255 個字");
  }

  if (breed && breed.length > 100) {
    throw createHttpError(400, "品種不可超過 100 個字");
  }

  if (!speciesOptionId || !genderOptionId || !neuteredOptionId) {
    throw createHttpError(400, "物種、性別與結紮狀態為必填");
  }

  if (hasActivityLevel && !activityLevelOptionId) {
    throw createHttpError(400, "活動量選項格式不正確");
  }

  if (!isValidBirthday(birthday)) {
    throw createHttpError(400, "生日必須是有效且不晚於今天的 YYYY-MM-DD");
  }

  if (!Number.isFinite(weight) || weight <= 0 || weight > 999.99) {
    throw createHttpError(400, "體重必須大於 0 且不可超過 999.99 kg");
  }

  if (
    !Array.isArray(body.healthConditionOptionIds) ||
    body.healthConditionOptionIds.some(
      (optionId) => toPositiveInteger(optionId) === null,
    ) ||
    healthConditionOptionIds.length < 1 ||
    healthConditionOptionIds.length > 4
  ) {
    throw createHttpError(400, "健康情況至少選 1 項，最多選 4 項");
  }

  if (
    !Array.isArray(body.allergyIngredientOptionIds) ||
    body.allergyIngredientOptionIds.some(
      (optionId) => toPositiveInteger(optionId) === null,
    ) ||
    allergyIngredientOptionIds.length < 1
  ) {
    throw createHttpError(400, "過敏食材至少選 1 項，沒有過敏請選「無」");
  }

  return {
    name,
    avatarUrl,
    speciesOptionId,
    breed,
    genderOptionId,
    neuteredOptionId,
    activityLevelOptionId,
    birthday,
    weight,
    specialNote,
    healthConditionOptionIds,
    allergyIngredientOptionIds,
  };
};

/**
 * 確認每個選項 id 都存在，且屬於應有的群組。
 * 例如 speciesOptionId 不能偷偷傳入 health_condition 的 id。
 */
const validatePetOptionGroups = async (connection, petData) => {
  const expectedOptions = [
    { optionId: petData.speciesOptionId, expectedGroup: "species" },
    { optionId: petData.genderOptionId, expectedGroup: "gender" },
    { optionId: petData.neuteredOptionId, expectedGroup: "neutered" },
  ];

  if (petData.activityLevelOptionId) {
    expectedOptions.push({
      optionId: petData.activityLevelOptionId,
      expectedGroup: "activity_level",
    });
  }

  petData.healthConditionOptionIds.forEach((optionId) => {
    expectedOptions.push({ optionId, expectedGroup: "health_condition" });
  });

  petData.allergyIngredientOptionIds.forEach((optionId) => {
    expectedOptions.push({ optionId, expectedGroup: "allergy_ingredient" });
  });

  const optionIds = [
    ...new Set(expectedOptions.map((option) => option.optionId)),
  ];
  const placeholders = optionIds.map(() => "?").join(", ");
  const sql = `
    SELECT
      pad.id,
      pa.id AS groupId,
      pa.group_code AS groupCode,
      pad.option_code AS optionCode
    FROM pet_attr_details AS pad
    JOIN pet_attributes AS pa
      ON pa.id = pad.pet_attr_id_fk
    WHERE pa.is_active = 1
      AND pad.id IN (${placeholders});
  `;

  const [rows] = await connection.query(sql, optionIds);
  const optionMap = new Map(rows.map((row) => [row.id, row]));

  for (const { optionId, expectedGroup } of expectedOptions) {
    const option = optionMap.get(optionId);

    if (!option || option.groupCode !== expectedGroup) {
      throw createHttpError(
        400,
        `選項 id ${optionId} 不存在或不屬於 ${expectedGroup}`,
      );
    }
  }

  const healthOptions = petData.healthConditionOptionIds.map((id) =>
    optionMap.get(id),
  );
  const allergyOptions = petData.allergyIngredientOptionIds.map((id) =>
    optionMap.get(id),
  );

  // 「無」代表沒有其他狀況，因此不可與其他選項一起儲存。
  if (
    healthOptions.some((option) => option.optionCode === "none") &&
    healthOptions.length > 1
  ) {
    throw createHttpError(400, "健康情況的「無特殊狀況」不可與其他項目並選");
  }

  if (
    allergyOptions.some((option) => option.optionCode === "none") &&
    allergyOptions.length > 1
  ) {
    throw createHttpError(400, "過敏食材的「無」不可與其他食材並選");
  }

  return {
    healthGroupId: healthOptions[0].groupId,
    allergyGroupId: allergyOptions[0].groupId,
  };
};

/**
 * Transaction 保證 pets 與 pet_selected_options 要嘛一起成功、要嘛一起失敗。
 * 如此不會留下只有基本資料、卻缺少健康情況的半套寵物資料。
 */
const createPetData = async (userId, body) => {
  const petData = normalizeCreatePetBody(body);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { healthGroupId, allergyGroupId } = await validatePetOptionGroups(
      connection,
      petData,
    );

    const insertPetSql = `
      INSERT INTO pets (
        user_id_fk,
        pet_name,
        avatar_url,
        species_option_id_fk,
        breed_text,
        gender_option_id_fk,
        neutered_option_id_fk,
        activity_level_option_id_fk,
        birthday,
        weight,
        special_note
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    const [petResult] = await connection.query(insertPetSql, [
      userId,
      petData.name,
      petData.avatarUrl,
      petData.speciesOptionId,
      petData.breed,
      petData.genderOptionId,
      petData.neuteredOptionId,
      petData.activityLevelOptionId,
      petData.birthday,
      petData.weight,
      petData.specialNote,
    ]);

    const selectedOptionRows = [
      ...petData.healthConditionOptionIds.map((optionId) => [
        petResult.insertId,
        healthGroupId,
        optionId,
      ]),
      ...petData.allergyIngredientOptionIds.map((optionId) => [
        petResult.insertId,
        allergyGroupId,
        optionId,
      ]),
    ];

    await connection.query(
      `
        INSERT INTO pet_selected_options (
          pet_id_fk,
          option_group_id_fk,
          option_id_fk
        )
        VALUES ?;
      `,
      [selectedOptionRows],
    );

    await connection.commit();

    return petResult.insertId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * 更新一隻屬於目前會員的寵物。
 *
 * PUT 代表用這次送來的完整表單取代原本資料，
 * 因此前端編輯頁必須送出所有欄位，而不只是有修改的欄位。
 */
const updatePetData = async (userId, petId, body) => {
  // 沿用新增寵物的驗證，確保 POST 與 PUT 接受相同格式。
  const petData = normalizeCreatePetBody(body);
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    /**
     * 先確認：
     * 1. 寵物存在
     * 2. 寵物屬於目前會員
     * 3. 寵物尚未被軟刪除
     *
     * FOR UPDATE 會在 transaction 完成前鎖定這筆資料，
     * 避免同一隻寵物同時被兩個請求修改。
     */
    const [petRows] = await connection.query(
      `
        SELECT id
        FROM pets
        WHERE id = ?
          AND user_id_fk = ?
          AND is_deleted = 0
        LIMIT 1
        FOR UPDATE;
      `,
      [petId, userId],
    );

    if (petRows.length === 0) {
      throw createHttpError(404, "找不到可以編輯的寵物資料");
    }

    // 再次確認所有選項 ID 存在，且屬於正確群組。
    const { healthGroupId, allergyGroupId } = await validatePetOptionGroups(
      connection,
      petData,
    );

    /**
     * 更新 pets 表中的基本資料與單選資料。
     * updated_at 會由 MySQL 的 ON UPDATE CURRENT_TIMESTAMP 自動更新。
     */
    await connection.query(
      `
        UPDATE pets
        SET
          pet_name = ?,
          avatar_url = ?,
          species_option_id_fk = ?,
          breed_text = ?,
          gender_option_id_fk = ?,
          neutered_option_id_fk = ?,
          activity_level_option_id_fk = ?,
          birthday = ?,
          weight = ?,
          special_note = ?
        WHERE id = ?
          AND user_id_fk = ?
          AND is_deleted = 0;
      `,
      [
        petData.name,
        petData.avatarUrl,
        petData.speciesOptionId,
        petData.breed,
        petData.genderOptionId,
        petData.neuteredOptionId,
        petData.activityLevelOptionId,
        petData.birthday,
        petData.weight,
        petData.specialNote,
        petId,
        userId,
      ],
    );

    /**
     * 多選資料採用「先刪除舊答案，再寫入新答案」。
     *
     * 例如原本健康情況是 [皮膚敏感、挑食]，
     * 編輯後變成 [腸胃敏感]，直接 UPDATE 很難判斷哪些要留、哪些要刪，
     * 因此完整重建會比較單純且不容易留下舊選項。
     */
    await connection.query(
      `
        DELETE FROM pet_selected_options
        WHERE pet_id_fk = ?
          AND option_group_id_fk IN (?, ?);
      `,
      [petId, healthGroupId, allergyGroupId],
    );

    const selectedOptionRows = [
      ...petData.healthConditionOptionIds.map((optionId) => [
        petId,
        healthGroupId,
        optionId,
      ]),
      ...petData.allergyIngredientOptionIds.map((optionId) => [
        petId,
        allergyGroupId,
        optionId,
      ]),
    ];

    await connection.query(
      `
        INSERT INTO pet_selected_options (
          pet_id_fk,
          option_group_id_fk,
          option_id_fk
        )
        VALUES ?;
      `,
      [selectedOptionRows],
    );

    // 所有 SQL 都成功後，才正式保存修改。
    await connection.commit();

    return petId;
  } catch (error) {
    // 任一步驟失敗，就把本次修改全部還原。
    await connection.rollback();
    throw error;
  } finally {
    // 將連線還給 pool，否則連線用完後會逐漸耗盡。
    connection.release();
  }
};

/**
 * 軟刪除目前會員的寵物。
 *
 * 不會真的執行 DELETE FROM pets，
 * 只會把 is_deleted 改成 1 並記錄刪除時間。
 */
const softDeletePetData = async (userId, petId) => {
  const sql = `
    UPDATE pets
    SET
      is_deleted = 1,
      deleted_at = CURRENT_TIMESTAMP
    WHERE id = ?
      AND user_id_fk = ?
      AND is_deleted = 0;
  `;

  const [result] = await pool.query(sql, [petId, userId]);

  /**
   * affectedRows：
   * 1 代表成功更新一筆。
   * 0 代表寵物不存在、不屬於會員，或已經被刪除。
   */
  return result.affectedRows > 0;
};

// ===== 寵物檔案管理 routes =====

router.get("/", async (req, res, next) => {
  try {
    const userId = req.currentUser.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "找不到目前登入會員",
      });
    }

    const data = await getPetListData(userId);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/pets/upload-avatar
 *
 * 接收欄位名稱為 avatar 的單一寵物照片。
 * 僅允許 JPG、JPEG、PNG，最大 5MB。
 */
router.post("/upload-avatar", (req, res, next) => {
  petAvatarUpload.single("avatar")(req, res, async (uploadError) => {
    try {
      const userId = req.currentUser.id;

      if (uploadError instanceof multer.MulterError) {
        const message =
          uploadError.code === "LIMIT_FILE_SIZE"
            ? "圖片大小不可超過 5MB"
            : "一次只能上傳一張照片";

        return res.status(400).json({
          success: false,
          message,
        });
      }

      if (uploadError) {
        return res.status(400).json({
          success: false,
          message: "照片上傳失敗",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "請選擇要上傳的照片",
        });
      }

      const extension = getValidPetAvatarExtension(req.file);

      if (!extension) {
        return res.status(400).json({
          success: false,
          message: "只支援 JPG、JPEG、PNG 圖片",
        });
      }

      await mkdir(PET_AVATAR_UPLOAD_DIR, { recursive: true });

      const fileName = `pet-${userId}-${randomUUID()}${extension}`;
      const filePath = path.join(PET_AVATAR_UPLOAD_DIR, fileName);

      await writeFile(filePath, req.file.buffer);

      const avatarUrl = `${req.protocol}://${req.get("host")}/uploads/pets/${fileName}`;

      return res.status(201).json({
        success: true,
        message: "照片上傳成功",
        row: {
          avatarUrl,
        },
      });
    } catch (error) {
      next(error);
    }
  });
});

router.post("/", async (req, res, next) => {
  try {
    const userId = req.currentUser.id;

    const petId = await createPetData(userId, req.body);

    return res.status(201).json({
      success: true,
      message: "新增毛孩成功",
      row: {
        id: petId,
      },
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next(error);
  }
});

/**
 * PUT /api/pets/:petId
 *
 * 更新指定寵物的完整檔案。
 * 例如 PUT /api/pets/18。
 */
router.put("/:petId", async (req, res, next) => {
  try {
    const userId = req.currentUser.id;
    const petId = toPositiveInteger(req.params.petId);

    if (!petId) {
      return res.status(400).json({
        success: false,
        message: "寵物 id 格式不正確",
      });
    }

    await updatePetData(userId, petId, req.body);

    return res.json({
      success: true,
      message: "毛孩資料更新成功",
      row: {
        id: petId,
      },
    });
  } catch (error) {
    // 可預期的表單錯誤或查無資料，直接回傳對應狀態碼。
    if (error.statusCode === 400 || error.statusCode === 404) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    // 其他資料庫或程式錯誤交給專案的統一錯誤處理器。
    next(error);
  }
});

/**
 * DELETE /api/pets/:petId
 *
 * 將指定寵物軟刪除，保留原始資料與多選關聯資料。
 */
router.delete("/:petId", async (req, res, next) => {
  try {
    const userId = req.currentUser.id;
    const petId = toPositiveInteger(req.params.petId);

    if (!petId) {
      return res.status(400).json({
        success: false,
        message: "寵物 id 格式不正確",
      });
    }

    const isDeleted = await softDeletePetData(userId, petId);

    if (!isDeleted) {
      return res.status(404).json({
        success: false,
        message: "找不到可以刪除的寵物資料",
      });
    }

    return res.json({
      success: true,
      message: "毛孩資料已刪除",
      row: {
        id: petId,
      },
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/pets/options
 *
 * 回傳物種、性別、結紮、活動量、健康情況、過敏食材等表單選項。
 * 必須放在 /:petId 前面，否則 Express 會誤把 "options" 當成 petId。
 */
router.get("/options", async (req, res, next) => {
  try {
    const data = await getPetOptionsData();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get("/:petId", async (req, res, next) => {
  try {
    const userId = req.currentUser.id;
    const petId = toPositiveInteger(req.params.petId);

    if (!petId) {
      return res.status(400).json({
        success: false,
        message: "寵物 id 格式不正確",
      });
    }

    const data = await getPetDetailData(petId, userId);

    if (!data.success) {
      return res.status(404).json(data);
    }

    res.json(data);
  } catch (error) {
    next(error);
  }
});

// ===== AI 導購 routes =====
// 之後放 POST /ai/chat。

export default router;
