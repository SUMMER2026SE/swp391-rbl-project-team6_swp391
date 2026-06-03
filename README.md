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
- [Local Development Setup](#local-development-setup)
- [Environment Files](#environment-files)
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
│   └── src/main/
│       ├── java/com/midori/
│       │   ├── MidoriBeApplication.java
│       │   ├── config/               # Security, CORS, JWT config
│       │   ├── controller/           # REST API controllers
│       │   ├── dto/                 # Request/Response DTOs
│       │   ├── entity/              # JPA entities
│       │   ├── repository/          # Spring Data JPA repositories
│       │   ├── security/            # JWT filter, auth provider
│       │   └── service/             # Business logic services
│       └── resources/
│           ├── application-local.yml  # Local secrets (NEVER commit)
│           └── application-local.example.yml  # Config template (commit)
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
│   ├── .env.local                   # Local secrets (NEVER commit)
│   └── .env.example                # Env template (commit)
│
├── scripts/                          # Local run scripts
│   ├── run-backend-local.ps1
│   └── run-frontend.ps1
│
└── docs/                             # Team documentation
    ├── LOCAL_SETUP.md               # Full local setup guide
    └── TEAM_ENV_TEMPLATE.md         # Secrets request guide
```

---

## Quick Start

```powershell
# 1. Backend (Terminal 1)
.\scripts\run-backend-local.ps1

# 2. Frontend (Terminal 2)
.\scripts\run-frontend.ps1
```

> **First time?** Follow the [Local Development Setup](#local-development-setup) guide first to copy and configure environment files.

- **Backend:** `http://localhost:8080`
- **Frontend:** `http://localhost:8081` (or next available port if 8081 is in use)

---

## Local Development Setup

See detailed guide: [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md)

### Summary

1. **Copy backend config:**

   ```powershell
   copy-item "midori-be/src/main/resources/application-local.example.yml" "midori-be/src/main/resources/application-local.yml"
   ```

2. **Copy frontend env:**

   ```powershell
   copy-item "midori-fe/.env.example" "midori-fe/.env.local"
   ```

3. **Fill in secrets** — ask the team leader for values listed in [docs/TEAM_ENV_TEMPLATE.md](docs/TEAM_ENV_TEMPLATE.md).

4. **Run backend:**

   ```powershell
   .\scripts\run-backend-local.ps1
   ```

5. **Run frontend:**
   ```powershell
   .\scripts\run-frontend.ps1
   ```

---

## Environment Files

| File                                                         | Purpose                                         | Commit? |
| ------------------------------------------------------------ | ----------------------------------------------- | ------- |
| `midori-be/src/main/resources/application-local.example.yml` | Backend config template with placeholders       | **Yes** |
| `midori-be/src/main/resources/application-local.yml`         | Real backend secrets (DB password, Gmail, etc.) | **No**  |
| `midori-fe/.env.example`                                     | Frontend env template with placeholders         | **Yes** |
| `midori-fe/.env.local`                                       | Real frontend env (Supabase anon key)           | **No**  |

### Public values (safe to commit)

These are in both `.example` files and are not secrets:

- `VITE_API_BASE_URL=http://localhost:8080/api`
- `VITE_GOOGLE_CLIENT_ID=65823123353-... .apps.googleusercontent.com`
- `VITE_SUPABASE_URL=https://clyuyvdaoprxrpmrcyhd.supabase.co`
- `VITE_SUPABASE_AVATAR_BUCKET=avatars`
- `spring.datasource.url`
- `spring.datasource.username`
- `app.google.client-id`
- `app.jwt.secret` (uses a dev-only JWT key)
- `app.frontend.base-url`

### Secret values (never commit)

- `spring.datasource.password` — Supabase DB password
- `spring.mail.username` — Gmail sender address
- `spring.mail.password` — Gmail App Password
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase anon key

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

## Troubleshooting

| Problem                                      | Cause                                                    | Fix                                                                                                                      |
| -------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Port 8080 already in use**                 | Backend already running                                  | `netstat -ano \| findstr :8080` then `taskkill /PID <PID> /F`                                                            |
| **Frontend runs on 8082**                    | Port 8081 is occupied                                    | Kill the process on 8081, or use 8082 — it's fine                                                                        |
| **Google Login: `invalid_client`**           | Wrong or missing `VITE_GOOGLE_CLIENT_ID` in `.env.local` | Verify `.env.local` has the correct client ID and restart frontend                                                       |
| **Supabase avatar: `failed to fetch` / 403** | Wrong URL or key in `.env.local`                         | Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, ensure `avatars` bucket is public                        |
| **OTP email not received**                   | Gmail SMTP/App Password misconfigured                    | Verify `mail.username` and `mail.password` in `application-local.yml` — must be Gmail App Password, not account password |
| **YAML: `DuplicateKeyException`**            | Wrong indentation                                        | Use **2 spaces** only (no tabs). Do not mix indentation styles                                                           |
| **Backend: `Could not resolve placeholder`** | Missing env var in config                                | Verify all required fields are in `application-local.yml`                                                                |

### Common Commands

```powershell
# Kill process on port
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Verify .env.local is correct
cat midori-fe/.env.local

# Verify application-local.yml is correct
cat midori-be/src/main/resources/application-local.yml

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
| Secret leak scan                | `check-secrets.ps1`  | No                |

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
git check-ignore -v midori-be/src/main/resources/application-local.yml
git check-ignore -v midori-fe/.env.local
```

Both commands should return a path. If a command returns nothing, that file is **not ignored** and must not be committed.

### Never commit:

- `application-local.yml`
- `.env.local`
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
