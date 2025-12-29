const Space = require('../models/Space');
const Category = require('../models/Category');
const Item = require('../models/Item');
const UserPreferences = require('../models/UserPreferences');

/**
 * Helper function to determine if incoming change should be accepted
 * Uses Last-Write-Wins (LWW) conflict resolution strategy
 */
const shouldAcceptChange = (incomingRecord, existingRecord) => {
    if (!existingRecord) return true; // New record, always accept

    const incomingTime = new Date(incomingRecord.updatedAt);
    const existingTime = new Date(existingRecord.updatedAt);

    // Last write wins - accept if incoming is newer
    return incomingTime > existingTime;
};

/**
 * Helper function to process sync changes for a specific model
 */
const processSyncChanges = async (Model, records, userId, deviceId) => {
    let accepted = 0;
    let rejected = 0;
    const conflicts = [];

    for (const record of records) {
        try {
            // Ensure the record belongs to the authenticated user
            if (record.userId !== userId) {
                rejected++;
                continue;
            }

            // Find existing record
            const existing = await Model.findOne({ id: record.id, userId });

            // Check if we should accept this change
            if (shouldAcceptChange(record, existing)) {
                // Prepare record for upsert
                const recordToSave = {
                    ...record,
                    userId, // Ensure userId is set
                    deviceId, // Track which device made this change
                    updatedAt: new Date(record.updatedAt) // Ensure proper date format
                };

                // Upsert the record
                await Model.findOneAndUpdate(
                    { id: record.id, userId },
                    recordToSave,
                    { upsert: true, new: true }
                );
                accepted++;
            } else {
                // Rejected because existing record is newer
                rejected++;
                conflicts.push({
                    id: record.id,
                    type: Model.modelName,
                    reason: 'OLDER_TIMESTAMP',
                    serverUpdatedAt: existing.updatedAt,
                    clientUpdatedAt: record.updatedAt
                });
            }
        } catch (error) {
            console.error(`Error processing ${Model.modelName} record:`, error);
            rejected++;
        }
    }

    return { accepted, rejected, conflicts };
};

/**
 * @desc    Push local changes to server
 * @route   POST /api/v1/sync/push
 * @access  Private
 */
const pushChanges = async (req, res, next) => {
    try {
        const { deviceId, lastSyncAt, changes } = req.body;
        const userId = req.user.userId;

        // Validate required fields
        if (!deviceId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_DEVICE_ID',
                    message: 'deviceId is required'
                }
            });
        }

        if (!changes) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_CHANGES',
                    message: 'changes object is required'
                }
            });
        }

        const results = {
            spaces: { accepted: 0, rejected: 0, conflicts: [] },
            categories: { accepted: 0, rejected: 0, conflicts: [] },
            items: { accepted: 0, rejected: 0, conflicts: [] },
            preferences: { accepted: 0, rejected: 0, conflicts: [] }
        };

        // Process spaces
        if (changes.spaces && Array.isArray(changes.spaces)) {
            results.spaces = await processSyncChanges(
                Space,
                changes.spaces,
                userId,
                deviceId
            );
        }

        // Process categories
        if (changes.categories && Array.isArray(changes.categories)) {
            results.categories = await processSyncChanges(
                Category,
                changes.categories,
                userId,
                deviceId
            );
        }

        // Process items
        if (changes.items && Array.isArray(changes.items)) {
            results.items = await processSyncChanges(
                Item,
                changes.items,
                userId,
                deviceId
            );
        }

        // Process preferences (single object, not array)
        if (changes.preferences) {
            const prefArray = [changes.preferences];
            results.preferences = await processSyncChanges(
                UserPreferences,
                prefArray,
                userId,
                deviceId
            );
        }

        // Collect all conflicts
        const allConflicts = [
            ...results.spaces.conflicts,
            ...results.categories.conflicts,
            ...results.items.conflicts,
            ...results.preferences.conflicts
        ];

        res.status(200).json({
            success: true,
            data: {
                syncedAt: new Date().toISOString(),
                conflicts: allConflicts,
                accepted: {
                    spaces: results.spaces.accepted,
                    categories: results.categories.accepted,
                    items: results.items.accepted,
                    preferences: results.preferences.accepted
                },
                rejected: {
                    spaces: results.spaces.rejected,
                    categories: results.categories.rejected,
                    items: results.items.rejected,
                    preferences: results.preferences.rejected
                }
            }
        });
    } catch (error) {
        console.error('Push sync error:', error);
        next(error);
    }
};

/**
 * @desc    Pull changes from server since last sync
 * @route   GET /api/v1/sync/pull
 * @access  Private
 */
