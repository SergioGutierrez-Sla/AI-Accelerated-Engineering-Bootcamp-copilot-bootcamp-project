# Feature: User Authentication

> **File:** `docs/feature-001-user-authentication.md`  
> **Status:** Draft  
> **Date:** 2026-07-03

---

## 1. Feature Overview

**Feature Name:**  
User Authentication (Registration, Login, Password Reset)

**Summary:**  
This feature enables users to create an account, verify their email, log in with email and password, and reset their password via an email link. Authentication is JWT-based, passwords are hashed with BCrypt (cost ≥ 12), and two roles are supported: `ROLE_USER` (default) and `ROLE_ADMIN`. This feature is the security foundation for all protected areas of the application.

---

## 2. User Story

- As a **guest**, I want **to register with my email and password** so that **I can create an account and access the application**.
- As a **registered user**, I want **to verify my email address** so that **my account becomes active and I can log in**.
- As an **active user**, I want **to log in with my email and password** so that **I can access protected parts of the application**.
- As a **logged-in user**, I want **to log out** so that **my session is terminated and my account is secure**.
- As a **user who has forgotten their password**, I want **to receive a time-limited reset link by email** so that **I can set a new password and regain access**.
- As an **admin**, I want **my elevated role to be encoded in the JWT** so that **the application can enforce role-based access control**.

---

## 3. Functional Requirements

- **FR1:** The system must allow a guest to submit a first name, last name, email address, and password to register. Email must be a valid format. Password must be at least 8 characters, contain at least one uppercase letter, one lowercase letter, and one digit.
- **FR2:** The system must reject registration if the submitted email address is already associated with an existing account, returning a 409 Conflict response.
- **FR3:** On successful registration, the system must hash the password using BCrypt with a cost factor of at least 12 before persisting it. The plain-text password must never be stored or logged.
- **FR4:** On successful registration, the system must send an email verification message to the provided email address containing a unique, time-limited token (expires in 24 hours). The account is created in an **inactive** state until the email is verified.
- **FR5:** The system must expose an endpoint to verify an email address using the token from the verification email. On valid, non-expired token, the account is marked active.
- **FR6:** If the email verification token has expired or is invalid, the system must return a 400 Bad Request response with a descriptive error message. The user must be able to request a new verification email.
- **FR7:** The system must allow an active user to submit their email and password to log in. The system must validate that the email exists and that the BCrypt-hashed stored password matches the submitted password.
- **FR8:** The system must reject login attempts for accounts that are inactive (email not yet verified), returning a 403 Forbidden response with a clear error message distinct from invalid credentials.
- **FR9:** On successful login, the system must return a signed JWT token containing the user's ID, email, and role (`ROLE_USER` or `ROLE_ADMIN`). The JWT must be signed using HS256 with a secret of at least 256 bits and expire after 1 hour.
- **FR10:** Logout is handled client-side by discarding the JWT token. The backend does not maintain server-side session state (stateless JWT).
- **FR11:** The system must allow a user to submit their email address to request a password reset. A unique, single-use, time-limited token (expires in 1 hour) must be generated and sent to the provided email address as a link.
- **FR12:** The password reset email link must point to the frontend reset page and include the token as a query parameter (e.g., `/reset-password?token=<token>`).
- **FR13:** The system must expose an endpoint to accept a password reset token and a new password. The token must be validated (exists, not expired, not already used). On valid token, the password is updated (BCrypt hashed) and the token is marked as used.
- **FR14:** If the password reset token has expired, is invalid, or has already been used, the system must return a 400 Bad Request response with a descriptive error message.
- **FR15:** On registration, the user's role is always set to `ROLE_USER`. `ROLE_ADMIN` must be assigned manually (out of scope for this feature).

---

## 4. Non-Functional Requirements

- **NFR1 (Performance):** All authentication endpoints (`/api/auth/*`) must respond within 500ms under normal load (up to 50 concurrent users).
- **NFR2 (Security):** Passwords must be hashed with BCrypt at a cost factor ≥ 12. Passwords must never be logged or included in any response body. JWT secrets must be ≥ 256 bits and stored as environment variables, never committed to the repository. Password reset tokens and email verification tokens must be single-use and time-limited. Error responses for login must not reveal whether the email exists or not (use a generic "Invalid email or password" message).
- **NFR3 (Usability):** Error messages must be specific enough to guide the user (e.g., distinguish "Email not verified — please check your inbox" from "Invalid email or password"). Form validation feedback must appear inline before the API call is made.
- **NFR4 (Reliability):** Email sending must be handled asynchronously so that a transient email-service failure does not cause the registration or password reset endpoint to return an error to the user. Failed email sends must be logged.
- **NFR5 (Compliance):** The implementation must follow OWASP Top 10 best practices, in particular: A02 (Cryptographic Failures — BCrypt), A07 (Identification and Authentication Failures — rate limiting is an open question), A09 (Security Logging — no sensitive data in logs).

