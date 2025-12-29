# Offline-First Sync API Documentation

## Overview

This API implements an **offline-first, sync-based architecture** where:
- ✅ Local device storage is the source of truth
- ✅ Backend is used only for sync, merge, and backup
- ✅ UI never depends on backend availability
- ✅ All operations are incremental and non-blocking
- ✅ Conflict resolution uses Last-Write-Wins (LWW) strategy

---

## Authentication

All sync endpoints require authentication via JWT token.

**Header:**
```
Authorization: Bearer <your_jwt_token>
```

---

## Sync Endpoints

### 1. Push Changes to Server

Push local changes from device to server.

**Endpoint:** `POST /api/v1/sync/push`

**Request Body:**
```json
{
  "deviceId": "uuid-device-123",
  "lastSyncAt": "2025-12-29T06:30:00.000Z",
  "changes": {
    "spaces": [
      {
        "id": "space_123",
        "userId": "user_456",
        "name": "Travel Goals",
        "icon": "✈️",
        "isHidden": false,
        "order": 0,
        "deleted": false,
        "deviceId": "uuid-device-123",
        "createdAt": "2025-12-28T10:00:00.000Z",
        "updatedAt": "2025-12-29T06:30:00.000Z"
      }
    ],
    "categories": [
      {
        "id": "category_456",
        "spaceId": "space_123",
        "userId": "user_456",
        "name": "Places to Visit",
        "icon": "🌍",
        "isHidden": false,
        "order": 0,
        "deleted": false,
        "deviceId": "uuid-device-123",
        "createdAt": "2025-12-28T10:00:00.000Z",
        "updatedAt": "2025-12-29T06:30:00.000Z"
      }
    ],
    "items": [
      {
        "id": "item_789",
        "spaceId": "space_123",
        "categoryId": "category_456",
        "userId": "user_456",
        "text": "Visit Paris",
        "isCompleted": false,
        "imageUrl": null,
        "description": null,
        "order": 0,
        "deleted": false,
        "deviceId": "uuid-device-123",
        "createdAt": "2025-12-28T10:00:00.000Z",
        "updatedAt": "2025-12-29T06:30:00.000Z"
      }
    ],
    "preferences": {
      "id": "pref_user_456",
      "userId": "user_456",
      "isDarkMode": true,
      "themeColor": "blue",
      "deleted": false,
      "deviceId": "uuid-device-123",
      "createdAt": "2025-12-28T10:00:00.000Z",
      "updatedAt": "2025-12-29T06:30:00.000Z"
    }
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "syncedAt": "2025-12-29T06:30:27.000Z",
    "conflicts": [],
    "accepted": {
      "spaces": 1,
      "categories": 1,
      "items": 1,
      "preferences": 1
    },
    "rejected": {
      "spaces": 0,
      "categories": 0,
      "items": 0,
      "preferences": 0
    }
  }
}
```

**Response with Conflicts:**
```json
{
  "success": true,
  "data": {
    "syncedAt": "2025-12-29T06:30:27.000Z",
    "conflicts": [
      {
        "id": "item_789",
        "type": "Item",
        "reason": "OLDER_TIMESTAMP",
        "serverUpdatedAt": "2025-12-29T06:35:00.000Z",
        "clientUpdatedAt": "2025-12-29T06:30:00.000Z"
      }
    ],
    "accepted": {
      "spaces": 1,
      "categories": 1,
      "items": 0,
      "preferences": 1
    },
    "rejected": {
      "spaces": 0,
      "categories": 0,
      "items": 1,
      "preferences": 0
    }
  }
}
```

**Conflict Resolution:**
- Uses **Last-Write-Wins (LWW)** strategy
- Compares `updatedAt` timestamps
- Newer timestamp always wins
- Rejected changes are reported in `conflicts` array

---

### 2. Pull Changes from Server

Pull incremental changes from server since last sync.

**Endpoint:** `GET /api/v1/sync/pull`

**Query Parameters:**
- `lastSyncAt` (optional): ISO timestamp of last successful sync. If omitted, returns all records.
- `deviceId` (required): Unique device identifier

