import { 
  collection, 
  getDocs, 
  addDoc, 
  setDoc, 
  doc, 
  updateDoc, 
  query, 
  orderBy, 
  limit, 
  getDoc,
  where,
  deleteDoc,
  increment
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, auth, storage } from "./firebase";
import { safeParseDate } from "./dateUtils";
import { ForumPost, CitizenRequest, Campaign, Donation, JobListing, SupportCategory, RequestStatus, UserProfile, SlideshowImage, WebConfig, NewsArticle, CalendarEvent, Survey, SurveyOption, VolunteerRegistration, OfficialPartner, SystemBadge, PartyContribution, GalleryImage, PolicyDocument } from "../types";
import { MTTQ_REPORT_REQUESTS, MTTQ_REPORT_DONATIONS, MTTQ_REPORT_CAMPAIGNS } from "../constants";


export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): void {
  const errMsg = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  
  if (errMsg.includes("client is offline") || errMsg.includes("Failed to get document because the client is offline")) {
    console.warn(`Firestore Offline (${operationType}): ${path}`);
  } else if (errMsg.includes("permission-denied") || errMsg.includes("Missing or insufficient permissions")) {
    console.warn(`Firestore Permission Denied (${operationType}): ${path}. This is expected for non-admin users on protected paths.`);
  } else {
    console.error(`Firestore Error Detailed Info: `, JSON.stringify(errInfo));
  }
  
  
}

// --- Storage Helpers ---
export async function uploadImageToStorage(file: File, folder: string = "general"): Promise<string> {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `${folder}/${fileName}`);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return downloadUrl;
  } catch (err) {
    console.error("Error uploading to Firebase Storage:", err);
    throw err;
  }
}

export async function deleteImageFromStorage(url: string): Promise<void> {
  if (!url || !url.includes("firebasestorage.googleapis.com")) return;
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn("Error deleting from Firebase Storage (it might not exist):", err);
  }
}

// Fetch single user profile
export async function fetchUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const data = userDoc.data() as UserProfile;
      data.uid = userDoc.id;
      if (typeof data.quarter === 'object' && data.quarter !== null) {
        data.quarter = (data.quarter as any).name || "";
      }
      return data;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `users/${uid}`);
  }
}

// Seed data definitions to populate empty collections
const SEED_REQUESTS: CitizenRequest[] = MTTQ_REPORT_REQUESTS;
const SEED_DONATIONS: Donation[] = MTTQ_REPORT_DONATIONS;
const SEED_CAMPAIGNS: Campaign[] = MTTQ_REPORT_CAMPAIGNS;

const SEED_JOBS: JobListing[] = [
  {
    id: "JOB-01",
    title: "Nhân viên Bán hàng Siêu thị",
    company: "Co.opmart Phú Lợi",
    salary: "6.500.000đ - 8.000.000đ/tháng",
    location: "Huỳnh Văn Lũy, Phú Lợi, Thành phố Hồ Chí Minh",
    description: "Tư vấn sản phẩm, sắp xếp hàng hóa lên kệ, tính tiền cho khách hàng tại quầy thanh toán.",
    requirements: [
      "Nam/Nữ từ 18 - 35 tuổi, nhanh nhẹn, trung thực.",
      "Tốt nghiệp THPT trở lên.",
      "Có khả năng làm việc xoay ca."
    ],
    contact: "Phòng Nhân sự Co.opmart Phú Lợi - ĐT: 0274.3821.xxx"
  },
  {
    id: "JOB-02",
    title: "Công nhân May mặc Công nghiệp",
    company: "Công ty May mặc Đại Đăng",
    salary: "7.500.000đ - 10.000.000đ/tháng",
    location: "Khu công nghiệp Phú Lợi, Phường Phú Lợi, Thành phố Hồ Chí Minh",
    description: "Vận hành máy may công nghiệp, may các chi tiết sản phẩm may mặc xuất khẩu theo dây chuyền chuyền.",
    requirements: [
      "Không yêu cầu kinh nghiệm (sẽ được đào tạo miễn phí).",
      "Sức khỏe tốt, chăm chỉ, có tính kỷ luật cao."
    ],
    contact: "Văn phòng Tuyển dụng - ĐT: 0274.3644.xxx"
  },
  {
    id: "JOB-03",
    title: "Nhân viên Giao nhận Hàng hóa (Shipper)",
    company: "Bưu chính Giao Hàng Nhanh Phú Lợi",
    salary: "9.000.000đ - 13.000.000đ/tháng",
    location: "Khu vực phường Phú Lợi và lân cận",
    description: "Nhận hàng từ bưu cục Phú Lợi và đi giao cho khách hàng theo tuyến đường được phân công.",
    requirements: [
      "Có xe máy riêng và điện thoại thông minh.",
      "Thông thạo đường xá tại phường Phú Lợi và lân cận.",
      "Có thái độ phục vụ thân thiện, lịch sự."
    ],
    contact: "Bưu cục Giao Hàng Nhanh Phú Lợi - ĐT: 0909.112.xxx"
  }
];


