# Clubs API Documentation

Base URL: `/clubs`

All responses follow the standard envelope format:

```json
{
  "message": "...",
  "status": "success",
  "data": { ... }
}
```

Authentication is via JWT (cookie or `Authorization` header). Endpoints marked **Auth** require a valid token. Endpoints marked **Admin/Mod** additionally require `admin` or `moderator` role.

---

## Enums

### ClubStatusEnum

| Value | Description |
|-------|-------------|
| `live` | Club is visible to all users |
| `flagged` | Club has been flagged for review |
| `hidden` | Club has been hidden by an admin/moderator |

### ClubTargetingEnum

| Value | Description |
|-------|-------------|
| `public` | Visible to all departments |
| `specific` | Visible only to selected departments |
| `exclude` | Visible to all departments except selected ones |

### ClubFlagStatusEnum

| Value | Description |
|-------|-------------|
| `pending` | Flag awaiting review |
| `reviewed` | Flag has been reviewed |
| `dismissed` | Flag was dismissed as invalid |

### ClubRequestStatusEnum

| Value | Description |
|-------|-------------|
| `pending` | Request awaiting review |
| `fulfilled` | Request has been fulfilled |
| `dismissed` | Request was dismissed |

---

## Data Models

### Club

```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "externalLink": "string",
  "imageUrl": "string | null",
  "imageKey": "string | null",
  "tags": ["string"] | null,
  "interests": ["string"] | null,
  "targeting": "public | specific | exclude",
  "status": "live | flagged | hidden",
  "organizerId": "uuid",
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601",
  "organizer": {
    "id": "uuid",
    "firstName": "string",
    "lastName": "string",
    "username": "string",
    "profilePicture": "string | null"
  },
  "targetDepartments": [
    {
      "clubId": "uuid",
      "departmentId": "uuid",
      "department": { "id": "uuid", "name": "string", "facultyId": "uuid", ... }
    }
  ]
}
```

### Club Flag

```json
{
  "id": "uuid",
  "clubId": "uuid",
  "reporterId": "uuid",
  "reason": "string",
  "status": "pending | reviewed | dismissed",
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601",
  "club": { ... },
  "reporter": {
    "id": "uuid",
    "firstName": "string",
    "lastName": "string"
  }
}
```

### Club Request

```json
{
  "id": "uuid",
  "name": "string",
  "interest": "string",
  "message": "string | null",
  "requesterId": "uuid",
  "status": "pending | fulfilled | dismissed",
  "createdAt": "ISO 8601",
  "updatedAt": "ISO 8601",
  "requester": {
    "id": "uuid",
    "firstName": "string",
    "lastName": "string"
  }
}
```

---

## Endpoints

### 1. Create Club

```
POST /clubs
```

**Auth:** Required  
**Content-Type:** `multipart/form-data`

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Club name |
| `description` | string | ✅ | Club description |
| `externalLink` | string | ✅ | External URL (e.g. WhatsApp group link) |
| `interests` | string[] | ✅ | List of interest categories |
| `tags` | string[] | ❌ | Searchable tags |
| `targeting` | enum | ❌ | `public` (default), `specific`, or `exclude` |
| `targetDepartmentIds` | uuid[] | ❌ | Required when `targeting` is not `public` |
| `image` | file | ❌ | Club image (uploaded via form field `image`) |

> `interests`, `tags`, and `targetDepartmentIds` are string arrays sent as comma-separated values in multipart form data (transformed via `@TransformStringToArray()`).

**Response:** `201 Created`

```json
{
  "message": "Club created successfully",
  "status": "success",
  "data": { /* Club object with organizer and targetDepartments */ }
}
```

---

### 2. List Clubs (Paginated)

```
GET /clubs
```

**Auth:** Not required

