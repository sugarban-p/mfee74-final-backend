-- Functionality: create the current core backend tables for auth, sessions, OTP, and support chat.
-- Purpose: initialize the database using the active snake_case schema used by the application.

USE mofu_data;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_no VARCHAR(32) NOT NULL,
    email VARCHAR(191) NOT NULL,
    password_hash VARCHAR(255) NULL,
    name VARCHAR(120) NULL,
    nickname VARCHAR(120) NULL,
    phone VARCHAR(30) NULL,
    address VARCHAR(255) NULL,
    avatar VARCHAR(255) NULL,
    status ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    email_verified TINYINT(1) NOT NULL DEFAULT 0,
    email_verified_at DATETIME NULL,
    login_attempts INT NOT NULL DEFAULT 0,
    locked_until DATETIME NULL,
    last_login_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    UNIQUE KEY uq_users_user_no (user_no),
    KEY idx_users_status (status),
    KEY idx_users_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS user_oauth_accounts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    provider ENUM('GOOGLE') NOT NULL,
    provider_user_id VARCHAR(191) NOT NULL,
    provider_email VARCHAR(191) NULL,
    provider_name VARCHAR(120) NULL,
    provider_avatar VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_oauth_provider_user (provider, provider_user_id),
    KEY idx_oauth_user_provider (user_id, provider),
    CONSTRAINT fk_oauth_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    access_token_hash CHAR(64) NOT NULL,
    refresh_token_hash CHAR(64) NOT NULL,
    user_agent VARCHAR(255) NULL,
    ip VARCHAR(64) NULL,
    device_name VARCHAR(100) NULL,
    expires_at DATETIME NOT NULL,
    revoked_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_sessions_refresh_token_hash (refresh_token_hash),
    KEY idx_sessions_user (user_id),
    KEY idx_sessions_expires_at (expires_at),
    CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS otp_codes (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    code_hash CHAR(64) NOT NULL,
    type ENUM(
        'EMAIL_VERIFY',
        'FORGOT_PASSWORD'
    ) NOT NULL,
    expires_at DATETIME NOT NULL,
    used TINYINT(1) NOT NULL DEFAULT 0,
    attempts INT NOT NULL DEFAULT 0,
    send_count INT NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_otp_codes_user_type (user_id, type, used, expires_at),
    CONSTRAINT fk_otp_codes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS login_logs (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NULL,
    email VARCHAR(191) NULL,
    method ENUM('PASSWORD', 'GOOGLE') NOT NULL DEFAULT 'PASSWORD',
    ip VARCHAR(64) NULL,
    country VARCHAR(100) NULL,
    city VARCHAR(100) NULL,
    user_agent VARCHAR(255) NULL,
    browser VARCHAR(120) NULL,
    os VARCHAR(120) NULL,
    device VARCHAR(120) NULL,
    success TINYINT(1) NOT NULL,
    reason VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_login_logs_user_time (user_id, created_at),
    KEY idx_login_logs_email_time (email, created_at),
    CONSTRAINT fk_login_logs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS chat_consultations (
    id BIGINT NOT NULL AUTO_INCREMENT,
    case_no VARCHAR(32) NOT NULL,
    user_id BIGINT NOT NULL,
    title VARCHAR(120) NULL,
    status ENUM('OPEN', 'CLOSED') NOT NULL DEFAULT 'OPEN',
    handoff_type ENUM('NONE', 'EMAIL') NOT NULL DEFAULT 'NONE',
    handoff_at DATETIME NULL,
    handoff_reason VARCHAR(80) NULL,
    opened_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME NULL,
    last_message_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_chat_consultations_case_no (case_no),
    KEY idx_chat_consultations_user_status (user_id, status),
    KEY idx_chat_consultations_last_message_at (last_message_at),
    CONSTRAINT fk_chat_consultations_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id BIGINT NOT NULL AUTO_INCREMENT,
    consultation_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    sender ENUM(
        'USER',
        'AI',
        'SYSTEM'
    ) NOT NULL,
    type ENUM(
        'TEXT',
        'IMAGE',
        'FILE'
    ) NOT NULL DEFAULT 'TEXT',
    metadata JSON NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_chat_messages_consultation_time (consultation_id, created_at, id),
    KEY idx_chat_messages_user_time (user_id, created_at, id),
    CONSTRAINT fk_chat_messages_consultation FOREIGN KEY (consultation_id) REFERENCES chat_consultations (id) ON DELETE CASCADE,
    CONSTRAINT fk_chat_messages_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat_attachments (
    id BIGINT NOT NULL AUTO_INCREMENT,
    message_id BIGINT NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(120) NOT NULL,
    file_size INT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_chat_attachments_message (message_id),
    CONSTRAINT fk_chat_attachments_message FOREIGN KEY (message_id) REFERENCES chat_messages (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS socket_connections (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    socket_id VARCHAR(128) NOT NULL,
    is_online TINYINT(1) NOT NULL DEFAULT 1,
    connected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    disconnected_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_socket_connections_socket_id (socket_id),
    KEY idx_socket_connections_user_online (user_id, is_online),
    CONSTRAINT fk_socket_connections_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);