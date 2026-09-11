// ============================================================
// Digital Family Tree - Constants
// All shared constants, labels, and configuration
// ============================================================

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Digital Family Tree";
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:4001";
export const APP_DESCRIPTION =
  process.env.NEXT_PUBLIC_APP_DESCRIPTION || "A modern digital family tree platform foundation";

export const PAKISTANI_CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Hyderabad",
  "Peshawar",
  "Quetta",
  "Sialkot",
  "Gujranwala",
  "Sargodha",
  "Bahawalpur",
  "Sukkur",
  "Larkana",
  "Sheikhupura",
  "Jhang",
  "Gujrat",
  "Mardan",
  "Kasur",
  "Rahim Yar Khan",
  "Sahiwal",
  "Okara",
  "Wah Cantt",
  "Dera Ghazi Khan",
  "Mingora",
  "Mirpur Khas",
  "Chiniot",
  "Nawabshah",
  "Abbottabad",
] as const;

export const PAKISTANI_PROVINCES = [
  "Punjab",
  "Sindh",
  "Khyber Pakhtunkhwa",
  "Balochistan",
  "Gilgit-Baltistan",
  "Azad Kashmir",
  "Islamabad Capital Territory",
] as const;

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export const EDUCATION_LEVELS = [
  "Matric",
  "Intermediate",
  "Bachelor's",
  "Master's",
  "PhD",
  "Islamic Education",
  "Other",
] as const;

export const SECTS = [
  "Sunni",
  "Shia",
  "Ahl-e-Hadith",
  "Deobandi",
  "Barelvi",
  "Ismaili",
  "Other",
] as const;

export const MARITAL_STATUSES = [
  { value: "NEVER_MARRIED", label: "Never Married", labelUrdu: "غیر شادی شدہ" },
  { value: "DIVORCED", label: "Divorced", labelUrdu: "طلاق یافتہ" },
  { value: "WIDOWED", label: "Widowed", labelUrdu: "بیوہ / بیوے" },
] as const;

export const COMPLEXIONS = [
  "Fair",
  "Wheatish",
  "Medium",
  "Brown",
  "Dark",
] as const;

export const INDUSTRIES = [
  "Technology",
  "Food & Restaurants",
  "Textile & Garments",
  "Construction",
  "Education",
  "Healthcare",
  "Retail",
  "Agriculture",
  "Manufacturing",
  "Services",
  "Real Estate",
  "Transport & Logistics",
  "Finance",
  "Other",
] as const;

export const JOB_TYPES = [
  { value: "FULL_TIME", label: "Full Time", labelUrdu: "فل ٹائم" },
  { value: "PART_TIME", label: "Part Time", labelUrdu: "پارٹ ٹائم" },
  { value: "CONTRACT", label: "Contract", labelUrdu: "کانٹریکٹ" },
  { value: "FREELANCE", label: "Freelance", labelUrdu: "فری لانس" },
  { value: "INTERNSHIP", label: "Internship", labelUrdu: "انٹرن شپ" },
  { value: "REMOTE", label: "Remote", labelUrdu: "ریموٹ" },
] as const;

export const APPLICATION_STATUSES = [
  { value: "APPLIED", label: "Applied", labelUrdu: "درخواست بھیجی گئی" },
  { value: "VIEWED", label: "Viewed", labelUrdu: "دیکھی گئی" },
  { value: "SHORTLISTED", label: "Shortlisted", labelUrdu: "شارٹ لسٹڈ" },
  { value: "INTERVIEW", label: "Interview", labelUrdu: "انٹرویو" },
  { value: "OFFER", label: "Offer", labelUrdu: "آفر" },
  { value: "HIRED", label: "Hired", labelUrdu: "منتخب" },
  { value: "REJECTED", label: "Rejected", labelUrdu: "مسترد" },
] as const;

