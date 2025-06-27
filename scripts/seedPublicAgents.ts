import mongoose from "mongoose";
import { createPublicAgentsForUser } from "../src/features/agents/services/publicAgentService";
import logger from "../src/shared/utils/logger";

// Define the system user ID (or create a system user if needed)
const SYSTEM_USER_ID = new mongoose.Types.ObjectId("682cbcf2730b9aaae39b6697");

const seedPublicAgents = async () => {
  try {
    // Connect to the database
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/digital-agents");

    logger.info("Seeding public agents...");

    // Use the existing service to create public agents
    const agents = await createPublicAgentsForUser(SYSTEM_USER_ID);

    logger.info(`Successfully seeded ${agents.length} public agents.`);
  } catch (error) {
    logger.error("Error seeding public agents:", error);
  } finally {
    // Disconnect from the database
    await mongoose.disconnect();
  }
};

// Run the seeding script
seedPublicAgents(); 