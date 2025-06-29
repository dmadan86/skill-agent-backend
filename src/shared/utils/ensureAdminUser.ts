import User from "../models/User";
import logger from "./logger";

/**
 * Ensures that an admin user exists in the system.
 * Creates one using environment variables if not found.
 */
const ensureAdminUser = async (): Promise<void> => {
  try {
    // Check if any superadmin exists
    const superadminExists = await User.findOne({ role: "superadmin" });

    // If superadmin exists, no need to create one
    if (superadminExists) {
      logger.info(
        "Superadmin user already exists, skipping superadmin creation",
      );
      return;
    }

    // Check for admin credentials in environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminFirstName = process.env.ADMIN_FIRST_NAME ?? "System";
    const adminLastName = process.env.ADMIN_LAST_NAME ?? "Admin";

    // Validate required environment variables
    if (!adminEmail || !adminPassword) {
      logger.warn(
        "Superadmin creation skipped: ADMIN_EMAIL or ADMIN_PASSWORD not set in environment variables",
      );
      return;
    }
    logger.debug("Admin email: " + adminEmail);
    logger.debug("Admin password: " + adminPassword);

    const adminUser = new User({
      email: adminEmail.toLowerCase(),
      password: adminPassword,
      firstName: adminFirstName,
      lastName: adminLastName,
      role: "superadmin",
      isEmailVerified: true, // Auto-verify admin account
    });

    await adminUser.save();

    logger.info(`Admin user created successfully with email: ${adminEmail}`);
  } catch (error) {
    logger.error("Failed to create superadmin user error: " + error);
  }
};

export default ensureAdminUser;