export const EVENT_TYPES = [
  // Life events
  { value: "BIRTH", label: "Birth", labelUrdu: "پیدائش", emoji: "👶", group: "Life Events", groupUrdu: "زندگی کے مواقع" },
  { value: "AQEEQA", label: "Aqeeqa", labelUrdu: "عقیقہ", emoji: "🐑", group: "Life Events", groupUrdu: "زندگی کے مواقع" },
  { value: "BISMILLAH", label: "Bismillah", labelUrdu: "بسم اللہ", emoji: "📖", group: "Life Events", groupUrdu: "زندگی کے مواقع" },
  { value: "KHATAM_QURAN", label: "Khatam-e-Quran", labelUrdu: "ختم قرآن", emoji: "🕌", group: "Life Events", groupUrdu: "زندگی کے مواقع" },
  { value: "ENGAGEMENT", label: "Engagement", labelUrdu: "منگنی", emoji: "💍", group: "Life Events", groupUrdu: "زندگی کے مواقع" },
  { value: "MEHNDI", label: "Mehndi", labelUrdu: "مہندی", emoji: "🌿", group: "Life Events", groupUrdu: "زندگی کے مواقع" },
  { value: "NIKKAH", label: "Nikkah", labelUrdu: "نکاح", emoji: "🤝", group: "Life Events", groupUrdu: "زندگی کے مواقع" },
  { value: "BARAAT", label: "Baraat", labelUrdu: "بارات", emoji: "🎺", group: "Life Events", groupUrdu: "زندگی کے مواقع" },
  { value: "WALIMA", label: "Walima", labelUrdu: "ولیمہ", emoji: "🍽️", group: "Life Events", groupUrdu: "زندگی کے مواقع" },
  { value: "RUKHSATI", label: "Rukhsati", labelUrdu: "رخصتی", emoji: "🚗", group: "Life Events", groupUrdu: "زندگی کے مواقع" },
  { value: "DEATH", label: "Death", labelUrdu: "وفات", emoji: "🕊️", group: "Life Events", groupUrdu: "زندگی کے مواقع" },
  { value: "CHEHLUM", label: "Chehlum", labelUrdu: "چہلم", emoji: "🤲", group: "Life Events", groupUrdu: "زندگی کے مواقع" },
  { value: "BARSI", label: "Barsi", labelUrdu: "برسی", emoji: "🕯️", group: "Life Events", groupUrdu: "زندگی کے مواقع" },
  // Religious events
  { value: "EID_UL_FITR", label: "Eid ul Fitr", labelUrdu: "عید الفطر", emoji: "🌙", group: "Religious Events", groupUrdu: "مذہبی مواقع" },
  { value: "EID_UL_ADHA", label: "Eid ul Adha", labelUrdu: "عید الاضحی", emoji: "🐐", group: "Religious Events", groupUrdu: "مذہبی مواقع" },
  { value: "SHAB_E_QADR", label: "Shab-e-Qadr", labelUrdu: "شب قدر", emoji: "✨", group: "Religious Events", groupUrdu: "مذہبی مواقع" },
  { value: "SHAB_E_MERAJ", label: "Shab-e-Meraj", labelUrdu: "شب معراج", emoji: "🌟", group: "Religious Events", groupUrdu: "مذہبی مواقع" },
  { value: "MILAD_UN_NABI", label: "Milad un Nabi", labelUrdu: "میلاد النبی", emoji: "💚", group: "Religious Events", groupUrdu: "مذہبی مواقع" },
  { value: "RAMADAN_IFTAR", label: "Ramadan Iftar", labelUrdu: "رمضان افطار", emoji: "🌆", group: "Religious Events", groupUrdu: "مذہبی مواقع" },
  // National events
  { value: "INDEPENDENCE_DAY", label: "Independence Day", labelUrdu: "یوم آزادی", emoji: "🇵🇰", group: "National Events", groupUrdu: "قومی مواقع" },
  { value: "PAKISTAN_DAY", label: "Pakistan Day", labelUrdu: "یوم پاکستان", emoji: "🏛️", group: "National Events", groupUrdu: "قومی مواقع" },
  { value: "QUAID_E_AZAM_DAY", label: "Quaid-e-Azam Day", labelUrdu: "یوم قائد اعظم", emoji: "🎖️", group: "National Events", groupUrdu: "قومی مواقع" },
  { value: "IQBAL_DAY", label: "Iqbal Day", labelUrdu: "یوم اقبال", emoji: "✍️", group: "National Events", groupUrdu: "قومی مواقع" },
  // Family events
  { value: "FAMILY_REUNION", label: "Family Reunion", labelUrdu: "خاندانی اجتماع", emoji: "👨‍👩‍👧‍👦", group: "Family Events", groupUrdu: "خاندانی مواقع" },
  { value: "GRADUATION", label: "Graduation", labelUrdu: "گریجویشن", emoji: "🎓", group: "Family Events", groupUrdu: "خاندانی مواقع" },
  { value: "JOB_CELEBRATION", label: "Job Celebration", labelUrdu: "نوکری کی خوشی", emoji: "🎉", group: "Family Events", groupUrdu: "خاندانی مواقع" },
  { value: "WELCOME_HOME", label: "Welcome Home", labelUrdu: "خوش آمدید", emoji: "🏡", group: "Family Events", groupUrdu: "خاندانی مواقع" },
  { value: "PANCHAYAT", label: "Panchayat", labelUrdu: "پنچایت", emoji: "🪑", group: "Family Events", groupUrdu: "خاندانی مواقع" },
  // Cultural events
  { value: "BASANT", label: "Basant", labelUrdu: "بسنت", emoji: "🪁", group: "Cultural Events", groupUrdu: "ثقافتی مواقع" },
  { value: "CHAND_RAAT", label: "Chand Raat", labelUrdu: "چاند رات", emoji: "🌙", group: "Cultural Events", groupUrdu: "ثقافتی مواقع" },
  { value: "EID_MILAN", label: "Eid Milan", labelUrdu: "عید ملن", emoji: "🤗", group: "Cultural Events", groupUrdu: "ثقافتی مواقع" },
  { value: "OTHER", label: "Other", labelUrdu: "دیگر", emoji: "📌", group: "Other", groupUrdu: "دیگر" },
] as const;