// Helper to seed Firestore if empty
export async function seedDatabaseIfEmpty() {
  return;
}

// Fetch all campaigns
export async function fetchAllCampaigns(): Promise<Campaign[]> {
  try {
    const campsCol = collection(db, "campaigns");
    const campsSnap = await getDocs(campsCol);
    const data: Campaign[] = [];
    campsSnap.forEach(doc => {
      data.push(doc.data() as Campaign);
    });
    return data;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, "campaigns");
    return [];
  }
}

// Fetch all jobs
export async function fetchAllJobs(): Promise<JobListing[]> {
  try {
    const jobsCol = collection(db, "jobs");
    const jobsSnap = await getDocs(jobsCol);
    const data: JobListing[] = [];
    jobsSnap.forEach(doc => {
      data.push(doc.data() as JobListing);
    });
    return data;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, "jobs");
    return [];
  }
}

// Save or update a campaign in Firestore
export async function saveCampaignToFirestore(campaign: Campaign): Promise<void> {
  try {
    const docRef = doc(db, "campaigns", campaign.id);
    await setDoc(docRef, campaign);
    console.log(`Successfully saved campaign ${campaign.id} to Firestore`);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `campaigns/${campaign.id}`);
  }
}

// Delete a campaign from Firestore
export async function deleteCampaignFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, "campaigns", id);
    await deleteDoc(docRef);
    console.log(`Successfully deleted campaign ${id} from Firestore`);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `campaigns/${id}`);
  }
}

// Save or update a job in Firestore
export async function saveJobToFirestore(job: JobListing): Promise<void> {
  try {
    const docRef = doc(db, "jobs", job.id);
    await setDoc(docRef, job);
    console.log(`Successfully saved job ${job.id} to Firestore`);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `jobs/${job.id}`);
  }
}

// Delete a job from Firestore
export async function deleteJobFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, "jobs", id);
    await deleteDoc(docRef);
    console.log(`Successfully deleted job ${id} from Firestore`);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `jobs/${id}`);
  }
}

// Fetch all requests
export async function fetchAllRequests(): Promise<CitizenRequest[]> {
  try {
    const reqsCol = collection(db, "requests");
    const reqsSnap = await getDocs(reqsCol);
    const data: CitizenRequest[] = [];
    reqsSnap.forEach(doc => {
      data.push(doc.data() as CitizenRequest);
    });
    // Sort by createdAt desc
    return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, "requests");
    return [];
  }
}

// Fetch all donations
export async function fetchAllDonations(): Promise<Donation[]> {
  try {
    const donsCol = collection(db, "donations");
    const donsSnap = await getDocs(donsCol);
    const data: Donation[] = [];
    donsSnap.forEach(doc => {
      data.push(doc.data() as Donation);
    });
    // Sort by createdAt desc
    return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, "donations");
    return [];
  }
}

// Submit citizen help request

export async function incrementUserContribution(userId: string | undefined): Promise<void> {
  if (!userId) return;
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const data = userDoc.data();
      const currentCount = data.contributionsCount || 0;
      await updateDoc(userRef, { contributionsCount: currentCount + 1 });
    }
  } catch (err) {
    console.error("Error incrementing user contribution:", err);
  }
}

export async function incrementUserShares(userId: string | undefined): Promise<void> {
  if (!userId) return;
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const data = userDoc.data();
      const currentCount = data.sharesCount || 0;
      await updateDoc(userRef, { sharesCount: currentCount + 1 });
    }
  } catch (err) {
    console.error("Error incrementing user shares:", err);
  }
}

export async function incrementUserEvents(userId: string | undefined): Promise<void> {
  if (!userId) return;
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const data = userDoc.data();
      const currentCount = data.eventsAttended || 0;
      await updateDoc(userRef, { eventsAttended: currentCount + 1 });
    }
  } catch (err) {
    console.error("Error incrementing user events:", err);
  }
}

