// ============================================================
// Digital Khandaan - Shared Types
// ============================================================

export interface UserBasic {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  phone?: string | null;
  gender?: string | null;
  city?: string | null;
  province?: string | null;
  clanId?: string | null;
  subClanId?: string | null;
  bio?: string | null;
  bloodGroup?: string | null;
  occupation?: string | null;
  education?: string | null;
  isVerified: boolean;
  role: string;
  isBanned?: boolean;
  dateOfBirth?: string | null;
  createdAt?: string;
}

export interface EventItem {
  id: string;
  title: string;
  description: string | null;
  type: string;
  date: string;
  endDate: string | null;
  location: string | null;
  hijriDate: string | null;
  isPublic: boolean;
  isRecurring: boolean;
  coverImage: string | null;
  creatorId: string;
  creator?: { id: string; name: string | null; image: string | null };
  rsvpCount?: number;
  myRsvp?: string | null;
  createdAt: string;
}

export interface CommunityItem {
  id: string;
  name: string;
  nameUrdu: string | null;
  description: string | null;
  region: string | null;
  logo: string | null;
  _count?: { clans: number };
  memberCount?: number;
  clans?: ClanItem[];
}

export interface ClanItem {
  id: string;
  name: string;
  nameUrdu: string | null;
  description: string | null;
  history: string | null;
  communityId: string;
  logo: string | null;
  community?: { id: string; name: string; nameUrdu: string | null };
  subClans?: SubClanItem[];
  _count?: { members: number; subClans: number };
}

export interface SubClanItem {
  id: string;
  name: string;
  nameUrdu: string | null;
  description: string | null;
  clanId: string;
  _count?: { members: number };
}

export interface RishtaProfileItem {
  id: string;
  userId: string;
  age: number | null;
  height: string | null;
  weight: string | null;
  complexion: string | null;
  education: string | null;
  educationDetail: string | null;
  profession: string | null;
  income: string | null;
  sect: string | null;
  maslak: string | null;
  castePreference: string | null;
  cityPreference: string | null;
  countryPreference: string | null;
  maritalStatus: string;
  children: number;
  about: string | null;
  familyBackground: string | null;
  expectations: string | null;
  photos: string[];
  isActive: boolean;
  isGuardianMode: boolean;
  guardianName: string | null;
  guardianRelation: string | null;
  guardianPhone: string | null;
  isVerified: boolean;
  isPremium: boolean;
  viewsCount: number;
  user?: { id: string; name: string | null; image: string | null; gender: string | null; city: string | null };
}

export interface JobPostingItem {
  id: string;
  title: string;
  description: string;
  requirements: string | null;
  type: string;
  experience: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  location: string | null;
  isRemote: boolean;
  isActive: boolean;
  deadline: string | null;
  createdAt: string;
  business?: {
    id: string;
    name: string;
    logo: string | null;
    city: string | null;
    industry: string | null;
    isVerified: boolean;
    isFamilyOwned: boolean;
  };
  applicationsCount?: number;
  myApplication?: { status: string } | null;
}

export interface BusinessItem {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  industry: string | null;
  category: string | null;
  logo: string | null;
  coverImage: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  socialLinks: Array<{ platform: string; url: string }> | null;
  isVerified: boolean;
  isFeatured: boolean;
  isFamilyOwned: boolean;
  isActive: boolean;
  rating?: number;
  reviewCount?: number;
  jobCount?: number;
  _count?: { jobPostings: number };
  owner?: { id: string; name: string | null };
}

export interface MemoryItem {
  id: string;
  title: string;
  description: string | null;
  date: string | null;
  location: string | null;
  category: string;
  isPublic: boolean;
  userId: string;
  createdAt: string;
  user?: { id: string; name: string | null; image: string | null };
  media: MediaItem[];
}

export interface MediaItem {
  id: string;
  url: string;
  publicId: string | null;
  type: string;
  size: number | null;
  mimeType: string | null;
  memoryId: string | null;
  userId: string;
  createdAt: string;
  user?: { id: string; name: string | null };
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface JobProfileItem {
  id: string;
  userId: string;
  headline: string | null;
  summary: string | null;
  experience: Array<{ company: string; role: string; startDate?: string; endDate?: string; description?: string }> | null;
  education: Array<{ institution: string; degree: string; year?: string; field?: string }> | null;
  skills: string[];
  languages: string[];
  resumeUrl: string | null;
  linkedinUrl: string | null;
  githubUrl: string | null;
  portfolioUrl: string | null;
  expectedSalary: string | null;
  preferredLocations: string[];
  availability: string | null;
}

export interface ReportItem {
  id: string;
  reporterId: string;
  reportedId: string;
  type: string;
  reason: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
  reporter?: { id: string; name: string | null; email: string };
  reported?: { id: string; name: string | null; email: string };
}

export interface AuditLogItem {
  id: string;
  adminId: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  admin?: { id: string; name: string | null };
}

export interface Paginated<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ApiError {
  error: string;
  message?: string;
}
