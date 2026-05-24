// Database seed script — creates admin user and sample data
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create super admin
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@pcbquote.ai";
  const adminPassword = await bcrypt.hash("Admin@123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "PCBQuote Admin",
      passwordHash: adminPassword,
      role: "SUPER_ADMIN",
      companyName: "PCBQuote AI",
    },
  });

  console.log(`✅ Admin user: ${admin.email}`);

  // Create a demo user
  const demoPassword = await bcrypt.hash("Demo@123!", 12);
  const demo = await prisma.user.upsert({
    where: { email: "demo@pcbquote.ai" },
    update: {},
    create: {
      email: "demo@pcbquote.ai",
      name: "Demo Engineer",
      passwordHash: demoPassword,
      role: "USER",
      companyName: "Demo Electronics",
    },
  });

  console.log(`✅ Demo user: ${demo.email}`);

  // Create a sample quote
  await prisma.quote.upsert({
    where: { referenceNo: "demo-quote-001" },
    update: {},
    create: {
      userId: demo.id,
      referenceNo: "demo-quote-001",
      status: "COMPLETED",
      width: 100,
      height: 80,
      layers: 4,
      thickness: 1.6,
      copperWeight: 1,
      surfaceFinish: "ENIG",
      solderMaskColor: "GREEN",
      silkscreenColor: "WHITE",
      viaCount: 250,
      drillCount: 500,
      minTraceWidth: 0.15,
      minSpacing: 0.15,
      quantity: 100,
      smtAssembly: true,
      smtComponentCount: 120,
      electricalTest: true,
      currency: "USD",
      materialCost: 245.50,
      manufacturingCost: 180.00,
      assemblyCost: 390.00,
      testingCost: 130.00,
      packagingCost: 17.00,
      shippingCost: 28.50,
      totalCost: 991.00,
      suggestedPrice: 1387.40,
      profitMargin: 28.5,
      leadTimeDays: 12,
      yieldEstimate: 0.96,
      complexityScore: 62,
      dfmScore: 78,
      dfmWarnings: JSON.stringify(["Electrical testing strongly recommended for 4-layer board"]),
      manufacturingNotes: JSON.stringify(["4-layer board requires advanced lamination press cycle", "ENIG finish requires electroless nickel immersion gold process"]),
      optimizationSuggestions: JSON.stringify(["Enable panelization to reduce per-unit fabrication cost by 15-30%"]),
    },
  });

  console.log("✅ Sample quote created");

  // Global settings
  await prisma.globalSetting.upsert({
    where: { key: "platform_config" },
    update: {},
    create: {
      key: "platform_config",
      value: JSON.stringify({
        maintenanceMode: false,
        allowNewRegistrations: true,
        freePlanQuotaMonthly: 5,
        version: "1.0.0",
      }),
    },
  });

  console.log("✅ Global settings initialized");
  console.log("\n🚀 Seed complete!");
  console.log("   Admin: admin@pcbquote.ai / Admin@123!");
  console.log("   Demo:  demo@pcbquote.ai  / Demo@123!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
