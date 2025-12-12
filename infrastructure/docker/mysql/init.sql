-- UltraChat MySQL Schema
-- Users, Chats, ACL, Settings

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` CHAR(36) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `username` VARCHAR(30) NOT NULL,
  `display_name` VARCHAR(100) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `avatar` VARCHAR(500) DEFAULT NULL,
  `bio` VARCHAR(500) DEFAULT NULL,
  `status` ENUM('online', 'offline', 'away', 'dnd') DEFAULT 'offline',
  `last_seen` DATETIME DEFAULT NULL,
  `is_verified` TINYINT(1) DEFAULT 0,
  `is_banned` TINYINT(1) DEFAULT 0,
  `two_factor_secret` VARCHAR(255) DEFAULT NULL,
  `two_factor_enabled` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_users_email` (`email`),
  UNIQUE KEY `idx_users_username` (`username`),
  KEY `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User settings
CREATE TABLE IF NOT EXISTS `user_settings` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `theme` VARCHAR(20) DEFAULT 'system',
  `language` VARCHAR(10) DEFAULT 'en',
  `notification_settings` JSON NOT NULL,
  `privacy_settings` JSON NOT NULL,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_settings_user_id` (`user_id`),
  CONSTRAINT `fk_user_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Sessions
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `device_id` VARCHAR(100) NOT NULL,
  `device_name` VARCHAR(100) DEFAULT NULL,
  `ip_address` VARCHAR(45) NOT NULL,
  `user_agent` VARCHAR(500) DEFAULT NULL,
  `refresh_token_hash` VARCHAR(255) NOT NULL,
  `last_active_at` DATETIME NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `is_revoked` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_sessions_user_id` (`user_id`),
  KEY `idx_sessions_token_hash` (`refresh_token_hash`),
  CONSTRAINT `fk_sessions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chats
CREATE TABLE IF NOT EXISTS `chats` (
  `id` CHAR(36) NOT NULL,
  `type` ENUM('direct', 'group', 'channel', 'community') NOT NULL,
  `name` VARCHAR(100) DEFAULT NULL,
  `description` VARCHAR(500) DEFAULT NULL,
  `avatar` VARCHAR(500) DEFAULT NULL,
  `owner_id` CHAR(36) NOT NULL,
  `settings` JSON NOT NULL,
  `last_message_at` DATETIME DEFAULT NULL,
  `is_archived` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_chats_type` (`type`),
  KEY `idx_chats_owner_id` (`owner_id`),
  KEY `idx_chats_last_message` (`last_message_at`),
  CONSTRAINT `fk_chats_owner` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chat members
CREATE TABLE IF NOT EXISTS `chat_members` (
  `id` CHAR(36) NOT NULL,
  `chat_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `role` ENUM('owner', 'admin', 'moderator', 'member') DEFAULT 'member',
  `muted_until` DATETIME DEFAULT NULL,
  `last_read_message_id` CHAR(36) DEFAULT NULL,
  `unread_count` INT DEFAULT 0,
  `notification_settings` JSON DEFAULT NULL,
  `joined_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_chat_members_unique` (`chat_id`, `user_id`),
  KEY `idx_chat_members_user_id` (`user_id`),
  CONSTRAINT `fk_chat_members_chat` FOREIGN KEY (`chat_id`) REFERENCES `chats` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_chat_members_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chat invites
CREATE TABLE IF NOT EXISTS `chat_invites` (
  `id` CHAR(36) NOT NULL,
  `chat_id` CHAR(36) NOT NULL,
  `code` VARCHAR(20) NOT NULL,
  `created_by` CHAR(36) NOT NULL,
  `expires_at` DATETIME DEFAULT NULL,
  `max_uses` INT DEFAULT NULL,
  `uses` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_chat_invites_code` (`code`),
  KEY `idx_chat_invites_chat_id` (`chat_id`),
  CONSTRAINT `fk_chat_invites_chat` FOREIGN KEY (`chat_id`) REFERENCES `chats` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Chat bans
CREATE TABLE IF NOT EXISTS `chat_bans` (
  `id` CHAR(36) NOT NULL,
  `chat_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `banned_by` CHAR(36) NOT NULL,
  `reason` VARCHAR(500) DEFAULT NULL,
  `expires_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_chat_bans_unique` (`chat_id`, `user_id`),
  CONSTRAINT `fk_chat_bans_chat` FOREIGN KEY (`chat_id`) REFERENCES `chats` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Contacts / Friends
CREATE TABLE IF NOT EXISTS `contacts` (
  `id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL,
  `contact_id` CHAR(36) NOT NULL,
  `status` ENUM('pending', 'accepted', 'blocked') DEFAULT 'pending',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_contacts_unique` (`user_id`, `contact_id`),
  KEY `idx_contacts_contact_id` (`contact_id`),
  CONSTRAINT `fk_contacts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_contacts_contact` FOREIGN KEY (`contact_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
