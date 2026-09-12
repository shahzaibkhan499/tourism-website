// ============================================================
// Digital Khandaan - Zod Validators
// Every API route uses these schemas for input validation
// ============================================================

import { z } from "zod";

const phoneRegex = /^03\d{9}$/;
const passwordMin = 8;

// ---------- Auth ----------

export const registerSchema = z.object({
  name: z.string().min(2, "نام کم از کم 2 حروف کا ہونا چاہیے"),
  email: z.string().email("درست ای میل ایڈریس لکھیں"),
  phone: z
    .string()
    .regex(phoneRegex, "درست پاکستانی موبائل نمبر لکھیں (03001234567)")
    .optional()
    .or(z.literal("")),
  password: z.string().min(passwordMin, "پاس ورڈ کم از کم 8 حروف کا ہو"),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  city: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("درست ای میل ایڈریس لکھیں"),
  password: z.string().min(1, "پاس ورڈ لکھیں"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("درست ای میل ایڈریس لکھیں"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "موجودہ پاس ورڈ لکھیں"),
  newPassword: z
    .string()
    .min(passwordMin, "نیا پاس ورڈ کم از کم 8 حروف کا ہو")
    .regex(/[a-zA-Z]/, "پاس ورڈ میں ایک انگریزی حرف ضروری ہے")
    .regex(/[0-9]/, "پاس ورڈ میں ایک نمبر ضروری ہے"),
});

export const twoFactorVerifySchema = z.object({
  code: z.string().length(6, "6 ہندسوں کا کوڈ لکھیں"),
});

export const twoFactorEnableSchema = z.object({
  code: z.string().length(6, "6 ہندسوں کا کوڈ لکھیں"),
});

// ---------- Profile ----------

export const profileSchema = z.object({
  name: z.string().min(2, "نام کم از کم 2 حروف کا ہونا چاہیے"),
  phone: z
    .string()
    .regex(phoneRegex, "درست پاکستانی موبائل نمبر لکھیں")
    .optional()
    .or(z.literal("")),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  bio: z.string().max(500, "تعارف 500 حروف سے زیادہ نہیں ہو سکتا").optional().nullable(),
  bloodGroup: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  education: z.string().optional().nullable(),
  clanId: z.string().optional().nullable(),
  subClanId: z.string().optional().nullable(),
  nameTitle: z.string().optional().nullable(),
  nickname: z.string().optional().nullable(),
  displayName: z.string().optional().nullable(),
  cast: z.string().optional().nullable(),
  origin: z.string().optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
  cnic: z.string().optional().nullable(),
  birthPlace: z.string().optional().nullable(),
  extendedProfile: z.record(z.string(), z.any()).optional(),
  privacy: z.record(z.string(), z.any()).optional(),
});

// ---------- Occupation ----------

export const occupationStatusSchema = z.object({
  employmentStatus: z.enum(["EMPLOYED", "UNEMPLOYED", "STUDENT", "RETIRED", "HOMEMAKER"]).optional(),
  jobType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE", "BUSINESS_OWNER"]).optional(),
});

export const occupationSectionSchema = z.object({
  category: z.enum(["corporate", "business", "government", "medical", "specialized"]),
  data: z
    .record(z.string(), z.union([z.string(), z.number(), z.boolean()]).nullish())
    .optional()
    .default({}),
});

// ---------- Events ----------

export const eventSchema = z.object({
  title: z.string().min(2, "Title kam az kam 2 huroof ka ho"),
  // strict enum — invalid values must 400, not crash Prisma with a 500
  type: z.enum([
    "BIRTH", "AQEEQA", "BISMILLAH", "KHATAM_QURAN", "ENGAGEMENT", "MEHNDI",
    "NIKKAH", "BARAAT", "WALIMA", "RUKHSATI", "DEATH", "CHEHLUM", "BARSI",
    "EID_UL_FITR", "EID_UL_ADHA", "SHAB_E_QADR", "SHAB_E_MERAJ", "MILAD_UN_NABI",
    "RAMADAN_IFTAR", "FAMILY_REUNION", "GRADUATION", "JOB_CELEBRATION",
    "WELCOME_HOME", "PANCHAYAT", "INDEPENDENCE_DAY", "PAKISTAN_DAY",
    "QUAID_E_AZAM_DAY", "IQBAL_DAY", "BASANT", "CHAND_RAAT", "EID_MILAN", "OTHER",
  ]),
  date: z.string().min(1, "تاریخ منتخب کریں"),
  endDate: z.string().optional().nullable(),
  time: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  hijriDate: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  isPublic: z.boolean().default(false),
  isRecurring: z.boolean().default(false),
  recurringPattern: z.string().optional().nullable(),
});

export const rsvpSchema = z.object({
  status: z.enum(["GOING", "NOT_GOING", "MAYBE"]),
  guests: z.number().int().min(0).max(50).default(0),
  note: z.string().max(500).optional().nullable(),
});

export const eventQuerySchema = z.object({
  type: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  location: z.string().optional(),
  isPublic: z.enum(["true", "false"]).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

// ---------- Community ----------

export const joinClanSchema = z.object({
  clanId: z.string().min(1, "کلان منتخب کریں"),
  subClanId: z.string().optional().nullable(),
  subClanName: z.string().optional().nullable(),
});

export const clanSchema = z.object({
  name: z.string().min(2, "Naam kam az kam 2 huroof ka ho"),
  nameUrdu: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  history: z.string().optional().nullable(),
  communityId: z.string().min(1, "کمیونٹی منتخب کریں"),
  logo: z.string().optional().nullable(),
});

export const subClanSchema = z.object({
  name: z.string().min(2, "Naam kam az kam 2 huroof ka ho"),
  nameUrdu: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  clanId: z.string().min(1, "کلان منتخب کریں"),
});

export const communitySchema = z.object({
  name: z.string().min(2, "Naam kam az kam 2 huroof ka ho"),
  nameUrdu: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
});

// ---------- Rishta ----------

export const rishtaProfileSchema = z.object({
  age: z.coerce.number().int().min(18, "Umar kam az kam 18 ho").max(80, "عمر 80 سے زیادہ نہیں ہو سکتی"),
  height: z.string().optional().nullable(),
  weight: z.string().optional().nullable(),
  complexion: z.string().optional().nullable(),
  education: z.string().optional().nullable(),
  educationDetail: z.string().optional().nullable(),
  profession: z.string().optional().nullable(),
  income: z.string().optional().nullable(),
  sect: z.string().optional().nullable(),
  maslak: z.string().optional().nullable(),
  castePreference: z.string().optional().nullable(),
  cityPreference: z.string().optional().nullable(),
  countryPreference: z.string().optional().nullable(),
  maritalStatus: z.string().default("NEVER_MARRIED"),
  children: z.coerce.number().int().min(0).max(20).default(0),
  about: z.string().max(2000).optional().nullable(),
  familyBackground: z.string().max(2000).optional().nullable(),
  expectations: z.string().max(2000).optional().nullable(),
  photos: z.array(z.string()).max(5, "زیادہ سے زیادہ 5 تصاویر اپ لوڈ کر سکتے ہیں").default([]),
  isGuardianMode: z.boolean().default(false),
  guardianName: z.string().optional().nullable(),
  guardianRelation: z.string().optional().nullable(),
  guardianPhone: z.string().optional().nullable(),
  marriageForm: z.record(z.string(), z.any()).optional().nullable(),
});

export const rishtaRequestSchema = z.object({
  receiverId: z.string().min(1, "پروفائل منتخب کریں"),
  message: z.string().max(1000, "پیغام 1000 حروف سے زیادہ نہیں ہو سکتا").optional().nullable(),
});

export const rishtaRequestActionSchema = z.object({
  status: z.enum(["ACCEPTED", "REJECTED", "BLOCKED"]),
});

export const rishtaQuerySchema = z.object({
  gender: z.string().optional(),
  minAge: z.coerce.number().optional(),
  maxAge: z.coerce.number().optional(),
  education: z.string().optional(),
  profession: z.string().optional(),
  sect: z.string().optional(),
  city: z.string().optional(),
  maritalStatus: z.string().optional(),
  caste: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(24).default(12),
});

// ---------- Jobs ----------

export const jobPostingSchema = z.object({
  title: z.string().min(2, "Title kam az kam 2 huroof ka ho"),
  description: z.string().min(10, "Description kam az kam 10 characters ka ho"),
  requirements: z.string().optional().nullable(),
  type: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT", "FREELANCE", "INTERNSHIP", "REMOTE"]).default("FULL_TIME"),
  experience: z.string().optional().nullable(),
  salaryMin: z.coerce.number().int().min(0).optional().nullable(),
  salaryMax: z.coerce.number().int().min(0).optional().nullable(),
  currency: z.string().default("PKR"),
  location: z.string().optional().nullable(),
  isRemote: z.boolean().default(false),
  deadline: z.string().optional().nullable(),
});

export const jobApplicationSchema = z.object({
  coverLetter: z.string().max(2000).optional().nullable(),
  resumeUrl: z.string().optional().nullable(),
});

export const jobProfileSchema = z.object({
  headline: z.string().max(200).optional().nullable(),
  summary: z.string().max(3000).optional().nullable(),
  experience: z
    .array(
      z.object({
        company: z.string().min(1),
        role: z.string().min(1),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .optional(),
  education: z
    .array(
      z.object({
        institution: z.string().min(1),
        degree: z.string().min(1),
        year: z.string().optional(),
        field: z.string().optional(),
      })
    )
    .optional(),
  skills: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
  resumeUrl: z.string().optional().nullable(),
  linkedinUrl: z.string().optional().nullable(),
  githubUrl: z.string().optional().nullable(),
  portfolioUrl: z.string().optional().nullable(),
  expectedSalary: z.string().optional().nullable(),
  preferredLocations: z.array(z.string()).default([]),
  availability: z.string().default("ACTIVE"),
});

export const jobQuerySchema = z.object({
  q: z.string().optional(),
  type: z.string().optional(),
  location: z.string().optional(),
  experience: z.string().optional(),
  industry: z.string().optional(),
  minSalary: z.coerce.number().optional(),
  remote: z.enum(["true", "false"]).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(20).default(10),
});

// ---------- Business ----------

export const businessSchema = z.object({
  name: z.string().min(2, "Naam kam az kam 2 huroof ka ho"),
  description: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  logo: z.string().optional().nullable(),
  coverImage: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email("درست ای میل لکھیں").optional().nullable().or(z.literal("")),
  address: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  socialLinks: z
    .array(
      z.object({
        platform: z.string().min(1),
        url: z.string().min(1),
      })
    )
    .optional(),
  isFamilyOwned: z.boolean().default(false),
});

export const businessReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().nullable(),
});

export const businessQuerySchema = z.object({
  q: z.string().optional(),
  industry: z.string().optional(),
  city: z.string().optional(),
  verified: z.enum(["true", "false"]).optional(),
  familyOwned: z.enum(["true", "false"]).optional(),
  featured: z.enum(["true", "false"]).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(24).default(12),
});

// ---------- Memories & Media ----------

export const memorySchema = z.object({
  title: z.string().min(2, "Title kam az kam 2 huroof ka ho"),
  description: z.string().max(3000).optional().nullable(),
  date: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  category: z
    .enum(["CHILDHOOD", "WEDDING", "GATHERING", "TRAVEL", "ACHIEVEMENT", "OLD_PHOTO", "RELIGIOUS", "FESTIVAL", "DAILY_LIFE", "OTHER"])
    .default("OTHER"),
  isPublic: z.boolean().default(false),
  media: z
    .array(
      z.object({
        url: z.string().min(1),
        publicId: z.string().optional().nullable(),
        type: z.enum(["IMAGE", "VIDEO", "AUDIO", "DOCUMENT"]),
        size: z.number().optional().nullable(),
        mimeType: z.string().optional().nullable(),
      })
    )
    .default([]),
});

export const mediaQuerySchema = z.object({
  type: z.string().optional(),
  q: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(60).default(24),
});

// ---------- Notifications ----------

export const notificationQuerySchema = z.object({
  tab: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

// ---------- Reports & Contact ----------

export const reportSchema = z.object({
  reportedId: z.string().min(1, "صارف منتخب کریں"),
  type: z.string().min(1, "Report type chunein"),
  reason: z.string().min(10, "وجہ کم از کم 10 حروف میں لکھیں").max(2000),
});

export const contactSchema = z.object({
  name: z.string().min(2, "نام لکھیں"),
  email: z.string().email("درست ای میل ایڈریس لکھیں"),
  subject: z.string().min(2, "موضوع لکھیں"),
  message: z.string().min(10, "Message kam az kam 10 characters ka ho").max(5000),
});

// ---------- Admin ----------

export const adminUserActionSchema = z.object({
  action: z.enum(["verify", "unverify", "role", "ban", "unban", "delete"]),
  role: z.enum(["USER", "MODERATOR", "ADMIN"]).optional(),
  reason: z.string().max(1000).optional(),
});

export const adminReportActionSchema = z.object({
  action: z.enum(["reviewed", "resolve", "dismiss", "warn", "ban"]),
  adminNote: z.string().max(2000).optional(),
});

export const adminBusinessActionSchema = z.object({
  action: z.enum(["verify", "unverify", "feature", "unfeature", "suspend", "activate", "delete"]),
});

export const adminRishtaActionSchema = z.object({
  action: z.enum(["verify", "unverify", "suspend", "activate", "delete"]),
});

export const adminJobActionSchema = z.object({
  action: z.enum(["activate", "deactivate", "delete"]),
});

export const adminEventActionSchema = z.object({
  action: z.enum(["feature", "unfeature", "delete"]),
});

export const adminSettingsSchema = z.object({
  settings: z.array(
    z.object({
      key: z.string().min(1),
      value: z.string(),
    })
  ),
});

// ---------- Contact page ----------

export const contactPageSchema = contactSchema;

// ---------- Shared types ----------

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type EventInput = z.infer<typeof eventSchema>;
export type RSVPInput = z.infer<typeof rsvpSchema>;
export type JoinClanInput = z.infer<typeof joinClanSchema>;
export type ClanInput = z.infer<typeof clanSchema>;
export type SubClanInput = z.infer<typeof subClanSchema>;
export type CommunityInput = z.infer<typeof communitySchema>;
export type RishtaProfileInput = z.infer<typeof rishtaProfileSchema>;
export type RishtaRequestInput = z.infer<typeof rishtaRequestSchema>;
export type JobPostingInput = z.infer<typeof jobPostingSchema>;
export type JobApplicationInput = z.infer<typeof jobApplicationSchema>;
export type JobProfileInput = z.infer<typeof jobProfileSchema>;
export type BusinessInput = z.infer<typeof businessSchema>;
export type BusinessReviewInput = z.infer<typeof businessReviewSchema>;
export type MemoryInput = z.infer<typeof memorySchema>;
export type ReportInput = z.infer<typeof reportSchema>;
export type ContactInput = z.infer<typeof contactSchema>;
