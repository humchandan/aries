const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const { Pool } = require("pg");

require("dotenv").config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const targetWallet = "0x6bb20c85115a44b4120d1ca02b5f44fa87ae6530".toLowerCase();

  console.log(`Setting up scenario 2: Releasing commissions (Withdrawal DONE by downlines)...`);

  // Update all records for this user to isClaimed: false (which renders as Available for release/withdrawal)
  const result = await prisma.networkEarning.updateMany({
    where: { userAddress: targetWallet },
    data: {
      isClaimed: false,
      txHash: null,
    },
  });

  console.log(`Successfully updated ${result.count} commission entries to AVAILABLE state!`);
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
