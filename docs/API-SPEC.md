
# CampusConnect API Specification

Base URL (local): `http://localhost:3000`

All requests and responses use JSON. Errors always look like `{ "error": "message" }`.

## 1. Required endpoints

| Method | Endpoint | Purpose | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/health` | Checks that the API is running. | 200 OK | none |
| POST | `/api/v1/sessions` | Logs in (creates a session). | 200 OK | 400, 401 |
| GET | `/api/v1/users/me` | Returns the logged-in user. Needs a token. | 200 OK | 401 |

Unknown address: **404** `{ "error": "Not found." }`
Unexpected server error: **500** `{ "error": "Something went wrong." }`

### 1.1 GET /api/v1/health

Request: no body.

**200 OK**
```json
{ "status": "ok" }
```

### 1.2 POST /api/v1/sessions

Request body:
```json
{ "email": "student@campusconnect.test", "password": "Campus26" }
```

**200 OK** (login succeeded)
```json
{
  "token": "<a long token text>",
  "user": { "id": 1, "name": "Demo Student", "email": "student@campusconnect.test" }
}
```

**400 Bad Request** (email or password missing or badly formed)
```json
{ "error": "Email and password are required." }
```

**401 Not logged in** (wrong password OR unknown email, same message for both)
```json
{ "error": "Invalid email or password." }
```

Note: the same 401 message is used for both cases so an attacker cannot find out which emails exist.

### 1.3 GET /api/v1/users/me

Request header:
```
Authorization: Bearer <token>
```

**200 OK**
```json
{ "id": 1, "name": "Demo Student", "email": "student@campusconnect.test" }
```

**401 Not logged in** (token missing, wrong, or expired)
```json
{ "error": "Not logged in." }
```

The password and its hash are never sent in any response.

## 2. Events (design only)

This resource is a design on paper. It is not built. It follows the Week 12 conventions: nouns in the address (no verbs), plural names, the method is the verb, and the version is in the address.

| Method | Endpoint | Purpose | Success | Errors |
| --- | --- | --- | --- | --- |
| GET | `/api/v1/events` | List all events | 200 OK | none |
| GET | `/api/v1/events/{id}` | Get one event | 200 OK | 404 |
| POST | `/api/v1/events` | Add an event | 201 Created | 400, 401 |
| PATCH | `/api/v1/events/{id}` | Change part of one event | 200 OK | 400, 401, 404 |
| DELETE | `/api/v1/events/{id}` | Delete one event | 204 No Content | 401, 404 |
| GET | `/api/v1/events?month=11` | Filter events by month | 200 OK | 400 |

### 2.1 Event object
```json
{
  "id": 7,
  "title": "Foundation Day",
  "date": "2026-11-20",
  "place": "School Gym",
  "description": "Annual school celebration."
}
```

### 2.2 Examples

**GET /api/v1/events** → 200 OK
```json
[
  { "id": 7, "title": "Foundation Day", "date": "2026-11-20", "place": "School Gym", "description": "Annual school celebration." },
  { "id": 8, "title": "Science Fair", "date": "2026-11-27", "place": "Room 204", "description": "Student projects." }
]
```

**GET /api/v1/events/7** → 200 OK
```json
{ "id": 7, "title": "Foundation Day", "date": "2026-11-20", "place": "School Gym", "description": "Annual school celebration." }
```

**GET /api/v1/events/999** → 404 Not Found
```json
{ "error": "Event not found." }
```

**POST /api/v1/events** (needs `Authorization: Bearer <token>`)

Request body:
```json
{ "title": "Sports Day", "date": "2026-12-05", "place": "Oval", "description": "Inter-class games." }
```
201 Created:
```json
{ "id": 9, "title": "Sports Day", "date": "2026-12-05", "place": "Oval", "description": "Inter-class games." }
```
400 Bad Request (a field is missing or badly formed):
```json
{ "error": "Title and date are required." }
```

**PATCH /api/v1/events/9** (needs a token). Send only the fields to change.

Request body:
```json
{ "place": "Main Gym" }
```
200 OK:
```json
{ "id": 9, "title": "Sports Day", "date": "2026-12-05", "place": "Main Gym", "description": "Inter-class games." }
```

**DELETE /api/v1/events/9** (needs a token) → 204 No Content (empty body)

**GET /api/v1/events?month=11** → 200 OK, only events in November
```json
[
  { "id": 7, "title": "Foundation Day", "date": "2026-11-20", "place": "School Gym", "description": "Annual school celebration." },
  { "id": 8, "title": "Science Fair", "date": "2026-11-27", "place": "Room 204", "description": "Student projects." }
]
```
400 Bad Request (month is not 1 to 12):
```json
{ "error": "Month must be a number from 1 to 12." }
```

### 2.3 Rules
- Reading events (GET) is public. Adding, changing and deleting need a valid token.
- A missing, wrong or expired token returns 401 `{ "error": "Not logged in." }`.
- Unknown routes return 404 `{ "error": "Not found." }`. Unexpected errors return 500 `{ "error": "Something went wrong." }`, with no stack traces.
