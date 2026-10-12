-- Upgrades a database created with the earlier password-based schema to
-- passwordless (email OTP) login. Not needed for a fresh install from schema.sql.
--
--   mysql -u root -p aro_alumni < backend/database/migrations/001_passwordless_login.sql

USE aro_alumni;

ALTER TABLE users DROP COLUMN password_hash;

DROP TABLE IF EXISTS email_verifications;
CREATE TABLE email_verifications (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email       VARCHAR(190) NOT NULL,
  purpose     ENUM('login','register') NOT NULL,
  code_hash   VARCHAR(255) NOT NULL,
  attempts    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  ip          VARCHAR(45) NOT NULL DEFAULT '',
  created_at  DATETIME NOT NULL,
  expires_at  DATETIME NOT NULL,
  used_at     DATETIME NULL,
  INDEX idx_email_verifications_email (email, purpose, created_at),
  INDEX idx_email_verifications_ip (ip, created_at)
) ENGINE=InnoDB;

-- The old demo student used a non-university email, which Student Login no longer accepts.
DELETE FROM users WHERE email = 'student@demo.lk';
