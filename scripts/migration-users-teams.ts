// scripts/migration-users-teams.ts

import mongoose from 'mongoose';
import User from '../src/shared/models/User';
import { Department } from '../src/shared/models/Department';
import config from '../src/shared/config';

async function main() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(config.mongodbUri);
    console.log('Connected to MongoDB');

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to migrate`);

    // Add teams array to users
    let updatedCount = 0;

    for (const user of users) {
      let updateData: any = {};
      
      // Add empty teams array if it doesn't exist
      console.log(`User ${user.email} has teams ${typeof user.teams}`);
      if (!user.teams) {
        console.log(`User ${user.email} has no teams`);
        updateData.teams = [];
      }

      // Convert department string to ObjectId if needed
      if (user.department && typeof user.department === 'string') {
        // Find department by name
        console.log(`User ${user.email} has department ${user.department}`);
        const department = await Department.findOne({ name: user.department });
        
        if (department) {
          updateData.department = department._id;
        } else {
          // Remove department reference if department not found
          updateData.department = null;
        }
      }

      // Update the user if there are changes
      if (Object.keys(updateData).length > 0) {
        console.log(`Updating user ${user.email} with teams ${updateData.teams}`);
        await User.updateOne({ _id: user._id }, { $set: updateData });
        updatedCount++;
      }
    }

    console.log(`Migration completed. Updated ${updatedCount} users.`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

main();