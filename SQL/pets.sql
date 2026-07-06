-- 寵物 MVP 假資料
-- 匯入順序建議：
-- 1. create.sql
-- 2. products.sql
-- 3. pets.sql

USE final_team3;

-- 如果會員組還沒有提供 seed，先建立寵物假資料需要用到的測試會員。
-- 若正式會員資料已存在，可刪掉這段或改成對應的 member id。
INSERT INTO `members` (`id`, `name`)
VALUES
    (1, '測試會員一'),
    (2, '測試會員二'),
    (3, '測試會員三')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 寵物屬性群組
INSERT INTO
    `pet_attributes` (
        `group_name`,
        `group_code`,
        `selection_type`,
        `is_required`,
        `is_active`,
        `is_filter`,
        `sort`
    )
VALUES
    ('物種', 'species', 'single', 1, 1, 1, 1),
    ('性別', 'gender', 'single', 0, 1, 0, 2),
    ('是否結紮', 'neutered', 'single', 0, 1, 0, 3),
    ('體型', 'body_size', 'single', 0, 1, 1, 4),
    ('健康 / 照護需求', 'health_condition', 'multiple', 0, 1, 1, 5);

-- 寵物屬性選項
INSERT INTO
    `pet_attr_details` (
        `pet_attr_id_fk`,
        `attr_option`,
        `option_code`,
        `sort_order`
    )
VALUES
    ((SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'species'), '狗', 'dog', 1),
    ((SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'species'), '貓', 'cat', 2),

    ((SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'gender'), '男生', 'male', 1),
    ((SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'gender'), '女生', 'female', 2),
    ((SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'gender'), '未知', 'unknown', 3),

    ((SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'neutered'), '已結紮', 'neutered', 1),
    ((SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'neutered'), '未結紮', 'not_neutered', 2),
    ((SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'neutered'), '不確定', 'unknown', 3),

    ((SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'body_size'), '小型', 'small', 1),
    ((SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'body_size'), '中型', 'medium', 2),
    ((SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'body_size'), '大型', 'large', 3),
    ((SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'body_size'), '不確定', 'unknown', 4),

    ((SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'health_condition'), '皮膚敏感', 'skin_sensitive', 1),
    ((SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'health_condition'), '腸胃敏感', 'sensitive_stomach', 2),
    ((SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'health_condition'), '容易掉毛', 'shedding', 3),
    ((SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'health_condition'), '毛球困擾', 'hairball', 4),
    ((SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'health_condition'), '體重控制', 'weight_control', 5),
    ((SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'health_condition'), '關節保健', 'joint_care', 6),
    ((SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'health_condition'), '牙齒保健', 'dental_care', 7),
    ((SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'health_condition'), '挑食', 'picky_eater', 8),
    ((SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'health_condition'), '泌尿道保健', 'urinary_care', 9),
    ((SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'health_condition'), '情緒緊張 / 壓力', 'stress_anxiety', 10),
    ((SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'health_condition'), '眼睛保健', 'eye_care', 11),
    ((SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'health_condition'), '無特殊狀況', 'none', 12);

-- 寵物資料：5 筆 MVP 假資料
INSERT INTO
    `pets` (
        `member_id_fk`,
        `pet_name`,
        `avatar_url`,
        `species_option_id_fk`,
        `breed_text`,
        `gender_option_id_fk`,
        `neutered_option_id_fk`,
        `body_size_option_id_fk`,
        `birthday`,
        `weight`,
        `special_note`
    )
