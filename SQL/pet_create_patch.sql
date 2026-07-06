-- 寵物相關資料表
-- 建議貼到 create.sql：
-- 1. CREATE TABLE 區塊：貼在所有主表建立完成後
-- 2. UNIQUE KEY 區塊：貼在其他 UNIQUE KEY 後
-- 3. FOREIGN KEY 區塊：貼在其他 FOREIGN KEY 後

USE final_team3;

-- 1. 建立資料表
CREATE TABLE `pet_attributes` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `group_name` VARCHAR(50) NOT NULL,
    `group_code` VARCHAR(50) NOT NULL,
    `selection_type` ENUM('single', 'multiple') NOT NULL DEFAULT 'single',
    `is_required` TINYINT NOT NULL DEFAULT 0,
    `is_active` TINYINT NOT NULL DEFAULT 1,
    `is_filter` TINYINT NOT NULL DEFAULT 0,
    `sort` INT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`)
) COMMENT = '寵物屬性群組';

CREATE TABLE `pet_attr_details` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `pet_attr_id_fk` INT NOT NULL,
    `attr_option` VARCHAR(50) NOT NULL,
    `option_code` VARCHAR(50) NOT NULL,
    `sort_order` INT NOT NULL DEFAULT 0,
    PRIMARY KEY (`id`)
) COMMENT = '寵物屬性選項';

CREATE TABLE `pets` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `member_id_fk` INT NOT NULL,
    `pet_name` VARCHAR(50) NOT NULL,
    `avatar_url` VARCHAR(255),
    `species_option_id_fk` INT NOT NULL,
    `breed_text` VARCHAR(100),
    `gender_option_id_fk` INT,
    `neutered_option_id_fk` INT,
    `body_size_option_id_fk` INT,
    `birthday` DATE,
    `weight` DECIMAL(5, 2),
    `special_note` TEXT,
    `is_deleted` TINYINT NOT NULL DEFAULT 0,
    `deleted_at` DATETIME,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) COMMENT = '會員寵物資料';

CREATE TABLE `pet_selected_options` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `pet_id_fk` INT NOT NULL,
    `option_group_id_fk` INT NOT NULL,
    `option_id_fk` INT NOT NULL,
    PRIMARY KEY (`id`)
) COMMENT = '寵物多選屬性關聯表';

CREATE TABLE `pet_ai_logs` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `member_id_fk` INT NOT NULL,
    `pet_id_fk` INT NOT NULL,
    `entry_source` VARCHAR(50) NOT NULL DEFAULT 'pet_dashboard',
    `question` TEXT NOT NULL,
    `answer` TEXT NOT NULL,
    `recommended_product_ids` VARCHAR(255),
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) COMMENT = '寵物 AI 導購問答紀錄';

-- 2. 建立 UNIQUE KEY
ALTER TABLE `pet_attributes`
ADD CONSTRAINT `uq_pet_attributes_group_code` UNIQUE (`group_code`);

ALTER TABLE `pet_attr_details`
ADD CONSTRAINT `uq_pet_attr_details_group_option` UNIQUE (`pet_attr_id_fk`, `option_code`);

ALTER TABLE `pet_selected_options`
ADD CONSTRAINT `uq_pet_selected_option` UNIQUE (`pet_id_fk`, `option_group_id_fk`, `option_id_fk`);

-- 3. 建立 FOREIGN KEY
ALTER TABLE `pet_attr_details`
ADD CONSTRAINT `fk_pet_attr_details_attribute`
FOREIGN KEY (`pet_attr_id_fk`) REFERENCES `pet_attributes` (`id`);

ALTER TABLE `pets`
ADD CONSTRAINT `fk_pets_member`
FOREIGN KEY (`member_id_fk`) REFERENCES `members` (`id`),
ADD CONSTRAINT `fk_pets_species_option`
FOREIGN KEY (`species_option_id_fk`) REFERENCES `pet_attr_details` (`id`),
ADD CONSTRAINT `fk_pets_gender_option`
FOREIGN KEY (`gender_option_id_fk`) REFERENCES `pet_attr_details` (`id`),
ADD CONSTRAINT `fk_pets_neutered_option`
FOREIGN KEY (`neutered_option_id_fk`) REFERENCES `pet_attr_details` (`id`),
ADD CONSTRAINT `fk_pets_body_size_option`
FOREIGN KEY (`body_size_option_id_fk`) REFERENCES `pet_attr_details` (`id`);

ALTER TABLE `pet_selected_options`
ADD CONSTRAINT `fk_pet_selected_options_pet`
FOREIGN KEY (`pet_id_fk`) REFERENCES `pets` (`id`),
ADD CONSTRAINT `fk_pet_selected_options_group`
FOREIGN KEY (`option_group_id_fk`) REFERENCES `pet_attributes` (`id`),
ADD CONSTRAINT `fk_pet_selected_options_option`
FOREIGN KEY (`option_id_fk`) REFERENCES `pet_attr_details` (`id`);

ALTER TABLE `pet_ai_logs`
ADD CONSTRAINT `fk_pet_ai_logs_member`
FOREIGN KEY (`member_id_fk`) REFERENCES `members` (`id`),
ADD CONSTRAINT `fk_pet_ai_logs_pet`
FOREIGN KEY (`pet_id_fk`) REFERENCES `pets` (`id`);
