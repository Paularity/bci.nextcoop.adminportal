import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type SeedTenant = {
  code: string;
  name: string;
  address: string;
  status: "ACTIVE" | "INACTIVE";
  admin: {
    first: string;
    last: string;
    email: string;
    username: string;
    mobile: string;
  };
};

const TENANTS: SeedTenant[] = [
  { code: "COOP-001", name: "Sunrise Cooperative",       address: "123 Sunrise St, Metro Manila",  status: "ACTIVE",   admin: { first: "Maria",    last: "Santos",    email: "maria.santos@sunrise.coop",       username: "maria.santos",    mobile: "+63 917 000 0001" } },
  { code: "COOP-002", name: "Riverside Farmers Co-op",   address: "45 River Rd, Laguna",           status: "ACTIVE",   admin: { first: "Jose",     last: "Reyes",     email: "jose.reyes@riverside.coop",       username: "jose.reyes",      mobile: "+63 917 000 0002" } },
  { code: "COOP-003", name: "Mountainview Savings",      address: "9 Ridge Ave, Baguio",           status: "ACTIVE",   admin: { first: "Ana",      last: "Lim",       email: "ana.lim@mountainview.coop",       username: "ana.lim",         mobile: "+63 917 000 0003" } },
  { code: "COOP-004", name: "Coastal Fisherfolk Co-op",  address: "12 Bayview Blvd, Cebu City",    status: "ACTIVE",   admin: { first: "Ramon",    last: "Cruz",      email: "ramon.cruz@coastal.coop",         username: "ramon.cruz",      mobile: "+63 917 000 0004" } },
  { code: "COOP-005", name: "Highland Producers Union",  address: "88 Pine Hills, Benguet",        status: "ACTIVE",   admin: { first: "Elena",    last: "Bautista",  email: "elena.bautista@highland.coop",    username: "elena.bautista",  mobile: "+63 917 000 0005" } },
  { code: "COOP-006", name: "Palawan Eco Farmers",       address: "3 Rainforest Ln, Puerto Princesa", status: "ACTIVE", admin: { first: "Luis",     last: "Mendoza",   email: "luis.mendoza@palawan.coop",       username: "luis.mendoza",    mobile: "+63 917 000 0006" } },
  { code: "COOP-007", name: "Northern Rice Growers",     address: "22 Palayan Rd, Nueva Ecija",    status: "ACTIVE",   admin: { first: "Carmelita", last: "Domingo",  email: "carmelita.domingo@nrg.coop",      username: "carmelita.domingo", mobile: "+63 917 000 0007" } },
  { code: "COOP-008", name: "Southern Coco Millers",     address: "7 Coco Ave, Davao",             status: "INACTIVE", admin: { first: "Rodel",    last: "Villanueva",email: "rodel.villanueva@scm.coop",       username: "rodel.villanueva", mobile: "+63 917 000 0008" } },
  { code: "COOP-009", name: "Bicol Weavers Guild",       address: "14 Loom St, Legazpi",           status: "ACTIVE",   admin: { first: "Teresita", last: "Aquino",    email: "teresita.aquino@bicolweavers.coop", username: "teresita.aquino", mobile: "+63 917 000 0009" } },
  { code: "COOP-010", name: "Visayas Sugar Planters",    address: "56 Cane Rd, Bacolod",           status: "ACTIVE",   admin: { first: "Jorge",    last: "Ramos",     email: "jorge.ramos@vsp.coop",            username: "jorge.ramos",     mobile: "+63 917 000 0010" } },
  { code: "COOP-011", name: "Mindanao Cacao Farmers",    address: "31 Cacao Trail, Cotabato",      status: "ACTIVE",   admin: { first: "Nora",     last: "Del Rosario", email: "nora.delrosario@mcf.coop",     username: "nora.delrosario", mobile: "+63 917 000 0011" } },
  { code: "COOP-012", name: "Ilocos Tobacco Growers",    address: "9 Tobacco Rd, Vigan",           status: "INACTIVE", admin: { first: "Antonio",  last: "Garcia",    email: "antonio.garcia@itg.coop",         username: "antonio.garcia",  mobile: "+63 917 000 0012" } },
  { code: "COOP-013", name: "Batangas Coffee Circle",    address: "27 Kapeng Barako St, Lipa",     status: "ACTIVE",   admin: { first: "Isabella", last: "Torres",    email: "isabella.torres@batangascoffee.coop", username: "isabella.torres", mobile: "+63 917 000 0013" } },
  { code: "COOP-014", name: "Zamboanga Kelp Harvesters", address: "12 Seaweed Cove, Zamboanga",    status: "ACTIVE",   admin: { first: "Miguel",   last: "Fernandez", email: "miguel.fernandez@zkh.coop",       username: "miguel.fernandez", mobile: "+63 917 000 0014" } },
  { code: "COOP-015", name: "Iloilo Rice Millers",       address: "8 Mill Yard, Iloilo",           status: "ACTIVE",   admin: { first: "Beatriz",  last: "Salazar",   email: "beatriz.salazar@irm.coop",        username: "beatriz.salazar", mobile: "+63 917 000 0015" } },
  { code: "COOP-016", name: "Cordillera Craft Alliance", address: "18 Weavers Row, Sagada",        status: "ACTIVE",   admin: { first: "Emilio",   last: "Tapawan",   email: "emilio.tapawan@cordillera.coop",  username: "emilio.tapawan",  mobile: "+63 917 000 0016" } },
  { code: "COOP-017", name: "Cagayan Corn Producers",    address: "44 Cornfield Rd, Tuguegarao",   status: "INACTIVE", admin: { first: "Sofia",    last: "Ramirez",   email: "sofia.ramirez@ccp.coop",          username: "sofia.ramirez",   mobile: "+63 917 000 0017" } },
  { code: "COOP-018", name: "Aurora Bamboo Growers",     address: "5 Bamboo Grove, Baler",         status: "ACTIVE",   admin: { first: "Renato",   last: "Alvarez",   email: "renato.alvarez@abg.coop",         username: "renato.alvarez",  mobile: "+63 917 000 0018" } },
  { code: "COOP-019", name: "Pangasinan Salt Makers",    address: "10 Asin Ln, Dagupan",           status: "ACTIVE",   admin: { first: "Corazon",  last: "Ilagan",    email: "corazon.ilagan@psm.coop",         username: "corazon.ilagan",  mobile: "+63 917 000 0019" } },
  { code: "COOP-020", name: "Sulu Pearl Divers",         address: "2 Pearl Bay, Jolo",             status: "ACTIVE",   admin: { first: "Rashid",   last: "Hakim",     email: "rashid.hakim@spd.coop",           username: "rashid.hakim",    mobile: "+63 917 000 0020" } },
  { code: "COOP-021", name: "Bohol Cassava Coop",        address: "17 Tapioca Rd, Tagbilaran",     status: "ACTIVE",   admin: { first: "Priscilla", last: "Solis",    email: "priscilla.solis@bcc.coop",        username: "priscilla.solis", mobile: "+63 917 000 0021" } },
  { code: "COOP-022", name: "Metro Manila Vendors Union", address: "1 Divisoria Rd, Manila",       status: "ACTIVE",   admin: { first: "Danilo",   last: "Marasigan", email: "danilo.marasigan@mmvu.coop",      username: "danilo.marasigan", mobile: "+63 917 000 0022" } },
  { code: "COOP-023", name: "Camiguin Volcano Farmers",  address: "6 Crater Rd, Mambajao",         status: "INACTIVE", admin: { first: "Fatima",   last: "Nolasco",   email: "fatima.nolasco@cvf.coop",         username: "fatima.nolasco",  mobile: "+63 917 000 0023" } },
  { code: "COOP-024", name: "Bulacan Poultry Alliance",  address: "23 Manok Way, Malolos",         status: "ACTIVE",   admin: { first: "Bernardo", last: "Uy",        email: "bernardo.uy@bpa.coop",            username: "bernardo.uy",     mobile: "+63 917 000 0024" } },
  { code: "COOP-025", name: "Tawi-Tawi Seaweed Collective", address: "9 Reef Rd, Bongao",          status: "ACTIVE",   admin: { first: "Nadia",    last: "Salim",     email: "nadia.salim@ttsc.coop",           username: "nadia.salim",     mobile: "+63 917 000 0025" } },
];

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

  const tenantAdminPassword = await bcrypt.hash("Tenant123!", 10);

  let createdCount = 0;
  let skippedCount = 0;

  for (const t of TENANTS) {
    // Skip if the tenantCode is taken OR if the admin's username/email is
    // already used by another user (e.g. left over from a previously
    // soft-deleted tenant whose administrator row is still present).
    const [existingTenant, existingByUsername, existingByEmail] = await Promise.all([
      prisma.tenant.findUnique({ where: { tenantCode: t.code } }),
      prisma.user.findUnique({ where: { username: t.admin.username } }),
      prisma.user.findUnique({ where: { email: t.admin.email } }),
    ]);
    if (existingTenant || existingByUsername || existingByEmail) {
      skippedCount++;
      continue;
    }
    const tenant = await prisma.tenant.create({
      data: {
        tenantCode: t.code,
        cooperativeName: t.name,
        cooperativeAddress: t.address,
        status: t.status,
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
    createdCount++;
  }

  console.log(
    `Seed complete. Tenants: created ${createdCount}, skipped (already present) ${skippedCount}.`,
  );
  console.log("System Admin login: sysadmin / Admin123!");
  console.log(`Tenant Admin login: any of the ${TENANTS.length} seeded tenant admins / Tenant123!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