VALUES
    (
        1,
        'Momo',
        NULL,
        (SELECT `id` FROM `pet_attr_details` WHERE `option_code` = 'cat' AND `pet_attr_id_fk` = (SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'species')),
        '米克斯',
        (SELECT `id` FROM `pet_attr_details` WHERE `option_code` = 'female' AND `pet_attr_id_fk` = (SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'gender')),
        (SELECT `id` FROM `pet_attr_details` WHERE `option_code` = 'neutered' AND `pet_attr_id_fk` = (SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'neutered')),
        (SELECT `id` FROM `pet_attr_details` WHERE `option_code` = 'small' AND `pet_attr_id_fk` = (SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'body_size')),
        '2020-05-12',
        4.80,
        '不太愛喝水，喜歡濕食'
    ),
    (
        1,
        'Cookie',
        NULL,
        (SELECT `id` FROM `pet_attr_details` WHERE `option_code` = 'dog' AND `pet_attr_id_fk` = (SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'species')),
        '柴犬',
        (SELECT `id` FROM `pet_attr_details` WHERE `option_code` = 'male' AND `pet_attr_id_fk` = (SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'gender')),
        (SELECT `id` FROM `pet_attr_details` WHERE `option_code` = 'not_neutered' AND `pet_attr_id_fk` = (SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'neutered')),
        (SELECT `id` FROM `pet_attr_details` WHERE `option_code` = 'medium' AND `pet_attr_id_fk` = (SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'body_size')),
        '2023-09-20',
        8.20,
        '偶爾挑食，喜歡肉香重的食物'
    ),
    (
        2,
        'Nana',
        NULL,
        (SELECT `id` FROM `pet_attr_details` WHERE `option_code` = 'cat' AND `pet_attr_id_fk` = (SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'species')),
        '英短',
        (SELECT `id` FROM `pet_attr_details` WHERE `option_code` = 'female' AND `pet_attr_id_fk` = (SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'gender')),
        (SELECT `id` FROM `pet_attr_details` WHERE `option_code` = 'neutered' AND `pet_attr_id_fk` = (SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'neutered')),
        (SELECT `id` FROM `pet_attr_details` WHERE `option_code` = 'small' AND `pet_attr_id_fk` = (SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'body_size')),
        '2015-03-08',
        5.60,
        '熟齡貓，活動量較低'
    ),
    (
        2,
        'Lucky',
        NULL,
        (SELECT `id` FROM `pet_attr_details` WHERE `option_code` = 'dog' AND `pet_attr_id_fk` = (SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'species')),
        '米克斯',
        (SELECT `id` FROM `pet_attr_details` WHERE `option_code` = 'male' AND `pet_attr_id_fk` = (SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'gender')),
        (SELECT `id` FROM `pet_attr_details` WHERE `option_code` = 'neutered' AND `pet_attr_id_fk` = (SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'neutered')),
        (SELECT `id` FROM `pet_attr_details` WHERE `option_code` = 'large' AND `pet_attr_id_fk` = (SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'body_size')),
        '2018-11-01',
        24.50,
        '需要控制體重，散步時容易爆衝'
    ),
    (
        3,
        'Bibi',
        NULL,
        (SELECT `id` FROM `pet_attr_details` WHERE `option_code` = 'cat' AND `pet_attr_id_fk` = (SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'species')),
        '布偶貓',
        (SELECT `id` FROM `pet_attr_details` WHERE `option_code` = 'unknown' AND `pet_attr_id_fk` = (SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'gender')),
        (SELECT `id` FROM `pet_attr_details` WHERE `option_code` = 'unknown' AND `pet_attr_id_fk` = (SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'neutered')),
        (SELECT `id` FROM `pet_attr_details` WHERE `option_code` = 'medium' AND `pet_attr_id_fk` = (SELECT `id` FROM `pet_attributes` WHERE `group_code` = 'body_size')),
        '2024-12-15',
        2.10,
        '幼貓，食量不穩定'
    );

-- 多選健康 / 照護需求
INSERT INTO
    `pet_selected_options` (
        `pet_id_fk`,
        `option_group_id_fk`,
        `option_id_fk`
    )
SELECT p.id, pa.id, pad.id
FROM `pets` p
JOIN `pet_attributes` pa ON pa.group_code = 'health_condition'
JOIN `pet_attr_details` pad ON pad.pet_attr_id_fk = pa.id
WHERE p.pet_name = 'Momo'
  AND pad.option_code IN ('urinary_care', 'sensitive_stomach')
UNION ALL
SELECT p.id, pa.id, pad.id
FROM `pets` p
JOIN `pet_attributes` pa ON pa.group_code = 'health_condition'
JOIN `pet_attr_details` pad ON pad.pet_attr_id_fk = pa.id
WHERE p.pet_name = 'Cookie'
  AND pad.option_code IN ('picky_eater', 'sensitive_stomach')
UNION ALL
SELECT p.id, pa.id, pad.id
FROM `pets` p
JOIN `pet_attributes` pa ON pa.group_code = 'health_condition'
JOIN `pet_attr_details` pad ON pad.pet_attr_id_fk = pa.id
WHERE p.pet_name = 'Nana'
  AND pad.option_code IN ('hairball', 'joint_care')
UNION ALL
SELECT p.id, pa.id, pad.id
FROM `pets` p
JOIN `pet_attributes` pa ON pa.group_code = 'health_condition'
JOIN `pet_attr_details` pad ON pad.pet_attr_id_fk = pa.id
WHERE p.pet_name = 'Lucky'
  AND pad.option_code IN ('weight_control', 'dental_care')
UNION ALL
SELECT p.id, pa.id, pad.id
FROM `pets` p
JOIN `pet_attributes` pa ON pa.group_code = 'health_condition'
JOIN `pet_attr_details` pad ON pad.pet_attr_id_fk = pa.id
WHERE p.pet_name = 'Bibi'
  AND pad.option_code IN ('none');

-- 寵物需求 option_code 對產品 product_special_tags.tag_slug 的後端 mapping 建議：
-- skin_sensitive    -> skin-care, hypoallergenic
-- sensitive_stomach -> stomach-care, hypoallergenic
-- shedding          -> coat-care
-- hairball          -> hairball-care
-- weight_control    -> weight-control
-- joint_care        -> joint-care
-- dental_care       -> dental-care
-- picky_eater       -> picky-eater
-- urinary_care      -> urinary-care, hydration
-- stress_anxiety    -> stress-care
-- eye_care          -> eye-care
-- none              -> adult
--
-- 年齡由 pets.birthday 計算：
-- 0 ~ 未滿 1 歲 -> young
-- 1 ~ 未滿 7 歲 -> adult
-- 7 歲以上      -> senior
