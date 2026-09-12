import { z } from "zod";

// ============================================================
// FAMILY TREE — Zod validation schemas (all tree APIs)
// ============================================================

export const treeVisibilitySchema = z.enum(["PRIVATE", "COLLABORATORS", "CLAN_ONLY", "REGISTERED", "PUBLIC"]);
export const relationshipTypeSchema = z.enum(["BIOLOGICAL", "ADOPTED", "STEP", "GUARDIAN", "FOSTER"]);
export const marriageStatusSchema = z.enum(["MARRIED", "DIVORCED", "WIDOWED", "SEPARATED", "ENGAGED"]);
export const marriageTypeSchema = z.enum(["NIKKAH", "CIVIL", "COURT"]);
export const collaboratorRoleSchema = z.enum(["VIEWER", "EDITOR", "ADMIN", "OWNER"]);
export const inviteTypeSchema = z.enum(["VIEW", "COLLABORATE", "MERGE", "CLAIM_PROFILE"]);
export const lifeEventTypeSchema = z.enum([
  "BIRTH",
  "AQEEQA",
  "BISMILLAH",
  "KHATAM_QURAN",
  "SCHOOL_ADMISSION",
  "GRADUATION",
  "FIRST_JOB",
  "ENGAGEMENT",
  "NIKKAH",
  "WALIMA",
  "HAJJ",
  "UMRAH",
  "CHILD_BIRTH",
  "JOB_CHANGE",
  "PROMOTION",
  "RETIREMENT",
  "HOUSE_PURCHASE",
  "MIGRATION",
  "ILLNESS",
  "SURGERY",
  "DEATH",
  "FUNERAL",
  "OTHER",
]);

const optionalText = z
  .union([z.string().trim().max(500), z.null(), z.literal("")])
  .optional()
  .transform((v) => (v === "" || v === undefined ? null : v));

const optionalLongText = z
  .union([z.string().trim().max(5000), z.null(), z.literal("")])
  .optional()
  .transform((v) => (v === "" || v === undefined ? null : v));

const optionalDate = z
  .union([z.coerce.date(), z.null(), z.literal("")])
  .optional()
  .transform((v) => {
    if (v === null || v === undefined || v === "") return null;
    const d = v instanceof Date ? v : new Date(v);
    return isNaN(d.getTime()) ? null : d;
  });

const memberBaseSchema = z
  .object({
    firstName: z.string().trim().min(1, "نام لکھنا ضروری ہے").max(100),
    lastName: z
      .union([z.string().trim().max(100), z.literal("")])
      .optional()
      .transform((v) => (v === "" || v === undefined ? "" : v)),
    nickName: optionalText,
    gender: z.enum(["MALE", "FEMALE"]),
    dateOfBirth: optionalDate,
    dateOfDeath: optionalDate,
    isAlive: z.boolean().optional(),
    photo: optionalText,
    birthPlace: optionalText,
    deathPlace: optionalText,
    currentCity: optionalText,
    occupation: optionalText,
    education: optionalText,
    bio: optionalLongText,
    phone: optionalText,
    email: z.union([z.string().trim().email("درست ای میل لکھیں").max(200), z.literal(""), z.null()]).optional(),
    generation: z.number().int().min(1).max(99).optional(),
    sortOrder: z.number().int().optional(),
    isPrivate: z.boolean().optional(),
    showInPublic: z.boolean().optional(),
    positionX: z.number().optional().nullable(),
    positionY: z.number().optional().nullable(),
    userId: optionalText,
    parentIds: z.array(z.string().min(1)).max(2, "زیادہ سے زیادہ 2 والدین (والد اور والدہ)").optional(),
    spouseId: z.string().min(1).optional(),
    marriageDate: optionalDate,
    marriageStatus: marriageStatusSchema.optional(),
    treeId: z.string().min(1).optional(),
  })
export const memberInputSchema = memberBaseSchema.refine(
  (d) => !d.dateOfDeath || !d.dateOfBirth || d.dateOfDeath >= d.dateOfBirth,
  {
    message: "تاریخ وفات تاریخ پیدائش سے پہلے نہیں ہو سکتی",
    path: ["dateOfDeath"],
  }
);

export const memberUpdateSchema = memberBaseSchema.partial();

export const treeCreateSchema = z.object({
  name: z.string().trim().min(1, "درخت کا نام لکھنا ضروری ہے").max(120),
  description: optionalLongText.optional(),
  visibility: treeVisibilitySchema.optional(),
  isPublic: z.boolean().optional(),
  autoAddSelfAsRoot: z.boolean().optional(),
  rootMember: memberBaseSchema.pick({
    firstName: true,
    lastName: true,
    gender: true,
    dateOfBirth: true,
    dateOfDeath: true,
    photo: true,
    birthPlace: true,
    currentCity: true,
    occupation: true,
    bio: true,
  }).optional(),
});

export const treeUpdateSchema = z.object({
  name: z.string().trim().min(1, "نام لکھنا ضروری ہے").max(120).optional(),
  description: optionalLongText.optional(),
  visibility: treeVisibilitySchema.optional(),
  isPublic: z.boolean().optional(),
});

