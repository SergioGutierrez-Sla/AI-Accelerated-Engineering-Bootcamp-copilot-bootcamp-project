# Global Standards for All Agents

These standards apply to every agent (spec writer, architect, backend dev, frontend dev, QA, CI).  
They serve as the common “team contract” for the virtual development process.

---

## 1. General Principles

1. **Follow the Architecture Charter**
   - All work must align with `docs/architecture-charter.md`.
   - If a requested change conflicts with the charter, the agent must highlight the conflict and ask for clarification.

2. **Spec-Driven Development**
   - Features must start from a written spec using `docs/feature-template.md`.
   - Implementation should not proceed without a reasonably clear spec and acceptance criteria.

3. **Clarity Over Cleverness**
   - Prefer readable, maintainable solutions over clever or overly complex code.
   - Use clear naming and simple structures whenever possible.

4. **Ask When Unsure**
   - If requirements are ambiguous or incomplete, agents must ask clarifying questions before proceeding.
   - Agents should explicitly list assumptions when they must proceed without full clarity.

5. **Consistency**
   - Follow consistent naming conventions, file structures, and coding styles.
   - Do not introduce new patterns or libraries without justification.

---

## 2. Code Quality Standards

1. **Compilable / Runnable Code**
   - All code snippets should be syntactically valid.
   - For multi-file outputs, include filenames, package/import declarations, and any required configuration.

2. **Tests**
   - For backend:
     - Use JUnit 5 and Mockito.
     - Provide tests for core service logic and critical controllers.
   - For frontend:
     - Use Jest and React Testing Library.
     - Provide tests for core components and user flows.
   - Tests should:
     - Cover success paths, failure paths, and edge cases.
     - Have descriptive names and be easy to understand.

3. **Error Handling**
   - Implement structured error handling.
   - Avoid swallowing exceptions silently.
   - Provide user-friendly messages on the frontend and avoid exposing internal details.

4. **Security & Validation**
   - Validate all external inputs (backend and frontend).
   - Ensure authentication and authorization are enforced where required.
   - Avoid logging sensitive data.
   - Follow OWASP best practices where applicable.

---

## 3. Communication Standards (for Agents)

1. **Structured Outputs**
   - When generating specs, designs, or reviews, use clear headings and sections.
   - When generating code, group code by file with headings like:

     ```text
     File: backend/src/main/java/com/example/app/web/UserController.java
     ```

2. **Explicit Assumptions**
   - When making assumptions, list them in an “Assumptions” section.
   - If assumptions are critical, ask the user to confirm them.

3. **Review and Feedback**
   - QA agents must use checklists and provide actionable feedback.
   - Feedback should be specific:
     - Point to exact files/lines or functions where possible.
     - Suggest concrete improvements or alternative implementations.

4. **Non-Destructive Changes**
   - Agents should avoid introducing breaking changes without clear justification.
   - When a breaking change is necessary, explain the impact and migration steps.

---

## 4. Naming and Structure Conventions

### 4.1 Backend (Java)

- Packages: `com.example.app.<layer>` (e.g., `web`, `service`, `repository`, `domain`, `dto`, `config`, `security`, `exception`).
- Classes: PascalCase (e.g., `UserController`, `UserService`).
- Methods and variables: camelCase (e.g., `createUser`, `userRepository`).
- REST endpoints:
  - Use nouns for resource names: `/users`, `/todos`.
  - Use standard CRUD patterns:
    - `GET /resource`
    - `GET /resource/{id}`
    - `POST /resource`
    - `PUT /resource/{id}`
    - `DELETE /resource/{id}`

### 4.2 Frontend (React/TypeScript)

- Components: PascalCase (e.g., `LoginForm`, `TodoList`).
- Hooks: `use` prefix + PascalCase (e.g., `useAuth`, `useTodos`).
- Types/interfaces: PascalCase (e.g., `User`, `TodoItem`).
- File naming:
  - Components: `ComponentName.tsx`.
  - Hooks: `useSomething.ts`.
  - Types: `types.ts` or `User.types.ts` depending on scope.

---

## 5. Git and CI Standards

### 5.1 Git

- Use meaningful commit messages.
- Prefer conventional commits style:
  - `feat: add user registration`
  - `fix: handle null pointer in auth service`
  - `test: add unit tests for todo service`
  - `refactor: simplify login form validation`

### 5.2 CI

- All agents must produce code that is compatible with the CI pipeline defined in `.github/workflows`.
- If a suggested change requires CI updates, agents must also propose the necessary workflow modifications.

---

## 6. Documentation Standards

1. **Feature Specs**
   - Use `docs/feature-template.md` for all features in `docs/feature-XXX-*.md`.
   - Ensure user stories, functional requirements, and acceptance criteria are explicit.

2. **Architecture and ADRs**
   - Major architectural changes must be documented as ADRs.
   - ADRs should include context, decision, and consequences.

3. **Inline Documentation**
   - Use comments sparingly but clearly where necessary (complex logic, non-obvious decisions).
   - Avoid redundant comments that simply restate what the code already expresses.

---

## 7. Agent-Specific Behavior

Although each agent has its own role-specific standards, they all must:

- Respect these global standards.
- Reference the architecture charter when making design decisions.
- Surface conflicts or inconsistencies rather than silently ignoring them.
- Aim to produce production-quality artifacts (code, tests, specs, reviews) that a human developer could directly use or refine.

If at any point a user request conflicts with these standards, the agent should:

1. Explain the conflict.
2. Offer options:
   - Follow the request and document an exception.
   - Suggest an alternative that respects the standards.