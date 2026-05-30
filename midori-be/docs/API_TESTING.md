# MIDORI Backend - API Testing Guide

> **IMPORTANT:** Token verification/reset tokens are currently logged to console because email sending is not implemented yet. Check Spring Boot console logs to get tokens for testing.

## Prerequisites

1. **Database**: Ensure Supabase PostgreSQL is running and `schema.sql` has been executed.
2. **Environment**: Copy `application-local.example.yml` to `application-local.yml` and fill in real values.
3. **Start backend**: `mvn spring-boot:run` or run from IDE
4. **Base URL**: `http://localhost:8080/api`

## Test Flow

```
Register -> Verify Email -> Login -> [Profile/ChangePassword/Logout]
Forgot Password -> Reset Password -> Login
```

---

## 1. Register

**Endpoint:** `POST /api/auth/register`

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@midori.com",
    "password": "password123"
  }'
```

**Expected:** `201 Created`
```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "data": {
    "id": "uuid",
    "email": "test@midori.com",
    "role": "STUDENT",
    "status": "ACTIVE",
    "emailVerified": false,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**Note:** Check console logs for verification token:
```
Verification token generated for user test@midori.com: <TOKEN_HERE>
```

---

## 2. Verify Email

**Endpoint:** `POST /api/auth/verify-email`

```bash
curl -X POST http://localhost:8080/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<TOKEN_FROM_CONSOLE>"
  }'
```

**Expected:** `200 OK`
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": null
}
```

---

## 3. Login

**Endpoint:** `POST /api/auth/login`

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@midori.com",
    "password": "password123"
  }'
```

**Expected:** `200 OK`
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "<JWT_TOKEN>",
    "tokenType": "Bearer",
    "user": {
      "id": "uuid",
      "email": "test@midori.com",
      "role": "STUDENT",
      "status": "ACTIVE",
      "emailVerified": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  }
}
```

**Save the `accessToken`** for subsequent authenticated requests.

---

## 4. Get Current User (Auth Me)

**Endpoint:** `GET /api/auth/me`

```bash
curl -X GET http://localhost:8080/api/auth/me \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Expected:** `200 OK`

---

## 5. Get Profile

**Endpoint:** `GET /api/profiles/me`

```bash
curl -X GET http://localhost:8080/api/profiles/me \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Expected:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "displayName": "test",
    "avatarUrl": null,
    "bio": null,
    "phone": null,
    "location": null,
    "dateOfBirth": null,
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

---

## 6. Update Profile

**Endpoint:** `PUT /api/profiles/me`

```bash
curl -X PUT http://localhost:8080/api/profiles/me \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Midori User",
    "bio": "Learning Japanese",
    "phone": "+1234567890",
    "location": "Tokyo, Japan",
    "dateOfBirth": "2000-01-15"
  }'
```

**Expected:** `200 OK`

---

## 7. Change Password

**Endpoint:** `POST /api/auth/change-password`

```bash
curl -X POST http://localhost:8080/api/auth/change-password \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "password123",
    "newPassword": "newpassword456"
  }'
```

**Expected:** `200 OK`

---

## 8. Logout

**Endpoint:** `POST /api/auth/logout`

```bash
curl -X POST http://localhost:8080/api/auth/logout \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

**Expected:** `200 OK`

**Note:** This only returns success. Frontend must delete token from localStorage.

---

## 9. Forgot Password

**Endpoint:** `POST /api/auth/forgot-password`

```bash
curl -X POST http://localhost:8080/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@midori.com"
  }'
```

**Expected:** `200 OK`
```json
{
  "success": true,
  "message": "If that email exists, a reset link has been sent",
  "data": null
}
```

**Note:** Check console logs for reset token:
```
Password reset token generated for user test@midori.com: <TOKEN_HERE>
```

---

## 10. Reset Password

**Endpoint:** `POST /api/auth/reset-password`

```bash
curl -X POST http://localhost:8080/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "<TOKEN_FROM_CONSOLE>",
    "newPassword": "resetpassword789"
  }'
```

**Expected:** `200 OK`

---

## 11. Resend Verification Email

**Endpoint:** `POST /api/auth/resend-verification`

```bash
curl -X POST http://localhost:8080/api/auth/resend-verification \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@midori.com"
  }'
```

**Expected:** `200 OK`

---

## Error Scenarios

### Login without email verification
```json
{
  "success": false,
  "message": "Please verify your email before logging in"
}
```

### Login with wrong password
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### Expired verification token
```json
{
  "success": false,
  "message": "Verification token has expired"
}
```

### Change password with wrong current password
```json
{
  "success": false,
  "message": "Current password is incorrect"
}
```

---

## PostgreSQL Schema Setup

Run the following in Supabase SQL Editor:

```sql
-- Run the content of database/schema.sql
```

Or via psql:
```bash
psql "YOUR_SUPABASE_CONNECTION_STRING" -f database/schema.sql
```

---

## Environment Variables

Create a `.env` file (already in .gitignore):

```env
SUPABASE_DB_URL=jdbc:postgresql://<host>:<port>/<db>
SUPABASE_DB_USERNAME=<username>
SUPABASE_DB_PASSWORD=<password>
JWT_SECRET=<your_jwt_secret_at_least_32_chars>
JWT_ACCESS_TOKEN_EXPIRATION=86400000
TOKEN_EMAIL_VERIFICATION_EXPIRATION=86400
TOKEN_PASSWORD_RESET_EXPIRATION=3600
```
