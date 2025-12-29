# Offline-First Sync Flow Diagram

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER DEVICE                              │
│                                                                  │
│  ┌────────────┐         ┌──────────────┐      ┌──────────────┐ │
│  │            │         │              │      │              │ │
│  │  Flutter   │◄────────│  Local DB    │◄─────│  Sync        │ │
│  │  UI        │         │  (SQLite)    │      │  Service     │ │
│  │            │         │              │      │              │ │
│  └────────────┘         └──────────────┘      └──────┬───────┘ │
│       ▲                        ▲                      │         │
│       │                        │                      │         │
│       │ Instant Read/Write     │ Background Sync      │         │
│       │                        │                      │         │
└───────┼────────────────────────┼──────────────────────┼─────────┘
        │                        │                      │
        │                        │                      │
        │                        │                      ▼
        │                        │              ┌──────────────┐
        │                        │              │              │
        │                        │              │   INTERNET   │
        │                        │              │              │
        │                        │              └──────┬───────┘
        │                        │                     │
        │                        │                     ▼
        │                        │              ┌──────────────┐
        │                        │              │              │
        │                        │              │   Backend    │
        │                        │              │   Server     │
        │                        │              │              │
        │                        │              └──────┬───────┘
        │                        │                     │
        │                        │                     ▼
        │                        │              ┌──────────────┐
        │                        │              │              │
        │                        └──────────────│   MongoDB    │
        │                                       │   Database   │
        └───────────────────────────────────────│              │
                                                └──────────────┘
```

---

## Detailed Sync Flow

### 1. User Creates Item (Offline)

```
┌──────────┐
│  User    │
│  Action  │
└────┬─────┘
     │
     ▼
┌──────────────────────────────────────┐
│ 1. Generate ID locally                │
│    id = "item_123_abc"                │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ 2. Save to Local DB                   │
│    INSERT INTO items (...)            │
│    VALUES (...)                       │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ 3. Update UI Instantly                │
│    notifyListeners()                  │
│    ✅ User sees item immediately      │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ 4. Queue for Background Sync          │
│    syncService.sync()                 │
│    (non-blocking)                     │
└──────────────────────────────────────┘
```

---

### 2. Background Sync (Push)

```
┌──────────────────────────────────────┐
│ 1. Get Local Changes                  │
│    SELECT * FROM items                │
│    WHERE updatedAt > lastSyncAt       │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ 2. Send to Server                     │
│    POST /api/v1/sync/push             │
│    {                                  │
│      deviceId: "device_abc",          │
│      changes: { items: [...] }        │
│    }                                  │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ 3. Server Processes Changes           │
│    - Check timestamps                 │
│    - Apply last-write-wins            │
│    - Save to MongoDB                  │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ 4. Server Responds                    │
│    {                                  │
│      accepted: { items: 1 },          │
│      conflicts: []                    │
│    }                                  │
└──────────────────────────────────────┘
```

---

### 3. Background Sync (Pull)

```
┌──────────────────────────────────────┐
│ 1. Request Server Changes             │
│    GET /api/v1/sync/pull              │
│    ?lastSyncAt=2025-12-29T06:00:00Z   │
│    &deviceId=device_abc               │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ 2. Server Returns Changes             │
│    - Only records updated after       │
│      lastSyncAt                       │
│    - Excludes same deviceId           │
│    - Includes soft-deleted records    │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ 3. Merge into Local DB                │
│    For each change:                   │
│      - Check if exists locally        │
│      - Compare timestamps             │
│      - Keep newer version             │
│      - Update local DB                │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ 4. Update UI if Needed                │
│    notifyListeners()                  │
│    ✅ User sees synced changes        │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ 5. Update Last Sync Timestamp         │
│    lastSyncAt = "2025-12-29T06:30:27Z"│
└──────────────────────────────────────┘
```

---

## Conflict Resolution (Last-Write-Wins)

```
Device A (Offline)          Device B (Offline)          Server
─────────────────           ─────────────────           ──────

10:00 AM
Update item_123
text = "Buy milk"
updatedAt = 10:00

                            10:05 AM
                            Update item_123
                            text = "Buy organic milk"
                            updatedAt = 10:05

