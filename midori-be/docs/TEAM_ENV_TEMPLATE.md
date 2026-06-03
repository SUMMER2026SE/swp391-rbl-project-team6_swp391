# Team Environment Variables

This document lists all secret values team members need to obtain from the team leader.

**Do not commit this file with real values.**

---

## Backend Secrets (`application-local.yml`)

| Variable Name | YAML Path | Description |
|---------------|-----------|-------------|
| `SUPABASE_DB_PASSWORD` | `spring.datasource.password` | Supabase PostgreSQL database password for local development |
| `GMAIL_SENDER` | `spring.mail.username` | Gmail address used to send OTP and password reset emails |
| `GMAIL_APP_PASSWORD` | `spring.mail.password` | Gmail App Password (16 characters, generated from Google Account > Security > App passwords) |

---

## Frontend Secrets (`midori-fe/.env.local`)

| Variable Name | Env Variable | Description |
|---------------|--------------|-------------|
| Supabase anon key | `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable/anon key for avatar upload (frontend-safe, read-only) |

---

## How to Request Secrets from Team Leader

Message the team leader privately with:

```
Hi, I need the following secrets for local development:

1. SUPABASE_DB_PASSWORD  — Supabase dev DB password
2. GMAIL_SENDER          — Gmail address for OTP sending
3. GMAIL_APP_PASSWORD    — Gmail App Password
4. VITE_SUPABASE_PUBLISHABLE_KEY — Supabase anon key for frontend
```

> **Important:** Never share these values in group chats or commit them to the repository.

---

## Getting Gmail App Password

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Navigate to **Security**
3. Enable **2-Step Verification** if not already enabled
4. Go to **App passwords**
5. Select app: "Mail", Select device: "Other (Custom name)"
6. Enter "MIDORI Local Dev" and click **Generate**
7. Copy the 16-character password shown
8. Use this as `mail.password` in `application-local.yml`

---

## Supabase Anon Key

1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/clyuyvdaoprxrpmrcyhd)
2. Navigate to **Settings > API**
3. Copy the `anon` public key under **Project API keys**
4. Paste into `.env.local` as `VITE_SUPABASE_PUBLISHABLE_KEY`

The anon key starts with `eyJ...` and is safe to use in the frontend (read-only permissions).
