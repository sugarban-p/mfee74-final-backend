-- Functionality: create knowledge base table for AI retrieval.
-- Purpose: store FAQ, policy, and product documents in one searchable source.

CREATE TABLE IF NOT EXISTS `ai_knowledge_docs` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `doc_key` VARCHAR(120) NOT NULL,
    `source_type` ENUM('FAQ', 'POLICY', 'PRODUCT') NOT NULL,
    `source_system` VARCHAR(40) NOT NULL DEFAULT 'db',
    `source_table` VARCHAR(64) DEFAULT NULL,
    `source_pk` VARCHAR(120) DEFAULT NULL,
    `title` VARCHAR(255) NOT NULL,
    `summary` TEXT DEFAULT NULL,
    `content` MEDIUMTEXT NOT NULL,
    `content_hash` CHAR(40) NOT NULL,
    `source_url` VARCHAR(500) DEFAULT NULL,
    `locale` VARCHAR(10) NOT NULL DEFAULT 'zh-TW',
    `tags_json` JSON DEFAULT NULL,
    `metadata_json` JSON DEFAULT NULL,
    `priority` INT NOT NULL DEFAULT 100,
    `retrieval_weight` DECIMAL(6, 3) NOT NULL DEFAULT 1.000,
    `freshness_score` DECIMAL(5, 2) NOT NULL DEFAULT 1.00,
    `effective_from` DATETIME DEFAULT NULL,
    `effective_to` DATETIME DEFAULT NULL,
    `published_at` DATETIME DEFAULT NULL,
    `last_synced_at` DATETIME DEFAULT NULL,
    `version_no` INT NOT NULL DEFAULT 1,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uq_ai_knowledge_doc_key` (`doc_key`),
    KEY `idx_ai_knowledge_source_ref` (`source_table`, `source_pk`),
    KEY `idx_ai_knowledge_locale` (`locale`),
    KEY `idx_ai_knowledge_priority` (`priority`),
    KEY `idx_ai_knowledge_weight` (`retrieval_weight`),
    KEY `idx_ai_knowledge_source_type` (`source_type`),
    KEY `idx_ai_knowledge_is_active` (`is_active`),
    KEY `idx_ai_knowledge_updated_at` (`updated_at`),
    KEY `idx_ai_knowledge_last_synced_at` (`last_synced_at`),
    FULLTEXT KEY `ft_ai_knowledge_text` (`title`, `summary`, `content`)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- Existing environments with an older table definition can run:
-- pnpm run knowledge:sync
-- The sync script performs schema upgrades safely by checking columns/indexes first.