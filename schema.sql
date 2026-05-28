
CREATE DATABASE github_analyzer;
USE github_analyzer;
CREATE TABLE profiles (
  id                        INT AUTO_INCREMENT PRIMARY KEY,
  -- user info
  username                  VARCHAR(100)    NOT NULL UNIQUE,
  name                      VARCHAR(200),
  bio                       TEXT,
  avatar_url                VARCHAR(500),
  location                  VARCHAR(200),
  company                   VARCHAR(200),
  blog                      VARCHAR(300),
  twitter_handle            VARCHAR(100),
  email                     VARCHAR(200),
  -- git info
  public_repos              INT             DEFAULT 0,
  public_gists              INT             DEFAULT 0,
  followers                 INT             DEFAULT 0,
  following                 INT             DEFAULT 0,
  -- repo info
  total_stars               INT             DEFAULT 0,
  total_forks               INT             DEFAULT 0,
  avg_stars_per_repo        DECIMAL(10,2)   DEFAULT 0.00,
  most_starred_repo         VARCHAR(200),
  most_starred_repo_url     VARCHAR(500),
  most_starred_count        INT             DEFAULT 0,
  top_languages             JSON,
  -- insight cols
  account_age_days          INT,
  repos_per_year            DECIMAL(10,2),
  follower_following_ratio  DECIMAL(10,4),
  is_hireable               BOOLEAN         DEFAULT FALSE,
  profile_score             INT             DEFAULT 0,
  -- analysis
  times_analyzed            INT             DEFAULT 1,
  github_created_at         DATETIME,
  github_updated_at         DATETIME,
  analyzed_at               DATETIME        DEFAULT CURRENT_TIMESTAMP,
  updated_at                DATETIME        DEFAULT CURRENT_TIMESTAMP
                                            ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username        (username),
  INDEX idx_profile_score   (profile_score),
  INDEX idx_total_stars     (total_stars),
  INDEX idx_followers       (followers),
  INDEX idx_analyzed_at     (analyzed_at)
);