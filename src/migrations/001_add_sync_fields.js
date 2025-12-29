/**
 * Migration Script: Add Sync Fields to Existing Records
 * 
 * This script adds the required sync fields (deleted, deviceId) to all existing records
 * and ensures backward compatibility by keeping legacy ID fields.
 * 
 * Run this script ONCE after deploying the new models.
 * 
 * Usage: node src/migrations/001_add_sync_fields.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/database');

// Import models
const Space = require('../models/Space');
const Category = require('../models/Category');
const Item = require('../models/Item');
const UserPreferences = require('../models/UserPreferences');

const migrateModel = async (Model, legacyIdField) => {
    const modelName = Model.modelName;
    console.log(`\n🔄 Migrating ${modelName}...`);

    try {
        // Find all records that don't have the new sync fields
        const records = await Model.find({
            $or: [
                { deleted: { $exists: false } },
                { deviceId: { $exists: false } },
                { id: { $exists: false } }
            ]
        });

        console.log(`   Found ${records.length} records to migrate`);

        let updated = 0;
        for (const record of records) {
            const updates = {};

            // Add 'id' field if missing (use legacy ID or generate new)
            if (!record.id) {
                updates.id = record[legacyIdField] || `${modelName.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }

            // Add 'deleted' field if missing
            if (record.deleted === undefined) {
                updates.deleted = false;
            }

            // Add 'deviceId' field if missing
            if (!record.deviceId) {
                updates.deviceId = 'server_migration';
            }

            // Ensure createdAt exists
            if (!record.createdAt) {
                updates.createdAt = record._id.getTimestamp() || new Date();
            }

            // Update the record
            if (Object.keys(updates).length > 0) {
                await Model.updateOne(
                    { _id: record._id },
                    { $set: updates }
                );
                updated++;
            }
        }

        console.log(`   ✅ Migrated ${updated} ${modelName} records`);
        return { model: modelName, migrated: updated };
    } catch (error) {
        console.error(`   ❌ Error migrating ${modelName}:`, error.message);
        return { model: modelName, migrated: 0, error: error.message };
    }
};

const runMigration = async () => {
    console.log('🚀 Starting migration: Add sync fields to existing records\n');
    console.log('='.repeat(60));

    try {
        // Connect to database
        await connectDB();
        console.log('✅ Connected to database\n');

        // Migrate each model
        const results = [];

        results.push(await migrateModel(Space, 'spaceId'));
        results.push(await migrateModel(Category, 'categoryId'));
        results.push(await migrateModel(Item, 'itemId'));
        results.push(await migrateModel(UserPreferences, 'userId'));

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📊 Migration Summary:\n');

        let totalMigrated = 0;
        results.forEach(result => {
            console.log(`   ${result.model}: ${result.migrated} records`);
            totalMigrated += result.migrated;
        });

        console.log(`\n   Total: ${totalMigrated} records migrated`);
        console.log('\n✅ Migration completed successfully!');
        console.log('='.repeat(60));

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    } finally {
        // Close database connection
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
};

// Run migration
runMigration();
