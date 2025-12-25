const Space = require('../models/Space');
const Category = require('../models/Category');
const Item = require('../models/Item');
const UserPreferences = require('../models/UserPreferences');

// @desc    Full sync
// @route   POST /api/v1/sync
// @access  Private
const syncData = async (req, res, next) => {
    try {
        const { lastSyncTimestamp, spaces, currentSpaceId, preferences } = req.body;

        // Update preferences if provided
        if (preferences) {
            await UserPreferences.findOneAndUpdate(
                { userId: req.user.userId },
                { ...preferences, updatedAt: Date.now() },
                { upsert: true }
            );
        }

        // Sync spaces (simplified - in production you'd handle conflicts)
        if (spaces && Array.isArray(spaces)) {
            for (const spaceData of spaces) {
                await Space.findOneAndUpdate(
                    { spaceId: spaceData.id, userId: req.user.userId },
                    {
                        name: spaceData.name,
                        icon: spaceData.icon,
                        isHidden: spaceData.isHidden,
                        updatedAt: Date.now()
                    },
                    { upsert: true }
                );
            }
        }

        // Get latest data from server
        const serverSpaces = await Space.find({ userId: req.user.userId }).sort({ order: 1 });
        const serverPreferences = await UserPreferences.findOne({ userId: req.user.userId });

        res.status(200).json({
            success: true,
            data: {
                syncTimestamp: new Date().toISOString(),
                conflicts: [],
                spaces: serverSpaces,
                currentSpaceId,
                preferences: serverPreferences || { isDarkMode: true, themeColor: 'blue' }
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get backup
// @route   GET /api/v1/backup
// @access  Private
const getBackup = async (req, res, next) => {
    try {
        const spaces = await Space.find({ userId: req.user.userId });
        const categories = await Category.find({ userId: req.user.userId });
        const items = await Item.find({ userId: req.user.userId });
        const preferences = await UserPreferences.findOne({ userId: req.user.userId });

        // Organize data by spaces
        const spacesWithData = await Promise.all(
            spaces.map(async (space) => {
                const spaceCategories = categories.filter(cat => cat.spaceId === space.spaceId);
                const categoriesWithItems = spaceCategories.map(category => {
                    const categoryItems = items.filter(item => item.categoryId === category.categoryId);
                    return {
                        ...category.toObject(),
                        items: categoryItems
                    };
                });

                return {
                    ...space.toObject(),
                    categories: categoriesWithItems
                };
            })
        );

        res.status(200).json({
            success: true,
            data: {
                backupTimestamp: new Date().toISOString(),
                spaces: spacesWithData,
                preferences: preferences || { isDarkMode: true, themeColor: 'blue' }
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Restore from backup
// @route   POST /api/v1/backup/restore
// @access  Private
const restoreBackup = async (req, res, next) => {
    try {
        const { backupData } = req.body;

        if (!backupData || !backupData.spaces) {
            return res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_INPUT',
                    message: 'Invalid backup data'
                }
            });
        }

        // Clear existing data
        await Space.deleteMany({ userId: req.user.userId });
        await Category.deleteMany({ userId: req.user.userId });
        await Item.deleteMany({ userId: req.user.userId });

        // Restore spaces, categories, and items
        for (const spaceData of backupData.spaces) {
            const { categories, ...spaceInfo } = spaceData;

            await Space.create({
                ...spaceInfo,
                userId: req.user.userId
            });

            if (categories && Array.isArray(categories)) {
                for (const categoryData of categories) {
                    const { items, ...categoryInfo } = categoryData;

                    await Category.create({
                        ...categoryInfo,
                        userId: req.user.userId
                    });

                    if (items && Array.isArray(items)) {
                        for (const itemData of items) {
                            await Item.create({
                                ...itemData,
                                userId: req.user.userId
                            });
                        }
                    }
                }
            }
        }

        // Restore preferences
        if (backupData.preferences) {
            await UserPreferences.findOneAndUpdate(
                { userId: req.user.userId },
                { ...backupData.preferences, updatedAt: Date.now() },
                { upsert: true }
            );
        }

        res.status(200).json({
            success: true,
            message: 'Data restored successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    syncData,
    getBackup,
    restoreBackup
};
