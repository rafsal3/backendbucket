# Offline-First Sync-Based Backend Refactoring Plan

## Executive Summary
Refactor the existing Node.js CRUD backend into an offline-first, sync-based architecture where local device storage is the source of truth and the backend serves only for synchronization, conflict resolution, and backup.

## Current Architecture Issues
- ❌ Traditional CRUD endpoints that UI depends on
- ❌ Full data fetches on every request
- ❌ UI-blocking operations
- ❌ No soft delete support
- ❌ No device tracking
- ❌ Hard deletes in database

## Target Architecture (Offline-First)
- ✅ Local device storage is source of truth
- ✅ Backend used only for sync/merge/backup
- ✅ UI never depends on backend availability
- ✅ Incremental sync only
- ✅ Non-blocking background sync
- ✅ Soft deletes only
- ✅ Device-aware conflict resolution

---

## Phase 1: Data Model Updates

### 1.1 Add Required Fields to All Models
All models (Space, Category, Item, UserPreferences) must include:

```javascript
{
  id: String,              // Client-generated UUID
  userId: String,          // User reference
  createdAt: Date,         // Creation timestamp
  updatedAt: Date,         // Last modification timestamp
  deleted: Boolean,        // Soft delete flag (default: false)
  deviceId: String         // Device that last modified this record
}
```

### 1.2 Model-Specific Changes

#### Space Model
- Keep: `spaceId` → rename to `id`
- Add: `deleted`, `deviceId`
- Keep: `name`, `icon`, `isHidden`, `order`, `userId`

#### Category Model
- Keep: `categoryId` → rename to `id`
- Add: `deleted`, `deviceId`
- Keep: `name`, `icon`, `isHidden`, `order`, `spaceId`, `userId`

#### Item Model
- Keep: `itemId` → rename to `id`
- Add: `deleted`, `deviceId`
- Keep: `text`, `isCompleted`, `imageUrl`, `description`, `order`, `spaceId`, `categoryId`, `userId`

#### UserPreferences Model
- Add: `id`, `deleted`, `deviceId`
- Keep: existing preference fields

---

## Phase 2: Remove/Deprecate CRUD Endpoints

### 2.1 Endpoints to REMOVE
```
DELETE /api/v1/spaces/:id
DELETE /api/v1/spaces/:spaceId/categories/:id
DELETE /api/v1/spaces/:spaceId/items/:id
POST   /api/v1/spaces/:spaceId/items/toggle
GET    /api/v1/stats
```

### 2.2 Endpoints to DEPRECATE (mark as legacy)
```
GET    /api/v1/spaces
GET    /api/v1/spaces/:id
POST   /api/v1/spaces
PUT    /api/v1/spaces/:id
GET    /api/v1/spaces/:spaceId/categories
POST   /api/v1/spaces/:spaceId/categories
PUT    /api/v1/spaces/:spaceId/categories/:id
GET    /api/v1/spaces/:spaceId/items
POST   /api/v1/spaces/:spaceId/items
PUT    /api/v1/spaces/:spaceId/items/:id
```

### 2.3 Endpoints to KEEP
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
GET    /api/v1/external/movies/search
GET    /api/v1/external/books/search
```

---

## Phase 3: Implement Sync Endpoints

### 3.1 POST /api/v1/sync/push
**Purpose**: Push local changes to server

**Request Body**:
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
    "categories": [...],
    "items": [...],
    "preferences": {...}
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "syncedAt": "2025-12-29T06:30:27.000Z",
    "conflicts": [],
    "accepted": {
      "spaces": 5,
      "categories": 12,
      "items": 45,
      "preferences": 1
    }
  }
}
```

**Logic**:
1. For each record in changes:
   - Check if record exists in DB
   - If exists: Compare `updatedAt` timestamps
     - If incoming `updatedAt` > DB `updatedAt`: Accept (last write wins)
     - If incoming `updatedAt` <= DB `updatedAt`: Reject (older data)
   - If not exists: Insert new record
2. All operations are idempotent
3. User-scoped (only update records for authenticated user)

### 3.2 GET /api/v1/sync/pull
**Purpose**: Pull changes from server since last sync

**Query Parameters**:
```
?lastSyncAt=2025-12-29T06:00:00.000Z
&deviceId=uuid-device-123
```

**Response**:
```json
{
  "success": true,
  "data": {
    "syncedAt": "2025-12-29T06:30:27.000Z",
    "changes": {
      "spaces": [
        {
          "id": "space_789",
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
      "categories": [...],
      "items": [...],
      "preferences": {...}
    },
    "hasMore": false
  }
}
```

