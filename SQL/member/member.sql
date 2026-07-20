DROP DATABASE IF EXISTS mofu_data;

CREATE DATABASE mofu_data CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE mofu_data;

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_no VARCHAR(30) NOT NULL,
    email VARCHAR(191) NOT NULL,
    password_hash VARCHAR(255),
    name VARCHAR(120),
    nickname VARCHAR(120),
    phone VARCHAR(30),
    address VARCHAR(255),
    avatar VARCHAR(255),
    status ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified_at DATETIME NULL,
    login_attempts INT NOT NULL DEFAULT 0,
    locked_until DATETIME NULL,
    last_login_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB;

CREATE INDEX idx_users_status ON users (status);

CREATE INDEX idx_users_created ON users (created_at);

CREATE TABLE user_oauth_accounts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    provider ENUM('GOOGLE') NOT NULL,
    provider_user_id VARCHAR(191) NOT NULL,
    provider_email VARCHAR(191),
    provider_name VARCHAR(120),
    provider_avatar VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB;

CREATE INDEX idx_oauth_user ON user_oauth_accounts (user_id);

CREATE TABLE sessions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    access_token_hash CHAR(64) NOT NULL,
    refresh_token_hash CHAR(64) NOT NULL,
    user_agent VARCHAR(255),
    ip VARCHAR(64),
    device_name VARCHAR(100),
    expires_at DATETIME NOT NULL,
    revoked_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

CREATE INDEX idx_sessions_user ON sessions (user_id);

CREATE INDEX idx_sessions_expire ON sessions (expires_at);

CREATE TABLE otp_codes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    code_hash CHAR(64) NOT NULL,
    type ENUM(
        'EMAIL_VERIFY',
        'FORGOT_PASSWORD'
    ) NOT NULL,
    expires_at DATETIME NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    attempts INT DEFAULT 0,
    send_count INT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

CREATE INDEX idx_otp_search
ON otp_codes(
    user_id,
    type,
    used
);

CREATE TABLE login_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    email VARCHAR(191),
    method ENUM('PASSWORD', 'GOOGLE') DEFAULT 'PASSWORD',
    ip VARCHAR(64),
    country VARCHAR(100),
    city VARCHAR(100),
    user_agent VARCHAR(255),
    browser VARCHAR(120),
    os VARCHAR(120),
    device VARCHAR(120),
    success BOOLEAN NOT NULL,
    reason VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

CREATE INDEX idx_login_user_time ON login_logs (user_id, created_at);

CREATE TABLE chat_consultations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_no VARCHAR(32) NOT NULL,
    user_id BIGINT NOT NULL,
    title VARCHAR(120),
    status ENUM('OPEN', 'CLOSED') DEFAULT 'OPEN',
    handoff_type ENUM('NONE', 'EMAIL') DEFAULT 'NONE',
    handoff_at DATETIME NULL,
    handoff_reason VARCHAR(80),
    opened_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME NULL,
    last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE = InnoDB;

CREATE INDEX idx_chat_user ON chat_consultations (user_id);

CREATE TABLE chat_messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    consultation_id BIGINT NOT NULL,
    user_id BIGINT NULL,
    content TEXT,
    sender ENUM('USER', 'AI', 'SYSTEM') NOT NULL,
    type ENUM(
        'TEXT',
        'IMAGE',
        'FILE',
        'SYSTEM'
    ) DEFAULT 'TEXT',
    metadata JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

CREATE INDEX idx_message_consultation ON chat_messages (consultation_id);

CREATE TABLE chat_attachments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    message_id BIGINT NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(120) NOT NULL,
    file_size INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

CREATE TABLE socket_connections (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    socket_id VARCHAR(128) NOT NULL,
    is_online BOOLEAN DEFAULT TRUE,
    connected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    disconnected_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB;

CREATE INDEX idx_socket_user ON socket_connections (user_id);

ALTER TABLE users ADD CONSTRAINT uq_users_user_no UNIQUE (user_no);

ALTER TABLE users ADD CONSTRAINT uq_users_email UNIQUE (email);

ALTER TABLE user_oauth_accounts
ADD CONSTRAINT uq_provider_user UNIQUE (provider, provider_user_id);

ALTER TABLE sessions
ADD CONSTRAINT uq_sessions_refresh_token_hash UNIQUE (refresh_token_hash);

ALTER TABLE chat_consultations
ADD CONSTRAINT uq_chat_consultations_case_no UNIQUE (case_no);

ALTER TABLE socket_connections
ADD CONSTRAINT uq_socket_connections_socket_id UNIQUE (socket_id);

ALTER TABLE user_oauth_accounts
ADD CONSTRAINT fk_user_oauth_accounts_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE sessions
ADD CONSTRAINT fk_sessions_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE otp_codes
ADD CONSTRAINT fk_otp_codes_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE login_logs
ADD CONSTRAINT fk_login_logs_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL;

ALTER TABLE chat_consultations
ADD CONSTRAINT fk_chat_consultations_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE chat_messages
ADD CONSTRAINT fk_chat_messages_consultation_id FOREIGN KEY (consultation_id) REFERENCES chat_consultations (id) ON DELETE CASCADE;

ALTER TABLE chat_messages
ADD CONSTRAINT fk_chat_messages_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL;

ALTER TABLE chat_attachments
ADD CONSTRAINT fk_chat_attachments_message_id FOREIGN KEY (message_id) REFERENCES chat_messages (id) ON DELETE CASCADE;

ALTER TABLE socket_connections
ADD CONSTRAINT fk_socket_connections_user_id FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

USE mofu_data;