export async function submitHelpRequestToFirestore(newReq: {

  fullName: string;
  phone: string;
  address: string;
  quarter: string;
  category: SupportCategory;
  description: string;
  userId?: string;
  email?: string;
}): Promise<CitizenRequest> {
  const reqId = `REQ-${Date.now().toString().slice(-4)}`;
  const fullRequest: CitizenRequest = {
    id: reqId,
    fullName: newReq.fullName,
    phone: newReq.phone,
    address: newReq.address,
    quarter: newReq.quarter,
    category: newReq.category,
    description: newReq.description,
    status: RequestStatus.SUBMITTED,
    createdAt: new Date().toISOString(),
    ...(newReq.userId ? { userId: newReq.userId } : {}),
    ...(newReq.email ? { email: newReq.email } : {})
  };

  try {
    await setDoc(doc(db, "requests", reqId), fullRequest);
    await incrementUserContribution(newReq.userId);
    return fullRequest;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `requests/${reqId}`);
  }
}

// Submit donation to Firestore and update campaign progress
export async function submitDonationToFirestore(donation: {
  donorName: string;
  amount: number;
  campaignId: string;
  message: string;
  userId?: string;
}): Promise<{ donation: Donation; updatedCampaign: Campaign | null }> {
  const donationId = `DON-${Date.now().toString().slice(-4)}`;
  
  // Find campaign details
  let campaignTitle = "Quỹ An Sinh Chung";
  let updatedCampaign: Campaign | null = null;
  
  try {
    const campDocRef = doc(db, "campaigns", donation.campaignId);
    let campDoc;
    try {
      campDoc = await getDoc(campDocRef);
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `campaigns/${donation.campaignId}`);
    }
    if (campDoc.exists()) {
      const campData = campDoc.data() as Campaign;
      campaignTitle = campData.title;
      
      const nextAmount = campData.currentAmount + donation.amount;
      updatedCampaign = {
        ...campData,
        currentAmount: nextAmount
      };
      // Update Campaign document
      try {
        await updateDoc(campDocRef, { currentAmount: nextAmount });
      } catch (e) {
        handleFirestoreError(e, OperationType.WRITE, `campaigns/${donation.campaignId}`);
      }
    }
  } catch (e) {
    console.error("Error reading/updating campaign inside donation transaction:", e);
  }

  const fullDonation: Donation = {
    id: donationId,
    donorName: donation.donorName,
    amount: donation.amount,
    campaignTitle,
    message: donation.message,
    createdAt: new Date().toISOString(),
    ...(donation.userId ? { userId: donation.userId } : {})
  };

  try {
    await setDoc(doc(db, "donations", donationId), fullDonation);
    await incrementUserContribution(donation.userId);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `donations/${donationId}`);
  }

  return { donation: fullDonation, updatedCampaign };
}

// Query requests by phone number or full name (fuzzy filter)
export async function lookupRequestsFromFirestore(searchQuery: string): Promise<CitizenRequest[]> {
  try {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return [];

    const reqsCol = collection(db, "requests");
    const snap = await getDocs(reqsCol);
    const results: CitizenRequest[] = [];
    
    snap.forEach(docSnap => {
      const data = docSnap.data() as CitizenRequest;
      const matchName = data.fullName.toLowerCase().includes(term);
      const matchPhone = data.phone.includes(term);
      const matchId = data.id.toLowerCase() === term;
      
      if (matchName || matchPhone || matchId) {
        results.push(data);
      }
    });

    return results;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, "requests");
  }
}

// Update citizen profile in Firestore
export async function updateUserProfileInFirestore(uid: string, profileData: Partial<UserProfile>): Promise<void> {
  try {
    const userDocRef = doc(db, "users", uid);
    await setDoc(userDocRef, profileData, { merge: true });
    console.log(`Successfully updated profile for user: ${uid}`);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `users/${uid}`);
  }
}

// Update citizen request status and officer notes in Firestore
export async function updateRequestInFirestore(requestId: string, status: RequestStatus, notes?: string, officerName?: string): Promise<void> {
  try {
    const reqDocRef = doc(db, "requests", requestId);
    const updateData: { status: RequestStatus; notes?: string; officerName?: string } = { status };
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    if (officerName !== undefined) {
      updateData.officerName = officerName;
    }
    await updateDoc(reqDocRef, updateData);
    console.log(`Successfully updated request ${requestId} to status ${status} by ${officerName || "unknown"}`);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `requests/${requestId}`);
  }
}

