# Architecture Charter

## 1. Overview

This document defines the high-level technical architecture and conventions for the project.  
All agents (spec, architect, backend dev, frontend dev, QA) must follow this charter unless a later Architecture Decision Record (ADR) explicitly overrides part of it.

## 2. Tech Stack

### 2.1 Backend

- Language: Java 17
- Framework: Spring Boot (latest stable 3.x)
- Build Tool: Maven
- Persistence:
  - Spring Data JPA
  - Database: PostgreSQL (latest stable)
- Validation: Bean Validation (Jakarta Validation, e.g. `@NotNull`, `@Email`)
- API Style:
  - RESTful APIs returning JSON
  - OpenAPI/Swagger for API documentation (Springdoc OpenAPI)
- Authentication & Authorization:
  - JWT-based authentication (`Authorization: Bearer <token>`)
  - Spring Security for auth and role-based access control
- Logging:
  - SLF4J with Logback
  - Centralized error handling using `@ControllerAdvice`
- Testing:
  - Unit tests: JUnit 5 + Mockito
  - Integration tests: Spring Boot Test, Testcontainers (PostgreSQL) where appropriate

### 2.2 Frontend

- Framework: React 18
- Language: TypeScript (strict mode)
- Build Tool: Vite
- Routing: React Router (latest stable)
- Data Fetching / Server State: React Query (TanStack Query)
- State Management:
  - Prefer local component state and React Query
  - Use context or lightweight global state only when necessary
- UI / Styling:
  - Tailwind CSS for styling
  - Focus on responsive design (mobile-first)
- Testing:
  - Jest
  - React Testing Library

### 2.3 DevOps / CI/CD

- Version Control: Git (GitHub repository)
- Branching Strategy:
  - `main`: stable, production-ready
  - `develop`: integration branch
  - `feature/*`: feature branches
- CI:
  - GitHub Actions
  - Backend:
    - Build and run tests on each push/pull request to `main` or `develop`
  - Frontend:
    - Install dependencies and run tests on each push/pull request to `main` or `develop`
- Environment Configuration:
  - Use environment variables for secrets and configuration
  - Never commit secrets to the repository

---

## 3. Project Structure

### 3.1 Repository Layout

```text
root/
  backend/          # Java Spring Boot backend
  frontend/         # React TypeScript frontend
  .github/          # GitHub Actions workflows
  docs/             # Specs, architecture docs, ADRs
  prompts/          # Agent definitions and standards
  README.md
```

### 3.2 Backend Package Structure

Base package: com.example.app (can be updated per project name).

Recommended structure:

```text
com.example.app
  ├─ config         # Configuration classes
  ├─ domain         # Domain models / entities
  ├─ web            # Controllers / REST endpoints
  ├─ service        # Business logic
  ├─ repository     # Data access (Spring Data JPA)
  ├─ dto            # Data Transfer Objects for API
  ├─ security       # Security configuration and utilities
  └─ exception      # Custom exceptions and error handling
```

### 3.3 Frontend Structure

Under frontend/src:

```text
src/
  ├─ components/     # Reusable presentational components
  ├─ pages/          # Route-level components
  ├─ hooks/          # Reusable logic hooks
  ├─ api/            # API clients, React Query hooks
  ├─ types/          # TypeScript types/interfaces
  ├─ context/        # React context providers (if needed)
  ├─ styles/         # Tailwind config, global styles
  ├─ routing/        # Router configuration
  └─ utils/          # Generic utility functions
```

## 4. Cross-Cutting Concerns

### 4.1 Error Handling

Backend:

- Use a global exception handler via @ControllerAdvice.
- Return consistent error responses with:
  - timestamp
  - status (HTTP status code)
  - error (short error label)
  - message (user-friendly message)
  - path (request path)

Frontend:

- Display user-friendly error messages.
- Avoid exposing internal server details.
- Provide clear retry options where appropriate.

### 4.2 Validation

Backend:

- Validate all external inputs (API requests) using Bean Validation annotations.
- Return meaningful validation error messages.

Frontend:

- Validate user input before sending to backend (basic client-side validation).
- Show validation errors near the relevant input fields.

### 4.3 Security

- Use HTTPS in production.
- Use JWT for authentication.
- Do not log sensitive information (passwords, tokens, secrets).
- Apply role-based access control for protected resources.
- Protect against common OWASP Top 10 vulnerabilities (e.g., injection, XSS).

## 5. Coding Style and Conventions

### 5.1 Backend (Java)

- Use constructor-based dependency injection.
- Avoid field injection (@Autowired on fields).
- Use meaningful class, method, and variable names.
- Keep methods small and focused (single responsibility).
- Prefer interfaces for service and repository layers where appropriate.
- Use DTOs for API payloads; avoid exposing entity classes directly.

### 5.2 Frontend (React/TypeScript)

- Use functional components and hooks (no class components).
- Use TypeScript with strict type checking.
- Use semantic HTML and accessible components.
- Keep components small and focused.
- Avoid complex logic inside JSX; extract into functions or hooks.

## 6. Documentation

- Each feature must have a spec in docs/ using the feature-template.md.
- Significant architectural decisions must be captured as ADRs in docs/adr-*.
- Public APIs should be documented via OpenAPI (backend) and referenced in frontend API client code.

## 7. Alignment with Agents

All agents must:

- Respect this architecture charter.
- Raise a question when a requested change conflicts with this charter.
- Propose ADRs when a change to the architecture is needed.

Any deviation from this charter must be explicitly discussed and documented.