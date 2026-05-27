# Midori Sensei - Japanese Language Learning Platform

<p align="center">
  <img src="midori-fe/public/logo.png" alt="Midori Sensei Logo" width="120" />
</p>

<p align="center">
  <strong>An AI-powered Japanese language learning platform for mastering Japanese from JLPT N5 to N1</strong>
  <br />
  <em>Built for FPT University SWP391 Course Project</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/JLPT-N5%20→%20N1-green?style=for-the-badge" alt="JLPT Levels" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind-4.2-38B2AC?style=for-the-badge&logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare" alt="Cloudflare Workers" />
</p>

---

## Table of Contents

- [About](#about)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the App](#running-the-app)
- [Database Setup](#database-setup)
- [Scripts](#scripts)
- [User Roles](#user-roles)
- [Database Schema](#database-schema)
- [API Design](#api-design)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## About

**Midori Sensei** (midori = green/leaf in Japanese) is a comprehensive web-based Japanese language learning platform designed to help students progress from absolute beginner (JLPT N5) to advanced (JLPT N1). The platform combines structured lessons with AI-powered features to create an immersive and personalized learning experience.

The platform covers all essential aspects of Japanese language learning:

| Module | Description |
|---|---|
| **Vocabulary** | Structured lessons organized by JLPT level with kanji, kana, romaji, and audio pronunciation |
| **Grammar** | Grammar patterns organized by JLPT level with detailed explanations and usage examples |
| **Listening** | Audio-based exercises to improve comprehension skills |
| **Shadowing** | Practice speaking with guided conversation scripts and real-world dialogues |
| **Flashcards** | Spaced-repetition flashcard system for effective memorization |
| **Exams** | JLPT mock exams to test knowledge and track progress |
| **AI Sensei** | AI-powered chat assistant for personalized Q&A and conversation practice |
| **Progress Tracking** | XP, daily streaks, leaderboards, and skill score dashboards |

---

## Features

### For Students
- 📖 **Vocabulary Lessons** — Structured lessons from N5 to N1 with audio, images, and examples
- 📝 **Grammar Reference** — Comprehensive grammar patterns with formation rules and usage notes
- 🎧 **Listening Exercises** — Audio-based comprehension training
- 🎭 **Shadowing Practice** — Guided speaking practice with dialogue scripts
- 🃏 **Smart Flashcards** — Spaced-repetition flashcards with 4 study modes (New, Learning, Review, Mastered)
- 📋 **Mock Exams** — Timed JLPT practice exams with automatic scoring
- 🤖 **AI Sensei Chat** — Ask questions and practice conversations with an AI tutor
- 🏆 **Leaderboard** — Compete with other learners and track your rank
- 📊 **Progress Dashboard** — Visualize XP earned, streaks maintained, and skills mastered
- 🔔 **Notifications** — Stay updated with achievements, reminders, and messages

### For Teachers
- 📚 **Content Management** — Manage vocabulary, grammar, listening, and flashcard content
- 📋 **Student Overview** — View student progress and performance analytics
- 📈 **Exam Management** — Create and manage JLPT mock exams
- 👥 **Student-Teacher Assignment** — Manage teacher-student relationships

### For Admins
- 📊 **Analytics Dashboard** — Platform-wide analytics and user statistics
- 👤 **User Management** — Manage students, teachers, and admin accounts
- 🚨 **Moderation** — Review and handle user reports and flagged content
- 🔔 **System Notifications** — Send announcements to all users

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| **React** | 19.2.0 | UI framework |
| **TypeScript** | 5.8.3 | Type safety |
| **TanStack Start** | 1.167.50 | Full-stack React framework with SSR |
| **TanStack Router** | 1.168.25 | File-based routing |
| **TanStack React Query** | 5.83.0 | Server state management |
| **Vite** | 7.3.1 | Build tool |
| **Tailwind CSS** | 4.2.1 | Utility-first styling |
| **shadcn/ui** | — | Radix UI-based component library |
| **Framer Motion** | 12.40.0 | Animations |
| **Recharts** | 3.8.1 | Data visualization |
| **React Hook Form** + **Zod** | — | Form handling & validation |

### Backend

| Technology | Purpose |
|---|---|
| **SQL Server** | Relational database |
| Backend API | To be implemented (`midori-be/`) |

### Infrastructure

| Technology | Purpose |
|---|---|
| **Cloudflare Workers** | Deployment platform (SSR) |
| **Wrangler** | Cloudflare Workers CLI |
| **Bun** | Package manager (optional) |

---

## Project Structure

```
swp391-rbl-project-team6_swp391/
├── midori-fe/                    # Frontend application
│   ├── public/                   # Static assets (logo, favicon)
│   │   ├── favicon.svg
│   │   └── logo.png
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── ui/              # 44+ reusable UI components
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   ├── avatar.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   └── ... (40+ more)
│   │   │   ├── auth-shell.tsx         # Authentication layout wrapper
│   │   │   ├── dashboard-layout.tsx   # Main dashboard layout
│   │   │   ├── ai-sensei-chat.tsx     # AI chat interface
│   │   │   ├── logo.tsx               # Brand logo component
│   │   │   └── sakura-bg.tsx          # Animated sakura background
│   │   ├── routes/                    # TanStack Router file-based routes
│   │   │   ├── index.tsx              # Landing page (public)
│   │   │   ├── login.tsx              # Login page
│   │   │   ├── register.tsx           # Registration page
│   │   │   ├── forgot-password.tsx
│   │   │   ├── verify-otp.tsx
│   │   │   ├── reset-password.tsx
│   │   │   ├── admin.*.tsx            # Admin dashboard routes (9+ routes)
│   │   │   ├── teacher.*.tsx          # Teacher dashboard routes (8+ routes)
│   │   │   └── student.*.tsx          # Student dashboard routes (12+ routes)
│   │   ├── lib/                       # Utilities and context
│   │   │   ├── utils.ts               # cn() helper, class utilities
│   │   │   ├── auth.tsx               # Auth & Theme context providers
│   │   │   ├── error-capture.tsx
│   │   │   ├── error-page.tsx
│   │   │   └── mock-data.ts           # Sample data for development
│   │   ├── hooks/                     # Custom React hooks
│   │   │   └── use-mobile.tsx
│   │   ├── data/                      # Static data files
│   │   │   ├── lessons.ts             # Sample vocabulary lessons
│   │   │   └── flashcards.ts          # Sample flashcard decks
│   │   ├── router.tsx                 # Router configuration
│   │   ├── routeTree.gen.ts          # Auto-generated route tree
│   │   ├── server.ts                  # SSR entry point
│   │   └── styles.css                 # Global styles & CSS variables
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── wrangler.jsonc                 # Cloudflare Workers config
├── midori-be/                         # Backend services (placeholder)
│   └── .gitkeep
├── database_schema.sql                # SQL Server database schema (25+ tables)
├── package.json                       # Root package.json (symlink to midori-fe)
├── tsconfig.json
├── vite.config.ts
├── wrangler.jsonc
├── components.json                    # shadcn/ui configuration
├── eslint.config.js
├── .prettierrc
├── bun.lock
└── bunfig.toml
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **Bun** (optional, for faster package management) — [Install Bun](https://bun.sh)
- **SQL Server** (for database)
- **Git**

### Installation

#### 1. Clone the repository

```bash
git clone https://github.com/your-org/swp391-rbl-project-team6_swp391.git
cd swp391-rbl-project-team6_swp391
```

#### 2. Install dependencies

Using npm:

```bash
npm install
```

Or using Bun (recommended for faster installation):

```bash
bun install
```

#### 3. Set up environment variables

Create a `.env` file in the project root (copy from template if available):

```env
# Database
DATABASE_URL=sqlserver://localhost:1433;database=MidoriSensei;trustedConnection=true;trustServerCertificate=true

# Authentication
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-session-secret

# API (for backend, when implemented)
API_BASE_URL=http://localhost:3000/api

# Cloudflare (optional, for deployment)
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
```

> ⚠️ The `.gitignore` file excludes `.env` and `.env*.local` from version control.

### Running the App

#### Development mode

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

#### Production build

```bash
npm run build
npm run preview
```

---

## Database Setup

### SQL Server

1. Ensure SQL Server is running and accessible.
2. Create a new database:

```sql
CREATE DATABASE MidoriSensei;
GO
```

3. Run the schema script:

```bash
sqlcmd -S localhost -d MidoriSensei -i database_schema.sql
```

Or via SQL Server Management Studio (SSMS):

1. Open `database_schema.sql`
2. Execute against the `MidoriSensei` database

The schema includes **25+ tables** covering all platform features:

- `users`, `sessions` — Authentication
- `student_profiles`, `teacher_profiles` — User profiles
- `vocabulary_lessons`, `vocabulary_words` — Vocabulary content
- `grammar_categories`, `grammar_structures` — Grammar content
- `listening_exercises`, `listening_progress` — Listening practice
- `shadowing_topics`, `shadowing_conversations`, `shadowing_sentences`, `shadowing_progress` — Shadowing practice
- `flashcard_decks`, `flashcards`, `flashcard_sessions` — Flashcard system
- `exams`, `exam_questions`, `exam_attempts` — Exam management
- `user_progress`, `daily_xp`, `skill_scores` — Progress tracking
- `ai_conversations`, `ai_messages` — AI Sensei chat
- `notifications` — Notification system
- `reports`, `teacher_students` — Admin & moderation
- `analytics_events` — Analytics
- `user_settings` — User preferences

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build for production |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint to check code quality |
| `npm run format` | Format code with Prettier |

---

## User Roles

The platform supports **three user roles** with distinct dashboards and permissions:

| Role | Access | Dashboard Routes |
|---|---|---|
| **Student** | Default role for learners | Vocabulary, Grammar, Listening, Shadowing, Flashcards, Exams, AI Sensei, Leaderboard, Progress, Profile |
| **Teacher** | Content creator & student mentor | Dashboard, Vocabulary, Grammar, Listening, Shadowing, Flashcards, Exams, Profile, Settings |
| **Admin** | Full platform management | Dashboard, Users, Teachers, Grammar, Exams, Moderation, Analytics, Notifications, Profile, Settings |

### Authentication Flow

```
Public Pages → Login/Register → Role-based Dashboard
                                    ↓
        ┌──────────┬──────────┬──────────┐
        │ Student  │ Teacher  │  Admin   │
        └──────────┴──────────┴──────────┘
```

---

## Database Schema

### Entity Relationship Overview

```
users (1) ──── (1) student_profiles
        │
        └─── (1) teacher_profiles

users (1) ──── (N) ai_conversations (1) ──── (N) ai_messages
users (1) ──── (N) notifications
users (1) ──── (N) user_progress
users (1) ──── (N) daily_xp
users (1) ──── (N) skill_scores
users (1) ──── (N) flashcard_sessions
users (1) ──── (N) exam_attempts
users (1) ──── (N) listening_progress
users (1) ──── (N) shadowing_progress
users (1) ──── (N) reports
users (1) ──── (N) teacher_students

vocabulary_lessons (1) ──── (N) vocabulary_words
grammar_categories (1) ──── (N) grammar_structures
shadowing_topics (1) ──── (N) shadowing_conversations (1) ──── (N) shadowing_sentences
flashcard_decks (1) ──── (N) flashcards
exams (1) ──── (N) exam_questions (1) ──── (N) exam_attempts
```

### JLPT Level System

All content is organized across **5 JLPT proficiency levels**:

| Level | Proficiency | Kanji Known | Description |
|---|---|---|---|
| **N5** | Beginner | ~100 kanji | Basic hiragana, katakana, simple grammar |
| **N4** | Elementary | ~300 kanji | Basic kanji, everyday vocabulary |
| **N3** | Intermediate | ~650 kanji | Comfortable with everyday Japanese |
| **N2** | Pre-Advanced | ~1,000 kanji | Read and understand Japanese in daily situations |
| **N1** | Advanced | ~2,000 kanji | Master complex texts and formal writing |

---

## API Design

The backend API (to be implemented in `midori-be/`) follows RESTful conventions:

```
Base URL: /api/v1

Auth:
  POST   /auth/register
  POST   /auth/login
  POST   /auth/logout
  POST   /auth/forgot-password
  POST   /auth/reset-password
  POST   /auth/verify-otp

Users:
  GET    /users/me
  PUT    /users/me
  GET    /users/:id (admin)

Vocabulary:
  GET    /vocabulary/lessons
  GET    /vocabulary/lessons/:id
  GET    /vocabulary/lessons/:id/words
  POST   /vocabulary/progress (teacher/admin)

Grammar:
  GET    /grammar/categories
  GET    /grammar/categories/:id/structures
  POST   /grammar/structures (teacher/admin)

Listening:
  GET    /listening/exercises
  GET    /listening/exercises/:id
  POST   /listening/progress

Shadowing:
  GET    /shadowing/topics
  GET    /shadowing/topics/:id/conversations
  POST   /shadowing/progress

Flashcards:
  GET    /flashcards/decks
  GET    /flashcards/decks/:id/cards
  POST   /flashcards/sessions
  PUT    /flashcards/cards/:id

Exams:
  GET    /exams
  GET    /exams/:id
  POST   /exams/:id/attempt
  GET    /exams/attempts

AI Sensei:
  GET    /ai/conversations
  POST   /ai/conversations
  POST   /ai/conversations/:id/messages

Progress:
  GET    /progress/me
  GET    /progress/leaderboard
  GET    /progress/skills

Admin:
  GET    /admin/users
  PUT    /admin/users/:id/role
  GET    /admin/analytics
  POST   /admin/notifications
  GET    /admin/reports
  PUT    /admin/reports/:id
```

---

## Deployment

### Deploy to Cloudflare Workers

The project is pre-configured for Cloudflare Workers deployment using Wrangler.

#### 1. Login to Cloudflare

```bash
npx wrangler login
```

#### 2. Configure `wrangler.jsonc`

Update with your Cloudflare account details:

```jsonc
{
  "name": "midori-sensei",
  "compatibility_date": "2024-01-01",
  // ... additional config
}
```

#### 3. Deploy

```bash
npx wrangler deploy
```

#### 4. Configure environment variables on Cloudflare

```bash
npx wrangler secret put DATABASE_URL
npx wrangler secret put JWT_SECRET
npx wrangler secret put SESSION_SECRET
```

---

## Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Code Standards

- Use **TypeScript** for all new files
- Run `npm run lint` and `npm run format` before committing
- Follow the existing component patterns (shadcn/ui style)
- Write meaningful commit messages

---

## License

This project was created for **FPT University's SWP391 Course**. All rights reserved.

---

<p align="center">
  Made with ❤️ for Japanese language learners
  <br />
  🌸 日本語を勉強しましょう！ 🌸
</p>
