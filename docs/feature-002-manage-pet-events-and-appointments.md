# Feature: Pet Detail Page — Events and Appointments

> **File:** `docs/feature-002-manage-pet-events-and-appointments.md`  
> **Status:** Draft  
> **Date:** 2026-07-03

---

## 1. Feature Overview

**Feature Name:**  
Pet Detail Page — Events and Appointments

**Summary:**  
This feature delivers the core Pet Detail page for the Pet Manager application. It displays a pet's name and photo at the top of the page, and provides a tabbed interface with two sections: **Events** (past medical history records such as operations, exams, allergies, and general notes) and **Appointments** (future scheduled medical visits). Pet owners can create, view, edit, and delete both types of records directly from this page using modal dialogs, without navigating away.

This feature assumes a pet record has already been created and its ID is available in the URL. It depends on Feature 001 (User Authentication) for access control.

---

## 2. User Story

- As a **pet owner**, I want **to view my pet's name and photo on their detail page** so that **I can confirm I am managing the correct pet**.
- As a **pet owner**, I want **to see a list of my pet's medical events (past records)** so that **I have a complete health history at a glance**.
- As a **pet owner**, I want **to see a list of my pet's upcoming appointments** so that **I can stay organised about future veterinary visits**.
- As a **pet owner**, I want **to create a new event or appointment via a modal form** so that **I can add health records without leaving the pet detail page**.
- As a **pet owner**, I want **to edit an existing event or appointment via a modal form** so that **I can correct or update information at any time**.
- As a **pet owner**, I want **to delete an event or appointment after confirming in a modal** so that **I do not accidentally remove important records**.

---

## 3. Functional Requirements

- **FR1:** The system must display the pet's name and photo at the top of the Pet Detail page. If no photo is available, a placeholder image must be shown.
- **FR2:** The Pet Detail page must display two tabs: **Events** and **Appointments**. Only one tab is active at a time. The default active tab is **Appointments**.
- **FR3:** The active tab must display a list of its records (events or appointments). Each list item must show a summary of the record and two action buttons: **Edit** and **Delete**.
- **FR4:** If the active tab has no records, an empty state message must be displayed (e.g., "No events recorded yet." or "No appointments scheduled yet.") with a prompt to create the first record.
- **FR5:** A **Create** button must be visible in the top-right area of the active tab panel. Clicking it must open the corresponding creation modal.
- **FR6:** The **Create/Edit modal** for Events must allow the pet owner to submit the following fields:
  - Event type (required): one of "Operation", "Allergy", "Exam Result", "Vaccine", "Deworming", "Medical Note".
  - Title (required): a short description of the event (max 100 characters).
  - Date (required): the date the event occurred.
  - Description (optional): free-text details (max 500 characters).
  - Clinic or vet (optional): free-text name of clinic or veterinarian.
- **FR7:** The **Create/Edit modal** for Appointments must allow the pet owner to submit the following fields:
  - Appointment type (required): one of "Check-up", "Vaccine", "Surgery", "Deworming", "Other".
  - Date and time (required): the scheduled date and time of the appointment.
  - Clinic or doctor (required): free-text name of clinic or veterinarian.
  - Notes (optional): free-text additional notes (max 500 characters).
- **FR8:** When editing, the Create/Edit modal must pre-populate all fields with the existing record's values.
- **FR9:** Clicking **Save** in the Create/Edit modal must validate all required fields. If validation fails, inline error messages must appear next to the relevant fields and the form must not submit.
- **FR10:** On successful save (create or edit), the modal must close and the list in the active tab must refresh to reflect the change without a full page reload.
- **FR11:** Clicking **Delete** on any list item must open a **Delete Confirmation modal** that displays the record's title and a warning message. The modal must have a **Confirm Delete** button and a **Cancel** button.
- **FR12:** Confirming deletion must permanently remove the record. On success, the modal must close and the list must refresh to reflect the deletion.
- **FR13:** All requests to the API must include the authenticated user's JWT token. The system must reject requests where the pet does not belong to the authenticated user with a 403 Forbidden response.
- **FR14:** The Events tab list must display records sorted by date descending (most recent first).
- **FR15:** The Appointments tab list must display records sorted by date ascending (soonest upcoming first), with past appointments shown at the bottom.