// Fetch all slideshow images from Firestore, with automatic fallback / seeding
export async function fetchSlideshowImagesFromFirestore(defaultImages: SlideshowImage[]): Promise<SlideshowImage[]> {
  try {
    const colRef = collection(db, "slideshow");
    const snapshot = await getDocs(colRef);
    const data: SlideshowImage[] = [];
    snapshot.forEach(docSnap => {
      data.push(docSnap.data() as SlideshowImage);
    });

    if (data.length === 0 && defaultImages && defaultImages.length > 0) {
      return defaultImages;
    }
    
    return data;
  } catch (err) {
    if (String(err).includes("offline")) {
      console.warn("Firestore Offline: slideshow fetch skipped.");
    } else {
      console.error("Error fetching slideshow:", err);
    }
    return defaultImages;
  }
}

// Save or update a slideshow image in Firestore
export async function saveSlideshowImageToFirestore(image: SlideshowImage): Promise<void> {
  try {
    const docRef = doc(db, "slideshow", image.id);
    await setDoc(docRef, image);
    console.log(`Successfully saved slideshow image ${image.id} to Firestore`);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `slideshow/${image.id}`);
  }
}

// Delete a slideshow image from Firestore
export async function deleteSlideshowImageFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, "slideshow", id);
    await deleteDoc(docRef);
    console.log(`Successfully deleted slideshow image ${id} from Firestore`);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `slideshow/${id}`);
  }
}

// Fetch all user profiles for administration (role assignment)
export async function fetchAllUserProfiles(): Promise<UserProfile[]> {
  try {
    const colRef = collection(db, "users");
    const snapshot = await getDocs(colRef);
    const data: UserProfile[] = [];
    snapshot.forEach(docSnap => {
      const uData = docSnap.data() as UserProfile;
      uData.uid = docSnap.id;
      if (typeof uData.quarter === 'object' && uData.quarter !== null) {
        uData.quarter = (uData.quarter as any).name || "";
      }
      data.push(uData);
    });
    return data;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, "users");
    return [];
  }
}

// Default Web Configuration
export const DEFAULT_WEB_CONFIG: WebConfig = {
  portalTitle: "Cổng An Sinh Xã Hội Số",
  emergencyPhone: "0909.112.xxx - 028.3821.xxx",
  contactEmail: "mttq.phuloi@binhduong.gov.vn",
  workingHours: "Thứ Hai - Thứ Sáu: 07:30 - 11:30 | 13:30 - 17:00",
  announcementText: "Ủy ban MTTQ Việt Nam phường Phú Lợi triển khai mở rộng tiếp nhận đăng ký cứu trợ trực tuyến, hỗ trợ tìm việc làm và kết nối quyên góp minh bạch.",
  maintenanceMode: false,
  heroSubtitle: "Chính Sách Nhân Văn • Nghĩa Tình Phú Lợi",
  heroTitleLine1: "Vì một cộng đồng",
  heroTitleLine2: "Phú Lợi thân thiện",
  heroTitleLine3: "văn minh, kết nối số.",
  heroDescription: "Chào mừng bà con nhân dân đến với <strong>Cổng An Sinh Xã Hội Số</strong>. Đây là không gian công nghệ nghĩa tình hỗ trợ kết nối trực tiếp Ủy ban MTTQ phường, các tổ chức đoàn thể và nhà hảo tâm với những hoàn cảnh khó khăn một cách nhanh chóng, minh bạch và trọn vẹn nhất.",
  customCategories: [],
  aiSystemPrompt: `Bạn là Trợ lý ảo An sinh xã hội số (An Sinh Số Phú Lợi) của Ủy ban MTTQ Việt Nam Phường Phú Lợi, Thành phố Hồ Chí Minh.
Nhiệm vụ của bạn là hỗ trợ, giải đáp thắc mắc cho người dân địa phương về các vấn đề an sinh xã hội, bảo trợ xã hội, chính sách hỗ trợ hộ nghèo, hộ cận nghèo, bảo hiểm xã hội (BHXH) tự nguyện, bảo hiểm y tế (BHYT) hộ gia đình, hỗ trợ việc làm, chăm sóc người có công, quyên góp ủng hộ quỹ từ thiện, đăng ký hiến máu, và cách sử dụng các dịch vụ trực tuyến trên cổng này.

Thông tin về phường Phú Lợi:
- Phú Lợi thuộc địa giới hành chính của Thành phố Hồ Chí Minh.
- Phường Phú Lợi có 9 khu phố hành chính (Khu phố 1, Khu phố 2, Khu phố 3, Khu phố 4, Khu phố 5, Khu phố 6, Khu phố 7, Khu phố 8, Khu phố 9).
- Trụ sở Ủy ban MTTQ Việt Nam Phường Phú Lợi nằm tại: Số 171 đường Huỳnh Văn Lũy, Khu phố Phú Thuận, Phường Phú Lợi, Thành phố Hồ Chí Minh.
- Hoạt động từ thiện: Xây nhà Đại đoàn kết, Tặng học bổng nâng bước em đến trường, Tặng thẻ BHYT miễn phí cho người nghèo.

Phong cách giao tiếp:
- Luôn luôn lịch sự, ôn tồn, tôn kính, tận tình và ấm áp chuẩn phong cách chính quyền phục vụ nhân dân.
- Luôn xưng xưng hô lễ phép: "Dạ, Trợ lý An sinh số phường Phú Lợi xin kính chào quý bà con..." hoặc "Dạ thưa anh/chị, về vấn đề này Ủy ban MTTQ phường có quy định..."
- Câu trả lời ngắn gọn, rõ ràng, gạch đầu dòng khoa học để mọi tầng lớp nhân dân (kể cả người già) dễ đọc.
- Không sử dụng từ ngữ học thuật khó hiểu hoặc tiếng Anh.`
};