**Example:**
```
GET /api/v1/sync/pull?lastSyncAt=2025-12-29T06:00:00.000Z&deviceId=uuid-device-123
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "syncedAt": "2025-12-29T06:30:27.000Z",
    "changes": {
      "spaces": [
        {
          "id": "space_999",
          "userId": "user_456",
          "name": "Work Goals",
          "icon": "💼",
          "isHidden": false,
          "order": 1,
          "deleted": false,
          "deviceId": "uuid-device-999",
          "createdAt": "2025-12-29T06:15:00.000Z",
          "updatedAt": "2025-12-29T06:20:00.000Z"
        }
      ],
      "categories": [],
      "items": [
        {
          "id": "item_888",
          "spaceId": "space_123",
          "categoryId": "category_456",
          "userId": "user_456",
          "text": "Visit Tokyo",
          "isCompleted": true,
          "imageUrl": null,
          "description": null,
          "order": 1,
          "deleted": false,
          "deviceId": "uuid-device-999",
          "createdAt": "2025-12-29T06:15:00.000Z",
          "updatedAt": "2025-12-29T06:25:00.000Z"
        }
      ],
      "preferences": null
    },
    "hasMore": false
  }
}
```

**Important Notes:**
- Only returns records modified **after** `lastSyncAt`
- Does **not** return changes from the same `deviceId` (avoids echo)
- Includes soft-deleted records (`deleted: true`)
- Client must merge these changes into local database

---

### 3. Create Full Backup

Get complete backup of all user data.

**Endpoint:** `POST /api/v1/sync/backup`

**Request Body:** None required

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "backupAt": "2025-12-29T06:30:27.000Z",
    "version": "1.0",
    "userId": "user_456",
    "spaces": [
      {
        "id": "space_123",
        "userId": "user_456",
        "name": "Travel Goals",
        "icon": "✈️",
        "isHidden": false,
        "order": 0,
        "deleted": false,
        "deviceId": "uuid-device-123",
        "createdAt": "2025-12-28T10:00:00.000Z",
        "updatedAt": "2025-12-29T06:30:00.000Z"
      }
    ],
    "categories": [...],
    "items": [...],
    "preferences": {...}
  }
}
```

**Use Cases:**
- Disaster recovery
- Account migration
- Data export
- Initial sync for new device

---

### 4. Restore from Backup

Restore user data from a backup (DANGEROUS - replaces all data).

**Endpoint:** `POST /api/v1/sync/restore`

**Request Body:**
```json
{
  "deviceId": "uuid-device-123",
  "backupData": {
    "spaces": [...],
    "categories": [...],
    "items": [...],
    "preferences": {...}
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Backup restored successfully",
  "data": {
    "restored": {
      "spaces": 5,
      "categories": 12,
      "items": 45,
      "preferences": 1
    }
  }
}
```

**Warning:**
- This operation soft-deletes all existing records
- Then restores records from backup
- Use with caution!

---

## Data Model

All records must include these fields:

### Required Fields (All Models)

| Field | Type | Description |
|-------|------|-------------|
| `id` | String | Unique identifier (client-generated) |
| `userId` | String | User who owns this record |
| `createdAt` | Date | When record was created |
| `updatedAt` | Date | When record was last modified |
| `deleted` | Boolean | Soft delete flag (default: false) |
| `deviceId` | String | Device that last modified this record |

### Space Model

```typescript
{
  id: string;              // e.g., "space_123"
  userId: string;
  name: string;
  icon: string;            // Emoji
  isHidden: boolean;
  order: number;
  deleted: boolean;
  deviceId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Category Model

```typescript
{
  id: string;              // e.g., "category_456"
  spaceId: string;         // Parent space
  userId: string;
  name: string;
  icon: string;            // Emoji
  isHidden: boolean;
  order: number;
  deleted: boolean;
  deviceId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### Item Model

```typescript
{
  id: string;              // e.g., "item_789"
  spaceId: string;         // Parent space
  categoryId: string;      // Parent category (nullable)
  userId: string;
  text: string;
  isCompleted: boolean;
  imageUrl: string | null;
  description: string | null;
  order: number;
  deleted: boolean;
  deviceId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### UserPreferences Model

```typescript
{
  id: string;              // e.g., "pref_user_456"
  userId: string;
  isDarkMode: boolean;
  themeColor: string;
  deleted: boolean;
  deviceId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Client Implementation Guide

### 1. Generate Device ID

```javascript
// Generate once and persist
const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
await AsyncStorage.setItem('deviceId', deviceId);
```

### 2. Sync Flow

```javascript
async function syncData() {
  const deviceId = await AsyncStorage.getItem('deviceId');
  const lastSyncAt = await AsyncStorage.getItem('lastSyncAt');
  
  // 1. Push local changes
  const localChanges = await getLocalChanges(lastSyncAt);
  const pushResponse = await fetch('/api/v1/sync/push', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      deviceId,
      lastSyncAt,
      changes: localChanges
    })
  });
  
  // 2. Pull server changes
  const pullResponse = await fetch(
    `/api/v1/sync/pull?lastSyncAt=${lastSyncAt}&deviceId=${deviceId}`,
    {
      headers: { 'Authorization': `Bearer ${token}` }
    }
  );
  
  const { data } = await pullResponse.json();
  
  // 3. Merge server changes into local DB
  await mergeServerChanges(data.changes);
  
  // 4. Update last sync timestamp
  await AsyncStorage.setItem('lastSyncAt', data.syncedAt);
}
```

### 3. Handle Soft Deletes

```javascript
// When deleting locally
async function deleteItem(itemId) {
  const now = new Date().toISOString();
  const deviceId = await AsyncStorage.getItem('deviceId');
  
  await db.execute(
    'UPDATE items SET deleted = 1, updatedAt = ?, deviceId = ? WHERE id = ?',
    [now, deviceId, itemId]
  );
  
  // UI should filter out deleted items
  // Sync will propagate the delete to server
}
```

### 4. Conflict Handling

```javascript
// Client should handle conflicts from push response
const { conflicts } = pushResponse.data;

