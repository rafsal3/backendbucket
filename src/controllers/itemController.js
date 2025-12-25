const Item = require('../models/Item');

// @desc    Get all items in a space
// @route   GET /api/v1/spaces/:spaceId/items
// @access  Private
const getAllItems = async (req, res, next) => {
    try {
        const { categoryId, isCompleted, uncategorized, limit = 100, offset = 0 } = req.query;

        const filter = {
            spaceId: req.params.spaceId,
            userId: req.user.userId
        };

        if (categoryId) {
            filter.categoryId = categoryId;
        }

        if (uncategorized === 'true') {
            filter.categoryId = null;
        }

        if (isCompleted !== undefined) {
            filter.isCompleted = isCompleted === 'true';
        }

        const items = await Item.find(filter)
            .sort({ order: 1, createdAt: -1 })
            .limit(parseInt(limit))
            .skip(parseInt(offset));

        const total = await Item.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                items: items.map(item => ({
                    id: item.itemId,
                    text: item.text,
                    isCompleted: item.isCompleted,
                    categoryId: item.categoryId,
                    imageUrl: item.imageUrl,
                    description: item.description,
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt
                })),
                total,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single item
// @route   GET /api/v1/spaces/:spaceId/items/:itemId
// @access  Private
const getItem = async (req, res, next) => {
    try {
        const item = await Item.findOne({
            itemId: req.params.itemId,
            spaceId: req.params.spaceId,
            userId: req.user.userId
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Item not found'
                }
            });
        }

        res.status(200).json({
            success: true,
            data: {
                id: item.itemId,
                text: item.text,
                isCompleted: item.isCompleted,
                categoryId: item.categoryId,
                imageUrl: item.imageUrl,
                description: item.description,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create item
// @route   POST /api/v1/spaces/:spaceId/items
// @access  Private
const createItem = async (req, res, next) => {
    try {
        const { text, categoryId, imageUrl, description } = req.body;

        // Get the highest order number for this category
        const filter = { spaceId: req.params.spaceId };
        if (categoryId) {
            filter.categoryId = categoryId;
        } else {
            filter.categoryId = null;
        }

        const lastItem = await Item.findOne(filter).sort({ order: -1 });
        const order = lastItem ? lastItem.order + 1 : 0;

        const item = await Item.create({
            spaceId: req.params.spaceId,
            userId: req.user.userId,
            text,
            categoryId: categoryId || null,
            imageUrl,
            description,
            order
        });

        res.status(201).json({
            success: true,
            data: {
                id: item.itemId,
                text: item.text,
                isCompleted: item.isCompleted,
                categoryId: item.categoryId,
                imageUrl: item.imageUrl,
                description: item.description,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update item
// @route   PUT /api/v1/spaces/:spaceId/items/:itemId
// @access  Private
const updateItem = async (req, res, next) => {
    try {
        const { text, imageUrl, description } = req.body;

        const item = await Item.findOneAndUpdate(
            {
                itemId: req.params.itemId,
                spaceId: req.params.spaceId,
                userId: req.user.userId
            },
            { text, imageUrl, description, updatedAt: Date.now() },
            { new: true }
        );

        if (!item) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Item not found'
                }
            });
        }

        res.status(200).json({
            success: true,
            data: {
                id: item.itemId,
                text: item.text,
                isCompleted: item.isCompleted,
                categoryId: item.categoryId,
                imageUrl: item.imageUrl,
                description: item.description,
                updatedAt: item.updatedAt
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Toggle item completion
// @route   PATCH /api/v1/spaces/:spaceId/items/:itemId/toggle
// @access  Private
const toggleItemCompletion = async (req, res, next) => {
    try {
        const item = await Item.findOne({
            itemId: req.params.itemId,
            spaceId: req.params.spaceId,
            userId: req.user.userId
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Item not found'
                }
            });
        }

        item.isCompleted = !item.isCompleted;
        item.updatedAt = Date.now();
        await item.save();

        res.status(200).json({
            success: true,
            data: {
                id: item.itemId,
                isCompleted: item.isCompleted,
                updatedAt: item.updatedAt
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Move item to category
// @route   PATCH /api/v1/spaces/:spaceId/items/:itemId/move
// @access  Private
const moveItem = async (req, res, next) => {
    try {
        const { categoryId } = req.body;

        const item = await Item.findOneAndUpdate(
            {
                itemId: req.params.itemId,
                spaceId: req.params.spaceId,
                userId: req.user.userId
            },
            { categoryId: categoryId || null, updatedAt: Date.now() },
            { new: true }
        );

        if (!item) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Item not found'
                }
            });
        }

        res.status(200).json({
            success: true,
            data: {
                id: item.itemId,
                categoryId: item.categoryId,
                updatedAt: item.updatedAt
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reorder items within a category
// @route   PATCH /api/v1/spaces/:spaceId/categories/:categoryId/items/reorder
// @access  Private
const reorderItems = async (req, res, next) => {
    try {
        const { itemIds } = req.body;

        // Update order for each item
        await Promise.all(
            itemIds.map(async (itemId, index) => {
                await Item.findOneAndUpdate(
                    {
                        itemId,
                        spaceId: req.params.spaceId,
                        userId: req.user.userId
                    },
                    { order: index }
                );
            })
        );

        res.status(200).json({
            success: true,
            message: 'Items reordered successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete item
// @route   DELETE /api/v1/spaces/:spaceId/items/:itemId
// @access  Private
const deleteItem = async (req, res, next) => {
    try {
        const item = await Item.findOneAndDelete({
            itemId: req.params.itemId,
            spaceId: req.params.spaceId,
            userId: req.user.userId
        });

        if (!item) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Item not found'
                }
            });
        }

        res.status(200).json({
            success: true,
            message: 'Item deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllItems,
    getItem,
    createItem,
    updateItem,
    toggleItemCompletion,
    moveItem,
    reorderItems,
    deleteItem
};
