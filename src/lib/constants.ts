// ============================================================
// Digital Family Tree - Constants
// All shared constants, labels, and configuration
// ============================================================

export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Digital Family Tree";
import { getSiteUrl } from "@/lib/site-url";
export const APP_URL = getSiteUrl();
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
  { value: "SINGLE", label: "Single", labelUrdu: "سنگل" },
  { value: "MARRIED", label: "Married", labelUrdu: "شادی شدہ" },
  { value: "DIVORCED", label: "Divorced", labelUrdu: "طلاق یافتہ" },
  { value: "KHULLA", label: "Khulla", labelUrdu: "خُلّہ" },
  { value: "WIDOWED", label: "Widow", labelUrdu: "بیوہ / بیوے" },
] as const;

/* ---------- Rishta form option lists (click-friendly) ---------- */

export const RISHTA_HEIGHTS = [
  "4'10\"",
  "4'11\"",
  "5'0\"",
  "5'1\"",
  "5'2\"",
  "5'3\"",
  "5'4\"",
  "5'5\"",
  "5'6\"",
  "5'7\"",
  "5'8\"",
  "5'9\"",
  "5'10\"",
  "5'11\"",
  "6'0\"",
  "6'1\"",
  "6'2\"",
  "6'3\"",
  "6'4\"",
  "6'5\"",
  "6'6\"",
] as const;

export const BUILDS = ["Slim", "Medium", "Healthy"] as const;

export const INCOME_RANGES = [
  "Under 50k",
  "50k-100k",
  "100k-200k",
  "200k-300k",
  "300k-500k",
  "500k-1M",
  "1M+",
] as const;

export const MOTHER_TONGUES = [
  "Urdu",
  "Punjabi",
  "Sindhi",
  "Pashto",
  "Balochi",
  "Seraiki",
  "Hindko",
  "Other",
] as const;

export const RISHTA_QUALIFICATIONS = [
  "Matric",
  "Inter",
  "Bachelors",
  "Masters",
  "PhD",
  "Islamic",
] as const;

export const RISHTA_LANGUAGES = [
  "Urdu",
  "English",
  "Punjabi",
  "Sindhi",
  "Pashto",
  "Balochi",
  "Seraiki",
  "Arabic",
  "Hindi",
] as const;

export const CASTES = [
  "Khawaja",
  "Shaikh",
  "Bhatti",
  "Memon",
  "Lashari",
  "Jatoi",
  "Arain",
  "Gujjar",
  "Rajput",
  "Chaudhry",
  "Qureshi",
  "Pathan",
  "Baloch",
  "Domki",
  "Mughal",
  "Larkana",
  "Other",
] as const;

export const SUB_CASTES = [
  "Vohra",
  "Sehgal",
  "Mehta",
  "Roar",
  "Khosa",
  "Ghangro",
  "Jaffri",
  "Shah",
  "Sana",
  "Naqvi",
  "Qureshi",
  "Siddiqui",
  "Other",
] as const;

export const HOME_SIZES = [
  "5 Marla",
  "7 Marla",
  "10 Marla",
  "1 Kanal",
  "2 Kanal",
  "5 Kanal",
  "100 Sq. Yards",
  "150 Sq. Yards",
  "200 Sq. Yards",
  "Bungalow",
  "Other",
] as const;

export const CONTACT_RELATIONS = [
  { value: "SELF", label: "Self", labelUrdu: "خود" },
  { value: "FATHER", label: "Father", labelUrdu: "والد" },
  { value: "MOTHER", label: "Mother", labelUrdu: "والدہ" },
  { value: "BROTHER", label: "Brother", labelUrdu: "بھائی" },
  { value: "SISTER", label: "Sister", labelUrdu: "بہن" },
  { value: "UNCLE", label: "Uncle", labelUrdu: "ممہ / چچا" },
  { value: "AUNT", label: "Aunt", labelUrdu: "مامی / چچی" },
  { value: "COUSIN", label: "Cousin", labelUrdu: "بھانجہ / پوتی" },
  { value: "GUARDIAN", label: "Guardian", labelUrdu: "سرپرست" },
  { value: "OTHER", label: "Other", labelUrdu: "دیگر" },
] as const;

