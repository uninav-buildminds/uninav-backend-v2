# Bookmarks API Documentation

## Overview

The Bookmarks API allows users to save and manage their favorite study materials and collections. Users can add, remove, and retrieve their bookmarks.

## Base URL

```
/api/user/bookmarks
```

## Authentication

All bookmark endpoints require authentication using a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Create Bookmark

Creates a new bookmark for either a study material or collection.

**Endpoint:** `POST /api/user/bookmarks`

**Request Body:**

```json
{
  "materialId": "string (optional)",
  "collectionId": "string (optional)",
  "note": "string (optional)"
}
```

Note: Either `materialId` or `collectionId` must be provided, but not both.

**Response (201):**

```json
{
  "success": true,
  "message": "Bookmark added successfully",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "materialId": "uuid",
    "collectionId": "uuid",
    "note": "string",
    "createdAt": "timestamp",
    "updatedAt": "timestamp"
  }
}
```

**Error Responses:**

- 400: Bad Request - Invalid input or missing required fields
- 409: Conflict - Bookmark already exists
- 401: Unauthorized - Invalid or missing token

### 2. Get All Bookmarks

Retrieves all bookmarks for the authenticated user.

**Endpoint:** `GET /api/user/bookmarks`

**Response (200):**

```json
{
  "success": true,
  "message": "Bookmarks retrieved successfully",
  "data": [
    {
      "id": "uuid",
      "material": {
        "id": "uuid",
        "title": "string",
        "description": "string"
        // ... other material properties
      },
      "collection": {
        "id": "uuid",
        "name": "string"
        // ... other collection properties
      },
      "note": "string",
      "createdAt": "timestamp"
    }
  ]
}
```

### 3. Get Specific Bookmark

Retrieves details of a specific bookmark.

**Endpoint:** `GET /api/user/bookmarks/:bookmarkId`

**Parameters:**

- `bookmarkId`: UUID of the bookmark

**Response (200):**

```json
{
  "success": true,
  "message": "Bookmark retrieved successfully",
  "data": {
    "id": "uuid",
    "material": {
      // material details if bookmarked
    },
    "collection": {
      // collection details if bookmarked
    },
    "note": "string",
    "createdAt": "timestamp"
  }
}
```

**Error Responses:**

- 404: Not Found - Bookmark doesn't exist
- 403: Forbidden - Bookmark belongs to another user

### 4. Delete Bookmark

Removes a bookmark.

**Endpoint:** `DELETE /api/user/bookmarks/:bookmarkId`

**Parameters:**

- `bookmarkId`: UUID of the bookmark to delete

**Response (200):**

```json
{
  "success": true,
  "message": "Bookmark removed successfully",
  "data": {
    "id": "uuid"
  }
}
```

**Error Responses:**

- 404: Not Found - Bookmark doesn't exist
- 403: Forbidden - Bookmark belongs to another user

## Caching

- Bookmark listings and individual bookmark retrievals are cached for 5 minutes
- Cache is private to each user
- POST and DELETE operations automatically invalidate the cache

## Best Practices

1. Always check for both materialId and collectionId when creating bookmarks
2. Handle potential conflicts when creating bookmarks
3. Implement proper error handling for all API responses
4. Use the provided pagination parameters for listing bookmarks in large datasets
5. Consider implementing client-side caching for better performance
