const Space = require('../models/Space');
const Category = require('../models/Category');
const Item = require('../models/Item');

// @desc    Get user statistics
// @route   GET /api/v1/stats
// @access  Private
const getStats = async (req, res, next) => {
    try {
        const { spaceId } = req.query;
        const filter = { userId: req.user.userId };

        if (spaceId) {
            filter.spaceId = spaceId;
        }

        // Get counts
        const totalSpaces = await Space.countDocuments({ userId: req.user.userId });
        const totalCategories = await Category.countDocuments(filter);
        const totalItems = await Item.countDocuments(filter);
        const completedItems = await Item.countDocuments({ ...filter, isCompleted: true });

        const overallProgress = totalItems > 0 ? completedItems / totalItems : 0;

        // Get completion by category
        const categories = await Category.find(filter);
        const completionByCategory = await Promise.all(
            categories.map(async (category) => {
                const items = await Item.find({ categoryId: category.categoryId });
                const total = items.length;
                const completed = items.filter(item => item.isCompleted).length;
                const progress = total > 0 ? completed / total : 0;

                return {
                    categoryId: category.categoryId,
                    categoryName: category.name,
                    total,
                    completed,
                    progress
                };
            })
        );

        // Get recent activity (last 10 completed items)
        const recentItems = await Item.find({
            ...filter,
            isCompleted: true
        })
            .sort({ updatedAt: -1 })
            .limit(10);

        const recentActivity = recentItems.map(item => ({
            type: 'item_completed',
            itemId: item.itemId,
            itemText: item.text,
            timestamp: item.updatedAt
        }));

        res.status(200).json({
            success: true,
            data: {
                totalSpaces,
                totalCategories,
                totalItems,
                completedItems,
                overallProgress,
                completionByCategory,
                recentActivity
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getStats
};
