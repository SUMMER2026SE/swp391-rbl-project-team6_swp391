# EMERGENCY SECRET INCIDENT AUDIT REPORT

## 1. Executive Summary
This report summarizes the findings of an emergency repository-wide secret incident response. An audit was conducted on the current source tree and the complete Git history (1,079 commits) across all branches and tags. 

A total of **11 unique hardcoded secrets** were identified. All active secrets in the current tracked HEAD source tree have been successfully removed and replaced with secure environment-variable references. However, because these secrets were previously committed, they remain exposed in the repository's Git history and must be rotated immediately.

## 2. Incident Scope
- **Target Repository:** `swp391-rbl-project-team6_swp391`
- **Git History Scope:** All reachable commits across all branches (local and remote) and tags (1,079 commits scanned).
- **Source Tree Scope:** All tracked files in the current HEAD branch (`main`).

## 3. Known Affected Commits
- `329211235a6a99e8140f36c44b54797d85929057`
- `74fc605`
- `08047785a03915c7d2aa892091d6f611029b3452`
- `84e2e146cb00e144acaf71b7365c729f6c938aa1` (Stripe key exposure)

## 4. Current-Tree Scan Results
- **Status:** **REMEDIATED**
- **Tracked Files with Secrets:** **0** (Verified via automated tracked-head scans).
- All hardcoded configurations in `application.yml` have been refactored to use environment variable placeholders.

## 5. Historical Scan Results
- **Status:** **EXPOSED**
- Secrets remain in historical commits and branch tracking logs. They are reachable on `origin/main` and several active feature branches.

## 6. Unique Incident Inventory

| Incident ID | Provider / Type | Masked Value | SHA-256 Fingerprint | Severity | Present in HEAD | First Commit | Latest Commit |
|---|---|---|---|---|---|---|---|
| **SEC-001** | PostgreSQL Database | `Midori...ong!` | `sha256:e9973006...` | **CRITICAL** | No | `32921123` | `32921123` |
| **SEC-002** | Gmail SMTP Application | `gsdosa...cewf` | `sha256:328a939b...` | **HIGH** | No | `32921123` | `32921123` |
| **SEC-003** | Supabase Service Role Key | `sb_sec...kGZh` | `sha256:2885f712...` | **CRITICAL** | No | `08047785` | `32921123` |
| **SEC-004** | Groq API Key 1 | `gsk_iJ...mZo4` | `sha256:4e6d566a...` | **HIGH** | No | `08047785` | `32921123` |
| **SEC-005** | Groq API Key 2 | `gsk_aF...lxmC` | `sha256:c8999c15...` | **HIGH** | No | `32921123` | `32921123` |
| **SEC-006** | Gemini API Key 1 | `AQ.Ab8...8fnQ` | `sha256:09525edb...` | **HIGH** | No | `32921123` | `32921123` |
| **SEC-007** | Gemini API Key 2 | `AQ.Ab8...nGqg` | `sha256:6945ec85...` | **HIGH** | No | `32921123` | `32921123` |
| **SEC-008** | Gemini API Key 3 | `AQ.Ab8...Bksg` | `sha256:7c1fedcd...` | **HIGH** | No | `32921123` | `32921123` |
| **SEC-009** | Gemini API Key 4 | `AIzaSy...hJlw` | `sha256:447351cb...` | **HIGH** | No | `32921123` | `32921123` |
| **SEC-010** | OpenRouter API Key | `sk-or-...1a88` | `sha256:93b682d7...` | **HIGH** | No (Local-only) | N/A | N/A |
| **SEC-011** | Stripe Live Key | `sk_liv...dori` | `sha256:b869e938...` | **HIGH** | No | `84e2e146` | `84e2e146` |

## 7. Severity Breakdown
- **CRITICAL:** **2** (Database password, Supabase service role key)
- **HIGH:** **9** (API keys for Gemini, OpenRouter, Groq, Stripe, and SMTP credentials)
- **MEDIUM / INFORMATIONAL:** **0**

## 8. Provider Ownership Status
All identified secrets belong to external integration dashboards (Google AI Studio, OpenAI, Supabase, Groq, Stripe, Google Account App Passwords).

## 9. Manual Revocation & Rotation Checklist

- [ ] **SEC-001 — PostgreSQL Database Password**
  - **Provider:** Supabase Database / Project Dashboard
  - **Action:** Rotate database user password via the Supabase Dashboard -> Database -> Settings.
  - **Deployment Update:** Configure `DATABASE_PASSWORD` environment variable in the host environment.
  - **Redeployment:** Restart backend container/services to bind the new password.

- [ ] **SEC-002 — Gmail SMTP Application Password**
  - **Provider:** Google Account Security (dathatinh2005aa@gmail.com)
  - **Action:** Delete the app password in Google Account settings -> Security -> App passwords, and create a new one.
  - **Deployment Update:** Set the `SPRING_MAIL_PASSWORD` environment variable.

