# Technical Design for Feature 002 — Pet Detail Page: Events and Appointments

> **Spec:** `docs/feature-002-manage-pet-events-and-appointments.md`  
> **Date:** 2026-07-03  
> **Status:** Draft

---

## 1. Summary

Feature 002 implements the Pet Detail page for the Pet Manager application. The page displays a pet's name and photo, then provides a tabbed interface where pet owners can manage two types of records:

- **Events** — past medical history entries (operations, allergies, vaccines, exam results, etc.)
- **Appointments** — future scheduled veterinary visits

All CRUD operations (create, edit, delete) are handled in modal dialogs without a full page reload. React Query handles server state synchronisation; Spring Boot handles all business logic and ownership enforcement.

This feature introduces the `Pet`, `PetEvent`, and `Appointment` domain entities. The `Pet` entity is created here because it is the root aggregate for all pet-scoped data in the application.

---

## 2. Assumptions

- Base Java package is `com.example.mybackend` (from existing `MyBackendApplication.java`).
- The authenticated user's ID is available in the `SecurityContext` as the `principal` (a `Long`), set by the existing `JwtAuthenticationFilter` from Feature 001.
- `Pet` is created as part of this feature. Pet creation/listing UI is out of scope here, but the `Pet` entity and a minimal `GET /api/pets/{petId}` endpoint are required.
- `ddl-auto=create-drop` continues to be used for local H2 development. Production migration strategy (Flyway/Liquibase) is deferred.
- The frontend route `/pets/:petId` is guarded by the existing `ProtectedRoute` component.
- React Query v5 is already available (from Feature 001 setup).

---

## 3. Backend Design

### 3.1 Endpoints

| Method | Path | Description | Auth | FR |
|--------|------|-------------|------|----|
| `GET` | `/api/pets/{petId}` | Get pet header info | Required | FR1 |
| `GET` | `/api/pets/{petId}/events` | List all events, date desc | Required | FR2, FR3, FR14 |
| `POST` | `/api/pets/{petId}/events` | Create a new event | Required | FR5, FR6, FR9 |
| `PUT` | `/api/pets/{petId}/events/{eventId}` | Update an event | Required | FR8, FR9 |
| `DELETE` | `/api/pets/{petId}/events/{eventId}` | Delete an event | Required | FR11, FR12 |
| `GET` | `/api/pets/{petId}/appointments` | List all appointments, dateTime asc | Required | FR2, FR3, FR15 |
| `POST` | `/api/pets/{petId}/appointments` | Create a new appointment | Required | FR5, FR7, FR9 |
| `PUT` | `/api/pets/{petId}/appointments/{appointmentId}` | Update an appointment | Required | FR8, FR9 |
| `DELETE` | `/api/pets/{petId}/appointments/{appointmentId}` | Delete an appointment | Required | FR11, FR12 |

All endpoints verify that the `petId` belongs to the authenticated user (FR13). If not, 403 is returned.

---

### 3.2 Controllers

**`PetController`** — `com.example.mybackend.web.PetController`

```
@RestController
@RequestMapping("/api/pets")
```

| Method | Signature | Returns |
|--------|-----------|---------|
| `getPet` | `@GetMapping("/{petId}") @AuthenticationPrincipal Long userId` | `ResponseEntity<PetResponse>` (200) |

---

**`PetEventController`** — `com.example.mybackend.web.PetEventController`

```
@RestController
@RequestMapping("/api/pets/{petId}/events")
```

| Method | Signature | Returns |
|--------|-----------|---------|
| `listEvents` | `@GetMapping` | `ResponseEntity<List<PetEventResponse>>` (200) |
| `createEvent` | `@PostMapping @Valid @RequestBody PetEventRequest` | `ResponseEntity<PetEventResponse>` (201) |
| `updateEvent` | `@PutMapping("/{eventId}") @Valid @RequestBody PetEventRequest` | `ResponseEntity<PetEventResponse>` (200) |
| `deleteEvent` | `@DeleteMapping("/{eventId}")` | `ResponseEntity<Void>` (204) |