// Fetch Web Configuration from Firestore
export async function fetchWebConfig(): Promise<WebConfig> {
  try {
    const docRef = doc(db, "config", "web_config");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as WebConfig;
      // Note: We don't auto-update here anymore to avoid permission errors for non-admins
      return data;
    } else {
      console.log("Web config document not found in Firestore.");
      // We don't auto-seed here to avoid permission errors. 
      // Seed should be done by an admin.
      return DEFAULT_WEB_CONFIG;
    }
  } catch (err) {
    // Only log real errors, not just missing docs
    if (String(err).includes("permissions")) {
      console.warn("Permission denied for fetchWebConfig, using defaults.");
    } else {
      handleFirestoreError(err, OperationType.GET, "config/web_config");
    }
    return DEFAULT_WEB_CONFIG;
  }
}

// Save Web Configuration to Firestore
export async function saveWebConfig(config: WebConfig): Promise<void> {
  try {
    const docRef = doc(db, "config", "web_config");
    const fullConfig = { ...DEFAULT_WEB_CONFIG, ...config };
    // Ensure no undefined values are sent to Firestore
    Object.keys(fullConfig).forEach(key => {
      if ((fullConfig as any)[key] === undefined) {
        (fullConfig as any)[key] = (DEFAULT_WEB_CONFIG as any)[key];
      }
    });
    await setDoc(docRef, fullConfig);
    console.log("Successfully saved web configuration to Firestore");
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "config/web_config");
  }
}


// Increment visitor stats
export async function incrementVisitCount(): Promise<{ totalVisits: number; onlineCount: number }> {
  try {
    const docRef = doc(db, "config", "visitor_stats");
    // Try to update first. If it fails, maybe the doc doesn't exist.
    try {
      await updateDoc(docRef, {
        totalVisits: increment(1)
      });
      const updatedSnap = await getDoc(docRef);
      if (updatedSnap.exists()) {
        return updatedSnap.data() as { totalVisits: number; onlineCount: number };
      }
    } catch (updateErr) {
      // If update fails because document doesn't exist, try to set it (only if admin)
      if (String(updateErr).includes("not-found")) {
        const initialStats = { totalVisits: 14205, onlineCount: 18 };
        // We only try to set if we have permission.
        await setDoc(docRef, initialStats);
        return initialStats;
      }
      throw updateErr;
    }
    return { totalVisits: 14205, onlineCount: 18 };
  } catch (err) {
    if (String(err).includes("offline")) { 
      console.warn("Firestore Offline: visitor_stats update skipped."); 
    } else if (String(err).includes("permissions")) {
      console.warn("Permission denied for visitor_stats update.");
    } else { 
      console.error("Error updating visitor stats:", err); 
    }
    return { totalVisits: 14205, onlineCount: 18 };
  }
}

// Fetch visitor stats
export async function fetchVisitorStats(): Promise<{ totalVisits: number; onlineCount: number }> {
  const isNewSession = !sessionStorage.getItem('phuloi_visited');
  if (isNewSession) {
    sessionStorage.setItem('phuloi_visited', '1');
    return incrementVisitCount();
  }
  try {
    const docRef = doc(db, "config", "visitor_stats");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as { totalVisits: number; onlineCount: number };
    } else {
      // If doc doesn't exist, incrementVisitCount will try to create it
      return incrementVisitCount();
    }
  } catch (err) {
    if (String(err).includes("offline")) { 
      console.warn("Firestore Offline: visitor_stats fetch skipped."); 
    } else if (String(err).includes("permissions")) {
      console.warn("Permission denied for visitor_stats fetch.");
    } else { 
      console.error("Error fetching visitor stats:", err); 
    }
    return { totalVisits: 14205, onlineCount: 18 };
  }
}

