-- 寵物假資料 seed：10 位會員、17 隻寵物。
-- 會員分布：
-- - user 1~5：各 1 隻
-- - user 6~8：各 2 隻
-- - user 9~10：各 3 隻
--
-- 前提：
-- 1. create-v2.sql
-- 2. member-mock-data-only.sql
-- 3. full-mock-data.sql
-- 4. pet-attribute-options.sql
-- 5. pet-health-product-tags.sql

USE `final_team3`;

START TRANSACTION;

-- pets 儲存單選資料：物種、性別、結紮狀態、活動量。
INSERT INTO pets (
    id,
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
VALUES
    (1, 1, 'Momo', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80', 2, '米克斯', 4, 6, 10, '2020-05-11', 4.80, '不太愛喝水，換飼料時需要慢慢轉換。'),
    (2, 2, 'Cookie', 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80', 1, '柴犬', 3, 7, 11, '2023-09-19', 8.20, '活力旺盛，喜歡肉香重的食物。'),
    (3, 3, 'Nini', 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=600&q=80', 2, '英國短毛貓', 3, 6, 9, '2021-03-08', 5.10, '換季時毛球狀況較明顯。'),
    (4, 4, 'Kumo', 'https://images.unsplash.com/photo-1583511655826-05700d52f4d9?auto=format&fit=crop&w=600&q=80', 1, '比熊犬', 4, 6, 10, '2022-07-22', 6.40, '腸胃比較敏感，避免快速換食。'),
    (5, 5, 'Mochi', 'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?auto=format&fit=crop&w=600&q=80', 2, '美國短毛貓', 4, 6, 10, '2018-11-02', 5.90, '熟齡後活動量下降，需留意關節照護。'),
    (6, 6, 'Toto', 'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?auto=format&fit=crop&w=600&q=80', 2, '橘貓', 3, 6, 10, '2022-01-15', 5.30, '很愛舔毛，日常需注意排毛。'),
    (7, 6, 'Bobo', 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=600&q=80', 1, '柯基犬', 4, 6, 11, '2021-06-30', 11.20, '皮膚偶爾發癢，洗澡後需要保濕。'),
    (8, 7, 'Yuki', 'https://images.unsplash.com/photo-1513245543132-31f507417b26?auto=format&fit=crop&w=600&q=80', 2, '挪威森林貓', 4, 6, 10, '2020-08-17', 5.70, '喜歡啃咬玩具，日常可搭配潔牙用品。'),
    (9, 7, 'Ares', 'https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=600&q=80', 2, '布偶貓', 3, 6, 9, '2019-12-25', 6.10, '飲水量偏少，需持續留意泌尿健康。'),
    (10, 8, 'Nori', 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80', 1, '米克斯犬', 4, 6, 10, '2022-04-10', 12.40, '腸胃敏感，偏好容易消化的配方。'),
    (11, 8, 'Pudding', 'https://images.unsplash.com/photo-1494256997604-768d1f608cac?auto=format&fit=crop&w=600&q=80', 2, '波斯貓', 4, 6, 9, '2021-09-04', 4.30, '需定期補充眼鼻照護營養。'),
    (12, 9, 'Sora', 'https://images.unsplash.com/photo-1511044568932-338cba0ad803?auto=format&fit=crop&w=600&q=80', 2, '暹羅貓', 3, 6, 9, '2020-02-18', 4.60, '對環境變化較敏感，搬家或外出時容易緊張。'),
    (13, 9, 'Dodo', 'https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=600&q=80', 1, '拉布拉多', 3, 7, 11, '2023-01-05', 23.80, '食慾良好，日常維持規律運動。'),
    (14, 9, 'Mugi', 'https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?auto=format&fit=crop&w=600&q=80', 2, '曼赤肯', 4, 6, 10, '2021-05-26', 5.80, '體態偏圓，需控制每日熱量攝取。'),
    (15, 10, 'Dango', 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=600&q=80', 1, '貴賓犬', 4, 6, 10, '2022-10-12', 4.90, '皮膚與腸胃都比較敏感。'),
    (16, 10, 'Coco', 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=600&q=80', 2, '孟加拉貓', 3, 6, 11, '2021-07-09', 5.20, '對食物口味較挑剔，偏好肉香明顯的主食。'),
    (17, 10, 'Taro', 'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&w=600&q=80', 2, '米克斯', 3, 6, 9, '2023-03-14', 4.10, '目前沒有特殊照護需求。');

-- pet_selected_options 儲存多選資料。
-- option_group_id_fk = 5 是健康情況；6 是過敏食材。
INSERT INTO pet_selected_options (
    pet_id_fk,
    option_group_id_fk,
    option_id_fk
)
VALUES
    -- Momo：皮膚敏感、挑食；雞肉過敏
    (1, 5, 12), (1, 5, 18), (1, 6, 23),

    -- Cookie：皮膚敏感；牛肉過敏
    (2, 5, 12), (2, 6, 25),

    -- Nini：毛球、腸胃敏感；魚肉過敏
    (3, 5, 14), (3, 5, 13), (3, 6, 26),

    -- Kumo：腸胃敏感；雞肉過敏
    (4, 5, 13), (4, 6, 23),

    -- Mochi：關節保健；無過敏
    (5, 5, 16), (5, 6, 35),

    -- Toto：毛球困擾；無過敏
    (6, 5, 14), (6, 6, 35),

    -- Bobo：皮膚敏感；牛肉過敏
    (7, 5, 12), (7, 6, 25),

    -- Yuki：牙齒保健；火雞過敏
    (8, 5, 17), (8, 6, 24),

    -- Ares：泌尿道保健；魚肉過敏
    (9, 5, 19), (9, 6, 26),

    -- Nori：腸胃敏感；魚肉過敏
    (10, 5, 13), (10, 6, 26),

    -- Pudding：眼睛保健；無過敏
    (11, 5, 21), (11, 6, 35),

    -- Sora：情緒緊張；雞肉過敏
    (12, 5, 20), (12, 6, 23),

    -- Dodo：無特殊狀況；羊肉過敏
    (13, 5, 22), (13, 6, 27),

    -- Mugi：體重控制；魚肉過敏
    (14, 5, 15), (14, 6, 26),

    -- Dango：皮膚與腸胃敏感；雞肉過敏
    (15, 5, 12), (15, 5, 13), (15, 6, 23),

    -- Coco：挑食；牛肉過敏
    (16, 5, 18), (16, 6, 25),

    -- Taro：無特殊狀況；無過敏
    (17, 5, 22), (17, 6, 35);

COMMIT;
