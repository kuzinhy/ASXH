/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum SupportCategory {
  FOOD = "Lương thực, Nhu yếu phẩm",
  MEDICAL = "Chăm sóc Y tế, Thẻ BHYT",
  FINANCIAL = "Trợ cấp Khó khăn, Tài chính",
  EDUCATION = "Học bổng, Đồ dùng học tập",
  HOUSING = "Sửa chữa nhà, Nhà tình thương",
  JOB = "Hỗ trợ việc làm",
}

export enum RequestStatus {
  SUBMITTED = "Đã tiếp nhận",
  VERIFYING = "Đang xác minh",
  APPROVED = "Đã duyệt hỗ trợ",
  COMPLETED = "Đã hoàn thành",
}

export interface CitizenRequest {
  id: string;
  fullName: string;
  phone: string;
  address: string; // Specific address in Phu Loi Ward (e.g., KP3)
  quarter: string; // Khu phố 1 - 9
  category: SupportCategory | string;
  description: string;
  status: RequestStatus;
  createdAt: string;
  notes?: string;
  userId?: string; // Linked user ID for privacy/author visibility
  email?: string; // Contact email for progress updates
  rating?: number; // 1 to 5 star rating
  ratingComment?: string; // Optional user review
  ratingOfficer?: string; // Officer's name who resolved the request (if known)
  ratedAt?: string; // Timestamp of when they rated
  officerName?: string; // Name of officer who resolved/approved
}

export interface Campaign {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  category: string;
  imageUrl?: string;
}

export interface Donation {
  id: string;
  donorName: string;
  amount: number;
  campaignTitle: string;
  message: string;
  createdAt: string;
  userId?: string;
}

export interface JobListing {
  id: string;
  title: string;
  company: string;
  salary: string;
  location: string;
  description: string;
  requirements: string[];
  contact: string;
  imageUrl?: string;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

export interface UserBadgeInfo {
  badgeId: string;
  level: number; // 1 to 10
  grantedAt?: string;
}

export interface SystemBadge {
  id: string;
  name: string;
  description: string;
  iconName: string;
  color: string; // Tailwind color class e.g. "bg-sky-500 text-white"
}
export interface UserProfile {

  uid: string;
  email: string;  avatarUrl?: string;
  fullName: string;
  phone: string;
  address: string;
  quarter: string;
  isVolunteer?: boolean;
  volunteerQuarters?: string[];
  isAdmin?: boolean; // System administrator
  isOfficer?: boolean; // Neighborhood/Quarter officer
  officerQuarter?: string; // Specific quarter they oversee
  badges?: string[];
  systemBadges?: UserBadgeInfo[];
  // Activity tracking for ranking
  visitDays?: number;
  lastVisitDate?: string;
  contributionsCount?: number;
  eventsAttended?: number;
  sharesCount?: number;
  activityPoints?: number;
}

export interface SlideshowImage {
  id: string;
  title: string;
  caption: string;
  url: string;
  date: string;
  source: string;
}

export interface WebConfig {
  portalTitle: string;
  emergencyPhone: string;
  contactEmail: string;
  workingHours: string;
  announcementText: string;
  maintenanceMode: boolean;
  heroSubtitle?: string;
  heroTitleLine1?: string;
  heroTitleLine2?: string;
  heroTitleLine3?: string;
  heroDescription?: string;
  customCategories?: string[];
  enableDonationEmail?: boolean;
  aiSystemPrompt?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  body: string;
  category: string;
  imageUrl: string;
  date: string;
  originalUrl: string;
  publishedAt?: string;
  status?: "published" | "draft" | "archived";
  author?: string;
  viewsCount?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // e.g. "18/07/2026"
  time: string; // e.g. "07:00 - 11:00"
  location: string;
  type: string;
  description: string;
  iconName: string; // to store icon name as string
  color: string;
  textColor: string;
  bgColor: string;
}

export interface SurveyOption {
  id: string;
  text: string;
  votes: number;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  category: "vệ sinh môi trường" | "an ninh trật tự" | "chính sách mới" | "khác" | string;
  options: SurveyOption[];
  createdAt: string;
  createdBy: string;
  votedUserIds?: string[];
}

export interface VolunteerRegistration {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  quarter: string;
  eventId: string;
  eventTitle: string;
  skills: string;
  reason: string;
  status: "Chờ duyệt" | "Đã duyệt" | "Đã từ chối";
  createdAt: string;
  userId?: string;
}

export interface OfficialPartner {
  id: string;
  name: string;
  role: string;
  imageUrl: string;
  description?: string;
  amount?: string;
  createdAt?: string;
}





export interface PolicyDocument {
  id: string;
  title: string;
  description: string;
  category: string;
  agency: string;
  date: string;
  link: string;
  color?: string;
  bg?: string;
  border?: string;
  iconName?: string;
  createdAt: string;
}

export interface PartyContribution {
  id: string;
  userName: string;
  userPhone?: string;
  userEmail?: string;
  userQuarter?: string;
  category: string;
  title: string;
  content: string;
  isAnonymous: boolean;
  status: "Mới nhận" | "Đang tiếp thu" | "Đã tiếp thu" | "Đã giải quyết" | "Từ chối";
  responseNotes?: string;
  respondedBy?: string;
  respondedAt?: string;
  createdAt: string;
  userId?: string;
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorId?: string;
  category: "Phản ánh" | "Cần trợ giúp" | "Thảo luận" | "Góp ý";
  status: "Chờ xử lý" | "Đang giải quyết" | "Đã giải quyết";
  isApproved?: boolean;
  officialReply?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt?: string;
  quarter?: string;
  likesCount?: number;
  commentsCount?: number;
  likedBy?: string[];
  imageUrl?: string;
}
