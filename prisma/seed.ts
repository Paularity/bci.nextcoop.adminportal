import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash("Admin123!", 10);

  await prisma.user.upsert({
    where: { username: "sysadmin" },
    update: {},
    create: {
      username: "sysadmin",
      email: "sysadmin@nextcoop.local",
      passwordHash: adminPassword,
      firstName: "System",
      lastName: "Admin",
      role: "SYSTEM_ADMIN",
    },
  });

  const tenants = [
    {
      code: "COOP-001",
      name: "Sunrise Cooperative",
      address: "123 Sunrise St, Metro Manila",
      admin: {
        first: "Maria",
        last: "Santos",
        email: "maria.santos@sunrise.coop",
        username: "maria.santos",
        mobile: "+63 917 000 0001",
      },
    },
    {
      code: "COOP-002",
      name: "Riverside Farmers Co-op",
      address: "45 River Rd, Laguna",
      admin: {
        first: "Jose",
        last: "Reyes",
        email: "jose.reyes@riverside.coop",
        username: "jose.reyes",
        mobile: "+63 917 000 0002",
      },
    },
    {
      code: "COOP-003",
      name: "Mountainview Savings",
      address: "9 Ridge Ave, Baguio",
      admin: {
        first: "Ana",
        last: "Lim",
        email: "ana.lim@mountainview.coop",
        username: "ana.lim",
        mobile: "+63 917 000 0003",
      },
    },
  ];

  const tenantAdminPassword = await bcrypt.hash("Tenant123!", 10);

  for (const t of tenants) {
    const existing = await prisma.tenant.findUnique({ where: { tenantCode: t.code } });
    if (existing) continue;
    const tenant = await prisma.tenant.create({
      data: {
        tenantCode: t.code,
        cooperativeName: t.name,
        cooperativeAddress: t.address,
      },
    });
    await prisma.user.create({
      data: {
        username: t.admin.username,
        email: t.admin.email,
        firstName: t.admin.first,
        lastName: t.admin.last,
        mobileNumber: t.admin.mobile,
        passwordHash: tenantAdminPassword,
        role: "TENANT_ADMIN",
        tenantId: tenant.id,
      },
    });
  }

  console.log("Seed complete.");
  console.log("System Admin login: sysadmin / Admin123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