// Fetch all Facebook news items from Firestore, with automatic fallback / seeding
export async function fetchNewsArticleFromFirestore(defaultNews: NewsArticle[]): Promise<NewsArticle[]> {
  try {
    const colRef = collection(db, "news_articles");
    const snapshot = await getDocs(colRef);
    const data: NewsArticle[] = [];
    snapshot.forEach(docSnap => {
      data.push(docSnap.data() as NewsArticle);
    });

    if (data.length === 0 && defaultNews && defaultNews.length > 0) {
      // Note: We don't auto-seed here to avoid permission errors for non-admins.
      // Admins should seed via the Admin Panel if needed.
      return defaultNews;
    }
    
    // sort newest first using safeParseDate utility
    data.sort((a, b) => {
      const dateA = safeParseDate(a.date || a.publishedAt);
      const dateB = safeParseDate(b.date || b.publishedAt);
      return dateB - dateA;
    });
    return data;
  } catch (err) {
    if (String(err).includes("permissions")) {
      console.warn("Permission denied for fetchNewsArticleFromFirestore, using defaults.");
    } else {
      handleFirestoreError(err, OperationType.GET, "news_articles");
    }
    return defaultNews || [];
  }
}

export async function saveNewsArticleToFirestore(item: NewsArticle): Promise<void> {
  try {
    const docRef = doc(db, "news_articles", item.id);
    await setDoc(docRef, item);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "news_articles");
  }
}

export async function deleteNewsArticleFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, "news_articles", id);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, "news_articles");
  }
}
// --- Calendar Events ---
export async function fetchEventsFromFirestore(defaultEvents: CalendarEvent[]): Promise<CalendarEvent[]> {
  try {
    const eventsCol = collection(db, "events");
    const snapshot = await getDocs(eventsCol);
    if (snapshot.empty && defaultEvents.length > 0) {
      return defaultEvents;
    }
    const events: CalendarEvent[] = [];
    snapshot.forEach((docSnap) => {
      events.push(docSnap.data() as CalendarEvent);
    });
    // Sort by date roughly (you could do better date parsing if needed)
    return events;
  } catch (err) {
    console.error("Error fetching events:", err);
    return defaultEvents;
  }
}

export async function saveEventToFirestore(evt: CalendarEvent): Promise<void> {
  try {
    const docRef = doc(db, "events", evt.id);
    await setDoc(docRef, evt);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "events");
  

}


}

export async function deleteEventFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, "events", id);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, "events");
  }
}

// --- Surveys / Public Polls ---
export async function fetchSurveysFromFirestore(defaultSurveys: Survey[]): Promise<Survey[]> {
  try {
    const colRef = collection(db, "surveys");
    const snapshot = await getDocs(colRef);
    if (snapshot.empty && defaultSurveys.length > 0) {
      return defaultSurveys;
    }
    const surveys: Survey[] = [];
    snapshot.forEach((docSnap) => {
      surveys.push(docSnap.data() as Survey);
    });
    // Sort by createdAt newest first
    surveys.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return surveys;
  } catch (err) {
    console.error("Error fetching surveys:", err);
    return defaultSurveys;
  }
}

export async function saveSurveyToFirestore(survey: Survey): Promise<void> {
  try {
    const docRef = doc(db, "surveys", survey.id);
    await setDoc(docRef, survey);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "surveys");
  }
}

export async function deleteSurveyFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, "surveys", id);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, "surveys");
  }
}

export async function submitVoteToFirestore(surveyId: string, optionId: string, userId: string): Promise<void> {
  try {
    const docRef = doc(db, "surveys", surveyId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error("Survey not found");
    }
    const survey = docSnap.data() as Survey;
    
    // Check if user already voted
    const votedUserIds = survey.votedUserIds || [];
    if (votedUserIds.includes(userId)) {
      throw new Error("User has already voted in this survey");
    }
    
    // Update the option votes and votedUserIds
    const updatedOptions = survey.options.map(opt => {
      if (opt.id === optionId) {
        return { ...opt, votes: opt.votes + 1 };
      }
      return opt;
    });
    
    const updatedVotedUserIds = [...votedUserIds, userId];
    
    await updateDoc(docRef, {
      options: updatedOptions,
      votedUserIds: updatedVotedUserIds
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `surveys/${surveyId}`);
  }
}

// Submit volunteer registration
export async function submitVolunteerRegistrationToFirestore(reg: {
  fullName: string;
  phone: string;
  email: string;
  quarter: string;
  eventId: string;
  eventTitle: string;
  skills: string;
  reason: string;
  userId?: string;
}): Promise<VolunteerRegistration> {
  const regId = `VOL-${Date.now().toString().slice(-4)}`;
  const fullRegistration: VolunteerRegistration = {
    id: regId,
    fullName: reg.fullName,
    phone: reg.phone,
    email: reg.email,
    quarter: reg.quarter,
    eventId: reg.eventId,
    eventTitle: reg.eventTitle,
    skills: reg.skills,
    reason: reg.reason,
    status: "Chờ duyệt",
    createdAt: new Date().toISOString(),
    ...(reg.userId ? { userId: reg.userId } : {})
  };

  try {
    await setDoc(doc(db, "volunteerRegistrations", regId), fullRegistration);
    await incrementUserContribution(reg.userId);
    return fullRegistration;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `volunteerRegistrations/${regId}`);
  }
}