---

**`AppointmentController`** — `com.example.mybackend.web.AppointmentController`

```
@RestController
@RequestMapping("/api/pets/{petId}/appointments")
```

| Method | Signature | Returns |
|--------|-----------|---------|
| `listAppointments` | `@GetMapping` | `ResponseEntity<List<AppointmentResponse>>` (200) |
| `createAppointment` | `@PostMapping @Valid @RequestBody AppointmentRequest` | `ResponseEntity<AppointmentResponse>` (201) |
| `updateAppointment` | `@PutMapping("/{appointmentId}") @Valid @RequestBody AppointmentRequest` | `ResponseEntity<AppointmentResponse>` (200) |
| `deleteAppointment` | `@DeleteMapping("/{appointmentId}")` | `ResponseEntity<Void>` (204) |

All controller methods receive the authenticated user ID from `SecurityContextHolder` via a helper or `@AuthenticationPrincipal`.

---

### 3.3 Services

**`PetService`** — `com.example.mybackend.service.PetService`

| Method | Responsibility |
|--------|----------------|
| `getPetForUser(Long petId, Long userId): Pet` | Loads pet, throws `ResourceNotFoundException` if absent, `PetAccessDeniedException` if owner mismatch |
| `getPetResponse(Long petId, Long userId): PetResponse` | Calls `getPetForUser`, maps to `PetResponse` DTO |

---

**`PetEventService`** — `com.example.mybackend.service.PetEventService`

| Method | Responsibility |
|--------|----------------|
| `listEvents(Long petId, Long userId): List<PetEventResponse>` | Verifies ownership via `PetService`, returns events sorted by `date` DESC |
| `createEvent(Long petId, Long userId, PetEventRequest req): PetEventResponse` | Verifies ownership, creates and persists `PetEvent`, returns DTO |
| `updateEvent(Long petId, Long eventId, Long userId, PetEventRequest req): PetEventResponse` | Verifies ownership, loads event (throws `ResourceNotFoundException` if absent), updates fields, persists, returns DTO |
| `deleteEvent(Long petId, Long eventId, Long userId): void` | Verifies ownership, loads event, deletes it |

---

**`AppointmentService`** — `com.example.mybackend.service.AppointmentService`

| Method | Responsibility |
|--------|----------------|
| `listAppointments(Long petId, Long userId): List<AppointmentResponse>` | Verifies ownership, returns appointments sorted by `dateTime` ASC |
| `createAppointment(Long petId, Long userId, AppointmentRequest req): AppointmentResponse` | Verifies ownership, creates and persists `Appointment`, returns DTO |
| `updateAppointment(Long petId, Long appointmentId, Long userId, AppointmentRequest req): AppointmentResponse` | Verifies ownership, loads appointment, updates fields, persists, returns DTO |
| `deleteAppointment(Long petId, Long appointmentId, Long userId): void` | Verifies ownership, loads appointment, deletes it |

---

### 3.4 Repositories

**`PetRepository`** — `com.example.mybackend.repository.PetRepository`
- extends `JpaRepository<Pet, Long>`
- `findByIdAndOwnerId(Long petId, Long ownerId): Optional<Pet>` — used for ownership check in one query

**`PetEventRepository`** — `com.example.mybackend.repository.PetEventRepository`
- extends `JpaRepository<PetEvent, Long>`
- `findByPetIdOrderByDateDesc(Long petId): List<PetEvent>`
- `findByIdAndPetId(Long eventId, Long petId): Optional<PetEvent>` — prevents cross-pet access

**`AppointmentRepository`** — `com.example.mybackend.repository.AppointmentRepository`
- extends `JpaRepository<Appointment, Long>`
- `findByPetIdOrderByDateTimeAsc(Long petId): List<Appointment>`
- `findByIdAndPetId(Long appointmentId, Long petId): Optional<Appointment>`

---

### 3.5 Domain Model / Entities