export const memberQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
  q: z.string().trim().max(200).optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  generation: z.coerce.number().int().min(1).max(99).optional(),
  living: z.enum(["true", "false"]).optional(),
});

export const relationshipCreateSchema = z.object({
  parentId: z.string().min(1, "والد/والدہ کا انتخاب ضروری ہے"),
  childId: z.string().min(1, "بچے کا انتخاب ضروری ہے"),
  type: relationshipTypeSchema.optional(),
});

export const marriageCreateSchema = z.object({
  spouse1Id: z.string().min(1),
  spouse2Id: z.string().min(1),
  date: optionalDate.optional(),
  endDate: optionalDate.optional(),
  location: optionalText.optional(),
  status: marriageStatusSchema.optional(),
  type: marriageTypeSchema.optional(),
  sortOrder: z.number().int().optional(),
});

export const marriageUpdateSchema = marriageCreateSchema.partial();

export const commentCreateSchema = z.object({
  content: z.string().trim().min(1, "کمنٹ لکھیں").max(2000),
  parentId: z.string().min(1).optional().nullable(),
});

export const commentUpdateSchema = z.object({
  content: z.string().trim().min(1, "کمنٹ لکھیں").max(2000),
});

export const reactionToggleSchema = z.object({
  emoji: z.string().trim().min(1).max(16),
});

export const lifeEventCreateSchema = z.object({
  type: lifeEventTypeSchema,
  title: z.string().trim().min(1, "عنوان لکھیں").max(200),
  description: optionalLongText.optional(),
  date: z.coerce.date(),
  location: optionalText.optional(),
  photo: optionalText.optional(),
  source: optionalText.optional(),
});

export const storyCreateSchema = z.object({
  title: z.string().trim().min(1, "عنوان لکھیں").max(200),
  content: z.string().trim().min(1, "کہانی لکھیں").max(20000),
  language: z.string().trim().max(10).optional(),
  isPublic: z.boolean().optional(),
});

export const verifySchema = z.object({
  relationshipId: z.string().min(1).optional(),
  marriageId: z.string().min(1).optional(),
  memberId: z.string().min(1).optional(),
  verified: z.boolean(),
  note: optionalLongText.optional(),
});

export const inviteCreateSchema = z.object({
  inviteeEmail: z
    .union([z.string().trim().email("درست ای میل لکھیں").max(200), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v === "" || v === undefined ? null : v)),
  inviteePhone: optionalText,
  inviteeName: optionalText,
  type: inviteTypeSchema,
  memberId: optionalText.optional(),
  message: optionalLongText.optional(),
  daysValid: z.number().int().min(1).max(90).optional(),
});

export const inviteRespondSchema = z.object({
  accept: z.boolean(),
});

export const mergeRequestSchema = z.object({
  targetTreeId: z.string().min(1),
  message: optionalLongText.optional(),
  mergeMap: z.record(z.string().min(1), z.string().min(1)).optional(),
});

export const mergeRespondSchema = z.object({
  approve: z.boolean(),
});

export const duplicateResolveSchema = z.object({
  member1Id: z.string().min(1),
  member2Id: z.string().min(1),
  action: z.enum(["MERGE", "SKIP"]),
  mergeMap: z.record(z.string().min(1), z.string().min(1)).optional(),
});

export const relationshipCalcSchema = z.object({
  memberAId: z.string().min(1),
  memberBId: z.string().min(1),
});

export const memberCompareSchema = z.object({
  member1Id: z.string().min(1),
  member2Id: z.string().min(1),
});

export const privacyUpdateSchema = z.object({
  showLiving: z.boolean().optional(),
  showFemales: z.boolean().optional(),
  showPhotos: z.boolean().optional(),
  showDates: z.boolean().optional(),
  showPlaces: z.boolean().optional(),
  showOccupation: z.boolean().optional(),
  showBio: z.boolean().optional(),
  showContact: z.boolean().optional(),
  watermarkPhotos: z.boolean().optional(),
  allowDownload: z.boolean().optional(),
  allowExport: z.boolean().optional(),
});

export const memberPrivacyUpdateSchema = z.object({
  isHidden: z.boolean().optional(),
  hidePhoto: z.boolean().optional(),
  hideDates: z.boolean().optional(),
  hideBio: z.boolean().optional(),
  hideContact: z.boolean().optional(),
});

export const collaboratorAddSchema = z.object({
  email: z.string().trim().email("درست ای میل لکھیں").max(200),
  role: z.enum(["VIEWER", "EDITOR", "ADMIN"]),
  canEditBranch: optionalText.optional(),
});

export const collaboratorUpdateSchema = z.object({
  role: z.enum(["VIEWER", "EDITOR", "ADMIN"]).optional(),
  canEditBranch: optionalText.optional(),
});

export const reorderSchema = z.object({
  items: z
    .array(
      z.object({
        memberId: z.string().min(1),
        sortOrder: z.number().int(),
      })
    )
    .min(1)
    .max(500),
});

export const importCsvSchema = z.object({
  rows: z.array(z.record(z.string().min(1), z.string())).min(1).max(2000),
  mapping: z.record(z.string().min(1), z.string().min(1)),
});

export const exportQuerySchema = z.object({
  format: z.enum(["gedcom", "json", "pdf", "png"]).optional(),
});

export const paginationSchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
});
