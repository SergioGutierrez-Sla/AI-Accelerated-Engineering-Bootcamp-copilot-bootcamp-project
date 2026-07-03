# Technical Design for Feature 001 — User Authentication

> **Spec:** `docs/feature-001-user-authentication.md`  
> **Date:** 2026-07-03  
> **Status:** Draft

---

## 1. Summary

Feature 001 implements the complete authentication foundation for the Pet Manager application: user registration (with email verification), login (JWT-based), and password reset (email link). The design is fully stateless on the backend (no server-side sessions), uses BCrypt for password hashing, HS256 for JWT signing, and async email delivery to prevent transient email failures from blocking API responses.

All five `/api/auth/*` endpoints are public. Every other `/api/**` endpoint will require a valid `Authorization: Bearer <token>` header enforced by a JWT filter in the Spring Security filter chain.

---

## 2. Assumptions

- Base Java package is `com.example.mybackend` (derived from `MyBackendApplication.java`).
- A `/dashboard` route will exist in the frontend (content out of scope for this feature — stub is sufficient).
- JWT expiry defaults to 3600 seconds (1 hour); configurable via `JWT_EXPIRY_SECONDS` environment variable.
- Local development will use Docker for PostgreSQL and Mailtrap (or equivalent) for email.
- `VITE_API_BASE_URL` environment variable is used in the frontend to point to the backend.
- OQ4 (localStorage vs in-memory) resolved as **localStorage** for v1 for usability reasons; XSS risk is acceptable for v1 and must be reviewed before v2 handles highly sensitive medical data.

---

## 3. Backend Design

### 3.1 Endpoints

| Method | Path | Auth | Description | FR |
|--------|------|------|-------------|----|
| `POST` | `/api/auth/register` | None | Create inactive user, send verification email | FR1–FR4, FR15 |
| `GET` | `/api/auth/verify-email?token=` | None | Activate account using verification token | FR5–FR6 |
| `POST` | `/api/auth/login` | None | Authenticate and return signed JWT | FR7–FR9 |
| `POST` | `/api/auth/password-reset/request` | None | Generate reset token, send email link (always 200) | FR11–FR12 |
| `POST` | `/api/auth/password-reset/confirm` | None | Validate reset token, update password | FR13–FR14 |

---

### 3.2 Controllers

**`AuthController`** — `com.example.mybackend.web.AuthController`

```
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
```

| Method | Signature | Returns |
|--------|-----------|---------|
| `register` | `@PostMapping @Valid @RequestBody RegisterRequest` | `ResponseEntity<MessageResponse>` (201) |
| `verifyEmail` | `@GetMapping("/verify-email") @RequestParam String token` | `ResponseEntity<MessageResponse>` (200) |
| `login` | `@PostMapping("/login") @Valid @RequestBody LoginRequest` | `ResponseEntity<LoginResponse>` (200) |
| `requestPasswordReset` | `@PostMapping("/password-reset/request") @Valid @RequestBody PasswordResetRequestDto` | `ResponseEntity<MessageResponse>` (200) |
| `confirmPasswordReset` | `@PostMapping("/password-reset/confirm") @Valid @RequestBody PasswordResetConfirmDto` | `ResponseEntity<MessageResponse>` (200) |

---

### 3.3 Services

**`AuthService`** — `com.example.mybackend.service.AuthService`

| Method | Responsibility |
|--------|---------------|
| `register(RegisterRequest)` | Check email uniqueness (throw `EmailAlreadyExistsException` if taken), BCrypt hash password, create `User` with `active=false` and `role=ROLE_USER`, generate `VerificationToken` (UUID, 24h expiry), persist both, delegate email to `EmailService` |
| `verifyEmail(String token)` | Load `VerificationToken` by value (throw `InvalidTokenException` if absent or expired), mark `User.active=true`, delete token |
| `login(LoginRequest)` | Find user by email (throw `BadCredentialsException` if not found), check `active` (throw `AccountNotActiveException` if false), verify BCrypt match (throw `BadCredentialsException` if wrong), call `JwtUtil.generateToken(user)` and return `LoginResponse` |
| `requestPasswordReset(String email)` | Silently find user; if found, delete any existing `PasswordResetToken` for that user, generate new token (UUID, 1h expiry), persist, delegate email to `EmailService`; always completes without error |
| `confirmPasswordReset(String token, String newPassword)` | Load `PasswordResetToken` (throw `InvalidTokenException` if absent, expired, or `used=true`), BCrypt hash new password, update `User.passwordHash`, mark token `used=true` |