- [ ] **SEC-003 — Supabase Service Role Key**
  - **Provider:** Supabase Project Settings
  - **Action:** Rotate JWT secret / service-role key in API Settings. Note that rotating the JWT secret will invalidate all current user sessions.
  - **Deployment Update:** Update `SUPABASE_SERVICE_ROLE_KEY` in the environment.

- [ ] **SEC-004 & SEC-005 — Groq API Keys**
  - **Provider:** Groq Console
  - **Action:** Revoke both keys from the API Keys tab in Groq Console and create replacements.
  - **Deployment Update:** Update `GROQ_API_KEYS` / `GROQ_API_KEY` in the environment.

- [ ] **SEC-006 to SEC-009 — Gemini / Google AI Studio API Keys**
  - **Provider:** Google Cloud Console / Google AI Studio
  - **Action:** Revoke all 4 exposed keys immediately in Google AI Studio key manager or Cloud Console Credentials.
  - **Deployment Update:** Update `GEMINI_API_KEYS` / `GEMINI_API_KEY` in the environment.

- [ ] **SEC-010 — OpenRouter API Key**
  - **Provider:** OpenRouter Dashboard
  - **Action:** Delete the key `sk-or-v1-...` and generate a new one.
  - **Deployment Update:** Update `OPENROUTER_API_KEY` in the local development `.env` environment.

- [ ] **SEC-011 — Stripe Live Key**
  - **Provider:** Stripe Dashboard
  - **Action:** Go to Developers -> API Keys, roll the live key immediately. Verify Stripe dashboard logs for unauthorized API calls.

## 10. Files Remediated
- `midori-be/src/main/resources/application.yml`
- `midori-be/src/main/java/com/midori/config/AdminBootstrapProperties.java`
- `midori-be/src/main/java/com/midori/config/AdminBootstrapConfig.java`
- `.gitignore`
- `midori-be/.env.example` (Added)
- `replacements.example.txt` (Added)

## 11. Environment-Variable Mapping

| Configuration Property | Environment Variable | Default Value | Description |
|---|---|---|---|
| `spring.datasource.password` | `DATABASE_PASSWORD` | *(None)* | PostgreSQL password |
| `spring.mail.password` | `SPRING_MAIL_PASSWORD` | *(None)* | SMTP Gmail App password |
| `supabase.service-role-key` | `SUPABASE_SERVICE_ROLE_KEY` | *(None)* | Supabase Service Role Key |
| `groq.api-keys` | `GROQ_API_KEYS` | *(None)* | Groq API keys fallback string |
| `groq.api-key` | `GROQ_API_KEY` | *(None)* | Primary Groq API Key |
| `ai.gemini.api-keys` | `GEMINI_API_KEYS` | *(None)* | Gemini API keys fallback string |
| `ai.gemini.api-key` | `GEMINI_API_KEY` | *(None)* | Primary Gemini API Key |
| `app.admin.password` | `ADMIN_BOOTSTRAP_PASSWORD` | *(None)* | Local administrator bootstrap password |

## 12. Build and Test Results
- **Status:** **SUCCESS**
- Compiled and verified locally with command: `mvn clean test-compile -f midori-be/pom.xml` (Successfully compiled 587 source files and 53 test files).

## 13. Remaining Git History Exposure
Remediating the current tracked source tree prevents secrets from leaking in *future* commits, but **does not erase them from the existing Git history**. Any user who clones the repository can checkout previous commits (e.g. `329211235a6` or `84e2e146cb0`) and recover the exposed keys.

## 14. Owner Actions Required
1. **Revoke and Rotate** all 11 unique credentials immediately.
2. Configure environment variables in production and local systems.
3. Merge the current-source remediation PR.
4. Perform a coordinated rewrite of the Git history.

## 15. Coordinated History Rewrite Plan
To completely remove the secrets from history, use the `git-filter-repo` tool:

1. Coordinate with all team members to freeze merges and pause updates.
2. Obtain a fresh, complete mirror clone of the repository:
   ```bash
   git clone --mirror https://github.com/SUMMER2026SE/swp391-rbl-project-team6_swp391.git repo-mirror
   cd repo-mirror
   ```
3. Prepare a local `replacements.txt` mapping each exact secret to a placeholder:
   ```text
   literal:exact_secret_value_1==>[REMOVED_DB_PASSWORD]
   literal:exact_secret_value_2==>[REMOVED_SMTP_PASSWORD]
   ...
   ```
   *(Ensure replacements.txt is kept outside the repository directories to avoid committing it).*
4. Run `git-filter-repo` to replace text across all commits, branches, and tags:
   ```bash
   git filter-repo --replace-text ../replacements.txt --force
   ```
5. Force push the cleaned mirror back to origin (requires administrative privileges):
   ```bash
   git push origin --force --all
   git push origin --force --tags
   ```
6. Instruct all developers to delete their local clones and perform a fresh clone of the cleaned repository.

## 16. Post-Rewrite Verification Plan
After the history rewrite has been pushed, re-run `verify_tracked_head.py` and `detailed_audit.py` to confirm that the history scan reports zero hits for all previously exposed values.
