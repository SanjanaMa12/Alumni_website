-- University of Peradeniya - Alumni Relations Office
-- MySQL 5.7+ / MariaDB 10.3+ schema
--
-- Usage:
--   mysql -u root -p < backend/database/schema.sql
--   mysql -u root -p aro_alumni < backend/database/seed.sql

CREATE DATABASE IF NOT EXISTS aro_alumni
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE aro_alumni;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS event_registrations;
DROP TABLE IF EXISTS email_verifications;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS people;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS faculties;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE faculties (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug        VARCHAR(50)  NOT NULL UNIQUE,
  name        VARCHAR(150) NOT NULL,
  image       VARCHAR(255) NULL,
  sort_order  SMALLINT     NOT NULL DEFAULT 0
) ENGINE=InnoDB;

CREATE TABLE users (
  id                   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role                 ENUM('alumni','student','admin') NOT NULL DEFAULT 'alumni',
  email                VARCHAR(190) NOT NULL UNIQUE,
  password_hash        VARCHAR(255) NOT NULL,
  full_name            VARCHAR(200) NOT NULL,
  preferred_name       VARCHAR(100) NOT NULL,
  phone                VARCHAR(30)  NULL,
  faculty_id           INT UNSIGNED NULL,
  grad_year            SMALLINT UNSIGNED NULL,
  reg_no               VARCHAR(30)  NULL,
  degree_cert_path     VARCHAR(255) NULL,
  directory_consent    TINYINT(1)   NOT NULL DEFAULT 0,
  current_country      VARCHAR(100) NULL,
  linkedin             VARCHAR(255) NULL,
  profession_org       VARCHAR(255) NULL,
  alumni_membership    VARCHAR(255) NULL,
  contact_by           SET('students_mentoring','university_events','other_alumni') NULL,
  contribute           SET('mentoring','guest_lecture','internship','donation','scholarships','networking','not_now') NULL,
  verification_status  ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_faculty FOREIGN KEY (faculty_id) REFERENCES faculties(id) ON DELETE SET NULL,
  INDEX idx_users_directory (directory_consent, verification_status),
  INDEX idx_users_grad_year (grad_year)
) ENGINE=InnoDB;

-- One-time codes sent to an email address before registration.
CREATE TABLE email_verifications (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email       VARCHAR(190) NOT NULL,
  code_hash   VARCHAR(255) NOT NULL,
  attempts    TINYINT UNSIGNED NOT NULL DEFAULT 0,
  expires_at  DATETIME NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_verifications_email (email)
) ENGINE=InnoDB;

CREATE TABLE events (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(200) NOT NULL,
  category     VARCHAR(50)  NULL,
  banner_text  VARCHAR(60)  NOT NULL,
  theme        ENUM('maroon','blue','green','orange') NOT NULL DEFAULT 'maroon',
  event_date   DATE NOT NULL,
  location     VARCHAR(200) NOT NULL,
  description  TEXT NOT NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE event_registrations (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  event_id    INT UNSIGNED NOT NULL,
  user_id     INT UNSIGNED NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_event_user (event_id, user_id),
  CONSTRAINT fk_reg_event FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  CONSTRAINT fk_reg_user  FOREIGN KEY (user_id)  REFERENCES users(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE projects (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title        VARCHAR(200) NOT NULL,
  description  TEXT NOT NULL,
  status       ENUM('ongoing','completed') NOT NULL DEFAULT 'ongoing',
  progress     TINYINT UNSIGNED NULL,
  theme        ENUM('green','blue','purple','orange') NOT NULL DEFAULT 'green',
  sort_order   SMALLINT NOT NULL DEFAULT 0
) ENGINE=InnoDB;

-- Patrons / committee members shown on the People page.
CREATE TABLE people (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  group_key    ENUM('leadership','overseas_advisory','university_advisory','aro') NOT NULL,
  name         VARCHAR(200) NOT NULL,
  designation  VARCHAR(200) NOT NULL,
  photo        VARCHAR(255) NULL,
  sort_order   SMALLINT NOT NULL DEFAULT 0
) ENGINE=InnoDB;