// Fetch all volunteer registrations
export async function fetchVolunteerRegistrationsFromFirestore(): Promise<VolunteerRegistration[]> {
  try {
    const querySnapshot = await getDocs(collection(db, "volunteerRegistrations"));
    const list: VolunteerRegistration[] = [];
    querySnapshot.forEach((docSnap) => {
      list.push(docSnap.data() as VolunteerRegistration);
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, "volunteerRegistrations");
    return [];
  }
}

// Update volunteer registration status
export async function updateVolunteerRegistrationStatusInFirestore(regId: string, status: "Chờ duyệt" | "Đã duyệt" | "Đã từ chối"): Promise<void> {
  try {
    const docRef = doc(db, "volunteerRegistrations", regId);
    await updateDoc(docRef, { status });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `volunteerRegistrations/${regId}`);
  }
}

// --- Official Partners ---
export async function fetchOfficialPartnersFromFirestore(defaultPartners: OfficialPartner[]): Promise<OfficialPartner[]> {
  try {
    const colRef = collection(db, "official_partners");
    const snapshot = await getDocs(colRef);
    if (snapshot.empty && defaultPartners.length > 0) {
      return defaultPartners;
    }
    const data: OfficialPartner[] = [];
    snapshot.forEach((docSnap) => {
      data.push(docSnap.data() as OfficialPartner);
    });
    return data;
  } catch (err) {
    if (String(err).includes("permissions")) {
      console.warn("Permission denied for fetchOfficialPartnersFromFirestore, using defaults.");
    } else {
      handleFirestoreError(err, OperationType.GET, "official_partners");
    }
    return defaultPartners;
  }
}

export async function saveOfficialPartnerToFirestore(partner: OfficialPartner): Promise<void> {
  try {
    const docRef = doc(db, "official_partners", partner.id);
    await setDoc(docRef, partner);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `official_partners/${partner.id}`);
    throw err;
  }
}

export async function deleteOfficialPartnerFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, "official_partners", id);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `official_partners/${id}`);
    throw err;
  }
}




// --- SYSTEM BADGES ---
export async function fetchSystemBadges(): Promise<SystemBadge[]> {
  try {
    const qSnap = await getDocs(collection(db, "system_badges"));
    return qSnap.docs.map(doc => doc.data() as SystemBadge);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, "system_badges");
    return [];
  }
}

export async function saveSystemBadge(badge: SystemBadge): Promise<void> {
  try {
    const docRef = doc(db, "system_badges", badge.id);
    await setDoc(docRef, badge);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "system_badges");
  }
}

export async function deleteSystemBadge(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "system_badges", id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, "system_badges");
  }
}

export async function fetchPolicyDocumentsFromFirestore(defaultDocs: import('../types').PolicyDocument[]): Promise<import('../types').PolicyDocument[]> {
  try {
    const q = query(collection(db, "policyDocuments"));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return defaultDocs;
    }
    const result: import('../types').PolicyDocument[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      result.push({
        id: doc.id,
        title: data.title,
        description: data.description,
        category: data.category,
        agency: data.agency,
        date: data.date,
        link: data.link,
        color: data.color,
        bg: data.bg,
        border: data.border,
        iconName: data.iconName,
        createdAt: data.createdAt,
      });
    });
    return result.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeB - timeA;
    });
  } catch (error) {
    console.error("Error fetching policy documents:", error);
    return defaultDocs;
  }
}

export async function savePolicyDocumentToFirestore(policyDoc: import('../types').PolicyDocument): Promise<void> {
  try {
    const docRef = doc(db, "policyDocuments", policyDoc.id);
    await setDoc(docRef, policyDoc);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `policyDocuments/${policyDoc.id}`);
    throw error;
  }
}