---

## 5. API Requirements (Backend)

### 5.1 Endpoints

---

**Endpoint 1: Register**

- **Method & Path:** `POST /api/auth/register`
- **Description:** Creates a new inactive user account and sends a verification email.
- **Authentication:** Not required.
- **Request Body:**
  ```json
  {
    "firstName": "string",
    "lastName": "string",
    "email": "user@example.com",
    "password": "string"
  }
  ```
- **Response Body (Success — 201 Created):**
  ```json
  {
    "message": "Registration successful. Please check your email to verify your account."
  }
  ```
- **Status Codes:**
  - `201 Created` – Account created, verification email sent.
  - `400 Bad Request` – Validation failure (invalid email format, weak password).
  - `409 Conflict` – Email address already registered.
  - `500 Internal Server Error` – Unexpected server error.
- **Error Handling:**
  ```json
  {
    "timestamp": "2026-07-03T10:00:00Z",
    "status": 409,
    "error": "Conflict",
    "message": "An account with this email address already exists.",
    "path": "/api/auth/register"
  }
  ```

---

**Endpoint 2: Verify Email**

- **Method & Path:** `GET /api/auth/verify-email?token={token}`
- **Description:** Activates a user account using the token sent in the verification email.
- **Authentication:** Not required.
- **Request Body:** None.
- **Response Body (Success — 200 OK):**
  ```json
  {
    "message": "Email verified successfully. You can now log in."
  }
  ```
- **Status Codes:**
  - `200 OK` – Account activated.
  - `400 Bad Request` – Token invalid, expired, or already used.
  - `500 Internal Server Error` – Unexpected server error.
- **Error Handling:**
  ```json
  {
    "timestamp": "2026-07-03T10:00:00Z",
    "status": 400,
    "error": "Bad Request",
    "message": "Verification token is invalid or has expired.",
    "path": "/api/auth/verify-email"
  }
  ```

---

**Endpoint 3: Login**

- **Method & Path:** `POST /api/auth/login`
- **Description:** Authenticates an active user and returns a signed JWT token.
- **Authentication:** Not required.
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "password": "string"
  }
  ```
- **Response Body (Success — 200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJIUzI1NiJ9...",
    "expiresIn": 3600,
    "role": "ROLE_USER"
  }
  ```
- **Status Codes:**
  - `200 OK` – Login successful.
  - `400 Bad Request` – Missing or malformed fields.
  - `401 Unauthorized` – Invalid email or password.
  - `403 Forbidden` – Account exists but email is not verified.
  - `500 Internal Server Error` – Unexpected server error.
- **Error Handling:**
  ```json
  {
    "timestamp": "2026-07-03T10:00:00Z",
    "status": 401,
    "error": "Unauthorized",
    "message": "Invalid email or password.",
    "path": "/api/auth/login"
  }
  ```

---

**Endpoint 4: Request Password Reset**

- **Method & Path:** `POST /api/auth/password-reset/request`
- **Description:** Generates a single-use password reset token and sends a reset link to the provided email. Returns the same success message regardless of whether the email exists (to prevent email enumeration).
- **Authentication:** Not required.
- **Request Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response Body (Success — 200 OK):**
  ```json
  {
    "message": "If an account with that email exists, a password reset link has been sent."
  }
  ```
- **Status Codes:**
  - `200 OK` – Always returned (email enumeration prevention).
  - `400 Bad Request` – Invalid email format.
  - `500 Internal Server Error` – Unexpected server error.

---

**Endpoint 5: Confirm Password Reset**

- **Method & Path:** `POST /api/auth/password-reset/confirm`
- **Description:** Validates the reset token and updates the user's password.
- **Authentication:** Not required.
- **Request Body:**
  ```json
  {
    "token": "string",
    "newPassword": "string"
  }
  ```
- **Response Body (Success — 200 OK):**
  ```json
  {
    "message": "Password reset successfully. You can now log in with your new password."
  }
  ```
- **Status Codes:**
  - `200 OK` – Password updated.
  - `400 Bad Request` – Token invalid, expired, or already used; or new password fails validation.
  - `500 Internal Server Error` – Unexpected server error.
- **Error Handling:**
  ```json
  {
    "timestamp": "2026-07-03T10:00:00Z",
    "status": 400,
    "error": "Bad Request",
    "message": "Password reset token is invalid or has expired.",
    "path": "/api/auth/password-reset/confirm"
  }
  ```