---

## 4. Non-Functional Requirements

- **NFR1 (Performance):** All list fetch and CRUD API calls must respond within 500ms under normal load. Modal open/close transitions must not exceed 200ms.
- **NFR2 (Security):** All API endpoints for events and appointments must require a valid JWT token (`Authorization: Bearer <token>`). A user must only be able to access and modify records belonging to their own pets. Requests for other users' pet data must return 403.
- **NFR3 (Usability):** The tabbed interface must be intuitive — the active tab must be visually distinct. Modals must be dismissible by clicking Cancel, pressing Escape, or clicking outside the modal. Form validation messages must appear inline, adjacent to the relevant field.
- **NFR4 (Reliability):** If a list fetch fails (network or server error), an error message must be displayed within the tab panel with a retry option. A failed save or delete must display an error alert in the modal without closing it.
- **NFR5 (Responsiveness):** The Pet Detail page must be usable on mobile devices (minimum 375px width). Modals must be full-screen on small viewports.

---

## 5. API Requirements (Backend)

All endpoints require authentication (`Authorization: Bearer <token>`). The `{petId}` path parameter identifies the pet. The system must verify that the pet belongs to the authenticated user before processing any request.

### 5.1 Endpoints

---

**Endpoint 1: Get Pet Details**

- **Method & Path:** `GET /api/pets/{petId}`
- **Description:** Returns the pet's basic information for display in the page header.
- **Authentication:** Required.
- **Request Body:** None.
- **Response Body (Success — 200 OK):**
  ```json
  {
    "id": 1,
    "name": "Buddy",
    "photoUrl": "https://example.com/photo.jpg",
    "species": "Dog",
    "breed": "Labrador"
  }
  ```
- **Status Codes:**
  - `200 OK` – Pet found and returned.
  - `403 Forbidden` – Pet does not belong to the authenticated user.
  - `404 Not Found` – Pet with given ID does not exist.

---

**Endpoint 2: List Events for a Pet**

- **Method & Path:** `GET /api/pets/{petId}/events`
- **Description:** Returns all medical event records for the specified pet, sorted by date descending.
- **Authentication:** Required.
- **Request Body:** None.
- **Response Body (Success — 200 OK):**
  ```json
  [
    {
      "id": 1,
      "eventType": "VACCINE",
      "title": "Annual rabies vaccine",
      "date": "2026-06-15",
      "description": "Administered by Dr. Smith",
      "clinicOrVet": "City Animal Clinic"
    }
  ]
  ```
- **Status Codes:**
  - `200 OK` – List returned (may be empty array).
  - `403 Forbidden` – Pet does not belong to authenticated user.
  - `404 Not Found` – Pet not found.

---

**Endpoint 3: Create Event**

- **Method & Path:** `POST /api/pets/{petId}/events`
- **Description:** Creates a new medical event record for the pet.
- **Authentication:** Required.
- **Request Body:**
  ```json
  {
    "eventType": "VACCINE",
    "title": "Annual rabies vaccine",
    "date": "2026-06-15",
    "description": "Administered by Dr. Smith",
    "clinicOrVet": "City Animal Clinic"
  }
  ```
- **Request Body Fields:**
  - `eventType`: String, required — one of `OPERATION`, `ALLERGY`, `EXAM_RESULT`, `VACCINE`, `DEWORMING`, `MEDICAL_NOTE`
  - `title`: String, required, max 100 characters
  - `date`: String, required (ISO 8601 date `yyyy-MM-dd`)
  - `description`: String, optional, max 500 characters
  - `clinicOrVet`: String, optional
- **Response Body (Success — 201 Created):** The created event object (same shape as list item).
- **Status Codes:**
  - `201 Created` – Event created.
  - `400 Bad Request` – Validation failure.
  - `403 Forbidden` – Pet does not belong to authenticated user.
  - `404 Not Found` – Pet not found.
