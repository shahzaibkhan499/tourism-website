// ============================================================
// Digital Khandaan - Database Seed
// Creates: admin user, default communities, clans, sub-clans,
// and sample data for development
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
  // Users, communities, clans, sub-clans and site settings are upserted and preserved.
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

  // ---------- Communities ----------
  const communitiesData: Prisma.CommunityUncheckedCreateInput[] = [
    { name: "Punjabi", nameUrdu: "پنجابی", region: "Punjab", description: "Punjabi-speaking community of Pakistan" },
    { name: "Sindhi", nameUrdu: "سندھی", region: "Sindh", description: "Sindhi-speaking community of Pakistan" },
    { name: "Pashtun", nameUrdu: "پٹھان", region: "Khyber Pakhtunkhwa & Balochistan", description: "Pashtun community of Pakistan" },
    { name: "Baloch", nameUrdu: "بلوچ", region: "Balochistan", description: "Baloch community of Pakistan" },
    { name: "Kashmiri", nameUrdu: "کشمیری", region: "Azad Kashmir", description: "Kashmiri community of Pakistan" },
    { name: "Muhajir", nameUrdu: "مہاجر", region: "Sindh (Urban)", description: "Urdu-speaking Muhajir community" },
    { name: "Seraiki", nameUrdu: "سرائیکی", region: "South Punjab", description: "Seraiki-speaking community of Pakistan" },
    { name: "Hindko", nameUrdu: "ہندکو", region: "Khyber Pakhtunkhwa", description: "Hindko-speaking community of Pakistan" },
    { name: "Brahui", nameUrdu: "براہوی", region: "Balochistan", description: "Brahui-speaking community of Pakistan" },
    { name: "Other", nameUrdu: "دیگر", region: "Pakistan", description: "Other communities of Pakistan" },
  ];

  const communities: Record<string, string> = {};
  for (const c of communitiesData) {
    const community = await prisma.community.upsert({
      where: { name: c.name },
      update: {},
      create: c,
    });
    communities[c.name] = community.id;
  }
  console.log(`✅ ${communitiesData.length} communities created`);

  // ---------- Sample clans ----------
  const clansData: Prisma.ClanUncheckedCreateInput[] = [
    {
      name: "Arain",
      nameUrdu: "آرائیں",
      communityId: communities["Punjabi"],
      description: "Arain community - known for agriculture and entrepreneurship",
      history: "The Arain are an agricultural community found mainly in Punjab. Historically they were associated with farming and horticulture.",
    },
    {
      name: "Rajput",
      nameUrdu: "راجپوت",
      communityId: communities["Punjabi"],
      description: "Rajput community of Punjab",
      history: "Rajputs have a long and proud history in the subcontinent, known for their warrior traditions.",
    },
    {
      name: "Jat",
      nameUrdu: "جاٹ",
      communityId: communities["Punjabi"],
      description: "Jat community of Punjab",
      history: "The Jats are a large agricultural community of Punjab.",
    },
    {
      name: "Memon",
      nameUrdu: "میمن",
      communityId: communities["Muhajir"],
      description: "Memon community - known for business and trade",
      history: "The Memon community migrated to Karachi and are renowned traders and industrialists.",
    },
    {
      name: "Siddiqui",
      nameUrdu: "صدیقی",
      communityId: communities["Muhajir"],
      description: "Siddiqui community",
      history: "The Siddiqui community traces its lineage to Hazrat Abu Bakr Siddique (RA).",
    },
    {
      name: "Khattak",
      nameUrdu: "خٹک",
      communityId: communities["Pashtun"],
      description: "Khattak tribe of Khyber Pakhtunkhwa",
      history: "The Khattak tribe is known for the poetry of Khushal Khan Khattak.",
    },
    {
      name: "Yousafzai",
      nameUrdu: "یوسفزئی",
      communityId: communities["Pashtun"],
      description: "Yousafzai tribe of Khyber Pakhtunkhwa",
      history: "The Yousafzai are one of the largest Pashtun tribes.",
    },
    {
      name: "Soomro",
      nameUrdu: "سومرو",
      communityId: communities["Sindhi"],
      description: "Soomro community of Sindh",
      history: "The Soomro dynasty ruled Sindh in medieval times.",
    },
    {
      name: "Bhutto",
      nameUrdu: "بھٹو",
      communityId: communities["Sindhi"],
      description: "Bhutto community of Sindh",
      history: "A prominent Sindhi community known for political leadership.",
    },
    {
      name: "Mengal",
      nameUrdu: "مینگل",
      communityId: communities["Baloch"],
      description: "Mengal tribe of Balochistan",
      history: "The Mengal are a major Baloch tribe of Balochistan.",
    },
    {
      name: "Butt",
      nameUrdu: "بٹ",
      communityId: communities["Kashmiri"],
      description: "Butt community of Kashmir",
      history: "The Butt community is one of the most prominent Kashmiri communities.",
    },
  ];

  const clans: Record<string, string> = {};
  for (const c of clansData) {
    const clan = await prisma.clan.upsert({
      where: { id: `seed-${c.name.toLowerCase()}` },
      update: {},
      create: { ...c, id: `seed-${c.name.toLowerCase()}` },
    });
    clans[c.name] = clan.id;
  }
  console.log(`✅ ${clansData.length} clans created`);

  // ---------- Sample sub-clans ----------
  const subClansData: Prisma.SubClanUncheckedCreateInput[] = [
    { name: "Arain Lahore", nameUrdu: "آرائیں لاہور", clanId: clans["Arain"] },
    { name: "Arain Multan", nameUrdu: "آرائیں ملتان", clanId: clans["Arain"] },
    { name: "Rajput Rawalpindi", nameUrdu: "راجپوت راولپنڈی", clanId: clans["Rajput"] },
    { name: "Memon Karachi", nameUrdu: "میمن کراچی", clanId: clans["Memon"] },
    { name: "Memon Hyderabad", nameUrdu: "میمن حیدرآباد", clanId: clans["Memon"] },
    { name: "Khattak Karak", nameUrdu: "خٹک کرک", clanId: clans["Khattak"] },
    { name: "Yousafzai Swat", nameUrdu: "یوسفزئی سوات", clanId: clans["Yousafzai"] },
    { name: "Soomro Larkana", nameUrdu: "سومرو لاڑکانہ", clanId: clans["Soomro"] },
    { name: "Butt Muzaffarabad", nameUrdu: "بٹ مظفرآباد", clanId: clans["Butt"] },
  ];

  let subClanCount = 0;
  for (const s of subClansData) {
    await prisma.subClan.upsert({
      where: { id: `seed-${s.name.toLowerCase().replace(/\s+/g, "-")}` },
      update: {},
      create: { ...s, id: `seed-${s.name.toLowerCase().replace(/\s+/g, "-")}` },
    });
    subClanCount++;
  }
  console.log(`✅ ${subClanCount} sub-clans created`);

  // ---------- Assign demo users to clans ----------
  const arainLahoreId = `seed-${"Arain Lahore".toLowerCase().replace(/\s+/g, "-")}`;
  const memonKarachiId = `seed-${"Memon Karachi".toLowerCase().replace(/\s+/g, "-")}`;
  const khattakKarakId = `seed-${"Khattak Karak".toLowerCase().replace(/\s+/g, "-")}`;

  await prisma.user.update({
    where: { email: "demo@digitalkhandaan.pk" },
    data: { clanId: clans["Arain"], subClanId: arainLahoreId },
  });
  await prisma.user.update({
    where: { email: "fatima@digitalkhandaan.pk" },
    data: { clanId: clans["Memon"], subClanId: memonKarachiId },
  });
  await prisma.user.update({
    where: { email: "usman@digitalkhandaan.pk" },
    data: { clanId: clans["Khattak"], subClanId: khattakKarakId },
  });

  // ---------- Sample events ----------
  const eventsData: Prisma.EventUncheckedCreateInput[] = [
    {
      title: "خاندان کی عید ملن پارٹی",
      description: "پوری فیملی کی عید ملن پارٹی۔ سب لوگ ضرور آئیں! کھانا، مٹھائی اور ڈھیر ساری باتیں۔",
      type: "EID_MILAN",
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      location: "Arain House, Model Town, Lahore",
      hijriDate: "Shawwal 1447",
      isPublic: true,
      creatorId: demo.id,
    },
    {
      title: "Ahmed ki Shadi — Nikkah Ceremony",
      description: "اللہ کے فضل سے احمد کی شادی۔ نکاح کی رسم، دعا کی درخواست ہے۔",
      type: "NIKKAH",
      date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
      location: "Marquee Hall, Gulberg, Lahore",
      hijriDate: "Rabi al-Awwal 1448",
      isPublic: true,
      creatorId: demo.id,
    },
    {
      title: "فیملی پکنک — جالو پارک",
      description: "ماہانہ فیملی پکنک۔ بچوں کے لیے گیمز اور کرکٹ میچ کا انتظام ہوگا۔",
      type: "FAMILY_REUNION",
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      location: "Jallo Park, Lahore",
      isPublic: true,
      creatorId: demo2.id,
    },
    {
      title: "Quran Khawani — Abbu ki Barsi",
      description: "ابو کی برسی پر قرآن خوانی۔ عشاء کے بعد دعا ہوگی۔",
      type: "BARSI",
      date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
      location: "House # 12, DHA Phase 5, Karachi",
      isPublic: false,
      creatorId: demo2.id,
    },
    {
      title: "Usman ka Business Opening",
      description: "الحمدللہ، نیا بزنس شروع ہو رہا ہے۔ دعا کے لیے تشریف لائیں۔",
      type: "JOB_CELEBRATION",
      date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      location: "Blue Area, Islamabad",
      isPublic: true,
      creatorId: demo3.id,
    },
  ];

  for (const e of eventsData) {
    await prisma.event.create({ data: e });
  }
  console.log(`✅ ${eventsData.length} sample events created`);

  // ---------- Sample RSVPs ----------
  const events = await prisma.event.findMany({ take: 5 });
  for (const event of events) {
    await prisma.eventRSVP.upsert({
      where: { eventId_userId: { eventId: event.id, userId: demo.id } },
      update: {},
      create: { eventId: event.id, userId: demo.id, status: "GOING", guests: 3 },
    });
    if (event.creatorId !== demo2.id) {
      await prisma.eventRSVP.upsert({
        where: { eventId_userId: { eventId: event.id, userId: demo2.id } },
        update: {},
        create: { eventId: event.id, userId: demo2.id, status: "GOING", guests: 2 },
      });
    }
  }
  console.log("✅ Sample RSVPs created");

  // ---------- Sample memories (with real local photos under /public/uploads/seed) ----------
  type SeedMemory = {
    title: string;
    description: string;
    date: Date;
    location: string;
    category: Prisma.MemoryCreateInput["category"];
    isPublic: boolean;
    userId: string;
    media: Prisma.MediaCreateWithoutMemoryInput[];
  };

  const seedPhoto = (file: string, userId: string): Prisma.MediaCreateWithoutMemoryInput => {
    let size = 0;
    try {
      size = statSync(join(process.cwd(), "public", "uploads", "seed", file)).size;
    } catch {
      // file missing — size stays 0, photo simply won't render
    }
    return {
      url: `/uploads/seed/${file}`,
      publicId: null,
      type: "IMAGE",
      size,
      mimeType: "image/jpeg",
      user: { connect: { id: userId } },
    };
  };

  const memoriesData: SeedMemory[] = [
    {
      title: "بچپن کی عید",
      description: "1998 کی عید — سب کزنز ایک ساتھ۔ کیا دن تھے!",
      date: new Date("1998-01-30"),
      location: "Dada ka ghar, Lahore",
      category: "CHILDHOOD",
      isPublic: false,
      userId: demo.id,
      media: [seedPhoto("eid-1.jpg", demo.id), seedPhoto("eid-2.jpg", demo.id)],
    },
    {
      title: "Ammi Abbu ki Shadi ki 30th Anniversary",
      description: "30 saal ka safar. Family ne surprise party di.",
      date: new Date("2023-03-15"),
      location: "PC Hotel, Lahore",
      category: "WEDDING",
      isPublic: false,
      userId: demo.id,
      media: [seedPhoto("wedding-1.jpg", demo.id), seedPhoto("wedding-2.jpg", demo.id)],
    },
    {
      title: "Bhai ki Mehndi",
      description: "Dholki, mehndi ke design aur dhamaal — poori raat nachte rahe!",
      date: new Date("2019-11-22"),
      location: "Gulberg, Lahore",
      category: "FESTIVAL",
      isPublic: false,
      userId: demo.id,
      media: [seedPhoto("mehndi-1.jpg", demo.id), seedPhoto("mehndi-2.jpg", demo.id)],
    },
    {
      title: "فیملی پکنک — جالو پارک",
      description: "Cricket match, biryani aur dhoop. Perfect Sunday.",
      date: new Date("2022-02-06"),
      location: "Jallo Park, Lahore",
      category: "GATHERING",
      isPublic: true,
      userId: demo.id,
      media: [seedPhoto("picnic-1.jpg", demo.id)],
    },
    {
      title: "بچپن کی یادیں — purani photo",
      description: "Dada ki almari se mili 1985 ki purani tasveer.",
      date: new Date("1985-05-12"),
      location: "Lahore",
      category: "OLD_PHOTO",
      isPublic: true,
      userId: demo.id,
      media: [seedPhoto("childhood-1.jpg", demo.id)],
    },
    {
      title: "Swat ka Family Trip",
      description: "Malam Jabba ki baraf mein poora khandaan. Unforgettable trip!",
      date: new Date("2024-07-10"),
      location: "Swat Valley",
      category: "TRAVEL",
      isPublic: true,
      userId: demo2.id,
      media: [seedPhoto("trip-swat-1.jpg", demo2.id), seedPhoto("trip-swat-2.jpg", demo2.id)],
    },
  ];

  for (const m of memoriesData) {
    const { userId, ...data } = m;
    await prisma.memory.create({
      data: {
        ...data,
        media: data.media.length > 0 ? { create: data.media } : undefined,
        user: { connect: { id: userId } },
      },
    });
  }
  console.log(`✅ ${memoriesData.length} sample memories created (with photos)`);

  // ---------- Sample business ----------
  const business = await prisma.business.create({
    data: {
      name: "Khan Textiles",
      description: "Family-run textile business since 1985. Quality fabric, honest dealing.",
      industry: "Textile & Garments",
      category: "Clothing & Fabric",
      userId: demo3.id,
      city: "Islamabad",
      province: "Islamabad Capital Territory",
      isFamilyOwned: true,
      isVerified: true,
      isFeatured: true,
      website: "https://example.com",
      phone: "051-1234567",
      email: "info@khantextiles.pk",
      address: "Jinnah Super Market, F-7, Islamabad",
      socialLinks: [{ platform: "facebook", url: "https://facebook.com/khantextiles" }],
    },
  });
  console.log("✅ Sample business created");

  // ---------- Sample job postings ----------
  const jobsData: Prisma.JobPostingUncheckedCreateInput[] = [
    {
      title: "Sales Manager — Textile Division",
      description: "ہمیں اپنی ٹیکسٹائل ڈویژن کے لیے تجربہ کار سیلز مینیجر چاہیے۔ امیدوار کے پاس کم از کم 5 سال کا تجربہ ہونا چاہیے۔",
      requirements: "Minimum 5 saal sales experience, achi communication skills, market knowledge",
      type: "FULL_TIME",
      experience: "5+ years",
      salaryMin: 80000,
      salaryMax: 150000,
      currency: "PKR",
      location: "Islamabad",
      isRemote: false,
      businessId: business.id,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Accountant — Family Business",
      description: "Khan Textiles mein accountant ki asami. Family-owned business hai, honest aur mehnati candidate chahiye.",
      requirements: "B.Com/M.Com, 2 saal tajurba, MS Excel expertise",
      type: "FULL_TIME",
      experience: "2-3 years",
      salaryMin: 50000,
      salaryMax: 70000,
      currency: "PKR",
      location: "Islamabad",
      isRemote: false,
      businessId: business.id,
      deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const j of jobsData) {
    await prisma.jobPosting.create({ data: j });
  }
  console.log(`✅ ${jobsData.length} sample job postings created`);

  // ---------- Sample rishta profile ----------
  await prisma.rishtaProfile.create({
    data: {
      userId: demo2.id,
      age: 28,
      height: "5'4\"",
      weight: "55 kg",
      complexion: "Wheatish",
      education: "Master's",
      educationDetail: "M.A. English Literature, University of Karachi",
      profession: "Teacher",
      income: "PKR 80,000 - 100,000",
      sect: "Sunni",
      maslak: "Hanafi",
      castePreference: "Memon preferred",
      cityPreference: "Karachi",
      countryPreference: "Pakistan",
      maritalStatus: "NEVER_MARRIED",
      children: 0,
      about: "Alhamdulillah, aik simple aur parhezgar larki. Parhai aur teaching se mohabbat hai. Family ke saath rehti hoon.",
      familyBackground: "Deendar aur taleem yafta khandaan. Abbu retired government officer, Ammi housewife. 2 bhai, 1 behan.",
      expectations: "Deendar, taleem yafta aur zimmedar larka. Family values important hain.",
      photos: [],
      isActive: true,
      isVerified: true,
    },
  });
  console.log("✅ Sample rishta profile created");

  // ---------- Sample job profile ----------
  await prisma.jobProfile.create({
    data: {
      userId: demo.id,
      headline: "Senior Software Engineer — 8+ years experience",
      summary: "Full-stack engineer with 8+ years building web platforms. React, Node.js, PostgreSQL expert.",
      experience: [
        { company: "TechCorp Pakistan", role: "Senior Software Engineer", startDate: "2020-01", endDate: "Present", description: "Leading a team of 6 engineers building fintech products." },
        { company: "WebSolutions", role: "Software Engineer", startDate: "2016-06", endDate: "2019-12", description: "Built e-commerce platforms for 20+ clients." },
      ],
      education: [
        { institution: "LUMS", degree: "BS Computer Science", year: "2016", field: "Computer Science" },
      ],
      skills: ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS", "Next.js"],
      languages: ["English", "Urdu", "Punjabi"],
      linkedinUrl: "https://linkedin.com/in/ahmedkhan",
      githubUrl: "https://github.com/ahmedkhan",
      expectedSalary: "PKR 300,000+",
      preferredLocations: ["Lahore", "Remote"],
      availability: "ACTIVE",
    },
  });
  console.log("✅ Sample job profile created");

  // ---------- Sample notifications ----------
  const notificationsData: Prisma.NotificationUncheckedCreateInput[] = [
    { userId: demo.id, type: "system", title: "خوش آمدید! 🌳", message: "Digital Khandaan par account banane ka shukriya. Apna profile complete karein.", link: "/profile" },
    { userId: demo.id, type: "event_reminder", title: "فیملی پکنک آنے والی ہے", message: "فیملی پکنک — جالو پارک 7 دن بعد ہے۔ RSVP کریں!", link: "/events" },
    { userId: demo2.id, type: "clan_update", title: "Memon community update", message: "Memon community mein 3 naye members shamil hue.", link: "/community" },
  ];

  for (const n of notificationsData) {
    await prisma.notification.create({ data: n });
  }
  console.log(`✅ ${notificationsData.length} sample notifications created`);

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
    { key: "password_reset_template", value: "Password reset ke liye yeh link use karein: {{link}}" },
    { key: "report_notification_template", value: "Aapki report {{status}} hui." },
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
