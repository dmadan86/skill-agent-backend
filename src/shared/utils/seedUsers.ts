import User from "../models/User";
import bcrypt from "bcrypt";

const seedUsers = async () => {
  const count = await User.countDocuments();
  if (count === 0) {
    console.log("Seeding initial users...");

    const users = [
      {
        email: "alice.admin@example.com",
        password: await bcrypt.hash("SecurePass123", 10),
        firstName: "Alice",
        lastName: "Johnson",
        role: "admin",
        department: "IT",
        position: "System Administrator",
      },
      {
        email: "bob.manager@example.com",
        password: await bcrypt.hash("Manager@123", 10),
        firstName: "Bob",
        lastName: "Smith",
        role: "manager",
        department: "Engineering",
        position: "Engineering Manager",
      },
      {
        email: "carol.emp@example.com",
        password: await bcrypt.hash("Employee@456", 10),
        firstName: "Carol",
        lastName: "Williams",
        role: "employee",
        department: "Software Development",
        position: "Software Engineer",
      },
      {
        email: "dave.emp@example.com",
        password: await bcrypt.hash("DevEmp#789", 10),
        firstName: "Dave",
        lastName: "Brown",
        role: "employee",
        department: "Infrastructure",
        position: "DevOps Engineer",
      },
      {
        email: "eve.manager@example.com",
        password: await bcrypt.hash("UXManager@Design", 10),
        firstName: "Eve",
        lastName: "Miller",
        role: "manager",
        department: "Design",
        position: "UI/UX Lead",
      },
    ];

    await User.insertMany(users);
    console.log("Users seeded successfully.");
  } else {
    console.log("Users already exist, skipping seeding.");
  }
};

export default seedUsers;