- **Error Handling:**
  ```json
  {
    "timestamp": "2026-07-03T10:00:00Z",
    "status": 400,
    "error": "Bad Request",
    "message": "Validation failed",
    "path": "/api/pets/1/events",
    "fieldErrors": [{ "field": "title", "message": "Title is required" }]
  }
  ```

---

**Endpoint 4: Update Event**

- **Method & Path:** `PUT /api/pets/{petId}/events/{eventId}`
- **Description:** Updates an existing medical event record.
- **Authentication:** Required.
- **Request Body:** Same fields as Create Event (all required fields must be included).
- **Response Body (Success — 200 OK):** The updated event object.
- **Status Codes:**
  - `200 OK` – Event updated.
  - `400 Bad Request` – Validation failure.
  - `403 Forbidden` – Pet or event does not belong to authenticated user.
  - `404 Not Found` – Pet or event not found.

---

**Endpoint 5: Delete Event**

- **Method & Path:** `DELETE /api/pets/{petId}/events/{eventId}`
- **Description:** Permanently deletes a medical event record.
- **Authentication:** Required.
- **Request Body:** None.
- **Response Body (Success — 204 No Content):** Empty.
- **Status Codes:**
  - `204 No Content` – Event deleted.
  - `403 Forbidden` – Not authorized.
  - `404 Not Found` – Event not found.

---

**Endpoint 6: List Appointments for a Pet**

- **Method & Path:** `GET /api/pets/{petId}/appointments`
- **Description:** Returns all appointment records for the specified pet, sorted by scheduled date ascending.
- **Authentication:** Required.
- **Request Body:** None.
- **Response Body (Success — 200 OK):**
  ```json
  [
    {
      "id": 1,
      "appointmentType": "CHECK_UP",
      "dateTime": "2026-08-01T10:30",
      "clinicOrDoctor": "City Animal Clinic",
      "notes": "Annual wellness check"
    }
  ]
  ```
- **Status Codes:**
  - `200 OK` – List returned (may be empty array).
  - `403 Forbidden` – Pet does not belong to authenticated user.
  - `404 Not Found` – Pet not found.

---

**Endpoint 7: Create Appointment**

- **Method & Path:** `POST /api/pets/{petId}/appointments`
- **Description:** Creates a new appointment for the pet.
- **Authentication:** Required.
- **Request Body:**
  ```json
  {
    "appointmentType": "CHECK_UP",
    "dateTime": "2026-08-01T10:30",
    "clinicOrDoctor": "City Animal Clinic",
    "notes": "Annual wellness check"
  }
  ```
- **Request Body Fields:**
  - `appointmentType`: String, required — one of `CHECK_UP`, `VACCINE`, `SURGERY`, `DEWORMING`, `OTHER`
  - `dateTime`: String, required (ISO 8601 datetime `yyyy-MM-dd'T'HH:mm`)
  - `clinicOrDoctor`: String, required
  - `notes`: String, optional, max 500 characters
- **Response Body (Success — 201 Created):** The created appointment object.
- **Status Codes:**
  - `201 Created` – Appointment created.
  - `400 Bad Request` – Validation failure.
  - `403 Forbidden` – Pet does not belong to authenticated user.
  - `404 Not Found` – Pet not found.

---

**Endpoint 8: Update Appointment**

- **Method & Path:** `PUT /api/pets/{petId}/appointments/{appointmentId}`
- **Description:** Updates an existing appointment.
- **Authentication:** Required.
- **Request Body:** Same fields as Create Appointment.
- **Response Body (Success — 200 OK):** The updated appointment object.
- **Status Codes:**
  - `200 OK` – Appointment updated.
  - `400 Bad Request` – Validation failure.
  - `403 Forbidden` – Pet or appointment does not belong to authenticated user.
  - `404 Not Found` – Pet or appointment not found.

---

**Endpoint 9: Delete Appointment**

