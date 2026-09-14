// ============================================================
// Digital Khandaan - Database Seed
// Creates: admin + demo user accounts ONLY (no dummy data).
// Communities, clans, events etc. are created via the app, never seeded.
// Run: npx prisma db seed
// ============================================================

import { PrismaClient, Prisma } from "@prisma/client";
import { statSync } from "fs";
import { join } from "path";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // ---------- Reset sample data (makes the seed re-runnable) ----------
  // Sample data tables are reset; users and site settings are preserved.
  await prisma.auditLog.deleteMany();
  await prisma.eventRSVP.deleteMany();
  await prisma.media.deleteMany();
  await prisma.memory.deleteMany();
  await prisma.event.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.jobApplication.deleteMany();
  await prisma.jobPosting.deleteMany();
  await prisma.business.deleteMany();
  await prisma.rishtaRequest.deleteMany();
  await prisma.rishtaProfile.deleteMany();
  await prisma.jobProfile.deleteMany();
  await prisma.groupPhotoTag.deleteMany();
  await prisma.groupPhoto.deleteMany();
  await prisma.subClan.deleteMany();
  await prisma.clan.deleteMany();
  await prisma.community.deleteMany();
  console.log("🧹 Sample data reset");

  // ---------- Admin user ----------
  const adminPassword = await bcrypt.hash("Admin@12345", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@digitalkhandaan.pk" },
    update: { role: "ADMIN", isVerified: true },
    create: {
      email: "admin@digitalkhandaan.pk",
      name: "Platform Admin",
      password: adminPassword,
      role: "ADMIN",
      isVerified: true,
      phone: "03001234567",
      gender: "MALE",
      city: "Karachi",
      province: "Sindh",
      bio: "Digital Khandaan platform administrator",
      isActive: true,
    },
  });
  console.log(`✅ Admin user: ${admin.email} (password: Admin@12345)`);

  // ---------- Demo user ----------
  const demoPassword = await bcrypt.hash("Demo@12345", 12);
  const demo = await prisma.user.upsert({
    where: { email: "demo@digitalkhandaan.pk" },
    update: { isVerified: true },
    create: {
      email: "demo@digitalkhandaan.pk",
      name: "Ahmed Khan",
      password: demoPassword,
      role: "USER",
      isVerified: true,
      phone: "03019876543",
      gender: "MALE",
      dateOfBirth: new Date("1995-06-15"),
      city: "Lahore",
      province: "Punjab",
      bio: "Family man, cricket lover, and chai enthusiast ☕",
      bloodGroup: "B+",
      occupation: "Software Engineer",
      education: "Master's",
      isActive: true,
    },
  });
  console.log(`✅ Demo user: ${demo.email} (password: Demo@12345)`);

  const demo2 = await prisma.user.upsert({
    where: { email: "fatima@digitalkhandaan.pk" },
    update: { isVerified: true },
    create: {
      email: "fatima@digitalkhandaan.pk",
      name: "Fatima Khan",
      password: demoPassword,
      role: "USER",
      isVerified: true,
      phone: "03017654321",
      gender: "FEMALE",
      dateOfBirth: new Date("1998-02-20"),
      city: "Karachi",
      province: "Sindh",
      bio: "ٹیچر اور پڑھائی کی شوقین 📚",
      bloodGroup: "O+",
      occupation: "Teacher",
      education: "Master's",
      isActive: true,
    },
  });
  console.log(`✅ Demo user 2: ${demo2.email}`);

  const demo3 = await prisma.user.upsert({
    where: { email: "usman@digitalkhandaan.pk" },
    update: { isVerified: true },
    create: {
      email: "usman@digitalkhandaan.pk",
      name: "Usman Malik",
      password: demoPassword,
      role: "USER",
      isVerified: true,
      phone: "03015556677",
      gender: "MALE",
      dateOfBirth: new Date("1990-11-03"),
      city: "Islamabad",
      province: "Islamabad Capital Territory",
      bio: "Business owner, family first 🤲",
      bloodGroup: "A+",
      occupation: "Business Owner",
      education: "Bachelor's",
      isActive: true,
    },
  });
  console.log(`✅ Demo user 3: ${demo3.email}`);

  // ============================================================
  // NO DUMMY DATA — communities, clans, sub-clans, events, RSVPs,
  // memories, businesses, jobs, rishta profiles are intentionally
  // NOT seeded. Lists on the site must come from real user/admin
  // activity only; empty states are the expected initial state.
  // (Admin-created communities/clans/sub-clans go through the
  // admin panel CRUD + APIs, never through this seed.)
  // ============================================================

  // ---------- Site settings ----------
  const settingsData: Prisma.SiteSettingsUncheckedCreateInput[] = [
    { key: "site_name", value: "Digital Family Tree" },
    { key: "maintenance_mode", value: "false" },
    { key: "registration_open", value: "true" },
    { key: "max_upload_size_mb", value: "50" },
    { key: "default_storage_quota_gb", value: "5" },
    { key: "contact_email", value: "support@digitalkhandaan.pk" },
    { key: "support_phone", value: "+92 300 1234567" },
    { key: "about_us", value: "Digital Khandaan Pakistan ka pehla complete digital family platform hai." },
    { key: "terms_of_service", value: "شرائطِ استعمال یہاں لکھیں۔" },
    { key: "privacy_policy", value: "پرائیویسی پالیسی یہاں لکھیں۔" },
    { key: "welcome_email_template", value: "Assalam-o-Alaikum {{name}}, Digital Khandaan mein khush aamdeed!" },
    { key: "event_reminder_template", value: "Kal {{event}} hai!" },
    { key: "password_reset_template", value: "پاس ورڈ ری سیٹ کے لیے یہ لنک استعمال کریں: {{link}}" },
    { key: "report_notification_template", value: "آپ کی رپورٹ {{status}} ہوئی۔" },
  ];

  for (const s of settingsData) {
    await prisma.siteSettings.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log(`✅ ${settingsData.length} site settings created`);

  console.log("🎉 Seeding complete!");
  console.log("");
  console.log("========================================");
  console.log("  LOGIN CREDENTIALS (development)");
  console.log("========================================");
  console.log("  Admin:  admin@digitalkhandaan.pk / Admin@12345");
  console.log("  Demo:   demo@digitalkhandaan.pk  / Demo@12345");
  console.log("========================================");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
