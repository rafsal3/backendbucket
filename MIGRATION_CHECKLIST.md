# ✅ Offline-First Migration Checklist

## Backend Tasks (COMPLETED ✅)

### Models
- [x] Update Space model with sync fields (id, deleted, deviceId)
- [x] Update Category model with sync fields
- [x] Update Item model with sync fields
- [x] Update UserPreferences model with sync fields
- [x] Add database indexes for sync queries
- [x] Maintain backward compatibility with legacy IDs

### Controllers
- [x] Create new syncController with push/pull/backup
- [x] Implement last-write-wins conflict resolution
- [x] Add incremental sync logic
- [x] Add device filtering (no echo)
- [x] Ensure idempotent operations
- [x] Handle soft deletes properly

### Routes
- [x] Add POST /api/v1/sync/push
- [x] Add GET /api/v1/sync/pull
- [x] Add POST /api/v1/sync/backup
- [x] Add POST /api/v1/sync/restore
- [x] Add deprecation warnings to old CRUD routes
- [x] Keep auth routes unchanged
- [x] Keep external API routes unchanged

### Middleware
- [x] Create deprecation middleware
- [x] Ensure auth middleware works with sync endpoints
- [x] Add request validation for sync payloads

### Documentation
- [x] Create SYNC_API_DOCUMENTATION.md
- [x] Create MIGRATION_GUIDE.md
- [x] Create SYNC_API_QUICK_REFERENCE.md
- [x] Create SYNC_FLOW_DIAGRAMS.md
- [x] Create OFFLINE_FIRST_REFACTOR_PLAN.md
- [x] Create REFACTORING_SUMMARY.md
- [x] Create Postman collection

### Migration
- [x] Create migration script (001_add_sync_fields.js)
- [ ] **RUN MIGRATION SCRIPT** ⚠️ (IMPORTANT - Do this next!)

---

## Database Migration (NEXT STEP ⏳)

### Run Migration
```bash
node src/migrations/001_add_sync_fields.js
```

**What it does:**
- Adds `id`, `deleted`, `deviceId` fields to existing records
- Maintains backward compatibility
- Doesn't delete any data
- Safe to run multiple times

**Expected Output:**
```
🚀 Starting migration: Add sync fields to existing records
✅ Connected to database
🔄 Migrating Space...
   Found X records to migrate
   ✅ Migrated X Space records
🔄 Migrating Category...
   ✅ Migrated X Category records
🔄 Migrating Item...
   ✅ Migrated X Item records
🔄 Migrating UserPreferences...
   ✅ Migrated X UserPreferences records
✅ Migration completed successfully!
```

---

## Testing Backend (NEXT STEP ⏳)

### Manual Testing with Postman

