import type { Gender } from "@prisma/client";

// ============================================================
// FAMILY TREE — Shared TypeScript types
// ============================================================

export type TreeVisibility =
  | "PRIVATE"
  | "COLLABORATORS"
  | "CLAN_ONLY"
  | "REGISTERED"
  | "PUBLIC";

export type RelationshipType =
  | "BIOLOGICAL"
  | "ADOPTED"
  | "STEP"
  | "GUARDIAN"
  | "FOSTER";

export type MarriageStatus =
  | "MARRIED"
  | "DIVORCED"
  | "WIDOWED"
  | "SEPARATED"
  | "ENGAGED";

export type MarriageType = "NIKKAH" | "CIVIL" | "COURT";

export type CollaboratorRole = "VIEWER" | "EDITOR" | "ADMIN" | "OWNER";

export type InviteType = "VIEW" | "COLLABORATE" | "MERGE" | "CLAIM_PROFILE";

export type InviteStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELLED";

export type MergeStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "MERGED"
  | "CANCELLED";

export type DuplicateStatus =
  | "PENDING"
  | "CONFIRMED_SAME"
  | "CONFIRMED_DIFFERENT"
  | "MERGED";

export type LifeEventType =
  | "BIRTH"
  | "AQEEQA"
  | "BISMILLAH"
  | "KHATAM_QURAN"
  | "SCHOOL_ADMISSION"
  | "GRADUATION"
  | "FIRST_JOB"
  | "ENGAGEMENT"
  | "NIKKAH"
  | "WALIMA"
  | "HAJJ"
  | "UMRAH"
  | "CHILD_BIRTH"
  | "JOB_CHANGE"
  | "PROMOTION"
  | "RETIREMENT"
  | "HOUSE_PURCHASE"
  | "MIGRATION"
  | "ILLNESS"
  | "SURGERY"
  | "DEATH"
  | "FUNERAL"
  | "OTHER";

// ---------- API payload shapes ----------

export interface TreeMemberDto {
  id: string;
  treeId: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  nickName: string | null;
  gender: Gender;
  dateOfBirth: string | null;
  dateOfDeath: string | null;
  isAlive: boolean;
  photo: string | null;
  birthPlace: string | null;
  deathPlace: string | null;
  currentCity: string | null;
  occupation: string | null;
  education: string | null;
  bio: string | null;
  phone: string | null;
  email: string | null;
  generation: number;
  sortOrder: number;
  isPrivate: boolean;
  showInPublic: boolean;
  positionX: number | null;
  positionY: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface TreeRelationshipDto {
  id: string;
  parentId: string;
  childId: string;
  type: RelationshipType;
  treeId: string;
}

export interface TreeMarriageDto {
  id: string;
  spouse1Id: string;
  spouse2Id: string;
  treeId: string;
  date: string | null;
  endDate: string | null;
  location: string | null;
  status: MarriageStatus;
  type: MarriageType;
  sortOrder: number;
}

export interface TreeDto {
  id: string;
  name: string;
  description: string | null;
  isPublic: boolean;
  visibility: TreeVisibility;
  creatorId: string;
  rootMemberId: string | null;
  memberCount: number;
  generationCount: number;
  lastModified: string;
  createdAt: string;
  updatedAt: string;
  role?: CollaboratorRole;
  isOwner?: boolean;
}

export interface TreeGraphDto {
  tree: TreeDto & { creator?: { id: string; name: string | null; image: string | null } | null };
  members: TreeMemberDto[];
  relationships: TreeRelationshipDto[];
  marriages: TreeMarriageDto[];
  viewerRole: CollaboratorRole | "PUBLIC_VIEWER";
  canEdit: boolean;
  canDelete: boolean;
  canInvite: boolean;
  privacy: TreePrivacySettingsDto;
  rootMemberId: string | null;
}

export interface TreePrivacySettingsDto {
  id?: string;
  treeId?: string;
  showLiving: boolean;
  showFemales: boolean;
  showPhotos: boolean;
  showDates: boolean;
  showPlaces: boolean;
  showOccupation: boolean;
  showBio: boolean;
  showContact: boolean;
  watermarkPhotos: boolean;
  allowDownload: boolean;
  allowExport: boolean;
}

export interface MemberCommentDto {
  id: string;
  memberId: string;
  userId: string;
  parentId: string | null;
  content: string;
  isPinned: boolean;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string | null; image: string | null } | null;
  reactions?: CommentReactionDto[];
  replies?: MemberCommentDto[];
  replyCount?: number;
}

export interface CommentReactionDto {
  id: string;
  commentId: string;
  userId: string;
  emoji: string;
  createdAt: string;
}

