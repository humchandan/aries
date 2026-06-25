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

  console.log(`Feeding dummy commissions to wallet: ${targetWallet}...`);

  // Clear existing earnings for this user to make it clean
  await prisma.networkEarning.deleteMany({
    where: { userAddress: targetWallet },
  });

  const dummyEarnings = [
    {
      userAddress: targetWallet,
      fromAddress: "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
      level: 1,
      amount: 150.25,
      isClaimed: true, // Available/claimed historically
      txHash: "0xdummyhash1111111111111111111111111111111111111111111111111111",
    },
    {
      userAddress: targetWallet,
      fromAddress: "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
      level: 1,
      amount: 50.00,
      isClaimed: true,
      txHash: "0xdummyhash2222222222222222222222222222222222222222222222222222",
    },
    {
      userAddress: targetWallet,
      fromAddress: "0x15d34aafc52c9747a696178648a3c4bd3f4a43df",
      level: 2,
      amount: 280.50,
      isClaimed: false, // Available now to trigger redeem button
      txHash: null,
    },
    {
      userAddress: targetWallet,
      fromAddress: "0x321a59fb6bc1c4f870365e785982e1f101e93b906",
      level: 3,
      amount: 75.00,
      isClaimed: false, // Locked / Available to claim
      txHash: null,
    },
  ];

  for (const item of dummyEarnings) {
    await prisma.networkEarning.create({
      data: item,
    });
  }

  console.log("Successfully inserted dummy network commission records!");
  await prisma.$disconnect();
  await pool.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