- **Method & Path:** `DELETE /api/pets/{petId}/appointments/{appointmentId}`
- **Description:** Permanently deletes an appointment.
- **Authentication:** Required.
- **Request Body:** None.
- **Response Body (Success — 204 No Content):** Empty.
- **Status Codes:**
  - `204 No Content` – Appointment deleted.
  - `403 Forbidden` – Not authorized.
  - `404 Not Found` – Appointment not found.

---

## 6. UI Requirements (Frontend)

### 6.1 Screens / Pages

---

**Screen: PetDetailPage**

- **Route:** `/pets/:petId`
- **Description:** The main pet detail page. Displays the pet header and the tabbed events/appointments interface.
- **Components:**
  - `PetHeader` — displays pet name and photo (or placeholder).
  - `TabBar` — two tabs: "Events" and "Appointments".
  - `EventsTab` — tab panel for medical event records.
  - `AppointmentsTab` — tab panel for appointment records.
  - `EventFormModal` — modal for creating or editing events.
  - `AppointmentFormModal` — modal for creating or editing appointments.
  - `DeleteConfirmModal` — modal for confirming deletion.
  - `ErrorAlert` — displays API errors.
- **States:**
  - Loading: Spinner shown while pet details and list are fetching.
  - Idle (with data): Pet header visible, active tab shows list of records with Create button.
  - Idle (empty): Active tab shows empty state message and Create prompt.
  - Error: Error alert shown with retry option if fetching fails.

---

**Screen: EventFormModal**

- **Description:** Modal dialog for creating a new medical event or editing an existing one.
- **Components:** Event type selector, Title input, Date picker, Description textarea, Clinic/Vet input, Save button, Cancel button.
- **States:**
  - Idle: Form with empty fields (create) or pre-populated fields (edit).
  - Loading: Save button shows spinner and is disabled while the API call is in progress.
  - Validation Error: Inline field errors shown for missing required fields.
  - API Error: Error alert shown at the top of the modal without closing it.

---

**Screen: AppointmentFormModal**

- **Description:** Modal dialog for creating or editing an appointment.
- **Components:** Appointment type selector, Date-time picker, Clinic/Doctor input, Notes textarea, Save button, Cancel button.
- **States:** Same pattern as EventFormModal.

---

**Screen: DeleteConfirmModal**

- **Description:** Modal dialog asking the user to confirm deletion of a record.
- **Components:** Record title displayed in warning text, Confirm Delete button (destructive style), Cancel button.
- **States:**
  - Idle: Confirmation message and both buttons visible.
  - Loading: Confirm Delete button shows spinner and is disabled.
  - Error: Error alert shown without closing the modal.

### 6.2 Interactions

- **Tab switching:** Clicking a tab label activates that tab panel. The selected tab is visually distinguished (bold text, bottom border or background highlight). Switching tabs does not lose unsaved modal state.
- **Opening Create modal:** Clicking the **Create** button in the active tab opens the corresponding modal with all fields empty.
- **Opening Edit modal:** Clicking the **Edit** button on a list item opens the corresponding modal pre-populated with that record's data.
- **Saving a record:** Clicking **Save** in the modal triggers client-side validation. If validation passes, the API is called. On success, the modal closes and the list refreshes. On API error, an error alert appears inside the modal without closing it.
- **Cancelling a modal:** Clicking **Cancel**, pressing **Escape**, or clicking the modal backdrop dismisses the modal with no changes.
- **Opening Delete modal:** Clicking the **Delete** button on a list item opens the DeleteConfirmModal with the record's title shown.
- **Confirming deletion:** Clicking **Confirm Delete** calls the API. On success, the modal closes and the record is removed from the list. On API error, an error alert appears inside the modal.

---

## 7. Acceptance Criteria

