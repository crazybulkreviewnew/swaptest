// ============================================================
// prisma/seed.js — Database Seeder
// ============================================================
// Run: npm run db:seed
// Creates test users and listings for development.
// ============================================================

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const db = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await db.payment.deleteMany();
  await db.match.deleteMany();
  await db.listing.deleteMany();
  await db.user.deleteMany();

  const password = await bcrypt.hash("password123", 12);

  // Create test users
  const sarah = await db.user.create({
    data: { name: "Sarah Collins", email: "sarah@test.com", phone: "07712345678", password },
  });
  const james = await db.user.create({
    data: { name: "James Patel", email: "james@test.com", phone: "07891234567", password },
  });
  const emily = await db.user.create({
    data: { name: "Emily Wright", email: "emily@test.com", phone: "07456789012", password },
  });
  const alex = await db.user.create({
    data: { name: "Alex Thompson", email: "alex@test.com", phone: "07321654987", password },
  });

  // Create "want later" listings (these are the supply)
  await db.listing.create({
    data: {
      userId: sarah.id, type: "LATER", centre: "Enfield",
      currentDate: new Date("2026-04-10"), currentTime: "09:30",
      preferredDateFrom: new Date("2026-06-01"), preferredDateTo: new Date("2026-08-30"),
    },
  });

  await db.listing.create({
    data: {
      userId: james.id, type: "LATER", centre: "Enfield",
      currentDate: new Date("2026-04-22"), currentTime: "14:00",
      preferredDateFrom: new Date("2026-05-15"), preferredDateTo: new Date("2026-07-31"),
    },
  });

  await db.listing.create({
    data: {
      userId: emily.id, type: "LATER", centre: "Wood Green",
      currentDate: new Date("2026-03-28"), currentTime: "11:15",
      preferredDateFrom: new Date("2026-05-01"), preferredDateTo: new Date("2026-06-30"),
    },
  });

  await db.listing.create({
    data: {
      userId: alex.id, type: "LATER", centre: "Enfield",
      currentDate: new Date("2026-05-05"), currentTime: "10:45",
      preferredDateFrom: new Date("2026-07-01"), preferredDateTo: new Date("2026-09-30"),
    },
  });

  console.log("Seeded: 4 users, 4 listings");
  console.log("Login credentials: any email above + password: password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
