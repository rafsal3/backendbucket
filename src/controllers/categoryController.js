const Category = require('../models/Category');
const Item = require('../models/Item');

// @desc    Get all categories for a space
// @route   GET /api/v1/spaces/:spaceId/categories
// @access  Private
const getAllCategories = async (req, res, next) => {
    try {
        const { includeHidden } = req.query;
        const filter = {
            spaceId: req.params.spaceId,
            userId: req.user.userId
        };

        if (includeHidden !== 'true') {
            filter.isHidden = false;
        }

        const categories = await Category.find(filter).sort({ order: 1 });

        // Get counts and progress for each category
        const categoriesWithStats = await Promise.all(
            categories.map(async (category) => {
                const items = await Item.find({ categoryId: category.categoryId });
                const totalCount = items.length;
                const completedCount = items.filter(item => item.isCompleted).length;
                const progress = totalCount > 0 ? completedCount / totalCount : 0;

                return {
                    id: category.categoryId,
                    name: category.name,
                    icon: category.icon,
                    isHidden: category.isHidden,
                    totalCount,
                    completedCount,
                    progress,
                    createdAt: category.createdAt,
                    updatedAt: category.updatedAt
                };
            })
        );

        res.status(200).json({
            success: true,
            data: categoriesWithStats
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single category with items
// @route   GET /api/v1/spaces/:spaceId/categories/:categoryId
// @access  Private
const getCategory = async (req, res, next) => {
    try {
        const category = await Category.findOne({
            categoryId: req.params.categoryId,
            spaceId: req.params.spaceId,
            userId: req.user.userId
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Category not found'
                }
            });
        }

        const items = await Item.find({ categoryId: category.categoryId }).sort({ order: 1 });
        const totalCount = items.length;
        const completedCount = items.filter(item => item.isCompleted).length;
        const progress = totalCount > 0 ? completedCount / totalCount : 0;

        res.status(200).json({
            success: true,
            data: {
                id: category.categoryId,
                name: category.name,
                icon: category.icon,
                isHidden: category.isHidden,
                totalCount,
                completedCount,
                progress,
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
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create category
// @route   POST /api/v1/spaces/:spaceId/categories
// @access  Private
const createCategory = async (req, res, next) => {
    try {
        const { name, icon } = req.body;

        // Get the highest order number
        const lastCategory = await Category.findOne({
            spaceId: req.params.spaceId
        }).sort({ order: -1 });
        const order = lastCategory ? lastCategory.order + 1 : 0;

        const category = await Category.create({
            spaceId: req.params.spaceId,
            userId: req.user.userId,
            name,
            icon: icon || '📌',
            order
        });

        res.status(201).json({
            success: true,
            data: {
                id: category.categoryId,
                name: category.name,
                icon: category.icon,
                isHidden: category.isHidden,
                totalCount: 0,
                completedCount: 0,
                progress: 0.0,
                items: [],
                createdAt: category.createdAt,
                updatedAt: category.updatedAt
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update category
// @route   PUT /api/v1/spaces/:spaceId/categories/:categoryId
// @access  Private
const updateCategory = async (req, res, next) => {
    try {
        const { name, icon } = req.body;

        const category = await Category.findOneAndUpdate(
            {
                categoryId: req.params.categoryId,
                spaceId: req.params.spaceId,
                userId: req.user.userId
            },
            { name, icon, updatedAt: Date.now() },
            { new: true }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Category not found'
                }
            });
        }

        res.status(200).json({
            success: true,
            data: {
                id: category.categoryId,
                name: category.name,
                icon: category.icon,
                updatedAt: category.updatedAt
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Toggle category visibility
// @route   PATCH /api/v1/spaces/:spaceId/categories/:categoryId/visibility
// @access  Private
const toggleCategoryVisibility = async (req, res, next) => {
    try {
        const { isHidden } = req.body;

        const category = await Category.findOneAndUpdate(
            {
                categoryId: req.params.categoryId,
                spaceId: req.params.spaceId,
                userId: req.user.userId
            },
            { isHidden, updatedAt: Date.now() },
            { new: true }
        );

        if (!category) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Category not found'
                }
            });
        }

        res.status(200).json({
            success: true,
            data: {
                id: category.categoryId,
                isHidden: category.isHidden
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Reorder categories
// @route   PATCH /api/v1/spaces/:spaceId/categories/reorder
// @access  Private
const reorderCategories = async (req, res, next) => {
    try {
        const { categoryIds } = req.body;

        // Update order for each category
        await Promise.all(
            categoryIds.map(async (categoryId, index) => {
                await Category.findOneAndUpdate(
                    {
                        categoryId,
                        spaceId: req.params.spaceId,
                        userId: req.user.userId
                    },
                    { order: index }
                );
            })
        );

        res.status(200).json({
            success: true,
            message: 'Categories reordered successfully'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete category
// @route   DELETE /api/v1/spaces/:spaceId/categories/:categoryId
// @access  Private
const deleteCategory = async (req, res, next) => {
    try {
        const category = await Category.findOneAndDelete({
            categoryId: req.params.categoryId,
            spaceId: req.params.spaceId,
            userId: req.user.userId
        });

        if (!category) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Category not found'
                }
            });
        }

        // Delete all items in this category
        await Item.deleteMany({ categoryId: req.params.categoryId });

        res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllCategories,
    getCategory,
    createCategory,
    updateCategory,
    toggleCategoryVisibility,
    reorderCategories,
    deleteCategory
};