export const PARTNER_STATUSES = [
  { value: "SINGLE", label: "Single", labelUrdu: "سنگل" },
  { value: "DIVORCED", label: "Divorced", labelUrdu: "طلاق یافتہ" },
  { value: "KHULLA", label: "Khulla", labelUrdu: "خُلّہ" },
  { value: "WIDOWED", label: "Widow", labelUrdu: "بیوہ / بیوے" },
] as const;

export const SHARIA_PERDA_OPTIONS = [
  { value: "YES", label: "Yes", labelUrdu: "جی ہاں" },
  { value: "NO", label: "No", labelUrdu: "نہیں" },
  { value: "ANY", label: "Doesn't Matter", labelUrdu: "فروق نہیں پڑتا" },
] as const;

export const PARTNER_SECT_OPTIONS = [
  { value: "SUNNI", label: "Sunni", labelUrdu: "سنی" },
  { value: "SHIA", label: "Shia", labelUrdu: "شیعہ" },
  { value: "ANY", label: "Any", labelUrdu: "کوئی بھی" },
] as const;

/** The exact Halaf Nama (oath) text — must be shown verbatim with a required checkbox. */
export const HALAF_NAMA_TEXT = `I HOLD WITNESS TO ALMIGHTY ALLAH THAT ABOVE INFORMATION IS CORRECT TO THE BEST OF MY KNOWLEDGE.....
حلف نامہ۔
میں اللّہ تعالیٰﷻ کو گواہ بنا کر اس بات کا اقرار کرتا/کرتی ہوں ہمارے پیارے نبی حضرت محمد صلی اللّہ علیہ وسلم اللّہ پاک کے آخری نبیﷺ ہیں اور ان کے بعد نبوت کاسلسلہ ہمیشہ کے لیے ختم ہو چکا ہے وہ خاتم النبیینﷺ ہیں اور میں حلف دیتا/دیتی ہوں میں فراڈ نہیں ہوں اور پوری ایمانداری سے یہ فارم فل کر کے آپ کو بھیجا ہے. ان شاءاللہ تعالیٰ`;

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
  rishta_request: { label: "رشتہ کی درخواست", labelUrdu: "رشتہ کی درخواست", icon: "Heart" },
  rishta_accepted: { label: "رشتہ منظور", labelUrdu: "رشتہ قبول ہوا", icon: "HeartHandshake" },
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
  { id: 2, name: "Al-Baqarah", nameUrdu: "البقرہ", verses: 286 },
  { id: 3, name: "Aal-E-Imran", nameUrdu: "آل عمران", verses: 200 },
  { id: 4, name: "An-Nisa", nameUrdu: "النساء", verses: 176 },
  { id: 5, name: "Al-Ma'idah", nameUrdu: "المائدہ", verses: 120 },
  { id: 6, name: "Al-An'am", nameUrdu: "الانعام", verses: 165 },
  { id: 7, name: "Al-A'raf", nameUrdu: "الاعراف", verses: 206 },
  { id: 8, name: "Al-Anfal", nameUrdu: "الانفال", verses: 75 },
  { id: 9, name: "At-Tawbah", nameUrdu: "التوبہ", verses: 129 },
  { id: 10, name: "Yunus", nameUrdu: "یونس", verses: 109 },
  { id: 11, name: "Hud", nameUrdu: "ہود", verses: 123 },
  { id: 12, name: "Yusuf", nameUrdu: "یوسف", verses: 111 },
  { id: 13, name: "Ar-Ra'd", nameUrdu: "الرعد", verses: 43 },
  { id: 14, name: "Ibrahim", nameUrdu: "ابراہیم", verses: 52 },
  { id: 15, name: "Al-Hijr", nameUrdu: "الحجر", verses: 99 },
  { id: 16, name: "An-Nahl", nameUrdu: "النحل", verses: 128 },
  { id: 17, name: "Al-Isra", nameUrdu: "الاسراء", verses: 111 },
  { id: 18, name: "Al-Kahf", nameUrdu: "الکہف", verses: 110 },
  { id: 19, name: "Maryam", nameUrdu: "مریم", verses: 98 },
  { id: 20, name: "Ta-Ha", nameUrdu: "طٰہٰ", verses: 135 },
  { id: 21, name: "Al-Anbiya", nameUrdu: "الانبیاء", verses: 112 },
  { id: 22, name: "Al-Hajj", nameUrdu: "الحج", verses: 78 },
  { id: 23, name: "Al-Mu'minun", nameUrdu: "المؤمنون", verses: 118 },
  { id: 24, name: "An-Nur", nameUrdu: "النور", verses: 64 },
  { id: 25, name: "Al-Furqan", nameUrdu: "الفرقان", verses: 77 },
  { id: 26, name: "Ash-Shu'ara", nameUrdu: "الشعراء", verses: 227 },
  { id: 27, name: "An-Naml", nameUrdu: "النمل", verses: 93 },
  { id: 28, name: "Al-Qasas", nameUrdu: "القصص", verses: 88 },
  { id: 29, name: "Al-Ankabut", nameUrdu: "العنکبوت", verses: 69 },
  { id: 30, name: "Ar-Rum", nameUrdu: "الروم", verses: 60 },
  { id: 31, name: "Luqman", nameUrdu: "لقمان", verses: 34 },
  { id: 32, name: "As-Sajdah", nameUrdu: "السجدہ", verses: 30 },
  { id: 33, name: "Al-Ahzab", nameUrdu: "الاحزاب", verses: 73 },
  { id: 34, name: "Saba", nameUrdu: "سبأ", verses: 54 },
  { id: 35, name: "Fatir", nameUrdu: "فاطر", verses: 45 },
  { id: 36, name: "Ya-Sin", nameUrdu: "یٰسین", verses: 83 },
  { id: 37, name: "As-Saffat", nameUrdu: "الصافات", verses: 182 },
  { id: 38, name: "Sad", nameUrdu: "ص", verses: 88 },
  { id: 39, name: "Az-Zumar", nameUrdu: "الزمر", verses: 75 },
  { id: 40, name: "Ghafir", nameUrdu: "غافر", verses: 85 },
  { id: 41, name: "Fussilat", nameUrdu: "فصلت", verses: 54 },
  { id: 42, name: "Ash-Shura", nameUrdu: "الشوریٰ", verses: 53 },
  { id: 43, name: "Az-Zukhruf", nameUrdu: "الزخرف", verses: 89 },
  { id: 44, name: "Ad-Dukhan", nameUrdu: "الدخان", verses: 59 },
  { id: 45, name: "Al-Jathiyah", nameUrdu: "الجاثیہ", verses: 37 },
  { id: 46, name: "Al-Ahqaf", nameUrdu: "الاحقاف", verses: 35 },
  { id: 47, name: "Muhammad", nameUrdu: "محمد", verses: 38 },
  { id: 48, name: "Al-Fath", nameUrdu: "الفتح", verses: 29 },
  { id: 49, name: "Al-Hujurat", nameUrdu: "الحجرات", verses: 18 },
  { id: 50, name: "Qaf", nameUrdu: "ق", verses: 45 },
  { id: 51, name: "Adh-Dhariyat", nameUrdu: "الذاریات", verses: 60 },
  { id: 52, name: "At-Tur", nameUrdu: "الطور", verses: 49 },
  { id: 53, name: "An-Najm", nameUrdu: "النجم", verses: 62 },
  { id: 54, name: "Al-Qamar", nameUrdu: "القمر", verses: 55 },
  { id: 55, name: "Ar-Rahman", nameUrdu: "الرحمٰن", verses: 78 },
  { id: 56, name: "Al-Waqi'ah", nameUrdu: "الواقعہ", verses: 96 },
  { id: 57, name: "Al-Hadid", nameUrdu: "الحدید", verses: 29 },
  { id: 58, name: "Al-Mujadila", nameUrdu: "المجادلہ", verses: 22 },
  { id: 59, name: "Al-Hashr", nameUrdu: "الحشر", verses: 24 },
  { id: 60, name: "Al-Mumtahanah", nameUrdu: "الممتحنہ", verses: 13 },
  { id: 61, name: "As-Saff", nameUrdu: "الصف", verses: 14 },
  { id: 62, name: "Al-Jumu'ah", nameUrdu: "الجمعہ", verses: 11 },
  { id: 63, name: "Al-Munafiqun", nameUrdu: "المنافقون", verses: 11 },
  { id: 64, name: "At-Taghabun", nameUrdu: "التغابن", verses: 18 },
  { id: 65, name: "At-Talaq", nameUrdu: "الطلاق", verses: 12 },
  { id: 66, name: "At-Tahrim", nameUrdu: "التحریم", verses: 12 },
  { id: 67, name: "Al-Mulk", nameUrdu: "الملک", verses: 30 },
  { id: 68, name: "Al-Qalam", nameUrdu: "القلم", verses: 52 },
  { id: 69, name: "Al-Haqqah", nameUrdu: "الحاقہ", verses: 52 },
  { id: 70, name: "Al-Ma'arij", nameUrdu: "المعارج", verses: 44 },
  { id: 71, name: "Nuh", nameUrdu: "نوح", verses: 28 },
  { id: 72, name: "Al-Jinn", nameUrdu: "الجن", verses: 28 },
  { id: 73, name: "Al-Muzzammil", nameUrdu: "المزمل", verses: 20 },
  { id: 74, name: "Al-Muddaththir", nameUrdu: "المدثر", verses: 56 },
  { id: 75, name: "Al-Qiyamah", nameUrdu: "القیامہ", verses: 40 },
  { id: 76, name: "Al-Insan", nameUrdu: "الانسان", verses: 31 },
  { id: 77, name: "Al-Mursalat", nameUrdu: "المرسلات", verses: 50 },
  { id: 78, name: "An-Naba", nameUrdu: "النبأ", verses: 40 },
  { id: 79, name: "An-Nazi'at", nameUrdu: "النازعات", verses: 46 },
  { id: 80, name: "Abasa", nameUrdu: "عبس", verses: 42 },
  { id: 81, name: "At-Takwir", nameUrdu: "التکویر", verses: 29 },
  { id: 82, name: "Al-Infitar", nameUrdu: "الانفطار", verses: 19 },
  { id: 83, name: "Al-Mutaffifin", nameUrdu: "المطففین", verses: 36 },
  { id: 84, name: "Al-Inshiqaq", nameUrdu: "الانشقاق", verses: 25 },
  { id: 85, name: "Al-Buruj", nameUrdu: "البروج", verses: 22 },
  { id: 86, name: "At-Tariq", nameUrdu: "الطارق", verses: 17 },
  { id: 87, name: "Al-A'la", nameUrdu: "الاعلیٰ", verses: 19 },
  { id: 88, name: "Al-Ghashiyah", nameUrdu: "الغاشیہ", verses: 26 },
  { id: 89, name: "Al-Fajr", nameUrdu: "الفجر", verses: 30 },
  { id: 90, name: "Al-Balad", nameUrdu: "البلد", verses: 20 },
  { id: 91, name: "Ash-Shams", nameUrdu: "الشمس", verses: 15 },
  { id: 92, name: "Al-Layl", nameUrdu: "اللیل", verses: 21 },
  { id: 93, name: "Ad-Duha", nameUrdu: "الضحیٰ", verses: 11 },
  { id: 94, name: "Ash-Sharh", nameUrdu: "الشرح", verses: 8 },
  { id: 95, name: "At-Tin", nameUrdu: "التین", verses: 8 },
  { id: 96, name: "Al-Alaq", nameUrdu: "العلق", verses: 19 },
  { id: 97, name: "Al-Qadr", nameUrdu: "القدر", verses: 5 },
  { id: 98, name: "Al-Bayyinah", nameUrdu: "البینہ", verses: 8 },
  { id: 99, name: "Az-Zalzalah", nameUrdu: "الزلزال", verses: 8 },
  { id: 100, name: "Al-Adiyat", nameUrdu: "العادیات", verses: 11 },
  { id: 101, name: "Al-Qari'ah", nameUrdu: "القارعہ", verses: 11 },
  { id: 102, name: "At-Takathur", nameUrdu: "التکاثر", verses: 8 },
  { id: 103, name: "Al-Asr", nameUrdu: "العصر", verses: 3 },
  { id: 104, name: "Al-Humazah", nameUrdu: "الہمزہ", verses: 9 },
  { id: 105, name: "Al-Fil", nameUrdu: "الفیل", verses: 5 },
  { id: 106, name: "Quraysh", nameUrdu: "قریش", verses: 4 },
  { id: 107, name: "Al-Ma'un", nameUrdu: "الماعون", verses: 7 },
  { id: 108, name: "Al-Kawthar", nameUrdu: "الکوثر", verses: 3 },
  { id: 109, name: "Al-Kafirun", nameUrdu: "الکافرون", verses: 6 },
  { id: 110, name: "An-Nasr", nameUrdu: "النصر", verses: 3 },
  { id: 111, name: "Al-Masad", nameUrdu: "المسد", verses: 5 },
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