**`Pet`** → table `pets`

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | `Long` | PK, auto-increment |
| `owner` | `User` | `@ManyToOne(fetch=LAZY)`, FK `owner_id`, not null |
| `name` | `String` | `@Column(nullable=false)` |
| `species` | `String` | `@Column(nullable=false)` |
| `breed` | `String` | nullable |
| `photoUrl` | `String` | nullable |
| `birthDate` | `LocalDate` | nullable |
| `createdAt` | `Instant` | `@Column(nullable=false, updatable=false)`, set on persist |
| `updatedAt` | `Instant` | set on update via `@PreUpdate` |

---

**`EventType`** → Java enum — `com.example.mybackend.domain.EventType`

Values: `OPERATION`, `ALLERGY`, `EXAM_RESULT`, `VACCINE`, `DEWORMING`, `MEDICAL_NOTE`

---

**`PetEvent`** → table `pet_events`

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | `Long` | PK, auto-increment |
| `pet` | `Pet` | `@ManyToOne(fetch=LAZY)`, FK `pet_id`, not null |
| `eventType` | `EventType` | `@Enumerated(STRING)`, not null |
| `title` | `String` | `@Column(nullable=false, length=100)` |
| `date` | `LocalDate` | `@Column(nullable=false)` |
| `description` | `String` | `@Column(length=500)`, nullable |
| `clinicOrVet` | `String` | nullable |
| `createdAt` | `Instant` | set on persist |
| `updatedAt` | `Instant` | set on update |

---

**`AppointmentType`** → Java enum — `com.example.mybackend.domain.AppointmentType`

Values: `CHECK_UP`, `VACCINE`, `SURGERY`, `DEWORMING`, `OTHER`

---

**`Appointment`** → table `appointments`

| Field | Type | Constraints |
|-------|------|-------------|
| `id` | `Long` | PK, auto-increment |
| `pet` | `Pet` | `@ManyToOne(fetch=LAZY)`, FK `pet_id`, not null |
| `appointmentType` | `AppointmentType` | `@Enumerated(STRING)`, not null |
| `dateTime` | `LocalDateTime` | `@Column(nullable=false)` |
| `clinicOrDoctor` | `String` | `@Column(nullable=false)` |
| `notes` | `String` | `@Column(length=500)`, nullable |
| `createdAt` | `Instant` | set on persist |
| `updatedAt` | `Instant` | set on update |

---

**Entity relationships:**

```
User 1──* Pet
Pet  1──* PetEvent
Pet  1──* Appointment
```

---

### 3.6 DTOs

**`PetResponse`** — `com.example.mybackend.dto`
- `id`: Long
- `name`: String
- `species`: String
- `breed`: String (nullable)
- `photoUrl`: String (nullable)

**`PetEventRequest`** — `com.example.mybackend.dto`
- `eventType`: String — `@NotNull`, must be a valid `EventType` enum value
- `title`: String — `@NotBlank`, `@Size(max=100)`
- `date`: LocalDate — `@NotNull`
- `description`: String — `@Size(max=500)`, nullable
- `clinicOrVet`: String — nullable

**`PetEventResponse`** — `com.example.mybackend.dto`
- `id`: Long
- `eventType`: String (enum name)
- `title`: String
- `date`: String (ISO 8601 `yyyy-MM-dd`)
- `description`: String (nullable)
- `clinicOrVet`: String (nullable)

**`AppointmentRequest`** — `com.example.mybackend.dto`
- `appointmentType`: String — `@NotNull`, must be a valid `AppointmentType` enum value
- `dateTime`: LocalDateTime — `@NotNull`
- `clinicOrDoctor`: String — `@NotBlank`
- `notes`: String — `@Size(max=500)`, nullable

**`AppointmentResponse`** — `com.example.mybackend.dto`
- `id`: Long
- `appointmentType`: String (enum name)
- `dateTime`: String (ISO 8601 `yyyy-MM-dd'T'HH:mm`)
- `clinicOrDoctor`: String
- `notes`: String (nullable)

