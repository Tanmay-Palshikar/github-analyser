# 🔍 GitHub Analyser

A RESTful API service that analyses GitHub user profiles and surfaces actionable insights — from repository statistics and top languages to a calculated profile score and hirability signals. Data is persisted in MySQL for fast repeated lookups and trend tracking.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-5.x-000000?logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.x-4479A1?logo=mysql&logoColor=white)
![License](https://img.shields.io/badge/License-ISC-blue)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Running the Server](#running-the-server)
- [API Reference](#api-reference)
- [Security](#security)
- [Contributing](#contributing)

---

## Overview

GitHub Analyser accepts a GitHub username, calls the GitHub REST API, computes a set of derived metrics, and stores the result in a MySQL database. Subsequent requests for the same user are served from the cache, with a counter tracking how many times a profile has been analysed.

---

## Features

- **Profile Snapshot** — name, bio, avatar, location, company, blog, Twitter handle
- **Repository Metrics** — total stars, total forks, average stars per repo, most-starred repository
- **Language Intelligence** — top programming languages stored as structured JSON
- **Account Insights** — account age in days, repos created per year, follower-to-following ratio
- **Profile Score** — a single numeric score reflecting overall GitHub presence
- **Hirability Flag** — surfaces the user's `is_hireable` status
- **Analysis Tracking** — `times_analyzed` counter incremented on each lookup
- **Rate Limiting** — prevents API abuse out of the box
- **Security Headers** — Helmet.js applied to all responses

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express 5 |
| Database | MySQL 8 (Railway-hosted) |
| HTTP Client | Axios |
| Security | Helmet, express-rate-limit |
| Dev tooling | Nodemon, dotenv |

---

## Project Structure

```
github-analyser/
├── src/
│   ├── app.js               # Express app setup & middleware
│   ├── routes/              # Route definitions
│   ├── controllers/         # Request handlers & business logic
│   ├── services/            # GitHub API calls & data processing
│   └── db/                  # MySQL connection & query helpers
├── schema.sql               # Database schema (run once to initialise)
├── .env.example             # Environment variable template
├── .gitignore
├── package.json
└── README.md
```

> **Note:** `app.js` is the entry point — `npm start` runs `node app.js`.

---

## Database Schema

A single `profiles` table stores everything computed for a user:

```sql
CREATE TABLE profiles (
  id                      INT AUTO_INCREMENT PRIMARY KEY,

  -- Identity
  username                VARCHAR(100) NOT NULL UNIQUE,
  name                    VARCHAR(200),
  bio                     TEXT,
  avatar_url              VARCHAR(500),
  location                VARCHAR(200),
  company                 VARCHAR(200),
  blog                    VARCHAR(300),
  twitter_handle          VARCHAR(100),
  email                   VARCHAR(200),

  -- GitHub stats
  public_repos            INT DEFAULT 0,
  public_gists            INT DEFAULT 0,
  followers               INT DEFAULT 0,
  following               INT DEFAULT 0,

  -- Repository metrics
  total_stars             INT DEFAULT 0,
  total_forks             INT DEFAULT 0,
  avg_stars_per_repo      DECIMAL(10,2) DEFAULT 0.00,
  most_starred_repo       VARCHAR(200),
  most_starred_repo_url   VARCHAR(500),
  most_starred_count      INT DEFAULT 0,
  top_languages           JSON,

  -- Insights
  account_age_days        INT,
  repos_per_year          DECIMAL(10,2),
  follower_following_ratio DECIMAL(10,4),
  is_hireable             BOOLEAN DEFAULT FALSE,
  profile_score           INT DEFAULT 0,

  -- Metadata
  times_analyzed          INT DEFAULT 1,
  github_created_at       DATETIME,
  github_updated_at       DATETIME,
  analyzed_at             DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at              DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_username      (username),
  INDEX idx_profile_score (profile_score),
  INDEX idx_total_stars   (total_stars),
  INDEX idx_followers     (followers),
  INDEX idx_analyzed_at   (analyzed_at)
);
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- A **MySQL** database (local or cloud — the project was built with [Railway](https://railway.app))
- A **GitHub Personal Access Token** — generate one at [github.com/settings/tokens](https://github.com/settings/tokens) (no special scopes needed for public profile data)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Tanmay-Palshikar/github-analyser.git
cd github-analyser

# 2. Install dependencies
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```env
# GitHub
GITHUB_TOKEN=your_github_personal_access_token

# MySQL connection (Railway exposes these automatically if deployed there)
DB_HOST=your_db_host
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=github_analyzer

# Optional — Railway-specific public URL
MYSQL_PUBLIC_URL=mysql://user:password@host:port/db
MYSQL_ROOT_PASSWORD=your_root_password
MYSQL_URL=mysql://user:password@host:port/db
```

> ⚠️ Never commit your `.env` file. It is already listed in `.gitignore`.

### Database Setup

Run the schema file against your MySQL instance once to create the database and table:

```bash
# Using the MySQL CLI
mysql -h <DB_HOST> -P <DB_PORT> -u <DB_USER> -p < schema.sql

# Or, if using Railway's public URL
mysql "<MYSQL_PUBLIC_URL>" < schema.sql
```

### Running the Server

```bash
# Production
npm start

# Development (auto-restarts on file changes)
npm run dev
```

The server will start on `http://localhost:3000` by default (or whatever `PORT` is set to in your environment).

---

## API Reference

Base URL: `http://localhost:3000`

### Analyse a Profile

```
POST /api/profiles/analyze/:username
```

Fetches the GitHub profile for `:username` via the GitHub API, computes all metrics and insights, and persists the result to the database. Run this first before using get/compare endpoints.

```bash
curl -X POST http://localhost:3000/api/profiles/analyze/gaearon
```

---

### Get All Profiles

```
GET /api/profiles
```

Returns all analysed profiles stored in the database.

```bash
curl http://localhost:3000/api/profiles
```

---

### Get Single Profile

```
GET /api/profiles/:username
```

Fetches the cached profile for a specific username.

```bash
curl http://localhost:3000/api/profiles/torvalds
```

---

### Compare Profiles

```
GET /api/profiles/compare?users=:username1,:username2
```

Compares two or more profiles side by side. All usernames in the query must be analysed first.

```bash
curl "http://localhost:3000/api/profiles/compare?users=torvalds,gaearon"
```

---

### Delete a Profile

```
DELETE /api/profiles/:username
```

Removes a profile from the database.

```bash
curl -X DELETE http://localhost:3000/api/profiles/torvalds
```

---

## Postman Collection

A ready-to-import Postman collection is included in the repository root: **`github-analyser.postman_collection.json`**

### Importing

1. Open Postman
2. Click **Import** (top left)
3. Drag and drop `github-analyser.postman_collection.json` or browse to it
4. The collection will appear in your sidebar with all requests pre-configured

### Collection Variable

The collection uses a `baseUrl` variable defaulting to `http://localhost:3000`. To point it at a deployed instance:

1. Click the collection name in the sidebar
2. Go to the **Variables** tab
3. Update `baseUrl` to your deployed URL

### Recommended Request Order

For a fresh database, run requests in this order to avoid lookup errors:

```
1. POST  /api/profiles/analyze/gaearon     ← analyse first
2. POST  /api/profiles/analyze/torvalds    ← analyse second
3. GET   /api/profiles                     ← list all
4. GET   /api/profiles/torvalds            ← single profile
5. GET   /api/profiles/compare?users=torvalds,gaearon  ← compare
6. DELETE /api/profiles/torvalds           ← clean up
```

---

## Security

- **`helmet`** sets secure HTTP response headers on every request.
- **`express-rate-limit`** caps the number of requests per IP to protect both the API and the upstream GitHub rate limit.
- Secrets are loaded via `dotenv` and must never be hard-coded or committed.

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m "feat: describe your change"`
4. Push and open a Pull Request

Please follow conventional commit style and ensure existing functionality is not broken.

---

*Built by [Tanmay Palshikar](https://github.com/Tanmay-Palshikar)*