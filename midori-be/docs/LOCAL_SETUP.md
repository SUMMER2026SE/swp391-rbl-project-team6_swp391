# Local Development Setup

Complete setup guide for team members to run MIDORI locally with full backend integration.

---

## Prerequisites

Install the following tools:

| Tool | Version | Notes |
|------|---------|-------|
| **Java** | 17+ | Required for Spring Boot backend |
| **Maven** | 3.8+ | Required to build and run Spring Boot |
| **Node.js** | 18+ | Required for frontend |
| **npm** | 9+ | Comes with Node.js |
| **Git** | any | For cloning the repository |
| **PowerShell** | 5+ | Comes with Windows 10/11 |

---

## 1. Clone the Repository

```bash
git clone <repository-url>
cd swp391-rbl-project-team6_swp391
```

---

## 2. Backend Setup

### 2a. Copy the config template

```powershell
# Navigate to backend resources
cd midori-be/src/main/resources

# Copy example config to local config
copy-item "application-local.example.yml" "application-local.yml"
```

### 2b. Fill in the secrets

Open `application-local.yml` and replace these placeholders:

| Field | Replace With | Example |
|-------|-------------|---------|
| `spring.datasource.url` | Your Supabase connection URL | `jdbc:postgresql://YOUR_SUPABASE_HOST:5432/postgres?sslmode=require` |
| `spring.datasource.username` | Your database username | `postgres.YOUR_PROJECT_REF` |
| `spring.datasource.password` | Your database password | Ask team leader |
| `spring.mail.username` | Gmail sender address | `your_email@gmail.com` |
| `spring.mail.password` | Gmail App Password | Ask team leader |
| `spring.mail.from` | Same as `spring.mail.username` | |
| `app.jwt.secret` | JWT signing secret (≥32 chars) | `YOUR_JWT_SECRET_AT_LEAST_32_CHARS` |
| `app.google.client-id` | Google OAuth Client ID | Ask team leader |
| `app.admin.password` | Local admin password | `ChangeMe123!` (default) |

> **Do not commit `application-local.yml`**. It is already in `.gitignore`.

---

## 3. Frontend Setup

### 3a. Copy the env template

```powershell
# Navigate to frontend
cd midori-fe

# Copy example env to local env
copy-item ".env.example" ".env.local"
```

### 3b. Fill in the secrets

Open `.env.local` and replace:

| Field | Replace With | Source |
|-------|-------------|--------|
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key | Ask team leader |

> **Do not commit `.env.local`**. It is already in `.gitignore`.

---

## 4. Run the Application

### 4a. Start the backend (Terminal 1)

```powershell
.\scripts\run-backend-local.ps1
```

Wait for:
```
Started MidoriBeApplication in X.XXX seconds
Tomcat started on port 8080
```

Backend URL: `http://localhost:8080`

### 4b. Start the frontend (Terminal 2)

```powershell
.\scripts\run-frontend.ps1
```

Wait for:
```
VITE ready in XXX ms
Local: http://localhost:8081/
```

Frontend URL: `http://localhost:8081`

> If port 8081 is already in use, Vite will automatically use the next available port (e.g. 8082). Check the terminal output for the actual URL.

---

## 5. Verify Setup

Navigate to `http://localhost:8081` and test these features:

| Feature | How to Test |
|---------|-------------|
| **Register** | Sign up with any email — you will receive an OTP |
| **Verify OTP** | Enter the 6-digit code sent to your email |
| **Login** | Use the verified account |
| **Google Login** | Click "Continue with Google" — must have `8081` added as Authorized JavaScript origin in Google Cloud Console |
| **Forgot Password** | Enter your email — you will receive a reset link |
| **Reset Password** | Click the link and set a new password |
| **Edit Profile** | Go to profile settings and change display name |
| **Upload Avatar** | Go to profile and upload a profile picture |
| **Remove Avatar** | In profile settings, remove the uploaded avatar |
| **Change Password** | In profile settings, change your password |

---

## Troubleshooting

### Port 8080 already in use

Another process is using port 8080. Find and kill it:

```powershell
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

Then restart the backend.

### Frontend runs on port 8082 instead of 8081

Vite auto-selects the next available port. This is normal. Check the terminal output for the actual URL.

If you want to force port 8081, kill whatever is using it first:

```powershell
netstat -ano | findstr :8081
taskkill /PID <PID> /F
```

### Google Login — `invalid_client` error

The `VITE_GOOGLE_CLIENT_ID` in `.env.local` is incorrect or missing.

1. Verify `.env.local` contains:
   ```
   VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
   ```
   Ask your team leader for the Google OAuth Client ID.
2. Verify the frontend URL (`8081` or `8082`) is added as **Authorized JavaScript origin** in [Google Cloud Console](https://console.cloud.google.com) under **APIs & Services > Credentials > OAuth 2.0 Client IDs**.
3. Restart the frontend after fixing `.env.local`.

### Supabase avatar — `failed to fetch` or 403

Check your `.env.local`:

1. `VITE_SUPABASE_URL` must be:
   ```
   https://YOUR_SUPABASE_PROJECT_REF.supabase.co
   ```
   Ask your team leader for the Supabase project reference.
2. `VITE_SUPABASE_PUBLISHABLE_KEY` must be the **anon/public key** (starts with `eyJ...`), not the service role key.
3. The `avatars` bucket must exist in Supabase and have **public** read access.
4. Restart the frontend after fixing `.env.local`.

### OTP email not received

1. Verify `mail.username` and `mail.password` in `application-local.yml`.
2. The `mail.password` must be a **Gmail App Password** (16 characters), not your Gmail account password.
3. Generate an App Password at [Google Account > Security > App passwords](https://myaccount.google.com/apppasswords).
4. Restart the backend after fixing `application-local.yml`.

### YAML — `DuplicateKeyException` or parsing error

This usually means wrong indentation. YAML is indentation-sensitive.

- Use **2 spaces** (not tabs) for indentation.
- Do not mix spaces and tabs.
- Do not add trailing spaces after values.

---

## Security Checklist

**Never commit these files:**

- `midori-be/src/main/resources/application-local.yml`
- `midori-fe/.env.local`
- Any file containing real passwords, tokens, or secrets

**Verify before committing:**

```powershell
git status --short
git check-ignore -v midori-be/src/main/resources/application-local.yml
git check-ignore -v midori-fe/.env.local
```

Both commands should return a path — if they return nothing, the file is **not ignored** and must not be committed.

---

## Smoke Test Before Commit

Before committing, run the smoke test suite to catch config errors and leaked secrets:

```powershell
.\scripts\test\smoke-all.ps1
```

**Requirements:**
- `smoke-frontend.ps1` — No backend needed
- `smoke-backend.ps1` — **Backend must be running first** (`.\scripts\run-backend-local.ps1`)
- `check-secrets.ps1` — No backend needed

For more details, see [README.md](README.md).

---

## Need Help?

Ask the team leader for the secret values listed in `docs/TEAM_ENV_TEMPLATE.md`.