1. **Import Collection**
   - [ ] Import `postman-sync-collection.json` into Postman
   - [ ] Set `base_url` variable (e.g., http://localhost:5000)

2. **Test Authentication**
   - [ ] Register new user
   - [ ] Login (token should auto-save)

3. **Test Push Endpoint**
   - [ ] Push new space
   - [ ] Push new category
   - [ ] Push new item
   - [ ] Check response shows accepted changes

4. **Test Pull Endpoint**
   - [ ] Pull all changes (no lastSyncAt)
   - [ ] Pull incremental changes (with lastSyncAt)
   - [ ] Verify no echo (same deviceId filtered out)

5. **Test Conflict Resolution**
   - [ ] Push same item with older timestamp
   - [ ] Verify it's rejected
   - [ ] Check conflicts array in response

6. **Test Soft Deletes**
   - [ ] Push item with deleted: true
   - [ ] Pull changes
   - [ ] Verify deleted item is returned

7. **Test Backup/Restore**
   - [ ] Create backup
   - [ ] Verify all data returned
   - [ ] Test restore (optional)

### Automated Testing (Optional)

- [ ] Write unit tests for syncController
- [ ] Write integration tests for sync endpoints
- [ ] Test conflict resolution edge cases
- [ ] Test device filtering
- [ ] Test soft delete propagation

---

## Flutter App Migration (TODO ⏳)

### Setup Local Database

- [ ] Add sqflite dependency to pubspec.yaml
- [ ] Create database schema (spaces, categories, items, preferences)
- [ ] Add indexes for performance
- [ ] Test database CRUD operations

### Device Management

- [ ] Generate unique device ID
- [ ] Persist device ID in SharedPreferences
- [ ] Ensure device ID is consistent across app restarts

### Sync Service

- [ ] Create SyncService class
- [ ] Implement push method
- [ ] Implement pull method
- [ ] Implement merge logic (conflict resolution)
- [ ] Add error handling and retry logic
- [ ] Test sync service independently

### Update Data Providers

- [ ] Update SpaceProvider to use local DB
- [ ] Update CategoryProvider to use local DB
- [ ] Update ItemProvider to use local DB
- [ ] Update PreferencesProvider to use local DB
- [ ] Remove direct API calls for CRUD operations

### UI Updates

- [ ] Update UI to read from local DB
- [ ] Update UI to write to local DB
- [ ] Remove loading spinners for data operations
- [ ] Add sync status indicator (optional)
- [ ] Test UI responsiveness

### Background Sync

- [ ] Add workmanager dependency
- [ ] Register background sync task
- [ ] Set sync interval (e.g., 15 minutes)
- [ ] Test background sync works when app is closed

### Soft Deletes

- [ ] Update delete operations to set deleted: true
- [ ] Add filter to queries: WHERE deleted = 0
- [ ] Test deleted items are hidden from UI
- [ ] Test deleted items sync to other devices

### Testing

- [ ] Test offline mode (airplane mode)
- [ ] Test online mode
- [ ] Test sync after being offline
- [ ] Test multi-device sync
- [ ] Test conflict resolution
- [ ] Test soft deletes
- [ ] Test background sync

---

## Deployment (TODO ⏳)

### Backend Deployment

- [ ] Run migration on production database
- [ ] Deploy updated backend code
- [ ] Monitor logs for errors
- [ ] Monitor deprecation warnings
- [ ] Test sync endpoints in production

### Flutter App Deployment

- [ ] Test thoroughly on staging
- [ ] Deploy to TestFlight/Internal Testing
- [ ] Get feedback from beta testers
- [ ] Fix any issues
- [ ] Deploy to production

### Monitoring

- [ ] Monitor sync endpoint usage
- [ ] Monitor conflict rates
- [ ] Monitor sync errors
- [ ] Monitor performance metrics
- [ ] Monitor user feedback

---

## Rollback Plan (If Needed)

### Backend Rollback

- [ ] Old CRUD endpoints still work
- [ ] Can revert to previous version
- [ ] Migration doesn't delete data
- [ ] Can run migration again if needed

### Flutter App Rollback

- [ ] Keep old API calls in separate branch
- [ ] Can revert to CRUD version
- [ ] Local DB can be cleared if needed
- [ ] No data loss (server has backup)

---

## Success Criteria

### Performance
- [ ] App loads in <100ms (from local DB)
- [ ] Sync completes in <5s for typical changes
- [ ] No UI blocking during sync

### Reliability
- [ ] App works 100% offline
- [ ] No data loss during conflicts
- [ ] Sync is idempotent (can retry safely)

### User Experience
- [ ] Instant UI updates
- [ ] No loading spinners for data
- [ ] Seamless multi-device sync
- [ ] No user-facing errors

---

## Timeline

| Phase | Status | Duration |
|-------|--------|----------|
| Backend Refactoring | ✅ DONE | 1 day |
| Database Migration | ⏳ PENDING | 10 minutes |
| Backend Testing | ⏳ PENDING | 1-2 hours |
| Flutter App Update | ⏳ TODO | 2-3 days |
| Integration Testing | ⏳ TODO | 1 day |
| Beta Testing | ⏳ TODO | 1 week |
| Production Deployment | ⏳ TODO | 1 day |

**Total Estimated Time:** 1-2 weeks

---

## Resources

### Documentation
- `SYNC_API_DOCUMENTATION.md` - Full API reference
- `MIGRATION_GUIDE.md` - Step-by-step guide
- `SYNC_API_QUICK_REFERENCE.md` - Quick reference
- `SYNC_FLOW_DIAGRAMS.md` - Visual diagrams
- `.agent/OFFLINE_FIRST_REFACTOR_PLAN.md` - Architecture plan
- `.agent/REFACTORING_SUMMARY.md` - Summary

### Tools
- `postman-sync-collection.json` - Postman tests
- `src/migrations/001_add_sync_fields.js` - Migration script

### Support
- Check server logs for errors
- Review documentation for examples
- Test with Postman before updating Flutter app

---

## Notes

- ✅ = Completed
- ⏳ = In Progress / Next Step
- ⚠️ = Important / Requires Attention
- 📝 = Optional

**Last Updated:** 2025-12-29
