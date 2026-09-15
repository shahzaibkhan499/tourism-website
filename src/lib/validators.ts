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
  educations: z
    .array(
      z.object({
        degree: z.string().max(100),
        institute: z.string().max(200),
        year: z.string().max(20),
      })
    )
    .max(20)
    .optional()
    .nullable(),
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
    // Round 10 — additional event types
    "BAPTISM", "BURIAL", "CREMATION", "ADOPTED", "DIVORCE", "ANNULMENT",
    "QURAN_KHANI", "HIFZ_E_QURAN", "OCCUPATION", "RETIREMENT", "ELECTED",
    "MILITARY_SERVICE", "ORDINATION", "EDUCATION", "DEGREE", "DOCTORATE",
    "TRAVEL", "LEGAL", "RESIDENCE", "BUSINESS_OPENING",
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
  // Round 10 — dynamic per-type details (JSON blob) + invitee user ids
  details: z.record(z.unknown()).optional().nullable(),
  invitees: z.array(z.string().min(1)).max(100).optional().nullable(),
});

export const inviteSchema = z.object({
  invitees: z.array(z.string().min(1)).min(1, "Kam az kam 1 invitee zaroori hai").max(100),
});

export const rsvpSchema = z.object({
  status: z.enum(["GOING", "NOT_GOING", "MAYBE"]),
  guests: z.number().int().min(0).max(50).default(0),
  note: z.string().max(500).optional().nullable(),
  // Round 10 — message / dua sent with the RSVP
  message: z.string().max(1000).optional().nullable(),
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

/* ---------- Rishta (overhauled 12-section form) ---------- */

/** Optional int that treats "" as "not provided" (z.coerce would turn "" into 0). */
const optInt = (min: number, max: number) =>
  z.preprocess((v) => (v === "" ? undefined : v), z.coerce.number().int().min(min).max(max).optional().nullable());


export const rishtaEducationEntrySchema = z.object({
  qualification: z.string().max(100).optional().nullable(),
  school: z.string().max(200).optional().nullable(),
  college: z.string().max(200).optional().nullable(),
  university: z.string().max(200).optional().nullable(),
  course: z.string().max(200).optional().nullable(),
});

export const rishtaFormDetailsSchema = z.object({
  // 1. Personal information
  personal: z
    .object({
      gender: z.enum(["MALE", "FEMALE"]).default("MALE"),
      name: z.string().max(100).optional().nullable(),
      dateOfBirth: z.string().optional().nullable(),
      motherTongue: z.string().max(50).optional().nullable(),
    })
    .default({}),
  // 2. Physical appearance
  physical: z
    .object({
      build: z.enum(["SLIM", "MEDIUM", "HEALTHY"]).optional().nullable(),
      disability: z.boolean().default(false),
      disabilityDetails: z.string().max(500).optional().nullable(),
    })
    .default({}),
  // 3. Education details (multi-entry)
  education: z.array(rishtaEducationEntrySchema).max(10).default([]),
  // 4. Job / Business
  job: z
    .object({
      company: z.string().max(200).optional().nullable(),
      nature: z.string().max(200).optional().nullable(),
      place: z.string().max(200).optional().nullable(),
      rank: z.string().max(200).optional().nullable(),
      futurePlans: z.string().max(1000).optional().nullable(),
    })
    .default({}),
  // 5. Cultural & ethical
  cultural: z
    .object({
      languages: z.array(z.string()).max(9).default([]),
      caste: z.string().max(100).optional().nullable(),
      subCast: z.string().max(100).optional().nullable(),
      hobbies: z.string().max(500).optional().nullable(),
    })
    .default({}),
  // 6. Religion details
  religion: z
    .object({
      sect: z.enum(["SUNNI", "SHIA"]).optional().nullable(),
    })
    .default({}),
  // 7. House details
  house: z
    .object({
      home: z.enum(["OWN", "RENT"]).optional().nullable(),
      size: z.string().max(100).optional().nullable(),
      location: z.string().max(200).optional().nullable(),
      land: z.boolean().default(false),
      vehicles: z.string().max(200).optional().nullable(),
      address: z.string().max(300).optional().nullable(),
      currentCity: z.string().max(100).optional().nullable(),
      nationality: z.string().max(100).optional().nullable(),
      homeTown: z.string().max(100).optional().nullable(),
    })
    .default({}),
  // 8. Family details
  family: z
    .object({
      fatherName: z.string().max(100).optional().nullable(),
      fatherOccupation: z.string().max(100).optional().nullable(),
      fatherMobile: z.string().max(30).optional().nullable(),
      motherName: z.string().max(100).optional().nullable(),
      motherOccupation: z.string().max(100).optional().nullable(),
      motherMobile: z.string().max(30).optional().nullable(),
      brothers: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.number().int().min(0).max(30).default(0)),
      brothersMarried: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.number().int().min(0).max(30).default(0)),
      sisters: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.number().int().min(0).max(30).default(0)),
      sistersMarried: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.number().int().min(0).max(30).default(0)),
    })
    .default({}),
  // 9. Life partner requirements
  partner: z
    .object({
      statuses: z.array(z.enum(["SINGLE", "DIVORCED", "KHULLA", "WIDOWED"])).max(4).default([]),
      minAge: optInt(10, 80),
      maxAge: optInt(10, 80),
      minHeight: z.string().max(20).optional().nullable(),
      city: z.string().max(100).optional().nullable(),
      caste: z.string().max(100).optional().nullable(),
      sect: z.enum(["SUNNI", "SHIA", "ANY"]).default("ANY"),
      qualification: z.string().max(100).optional().nullable(),
      shariaPerda: z.enum(["YES", "NO", "ANY"]).default("ANY"),
      otherRequirements: z.string().max(1000).optional().nullable(),
      divorcedAcceptable: z.boolean().default(false),
    })
    .default({}),
  // 10. Contact person
  contact: z
    .object({
      personName: z.string().max(100).optional().nullable(),
      relation: z
        .enum(["SELF", "FATHER", "MOTHER", "BROTHER", "SISTER", "UNCLE", "AUNT", "COUSIN", "GUARDIAN", "OTHER"])
        .default("SELF"),
      mobile: z.string().max(30).optional().nullable(),
    })
    .default({}),
  // 12. Mandatory Halaf Nama (oath)
  halafNama: z.boolean().default(false),
});