**Logic**:
1. Query all records where:
   - `userId` = authenticated user
   - `updatedAt` > `lastSyncAt`
   - `deviceId` != requesting device (don't send back own changes)
2. Return incremental changes only
3. Include soft-deleted records (`deleted: true`)

### 3.3 POST /api/v1/sync/backup
**Purpose**: Full backup of user data

**Response**:
```json
{
  "success": true,
  "data": {
    "backupAt": "2025-12-29T06:30:27.000Z",
    "version": "1.0",
    "spaces": [...],
    "categories": [...],
    "items": [...],
    "preferences": {...}
  }
}
```

**Logic**:
- Return ALL records for user (including deleted)
- Used for disaster recovery
- Optional endpoint

---

## Phase 4: Conflict Resolution Strategy

### Last Write Wins (LWW)
- Compare `updatedAt` timestamps
- Most recent timestamp wins
- Ignore older data
- Simple and predictable

### Implementation
```javascript
function shouldAcceptChange(incomingRecord, existingRecord) {
  if (!existingRecord) return true; // New record
  
  const incomingTime = new Date(incomingRecord.updatedAt);
  const existingTime = new Date(existingRecord.updatedAt);
  
  return incomingTime > existingTime; // Last write wins
}
```

---

## Phase 5: Database Migration

### 5.1 Migration Script
Create `src/migrations/001_add_sync_fields.js`:

```javascript
// Add deleted and deviceId fields to existing records
// Rename spaceId/categoryId/itemId to id
// Set default values for new fields
```

### 5.2 Index Updates
```javascript
// Add indexes for sync queries
db.spaces.createIndex({ userId: 1, updatedAt: 1 });
db.spaces.createIndex({ userId: 1, deviceId: 1 });
db.categories.createIndex({ userId: 1, updatedAt: 1 });
db.items.createIndex({ userId: 1, updatedAt: 1 });
```

---

## Phase 6: Implementation Checklist

### Models
- [ ] Update Space model with sync fields
- [ ] Update Category model with sync fields
- [ ] Update Item model with sync fields
- [ ] Update UserPreferences model with sync fields
- [ ] Remove hard delete operations
- [ ] Add soft delete support

### Controllers
- [ ] Create new syncController with push/pull/backup
- [ ] Implement last-write-wins conflict resolution
- [ ] Add incremental sync logic
- [ ] Add device filtering
- [ ] Ensure idempotent operations

### Routes
- [ ] Add POST /sync/push
- [ ] Add GET /sync/pull
- [ ] Add POST /sync/backup
- [ ] Deprecate old CRUD routes (add warnings)
- [ ] Keep auth routes unchanged
- [ ] Keep external API routes unchanged

### Middleware
- [ ] Ensure auth middleware works with sync endpoints
- [ ] Add request validation for sync payloads

### Testing
- [ ] Test push with new records
- [ ] Test push with updated records
- [ ] Test push with deleted records
- [ ] Test pull with incremental changes
- [ ] Test conflict resolution
- [ ] Test idempotency
- [ ] Test device filtering

### Documentation
- [ ] Update API documentation
- [ ] Create sync flow diagrams
- [ ] Document conflict resolution strategy
- [ ] Create migration guide for clients

---

## Phase 7: Client-Side Expectations

### Flutter App Changes Required
1. **Local Storage**: Implement SQLite/Hive for local data
2. **Sync Service**: Background service for push/pull
3. **Conflict UI**: Show user when conflicts occur (optional)
4. **Offline Queue**: Queue changes when offline
5. **Device ID**: Generate and persist unique device ID

### Sync Flow
```
1. User makes change → Save to local DB immediately
2. UI updates instantly from local DB
3. Background: Queue change for sync
4. When online: Push changes to server
5. Pull changes from server
6. Merge changes into local DB
7. Update UI if needed
```

---

## Phase 8: Rollout Strategy

### Step 1: Parallel Operation (Week 1-2)
- Deploy new sync endpoints
- Keep old CRUD endpoints active
- Add deprecation warnings to old endpoints
- Monitor sync endpoint usage

### Step 2: Client Migration (Week 3-4)
- Update Flutter app to use sync endpoints
- Test offline functionality
- Verify conflict resolution
- Monitor error rates

### Step 3: Deprecation (Week 5-6)
- Disable old CRUD endpoints
- Remove deprecated code
- Clean up database

---

## Success Metrics

### Performance
- ✅ App loads instantly from local data
- ✅ Sync completes in background (<5s for typical changes)
- ✅ No UI blocking during sync

### Reliability
- ✅ App works 100% offline
- ✅ No data loss during conflicts
- ✅ Sync is idempotent (can retry safely)

### User Experience
- ✅ Instant UI updates
- ✅ No loading spinners for data
- ✅ Seamless multi-device sync

---

## Technical Debt Addressed
- ✅ No more full data fetches
- ✅ No hard deletes
- ✅ Proper conflict resolution
- ✅ Device tracking
- ✅ Incremental sync
- ✅ Offline-first architecture

---

## References
- Notion's sync architecture
- Todoist's offline-first approach
- CRDTs and eventual consistency
- Last-write-wins conflict resolution