---

## 6. UI Requirements (Frontend)

### 6.1 Screens / Pages

---

**Screen: RegisterPage**

- **Route:** `/register`
- **Description:** Allows a guest to create a new account.
- **Components:**
  - `RegisterForm` – Form with fields: First Name, Last Name, Email, Password, Confirm Password.
  - `PasswordStrengthIndicator` – Visual feedback on password strength.
  - `ErrorAlert` – Displays server-side error messages.
- **States:**
  - Idle: Form visible, all fields empty, no errors.
  - Loading: Submit button disabled, spinner shown.
  - Error: Inline field errors (validation) or alert banner (server error, e.g., duplicate email).
  - Success: Success message shown — "Check your email to verify your account." Navigation to `/login` offered.

---

**Screen: LoginPage**

- **Route:** `/login`
- **Description:** Allows an active user to authenticate.
- **Components:**
  - `LoginForm` – Form with Email and Password fields.
  - `ErrorAlert` – Displays authentication error messages.
- **States:**
  - Idle: Form visible, no errors.
  - Loading: Submit button disabled, spinner shown.
  - Error: Error alert shown (invalid credentials or unverified account).
  - Success: JWT stored in memory/localStorage; user redirected to `/dashboard`.

---

**Screen: EmailVerificationPage**

- **Route:** `/verify-email`
- **Description:** Landing page for users who click the verification link in their email. Reads the `token` query parameter and calls the verify endpoint automatically on mount.
- **Components:**
  - `VerificationStatusCard` – Shows loading, success, or error state.
- **States:**
  - Loading: "Verifying your email…" with spinner shown.
  - Success: "Email verified! You can now log in." with link to `/login`.
  - Error: "The verification link is invalid or has expired." with option to request a new one.

---

**Screen: ForgotPasswordPage**

- **Route:** `/forgot-password`
- **Description:** Allows a user to request a password reset email.
- **Components:**
  - `ForgotPasswordForm` – Single email input field.
  - `SuccessMessage` – Shown after submission regardless of email existence.
- **States:**
  - Idle: Form visible.
  - Loading: Submit button disabled, spinner shown.
  - Success: "If an account with that email exists, a reset link has been sent. Check your inbox."
  - Error: Only shown for network/server errors.

---

**Screen: ResetPasswordPage**

- **Route:** `/reset-password`
- **Description:** Allows a user to set a new password using the token from the reset email. Reads `token` from query parameters.
- **Components:**
  - `ResetPasswordForm` – New Password and Confirm New Password fields.
  - `ErrorAlert` – Displayed for invalid/expired token or password validation failure.
- **States:**
  - Idle: Form visible.
  - Loading: Submit button disabled, spinner shown.
  - Success: "Your password has been reset. You can now log in." with link to `/login`.
  - Error: Error message for invalid/expired token or mismatched passwords.

### 6.2 Interactions

- **Registration:**
  - Client validates all fields before submitting (non-empty, valid email format, password ≥ 8 chars with uppercase, lowercase, and digit, passwords match).
  - On `POST /api/auth/register` success (201), display success message.
  - On 409, display "An account with this email already exists."
  - On 400, display field-level validation errors from the response.

- **Login:**
  - Client validates non-empty email and password before submitting.
  - On `POST /api/auth/login` success (200), store JWT token and navigate to `/dashboard`.
  - On 401, display "Invalid email or password."
  - On 403, display "Your email address has not been verified. Please check your inbox."
  - "Forgot password?" link navigates to `/forgot-password`.

- **Email Verification:**
  - On page load, extract `token` from URL query params and call `GET /api/auth/verify-email?token=…`.
  - Show loading spinner during the call.
  - On success, show success state and link to `/login`.
  - On error, show error state with a "Resend verification email" button (out of scope for v1 — noted as open question).

- **Password Reset Request:**
  - Validate non-empty, valid-format email before submitting.
  - Always show success message after submission regardless of API outcome (mirrors backend behavior).

- **Password Reset Confirmation:**
  - Validate new password meets strength requirements and matches confirm field before submitting.
  - On success, show success state and link to `/login`.
  - On 400 (invalid/expired token), display error and link to `/forgot-password` to start over.

---

## 7. Acceptance Criteria

