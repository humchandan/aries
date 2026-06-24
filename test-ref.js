const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const allUsers = await prisma.user.findMany();
  console.log("Total users:", allUsers.length);
}
main();