| Query Param | Type | Required | Description |
|-------------|------|----------|-------------|
| `page` | number | ❌ | Page number (default: 1) |
| `limit` | number | ❌ | Items per page (default: 10, max: 100) |
| `search` | string | ❌ | Search by name or description (case-insensitive) |
| `interest` | string | ❌ | Filter by interest category |
| `departmentId` | uuid | ❌ | Filter by targeted department |
| `status` | enum | ❌ | Filter by club status |
| `organizerId` | uuid | ❌ | Filter by organizer |

**Response:** `200 OK`

```json
{
  "message": "Clubs retrieved successfully",
  "status": "success",
  "data": {
    "data": [ /* array of Club objects */ ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 42,
      "totalPages": 5,
      "hasMore": true,
      "hasPrev": false
    }
  }
}
```

---

### 3. Get My Clubs

```
GET /clubs/me
```

**Auth:** Required

Same query parameters and response shape as **List Clubs**, but automatically filtered to clubs owned by the authenticated user.

---

### 4. Get Club by ID

```
GET /clubs/:id
```

**Auth:** Not required

| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Club ID |

**Response:** `200 OK`

```json
{
  "message": "Club retrieved successfully",
  "status": "success",
  "data": { /* Club object with organizer and targetDepartments */ }
}
```

**Errors:**
- `404` — Club not found

> If the club's image URL has expired (older than 7 days), a fresh signed URL is generated automatically.

---

### 5. Update Club

```
PATCH /clubs/:id
```

**Auth:** Required (organizer, admin, or moderator)  
**Content-Type:** `multipart/form-data`

| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Club ID |

All body fields from **Create Club** are accepted, all optional (partial update).  
If a new `image` file is provided, the old image is deleted from storage and replaced.  
If `targetDepartmentIds` is provided, the target departments are fully replaced.  
If `targeting` is changed to `public`, all target departments are cleared.

**Response:** `200 OK`

```json
{
  "message": "Club updated successfully",
  "status": "success",
  "data": { /* Updated Club object */ }
}
```

**Errors:**
- `403` — Not the organizer or an admin/moderator
- `404` — Club not found

---

### 6. Delete Club

```
DELETE /clubs/:id
```

**Auth:** Required (organizer or admin)

| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Club ID |

Deletes the club and its image from storage. Related records (clicks, flags, target departments) are cascade-deleted.

**Response:** `200 OK`

```json
{
  "message": "Club deleted successfully",
  "status": "success",
  "data": { /* Deleted Club object */ }
}
```

**Errors:**
- `403` — Not the organizer or an admin
- `404` — Club not found

---

### 7. Track Click

```
POST /clubs/:id/click
```

**Auth:** Required

| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Club ID |

Records a click for analytics (captures user ID and department ID). Returns the club's external link and total click count.

**Response:** `200 OK`

```json
{
  "message": "Click tracked successfully",
  "status": "success",
  "data": {
    "externalLink": "https://chat.whatsapp.com/...",
    "clickCount": 157
  }
}
```

**Errors:**
- `404` — Club not found

---

### 8. Update Club Status

```
PATCH /clubs/:id/status
```

**Auth:** Required  
**Roles:** Admin, Moderator

| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Club ID |

| Body Field | Type | Required | Description |
|------------|------|----------|-------------|
| `status` | enum | ✅ | `live`, `flagged`, or `hidden` |

**Response:** `200 OK`

```json
{
  "message": "Club status updated successfully",
  "status": "success",
  "data": { /* Updated Club object */ }
}
```

**Errors:**
- `404` — Club not found

---

### 9. Flag a Club

```
POST /clubs/:id/flag
```

**Auth:** Required

| Param | Type | Description |
|-------|------|-------------|
| `id` | uuid | Club ID |

| Body Field | Type | Required | Description |
|------------|------|----------|-------------|
| `reason` | string | ✅ | Reason for flagging |

The `reporterId` and `clubId` are set automatically from the authenticated user and route param.

**Response:** `201 Created`

```json
{
  "message": "Club flagged successfully",
  "status": "success",
  "data": { /* Club Flag object */ }
}
```