**`EmailService`** — `com.example.mybackend.service.EmailService`

| Method | Responsibility |
|--------|---------------|
| `sendVerificationEmail(String to, String token)` | `@Async` — build link `${APP_BASE_URL}/verify-email?token=`, send via `JavaMailSender`, log on failure |
| `sendPasswordResetEmail(String to, String token)` | `@Async` — build link `${APP_BASE_URL}/reset-password?token=`, send via `JavaMailSender`, log on failure |

---

### 3.4 Repositories

**`UserRepository`** — `com.example.mybackend.repository.UserRepository`
- extends `JpaRepository<User, Long>`
- `findByEmail(String email): Optional<User>`
- `existsByEmail(String email): boolean`

**`VerificationTokenRepository`** — `com.example.mybackend.repository.VerificationTokenRepository`
- extends `JpaRepository<VerificationToken, Long>`
- `findByToken(String token): Optional<VerificationToken>`
- `deleteByUser(User user): void`

**`PasswordResetTokenRepository`** — `com.example.mybackend.repository.PasswordResetTokenRepository`
- extends `JpaRepository<PasswordResetToken, Long>`
- `findByToken(String token): Optional<PasswordResetToken>`
- `deleteByUser(User user): void`

---

### 3.5 Domain Model / Entities

**`User`** → table `users`

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | `Long` | PK, auto-increment |
| `firstName` | `String` | `@NotBlank`, `@Column(nullable=false)` |
| `lastName` | `String` | `@NotBlank`, `@Column(nullable=false)` |
| `email` | `String` | `@Email`, `@Column(unique=true, nullable=false)` |
| `passwordHash` | `String` | `@Column(nullable=false)` — BCrypt output |
| `role` | `String` | `@Column(nullable=false)`, default `"ROLE_USER"` |
| `active` | `boolean` | `@Column(nullable=false)`, default `false` |
| `createdAt` | `Instant` | `@Column(nullable=false)`, set on persist |
| `updatedAt` | `Instant` | set on update |

**`VerificationToken`** → table `verification_tokens`

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | `Long` | PK, auto-increment |
| `token` | `String` | `@Column(unique=true, nullable=false)` — UUID |
| `user` | `User` | `@ManyToOne`, FK `user_id`, `@Column(nullable=false)` |
| `expiresAt` | `Instant` | `@Column(nullable=false)` — now + 24h |

**`PasswordResetToken`** → table `password_reset_tokens`

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | `Long` | PK, auto-increment |
| `token` | `String` | `@Column(unique=true, nullable=false)` — UUID |
| `user` | `User` | `@ManyToOne`, FK `user_id`, `@Column(nullable=false)` |
| `expiresAt` | `Instant` | `@Column(nullable=false)` — now + 1h |
| `used` | `boolean` | `@Column(nullable=false)`, default `false` |

---

### 3.6 DTOs

**`RegisterRequest`** — `com.example.mybackend.dto`
- `firstName: String` — `@NotBlank`
- `lastName: String` — `@NotBlank`
- `email: String` — `@NotBlank @Email`
- `password: String` — `@NotBlank @Size(min=8) @Pattern(regexp="^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).+$", message="Password must contain at least one uppercase letter, one lowercase letter, and one digit")`

**`LoginRequest`** — `com.example.mybackend.dto`
- `email: String` — `@NotBlank @Email`
- `password: String` — `@NotBlank`

**`LoginResponse`** — `com.example.mybackend.dto`
- `token: String`
- `expiresIn: long` — seconds
- `role: String`

**`PasswordResetRequestDto`** — `com.example.mybackend.dto`
- `email: String` — `@NotBlank @Email`

**`PasswordResetConfirmDto`** — `com.example.mybackend.dto`
- `token: String` — `@NotBlank`
- `newPassword: String` — `@NotBlank @Size(min=8) @Pattern(same as above)`

**`MessageResponse`** — `com.example.mybackend.dto`
- `message: String`

---

