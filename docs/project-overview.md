# Project Overview – Pet Manager Application

## 1. Product Vision

This project is a **Pet Manager web application** that allows pet owners to store and manage detailed information about their pets, including medical history, treatments, and upcoming appointments.

The goal of **v1** is to deliver a simple, secure, and usable web app where individual pet owners can:

- Register and manage their pets.
- Track vaccines and deworming (parasite medicine).
- Store medical history (operations, allergies, exam results).
- Plan and view future medical appointments.
- Receive alerts or reminders for upcoming vaccines and deworming.

Future versions will expand to include **veterinarian/doctor roles** and collaborative features.

---

## 2. Target Users

### v1 (Initial Version)

- **Primary:**  
  Individual pet owners who want to keep a centralized record of their pets’ medical information and schedules.

- **Secondary (future):**  
  Veterinarians/clinics who can access pet records, add medical history, and manage appointments.  
  (Doctor roles are out of scope for v1 but will be considered for v2+.)

---

## 3. High-Level Features (v1)

Planned core features for v1:

1. **User Authentication**
   - Login and logout.
   - Basic session handling and protected routes.

2. **User Registration**
   - Sign-up with email and password.
   - Each user manages their own pets.

3. **Pet Management (CRUD)**
   - Create, read, update, and delete pets.
   - Pet fields (initial set):
     - Name
     - Species / breed (raze)
     - Photo (URL or file upload placeholder)
     - Birth date
     - Last vaccine date/time
     - Last deworming (parasite medicine) date/time
     - Medical information:
       - Operations (list of records)
       - Allergies (list of records)
       - Medical history entries (free text + date)
       - Exam results (description, date, optional attachments placeholder)

4. **Medical History & Exam Records UI**
   - For each pet:
     - View and add operations history.
     - View and add allergies.
     - View and add general medical history entries.
     - View and add exam results.

5. **Future Medical Appointments**
   - For each pet:
     - Create, view, update, and delete future medical appointments.
     - Fields: date/time, type (check-up, vaccine, surgery, etc.), clinic/doctor name (free text), notes.

6. **Alerts & Reminders (Basic)**
   - For each pet:
     - Store “next vaccine due” date/time.
     - Store “next deworming due” date/time.
   - UI:
     - List upcoming vaccines and deworming for all pets on a dashboard page.
     - Simple visual alerts (e.g., highlighting overdue or soon-due items).
   - Backend:
     - No complex scheduling or notifications in v1 (no emails or push notifications yet).
     - Focus on computed status (e.g., overdue, due soon, upcoming) based on stored dates.

---

## 4. Future Features (v2 and Beyond)

Future versions (not in v1) may include:

1. **Doctor / Veterinarian Roles**
   - Separate user role for doctors.
   - Ability for doctors to:
     - Add and edit medical history entries.
     - Add and manage medical appointments.
     - Add comments to each pet and to specific medical events.

2. **Shared Access / Collaboration**
   - Allow owners to share pet records with specific doctors.
   - Access control and permissions (read/write).

3. **Advanced Notifications**
   - Email or push notifications for upcoming appointments, vaccines, and deworming.
   - Configurable reminder preferences.

4. **File Attachments**
   - Upload and store documents (lab results, prescriptions).
   - Upload multiple photos beyond the main pet photo.

5. **Analytics / Insights**
   - Summary views (e.g., number of pets, upcoming appointments).
   - Health timeline per pet.

These are out of scope for v1 but should be kept in mind when designing data models and APIs.

---

## 5. Technical Context

As per the Architecture Charter:

- **Backend:**
  - Java 17
  - Spring Boot 3.x
  - Maven
  - Spring Data JPA
  - PostgreSQL
  - Spring Security (JWT-based authentication)
  - JUnit 5 + Mockito for testing

- **Frontend:**
  - React 18
  - TypeScript (strict mode)
  - Vite
  - React Router
  - React Query (TanStack Query)
  - Tailwind CSS
  - Jest + React Testing Library for testing

- **CI/CD:**
  - GitHub Actions
  - Build and test backend and frontend on pushes/PRs to main and develop.

---

## 6. Initial Roadmap (v1)

Suggested implementation order for v1:

1. **Feature 001 – User Authentication (Login/Logout)**
   - Basic auth flow.
   - Protected routes.

2. **Feature 002 – User Registration**
   - Sign-up flow.
   - Link pets to a user account.

3. **Feature 003 – Pet Management (Core Pet Data)**
   - CRUD for basic pet info:
     - Name, species/breed, photo, birth date.
     - Last vaccine datetime.
     - Last deworming datetime.

4. **Feature 004 – Pet Medical History & Exam Records**
   - Data structures and UI for:
     - Operations.
     - Allergies.
     - General medical history entries.
     - Exam results.

5. **Feature 005 – Future Medical Appointments**
   - CRUD for future appointments per pet.
   - List view per pet and/or global view.

6. **Feature 006 – Alerts for Next Vaccine and Deworming**
   - Fields for next due dates.
   - Dashboard or pet overview showing upcoming/overdue items.

Each of these will have its own detailed feature spec under `docs/feature-XXX-*.md`.

---

## 7. Overall Constraints

- **Security:**
  - All pet and medical data must be accessible only to authenticated users.
  - Each user can only access their own pets and associated data (no multi-tenant sharing in v1).
  - No plain-text passwords; use secure hashing.
  - JWT tokens must be handled securely.

- **Usability:**
  - UI must be clear and easy to use for non-technical pet owners.
  - Mobile-friendly layout (responsive design).

- **Scalability (v1 scope):**
  - Designed for single users with a modest number of pets and records.
  - Data model should not prevent scaling to more users and pets later.

- **Compliance:**
  - No explicit regulatory compliance (e.g., HIPAA) is targeted in v1, but sensitive medical data should be treated carefully and not exposed publicly.

---

## 8. Naming and Terminology

- Use “Pet” as the core entity.
- Use “Medical History” as a generic term for:
  - Operations
  - Allergies
  - General medical notes
  - Exam results
- Use “Appointment” for future medical visits.
- Use “Vaccine” and “Deworming” (parasite medicine) consistently in UI and API.

This terminology should be reflected in feature specs, API design, and UI components.