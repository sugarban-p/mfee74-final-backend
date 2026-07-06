-- 商品品項特殊標籤 seed
-- 匯入順序建議：
-- 1. create_with_pets.sql 或 create.sql
-- 2. products.sql
-- 3. product_item_tags.sql
-- 4. pets.sql
--
-- 說明：
-- product_special_tags 目前使用 tag_slug 作為對應依據。
-- 這份檔案把既有 items 大致貼上 tag，讓寵物 AI 導購可以用
-- pet_attr_details.option_code -> product_special_tags.tag_slug 找候選商品。

USE final_team3;

-- 貼標小工具寫法：
-- 用 sku 找 item，用 tag_slug 找 product_special_tags，再寫入 item_tags。
-- INSERT IGNORE 可避免重複匯入時撞到 uq_item_tag。

-- 年齡 / 生命階段
INSERT IGNORE INTO `item_tags` (`item_id_fk`, `tag_id_fk`)
SELECT i.id, pst.id
FROM `items` i
JOIN `product_special_tags` pst ON pst.tag_slug = 'young'
WHERE i.sku IN (
    'CTMF011005',
    'CTMF032010',
    'CTMF032011',
    'CTMF032012',
    'CTMF032013',
    'CTMF035015',
    'CTMF036003',
    'CTMF036004',
    'DGMF050005',
    'DGMF050006'
);

INSERT IGNORE INTO `item_tags` (`item_id_fk`, `tag_id_fk`)
SELECT i.id, pst.id
FROM `items` i
JOIN `product_special_tags` pst ON pst.tag_slug = 'senior'
WHERE i.sku IN (
    'CTMF030003',
    'CTMF030004',
    'CTMF030005',
    'DGMF049005',
    'DGMF049006',
    'DGMF049007',
    'DGMF049008'
);

INSERT IGNORE INTO `item_tags` (`item_id_fk`, `tag_id_fk`)
SELECT i.id, pst.id
FROM `items` i
JOIN `product_special_tags` pst ON pst.tag_slug = 'mom-care'
WHERE i.sku IN (
    'CTMF032010',
    'CTMF032011',
    'CTMF032012',
    'CTMF032013',
    'CTMF036003',
    'CTMF036004',
    'DGMF050005',
    'DGMF050006'
);

-- 皮膚 / 毛髮 / 低敏
INSERT IGNORE INTO `item_tags` (`item_id_fk`, `tag_id_fk`)
SELECT i.id, pst.id
FROM `items` i
JOIN `product_special_tags` pst ON pst.tag_slug = 'skin-care'
WHERE i.sku IN (
    'CTMF004007',
    'DGSP046001'
);

INSERT IGNORE INTO `item_tags` (`item_id_fk`, `tag_id_fk`)
SELECT i.id, pst.id
FROM `items` i
JOIN `product_special_tags` pst ON pst.tag_slug = 'coat-care'
WHERE i.sku IN (
    'CTMF004007',
    'DGSP046001'
);

INSERT IGNORE INTO `item_tags` (`item_id_fk`, `tag_id_fk`)
SELECT i.id, pst.id
FROM `items` i
JOIN `product_special_tags` pst ON pst.tag_slug = 'hypoallergenic'
WHERE i.sku IN (
    'CTMF008014',
    'CTMF010012',
    'CTMF011002',
    'CTMF034012',
    'DGMF054003',
    'DGMF054004',
    'DGMF054005',
    'DGMF054006',
    'DGMF054007',
    'DGMF054008'
);

-- 腸胃 / 好消化
INSERT IGNORE INTO `item_tags` (`item_id_fk`, `tag_id_fk`)
SELECT i.id, pst.id
FROM `items` i
JOIN `product_special_tags` pst ON pst.tag_slug = 'stomach-care'
WHERE i.sku IN (
    'CTMF004006',
    'CTMF010011',
    'CTMF010012',
    'CTMF010013',
    'CTMF010014',
    'CTMF010015',
    'CTMF010016',
    'CTMF032010',
    'CTMF032011',
    'CTMF032012',
    'CTMF032013',
    'DGMF050005',
    'DGMF050006'
);