export const MEMORY_CATEGORIES = [
  { value: "CHILDHOOD", label: "Childhood", labelUrdu: "بچپن", emoji: "🧸" },
  { value: "WEDDING", label: "Wedding", labelUrdu: "شادی", emoji: "💒" },
  { value: "GATHERING", label: "Gathering", labelUrdu: "اجتماع", emoji: "👥" },
  { value: "TRAVEL", label: "Travel", labelUrdu: "سفر", emoji: "✈️" },
  { value: "ACHIEVEMENT", label: "Achievement", labelUrdu: "کامیابی", emoji: "🏆" },
  { value: "OLD_PHOTO", label: "Old Photo", labelUrdu: "پرانی تصویر", emoji: "📸" },
  { value: "RELIGIOUS", label: "Religious", labelUrdu: "مذہبی", emoji: "🕌" },
  { value: "FESTIVAL", label: "Festival", labelUrdu: "تہوار", emoji: "🎆" },
  { value: "DAILY_LIFE", label: "Daily Life", labelUrdu: "روزمرہ زندگی", emoji: "🏠" },
  { value: "OTHER", label: "Other", labelUrdu: "دیگر", emoji: "📌" },
] as const;

export const DEFAULT_COMMUNITIES = [
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
] as const;

export const NOTIFICATION_TYPES = {
  event_reminder: { label: "Event Reminder", labelUrdu: "ایونٹ یاد دہانی", icon: "Calendar" },
  rishta_request: { label: "Rishta Request", labelUrdu: "رشتہ کی درخواست", icon: "Heart" },
  rishta_accepted: { label: "Rishta Accepted", labelUrdu: "رشتہ قبول ہوا", icon: "HeartHandshake" },
  job_application: { label: "Job Application", labelUrdu: "نوکری کی درخواست", icon: "Briefcase" },
  clan_update: { label: "Clan Update", labelUrdu: "برادری کی خبر", icon: "Users" },
  memory_tag: { label: "Memory Tag", labelUrdu: "یاد میں ٹیگ", icon: "BookOpen" },
  system: { label: "System", labelUrdu: "سسٹم", icon: "Bell" },
} as const;

