-- 寵物健康情況與商品特殊標籤對照。
-- 執行順序：
-- 1. create-v2.sql（建立資料表）
-- 2. full-mock-data.sql（建立商品、品項與商品特殊標籤）
-- 3. 寵物選項 seed（建立 pet_attributes、pet_attr_details）
-- 4. 本檔案
--
-- 使用 option_code 與 tag_slug 查找 ID，而不是把 ID 寫死，
-- 因此寵物選項資料的實際 id 即使不同，對照仍能正確建立。
-- 「無特殊狀況」不建立對照，AI 會改採物種、年齡與使用者問題推薦。

USE `final_team3`;

INSERT INTO pet_health_product_tags (
    health_option_id_fk,
    product_special_tag_id_fk
)
SELECT
    health_option.id,
    product_tag.id
FROM (
    SELECT 'skin_sensitive' AS health_option_code, 'skin-care' AS product_tag_slug
    UNION ALL SELECT 'skin_sensitive', 'hypo-allergenic'
    UNION ALL SELECT 'sensitive_stomach', 'digestion-care'
    UNION ALL SELECT 'sensitive_stomach', 'hypo-allergenic'
    UNION ALL SELECT 'hairball', 'hairball-care'
    UNION ALL SELECT 'weight_control', 'low-fat'
    UNION ALL SELECT 'joint_care', 'joint-care'
    UNION ALL SELECT 'dental_care', 'dental-care'
    UNION ALL SELECT 'picky_eater', 'picky-eater'
    UNION ALL SELECT 'urinary_care', 'urinary-care'
    UNION ALL SELECT 'stress_anxiety', 'stress-care'
    UNION ALL SELECT 'eye_care', 'eye-care'
) AS mapping
JOIN pet_attributes AS health_group
    ON health_group.group_code = 'health_condition'
JOIN pet_attr_details AS health_option
    ON health_option.pet_attr_id_fk = health_group.id
    AND health_option.option_code = mapping.health_option_code
JOIN product_special_tags AS product_tag
    ON product_tag.tag_slug = mapping.product_tag_slug
-- 如果同一組「健康選項 + 商品標籤」已經存在，就不再插入第二筆。
-- 這裡不用 ON DUPLICATE KEY，因為目前此表沒有複合 UNIQUE KEY；
-- 改由 NOT EXISTS 明確檢查既有資料，也避免多張表都有 id 時的欄位歧義錯誤。
WHERE NOT EXISTS (
    SELECT 1
    FROM pet_health_product_tags AS existing_mapping
    WHERE existing_mapping.health_option_id_fk = health_option.id
      AND existing_mapping.product_special_tag_id_fk = product_tag.id
);