---

### 3.7 Configuration / Security

**New custom exceptions** — `com.example.mybackend.exception`:
- `ResourceNotFoundException extends RuntimeException` — mapped to 404 in `GlobalExceptionHandler`
- `PetAccessDeniedException extends RuntimeException` — mapped to 403 in `GlobalExceptionHandler`

**`GlobalExceptionHandler` additions:**
```java
@ExceptionHandler(ResourceNotFoundException.class)
→ 404 Not Found, message from exception

@ExceptionHandler(PetAccessDeniedException.class)
→ 403 Forbidden, generic message: "You do not have access to this pet."
```

**Security config changes:**
- No changes to `SecurityConfig` needed. All `/api/pets/**` paths will be protected by the existing `authenticated()` catch-all rule.
- The authenticated user ID is extracted from `SecurityContextHolder.getContext().getAuthentication().getPrincipal()` (a `Long`, set by `JwtAuthenticationFilter`).

**Ownership helper** — Add a `SecurityUtils.getAuthenticatedUserId()` static helper in `com.example.mybackend.security`:
```java
public static Long getAuthenticatedUserId() {
    return (Long) SecurityContextHolder.getContext()
        .getAuthentication().getPrincipal();
}
```

---

## 4. Frontend Design

### 4.1 Pages / Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/pets/:petId` | `PetDetailPage` | Shows pet header + tabbed Events/Appointments management |

Route added to `AppRoutes.tsx`:
```tsx
<Route path="/pets/:petId" element={
  <ProtectedRoute><PetDetailPage /></ProtectedRoute>
} />
```

---

### 4.2 Components

| Component | Location | Type | Responsibility |
|-----------|----------|------|----------------|
| `PetDetailPage` | `pages/` | Page | Orchestrates page layout, tab state, modal state |
| `PetHeader` | `components/pets/` | Presentational | Displays pet name and photo/placeholder |
| `TabBar` | `components/common/` | Presentational | Two-tab navigation bar with active-tab styling |
| `EventsTab` | `components/pets/` | Container | Renders events list, Create button, handles Edit/Delete triggers |
| `AppointmentsTab` | `components/pets/` | Container | Renders appointments list, Create button, handles Edit/Delete triggers |
| `EventListItem` | `components/pets/` | Presentational | Single event row: type badge, title, date, Edit and Delete buttons |
| `AppointmentListItem` | `components/pets/` | Presentational | Single appointment row: type badge, date/time, clinic, Edit and Delete buttons |
| `EventFormModal` | `components/pets/` | Container | Create/Edit event form inside a modal |
| `AppointmentFormModal` | `components/pets/` | Container | Create/Edit appointment form inside a modal |
| `DeleteConfirmModal` | `components/common/` | Presentational | Generic delete confirmation modal |
| `EmptyState` | `components/common/` | Presentational | Empty list message with action prompt |
| `Modal` | `components/common/` | Presentational | Reusable modal wrapper (backdrop, close-on-Escape, focus trap) |

---

### 4.3 Hooks