export interface MemberLifeEventDto {
  id: string;
  memberId: string;
  type: LifeEventType;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  photo: string | null;
  source: string | null;
  verifiedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MemberStoryDto {
  id: string;
  memberId: string;
  userId: string;
  title: string;
  content: string;
  language: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  author?: { id: string; name: string | null; image: string | null } | null;
}

export interface TreeCollaboratorDto {
  id: string;
  treeId: string;
  userId: string;
  role: CollaboratorRole;
  canEditBranch: string | null;
  addedById: string | null;
  addedAt: string;
  user?: { id: string; name: string | null; email: string; image: string | null } | null;
}

export interface TreeInviteDto {
  id: string;
  treeId: string;
  inviterId: string;
  inviteeEmail: string | null;
  inviteePhone: string | null;
  inviteeName: string | null;
  type: InviteType;
  status: InviteStatus;
  token: string;
  memberId: string | null;
  message: string | null;
  expiresAt: string;
  respondedAt: string | null;
  createdAt: string;
  tree?: { id: string; name: string } | null;
}

export interface TreeMergeRequestDto {
  id: string;
  sourceTreeId: string;
  targetTreeId: string;
  requesterId: string;
  status: MergeStatus;
  commonMembers: DuplicateCandidate[] | null;
  mergeMap: Record<string, string> | null;
  message: string | null;
  respondedAt: string | null;
  createdAt: string;
  sourceTree?: { id: string; name: string } | null;
  targetTree?: { id: string; name: string } | null;
}

export interface DuplicateCandidate {
  member1: TreeMemberDto;
  member2: TreeMemberDto;
  score: number;
}

export interface TreeVersionDto {
  id: string;
  treeId: string;
  userId: string;
  action: string;
  snapshot: unknown;
  changes: unknown;
  createdAt: string;
}

export interface TreeStatsDto {
  treeId: string;
  name: string;
  totalMembers: number;
  maleCount: number;
  femaleCount: number;
  livingCount: number;
  deceasedCount: number;
  generations: number;
  marriages: number;
  relationships: number;
  averageAge: number | null;
  oldestMember: { id: string; name: string; dateOfBirth: string | null; age: number | null } | null;
  youngestMember: { id: string; name: string; dateOfBirth: string | null; age: number | null } | null;
  genderSplit: { male: number; female: number };
  byGeneration: { generation: number; count: number }[];
  birthsByDecade: { decade: string; count: number }[];
  cities: { city: string; count: number }[];
  occupations: { occupation: string; count: number }[];
  commentsCount: number;
  storiesCount: number;
  lifeEventsCount: number;
}

// ---------- Layout / viewer types ----------

export type LayoutDirection = "TB" | "BT" | "LR" | "RL";

export interface TreeLayoutNode {
  member: TreeMemberDto;
  x: number;
  y: number;
  depth: number;
  spouseSlot: number; // which marriage column this member belongs to
  children: TreeLayoutNode[];
  parentMarriages: TreeMarriageDto[]; // marriages this node is a child of
}

export interface TreeLinkDatum {
  source: TreeLayoutNode;
  target: TreeLayoutNode;
  type: RelationshipType;
}

export interface MarriageLinkDatum {
  spouse1: TreeLayoutNode;
  spouse2: TreeLayoutNode;
  marriage: TreeMarriageDto;
}

export interface RelationshipPathResult {
  found: boolean;
  path?: { memberId: string; via: "parent" | "child" | "spouse"; member: TreeMemberDto }[];
  nameUrdu?: string;
  nameEnglish?: string;
  degrees?: number;
}

export interface MemberComparisonResult {
  member1: TreeMemberDto;
  member2: TreeMemberDto;
  sameAge: boolean;
  ageDeltaYears: number | null;
  commonBirthPlace: boolean;
  commonCity: boolean;
  commonGeneration: boolean;
  sharedAncestors: TreeMemberDto[];
}

export interface GcMember {
  firstName: string;
  lastName: string;
  gender: Gender;
  birthDate: string | null;
  deathDate: string | null;
  birthPlace: string | null;
  deathPlace: string | null;
  occupation: string | null;
  education: string | null;
  note: string | null;
  familyId: string | null;
  childOf: string | null; // familyId reference
}

export interface GedcomParseResult {
  members: GcMember[];
  marriages: { spouse1Ref: string; spouse2Ref: string; date: string | null }[];
  warnings: string[];
}

export interface CsvParseResult {
  rows: Record<string, string>[];
  columns: string[];
  warnings: string[];
}

export interface ImportPreviewDto {
  members: GcMember[];
  marriages: { spouse1Ref: string; spouse2Ref: string; date: string | null }[];
  warnings: string[];
  memberCount: number;
  marriageCount: number;
}
