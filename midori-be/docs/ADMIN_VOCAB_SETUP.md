# MIDORI — Admin & Vocabulary Setup Documentation

This documentation covers the setup, configuration, and user flows specifically for the **Admin** and **Vocabulary** modules of the MIDORI platform.

---

## 1. Prerequisites

Before setting up the project, ensure you have the following software installed:

*   **Java JDK 17**: Required for building and running the Spring Boot backend.
*   **Maven 3.8+**: Required to build and run the backend.
*   **Node.js 18+** & **npm 9+**: Required for the frontend.

---

## 2. Backend Setup

The backend is a Spring Boot application running on port `8080`.

### Step 2.1: Local Configuration
Create a local configuration file by copying the template:
```powershell
cd midori-be
Copy-Item src/main/resources/application-local.example.yml src/main/resources/application-local.yml
```
Open [application-local.yml](../src/main/resources/application-local.yml) and configure your database connection and secrets:
*   `spring.datasource.url`: The JDBC URL to your PostgreSQL database (e.g. `jdbc:postgresql://aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require`).
*   `spring.datasource.username`: Your database user (e.g. `postgres.<project-id>`).
*   `spring.datasource.password`: Your database password.
*   `spring.mail.username` / `spring.mail.password`: Your Gmail SMTP sender and 16-character Gmail App Password (required for email verification).
*   `app.admin.password`: Custom local admin password (optional, e.g. `password: ${ADMIN_PASSWORD:ChangeMe123!}`).

> [!WARNING]
> Do not commit `application-local.yml` to Git. It contains database and SMTP passwords.

### Step 2.2: Run the Backend
Start the application under the `local` profile:
```powershell
cd midori-be
$env:SPRING_PROFILES_ACTIVE = "local"
mvn spring-boot:run "-Dspring-boot.run.profiles=local"
```
Or run the root automation script:
```powershell
.\scripts\run-backend-local.ps1
```
The backend server runs at: **http://localhost:8080**

---

## 3. Frontend Setup

The frontend is a React application built with Vite and TanStack Router.

### Step 3.1: Environment File
Create a local environment file:
```powershell
cd midori-fe
Copy-Item .env.example .env.local
```
Open [.env.local](../../midori-fe/.env.local) and populate the values:

*   `VITE_GOOGLE_CLIENT_ID`: Your Google OAuth Client ID (`YOUR_GOOGLE_CLIENT_ID`).
*   `VITE_SUPABASE_URL`: Your Supabase project URL (`https://YOUR_SUPABASE_PROJECT_REF.supabase.co`).
*   `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase anon key (for upload services).

### Step 3.2: Install Dependencies & Run
Install packages and start the frontend development server:
```powershell
cd midori-fe
npm install
npm run dev -- --port 8081
```
Or run the root automation script:
```powershell
.\scripts\run-frontend.ps1
```
The frontend is hosted at: **http://localhost:8081**

---

## 4. Default Admin Account

When the backend starts in the `local` profile, if no active administrator exists in the database, the system automatically bootstraps a default account using parameters in [AdminBootstrapProperties.java](../src/main/java/com/midori/config/AdminBootstrapProperties.java) and [AdminBootstrapConfig.java](../src/main/java/com/midori/config/AdminBootstrapConfig.java):

*   **Email**: `admin@midori.local`
*   **Password**: *Set through the `ADMIN_BOOTSTRAP_PASSWORD` environment variable*
*   **Role**: `ADMIN`
*   **Status**: `ACTIVE`

> [!IMPORTANT]
> *   If `ADMIN_PASSWORD` is set, the admin password will use that environment variable.
> *   For shared Supabase/dev database credentials, ask the team leader. Do not commit real passwords.

---

## 5. Admin Flow

Describes existing Admin functionality related to teacher approval and user list management.

```
Login
→ Admin Dashboard (/admin)
→ Teacher Applications (/admin/teachers)
→ Approve / Reject Teacher
```

### Key Flows:
1.  **Login**: Access `/login` and sign in with `admin@midori.local`.
2.  **Teacher Application Review**: Go to [admin.teachers.tsx](../../midori-fe/src/routes/admin.teachers.tsx). Review applications under the "Pending" list.
    *   **Inspect Certificates**: Open the certificate drawer to preview degrees and score reports (Images/PDFs).
    *   **Approve Application**: Actives the teacher account.
    *   **Reject Application**: Opens a modal to select rejection reasons (e.g. *Invalid certificate*, *Insufficient experience*).
3.  **User List Management**: Under [admin.users.tsx](../../midori-fe/src/routes/admin.users.tsx), search and filter users by role and status, and suspend or ban user accounts when necessary.

---

## 6. Teacher Vocabulary Flow

Describes vocabulary lesson management based on existing frontend routes.

```
Teacher Login
→ Teacher Dashboard (/teacher)
→ Vocabulary Management (/teacher/vocabulary)
→ View lesson list
→ Open lesson detail
→ Add/Edit/Delete words
```

### Key Flows:
1.  **Registration & Pending Approval**: Register as a teacher at `/register`. After email verification, the teacher remains locked at `/teacher-pending` until approved by the Admin.
2.  **Lesson Overview**: Under [teacher.vocabulary.tsx](../../midori-fe/src/routes/teacher.vocabulary.tsx), view existing vocabulary lessons. Use target JLPT levels (N5-N1) and topics to filter.
3.  **Create Lesson**: Click "Add lesson" to set title and JLPT level.
4.  **Manage Words**: Select a lesson to view/edit words in [teacher.vocabulary.tsx](../../midori-fe/src/routes/teacher.vocabulary.tsx):
    *   Add words with Japanese Kanji, Furigana reading, Romaji, English meaning, Topic tag, and Example sentence.
    *   Play text-to-speech pronunciation of the word (uses browser `speechSynthesis` API) to verify audio.
    *   Edit word properties or delete vocabulary words and lessons.

---

## 7. Student Vocabulary Flow

Describes vocabulary learning based on existing frontend routes.

```
Student Login
→ Vocabulary Selection (/student/vocabulary)
→ View lesson list
→ Open lesson detail
→ Study vocabulary
```

### Key Flows:
1.  **Explore Lessons**: Under [student.vocabulary.tsx](../../midori-fe/src/routes/student.vocabulary.tsx), select JLPT level (N5-N1) and topic filters. View matching lesson cards showing progress status and completed word counts.
2.  **Study Word List**: Click "Learn" on a lesson to see words:
    *   Review Kanji text, reading, Romaji translation, and example sentences.
    *   Click the audio icon to hear native pronunciation.
    *   Mark words as **Learning** or **Mastered** to update your memory status. The lesson's overall progress bar updates automatically.
    *   Filter the view to focus on favorited, new, or mastered words.
