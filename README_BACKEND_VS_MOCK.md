# MIDORI Backend vs. Frontend Integration & Testing Guide

This documentation outlines the planned and completed responsibilities for the MIDORI platform, details setup instructions, and describes the testing procedures for key modules.

---

## 1. Backend Modules

### Grammar API
Provides a full interface for managing grammar rules across JLPT levels.
- **Data Support**:
  - `level` (N5 to N1)
  - `pattern`
  - `meaning`
  - `structure`
  - `usage`
  - `examples`
- **Implementation**: Fully implemented with DB entities, JPA repositories, services, controllers, and database migration SQL. Many frontend modules depend directly on this API.

### Study Progress API
Tracks the student's progress and activity status throughout the learning process.
- **Data Support**:
  - Completed lessons count
  - Learned words count
  - Mastered words count
  - Favorites tracking
  - Progress percent per user

### Flashcard API
Provides set-based flashcard utilities.
- **Data Support**:
  - CRUD operations for flashcard sets
  - CRUD operations for individual flashcard cards
  - Teacher management interface (set creation and editing)
  - Student learning flow (retrieving sets and running session reviews)

### Teacher Certificates API
Allows persistent teacher validation.
- **Data Support**:
  - Teacher credentials and verification certificate uploads are saved to persistent storage, ensuring all data and files survive page reloads.

### Content Approval API
Handles moderation workflows for new study material before it goes live.
- **Data Support**:
  - Status transitions: `PENDING`, `APPROVED`, `REJECTED`
  - Custom `rejection reason` text fields
- **Note**: Grammar approval has a higher priority. Moderation and approval interfaces for vocabulary and flashcard sets are planned for expansion in a later release.

---

## 2. Frontend Integrations

### Teacher Grammar
- **API Features**: Supports retrieving (`GET`), creating (`POST`), updating (`PUT`), deleting (`DELETE`), and submitting (`POST` to transition status) grammar sets and rules.

### Student Grammar
- **API Features**: Supports list views, details views, and full search/filter capabilities by JLPT levels (N5–N1).

### Teacher Flashcards
- **API Features**: Supports CRUD operations on flashcard sets (Create, Read, Update, Delete set), adding cards, editing cards, deleting cards, and submitting the completed set for moderation.

### Student Progress
- **API Features**: Maps to the Study Progress API to load and toggle:
  - `learned` state
  - `mastered` state
  - `favorite` state

### Student Flashcards
- **API Features**: Fully utilizes the backend Flashcard APIs instead of browser `localStorage`.

### Vocabulary Progress
- **API Features**: Fully integrates with the Study Progress APIs to record and load vocabulary progress instead of relying on mock data.

### Teacher Certificates
- **API Features**: Uses the backend APIs to persist uploaded certifications so data remains intact after page reloads.

### Teacher Submit Flow
- **API Features**: Supports moderation status tags across all created items:
  - `Draft`
  - `Pending`
  - `Approved`
  - `Rejected`

### Content Approval
- **Moderator Features**: Administrators and moderators can approve content, reject content, and supply a detailed rejection reason.
- **Note**: The moderation page is distinct from `admin.moderation.tsx` (which is designated specifically for user report moderation).

---

## 3. Demo / Mock Modules

The following modules remain client-side mock implementations or use demo behavior:
- **Listening** (dictation exercises)
- **Shadowing** (AI speaking feedback)
- **Exams** (mock test runs)
- **Leaderboard** (ranking simulations)
- **AI Sensei** (Q&A conversation chatbot)

*All of these modules include proper Loading, Empty, and Error states in their respective interfaces.*

---

## 4. Profile Pages

The user profile pages support:
- **Loading State**: Displays skeleton indicators while reading profile parameters.
- **Empty State**: Renders fallbacks if display name, bio, or avatar properties are missing.
- **Success State**: Shows clear confirmation alerts upon successful updates.
- **Error State**: Shows inline validation and error notices if server requests fail.
- **Data Details**:
  - Student statistics can query the backend Study Progress API.
  - Administrator actions, permissions, and history logs may fall back to local mock representations if backend endpoints are unavailable.

---

## 5. Running the Project

### Option A: Using PowerShell Scripts
1. Run the backend locally:
   ```powershell
   .\scripts\run-backend-local.ps1
   ```
2. Run the frontend:
   ```powershell
   .\scripts\run-frontend.ps1
   ```

### Option B: Manual Commands
- **Backend Setup**:
  1. Initialize config file:
     ```bash
     cp midori-be/src/main/resources/application-local.example.yml midori-be/src/main/resources/application-local.yml
     ```
  2. Edit credentials in `application-local.yml`.
  3. Start the application:
     ```bash
     cd midori-be
     mvn spring-boot:run "-Dspring-boot.run.profiles=local"
     ```
- **Frontend Setup**:
  1. Initialize env parameters:
     ```bash
     cp midori-fe/.env.example midori-fe/.env.local
     ```
  2. Install modules and start the dev server:
     ```bash
     cd midori-fe
     npm install
     npm run dev -- --port 8081
     ```

---

## Basic Test Commands

Backend:

```bash
cd midori-be
mvn test
```

Frontend build check:

```bash
cd midori-fe
npm run build
```

---

## Local Config Warning

IMPORTANT: Never commit `midori-be/src/main/resources/application-local.yml` or `midori-fe/.env.local`.

These files are local-only configuration files and may contain sensitive credentials such as database URL, Gmail app password, JWT secret, Google OAuth client ID, and Supabase keys.

They must stay ignored by Git.

---

## 6. Manual Testing & Verification

### Grammar
1. Log in as a Teacher, navigate to `/teacher/grammar`, create a grammar rule, and click **Submit**.
2. Log in as Admin, navigate to the content approval page, approve the grammar rule.
3. Log in as Student, verify that the pattern is visible under `/student/grammar` and sorted correctly.

### Progress
1. Open any vocabulary or grammar rule detail as a student.
2. Mark the item as learned, mastered, or favorite.
3. Reload the browser and verify that the status tags survive the hydration step. Check `/student/progress` to see XP update.

### Flashcards
1. Create a flashcard set and add cards under `/teacher/flashcards`. Click **Submit set**.
2. Moderate the set from the admin dashboard.
3. Open the set under `/student/flashcards`, run the study loops (Flashcard, Quiz, and Random), and mark cards as mastered. Verify progress persists.

### Certificates
1. Navigate to `/teacher/certificates`, upload a certificate, and save.
2. Reload the page to ensure the certification status (e.g. pending/verified) persists.

### Content Approval
1. Access the approval queue under the admin dashboard.
2. Moderate a pending grammar rule or flashcard set. Click **Reject** and supply a rejection reason.
3. Access the item from the teacher dashboard to verify it has transitioned to `Rejected` with the moderator notes visible.
