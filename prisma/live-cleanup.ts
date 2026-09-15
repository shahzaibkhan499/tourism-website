// ============================================================
// LIVE DATABASE CLEANUP (BUG 2) — run against the production Neon DB:
//   DATABASE_URL=<neon-url> npx tsx prisma/live-cleanup.ts
// Deletes ALL seeded dummy data: events, RSVPs, communities, clans,
// sub-clans, group photos + tags, memories, businesses, rishta, jobs.
// KEEPS: users, family trees, members, marriages, relationships,
// site settings, audit logs.
// ============================================================
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const del = async (name: string, fn: () => Promise<{ count: number }>) => {
    const r = await fn();
    console.log(`🧹 ${name}: ${r.count} deleted`);
  };
  await del("eventRSVP", () => prisma.eventRSVP.deleteMany());
  await del("event", () => prisma.event.deleteMany());
  await del("notification", () => prisma.notification.deleteMany());
  await del("jobApplication", () => prisma.jobApplication.deleteMany());
  await del("jobPosting", () => prisma.jobPosting.deleteMany());
  await del("businessReview", () => prisma.businessReview.deleteMany());
  await del("business", () => prisma.business.deleteMany());
  await del("rishtaRequest", () => prisma.rishtaRequest.deleteMany());
  await del("rishtaProfile", () => prisma.rishtaProfile.deleteMany());
  await del("jobProfile", () => prisma.jobProfile.deleteMany());
  await del("occupationProfile", () => prisma.occupationProfile.deleteMany());
  await del("groupPhotoTag", () => prisma.groupPhotoTag.deleteMany());
  await del("groupPhoto", () => prisma.groupPhoto.deleteMany());
  await del("subClan", () => prisma.subClan.deleteMany());
  await del("clan", () => prisma.clan.deleteMany());
  await del("community", () => prisma.community.deleteMany());
  await del("memory", () => prisma.memory.deleteMany());
  await del("media", () => prisma.media.deleteMany());
  const [users, trees, members] = await Promise.all([
    prisma.user.count(), prisma.familyTree.count(), prisma.familyMember.count(),
  ]);
  console.log(`✅ KEPT: ${users} users | ${trees} trees | ${members} members`);
  await prisma.$disconnect();
}
main().catch(async (e) => { console.error("❌", e); await prisma.$disconnect(); process.exit(1); });
