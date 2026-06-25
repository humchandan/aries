const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");

require("dotenv").config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Cleaning up fake/test transaction tables...");

  // 1. Delete all Network Earnings
  const res1 = await prisma.networkEarning.deleteMany({});
  console.log(`Deleted ${res1.count} NetworkEarning records.`);

  // 2. Delete all Ledger Entries
  const res2 = await prisma.ledgerEntry.deleteMany({});
  console.log(`Deleted ${res2.count} LedgerEntry records.`);

  // 3. Delete all Claim Histories
  const res3 = await prisma.claimHistory.deleteMany({});
  console.log(`Deleted ${res3.count} ClaimHistory records.`);

  // 4. Delete all Utility Requests
  const res4 = await prisma.utilityRequest.deleteMany({});
  console.log(`Deleted ${res4.count} UtilityRequest records.`);

  console.log("Database clean up completed successfully!");
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