if (conflicts.length > 0) {
  // Option 1: Accept server version (pull again)
  await syncData();
  
  // Option 2: Show user and let them decide
  showConflictDialog(conflicts);
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `MISSING_DEVICE_ID` | deviceId is required |
| `MISSING_CHANGES` | changes object is required |
| `MISSING_BACKUP_DATA` | backupData is required |
| `UNAUTHORIZED` | Invalid or missing JWT token |
| `RATE_LIMIT_EXCEEDED` | Too many requests |

---

## Best Practices

### ✅ DO

- Generate unique `deviceId` per device and persist it
- Always include `deviceId` in sync requests
- Use `updatedAt` for conflict resolution
- Implement soft deletes (set `deleted: true`)
- Sync in background, don't block UI
- Handle offline gracefully
- Queue changes when offline
- Retry failed syncs with exponential backoff

### ❌ DON'T

- Don't hard delete records
- Don't sync on every change (batch them)
- Don't block UI waiting for sync
- Don't trust client timestamps (server validates)
- Don't sync without authentication
- Don't ignore conflicts

---

## Migration from Old API

### Old Endpoints (DEPRECATED)

```
❌ GET    /api/v1/spaces
❌ POST   /api/v1/spaces
❌ PUT    /api/v1/spaces/:id
❌ DELETE /api/v1/spaces/:id
❌ POST   /api/v1/spaces/:spaceId/items/toggle
❌ GET    /api/v1/stats
```

### New Approach

Instead of CRUD operations, use sync:

```javascript
// OLD: Create space
await fetch('/api/v1/spaces', {
  method: 'POST',
  body: JSON.stringify({ name: 'Travel' })
});

// NEW: Create locally, sync later
const space = {
  id: generateId(),
  userId,
  name: 'Travel',
  icon: '✈️',
  deleted: false,
  deviceId,
  createdAt: new Date(),
  updatedAt: new Date()
};
await db.insert('spaces', space);
await syncData(); // Background sync
```

---

## Testing with Postman

### 1. Login First

```
POST /api/v1/auth/login
{
  "email": "test@example.com",
  "password": "password123"
}
```

Copy the `token` from response.

### 2. Push Changes

```
POST /api/v1/sync/push
Headers:
  Authorization: Bearer <token>
Body:
{
  "deviceId": "test-device-123",
  "lastSyncAt": "2025-12-29T00:00:00.000Z",
  "changes": {
    "spaces": [{
      "id": "space_test_1",
      "userId": "<your_user_id>",
      "name": "Test Space",
      "icon": "📝",
      "isHidden": false,
      "order": 0,
      "deleted": false,
      "deviceId": "test-device-123",
      "createdAt": "2025-12-29T06:00:00.000Z",
      "updatedAt": "2025-12-29T06:30:00.000Z"
    }],
    "categories": [],
    "items": [],
    "preferences": null
  }
}
```

### 3. Pull Changes

```
GET /api/v1/sync/pull?lastSyncAt=2025-12-29T00:00:00.000Z&deviceId=test-device-123
Headers:
  Authorization: Bearer <token>
```

---

## Performance Considerations

- **Incremental Sync**: Only changed records are transferred
- **Device Filtering**: Don't echo changes back to same device
- **Indexes**: Optimized for `userId + updatedAt` queries
- **Batch Operations**: Process multiple records in single request
- **Lean Queries**: Use `.lean()` for better performance

---

## Future Enhancements

- [ ] Pagination for large datasets
- [ ] Compression for sync payloads
- [ ] Delta sync (only changed fields)
- [ ] Conflict resolution UI
- [ ] Sync analytics and monitoring
- [ ] Multi-user collaboration
- [ ] Real-time sync via WebSockets

---

## Support

For questions or issues, please contact the development team.

**Version:** 1.0  
**Last Updated:** 2025-12-29