- **AC1:** Given a guest submits valid registration details (unique email, strong password), when the form is submitted, then the system creates an inactive account, sends a verification email, and the frontend displays a success message.
- **AC2:** Given a guest submits a registration form with an already-registered email, when the form is submitted, then the system returns 409 and the frontend displays "An account with this email already exists."
- **AC3:** Given a guest submits a registration form with a weak password (fewer than 8 characters or missing required character types), when the form is submitted, then the client shows inline validation errors and does not call the API.
- **AC4:** Given a registered user clicks a valid, non-expired verification link, when the page loads, then the account is activated and the user sees a success message with a link to log in.
- **AC5:** Given a registered user clicks an expired verification link, when the page loads, then the system returns 400 and the user sees an error message.
- **AC6:** Given an active user submits valid credentials, when the login form is submitted, then the system returns a JWT token and the user is redirected to `/dashboard`.
- **AC7:** Given a user submits an incorrect password, when the login form is submitted, then the system returns 401 and the frontend displays "Invalid email or password." No information about whether the email exists is revealed.
- **AC8:** Given a registered but unverified user submits correct credentials, when the login form is submitted, then the system returns 403 and the frontend displays "Your email address has not been verified."
- **AC9:** Given a user submits their email to request a password reset, when the request is submitted, then the frontend always displays the success message regardless of whether the email exists in the system.
- **AC10:** Given a user submits a valid, non-expired, unused reset token with a valid new password, when the form is submitted, then the password is updated, the token is invalidated, and the user sees a success message.
- **AC11:** Given a user submits an expired or already-used reset token, when the form is submitted, then the system returns 400 and the frontend displays an appropriate error message with a link to request a new reset link.
- **AC12:** Given a user logs in successfully, when the JWT is decoded, then it must contain the user's ID, email, and role (`ROLE_USER` or `ROLE_ADMIN`).

---

## 8. Out of Scope

- OAuth 2.0 / social login (Google, GitHub, etc.).
- Multi-factor authentication (MFA / 2FA).
- Admin panel for managing or elevating user roles.
- JWT refresh token issuance and rotation.
- Account lockout after repeated failed login attempts (noted as open question).
- "Resend verification email" functionality (noted as open question for v2).
- Remember-me / persistent sessions.

---

## 9. Dependencies and Constraints

**Dependencies:**

- An SMTP server or external email service (e.g., SendGrid, Mailgun) must be configured via environment variables (`MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`).
- A PostgreSQL database instance must be running and accessible (as per the architecture charter).
- Spring Security and a JWT library (`io.jsonwebtoken:jjwt`) must be added to the backend `pom.xml`.
- Frontend must have React Router configured for the five auth routes.

**Constraints:**

- JWT secret must be provided via environment variable `JWT_SECRET` and must be ≥ 256 bits (32 characters minimum). It must never be committed to the repository.
- BCrypt cost factor must be ≥ 12 (configurable via `BCRYPT_STRENGTH` environment variable, defaulting to 12).
- All `/api/auth/*` endpoints are public (no authentication required). All other `/api/**` endpoints must require a valid JWT.
- The application must run on both mobile and desktop browsers (responsive design via Tailwind CSS).

---

## 10. Open Questions

- **OQ1:** Should failed login attempts be rate-limited or trigger a temporary account lockout after N consecutive failures? If yes, what is the threshold and lockout duration?
- **OQ2:** Should the JWT expiry be configurable via environment variable, or is 1 hour a fixed requirement?
- **OQ3:** Should a "Resend verification email" endpoint be included in this feature or deferred to v2?
- **OQ4:** Should the frontend store the JWT in `localStorage` (persistent across tabs/sessions) or in-memory (lost on page refresh)? Each has different security trade-offs (XSS vs. session loss).

---

## 11. Notes

- **Password hashing:** BCrypt was chosen over the originally requested MD5. MD5 is a fast cryptographic hash, not a password hashing function — it is vulnerable to rainbow table attacks and is explicitly prohibited by OWASP for password storage. BCrypt is the default algorithm provided by Spring Security's `PasswordEncoder` interface and is widely recommended. The `PasswordEncoder` abstraction makes the algorithm swappable if requirements change in the future.
- **Email enumeration prevention:** The `POST /api/auth/password-reset/request` endpoint always returns 200 OK regardless of whether the email exists. This prevents attackers from discovering registered emails.
- **Stateless JWT:** The application uses stateless JWTs. There is no server-side session or token blacklist. To invalidate a token before expiry (e.g., on password change), future work would need to implement a token denylist or switch to short-lived access tokens with refresh token rotation.
- **Package structure:** Authentication classes should follow the architecture charter layout: `com.example.mybackend.security` (JWT filter, config), `com.example.mybackend.web` (AuthController), `com.example.mybackend.service` (AuthService, EmailService), `com.example.mybackend.domain` (User entity), `com.example.mybackend.repository` (UserRepository), `com.example.mybackend.dto` (request/response DTOs).