- **AC1:** Given an authenticated user navigates to `/pets/:petId`, the page displays the pet's name and photo (or a placeholder) at the top.
- **AC2:** Given the page loads, the Appointments tab is active by default and the Events tab is also visible.
- **AC3:** Given a pet has appointments, the Appointments tab displays a list with each item showing a summary and Edit and Delete buttons.
- **AC4:** Given a pet has no events, the Events tab displays an empty state message and a Create prompt.
- **AC5:** Given the user clicks Create in the Appointments tab, an AppointmentFormModal opens with all fields empty.
- **AC6:** Given the user submits the Appointment form with all required fields filled, a new appointment is created, the modal closes, and the list updates without a full page reload.
- **AC7:** Given the user submits the Appointment form with the dateTime field empty, an inline error message appears next to that field and the form does not submit.
- **AC8:** Given the user clicks Edit on an event, the EventFormModal opens pre-populated with that event's existing data.
- **AC9:** Given the user edits an event and saves, the updated record is reflected in the list immediately after the modal closes.
- **AC10:** Given the user clicks Delete on an appointment, a DeleteConfirmModal displays the appointment's type and clinic/doctor name in the confirmation message.
- **AC11:** Given the user confirms deletion, the appointment is removed from the list and the modal closes.
- **AC12:** Given the user clicks Cancel in the DeleteConfirmModal, no data is deleted and the modal closes.
- **AC13:** Given a user attempts to access `/pets/:petId` where the pet belongs to a different user, the API returns 403 and the page displays an error.
- **AC14:** Given the API call to fetch appointments fails (network error), an error message is shown in the Appointments tab panel with a retry button.

---

## 8. Out of Scope

- Creating a new pet (covered by a separate Pet Management feature).
- Editing the pet's basic information (name, photo, species, breed) from this page.
- Attaching files or images to events or appointments.
- Filtering or searching the events/appointments list.
- Pagination of the events or appointments list (v1 loads all records).
- Email or push notification reminders for upcoming appointments.
- Sharing pet records with veterinarians (v2 feature).
- Any doctor/veterinarian role actions on this page.
- Sorting selection by the user (sort order is fixed per FR14 and FR15).

---

## 9. Dependencies and Constraints

**Dependencies:**

- Depends on **Feature 001 – User Authentication**: a valid JWT token must be present for all API calls. The `ProtectedRoute` component must guard the `/pets/:petId` route.
- Depends on a **Pet Management feature** (to be specified) that creates and stores pet records. The pet with the given `petId` must already exist in the database.
- Frontend depends on the existing `AuthContext` and `apiClient` (Axios instance) from Feature 001.

**Constraints:**

- All API endpoints are scoped to the authenticated user — no cross-user data access is permitted.
- The page must be responsive and functional on mobile viewports (minimum 375px width).
- Modal interactions must be keyboard accessible: modals must trap focus and be dismissible with the Escape key.
- Event types and Appointment types are fixed enumerations — free-text type entry is not supported in v1.

---

## 10. Open Questions

- **OQ1:** Should past appointments (date in the past) be visually distinguished from upcoming ones (e.g., greyed out or shown in a separate sub-section)?
- **OQ2:** Should Events and Appointments be combined into a single chronological timeline view in a future version, or remain as separate tabs permanently?
- **OQ3:** Should the Events tab show all event types in a single list, or should sub-tabs (e.g., Operations | Allergies | Exams) be added in v1?
- **OQ4:** Is there a maximum number of events or appointments per pet that should be enforced, or should the list be unlimited in v1?
- **OQ5:** Should there be a confirmation step when closing a modal with unsaved changes, or can the user dismiss freely?

---

## 11. Notes

- **Image reference:** This spec was derived from a hand-drawn wireframe showing a pet name/photo header, an Events/Appointments tab bar (Appointments active), a list of records with [edit] and [delete] per row, a Create button, and notes indicating that Create/Edit opens a modal and Delete opens a confirmation modal.
- **Terminology:** Use "Event" (not "Record" or "Item") in the UI for medical history entries. Use "Appointment" for future scheduled visits. This aligns with the `project-overview.md` naming conventions.
- **Tab default:** The Appointments tab is the default active tab based on the wireframe where it appears selected. This can be revisited if the product team prefers Events as default.
- **Future alignment:** The Event types defined here (Operation, Allergy, Exam Result, Vaccine, Deworming, Medical Note) are designed to align with the `project-overview.md` categories for Pet Medical History, ensuring future consistency when those features are fully elaborated.