| Hook | Location | Responsibility | Returns |
|------|----------|----------------|---------|
| `usePet(petId)` | `api/hooks/usePet.ts` | `useQuery` for `GET /api/pets/{petId}` | `{ data, isPending, isError, error }` |
| `usePetEvents(petId)` | `api/hooks/usePetEvents.ts` | `useQuery` for `GET /api/pets/{petId}/events` | `{ data, isPending, isError, refetch }` |
| `usePetAppointments(petId)` | `api/hooks/usePetAppointments.ts` | `useQuery` for `GET /api/pets/{petId}/appointments` | `{ data, isPending, isError, refetch }` |
| `useCreateEvent(petId)` | `api/hooks/useCreateEvent.ts` | `useMutation` on `POST /api/pets/{petId}/events`; invalidates `['pets', petId, 'events']` on success | `{ mutate, isPending, error }` |
| `useUpdateEvent(petId)` | `api/hooks/useUpdateEvent.ts` | `useMutation` on `PUT /api/pets/{petId}/events/{eventId}`; invalidates on success | `{ mutate, isPending, error }` |
| `useDeleteEvent(petId)` | `api/hooks/useDeleteEvent.ts` | `useMutation` on `DELETE /api/pets/{petId}/events/{eventId}`; invalidates on success | `{ mutate, isPending, error }` |
| `useCreateAppointment(petId)` | `api/hooks/useCreateAppointment.ts` | `useMutation` on `POST /api/pets/{petId}/appointments`; invalidates on success | `{ mutate, isPending, error }` |
| `useUpdateAppointment(petId)` | `api/hooks/useUpdateAppointment.ts` | `useMutation` on `PUT …/appointments/{id}`; invalidates on success | `{ mutate, isPending, error }` |
| `useDeleteAppointment(petId)` | `api/hooks/useDeleteAppointment.ts` | `useMutation` on `DELETE …/appointments/{id}`; invalidates on success | `{ mutate, isPending, error }` |

---

### 4.4 API Integration

New file: **`src/api/petApi.ts`**

All calls use the existing `apiClient` (Axios instance with JWT interceptor from Feature 001).

```typescript
getPet(petId: number): Promise<PetSummary>
listEvents(petId: number): Promise<PetEvent[]>
createEvent(petId: number, data: PetEventRequest): Promise<PetEvent>
updateEvent(petId: number, eventId: number, data: PetEventRequest): Promise<PetEvent>
deleteEvent(petId: number, eventId: number): Promise<void>
listAppointments(petId: number): Promise<Appointment[]>
createAppointment(petId: number, data: AppointmentRequest): Promise<Appointment>
updateAppointment(petId: number, appointmentId: number, data: AppointmentRequest): Promise<Appointment>
deleteAppointment(petId: number, appointmentId: number): Promise<void>
```

New file: **`src/types/pet.ts`**

```typescript
export type EventType =
  | 'OPERATION' | 'ALLERGY' | 'EXAM_RESULT'
  | 'VACCINE' | 'DEWORMING' | 'MEDICAL_NOTE'

export type AppointmentType =
  | 'CHECK_UP' | 'VACCINE' | 'SURGERY' | 'DEWORMING' | 'OTHER'

export interface PetSummary {
  id: number
  name: string
  species: string
  breed: string | null
  photoUrl: string | null
}

export interface PetEvent {
  id: number
  eventType: EventType
  title: string
  date: string          // 'yyyy-MM-dd'
  description: string | null
  clinicOrVet: string | null
}

export interface PetEventRequest {
  eventType: EventType
  title: string
  date: string
  description?: string
  clinicOrVet?: string
}

export interface Appointment {
  id: number
  appointmentType: AppointmentType
  dateTime: string      // 'yyyy-MM-ddTHH:mm'
  clinicOrDoctor: string
  notes: string | null
}

export interface AppointmentRequest {
  appointmentType: AppointmentType
  dateTime: string
  clinicOrDoctor: string
  notes?: string
}
```

---

### 4.5 State Management & Flows

**Server state** (React Query):
- `['pets', petId]` → pet header data
- `['pets', petId, 'events']` → events list
- `['pets', petId, 'appointments']` → appointments list

On any successful mutation, the relevant query key is invalidated → React Query automatically re-fetches the list. No manual state updates needed.

**Local state** (in `PetDetailPage`):
```typescript
activeTab: 'events' | 'appointments'       // default: 'appointments'
eventModal: { open: boolean; event: PetEvent | null }
appointmentModal: { open: boolean; appointment: Appointment | null }
deleteModal: { open: boolean; type: 'event' | 'appointment'; id: number | null; title: string }
```

**Navigation flows:**
- Successful create/edit → mutation `onSuccess` closes modal; query auto-invalidates and refreshes list.
- Successful delete → same pattern.
- 403 on page load (pet belongs to another user) → show error page with "Go back to Dashboard" link.
- 404 on page load → show "Pet not found" with link to Dashboard.
- Modal cancel → close modal, no state change.
- Escape key on modal → triggers Cancel.