export const KIDS_LEVELS = [
  { name: "Seedling", nameUrdu: "پودا", min: 0, max: 100, emoji: "🌱" },
  { name: "Sapling", nameUrdu: "چھوٹا پودا", min: 100, max: 500, emoji: "🌿" },
  { name: "Tree", nameUrdu: "درخت", min: 500, max: 1000, emoji: "🌳" },
  { name: "Forest", nameUrdu: "جنگل", min: 1000, max: Infinity, emoji: "🌲" },
] as const;

export const KIDS_BADGES = [
  { id: "tree_builder", name: "Tree Builder", nameUrdu: "شجرہ بنانے والا", emoji: "🌳", requirement: 10, metric: "members", description: "Add 10 family members" },
  { id: "story_keeper", name: "Story Keeper", nameUrdu: "کہانیاں محفوظ کرنے والا", emoji: "📚", requirement: 5, metric: "memories", description: "Record 5 memories" },
  { id: "event_planner", name: "Event Planner", nameUrdu: "تقریب منظم کرنے والا", emoji: "🎪", requirement: 3, metric: "events", description: "Create 3 events" },
  { id: "quiz_master", name: "Quiz Master", nameUrdu: "کوئز ماسٹر", emoji: "🏅", requirement: 100, metric: "quizScore", description: "Score 100 in the quiz" },
  { id: "family_connector", name: "Family Connector", nameUrdu: "خاندان کو جوڑنے والا", emoji: "🔗", requirement: 5, metric: "invites", description: "Invite 5 members" },
] as const;

export const REPORT_TYPES = [
  "Inappropriate Content",
  "Fake Profile",
  "Harassment",
  "Spam",
  "Impersonation",
  "Other",
] as const;

export const PRAYER_TIMES = [
  { name: "Fajr", nameUrdu: "فجر", emoji: "🌅" },
  { name: "Dhuhr", nameUrdu: "ظہر", emoji: "☀️" },
  { name: "Asr", nameUrdu: "عصر", emoji: "🌤️" },
  { name: "Maghrib", nameUrdu: "مغرب", emoji: "🌇" },
  { name: "Isha", nameUrdu: "عشاء", emoji: "🌃" },
] as const;

export const QURAN_SURAHS = [
  { id: 1, name: "Al-Fatiha", nameUrdu: "الفاتحہ", verses: 7 },
  { id: 36, name: "Ya-Sin", nameUrdu: "یٰسین", verses: 83 },
  { id: 55, name: "Ar-Rahman", nameUrdu: "الرحمٰن", verses: 78 },
  { id: 56, name: "Al-Waqi'ah", nameUrdu: "الواقعہ", verses: 96 },
  { id: 67, name: "Al-Mulk", nameUrdu: "الملک", verses: 30 },
  { id: 112, name: "Al-Ikhlas", nameUrdu: "الاخلاص", verses: 4 },
  { id: 113, name: "Al-Falaq", nameUrdu: "الفلق", verses: 5 },
  { id: 114, name: "An-Nas", nameUrdu: "الناس", verses: 6 },
] as const;

export const MAX_UPLOAD_SIZES = {
  image: 5 * 1024 * 1024, // 5MB
  video: 50 * 1024 * 1024, // 50MB
  audio: 20 * 1024 * 1024, // 20MB
  document: 10 * 1024 * 1024, // 10MB
} as const;

export const ALLOWED_MIME_TYPES: {
  image: string[];
  video: string[];
  audio: string[];
  document: string[];
} = {
  image: ["image/jpeg", "image/png", "image/webp", "image/gif"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4"],
  document: ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
};

export function getEventTypeInfo(type: string) {
  return (
    EVENT_TYPES.find((t) => t.value === type) ?? {
      value: "OTHER",
      label: "Other",
      labelUrdu: "دیگر",
      emoji: "📌",
      group: "Other",
      groupUrdu: "دیگر",
    }
  );
}

export function getMemoryCategoryInfo(category: string) {
  return (
    MEMORY_CATEGORIES.find((c) => c.value === category) ?? {
      value: "OTHER",
      label: "Other",
      labelUrdu: "دیگر",
      emoji: "📌",
    }
  );
}
