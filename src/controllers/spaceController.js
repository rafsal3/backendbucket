const Space = require('../models/Space');
const Category = require('../models/Category');
const Item = require('../models/Item');

// @desc    Get all spaces
// @route   GET /api/v1/spaces
// @access  Private
const getAllSpaces = async (req, res, next) => {
    try {
        const { includeHidden } = req.query;
        const filter = { userId: req.user.userId };

        if (includeHidden !== 'true') {
            filter.isHidden = false;
        }

        const spaces = await Space.find(filter).sort({ order: 1 });

        // Get counts for each space
        const spacesWithCounts = await Promise.all(
            spaces.map(async (space) => {
                const categoriesCount = await Category.countDocuments({ spaceId: space.spaceId });
                const itemsCount = await Item.countDocuments({ spaceId: space.spaceId });

                return {
                    id: space.spaceId,
                    name: space.name,
                    icon: space.icon,
                    isHidden: space.isHidden,
                    createdAt: space.createdAt,
                    updatedAt: space.updatedAt,
                    categoriesCount,
                    itemsCount
                };
            })
        );

        res.status(200).json({
            success: true,
            data: spacesWithCounts
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single space with full details
// @route   GET /api/v1/spaces/:spaceId
// @access  Private
const getSpace = async (req, res, next) => {
    try {
        const space = await Space.findOne({
            spaceId: req.params.spaceId,
            userId: req.user.userId
        });

        if (!space) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Space not found'
                }
            });
        }

        const categories = await Category.find({ spaceId: space.spaceId }).sort({ order: 1 });

        const categoriesWithItems = await Promise.all(
            categories.map(async (category) => {
                const items = await Item.find({ categoryId: category.categoryId }).sort({ order: 1 });
                return {
                    id: category.categoryId,
                    name: category.name,
                    icon: category.icon,
                    isHidden: category.isHidden,
                    items: items.map(item => ({
                        id: item.itemId,
                        text: item.text,
                        isCompleted: item.isCompleted,
                        categoryId: item.categoryId,
                        imageUrl: item.imageUrl,
                        description: item.description,
                        createdAt: item.createdAt,
                        updatedAt: item.updatedAt
                    }))
                };
            })
        );

        res.status(200).json({
            success: true,
            data: {
                id: space.spaceId,
                name: space.name,
                icon: space.icon,
                isHidden: space.isHidden,
                createdAt: space.createdAt,
                updatedAt: space.updatedAt,
                categories: categoriesWithItems
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create new space
// @route   POST /api/v1/spaces
// @access  Private
const createSpace = async (req, res, next) => {
    try {
        const { name, icon } = req.body;

        // Get the highest order number
        const lastSpace = await Space.findOne({ userId: req.user.userId }).sort({ order: -1 });
        const order = lastSpace ? lastSpace.order + 1 : 0;

        const space = await Space.create({
            userId: req.user.userId,
            name,
            icon: icon || '📁',
            order
        });

        // Create default categories for the new space
        const defaultCategories = [
            { name: 'Places', icon: '🌍', id: 'default_places' },
            { name: 'Books', icon: '📚', id: 'default_books' },
            { name: 'Movies', icon: '🎬', id: 'default_movies' },
            { name: 'Experiences', icon: '✨', id: 'default_experiences' },
            { name: 'Goals', icon: '🎯', id: 'default_goals' },
            { name: 'Other', icon: '📌', id: 'default_other' }
        ];

        const categories = await Promise.all(
            defaultCategories.map(async (cat, index) => {
                return await Category.create({
                    categoryId: cat.id,
                    spaceId: space.spaceId,
                    userId: req.user.userId,
                    name: cat.name,
                    icon: cat.icon,
                    order: index
                });
            })
        );

        res.status(201).json({
            success: true,
            data: {
                id: space.spaceId,
                name: space.name,
                icon: space.icon,
                isHidden: space.isHidden,
                createdAt: space.createdAt,
                updatedAt: space.updatedAt,
                categories: categories.map(cat => ({
                    id: cat.categoryId,
                    name: cat.name,
                    icon: cat.icon,
                    isHidden: cat.isHidden,
                    items: []
                }))
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update space
// @route   PUT /api/v1/spaces/:spaceId
// @access  Private
const updateSpace = async (req, res, next) => {
    try {
        const { name, icon } = req.body;

        const space = await Space.findOneAndUpdate(
            { spaceId: req.params.spaceId, userId: req.user.userId },
            { name, icon, updatedAt: Date.now() },
            { new: true }
        );

        if (!space) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Space not found'
                }
            });
        }

        res.status(200).json({
            success: true,
            data: {
                id: space.spaceId,
                name: space.name,
                icon: space.icon,
                isHidden: space.isHidden,
                updatedAt: space.updatedAt
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Toggle space visibility
// @route   PATCH /api/v1/spaces/:spaceId/visibility
// @access  Private
const toggleSpaceVisibility = async (req, res, next) => {
    try {
        const { isHidden } = req.body;

        const space = await Space.findOneAndUpdate(
            { spaceId: req.params.spaceId, userId: req.user.userId },
            { isHidden, updatedAt: Date.now() },
            { new: true }
        );

        if (!space) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Space not found'
                }
            });
        }

        res.status(200).json({
            success: true,
            data: {
                id: space.spaceId,
                isHidden: space.isHidden
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reorder spaces
// @route   PATCH /api/v1/spaces/reorder
// @access  Private
const reorderSpaces = async (req, res, next) => {
    try {
        const { spaceIds } = req.body;

        // Update order for each space
        await Promise.all(
            spaceIds.map(async (spaceId, index) => {
                await Space.findOneAndUpdate(
                    { spaceId, userId: req.user.userId },
                    { order: index }
                );
            })
        );

        res.status(200).json({
            success: true,
            message: 'Spaces reordered successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete space
// @route   DELETE /api/v1/spaces/:spaceId
// @access  Private
const deleteSpace = async (req, res, next) => {
    try {
        const space = await Space.findOneAndDelete({
            spaceId: req.params.spaceId,
            userId: req.user.userId
        });

        if (!space) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Space not found'
                }
            });
        }

        // Delete all categories and items in this space
        await Category.deleteMany({ spaceId: req.params.spaceId });
        await Item.deleteMany({ spaceId: req.params.spaceId });

        res.status(200).json({
            success: true,
            message: 'Space deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllSpaces,
    getSpace,
    createSpace,
    updateSpace,
    toggleSpaceVisibility,
    reorderSpaces,
    deleteSpace
};
