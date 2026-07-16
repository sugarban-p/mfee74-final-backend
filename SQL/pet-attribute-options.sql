-- 寵物表單選項 seed。
-- 前提：已執行 create-v2.sql 與 member-mock-data-only.sql。
-- 這些 option_code 會被 API 與 pet-health-product-tags.sql 使用，
-- 因此前台顯示文字與資料庫選項集中在此管理。

USE `final_team3`;

START TRANSACTION;

-- 選項群組：single 代表 pets 表的單選欄位；multiple 代表 pet_selected_options。
INSERT INTO pet_attributes (
    id,
    group_name,
    group_code,
    selection_type,
    is_required,
    is_active,
    is_filter,
    sort
)
VALUES
    (1, '物種', 'species', 'single', 1, 1, 1, 1),
    (2, '性別', 'gender', 'single', 0, 1, 1, 2),
    (3, '結紮狀態', 'neutered', 'single', 0, 1, 1, 3),
    (4, '活動量', 'activity_level', 'single', 0, 1, 1, 4),
    (5, '健康情況', 'health_condition', 'multiple', 1, 1, 1, 5),
    (6, '過敏食材', 'allergy_ingredient', 'multiple', 1, 1, 1, 6);

-- option_code 是程式使用的穩定值；attr_option 是提供前台顯示的中文文字。
INSERT INTO pet_attr_details (
    id,
    pet_attr_id_fk,
    attr_option,
    option_code,
    sort_order
)
VALUES
    -- 物種
    (1, 1, '狗狗', 'dog', 1),
    (2, 1, '貓咪', 'cat', 2),

    -- 性別
    (3, 2, '男生', 'male', 1),
    (4, 2, '女生', 'female', 2),
    (5, 2, '未知', 'unknown', 3),

    -- 結紮狀態
    (6, 3, '已結紮', 'neutered', 1),
    (7, 3, '未結紮', 'not_neutered', 2),
    (8, 3, '不確定', 'unknown', 3),

    -- 活動量
    (9, 4, '低', 'low', 1),
    (10, 4, '中', 'medium', 2),
    (11, 4, '高', 'high', 3),

    -- 健康情況：已移除容易掉毛 shedding。
    (12, 5, '皮膚敏感', 'skin_sensitive', 1),
    (13, 5, '腸胃敏感', 'sensitive_stomach', 2),
    (14, 5, '毛球困擾', 'hairball', 3),
    (15, 5, '體重控制', 'weight_control', 4),
    (16, 5, '關節保健', 'joint_care', 5),
    (17, 5, '牙齒保健', 'dental_care', 6),
    (18, 5, '挑食', 'picky_eater', 7),
    (19, 5, '泌尿道保健', 'urinary_care', 8),
    (20, 5, '情緒緊張 / 壓力', 'stress_anxiety', 9),
    (21, 5, '眼睛保健', 'eye_care', 10),
    (22, 5, '無特殊狀況', 'none', 11),

    -- 過敏食材：只保留目前商品 mock 有可追蹤 keyword 的成分。
    (23, 6, '雞肉', 'chicken', 1),
    (24, 6, '火雞', 'turkey', 2),
    (25, 6, '牛肉', 'beef', 3),
    (26, 6, '魚肉', 'fish', 4),
    (27, 6, '羊肉', 'lamb', 5),
    (28, 6, '鴨肉', 'duck', 6),
    (29, 6, '鹿肉', 'venison', 7),
    (30, 6, '鵪鶉', 'quail', 8),
    (31, 6, '鵝肉', 'goose', 9),
    (32, 6, '蝦類', 'shrimp', 10),
    (33, 6, '貝類', 'scallop', 11),
    (34, 6, '蛋', 'egg', 12),
    (35, 6, '無', 'none', 13);

COMMIT;