### 3.7 Configuration / Security

**`SecurityConfig`** — `com.example.mybackend.security.SecurityConfig`
```
@Configuration @EnableWebSecurity
```
- Disable CSRF (`csrf.disable()`) — stateless JWT API
- Stateless session management (`SessionCreationPolicy.STATELESS`)
- `permitAll()` on `/api/auth/**`
- `authenticated()` on all other `/api/**`
- Add `JwtAuthenticationFilter` before `UsernamePasswordAuthenticationFilter`
- Register `@Bean BCryptPasswordEncoder` with strength from `${security.bcrypt.strength:12}`
- CORS: allow `${APP_BASE_URL}` origin for all `/api/**` paths

**`JwtUtil`** — `com.example.mybackend.security.JwtUtil`
- `generateToken(User user): String` — builds JWT: `sub=userId`, claims `email`, `role`; signed HS256 with secret from `${JWT_SECRET}`; expires in `${JWT_EXPIRY_SECONDS:3600}` seconds
- `validateToken(String token): boolean` — parses and checks expiry; returns false on any `JwtException`
- `extractUserId(String token): Long`
- `extractEmail(String token): String`
- `extractRole(String token): String`
- `@PostConstruct validateSecret()` — throws `IllegalStateException` if `JWT_SECRET` length < 32 characters at startup

**`JwtAuthenticationFilter`** — `com.example.mybackend.security.JwtAuthenticationFilter`
- Extends `OncePerRequestFilter`
- Extracts `Authorization: Bearer <token>` header; skips if absent
- Calls `JwtUtil.validateToken()`; if valid, builds `UsernamePasswordAuthenticationToken` with userId + role and sets in `SecurityContextHolder`

**`AsyncConfig`** — `com.example.mybackend.config.AsyncConfig`
- `@Configuration @EnableAsync`
- Configures a `ThreadPoolTaskExecutor` for async email tasks

**`GlobalExceptionHandler`** — `com.example.mybackend.exception.GlobalExceptionHandler`
- `@RestControllerAdvice`
- Returns consistent error envelope:
  ```json
  { "timestamp": "...", "status": 4xx, "error": "...", "message": "...", "path": "..." }
  ```

| Exception | HTTP Status |
|-----------|------------|
| `MethodArgumentNotValidException` | 400 — returns field-level validation errors |
| `EmailAlreadyExistsException` | 409 |
| `InvalidTokenException` | 400 |
| `AccountNotActiveException` | 403 |
| `BadCredentialsException` | 401 — always returns generic "Invalid email or password." |
| `Exception` (fallback) | 500 |

**Custom exceptions** — `com.example.mybackend.exception`
- `EmailAlreadyExistsException extends RuntimeException`
- `InvalidTokenException extends RuntimeException`
- `AccountNotActiveException extends RuntimeException`

---

## 4. Frontend Design

### 4.1 Pages / Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/register` | `RegisterPage` | New account creation |
| `/login` | `LoginPage` | User authentication |
| `/verify-email` | `EmailVerificationPage` | Token-based email activation |
| `/forgot-password` | `ForgotPasswordPage` | Request password reset link |
| `/reset-password` | `ResetPasswordPage` | Submit new password via token |
| `/dashboard` | `DashboardPage` | Protected landing (stub for this feature) |

---

### 4.2 Components

| Component | Package | Responsibility |
|-----------|---------|---------------|
| `RegisterForm` | `components/auth/` | Controlled form: firstName, lastName, email, password, confirmPassword; client-side validation before submit |
| `LoginForm` | `components/auth/` | Controlled form: email, password |
| `ForgotPasswordForm` | `components/auth/` | Single email input |
| `ResetPasswordForm` | `components/auth/` | newPassword + confirmNewPassword fields |
| `VerificationStatusCard` | `components/auth/` | Shows loading spinner, success, or error state based on verify query status |
| `PasswordStrengthIndicator` | `components/auth/` | Visual meter: weak / fair / strong based on password value |
| `ErrorAlert` | `components/common/` | Reusable dismissible error banner; accepts `message: string` prop |
| `ProtectedRoute` | `routing/` | Wraps any route; reads `isAuthenticated` from `AuthContext`; redirects to `/login` if false |

---

### 4.3 Hooks