10:10 AM
Sync (Push)
─────────────────────────────────────────────────────────────►
                                                        Accept
                                                        (newer)

                            10:15 AM
                            Sync (Push)
                            ──────────────────────────────────►
                                                        Accept
                                                        (newer)

10:20 AM
Sync (Pull)
◄─────────────────────────────────────────────────────────────
Receive:
text = "Buy organic milk"
updatedAt = 10:05

Merge:
Compare timestamps
10:05 > 10:00
✅ Accept server version

Result:
Both devices show
"Buy organic milk"
```

---

## Multi-Device Sync

```
Device A                    Server                    Device B
────────                    ──────                    ────────

Create item_123
"Buy milk"
     │
     ▼
Save locally
     │
     ▼
Sync (Push) ──────────────► Save to DB
                                 │
                                 │
                                 │                    Sync (Pull)
                                 └──────────────────► Receive item_123
                                                           │
                                                           ▼
                                                      Save locally
                                                           │
                                                           ▼
                                                      Update UI
                                                      ✅ Shows "Buy milk"
```

---

## Soft Delete Flow

```
┌──────────────────────────────────────┐
│ User Deletes Item                     │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ Update Local DB                       │
│ UPDATE items                          │
│ SET deleted = 1,                      │
│     updatedAt = NOW()                 │
│ WHERE id = 'item_123'                 │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ Hide from UI                          │
│ (Filter: WHERE deleted = 0)           │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ Sync to Server                        │
│ POST /api/v1/sync/push                │
│ { deleted: true }                     │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ Server Saves Soft Delete              │
│ (Record still exists in DB)           │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ Other Devices Pull Change             │
│ GET /api/v1/sync/pull                 │
│ Receive: { deleted: true }            │
└────┬─────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────┐
│ Other Devices Update Local DB         │
│ Item hidden from UI on all devices    │
│ ✅ Consistent across devices          │
└──────────────────────────────────────┘
```

---

## State Diagram

```
┌─────────────┐
│   OFFLINE   │
│   (Local    │
│    Only)    │
└──────┬──────┘
       │
       │ Network Available
       ▼
┌─────────────┐
│  SYNCING    │
│  (Push +    │
│   Pull)     │
└──────┬──────┘
       │
       │ Sync Complete
       ▼
┌─────────────┐
│   SYNCED    │
│  (Up to     │
│   Date)     │
└──────┬──────┘
       │
       │ User Makes Change
       ▼
┌─────────────┐
│  PENDING    │
│  (Changes   │
│   Queued)   │
└──────┬──────┘
       │
       │ Auto-Sync Triggered
       └──────────────────────┐
                              │
                              ▼
                       ┌─────────────┐
                       │  SYNCING    │
                       └─────────────┘
```

---

## Timeline Example

```
Time    Device A                Server              Device B
────    ────────                ──────              ────────

10:00   Create "Buy milk"
        Save locally
        UI updates ✅

10:01   Sync (Push) ────────►  Save to DB

10:02                                               Sync (Pull)
                               Send changes ────►   Receive
                                                    Save locally
                                                    UI updates ✅

10:05                                               Update to
                                                    "Buy organic milk"
                                                    Save locally
                                                    UI updates ✅

10:06                                               Sync (Push)
                               Save to DB ◄────

10:07   Sync (Pull)
        Receive ◄──────────    Send changes
        Save locally
        UI updates ✅

Result: Both devices show "Buy organic milk"
```

---

## Key Principles

1. **Local First**
   - All changes save to local DB first
   - UI updates immediately
   - No waiting for server

2. **Background Sync**
   - Sync happens in background
   - Non-blocking
   - Automatic retry on failure

3. **Conflict Resolution**
   - Last-Write-Wins (LWW)
   - Compare `updatedAt` timestamps
   - Newer always wins

4. **Soft Deletes**
   - Never hard delete
   - Set `deleted: true`
   - Sync deletes to all devices

5. **Device Awareness**
   - Track `deviceId` on all changes
   - Don't echo changes back to same device
   - Enables multi-device sync

---

## Benefits

✅ **Instant UI Updates** - No waiting for server
✅ **Works Offline** - 100% functional without internet
✅ **Fast Performance** - Local DB is fast
✅ **Reliable Sync** - Automatic conflict resolution
✅ **Multi-Device** - Seamless sync across devices
✅ **Data Safety** - Soft deletes prevent data loss
