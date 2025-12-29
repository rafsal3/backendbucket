# 🚀 Sync API Quick Reference

## Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/v1/sync/push` | Push local changes to server |
| `GET` | `/api/v1/sync/pull` | Pull server changes since last sync |
| `POST` | `/api/v1/sync/backup` | Create full backup |
| `POST` | `/api/v1/sync/restore` | Restore from backup |

---

## Push Changes

```bash
POST /api/v1/sync/push
Authorization: Bearer <token>

{
  "deviceId": "device_abc123",
  "lastSyncAt": "2025-12-29T06:00:00.000Z",
  "changes": {
    "spaces": [...],
    "categories": [...],
    "items": [...],
    "preferences": {...}
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "syncedAt": "2025-12-29T06:30:27.000Z",
    "conflicts": [],
    "accepted": { "spaces": 1, "categories": 2, "items": 5 },
    "rejected": { "spaces": 0, "categories": 0, "items": 0 }
  }
}
```

---

## Pull Changes

```bash
GET /api/v1/sync/pull?lastSyncAt=2025-12-29T06:00:00.000Z&deviceId=device_abc123
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "syncedAt": "2025-12-29T06:30:27.000Z",
    "changes": {
      "spaces": [...],
      "categories": [...],
      "items": [...],
      "preferences": {...}
    },
    "hasMore": false
  }
}
```

---

## Required Fields

All records must have:

```typescript
{
  id: string;           // Client-generated UUID
  userId: string;       // User ID
  deleted: boolean;     // Soft delete flag
  deviceId: string;     // Device that last modified
  createdAt: Date;      // Creation timestamp
  updatedAt: Date;      // Last modification timestamp
}
```

---

## Conflict Resolution

**Strategy:** Last-Write-Wins (LWW)

- Compare `updatedAt` timestamps
- Newer timestamp always wins
- Rejected changes reported in `conflicts` array

---

## Client Flow

```
1. User makes change
   ↓
2. Save to local DB (instant UI update)
   ↓
3. Queue for sync
   ↓
4. Background: Push to server
   ↓
5. Background: Pull from server
   ↓
6. Merge changes into local DB
   ↓
7. Update UI if needed
```

---

## Best Practices

✅ **DO:**
- Generate unique `deviceId` per device
- Use soft deletes (`deleted: true`)
- Sync in background (non-blocking)
- Handle offline gracefully
- Retry failed syncs

❌ **DON'T:**
- Hard delete records
- Block UI waiting for sync
- Sync on every change
- Ignore conflicts

---

## Error Codes

| Code | Meaning |
|------|---------|
| `MISSING_DEVICE_ID` | deviceId required |
| `MISSING_CHANGES` | changes object required |
| `UNAUTHORIZED` | Invalid/missing token |
| `RATE_LIMIT_EXCEEDED` | Too many requests |

---

## Example: Create Item

```javascript
// 1. Generate ID
const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// 2. Create locally
const item = {
  id: itemId,
  userId: currentUserId,
  spaceId: 'space_123',
  categoryId: 'category_456',
  text: 'Buy milk',
  isCompleted: false,
  deleted: false,
  deviceId: await getDeviceId(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

await localDB.insert('items', item);

// 3. Sync in background
await syncService.sync();
```

---

## Example: Update Item

```javascript
// 1. Update locally
await localDB.update('items', {
  text: 'Buy organic milk',
  updatedAt: new Date().toISOString(),
  deviceId: await getDeviceId()
}, { where: { id: itemId } });

// 2. Sync in background
await syncService.sync();
```

---

## Example: Delete Item (Soft)

```javascript
// 1. Mark as deleted locally
await localDB.update('items', {
  deleted: true,
  updatedAt: new Date().toISOString(),
  deviceId: await getDeviceId()
}, { where: { id: itemId } });

// 2. Sync in background
await syncService.sync();
```

---

## Testing with cURL

### Push
```bash
curl -X POST http://localhost:5000/api/v1/sync/push \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "test-device",
    "changes": {
      "spaces": [],
      "categories": [],
      "items": [],
      "preferences": null
    }
  }'
```

### Pull
```bash
curl -X GET "http://localhost:5000/api/v1/sync/pull?deviceId=test-device" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Performance Tips

- **Batch changes**: Don't sync after every change
- **Incremental sync**: Only send/receive changed records
- **Background sync**: Use WorkManager/BackgroundTasks
- **Retry logic**: Exponential backoff for failed syncs
- **Compression**: Consider gzip for large payloads

---

## See Also

- `SYNC_API_DOCUMENTATION.md` - Full API documentation
- `MIGRATION_GUIDE.md` - Migration from CRUD to sync
- `.agent/OFFLINE_FIRST_REFACTOR_PLAN.md` - Architecture overview
