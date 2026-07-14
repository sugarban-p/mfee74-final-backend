// 寵物管理 API

import { Router } from "express";
import pool from "../utils/connect-mysql.js";

const router = Router();

// ===== 共用設定 =====
// 會員系統還沒接好，先固定 member_id_fk = 1；接登入後改成 req.session.member.id。
const TEMP_MEMBER_ID = 1;

// ===== 查詢 helper =====
const getPetListData = async () => {
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
    WHERE p.member_id_fk = ?
      AND p.is_deleted = 0
    ORDER BY p.id ASC;
  `;

  /**
   * pool.query(sql, [TEMP_MEMBER_ID])
   * [TEMP_MEMBER_ID] 會依序放進 SQL 裡的 ?。
   * 這樣不用字串拼接，比較不容易出 SQL injection。
   */
  const [rows] = await pool.query(sql, [TEMP_MEMBER_ID]);

  /**
   * success 不是資料庫欄位，是 API 自己包的狀態。
   * rows 才是真正查出來的寵物資料陣列。
   */
  return {
    success: true,
    rows,
  };
};

const getPetDetailData = async (petId) => {
  /**
   * 查單一寵物基本資料。
   *
   * petId 來自網址：
   * GET /api/pets/1
   *
   * TEMP_MEMBER_ID 是為了避免會員 A 看到會員 B 的寵物。
   */
  const petSql = `
    SELECT
      p.id,
      p.pet_name AS name,
      p.avatar_url AS avatarUrl,
      species.attr_option AS species,
      p.breed_text AS breed,
      gender.attr_option AS gender,
      neutered.attr_option AS neutered,
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
    WHERE p.id = ?
      AND p.member_id_fk = ?
      AND p.is_deleted = 0
    LIMIT 1;
  `;

  const [petRows] = await pool.query(petSql, [petId, TEMP_MEMBER_ID]);
  const pet = petRows[0];

  if (!pet) {
    return {
      success: false,
      message: "找不到寵物資料",
      row: null,
    };
  }

  /**
   * 查健康情況多選資料。
   *
   * 健康情況存在 pet_selected_options，
   * 再 JOIN pet_attr_details 轉成中文 label。
   */
  const healthSql = `
    SELECT
      pad.attr_option AS label
    FROM pet_selected_options pso
    JOIN pet_attributes pa
      ON pa.id = pso.option_group_id_fk
    JOIN pet_attr_details pad
      ON pad.id = pso.option_id_fk
    WHERE pso.pet_id_fk = ?
      AND pa.group_code = 'health_condition'
    ORDER BY pad.sort_order ASC;
  `;

  const [healthRows] = await pool.query(healthSql, [petId]);

  return {
    success: true,
    row: {
      ...pet,
      healthConditions: healthRows.map((item) => item.label),
    },
  };
};

// ===== 寵物檔案管理 routes =====

router.get("/", async (req, res) => {
  const data = await getPetListData();
  res.json(data);
});

router.post("/", async (req, res) => {
  const {
    name,
    speciesOptionId,
    breed,
    genderOptionId,
    neuteredOptionId,
    bodySizeOptionId,
    birthday,
    weight,
    specialNote,
    healthConditionOptionIds = [],
  } = req.body;

  /**
   * 最基本的後端驗證。
   * 前端 required 只是使用者體驗，
   * 後端還是要擋一次，因為 API 可能被 Postman 或其他地方直接打。
   */
  if (!name || !speciesOptionId) {
    return res.status(400).json({
      success: false,
      message: "寵物名稱與物種為必填",
    });
  }

  res.json({
    success: true,
    message: "POST /api/pets route 已接到資料",
    body: req.body,
  });
});

router.get("/:petId", async (req, res) => {
  const { petId } = req.params;
  const data = await getPetDetailData(petId);

  if (!data.success) {
    return res.status(404).json(data);
  }

  res.json(data);
});

// ===== AI 導購 routes =====
// 之後放 POST /ai/chat。

export default router;