-- 化毛 / 毛球 / 貓草
INSERT IGNORE INTO `item_tags` (`item_id_fk`, `tag_id_fk`)
SELECT i.id, pst.id
FROM `items` i
JOIN `product_special_tags` pst ON pst.tag_slug = 'hairball-care'
WHERE i.sku IN (
    'CTTT038001'
);

-- 體重控制
INSERT IGNORE INTO `item_tags` (`item_id_fk`, `tag_id_fk`)
SELECT i.id, pst.id
FROM `items` i
JOIN `product_special_tags` pst ON pst.tag_slug = 'weight-control'
WHERE i.sku IN (
    'CTMF024003',
    'CTMF024004',
    'CTMF024006',
    'CTMF024007'
);

-- 關節 / 熟齡照護
INSERT IGNORE INTO `item_tags` (`item_id_fk`, `tag_id_fk`)
SELECT i.id, pst.id
FROM `items` i
JOIN `product_special_tags` pst ON pst.tag_slug = 'joint-care'
WHERE i.sku IN (
    'CTMF030003',
    'CTMF030004',
    'CTMF030005',
    'DGMF049005',
    'DGMF049006',
    'DGMF049007',
    'DGMF049008'
);

-- 牙齒 / 潔牙
INSERT IGNORE INTO `item_tags` (`item_id_fk`, `tag_id_fk`)
SELECT i.id, pst.id
FROM `items` i
JOIN `product_special_tags` pst ON pst.tag_slug = 'dental-care'
WHERE i.sku IN (
    'CTTT031003'
);

-- 挑食 / 適口性
INSERT IGNORE INTO `item_tags` (`item_id_fk`, `tag_id_fk`)
SELECT i.id, pst.id
FROM `items` i
JOIN `product_special_tags` pst ON pst.tag_slug = 'picky-eater'
WHERE i.sku IN (
    'CTMF027007',
    'CTMF027008',
    'CTMF027009',
    'CTMF034012',
    'CTMF034013',
    'CTMF034014',
    'CTMF034015',
    'CTMF034016',
    'CTMF034017',
    'CTMF034018',
    'DGMF051001',
    'DGMF051002',
    'DGMF052006',
    'DGMF052007',
    'DGMF052008',
    'DGMF052009'
);

-- 泌尿 / 補水 / 低磷低鎂相關
INSERT IGNORE INTO `item_tags` (`item_id_fk`, `tag_id_fk`)
SELECT i.id, pst.id
FROM `items` i
JOIN `product_special_tags` pst ON pst.tag_slug = 'urinary-care'
WHERE i.sku IN (
    'CTMF004009',
    'CTSP012003',
    'CTSM015003',
    'CTSM015004',
    'CTSM015005'
);

INSERT IGNORE INTO `item_tags` (`item_id_fk`, `tag_id_fk`)
SELECT i.id, pst.id
FROM `items` i
JOIN `product_special_tags` pst ON pst.tag_slug = 'hydration'
WHERE i.sku IN (
    'CTMF004006',
    'CTMF004007',
    'CTMF004008',
    'CTMF004009',
    'CTMF008007',
    'CTMF008008',
    'CTMF008010',
    'CTMF008011',
    'CTMF008012',
    'CTMF008013',
    'CTMF008014',
    'CTMF008015',
    'CTMF026003',
    'CTSM015003',
    'CTSM015004',
    'CTSM015005'
);

-- 情緒安撫 / 壓力
INSERT IGNORE INTO `item_tags` (`item_id_fk`, `tag_id_fk`)
SELECT i.id, pst.id
FROM `items` i
JOIN `product_special_tags` pst ON pst.tag_slug = 'stress-care'
WHERE i.sku IN (
    'CTSP025001',
    'CTSP025002',
    'CTSP025003',
    'CTTT031004',
    'CTTT031005',
    'CTTT037001'
);

-- 眼睛 / 眼鼻照護
INSERT IGNORE INTO `item_tags` (`item_id_fk`, `tag_id_fk`)
SELECT i.id, pst.id
FROM `items` i
JOIN `product_special_tags` pst ON pst.tag_slug = 'eye-care'
WHERE i.sku IN (
    'CTSM033001'
);