| Hook | Location | Responsibility | Returns |
|------|----------|---------------|---------|
| `useRegister` | `api/hooks/useRegister.ts` | `useMutation` on `POST /api/auth/register` | `{ mutate, isPending, isSuccess, error }` |
| `useLogin` | `api/hooks/useLogin.ts` | `useMutation` on `POST /api/auth/login`; on success: store token, update AuthContext, navigate to `/dashboard` | `{ mutate, isPending, error }` |
| `useVerifyEmail` | `api/hooks/useVerifyEmail.ts` | `useQuery` auto-fired on mount with `token` from URL search params | `{ isLoading, isSuccess, isError, error }` |
| `useForgotPassword` | `api/hooks/useForgotPassword.ts` | `useMutation` on `POST /api/auth/password-reset/request` | `{ mutate, isPending, isSuccess }` |
| `useResetPassword` | `api/hooks/useResetPassword.ts` | `useMutation` on `POST /api/auth/password-reset/confirm` | `{ mutate, isPending, isSuccess, error }` |
| `useAuth` | `context/AuthContext.tsx` | Reads/writes `localStorage` key `auth_token`; decodes JWT with `jwt-decode`; provides logout | `{ token, user, isAuthenticated, logout }` |

---

### 4.4 API Integration

**`frontend/src/api/authApi.ts`**

Axios instance:
- `baseURL`: from `import.meta.env.VITE_API_BASE_URL`
- Request interceptor: reads token from `localStorage` and sets `Authorization: Bearer <token>` header (for protected endpoints)
- Response interceptor: on 401, clears token and redirects to `/login`

Functions:
```typescript
register(data: RegisterRequest): Promise<MessageResponse>
verifyEmail(token: string): Promise<MessageResponse>
login(data: LoginRequest): Promise<LoginResponse>
requestPasswordReset(email: string): Promise<MessageResponse>
confirmPasswordReset(data: PasswordResetConfirmRequest): Promise<MessageResponse>
```

**`frontend/src/types/auth.ts`** — TypeScript types matching backend DTOs:
```typescript
interface RegisterRequest { firstName, lastName, email, password }
interface LoginRequest    { email, password }
interface LoginResponse   { token: string, expiresIn: number, role: string }
interface PasswordResetConfirmRequest { token: string, newPassword: string }
interface MessageResponse { message: string }
interface AuthUser        { sub: string, email: string, role: string, exp: number }
```

---

### 4.5 State Management & Flows

**State approach:**
- JWT stored in `localStorage` key `auth_token` — persists across browser tabs and page refreshes
- `AuthContext` (`context/AuthContext.tsx`) wraps the whole app; decodes stored token on load using `jwt-decode`; exposes `{ token, user: AuthUser | null, isAuthenticated, logout }`
- No global state library needed; server state via React Query; local UI state via `useState`

**React Query keys:**
- `['auth', 'verify-email', token]` — for email verification query

**Key navigation flows:**

| Event | Action |
|-------|--------|
| Successful registration | Show success message, offer link to `/login` |
| Successful login | Store JWT → `AuthContext` update → navigate to `/dashboard` |
| Logout | Clear `localStorage` token → `AuthContext` update → navigate to `/login` |
| Protected route, no valid token | `ProtectedRoute` redirects to `/login` |
| Email verification success | Show success card with link to `/login` |
| Password reset success | Show success card with link to `/login` |

---

## 5. Data Model & Contracts

### Entity relationships
```
User 1──* VerificationToken
User 1──* PasswordResetToken
```

### Error response envelope (all endpoints)
```json
{
  "timestamp": "2026-07-03T10:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Human-readable message",
  "path": "/api/auth/..."
}
```

### Validation error response (400 on DTO failures)
```json
{
  "timestamp": "...",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/auth/register",
  "fieldErrors": [
    { "field": "password", "message": "Password must contain at least one uppercase letter..." }
  ]
}
```

---

## 6. Security, Validation, and Error Handling