export async function deletePolicyDocumentFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, "policyDocuments", id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `policyDocuments/${id}`);
    throw error;
  }
}

// Save citizen 5-star rating for a resolved/completed request
export async function saveRequestRatingInFirestore(
  requestId: string,
  rating: number,
  ratingComment?: string,
  ratingOfficer?: string
): Promise<void> {
  try {
    const reqDocRef = doc(db, "requests", requestId);
    const updateData: {
      rating: number;
      ratingComment: string;
      ratedAt: string;
      ratingOfficer?: string;
    } = {
      rating,
      ratingComment: ratingComment || "",
      ratedAt: new Date().toISOString()
    };
    if (ratingOfficer) {
      updateData.ratingOfficer = ratingOfficer;
    }
    await updateDoc(reqDocRef, updateData);
    console.log(`Successfully saved rating for request ${requestId}: ${rating} stars`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `requests/${requestId}`);
    throw error;
  }
}

// Fetch political contributions / feedback
export async function fetchPartyContributionsFromFirestore(): Promise<PartyContribution[]> {
  try {
    const colRef = collection(db, "partyContributions");
    const snapshot = await getDocs(colRef);
    const result: PartyContribution[] = [];
    snapshot.forEach((d) => {
      const data = d.data();
      result.push({
        id: d.id,
        userName: data.userName || "Ẩn danh",
        userPhone: data.userPhone,
        userEmail: data.userEmail,
        userQuarter: data.userQuarter,
        category: data.category || "Ý kiến khác",
        title: data.title || "",
        content: data.content || "",
        isAnonymous: data.isAnonymous === true,
        status: data.status || "Mới nhận",
        responseNotes: data.responseNotes,
        respondedBy: data.respondedBy,
        respondedAt: data.respondedAt,
        createdAt: data.createdAt || new Date().toISOString(),
        userId: data.userId,
      });
    });
    // Sort by createdAt descending
    return result.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeB - timeA;
    });
  } catch (error) {
    console.error("Error fetching party contributions:", error);
    return [];
  }
}

// Save a new political contribution / feedback
export async function savePartyContributionToFirestore(
  contribution: Omit<PartyContribution, "id" | "createdAt">
): Promise<string> {
  try {
    const colRef = collection(db, "partyContributions");
    const newDoc = {
      ...contribution,
      createdAt: new Date().toISOString()
    };
    const docRef = await addDoc(colRef, newDoc);
    console.log(`Successfully added party contribution with ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, "partyContributions");
    throw error;
  }
}

// Update response or status of political contribution
export async function updatePartyContributionInFirestore(
  contributionId: string,
  updates: Partial<PartyContribution>
): Promise<void> {
  try {
    const docRef = doc(db, "partyContributions", contributionId);
    await updateDoc(docRef, updates as any);
    console.log(`Successfully updated party contribution ${contributionId}`);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `partyContributions/${contributionId}`);
    throw error;
  }
}

// --- Forum Post Functions ---

export async function fetchForumPostsFromFirestore(): Promise<ForumPost[]> {
  try {
    const colRef = collection(db, "forum_posts");
    const snapshot = await getDocs(colRef);
    const data: ForumPost[] = [];
    snapshot.forEach(docSnap => {
      data.push(docSnap.data() as ForumPost);
    });
    return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, "forum_posts");
    return [];
  }
}

export async function saveForumPostToFirestore(item: ForumPost): Promise<void> {
  try {
    const docRef = doc(db, "forum_posts", item.id);
    await setDoc(docRef, item);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "forum_posts");
    throw err;
  }
}

export async function deleteForumPostFromFirestore(id: string): Promise<void> {
  try {
    const docRef = doc(db, "forum_posts", id);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, "forum_posts");
    throw err;
  }
}

export async function fetchGalleryImagesFromFirestore(): Promise<GalleryImage[]> {
  try {
    const colRef = collection(db, "community_gallery");
    const q = query(colRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const data: GalleryImage[] = [];
    snapshot.forEach((docSnap) => {
      data.push({ id: docSnap.id, ...docSnap.data() } as GalleryImage);
    });
    return data;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, "community_gallery");
    return [];
  }
}

export async function saveGalleryImageToFirestore(image: GalleryImage): Promise<void> {
  try {
    const docRef = doc(db, "community_gallery", image.id);
    await setDoc(docRef, image);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `community_gallery/${image.id}`);
    throw err;
  }
}

export async function deleteGalleryImageFromFirestore(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, "community_gallery", id));
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `community_gallery/${id}`);
    throw err;
  }
}
