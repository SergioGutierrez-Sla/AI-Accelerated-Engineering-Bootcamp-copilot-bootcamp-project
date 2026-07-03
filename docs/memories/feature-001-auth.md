# Feature 001 — User Authentication

## Spec file
`docs/feature-001-user-authentication.md`

## Key decisions
- Password hashing: **BCrypt cost ≥ 12** (Spring Security `BCryptPasswordEncoder`). MD5 was requested but rejected as insecure (OWASP).
- JWT: **HS256**, expiry **1 hour**, signed with `JWT_SECRET` env var (≥ 256 bits). Claims: userId, email, role.
- Email verification: **required** before login. Token expires in **24 hours**.
- Password reset: **email link** with single-use token, expires in **1 hour**.
- Roles: `ROLE_USER` (default on registration), `ROLE_ADMIN` (manual assignment, out of scope).
- JWT is **stateless** — no server-side session or token blacklist.

## API endpoints (all public — no auth required)
| Method | Path                               | Purpose                        |
|--------|------------------------------------|--------------------------------|
| POST   | /api/auth/register                 | Create inactive account        |
| GET    | /api/auth/verify-email?token=...   | Activate account               |
| POST   | /api/auth/login                    | Authenticate, return JWT       |
| POST   | /api/auth/password-reset/request   | Send reset link (always 200)   |
| POST   | /api/auth/password-reset/confirm   | Validate token, update password|

## Frontend routes
| Route             | Component              |
|-------------------|------------------------|
| /register         | RegisterPage           |
| /login            | LoginPage              |
| /verify-email     | EmailVerificationPage  |
| /forgot-password  | ForgotPasswordPage     |
| /reset-password   | ResetPasswordPage      |

## Backend package layout (per architecture charter)
- `com.example.mybackend.web`        — AuthController
- `com.example.mybackend.service`    — AuthService, EmailService
- `com.example.mybackend.security`   — JwtUtil, JwtFilter, SecurityConfig
- `com.example.mybackend.domain`     — User entity
- `com.example.mybackend.repository` — UserRepository
- `com.example.mybackend.dto`        — RegisterRequest, LoginRequest, LoginResponse, PasswordResetRequest, PasswordResetConfirmRequest
- `com.example.mybackend.exception`  — Custom exceptions + @ControllerAdvice

## Required dependencies (backend pom.xml additions)
- `spring-boot-starter-security`
- `spring-boot-starter-mail`
- `io.jsonwebtoken:jjwt-api`, `jjwt-impl`, `jjwt-jackson`
- `spring-boot-starter-data-jpa`
- `postgresql` driver

## Environment variables required
- `JWT_SECRET` — ≥ 256 bits, never commit
- `BCRYPT_STRENGTH` — default 12
- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`
- `APP_BASE_URL` — used to build email verification and reset links

## Open questions (unresolved)
- OQ1: Rate limiting / account lockout after N failed logins?
- OQ2: JWT expiry configurable via env var?
- OQ3: Resend verification email endpoint in v1 or v2?
- OQ4: JWT storage — localStorage vs in-memory?