---

## 5. Data Model & Contracts

### Entity Relationships

```
User 1──* Pet
Pet  1──* PetEvent
Pet  1──* Appointment
```

### Error Response Envelope (consistent with Feature 001)

```json
{
  "timestamp": "2026-07-03T10:00:00Z",
  "status": 403,
  "error": "Forbidden",
  "message": "You do not have access to this pet.",
  "path": "/api/pets/42/events"
}
```

### Validation Error Response

```json
{
  "timestamp": "2026-07-03T10:00:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/pets/42/events",
  "fieldErrors": [
    { "field": "title", "message": "Title is required" },
    { "field": "date", "message": "Date is required" }
  ]
}
```

### TypeScript ↔ Backend DTO Alignment

| Backend DTO field | Type | Frontend TypeScript field | Type |
|-------------------|------|--------------------------|------|
| `eventType` | `String` (enum name) | `eventType` | `EventType` (string literal union) |
| `date` | `String` (`yyyy-MM-dd`) | `date` | `string` |
| `dateTime` | `String` (`yyyy-MM-ddTHH:mm`) | `dateTime` | `string` |
| `description` | `String \| null` | `description` | `string \| null` |

---

## 6. Security, Validation, and Error Handling

### Security

- All `/api/pets/**` endpoints require a valid JWT (enforced by existing `JwtAuthenticationFilter`).
- Every service method calls `petService.getPetForUser(petId, userId)` as the first step, which verifies ownership. This is the single authoritative ownership check.
- `PetAccessDeniedException` is thrown (→ 403) when the pet's `owner.id` does not match the authenticated `userId`.
- `ResourceNotFoundException` is thrown (→ 404) when a pet, event, or appointment ID does not exist.
- Cross-entity access prevention: `PetEventRepository.findByIdAndPetId()` and `AppointmentRepository.findByIdAndPetId()` ensure that event/appointment IDs can only be accessed within their own pet scope.

### Validation

**Backend (Bean Validation on DTOs):**

| Field | Rule |
|-------|------|
| `eventType` | `@NotNull`; must parse to `EventType` enum (throw 400 if invalid string) |
| `title` | `@NotBlank`, `@Size(max=100)` |
| `date` | `@NotNull` |
| `description` | `@Size(max=500)` |
| `appointmentType` | `@NotNull`; must parse to `AppointmentType` enum |
| `dateTime` | `@NotNull` |
| `clinicOrDoctor` | `@NotBlank` |
| `notes` | `@Size(max=500)` |

**Frontend (client-side before API call):**
- Event: `eventType` not empty, `title` not empty (≤100 chars), `date` not empty.
- Appointment: `appointmentType` not empty, `dateTime` not empty, `clinicOrDoctor` not empty.
- Invalid input → inline field error shown, API call blocked.

### Error Handling

**Backend:**
- `GlobalExceptionHandler` already handles `MethodArgumentNotValidException` → 400 with `fieldErrors`.
- Add handlers for `ResourceNotFoundException` → 404 and `PetAccessDeniedException` → 403.
- Fallback `Exception.class` handler → 500 (already exists), now also logs at `ERROR`.

**Frontend:**
- Query errors (GET failures) → `ErrorAlert` inside the tab panel with a retry button.
- Mutation errors (POST/PUT/DELETE failures) → `ErrorAlert` inside the open modal, modal stays open.
- 403 on page load → full-page error state with navigation back to `/dashboard`.
- 404 on page load → "Pet not found" message with navigation back to `/dashboard`.

---

## 7. Testing Strategy

### Backend (JUnit 5 + Mockito)

**`PetServiceTest`** (unit):
- `getPetForUser` — success, pet not found (→ `ResourceNotFoundException`), wrong owner (→ `PetAccessDeniedException`)