### Security
- `/api/auth/**` — public (no JWT required)
- All other `/api/**` — require valid, non-expired JWT (enforced by `JwtAuthenticationFilter`)
- BCrypt strength ≥ 12 via `${security.bcrypt.strength:12}` property
- JWT secret from `${JWT_SECRET}` env var (≥ 256 bits / 32 chars); validated at startup with `@PostConstruct`
- JWT never stored or logged server-side
- Verification and reset tokens are UUIDs — single-use and time-limited
- Password reset endpoint always returns 200 regardless of email existence (prevents email enumeration)
- No passwords, tokens, or secrets in any log output

### Validation
| Layer | Rule |
|-------|------|
| Backend (Bean Validation) | `@NotBlank`, `@Email`, `@Size(min=8)`, `@Pattern` (uppercase + lowercase + digit) on all DTOs |
| Backend (service) | Email uniqueness check before persisting |
| Frontend (pre-submit) | Email format, non-empty fields, password strength rule, passwords-match check |
| Frontend (PasswordStrengthIndicator) | Visual feedback — does not block submit; validation rule blocks |

### Error Handling
- Backend: `GlobalExceptionHandler` (@RestControllerAdvice) maps all exception types to consistent JSON envelope
- Frontend: React Query `error` objects mapped to human-readable messages in each page component; `ErrorAlert` displays them; network errors show "Something went wrong. Please try again."

---

## 7. Testing Strategy

### Backend (JUnit 5 + Mockito + Spring Boot Test)

**`AuthServiceTest`** (unit):
- `register` — success path, duplicate email (→ `EmailAlreadyExistsException`)
- `verifyEmail` — valid token, expired token, unknown token
- `login` — success, wrong password, inactive account
- `requestPasswordReset` — existing email (token generated + email sent), unknown email (no error)
- `confirmPasswordReset` — valid token, expired token, already-used token, weak new password

**`AuthControllerIT`** (integration, `@SpringBootTest` + `MockMvc`):
- Verify HTTP status codes for all 5 endpoints
- Verify 400 on missing/invalid fields (Bean Validation)
- Verify JWT structure in login response
- Verify 409 on duplicate registration

**`JwtUtilTest`** (unit):
- Token generation contains correct claims
- `validateToken` returns true for valid, false for expired/tampered

### Frontend (Jest + React Testing Library)

| Component/Page | Scenarios |
|----------------|-----------|
| `RegisterPage` | Renders form; client validation prevents submit (weak password, mismatched passwords); success message shown after 201 |
| `LoginPage` | Valid submit fires API; 401 shows error alert; 403 shows "not verified" message |
| `EmailVerificationPage` | Calls verify API on mount; shows spinner → success state; shows error state on 400 |
| `ForgotPasswordPage` | Submit always shows success message; spinner during loading |
| `ResetPasswordPage` | Valid submit shows success; 400 (expired token) shows error with link |
| `ProtectedRoute` | Redirects to `/login` when `isAuthenticated` is false |
| `useAuth` | Token stored/cleared in localStorage; logout clears auth state |

---

## 8. Risks, Dependencies, and Open Questions

### Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| JWT secret misconfiguration | Medium | `@PostConstruct` startup validation; document in README |
| Email delivery failure | Medium | Async sending with logging; user can request resend (v2) |
| XSS vulnerability via localStorage | Low (v1) | Acceptable for v1; document for v2 hardening (consider httpOnly cookie or in-memory token) |
| Token table growth (unused verification tokens) | Low | Add scheduled cleanup job (v1.1) |

### Dependencies

- PostgreSQL (local: Docker; production: managed instance)
- SMTP service (local: Mailtrap; production: SendGrid / Mailgun)
- `io.jsonwebtoken:jjwt-api/impl/jackson` 0.12.x (Spring Boot 3 compatible)
- Frontend: `jwt-decode` npm package (token claim extraction without server round-trip)
- Frontend: `@tanstack/react-query` v5, `react-router-dom` v6, `axios`

### Open Questions

| ID | Question | Recommendation |
|----|----------|---------------|
| OQ1 | Rate limiting / account lockout after N failed logins? | Add Bucket4j rate limiter in v1.1; document as known gap |
| OQ2 | JWT expiry configurable? | Resolved: configurable via `JWT_EXPIRY_SECONDS`, default 3600 |
| OQ3 | Resend verification email endpoint in v1 or v2? | Defer to v2; document as known gap |
| OQ4 | localStorage vs in-memory JWT storage? | Resolved: localStorage for v1; review before v2 medical data features |
