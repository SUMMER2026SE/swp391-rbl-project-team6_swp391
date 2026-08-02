# MIDORI Japanese Learning Platform

<p align="center">
  <img src="midori-fe/public/logo.png" alt="MIDORI Logo" width="120" />
</p>

<p align="center">
  <strong>An AI-powered Japanese language learning platform — grammar, listening dictation, AI shadowing, and JLPT exam practice.</strong>
  <br />
  <em>Built for FPT University SWP391 Course Project</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Java-17-blue?style=for-the-badge&logo=openjdk" alt="Java 17" />
  <img src="https://img.shields.io/badge/Spring%20Boot-3.3-green?style=for-the-badge&logo=springboot" alt="Spring Boot" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-green?style=for-the-badge&logo=supabase" alt="Supabase" />
</p>

---

## Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Quick Start](#quick-start)
- [Environment Setup](#environment-setup)
- [Local Development Setup](#local-development-setup)
- [Deployment](#deployment)
- [Admin & Vocabulary Setup](#admin--vocabulary-setup)
- [Environment Files](#environment-files)
- [Security Notes](#security-notes)
- [User Roles](#user-roles)
- [API Overview](#api-overview)
- [Troubleshooting](#troubleshooting)
- [Smoke Test Before Commit](#smoke-test-before-commit)
- [Git Safety Checklist](#git-safety-checklist)
- [Contributing](#contributing)
- [License](#license)

---

## About

**MIDORI** (`midori` = green/leaf in Japanese) is a comprehensive Japanese language learning platform covering all JLPT levels (N5 to N1). The project consists of a Spring Boot backend and a React/Vite frontend, with Supabase as the PostgreSQL database and Supabase Storage for user avatar uploads.

---

## Local Setup

To run MIDORI on your local machine, follow the setup guide:

[README_SETUP_LOCAL.md](./README_SETUP_LOCAL.md)

This guide includes backend setup, frontend setup, Supabase configuration, Gmail OTP setup, Google Login setup, common errors, and safe Git rules.

For detailed instructions on roles, routes, and operational flows for Admin and Vocabulary setup, see:

[ADMIN_VOCAB_SETUP.md](./midori-be/docs/ADMIN_VOCAB_SETUP.md)

---

## Download KanjiVG

### Purpose
KanjiVG provides SVG stroke-order animations for Kanji characters displayed on the platform.

### Official Source
- Repository: [https://github.com/KanjiVG/kanjivg](https://github.com/KanjiVG/kanjivg)
- Website: [http://kanjivg.tagaini.net](http://kanjivg.tagaini.net)

### Download & Extraction Instructions
1. Download the ZIP file of the repository from the official GitHub page.
2. Extract the archive on your local computer.
3. Copy the folder named `kanji` from the extracted archive into:
   `midori-be/src/main/resources/dictionary/kanjivg/`

The final directory structure must be:
```
midori-be/
└── src/
    └── main/
        └── resources/
            └── dictionary/
                └── kanjivg/
                    ├── 04e00.svg
                    ├── 04e01.svg
                    ├── ...
                    └── 09fff.svg
```

### Git Exclusion Rationale
These SVG files are intentionally excluded from Git tracking (configured in `.gitignore`) because:
- **Large Dataset:** There are over 11,000 SVG files in the dataset, which bloats the repository size.
- **Static Content:** These files represent standardized stroke animations and rarely, if ever, change.
- **Reproducibility:** Every developer downloads the exact same official dataset, so there is no need to track them in git history.

---

## Features

### Authentication & Profile

- Register with email verification via OTP
- Login / Logout with JWT access tokens
- Google OAuth single sign-on
- Forgot password with email reset link
- Profile view and edit (display name, bio, avatar)
- Change password with validation
- Password strength validation on registration

### Learning Modules

- Vocabulary lessons organized by JLPT level
- Grammar patterns with formation rules and examples
- Listening exercises with audio
- AI Shadowing practice with dialogue scripts
- Smart Flashcards with spaced-repetition (New, Learning, Review, Mastered)
- JLPT Mock Exams with automatic scoring
- AI Sensei chat for Q&A and conversation practice
- Progress tracking: XP, daily streaks, leaderboard, skill scores

### Role-Based Dashboards

- **Students** — Full access to all learning modules and progress tracking
- **Teachers** — Manage vocabulary, grammar, listening, flashcards, exams; view student progress
- **Admins** — Platform-wide user management, analytics, content moderation, announcements

---

## Tech Stack

### Backend

| Technology                   | Purpose                               |
| ---------------------------- | ------------------------------------- |
| **Java 17**                  | Runtime                               |
| **Spring Boot 3.3**          | Web framework                         |
| **Spring Security**          | Authentication & authorization        |
| **JWT (jjwt)**               | Stateless access token authentication |
| **Spring Data JPA**          | Database ORM                          |
| **PostgreSQL (Supabase)**    | Relational database                   |
| **Spring Mail / Gmail SMTP** | OTP and password reset emails         |
| **Google OAuth 2.0**         | Social login                          |

### Frontend

| Technology                   | Purpose                      |
| ---------------------------- | ---------------------------- |
| **React 19**                 | UI framework                 |
| **Vite**                     | Build tool and dev server    |
| **TypeScript**               | Type safety                  |
| **TanStack Start + Router**  | File-based routing, SSR      |
| **TanStack React Query**     | Server state management      |
| **Tailwind CSS + shadcn/ui** | Styling and UI components    |
| **Framer Motion**            | Animations                   |
| **@react-oauth/google**      | Google OAuth client          |
| **@supabase/supabase-js**    | Supabase Storage for avatars |
| **React Hook Form + Zod**    | Form validation              |
| **Recharts**                 | Data visualization charts    |

### Infrastructure

| Technology             | Purpose                                   |
| ---------------------- | ----------------------------------------- |
| **Supabase**           | PostgreSQL database + Auth + Storage      |
| **Gmail SMTP**         | Transactional email (OTP, password reset) |
| **PowerShell scripts** | Local development automation              |

---

## Project Structure

```
swp391-rbl-project-team6_swp391/
├── midori-be/                         # Spring Boot backend
│   ├── src/main/
│   │   ├── java/com/midori/
│   │   │   ├── MidoriBeApplication.java
│   │   │   ├── config/               # Security, CORS, JWT config
│   │   │   ├── controller/           # REST API controllers
│   │   │   ├── dto/                 # Request/Response DTOs
│   │   │   ├── entity/              # JPA entities
│   │   │   ├── repository/          # Spring Data JPA repositories
│   │   │   ├── security/            # JWT filter, auth provider
│   │   │   └── service/             # Business logic services
│   │   └── resources/
│   │       ├── application.yml         # Main config (all env var placeholders)
│   │       └── dictionary/            # Dictionary files (KANJIDIC2.xml, JMdict.xml)
│   ├── .env                            # Real credentials (gitignored)
│   ├── .env.example                   # Env var template (committed)
│   └── scripts/
│       ├── run-backend-local.ps1       # Start backend with .env loaded
│       ├── setup-ffmpeg.ps1           # Validate FFmpeg installation
│       └── download-kanjidic.ps1       # Download KANJIDIC2.xml
│
├── midori-fe/                         # React/Vite frontend
│   ├── public/                       # Static assets (logo, favicon)
│   ├── src/
│   │   ├── components/             # React components
│   │   │   ├── ui/                # shadcn/ui reusable components
│   │   │   └── *.tsx              # Feature components (auth-shell, dashboard-layout, etc.)
│   │   ├── routes/                 # TanStack Router file-based routes (50 routes)
│   │   ├── lib/                    # Utilities, auth context, Supabase client
│   │   ├── data/                   # Static sample data
│   │   └── styles.css              # Global styles & Tailwind variables
│   ├── .env.local                   # Real frontend credentials (gitignored)
│   └── .env.example                  # Env template (committed)
│
├── scripts/                          # Dev automation scripts
│   └── dev/
│       ├── dev-menu.ps1             # Interactive menu for running services
│       ├── restart-backend.ps1       # Kill and restart backend
│       ├── restart-frontend.ps1      # Kill and restart frontend
│       ├── restart-all.ps1           # Kill and restart both
│       └── kill-all.ps1             # Kill all processes
│
└── .github/workflows/
    └── ci.yml                       # GitHub Actions CI/CD
```

---

## Quick Start

```powershell
# 1. Install FFmpeg (required for shadowing video features)
#    Windows: winget install ffmpeg
#    Linux: sudo apt-get install ffmpeg
#    macOS: brew install ffmpeg

# 2. Environment setup (one-time)
copy-item "midori-be/.env.example" "midori-be/.env"
copy-item "midori-fe/.env.example" "midori-fe/.env.local"
# Fill in real values in both files

# 3. Backend (Terminal 1) — automatically loads .env variables
.\midori-be\scripts\run-backend-local.ps1

# 3. Frontend (Terminal 2)
.\midori-be\scripts\run-frontend.ps1
```

> **First time?** Follow the [Local Development Setup](#local-development-setup) guide first to copy and configure environment files.

- **Backend:** `http://localhost:8080`
- **Frontend:** `http://localhost:8081` (or next available port if 8081 is in use)

---

## Environment Setup

All sensitive configuration for the backend is provided through environment variables. The file `midori-be/src/main/resources/application.yml` already contains every configuration option using `${ENV_VAR}` placeholders — there is no need to edit YAML files for secrets.

### Setup Steps

1. **Copy the environment template:**

   ```powershell
   copy-item "midori-be/.env.example" "midori-be/.env"
   ```

2. **Fill in the real values** in `midori-be/.env`. Every required variable has a comment explaining its purpose and where to obtain the value.

3. **Load the environment variables** before running the backend. The simplest way is to source them in your terminal, or use your IDE's run configuration:

   ```powershell
   # Option A: Run the provided script (recommended)
   .\scripts\run-backend-local.ps1

   # Option B: Manually load .env and run
   Get-Content midori-be/.env | ForEach-Object { ... }  # load vars into session
   cd midori-be; mvn spring-boot:run
   ```

4. **For the frontend**, copy the frontend template separately:

   ```powershell
   copy-item "midori-fe/.env.example" "midori-fe/.env.local"
   ```

### How Backend Configuration Works

`application.yml` reads all configuration from environment variables. During local development, developers load the values from `.env` into their environment (via the run script, IDE, or shell). On deployment platforms (Render, Railway, Docker, VPS, etc.), configure the same values as Environment Variables directly in the platform's dashboard or configuration file.

`application-local.yml` is not required — the backend runs correctly using only `application.yml` plus environment variables.

### Key Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL JDBC connection URL |
| `DATABASE_USERNAME` | Database username |
| `DATABASE_PASSWORD` | Database password |
| `JWT_SECRET` | JWT signing secret (min 32 characters) |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID |
| `SPRING_MAIL_USERNAME` | Gmail sender address |
| `SPRING_MAIL_PASSWORD` | Gmail App Password |
| `APP_MAIL_FROM` | Outbound email from address |
| `ADMIN_BOOTSTRAP_EMAIL` | Default admin email |
| `ADMIN_BOOTSTRAP_PASSWORD` | Default admin password |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `GEMINI_API_KEYS` | Comma-separated Gemini API keys |
| `GROQ_API_KEYS` | Comma-separated Groq API keys (for shadowing) |
| `FFMPEG_PATH` | Path to ffmpeg binary (optional, for shadowing video processing) |
| `FFPROBE_PATH` | Path to ffprobe binary (optional, for shadowing video processing) |
| `KANJIDIC2_PATH` | Path to KANJIDIC2.xml (optional, for Kanji features) |

See `midori-be/.env.example` for the complete list of all supported variables.

---

## Local Development Setup

See detailed guide: [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md)

### Summary

1. **Configure backend environment:**

   ```powershell
   copy-item "midori-be/.env.example" "midori-be/.env"
   ```

   Open `midori-be/.env` and fill in all values. Ask the team leader for credentials if needed. See [docs/TEAM_ENV_TEMPLATE.md](docs/TEAM_ENV_TEMPLATE.md).

2. **Configure frontend environment:**

   ```powershell
   copy-item "midori-fe/.env.example" "midori-fe/.env.local"
   ```

   Open `midori-fe/.env.local` and fill in the required values.

3. **Download KANJIDIC2.xml** (optional, for Kanji features):

   ```powershell
   .\midori-be\scripts\download-kanjidic.ps1
   ```

4. **Run backend:**

   ```powershell
   .\midori-be\scripts\run-backend-local.ps1
   ```

5. **Run frontend:**

   ```powershell
   .\midori-be\scripts\run-frontend.ps1
   ```

> **Note:** `application-local.yml` is not required. All backend configuration is handled through environment variables loaded from `.env`.

---

## Deployment

Deploying the backend requires only the repository and the environment variables.

### Steps

1. **Clone the repository**

2. **Configure environment variables** — either:
   - Provide a `.env` file to your deployment platform, or
   - Set each variable individually in the platform's Environment Variables dashboard

   The complete list of required variables is documented in `midori-be/.env.example`.

3. **Run the backend:**

   ```bash
   mvn clean package -DskipTests
   java -jar midori-be/target/midori-be-0.0.1-SNAPSHOT.jar
   ```

### Notes

- `application-local.yml` is **not required** for deployment. The backend reads all configuration from environment variables via `application.yml`.
- The repository contains **no real secrets**. All secrets live in `.env` (gitignored) or in the deployment platform's environment configuration.
- On platforms like **Render**, **Railway**, **Fly.io**, or **Docker**, set the same environment variables documented in `.env.example`.

---

## User Roles

| Role        | Dashboard | Access Level                                                                                            |
| ----------- | --------- | ------------------------------------------------------------------------------------------------------- |
| **Student** | 22 routes | Vocabulary, Grammar, Listening, Shadowing, Flashcards, Exams, AI Sensei, Leaderboard, Progress, Profile |
| **Teacher** | 13 routes | Same modules + student progress overview, exam management                                               |
| **Admin**   | 11 routes | Full platform: user management, analytics, moderation, announcements                                    |

### Authentication Flow

```
Public Pages → Login/Register → Email OTP Verify
                                        ↓
                        ┌──────────┬──────────┬──────────┐
                        │ Student  │ Teacher  │  Admin   │
                        └──────────┴──────────┴──────────┘
```

---

## API Overview

All API endpoints are prefixed with `/api`.

| Group    | Method | Endpoint                | Auth   | Description                         |
| -------- | ------ | ----------------------- | ------ | ----------------------------------- |
| **Auth** | POST   | `/auth/register`        | Public | Register with email & password      |
|          | POST   | `/auth/verify-otp`      | Public | Verify email with 6-digit OTP       |
|          | POST   | `/auth/login`           | Public | Login with email/password           |
|          | POST   | `/auth/google`          | Public | Login/register with Google ID token |
|          | POST   | `/auth/forgot-password` | Public | Send password reset email           |
|          | POST   | `/auth/reset-password`  | Public | Reset password with token           |
|          | POST   | `/auth/logout`          | JWT    | Logout (blacklist token)            |
| **User** | GET    | `/users/me`             | JWT    | Get current user profile            |
|          | PUT    | `/users/me`             | JWT    | Update profile (name, bio, avatar)  |
|          | DELETE | `/users/me/avatar`      | JWT    | Remove avatar                       |
|          | PUT    | `/users/me/password`    | JWT    | Change password                     |

### JWT Token Flow

1. User registers/logins → server returns `accessToken` (24h expiry)
2. Frontend stores token in memory (not localStorage for security)
3. All authenticated requests include `Authorization: Bearer <token>` header
4. On 401 response, frontend redirects to login

---

## Environment Files

| File                                     | Purpose                                  | Commit? |
| ---------------------------------------- | ---------------------------------------- | ------- |
| `midori-be/.env.example`                 | Backend env var template (placeholders)  | **Yes** |
| `midori-be/.env`                         | Real backend credentials                  | **No**  |
| `midori-be/src/main/resources/application.yml` | Main config (all `${ENV_VAR}` placeholders) | **Yes** |
| `midori-be/src/main/resources/application-local.yml` | Local overrides (gitignored)         | **No**  |
| `midori-fe/.env.example`                 | Frontend env template with placeholders  | **Yes** |
| `midori-fe/.env.local`                   | Real frontend credentials                 | **No**  |

### Public values (safe to commit)

These are documented in both `.env.example` files and are not sensitive:

- `VITE_API_BASE_URL=http://localhost:8080/api`
- `VITE_GOOGLE_CLIENT_ID` — use the value from your team leader
- `VITE_SUPABASE_URL=https://YOUR_SUPABASE_PROJECT_REF.supabase.co`
- `VITE_SUPABASE_AVATAR_BUCKET=avatars`
- `DATABASE_URL`, `DATABASE_USERNAME` (username itself is not a secret)
- `SUPABASE_URL`
- `AI_PROVIDER`, `GEMINI_MODEL`, `SHADOWING_SPEECH_PROVIDER`, etc.

### Secret values (never commit)

- `DATABASE_PASSWORD` — Database password
- `JWT_SECRET` — JWT signing secret
- `GOOGLE_CLIENT_ID` — Google OAuth Client ID
- `SPRING_MAIL_USERNAME` — Gmail sender address
- `SPRING_MAIL_PASSWORD` — Gmail App Password
- `APP_MAIL_FROM` — Outbound email from address
- `ADMIN_BOOTSTRAP_PASSWORD` — Default admin password
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
- `GEMINI_API_KEYS` / `GEMINI_API_KEY` — Gemini API keys
- `GROQ_API_KEYS` / `GROQ_API_KEY` — Groq API keys
- `OPENAI_API_KEY` / `DEEPSEEK_API_KEY` / `OPENROUTER_API_KEY` — AI provider keys
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon key

---

## Security Notes

- **Never commit `.env`** — It contains real credentials and is gitignored for this reason.
- **Never commit real API keys** — Gemini, Groq, OpenAI, DeepSeek, and OpenRouter keys must only live in `.env` or the deployment platform.
- **Never commit database passwords** — `DATABASE_PASSWORD` must only be in `.env` or the deployment platform's environment configuration.
- **Never commit JWT secrets** — `JWT_SECRET` must only be in `.env` or the deployment platform.
- **Use `.env.example` as the template** — It documents every required variable with descriptive comments. Copy it to `.env`, fill in values, and never stage the result.
- The **repository contains no real secrets**. All secrets are stored only in `.env` (gitignored) or in the deployment platform's Environment Variables.

---

## Troubleshooting

| Problem                                      | Cause                                                    | Fix                                                                                                                               |
| -------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Port 8080 already in use**                 | Backend already running                                  | `netstat -ano \| findstr :8080` then `taskkill /PID <PID> /F`                                                                    |
| **Frontend runs on 8082**                    | Port 8081 is occupied                                    | Kill the process on 8081, or use 8082 — it's fine                                                                               |
| **Google Login: `invalid_client`**           | Wrong or missing `VITE_GOOGLE_CLIENT_ID` in `.env.local` | Verify `.env.local` has the correct client ID and restart frontend                                                                |
| **Supabase avatar: `failed to fetch` / 403** | Wrong URL or key in `.env.local`                         | Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, ensure `avatars` bucket is public                                |
| **OTP email not received**                   | Gmail SMTP/App Password misconfigured                    | Verify `SPRING_MAIL_USERNAME` and `SPRING_MAIL_PASSWORD` in `.env` — must be Gmail App Password, not account password           |
| **YAML: `DuplicateKeyException`**            | Wrong indentation                                        | Use **2 spaces** only (no tabs). Do not mix indentation styles                                                                   |
| **Backend: `Could not resolve placeholder`** | Missing env var in `.env`                                | Verify all required fields are filled in `midori-be/.env`                                                                         |
| **JWT: `WeakKeyException` (0 bits)**         | `JWT_SECRET` is not set or is empty                     | Set `JWT_SECRET` in `midori-be/.env` — must be at least 32 characters                                                            |

### Common Commands

```powershell
# Kill process on port
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Verify .env is correct
cat midori-be/.env

# Verify .env.local is correct
cat midori-fe/.env.local

# Check what the backend is reading
curl http://localhost:8080/actuator/env 2>$null  # if actuator enabled
```

---

## Smoke Test Before Commit

Run this before every commit to catch config errors and leaked secrets early:

```powershell
.\scripts\test\smoke-all.ps1
```

This runs three checks in sequence:

| Check                           | Script               | Backend Required? |
| ------------------------------- | -------------------- | ----------------- |
| Frontend build + env validation | `smoke-frontend.ps1` | No                |
| Backend API endpoints           | `smoke-backend.ps1`  | **Yes**           |
| Secret leak scan                | `check-secrets.ps1`   | No                |

**To run individually:**

```powershell
.\scripts\test\smoke-frontend.ps1   # Build + env check
.\scripts\test\smoke-backend.ps1     # API test (needs backend running)
.\scripts\test\check-secrets.ps1     # Scan staged files for secrets
```

> **Note:** Smoke tests do not replace manual QA. Google OAuth popup and avatar upload UI should still be tested manually after any related UI changes.

---

## Git Safety Checklist

Before committing, run:

```powershell
git status --short
```

Then verify secret files are ignored:

```powershell
git check-ignore -v midori-be/.env
git check-ignore -v midori-be/src/main/resources/application-local.yml
git check-ignore -v midori-fe/.env.local
```

All three commands should return a path. If a command returns nothing, that file is **not ignored** and must not be committed.

### Never commit:

- `midori-be/.env`
- `midori-be/src/main/resources/application-local.yml`
- `midori-fe/.env.local`
- Any file containing real passwords, tokens, or secrets
- Any `.log` files

---

## Contributing

1. **Fork** the repository
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Code Standards

- Use **TypeScript** for all new frontend files
- Follow existing component patterns (shadcn/ui style)
- Write meaningful commit messages
- Run lint and format before committing

---

## License

This project was created for **FPT University's SWP391 Course**. All rights reserved.

---

<p align="center">
  Made with for Japanese language learners
</p>