const pullChanges = async (req, res, next) => {
    try {
        const { lastSyncAt, deviceId } = req.query;
        const userId = req.user.userId;

        // Validate required fields
        if (!deviceId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_DEVICE_ID',
                    message: 'deviceId query parameter is required'
                }
            });
        }

        // Parse lastSyncAt or use epoch if not provided
        const syncThreshold = lastSyncAt
            ? new Date(lastSyncAt)
            : new Date(0); // Epoch = get all records

        // Build query to get incremental changes
        const buildQuery = (model) => ({
            userId,
            updatedAt: { $gt: syncThreshold },
            // Don't send back changes from the same device
            deviceId: { $ne: deviceId }
        });

        // Fetch incremental changes for each model
        const [spaces, categories, items, preferences] = await Promise.all([
            Space.find(buildQuery(Space)).lean(),
            Category.find(buildQuery(Category)).lean(),
            Item.find(buildQuery(Item)).lean(),
            UserPreferences.findOne({
                userId,
                updatedAt: { $gt: syncThreshold },
                deviceId: { $ne: deviceId }
            }).lean()
        ]);

        res.status(200).json({
            success: true,
            data: {
                syncedAt: new Date().toISOString(),
                changes: {
                    spaces: spaces || [],
                    categories: categories || [],
                    items: items || [],
                    preferences: preferences || null
                },
                hasMore: false // Can implement pagination later if needed
            }
        });
    } catch (error) {
        console.error('Pull sync error:', error);
        next(error);
    }
};

/**
 * @desc    Get full backup of user data
 * @route   POST /api/v1/sync/backup
 * @access  Private
 */
const createBackup = async (req, res, next) => {
    try {
        const userId = req.user.userId;

        // Fetch ALL records for the user (including deleted)
        const [spaces, categories, items, preferences] = await Promise.all([
            Space.find({ userId }).lean(),
            Category.find({ userId }).lean(),
            Item.find({ userId }).lean(),
            UserPreferences.findOne({ userId }).lean()
        ]);

        res.status(200).json({
            success: true,
            data: {
                backupAt: new Date().toISOString(),
                version: '1.0',
                userId,
                spaces: spaces || [],
                categories: categories || [],
                items: items || [],
                preferences: preferences || null
            }
        });
    } catch (error) {
        console.error('Backup error:', error);
        next(error);
    }
};

/**
 * @desc    Restore from backup (DANGEROUS - replaces all data)
 * @route   POST /api/v1/sync/restore
 * @access  Private
 */
const restoreBackup = async (req, res, next) => {
    try {
        const { backupData, deviceId } = req.body;
        const userId = req.user.userId;

        if (!backupData) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_BACKUP_DATA',
                    message: 'backupData is required'
                }
            });
        }

        if (!deviceId) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'MISSING_DEVICE_ID',
                    message: 'deviceId is required'
                }
            });
        }

        // Clear existing data (soft delete)
        const now = new Date();
        await Promise.all([
            Space.updateMany(
                { userId },
                { deleted: true, updatedAt: now, deviceId }
            ),
            Category.updateMany(
                { userId },
                { deleted: true, updatedAt: now, deviceId }
            ),
            Item.updateMany(
                { userId },
                { deleted: true, updatedAt: now, deviceId }
            )
        ]);

        // Restore data using push logic (handles conflicts properly)
        const changes = {
            spaces: backupData.spaces || [],
            categories: backupData.categories || [],
            items: backupData.items || [],
            preferences: backupData.preferences || null
        };

        // Process all changes
        const results = {
            spaces: { accepted: 0 },
            categories: { accepted: 0 },
            items: { accepted: 0 },
            preferences: { accepted: 0 }
        };

        if (changes.spaces.length > 0) {
            results.spaces = await processSyncChanges(Space, changes.spaces, userId, deviceId);
        }

        if (changes.categories.length > 0) {
            results.categories = await processSyncChanges(Category, changes.categories, userId, deviceId);
        }

        if (changes.items.length > 0) {
            results.items = await processSyncChanges(Item, changes.items, userId, deviceId);
        }

        if (changes.preferences) {
            results.preferences = await processSyncChanges(
                UserPreferences,
                [changes.preferences],
                userId,
                deviceId
            );
        }

        res.status(200).json({
            success: true,
            message: 'Backup restored successfully',
            data: {
                restored: {
                    spaces: results.spaces.accepted,
                    categories: results.categories.accepted,
                    items: results.items.accepted,
                    preferences: results.preferences.accepted
                }
            }
        });
    } catch (error) {
        console.error('Restore error:', error);
        next(error);
    }
};

module.exports = {
    pushChanges,
    pullChanges,
    createBackup,
    restoreBackup
};