**Errors:**
- `404` — Club not found

---

### 10. List Flags (Paginated)

```
GET /clubs/flags/list
```

**Auth:** Required  
**Roles:** Admin, Moderator

| Query Param | Type | Required | Description |
|-------------|------|----------|-------------|
| `status` | enum | ❌ | Filter by `pending`, `reviewed`, or `dismissed` |
| `page` | number | ❌ | Page number (default: 1) |
| `limit` | number | ❌ | Items per page (default: 10) |

**Response:** `200 OK`

```json
{
  "message": "Flags retrieved successfully",
  "status": "success",
  "data": {
    "data": [ /* array of Club Flag objects with club and reporter */ ],
    "pagination": { ... }
  }
}
```

---

### 11. Resolve Flag

```
PATCH /clubs/flags/:flagId/resolve
```

**Auth:** Required  
**Roles:** Admin, Moderator

| Param | Type | Description |
|-------|------|-------------|
| `flagId` | uuid | Flag ID |

| Body Field | Type | Required | Description |
|------------|------|----------|-------------|
| `action` | enum | ✅ | `approve`, `hide`, or `dismiss` |

**Action behavior:**

| Action | Flag Status | Club Effect |
|--------|-------------|-------------|
| `approve` | `reviewed` | Club stays live |
| `hide` | `reviewed` | Club status set to `hidden` |
| `dismiss` | `dismissed` | No change to club |

**Response:** `200 OK`

```json
{
  "message": "Flag resolved successfully",
  "status": "success",
  "data": { /* Updated Club Flag object */ }
}
```

---

### 12. Create Club Request

```
POST /clubs/requests
```

**Auth:** Required

| Body Field | Type | Required | Description |
|------------|------|----------|-------------|
| `name` | string | ✅ | Suggested club name |
| `interest` | string | ✅ | Interest/category for the club |
| `message` | string | ❌ | Additional details or justification |

The `requesterId` is set automatically from the authenticated user.

**Response:** `201 Created`

```json
{
  "message": "Club request created successfully",
  "status": "success",
  "data": { /* Club Request object */ }
}
```

---

### 13. List Club Requests (Paginated)

```
GET /clubs/requests/list
```

**Auth:** Required  
**Roles:** Admin, Moderator

| Query Param | Type | Required | Description |
|-------------|------|----------|-------------|
| `status` | enum | ❌ | Filter by `pending`, `fulfilled`, or `dismissed` |
| `page` | number | ❌ | Page number (default: 1) |
| `limit` | number | ❌ | Items per page (default: 10) |

**Response:** `200 OK`

```json
{
  "message": "Club requests retrieved successfully",
  "status": "success",
  "data": {
    "data": [ /* array of Club Request objects with requester */ ],
    "pagination": { ... }
  }
}
```

---

### 14. Update Club Request

```
PATCH /clubs/requests/:requestId
```

**Auth:** Required  
**Roles:** Admin, Moderator

| Param | Type | Description |
|-------|------|-------------|
| `requestId` | uuid | Request ID |

| Body Field | Type | Required | Description |
|------------|------|----------|-------------|
| `status` | enum | ✅ | `fulfilled` or `dismissed` |

**Response:** `200 OK`

```json
{
  "message": "Club request updated successfully",
  "status": "success",
  "data": { /* Updated Club Request object */ }
}
```

---

## Database Tables

| Table | Description |
|-------|-------------|
| `clubs` | Main clubs table |
| `club_target_departments` | Junction table for department targeting (composite PK) |
| `club_clicks` | Click tracking records (indexed on `club_id`) |
| `club_flags` | User-submitted flag/report records |
| `club_requests` | User-submitted club creation requests |

All tables use UUID primary keys. Cascade deletes are configured on all foreign keys referencing `clubs.id`. User references on `club_clicks` use `SET NULL` on delete to preserve analytics data.