**`PetEventServiceTest`** (unit):
- `listEvents` — success (returns sorted list), pet not found, access denied
- `createEvent` — success, pet not found, access denied
- `updateEvent` — success, event not found, access denied
- `deleteEvent` — success, event not found, access denied

**`AppointmentServiceTest`** (unit):
- Same pattern as `PetEventServiceTest` for all 4 operations.

**`PetEventControllerTest`** (`@WebMvcTest`):
- `GET /api/pets/{petId}/events` → 200 with list; 403; 404
- `POST /api/pets/{petId}/events` → 201; 400 on missing fields; 403
- `PUT /api/pets/{petId}/events/{eventId}` → 200; 400; 403; 404
- `DELETE /api/pets/{petId}/events/{eventId}` → 204; 403; 404

**`AppointmentControllerTest`** (`@WebMvcTest`):
- Same pattern for all 5 appointment endpoints.

### Frontend (Jest + React Testing Library)

| Component/Hook | Test scenarios |
|----------------|---------------|
| `PetDetailPage` | Renders pet header; default tab is Appointments; tab switching works; loading state |
| `EventsTab` | Empty state shown when no events; list renders with Edit/Delete buttons; Create button opens modal |
| `AppointmentsTab` | Same pattern as EventsTab |
| `EventFormModal` | Renders empty on Create; pre-populates on Edit; validation prevents submit on missing fields; success closes modal; API error shows inside modal |
| `AppointmentFormModal` | Same pattern as EventFormModal |
| `DeleteConfirmModal` | Confirm button calls delete mutation; Cancel button closes without deleting; loading state disables confirm |
| `usePetEvents` | Query fires with petId; data returned on success; error state on failure |
| `useCreateEvent` | Mutation calls correct endpoint; invalidates query key on success |

---

## 8. Risks, Dependencies, and Open Questions

### Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Ownership check bypassed in a new service method | Medium | All service methods MUST call `petService.getPetForUser()` as first step; code review checklist |
| `PetDetailPage` is inaccessible until pet creation exists | High | Add a seed pet alongside the seed user in `DataInitializer` for dev testing |
| Last-write-wins on concurrent edits | Low | Acceptable for v1; add optimistic locking (`@Version`) in v2 if needed |
| Enum validation: invalid string in `eventType` → unclear 400 message | Low | Add a custom `@ControllerAdvice` handler for `HttpMessageNotReadableException` to return a clear error |
| Modal focus trap on mobile browsers | Low | Use a tested headless library (e.g., Headless UI or Radix Dialog) rather than custom implementation |

### Dependencies

- **Feature 001** (User Authentication): `User` entity, `JwtAuthenticationFilter`, `AuthContext`, `apiClient` — already implemented.
- **`DataInitializer`** (existing in `com.example.mybackend.config`): Must add a seed `Pet` record for the seed user so the dev environment can reach the Pet Detail page.
- **Frontend routing**: `AppRoutes.tsx` must be updated to include `/pets/:petId`.

### Open Questions

| ID | Question | Recommendation |
|----|----------|---------------|
| OQ1 | How does a user navigate to `/pets/:petId`? No pet list UI exists yet. | Add a seed pet link in `DashboardPage` stub for dev; full pet list is a separate feature. |
| OQ2 | Should Flyway or Liquibase be introduced for schema migrations? | Defer to the Sprint before first production deployment; document as a known gap. |
| OQ3 | Should past appointments (past `dateTime`) be visually distinguished in the list? | Resolve before frontend implementation; recommend a grey/muted row style for past appointments. |
| OQ4 | Should the `Pet` entity include `birthDate` and other fields (species, breed) in this feature, or just `name` and `photoUrl`? | Include the minimal set needed for the page header (`name`, `photoUrl`); `species` and `breed` display is optional and can be added when full Pet Management is implemented. |
| OQ5 | What should happen when the user closes a Create/Edit modal with unsaved data? | For v1, allow free dismiss without a confirmation dialog to keep implementation simple. Document as a known UX gap. |