export const rishtaProfileFields = z.object({
  maritalStatus: z.enum(["SINGLE", "MARRIED", "DIVORCED", "KHULLA", "WIDOWED"]).default("SINGLE"),
  children: z.preprocess((v) => (v === "" ? undefined : v), z.coerce.number().int().min(0).max(20).default(0)),
  height: z.string().max(20).optional().nullable(),
  weight: optInt(20, 300),
  complexion: z.string().max(50).optional().nullable(),
  education: z.string().max(100).optional().nullable(),
  educationDetail: z.string().max(300).optional().nullable(),
  profession: z.string().max(200).optional().nullable(),
  income: z.string().max(50).optional().nullable(),
  sect: z.string().max(50).optional().nullable(),
  maslak: z.string().max(50).optional().nullable(),
  castePreference: z.string().max(100).optional().nullable(),
  cityPreference: z.string().max(100).optional().nullable(),
  countryPreference: z.string().max(100).optional().nullable(),
  about: z.string().max(2000).optional().nullable(),
  familyBackground: z.string().max(2000).optional().nullable(),
  expectations: z.string().max(2000).optional().nullable(),
  photos: z.array(z.string()).max(2, "زیادہ سے زیادہ 2 تصاویر (شخصی + فیملی) اپ لوڈ کر سکتے ہیں").default([]),
  isGuardianMode: z.boolean().default(false),
  guardianName: z.string().max(100).optional().nullable(),
  guardianRelation: z.string().max(100).optional().nullable(),
  guardianPhone: z.string().max(30).optional().nullable(),
  formDetails: rishtaFormDetailsSchema,
});

/** POST — full form; the Halaf Nama (oath) checkbox is mandatory. */
export const rishtaProfileSchema = rishtaProfileFields.refine(
  (d) => d.formDetails.halafNama === true,
  {
    message:
      "حلف نامہ مانتے ہوئے ہی فارم جمع ہو سکتا ہے — You must accept the Halaf Nama (oath) before submitting",
    path: ["formDetails", "halafNama"],
  }
);

/** Base fields without the oath refine (used for partial PATCH updates). */
export type RishtaProfileFields = z.infer<typeof rishtaProfileFields>;
export type RishtaFormDetails = z.infer<typeof rishtaFormDetailsSchema>;

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
