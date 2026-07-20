import React, { useState, useEffect, useRef, useCallback } from "react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Stats from "./components/Stats";
import ServiceHub from "./components/ServiceHub";
import PartnersMarquee from "./components/PartnersMarquee";
import ImageSlideshow from "./components/ImageSlideshow";
import AIChatbot from "./components/AIChatbot";
import FloatingChat from "./components/FloatingChat";
import ContactMap from "./components/ContactMap";
import Footer from "./components/Footer";
import PushNotificationCenter from "./components/PushNotificationCenter";
import KindnessHearts from "./components/KindnessHearts";
import AuthModal from "./components/AuthModal";
import ScrollReveal from "./components/ScrollReveal";
import PartnerList from "./components/PartnerList";
import NewsFeed from "./components/NewsFeed";
import CommunityForum from "./components/CommunityForum";
import EventCalendar from "./components/EventCalendar";
import { PolicyDocuments } from "./components/PolicyDocuments";
import CitizenSurvey from "./components/CitizenSurvey";
import CircuitBackground from "./components/CircuitBackground";
import { sendEmailNotification } from "./lib/email";
import { CitizenRequest, Campaign, Donation, JobListing, SupportCategory, RequestStatus, UserProfile, WebConfig, NewsArticle, CalendarEvent, OfficialPartner, PartyContribution } from "./types";
import { auth, db } from "./lib/firebase";
import { onAuthStateChanged, signOut, signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from "firebase/auth";
import { MTTQ_REPORT_CAMPAIGNS, MTTQ_REPORT_DONATIONS, MTTQ_REPORT_REQUESTS } from "./constants";

import { 
  seedDatabaseIfEmpty, 
  fetchAllCampaigns, 
  fetchAllJobs, 
  fetchAllRequests, 
  fetchAllDonations, 
  submitHelpRequestToFirestore, 
  submitDonationToFirestore,
  fetchUserProfile,
  updateUserProfileInFirestore,
  updateRequestInFirestore,
  fetchWebConfig,
  fetchNewsArticleFromFirestore,
  fetchEventsFromFirestore,
  fetchPolicyDocumentsFromFirestore,
  saveEventToFirestore,
  deleteEventFromFirestore,
  saveNewsArticleToFirestore,
  deleteNewsArticleFromFirestore,
  incrementVisitCount,
  fetchVisitorStats,
  fetchOfficialPartnersFromFirestore,
  saveOfficialPartnerToFirestore,
  deleteOfficialPartnerFromFirestore,
  saveRequestRatingInFirestore,
  fetchPartyContributionsFromFirestore,
  savePartyContributionToFirestore,
  updatePartyContributionInFirestore
} from "./lib/firebaseSync";
import { logCurrentVisit } from "./lib/analyticsSync";
import { 
  Heart, 
  Sparkles, 
  AlertCircle, 
  Landmark, 
  BellRing, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  X,
  Share2,
  Trash2,
  Globe,
  Loader2,
  ArrowLeft,
  Home,
  LayoutDashboard,
  ShieldCheck,
  Users,
  Settings,
  Gift,
  Briefcase,
  FileText,
  LogOut,
  Calendar,
  Brain,
  Award,
  Trophy,
  Activity,
  Vote,
  Edit3,
  MessageSquare,
  ImagePlus,
  HeartHandshake
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { collection, onSnapshot, doc } from "firebase/firestore";

import AdminPanel from "./components/AdminPanel";
import { playNotificationSound, playSuccessSound } from "./utils/sound";

// Offline Fallback Seed Data to ensure perfect operation on Vercel
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

const DEFAULT_OFFICIAL_PARTNERS: OfficialPartner[] = [
  {
    id: "partner-vcb",
    name: "Ngân hàng Vietcombank",
    role: "Cổng Thanh Toán",
    imageUrl: "https://lh3.googleusercontent.com/d/1ETgKsPbguiIgbnD9QpCA0sytVBuA0Tvf",
    amount: "Bảo Trợ Cổng Số",
    description: "Tích hợp và bảo trợ kỹ thuật cho cổng thanh toán điện tử, hỗ trợ đối soát giao dịch quyên góp tự động và tức thời."
  },
  {
    id: "partner-honda",
    name: "Công ty Honda Việt Nam",
    role: "Đơn Vị Đồng Hành",
    imageUrl: "https://lh3.googleusercontent.com/d/12ddRLYeALo-l1i4Agxpgu5JukXck33zo",
    amount: "Đồng Hành An Sinh",
    description: "Đồng hành hỗ trợ các chương trình an sinh xã hội, phát triển hạ tầng và trang bị phương tiện an toàn giao thông cho địa phương."
  },
  {
    id: "partner-vinfast",
    name: "Vinfast Nam Thái",
    role: "Đơn Vị Đồng Hành",
    imageUrl: "https://lh3.googleusercontent.com/d/1_OBjE0iuT6WBxlbga8KGpfTEK8EEXhfR",
    amount: "Đồng Hành An Sinh",
    description: "Hỗ trợ các chương trình phương tiện xanh, đồng hành cùng các hoạt động cộng đồng và an sinh xã hội trên địa bàn."
  },
  {
    id: "partner-ielts",
    name: "IELTS MASTER",
    role: "Bảo Trợ Giáo Dục",
    imageUrl: "https://lh3.googleusercontent.com/d/1pcLK4-x1xTrg7fYIGvXgDIPSVEBIY_H6",
    amount: "Học Bổng Chắp Cánh",
    description: "Đồng hành tài trợ các suất học bổng tiếng Anh, phát triển phong trào học tập và nâng cao năng lực ngoại ngữ cho thanh thiếu nhi."
  },
  {
    id: "partner-chanhung",
    name: "Chấn Hưng Holdings",
    role: "Đơn Vị Đồng Hành",
    imageUrl: "https://lh3.googleusercontent.com/d/1PoOcGBW3fRT3A6pHGxSuWu83-dElHkOu",
    amount: "Đồng Hành Phát Triển",
    description: "Tài trợ xây dựng nhà nhân ái, hỗ trợ cải thiện nhà ở và cơ sở hạ tầng an sinh cho các hộ hoàn cảnh khó khăn."
  },
  {
    id: "partner-matsaigon",
    name: "Bệnh viện mắt Sài Gòn",
    role: "Bảo Trợ Sức Khỏe",
    imageUrl: "https://lh3.googleusercontent.com/d/1ijJe9fnDvLW8itFsqGHEhi0hBuCIsc-W",
    amount: "Chương Trình Sáng Mắt",
    description: "Đồng hành khám mắt miễn phí, tài trợ mổ đục thủy tinh thể cho người cao tuổi và hoàn cảnh khó khăn tại địa phương."
  }
];

export default function App() {
  const [requests, setRequests] = useState<CitizenRequest[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [webConfig, setWebConfig] = useState<WebConfig | null>(null);
  const [newsArticles, setNewsArticle] = useState<NewsArticle[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [policyDocuments, setPolicyDocuments] = useState<import('./types').PolicyDocument[]>([]);
  const [officialPartners, setOfficialPartners] = useState<OfficialPartner[]>([]);
  const [visitorStats, setVisitorStats] = useState<{ totalVisits: number; onlineCount: number }>({ totalVisits: 14205, onlineCount: 18 });
  const [partyContributions, setPartyContributions] = useState<PartyContribution[]>([]);
  
  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const cachedLocal = localStorage.getItem("phuloi_current_user");
      const cachedSession = sessionStorage.getItem("phuloi_current_user");
      const cached = cachedLocal || cachedSession;
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const recentNewsCreatedRef = useRef<Set<string>>(new Set());
  const requestsRef = useRef<CitizenRequest[]>([]);
  const newsArticlesRef = useRef<NewsArticle[]>([]);
  const currentUserRef = useRef<UserProfile | null>(null);

  useEffect(() => {
    requestsRef.current = requests;
  }, [requests]);

  useEffect(() => {
    newsArticlesRef.current = newsArticles;
  }, [newsArticles]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Automatic Toast Notifications
  const [toasts, setToasts] = useState<{
    id: string;
    type: "success" | "info" | "warning" | "error";
    title: string;
    message: string;
  }[]>([]);

  const showToast = useCallback((
    title: string,
    message: string,
    type: "success" | "info" | "warning" | "error" = "info",
    duration = 10000
  ) => {
    const id = Date.now().toString() + Math.random().toString().slice(-4);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [adminActiveTab, setAdminActiveTab] = useState<"roles" | "config" | "campaigns" | "jobs" | "requests" | "notifications" | "news" | "events" | "analytics" | "brain" | "partners" | "partyFeedback" | "aiPersonality" | "volunteers" | "imageUpload" | string>(() => {
    try {
      const cached = sessionStorage.getItem("phuloi_admin_active_tab");
      return (cached as any) || "roles";
    } catch {
      return "roles";
    }
  });
  const [isAdminViewActive, setIsAdminViewActive] = useState(() => {
    try {
      return sessionStorage.getItem("phuloi_is_admin_view_active") === "true";
    } catch {
      return false;
    }
  });
  const isRestoringRef = useRef(false);

  // Bookmarks / Yêu thích state with localStorage persistence
  const [bookmarkedCampaignIds, setBookmarkedCampaignIds] = useState<string[]>(() => {
    try {
      const cached = localStorage.getItem("phuloi_bookmarked_campaign_ids");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [bookmarkedNewsIds, setBookmarkedNewsIds] = useState<string[]>(() => {
    try {
      const cached = localStorage.getItem("phuloi_bookmarked_news_ids");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const handleToggleBookmarkCampaign = useCallback((id: string) => {
    setBookmarkedCampaignIds(prev => {
      const updated = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      try {
        localStorage.setItem("phuloi_bookmarked_campaign_ids", JSON.stringify(updated));
      } catch (err) {
        console.warn("LocalStorage access failed:", err);
      }
      showToast(
        prev.includes(id) ? "Đã bỏ yêu thích" : "Đã thêm yêu thích",
        prev.includes(id) ? "Chiến dịch đã được xóa khỏi danh sách yêu thích" : "Chiến dịch đã được thêm vào danh sách yêu thích thành công",
        "success"
      );
      return updated;
    });
  }, [showToast]);

  const handleToggleBookmarkNews = useCallback((id: string) => {
    setBookmarkedNewsIds(prev => {
      const updated = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      try {
        localStorage.setItem("phuloi_bookmarked_news_ids", JSON.stringify(updated));
      } catch (err) {
        console.warn("LocalStorage access failed:", err);
      }
      showToast(
        prev.includes(id) ? "Đã bỏ yêu thích" : "Đã thêm yêu thích",
        prev.includes(id) ? "Tin tức đã được xóa khỏi danh sách yêu thích" : "Tin tức đã được thêm vào danh sách yêu thích thành công",
        "success"
      );
      return updated;
    });
  }, [showToast]);

  // Sync admin view states to sessionStorage to persist across page refreshes (F5)
  useEffect(() => {
    try {
      if (isAdminViewActive) {
        sessionStorage.setItem("phuloi_is_admin_view_active", "true");
      } else {
        sessionStorage.removeItem("phuloi_is_admin_view_active");
      }
    } catch (err) {
      console.warn("SessionStorage access error:", err);
    }
  }, [isAdminViewActive]);

  useEffect(() => {
    try {
      sessionStorage.setItem("phuloi_admin_active_tab", adminActiveTab);
    } catch (err) {
      console.warn("SessionStorage access error:", err);
    }
  }, [adminActiveTab]);

  // Log visitor activity to access logs
  useEffect(() => {
    if (loading) return; // wait until initialized
    
    const page = isAdminViewActive ? "Bảng quản trị" : "Trang chủ";
    const action = isAdminViewActive ? "Xem bảng quản trị" : "Xem trang";
    
    logCurrentVisit(currentUser, page, action).catch(err => {
      console.warn("Could not log visitor activity:", err);
    });
  }, [isAdminViewActive, currentUser, loading]);

  // Load offline fallback data from local storage or seeds
  const loadFallbackData = () => {
    try {
      const cachedReqs = localStorage.getItem("phuloi_requests");
      const cachedCamps = localStorage.getItem("phuloi_campaigns");
      const cachedDons = localStorage.getItem("phuloi_donations");
      const cachedJobs = localStorage.getItem("phuloi_jobs");
      const cachedNews = localStorage.getItem("phuloi_news_articles");
      const cachedEvents = localStorage.getItem("phuloi_events");
      const cachedConfig = localStorage.getItem("phuloi_web_config");

      if (cachedReqs) setRequests(JSON.parse(cachedReqs));
      else {
        setRequests(SEED_REQUESTS);
        localStorage.setItem("phuloi_requests", JSON.stringify(SEED_REQUESTS));
      }

      if (cachedCamps) setCampaigns(JSON.parse(cachedCamps));
      else {
        setCampaigns(SEED_CAMPAIGNS);
        localStorage.setItem("phuloi_campaigns", JSON.stringify(SEED_CAMPAIGNS));
      }

      if (cachedDons) setDonations(JSON.parse(cachedDons));
      else {
        setDonations(SEED_DONATIONS);
        localStorage.setItem("phuloi_donations", JSON.stringify(SEED_DONATIONS));
      }

      if (cachedJobs) setJobs(JSON.parse(cachedJobs));
      else {
        setJobs(SEED_JOBS);
        localStorage.setItem("phuloi_jobs", JSON.stringify(SEED_JOBS));
      }

      if (cachedNews) setNewsArticle(JSON.parse(cachedNews));
      if (cachedEvents) setEvents(JSON.parse(cachedEvents));
      if (cachedConfig) setWebConfig(JSON.parse(cachedConfig));
      
      const cachedContributions = localStorage.getItem("phuloi_party_contributions");
      if (cachedContributions) setPartyContributions(JSON.parse(cachedContributions));
      
      const cachedPartners = localStorage.getItem("phuloi_official_partners");
      if (cachedPartners) {
        setOfficialPartners(JSON.parse(cachedPartners));
      } else {
        setOfficialPartners(DEFAULT_OFFICIAL_PARTNERS);
        localStorage.setItem("phuloi_official_partners", JSON.stringify(DEFAULT_OFFICIAL_PARTNERS));
      }
    } catch (e) {
      console.error("Local storage access failed, using pure code seeds:", e);
      setRequests(SEED_REQUESTS);
      setCampaigns(SEED_CAMPAIGNS);
      setDonations(SEED_DONATIONS);
      setJobs(SEED_JOBS);
    }
  };

  // Scroll to top on mount/refresh
  useEffect(() => {
    window.scrollTo({ top: 0 });
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0 });
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Firebase auth state listener
  useEffect(() => {
    // Set local persistence explicitly to guarantee stay logged in on refresh (F5)
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        console.log("Firebase Auth persistence successfully set to browserLocalPersistence.");
      })
      .catch((err) => {
        console.error("Error setting Firebase Auth persistence:", err);
      });
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const profile = await fetchUserProfile(user.uid);
          let finalUser = profile;
          const isRealAdminEmail = user.email?.toLowerCase() === "nguyenhuy.thudaumot@gmail.com";
          
          if (profile) {
            // Update Activity points (visits)
            const now = new Date();
            const today = now.toLocaleDateString('vi-VN');
            let updatedVisits = false;
            let newVisitDays = profile.visitDays || 0;
            
            if (profile.lastVisitDate !== today) {
              newVisitDays += 1;
              updatedVisits = true;
            }

            if (isRealAdminEmail && !profile.isAdmin) {
              const updatedProfile = { ...profile, isAdmin: true, lastVisitDate: today, visitDays: newVisitDays };
              try {
                await updateUserProfileInFirestore(user.uid, updatedProfile);
                finalUser = updatedProfile;
              } catch (uErr) {
                console.error("Failed to update admin role in Firestore:", uErr);
              }
            } else if (updatedVisits) {
              const updatedProfile = { ...profile, lastVisitDate: today, visitDays: newVisitDays };
              try {
                await updateUserProfileInFirestore(user.uid, updatedProfile);
                finalUser = updatedProfile;
              } catch (uErr) {
                console.error("Failed to update visit days in Firestore:", uErr);
              }
            }
            
            setCurrentUser(finalUser || profile);
            const remember = localStorage.getItem("phuloi_remember_me") !== "false";
            if (remember) {
              localStorage.setItem("phuloi_current_user", JSON.stringify(finalUser || profile));
              sessionStorage.removeItem("phuloi_current_user");
            } else {
              sessionStorage.setItem("phuloi_current_user", JSON.stringify(finalUser || profile));
              localStorage.removeItem("phuloi_current_user");
            }
          } else {
            // Document was not found or fetch failed.
            // Check if we have a valid cached user in state/localStorage already
            const cachedLocal = localStorage.getItem("phuloi_current_user");
            const cachedSession = sessionStorage.getItem("phuloi_current_user");
            const cached = cachedLocal || cachedSession;
            
            if (cached) {
              // We have a cached user profile, DO NOT overwrite it in the local state or Firestore!
              const cachedProfile = JSON.parse(cached);
              setCurrentUser(cachedProfile);
              finalUser = cachedProfile;
            } else {
              // No cached profile exists, create a default local profile (but do NOT write it to Firestore yet)
              finalUser = {
                uid: user.uid,
                email: user.email || "",
                fullName: user.email ? user.email.split("@")[0] : "Công dân số",
                phone: "",
                address: "Phú Lợi, Thành phố Hồ Chí Minh",
                quarter: "Chánh Thiện (KP HT6)",
                isAdmin: isRealAdminEmail,
                visitDays: 1,
                lastVisitDate: new Date().toLocaleDateString('vi-VN'),
                contributionsCount: 0,
                eventsAttended: 0,
                sharesCount: 0,
                activityPoints: 0
              };
              setCurrentUser(finalUser);
              const remember = localStorage.getItem("phuloi_remember_me") !== "false";
              if (remember) {
                localStorage.setItem("phuloi_current_user", JSON.stringify(finalUser));
                sessionStorage.removeItem("phuloi_current_user");
              } else {
                sessionStorage.setItem("phuloi_current_user", JSON.stringify(finalUser));
                localStorage.removeItem("phuloi_current_user");
              }
            }
          }
          
          // Seed & refresh official partners if logged in user is admin
          const isAdminUser = isRealAdminEmail || (finalUser && finalUser.isAdmin);
          if (isAdminUser) {
            try {
              const refreshed = await fetchOfficialPartnersFromFirestore(DEFAULT_OFFICIAL_PARTNERS);
              setOfficialPartners(refreshed);
              localStorage.setItem("phuloi_official_partners", JSON.stringify(refreshed));
            } catch (pErr) {
              console.error("Failed to seed/refresh official partners on admin login:", pErr);
            }
          }
        } catch (e) {
          if (String(e).includes("offline")) { 
            console.warn("Firestore Offline: user profile fetch skipped."); 
          } else { 
            console.error("Error fetching user profile from Firestore:", e); 
          }
        }
      } else {
        const credsStr = localStorage.getItem("phuloi_cached_creds") || sessionStorage.getItem("phuloi_cached_creds");
        if (credsStr && !isRestoringRef.current) {
          try {
            isRestoringRef.current = true;
            const { email, password } = JSON.parse(credsStr);
            if (email && password) {
              console.log("onAuthStateChanged: session missing, silently auto-restoring...");
              await signInWithEmailAndPassword(auth, email, password);
              isRestoringRef.current = false;
              return;
            }
          } catch (autoErr: any) {
            isRestoringRef.current = false;
            console.warn("Silent session restoration failed inside auth listener:", autoErr);
            const errCode = autoErr?.code;
            if (errCode === "auth/wrong-password" || errCode === "auth/user-not-found" || errCode === "auth/invalid-credential") {
              setCurrentUser(null);
              localStorage.removeItem("phuloi_current_user");
              sessionStorage.removeItem("phuloi_current_user");
              localStorage.removeItem("phuloi_remember_me");
              localStorage.removeItem("phuloi_cached_creds");
              sessionStorage.removeItem("phuloi_cached_creds");
              setIsAdminViewActive(false);
              return;
            }
          }
        }

        const hasCachedCreds = !!credsStr;
        const hasCachedUser = !!(localStorage.getItem("phuloi_current_user") || sessionStorage.getItem("phuloi_current_user"));
        if (!hasCachedCreds && !hasCachedUser) {
          setCurrentUser(null);
          setIsAdminViewActive(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Synchronize state changes to localStorage cache to guarantee reliable offline-first display
  useEffect(() => {
    if (campaigns && campaigns.length > 0) {
      localStorage.setItem("phuloi_campaigns", JSON.stringify(campaigns));
    }
  }, [campaigns]);

  useEffect(() => {
    if (jobs && jobs.length > 0) {
      localStorage.setItem("phuloi_jobs", JSON.stringify(jobs));
    }
  }, [jobs]);

  useEffect(() => {
    if (requests && requests.length > 0) {
      localStorage.setItem("phuloi_requests", JSON.stringify(requests));
    }
  }, [requests]);

  useEffect(() => {
    if (officialPartners && officialPartners.length > 0) {
      localStorage.setItem("phuloi_official_partners", JSON.stringify(officialPartners));
    }
  }, [officialPartners]);

  // Fetch initial Firestore synced data
  useEffect(() => {
    let isMounted = true;
    
    // Safety timeout in case Firebase hangs on connecting
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 8000);

    async function initDatabaseAndFetch() {
      // 0. Provide instant feedback from cache
      loadFallbackData();
      setLoading(false); // Unblock the UI immediately
      
      try {
        setError(null);

        // 1. Automatically seed database if campaigns are empty
        await seedDatabaseIfEmpty();

        // 2. Fetch all collections in parallel (background refresh)
        const [campsData, jobsData, reqsData, donsData, configData, eventsData, newsData, visitsData, partnersData, contributionsData, policyDocsData] = await Promise.all([

          fetchAllCampaigns(),
          fetchAllJobs(),
          fetchAllRequests(),
          fetchAllDonations(),
          fetchWebConfig(),
          fetchEventsFromFirestore([
            {
              id: "evt-1",
              title: "Ngày thứ bảy văn minh",
              date: "18/07/2026",
              time: "07:00 - 11:00",
              location: "Tuyến đường Huỳnh Văn Lũy",
              type: "Ra quân",
              description: "Dọn dẹp vệ sinh, bóc xóa biển quảng cáo sai quy định, trồng thêm cây xanh.",
              iconName: "Users",
              color: "bg-emerald-500",
              textColor: "text-emerald-700",
              bgColor: "bg-emerald-50"
            },
            {
              id: "evt-2",
              title: "Lễ Viếng Nghĩa Trang Liệt Sĩ",
              date: "27/07/2026",
              time: "06:30 - 08:30",
              location: "Nghĩa trang Liệt sĩ Phường Phú Lợi, Thành phố Hồ Chí Minh",
              type: "Kỷ niệm",
              description: "Nhân kỷ niệm Ngày Thương binh - Liệt sĩ, dâng hương tưởng nhớ các anh hùng.",
              iconName: "Star",
              color: "bg-rose-500",
              textColor: "text-rose-700",
              bgColor: "bg-rose-50"
            },
            {
              id: "evt-3",
              title: "Ngày hội Đại đoàn kết toàn dân tộc",
              date: "18/11/2026",
              time: "08:00 - 11:30",
              location: "Khu dân cư các Khu phố",
              type: "Ngày hội",
              description: "Giao lưu văn nghệ, tặng quà gia dịch khó khăn, biểu dương gia đình văn hóa.",
              iconName: "Calendar",
              color: "bg-slate-500",
              textColor: "text-slate-800",
              bgColor: "bg-slate-50"
            }
          ]),
          fetchNewsArticleFromFirestore([
            {
              id: "news-1",
              title: "Phường Phú Lợi Tổ Chức Phiên Chợ 0 Đồng Ấm Áp Nghĩa Tình",
              body: "Nhằm chia sẻ khó khăn với bà con nhân dịp lễ, Ủy ban Mặt trận Tổ quốc Việt Nam phường Phú Lợi phối hợp cùng các nhà hảo tâm tổ chức Phiên chợ 0 đồng chăm lo cho hơn 200 hộ nghèo, hộ cận nghèo, người khuyết tật trên địa bàn phường. Mỗi hộ dân được tự do chọn lựa các mặt hàng nhu yếu phẩm thiết thực trị giá 400.000 đồng/phần.",
              category: "Cứu trợ",
              imageUrl: "https://lh3.googleusercontent.com/d/1VdHot14lAHtlOODpodU5W1OAHIKuCwVE",
              date: "10/07/2026",
              originalUrl: "https://www.facebook.com/phuongphuloi/posts/101"
            },
            {
              id: "news-2",
              title: "Ra Quân 'Ngày Thứ Bảy Văn Minh' Tháo Dỡ Biển Quảng Cáo Sai Quy Định",
              body: "Đoàn viên thanh niên, lực lượng dân quân và nhân dân phường Phú Lợi đã đồng loạt ra quân thực hiện Ngày thứ bảy văn minh tại tuyến đường Huỳnh Văn Lũy. Các lực lượng đã thực hiện bóc xóa biển quảng cáo, rao vặt trái phép, dọn dẹp vệ sinh môi trường, góp phần xây dựng mỹ quan đô thị xanh - sạch - đẹp.",
              category: "Ngày thứ bảy văn minh",
              imageUrl: "https://lh3.googleusercontent.com/d/1F075dRHArHGW3LhYsFfsj5poYTZIxKpJ",
              date: "04/07/2026",
              originalUrl: "https://www.facebook.com/phuongphuloi/posts/102"
            },
            {
              id: "news-3",
              title: "MTTQ Phường Phú Lợi Trao Tặng Nhà Đại Đoàn Kết Cho Hộ Cận Nghèo",
              body: "Chiều ngày 15/07/2026, Ủy ban MTTQ Việt Nam phường Phú Lợi phối hợp cùng Ban điều hành khu phố tổ chức bàn giao căn nhà Đại đoàn kết cho gia đình bà Nguyễn Thị Huệ, ngụ tại khu phố 5. Căn nhà có diện tích 50m2 với kinh phí xây dựng 80 triệu đồng do Quỹ Vì người nghèo vận động tài trợ.",
              category: "An sinh xã hội",
              imageUrl: "https://lh3.googleusercontent.com/d/1MT0t2jwh0jomWuJmtMxyT59XTjDHJ2AP",
              date: "15/07/2026",
              originalUrl: "https://www.facebook.com/phuongphuloi/posts/103"
            },
            {
              id: "news-4",
              title: "Hội Nghị Tuyên Truyền Phổ Biến Pháp Luật Và Phòng Chống Tội Phạm",
              body: "Ban thường trực Ủy ban MTTQ Việt Nam phường phối hợp cùng Công an phường tổ chức hội nghị tuyên truyền, phổ biến pháp luật về phòng chống tội phạm lừa đảo công nghệ cao trên không gian mạng cho hơn 150 người dân địa bàn, giúp nâng cao tinh thần cảnh giác.",
              category: "Tuyên truyền",
              imageUrl: "https://lh3.googleusercontent.com/d/1F075dRHArHGW3LhYsFfsj5poYTZIxKpJ",
              date: "12/07/2026",
              originalUrl: "https://www.facebook.com/phuongphuloi/posts/104"
            }
          ]),
          incrementVisitCount(),
          fetchOfficialPartnersFromFirestore(DEFAULT_OFFICIAL_PARTNERS),
          fetchPartyContributionsFromFirestore(),
          fetchPolicyDocumentsFromFirestore([])
        ]);

        if (isMounted) {
          setRequests(reqsData);
          setCampaigns(campsData);
          setDonations(donsData);
          setJobs(jobsData);
          if (contributionsData) {
            setPartyContributions(contributionsData);
            localStorage.setItem("phuloi_party_contributions", JSON.stringify(contributionsData));
          }
          if (policyDocsData) {
            setPolicyDocuments(policyDocsData);
          }
          if (newsData) {
            setNewsArticle(newsData);
            localStorage.setItem("phuloi_news_articles", JSON.stringify(newsData));
          }
          if (eventsData) {
            setEvents(eventsData);
            localStorage.setItem("phuloi_events", JSON.stringify(eventsData));
          }
          if (visitsData) {
            setVisitorStats(visitsData);
          }
          if (configData) {
            setWebConfig(configData);
            localStorage.setItem("phuloi_web_config", JSON.stringify(configData));
          }
          if (partnersData) {
            setOfficialPartners(partnersData);
            localStorage.setItem("phuloi_official_partners", JSON.stringify(partnersData));
          }
        }

      } catch (err: any) {
        console.warn("Firestore live query failed or had network issues. Remaining on cached local storage data:", err);
      } finally {
        if (isMounted) {
          clearTimeout(safetyTimeout);
        }
      }
    }

    initDatabaseAndFetch();
    
    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
    };
  }, []);

  // Real-time listener to keep requests synchronized and track status updates
  useEffect(() => {
    const requestsCol = collection(db, "requests");
    const unsubscribe = onSnapshot(requestsCol, (snapshot) => {
      const liveReqs: CitizenRequest[] = [];
      snapshot.forEach((docSnap) => {
        liveReqs.push(docSnap.data() as CitizenRequest);
      });
      // Sort newest first
      liveReqs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Get guest-submitted request IDs from localStorage
      const guestSubmittedIds: string[] = [];
      try {
        const localReqsStr = localStorage.getItem("phuloi_requests_submitted_by_me");
        if (localReqsStr) {
          const parsed = JSON.parse(localReqsStr);
          if (Array.isArray(parsed)) {
            guestSubmittedIds.push(...parsed);
          }
        }
      } catch (e) {}

      // Identify any request state change for current user
      const prevRequests = requestsRef.current;
      const curUser = currentUserRef.current;
      if (prevRequests && prevRequests.length > 0) {
        liveReqs.forEach((newReq) => {
          const isUserRequest = (curUser && (
            newReq.userId === curUser.uid ||
            (curUser.phone && newReq.phone === curUser.phone)
          )) || guestSubmittedIds.includes(newReq.id);

          if (isUserRequest) {
            const prevReq = prevRequests.find((p) => p.id === newReq.id);
            if (prevReq) {
              // "Đang xử lý" can be SUBMITTED or VERIFYING
              const wasProcessing = prevReq.status === RequestStatus.SUBMITTED || prevReq.status === RequestStatus.VERIFYING;
              // "Đã giải quyết" can be APPROVED or COMPLETED
              const isResolved = newReq.status === RequestStatus.APPROVED || newReq.status === RequestStatus.COMPLETED;

              if (prevReq.status !== newReq.status) {
                // Play notification sound
                playNotificationSound();

                if (wasProcessing && isResolved) {
                  showToast(
                    "🎉 Hồ sơ của bạn đã được giải quyết!",
                    `Kính gửi ông/bà ${newReq.fullName}, hồ sơ số [${newReq.id}] ("${newReq.category}") của gia đình đã được phê duyệt chuyển sang trạng thái: "${newReq.status}". Ghi chú phản hồi: "${newReq.notes || 'Hồ sơ đã được phê duyệt và giải quyết thành công.'}"`,
                    "success",
                    12000
                  );
                } else {
                  showToast(
                    "📋 Cập nhật trạng thái hồ sơ",
                    `Hồ sơ số [${newReq.id}] ("${newReq.category}") của gia đình đã được cán bộ cập nhật sang trạng thái mới: "${newReq.status}".`,
                    "info",
                    9000
                  );
                }
              }
            }
          }
        });
      }

      setRequests(liveReqs);
      localStorage.setItem("phuloi_requests", JSON.stringify(liveReqs));
    }, (error) => {
      console.warn("Real-time requests subscription error:", error);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Real-time listener for Facebook News (Cổng thông tin) to play sound and sync updates
  useEffect(() => {
    const newsCol = collection(db, "news_articles");
    const unsubscribeNews = onSnapshot(newsCol, (snapshot) => {
      const liveNews: NewsArticle[] = [];
      snapshot.forEach((docSnap) => {
        liveNews.push(docSnap.data() as NewsArticle);
      });
      // Sort newest first
      liveNews.sort((a, b) => {
        const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : new Date(a.date).getTime() || 0;
        const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : new Date(b.date).getTime() || 0;
        return dateB - dateA;
      });

      const prevNews = newsArticlesRef.current;
      if (prevNews && prevNews.length > 0) {
        const hasNewItem = liveNews.some(newItem => 
          !prevNews.some(oldItem => oldItem.id === newItem.id)
        );
        if (hasNewItem) {
          const newestNotLocal = liveNews.find(newItem => 
            !prevNews.some(oldItem => oldItem.id === newItem.id)
          );
          if (newestNotLocal) {
            // Check if this new news item was created locally by the current user
            const isJustCreatedLocally = recentNewsCreatedRef.current.has(newestNotLocal.id);
            const curUser = currentUserRef.current;
            const isUserAdmin = curUser?.role === "admin";
            if (!isJustCreatedLocally && !isUserAdmin) {
              // Play notification sound
              playNotificationSound();
              
              showToast(
                "📰 Bản tin Phú Lợi mới!",
                `Phường Phú Lợi vừa đăng tải bản tin mới: "${newestNotLocal.title}".`,
                "info",
                10000
              );
            }
          }
        }
      }

      setNewsArticle(liveNews);
      localStorage.setItem("phuloi_news_articles", JSON.stringify(liveNews));
    }, (error) => {
      console.warn("Real-time news subscription error:", error);
    });

    return () => unsubscribeNews();
  }, []);

  // Real-time listener for visitor stats with random online fluctuation
  useEffect(() => {
    const docRef = doc(db, "config", "visitor_stats");
    
    let currentOnlineBase = visitorStats.onlineCount || 18;
    
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as { totalVisits: number; onlineCount: number };
        currentOnlineBase = data.onlineCount || 18;
        setVisitorStats(prev => ({
          totalVisits: data.totalVisits || prev.totalVisits,
          onlineCount: currentOnlineBase
        }));
      }
    }, (err) => {
      console.warn("Could not listen to visitor stats:", err);
    });

    // Simulate real-time active users fluctuation
    const interval = setInterval(() => {
      setVisitorStats(prev => {
        const fluctuation = Math.floor(Math.random() * 6) - 2;
        let newOnline = currentOnlineBase + fluctuation;
        if (newOnline < 3) newOnline = 3;
        return {
          ...prev,
          onlineCount: newOnline
        };
      });
    }, 8000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  // Refresh requests from Firestore
  const handleRefreshRequests = async () => {
    try {
      const reqsData = await fetchAllRequests();
      setRequests(reqsData);
      localStorage.setItem("phuloi_requests", JSON.stringify(reqsData));
    } catch (err) {
      console.warn("Could not refresh requests:", err);
    }
  };

  // Submit help request
  const handleSubmitRequest = async (newReq: {
    fullName: string;
    phone: string;
    address: string;
    quarter: string;
    category: SupportCategory;
    description: string;
  }) => {
    try {
      const savedRequest = await submitHelpRequestToFirestore({
        ...newReq,
        userId: currentUser?.uid
      });
      if (currentUser?.uid) {
        setCurrentUser(prev => prev ? { ...prev, contributionsCount: (prev.contributionsCount || 0) + 1 } : prev);
      }
      
      // Save ID to locally submitted request list for guest tracking
      try {
        const localSubmitted = JSON.parse(localStorage.getItem("phuloi_requests_submitted_by_me") || "[]");
        localSubmitted.push(savedRequest.id);
        localStorage.setItem("phuloi_requests_submitted_by_me", JSON.stringify(localSubmitted));
      } catch (e) {
        console.error("Failed to save submitted request ID to local list:", e);
      }

      // Send email notification if user has an email
      if (currentUser?.email) {
        sendEmailNotification(
          currentUser.email,
            `[Ủy ban MTTQ Việt Nam Phường Phú Lợi] Xác nhận tiếp nhận hồ sơ ${savedRequest.id}`,
            `<div style="font-family: sans-serif; padding: 20px;">
              <h2 style="color: #2563eb;">Tiếp nhận hồ sơ thành công</h2>
              <p>Kính gửi ${newReq.fullName},</p>
              <p>Ủy ban MTTQ Việt Nam Phường Phú Lợi đã tiếp nhận hồ sơ yêu cầu trợ giúp của quý bà con.</p>
              <ul>
                <li><strong>Mã hồ sơ:</strong> ${savedRequest.id}</li>
                <li><strong>Hạng mục:</strong> ${newReq.category}</li>
                <li><strong>Thời gian:</strong> ${savedRequest.createdAt}</li>
                <li><strong>Trạng thái:</strong> ${savedRequest.status}</li>
              </ul>
              <p>Hồ sơ sẽ sớm được cán bộ khu phố xác minh và xử lý. Cảm ơn quý bà con.</p>
              <br/>
              <p><em>Đây là email tự động từ Cổng An Sinh Số Phú Lợi. Vui lòng không trả lời email này.</em></p>
            </div>`
          );
      }

      setRequests(prev => {
        const updated = [savedRequest, ...prev];
        localStorage.setItem("phuloi_requests", JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      console.error("Firestore submit request error, using local fallback:", err);
      const fallbackReq: CitizenRequest = {
        id: `REQ-${Date.now().toString().slice(-3)}`,
        fullName: newReq.fullName,
        phone: newReq.phone,
        address: newReq.address,
        quarter: newReq.quarter,
        category: newReq.category,
        description: newReq.description,
        status: RequestStatus.SUBMITTED,
        createdAt: new Date().toISOString(),
        ...(currentUser?.uid ? { userId: currentUser.uid } : {})
      };

      // Save ID to locally submitted request list for guest tracking
      try {
        const localSubmitted = JSON.parse(localStorage.getItem("phuloi_requests_submitted_by_me") || "[]");
        localSubmitted.push(fallbackReq.id);
        localStorage.setItem("phuloi_requests_submitted_by_me", JSON.stringify(localSubmitted));
      } catch (e) {
        console.error("Failed to save fallback request ID to local list:", e);
      }

      setRequests(prev => {
        const updated = [fallbackReq, ...prev];
        localStorage.setItem("phuloi_requests", JSON.stringify(updated));
        return updated;
      });
    }
  };

  // Update support request status & officer notes (Administrative function)
  const handleUpdateRequest = async (requestId: string, status: RequestStatus, notes?: string) => {
    try {
      const officerName = currentUser?.fullName || "Cán bộ Phường Phú Lợi";
      await updateRequestInFirestore(requestId, status, notes, officerName);

      // Send email notification for status change
      const reqToUpdate = requests.find(r => r.id === requestId);
      if (reqToUpdate && reqToUpdate.userId) {
        fetchUserProfile(reqToUpdate.userId!).then((userProfile) => {
            if (userProfile && userProfile.email) {
              sendEmailNotification(
                userProfile.email,
                  `[Ủy ban MTTQ Việt Nam Phường Phú Lợi] Cập nhật trạng thái hồ sơ ${requestId}`,
                  `<div style="font-family: sans-serif; padding: 20px;">
                    <h2 style="color: #2563eb;">Trạng thái hồ sơ được cập nhật</h2>
                    <p>Kính gửi ${reqToUpdate.fullName},</p>
                    <p>Hồ sơ yêu cầu trợ giúp của quý bà con vừa được cập nhật trạng thái.</p>
                    <ul>
                      <li><strong>Mã hồ sơ:</strong> ${requestId}</li>
                      <li><strong>Trạng thái mới:</strong> <strong style="color: #059669;">${status}</strong></li>
                      ${notes ? `<li><strong>Ghi chú từ cán bộ:</strong> ${notes}</li>` : ""}
                    </ul>
                    <p>Bà con có thể theo dõi tiến độ trên Cổng An Sinh Số Phú Lợi.</p>
                    <br/>
                    <p><em>Đây là email tự động từ Cổng An Sinh Số Phú Lợi. Vui lòng không trả lời email này.</em></p>
                  </div>`
                );
            }
          });
      }

      setRequests(prev => {
        const updated = prev.map(r => r.id === requestId ? { ...r, status, officerName, ...(notes !== undefined ? { notes } : {}) } : r);
        localStorage.setItem("phuloi_requests", JSON.stringify(updated));
        return updated;
      });
      playSuccessSound();
    } catch (err) {
      console.error("Firestore update request error, updating locally:", err);
      const officerName = currentUser?.fullName || "Cán bộ Phường Phú Lợi";
      setRequests(prev => {
        const updated = prev.map(r => r.id === requestId ? { ...r, status, officerName, ...(notes !== undefined ? { notes } : {}) } : r);
        localStorage.setItem("phuloi_requests", JSON.stringify(updated));
        return updated;
      });
      playSuccessSound();
    }
  };

  // Submit citizen 5-star rating for a completed help request
  const handleRatingSubmit = async (requestId: string, rating: number, ratingComment?: string) => {
    try {
      const officerName = requests.find(r => r.id === requestId)?.officerName || "Cán bộ Phường Phú Lợi";
      await saveRequestRatingInFirestore(requestId, rating, ratingComment, officerName);
      setRequests(prev => {
        const updated = prev.map(r => r.id === requestId ? { ...r, rating, ratingComment, ratedAt: new Date().toISOString() } : r);
        localStorage.setItem("phuloi_requests", JSON.stringify(updated));
        return updated;
      });
      playSuccessSound();
      showToast(
        "Đánh giá thành công",
        "Cảm ơn ý kiến đóng góp của bà con để cải thiện chất lượng dịch vụ công!",
        "success"
      );
    } catch (err) {
      console.error("Error submitting rating:", err);
      // Fallback local support
      setRequests(prev => {
        const updated = prev.map(r => r.id === requestId ? { ...r, rating, ratingComment, ratedAt: new Date().toISOString() } : r);
        localStorage.setItem("phuloi_requests", JSON.stringify(updated));
        return updated;
      });
      playSuccessSound();
      showToast(
        "Đánh giá thành công (Lưu tạm)",
        "Ghi nhận đánh giá thành công trên thiết bị.",
        "success"
      );
    }
  };

  // Submit Party and political system building feedback/contribution
  const handleSubmitPartyContribution = async (contribution: Omit<PartyContribution, "id" | "createdAt">) => {
    try {
      const id = await savePartyContributionToFirestore(contribution);
      const newContribution: PartyContribution = {
        ...contribution,
        id,
        createdAt: new Date().toISOString()
      };
      setPartyContributions(prev => {
        const updated = [newContribution, ...prev];
        localStorage.setItem("phuloi_party_contributions", JSON.stringify(updated));
        return updated;
      });
      playSuccessSound();
      showToast(
        "Gửi góp ý thành công",
        "Cảm ơn bà con đã chung tay góp ý xây dựng Đảng và hệ thống chính trị Phường Phú Lợi!",
        "success"
      );
    } catch (err) {
      console.error("Error submitting party contribution, saving locally:", err);
      const fallbackId = "contrib-" + Math.random().toString(36).substr(2, 9);
      const fallbackContrib: PartyContribution = {
        ...contribution,
        id: fallbackId,
        createdAt: new Date().toISOString()
      };
      setPartyContributions(prev => {
        const updated = [fallbackContrib, ...prev];
        localStorage.setItem("phuloi_party_contributions", JSON.stringify(updated));
        return updated;
      });
      playSuccessSound();
      showToast(
        "Gửi góp ý thành công (Lưu tạm)",
        "Góp ý của bà con đã được ghi nhận trên thiết bị.",
        "success"
      );
    }
  };

  // Admin/Officer update and respond to Party feedback
  const handleUpdatePartyContribution = async (
    contributionId: string,
    updates: Partial<PartyContribution>
  ) => {
    try {
      if (updates.responseNotes && !updates.respondedBy) {
         updates.respondedBy = currentUser?.fullName || "Lãnh đạo Phường Phú Lợi";
      }
      await updatePartyContributionInFirestore(contributionId, updates);
      setPartyContributions(prev => {
        const updated = prev.map(c => c.id === contributionId ? { ...c, ...updates, respondedAt: new Date().toISOString() } : c);
        localStorage.setItem("phuloi_party_contributions", JSON.stringify(updated));
        return updated;
      });
      playSuccessSound();
      showToast(
        "Cập nhật thành công",
        "Đã phản hồi ý kiến góp ý xây dựng chính trị thành công.",
        "success"
      );
    } catch (err) {
      console.error("Error updating party contribution, saving locally:", err);
      if (updates.responseNotes && !updates.respondedBy) {
         updates.respondedBy = currentUser?.fullName || "Lãnh đạo Phường Phú Lợi";
      }
      setPartyContributions(prev => {
        const updated = prev.map(c => c.id === contributionId ? { ...c, ...updates, respondedAt: new Date().toISOString() } : c);
        localStorage.setItem("phuloi_party_contributions", JSON.stringify(updated));
        return updated;
      });
      playSuccessSound();
      showToast(
        "Cập nhật thành công (Lưu tạm)",
        "Đã lưu phản hồi của đồng chí.",
        "success"
      );
    }
  };

  // Submit donation
  const handleSubmitDonation = (newDonation: {
    donorName: string;
    amount: number;
    campaignId: string;
    message: string;
  }) => {
    const fallbackDon: Donation = {
      id: `DON-${Date.now().toString().slice(-3)}`,
      donorName: newDonation.donorName,
      amount: newDonation.amount,
      campaignTitle: campaigns.find(c => c.id === newDonation.campaignId)?.title || "Quỹ An Sinh Chung",
      message: newDonation.message,
      createdAt: new Date().toISOString(),
      ...(currentUser?.uid ? { userId: currentUser.uid } : {})
    };

    const payload = {
      ...newDonation,
      userId: currentUser?.uid
    };

    // Process Firestore transaction asynchronously in background
    submitDonationToFirestore(payload)
      .then(({ donation: savedDon, updatedCampaign }) => {
        if (currentUser?.uid) {
          setCurrentUser(prev => prev ? { ...prev, contributionsCount: (prev.contributionsCount || 0) + 1 } : prev);
        }
        if (updatedCampaign) {
          setCampaigns(prev => {
            const updated = prev.map(c => c.id === updatedCampaign.id ? updatedCampaign : c);
            localStorage.setItem("phuloi_campaigns", JSON.stringify(updated));
            return updated;
          });
        }
        setDonations(prev => {
          const updated = [savedDon, ...prev.filter(d => d.id !== fallbackDon.id)];
          localStorage.setItem("phuloi_donations", JSON.stringify(updated));
          return updated;
        });

        // Send email confirmation if donor has an email and config allows
        if (currentUser?.email && webConfig?.enableDonationEmail) {
          const campaignTitle = updatedCampaign?.title || campaigns.find(c => c.id === newDonation.campaignId)?.title || "Quỹ An Sinh Chung";
          const formattedAmount = new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(newDonation.amount);
          sendEmailNotification(
            currentUser.email,
            `[Ủy ban MTTQ Việt Nam Phường Phú Lợi] Xác nhận quyên góp thành công`,
            `<div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; background: #fff;">
              <div style="text-align: center; margin-bottom: 24px;">
                <h2 style="color: #0369a1; margin: 0;">Trân Trọng Cảm Ơn Tấm Lòng Vàng</h2>
              </div>
              <p style="color: #374151; font-size: 16px;">Kính gửi <strong>${newDonation.donorName}</strong>,</p>
              <p style="color: #374151; line-height: 1.6;">Ủy ban MTTQ Việt Nam Phường Phú Lợi chân thành cảm ơn tấm lòng hảo tâm của quý vị. Đóng góp của quý vị đã được ghi nhận thành công trên hệ thống Cổng An Sinh Xã Hội Số.</p>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <h3 style="margin-top: 0; color: #0f172a; font-size: 14px; text-transform: uppercase;">Thông tin quyên góp</h3>
                <ul style="list-style: none; padding: 0; margin: 0; color: #475569; font-size: 15px; line-height: 2;">
                  <li><strong>Mã giao dịch:</strong> <span style="font-family: monospace;">${savedDon.id}</span></li>
                  <li><strong>Số tiền:</strong> <strong style="color: #10b981;">${formattedAmount}</strong></li>
                  <li><strong>Chiến dịch ủng hộ:</strong> ${campaignTitle}</li>
                  <li><strong>Thời gian:</strong> ${new Date(savedDon.createdAt).toLocaleString("vi-VN")}</li>
                  <li><strong>Lời nhắn:</strong> <i>"${newDonation.message || 'Không có'}"</i></li>
                </ul>
              </div>
              <p style="color: #64748b; font-size: 14px; text-align: center; margin-top: 32px;">Sự đóng góp của quý vị góp phần lan tỏa yêu thương và xây dựng cộng đồng Phường Phú Lợi ngày càng tốt đẹp hơn.</p>
            </div>`
          );
        }
      })
      .catch(err => {
        console.error("Firestore submit donation error, using local fallback:", err);
        // Apply locally if offline
        setCampaigns(prev => {
          const updated = prev.map(c => {
            if (c.id === newDonation.campaignId) {
              return { ...c, currentAmount: c.currentAmount + newDonation.amount };
            }
            return c;
          });
          localStorage.setItem("phuloi_campaigns", JSON.stringify(updated));
          return updated;
        });
        setDonations(prev => {
          const updated = [fallbackDon, ...prev];
          localStorage.setItem("phuloi_donations", JSON.stringify(updated));
          return updated;
        });
      });

    return fallbackDon;
  };

  // Facebook News Handlers
  
  const handleAddNews = async (newsItem: Omit<NewsArticle, "id" | "publishedAt">) => {
    try {
      const newId = "news-" + Date.now().toString();
      recentNewsCreatedRef.current.add(newId);
      const fullNews: NewsArticle = {
        ...newsItem,
        id: newId,
        publishedAt: new Date().toISOString()
      };
      await saveNewsArticleToFirestore(fullNews);
      showToast("Tạo tin tức thành công", "Đã thêm bản tin mới vào hệ thống.", "success");
    } catch (err) {
      console.error(err);
      showToast("Lỗi", "Không thể thêm tin tức", "error");
    }
  };
const handleDeleteNews = async (id: string) => {
    try {
      await deleteNewsArticleFromFirestore(id);
      setNewsArticle(prev => prev.filter(item => item.id !== id));
      showToast("🗑️ Đã xóa tin tức", "Bài viết đã được gỡ khỏi hệ thống lưu trữ.", "info");
    } catch (err) {
      console.error(err);
      showToast("❌ Lỗi xóa tin tức", "Không thể xóa bài viết, vui lòng thử lại sau.", "error");
    }
  };

  const handleDeleteMultipleNews = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => deleteNewsArticleFromFirestore(id)));
      setNewsArticle(prev => prev.filter(item => !ids.includes(item.id)));
      showToast("🗑️ Đã xóa nhiều tin tức", `Đã gỡ bỏ thành công ${ids.length} bài viết khỏi hệ thống.`, "info");
    } catch (err) {
      console.error(err);
      showToast("❌ Lỗi xóa tin tức", "Không thể xóa một số bài viết đã chọn, vui lòng thử lại sau.", "error");
    }
  };

  const handleEditNews = async (id: string, updatedData: Partial<NewsArticle>) => {
    try {
      const newsItem = newsArticles.find(item => item.id === id);
      if (!newsItem) throw new Error("Không tìm thấy bài viết.");
      
      const updatedNewsItem = { ...newsItem, ...updatedData };
      await saveNewsArticleToFirestore(updatedNewsItem);
      setNewsArticle(prev => prev.map(item => item.id === id ? updatedNewsItem : item));
      showToast("✏️ Đã cập nhật tin tức", "Bài viết đã được chỉnh sửa thành công.", "success");
    } catch (err) {
      console.error(err);
      showToast("❌ Lỗi chỉnh sửa tin tức", "Không thể chỉnh sửa bài viết, vui lòng thử lại sau.", "error");
    }
  };

  const handleRestoreDefaultNews = async () => {
    try {
      const defaultNews: NewsArticle[] = [
        {
          id: "news-1",
          title: "Phường Phú Lợi Tổ Chức Phiên Chợ 0 Đồng Ấm Áp Nghĩa Tình",
          body: "Nhằm chia sẻ khó khăn với bà con nhân dịp lễ, Ủy ban Mặt trận Tổ quốc Việt Nam phường Phú Lợi phối hợp cùng các nhà hảo tâm tổ chức Phiên chợ 0 đồng chăm lo cho hơn 200 hộ nghèo, hộ cận nghèo, người khuyết tật trên địa bàn phường. Mỗi hộ dân được tự do chọn lựa các mặt hàng nhu yếu phẩm thiết thực trị giá 400.000 đồng/phần.",
          category: "Cứu trợ",
          imageUrl: "https://lh3.googleusercontent.com/d/1VdHot14lAHtlOODpodU5W1OAHIKuCwVE",
          date: "10/07/2026",
          originalUrl: "https://www.facebook.com/phuongphuloi/posts/101"
        },
        {
          id: "news-2",
          title: "Ra Quân 'Ngày Thứ Bảy Văn Minh' Tháo Dỡ Biển Quảng Cáo Sai Quy Định",
          body: "Đoàn viên thanh niên, lực lượng dân quân và nhân dân phường Phú Lợi đã đồng loạt ra quân thực hiện Ngày thứ bảy văn minh tại tuyến đường Huỳnh Văn Lũy. Các lực lượng đã thực hiện bóc xóa biển quảng cáo, rao vặt trái phép, dọn dẹp vệ sinh môi trường, góp phần xây dựng mỹ quan đô thị xanh - sạch - đẹp.",
          category: "Ngày thứ bảy văn minh",
          imageUrl: "https://lh3.googleusercontent.com/d/1F075dRHArHGW3LhYsFfsj5poYTZIxKpJ",
          date: "04/07/2026",
          originalUrl: "https://www.facebook.com/phuongphuloi/posts/102"
        },
        {
          id: "news-3",
          title: "MTTQ Phường Phú Lợi Trao Tặng Nhà Đại Đoàn Kết Cho Hộ Cận Nghèo",
          body: "Chiều ngày 15/07/2026, Ủy ban MTTQ Việt Nam phường Phú Lợi phối hợp cùng Ban điều hành khu phố tổ chức bàn giao căn nhà Đại đoàn kết cho gia đình bà Nguyễn Thị Huệ, ngụ tại khu phố 5. Căn nhà có diện tích 50m2 với kinh phí xây dựng 80 triệu đồng do Quỹ Vì người nghèo vận động tài trợ.",
          category: "An sinh xã hội",
          imageUrl: "https://lh3.googleusercontent.com/d/1MT0t2jwh0jomWuJmtMxyT59XTjDHJ2AP",
          date: "15/07/2026",
          originalUrl: "https://www.facebook.com/phuongphuloi/posts/103"
        },
        {
          id: "news-4",
          title: "Hội Nghị Tuyên Truyền Phổ Biến Pháp Luật Và Phòng Chống Tội Phạm",
          body: "Ban thường trực Ủy ban MTTQ Việt Nam phường phối hợp cùng Công an phường tổ chức hội nghị tuyên truyền, phổ biến pháp luật về phòng chống tội phạm lừa đảo công nghệ cao trên không gian mạng cho hơn 150 người dân địa bàn, giúp nâng cao tinh thần cảnh giác.",
          category: "Tuyên truyền",
          imageUrl: "https://lh3.googleusercontent.com/d/1F075dRHArHGW3LhYsFfsj5poYTZIxKpJ",
          date: "12/07/2026",
          originalUrl: "https://www.facebook.com/phuongphuloi/posts/104"
        }
      ];

      for (const item of defaultNews) {
        await saveNewsArticleToFirestore(item);
      }
      setNewsArticle(defaultNews);
      showToast("🔄 Khôi phục thành công", "Các bản tin Facebook mẫu đã được nạp lại vào cơ sở dữ liệu.", "success");
    } catch (err) {
      console.error(err);
      showToast("❌ Lỗi khôi phục tin", "Không thể khôi phục bản tin mẫu, vui lòng thử lại sau.", "error");
    }
  };

  const handleAdminNavigate = (tab: any) => {
    setAdminActiveTab(tab);
    setIsAdminViewActive(true);
    setTimeout(() => {
      const el = document.getElementById("admin-hub-panel");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  // Compute stats for Stats component
  const completedRequestsCount = requests.filter(r => r.status === RequestStatus.COMPLETED).length;
  const totalDonationAmount = donations.reduce((sum, d) => sum + d.amount, 0) + 120000000; // base seeded amount
  const donorsCount = donations.length + 82; // base seeded count

  if (loading) {
    return (
      <div className="min-h-screen tech-bg flex flex-col items-center justify-center space-y-6 px-4 selection:bg-sky-500 selection:text-white">
        <CircuitBackground />
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl max-w-md text-center border border-blue-100/60 shadow-[0_20px_50px_rgba(37,99,235,0.06)] flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-sky-500 to-teal-500 flex items-center justify-center border border-sky-500/30 shadow-[0_0_20px_rgba(14,165,233,0.2)] animate-spin mb-5">
            <Landmark className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-bold text-sm uppercase tracking-wider text-slate-800 font-sans">Đang khởi động Cổng An sinh số</h3>
          <p className="text-slate-500 text-xs animate-pulse mt-2.5 font-light leading-relaxed">
            Đang tải dữ liệu hồ sơ, kết nối bản đồ số và đồng bộ hóa cơ sở dữ liệu chính sách Phường Phú Lợi...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen tech-bg flex flex-col items-center justify-center space-y-4 px-4 text-center selection:bg-sky-500 selection:text-white">
        <CircuitBackground />
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl max-w-md text-center border border-blue-100/60 shadow-[0_20px_50px_rgba(37,99,235,0.06)] flex flex-col items-center">
          <AlertCircle className="w-16 h-16 text-slate-800 animate-pulse mb-4" />
          <h3 className="font-bold text-sm uppercase text-slate-800 font-sans">Không thể truy cập máy chủ</h3>
          <p className="text-slate-500 text-xs font-light mt-2.5 leading-relaxed">
            {error}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 bg-sky-500 hover:bg-sky-600 text-white font-bold px-6 py-3 rounded-xl text-[10px] uppercase tracking-wider shadow-[0_4px_15px_rgba(14,165,233,0.15)] transition-all duration-300 cursor-pointer"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    );
  }

  const hasAdminPrivilege = currentUser?.isAdmin || currentUser?.email?.toLowerCase() === "nguyenhuy.thudaumot@gmail.com";

  if (isAdminViewActive && hasAdminPrivilege) {
    return (
      <div className="min-h-screen bg-slate-50/80 text-slate-800 font-sans selection:bg-sky-500 selection:text-white antialiased flex flex-col">
        {/* Top bar */}
        <div className="bg-white border-b border-slate-200 py-3 px-6 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-500/10 border border-red-500/20 text-sky-600 rounded-xl">
              <ShieldCheck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xs font-black uppercase tracking-widest text-slate-800 font-sans">Cổng Quản Trị Hệ Thống</h2>
              <p className="text-[10px] text-slate-400 font-light uppercase tracking-wider">Ủy ban MTTQ Việt Nam Phường Phú Lợi</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Quick stats indicators */}
            <div className="hidden md:flex items-center space-x-6 text-xs text-slate-500 border-r border-slate-200 pr-6 mr-2 font-mono">
              <div className="text-center">
                <span className="block text-slate-500 text-[9px] uppercase tracking-wider">Lượt Truy Cập</span>
                <span className="text-slate-800 font-bold">{(visitorStats?.totalVisits || 14205).toLocaleString("vi-VN")}</span>
              </div>
              <div className="text-center">
                <span className="block text-slate-500 text-[9px] uppercase tracking-wider">Hồ Sơ An Sinh</span>
                <span className="text-slate-800 font-bold">{requests.length}</span>
              </div>
              <div className="text-center">
                <span className="block text-slate-500 text-[9px] uppercase tracking-wider">Trực Tuyến</span>
                <span className="text-emerald-400 font-bold">● {visitorStats?.onlineCount || 18}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setIsAdminViewActive(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 transition-all cursor-pointer shadow-sm text-slate-500"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Quay lại trang chính</span>
            </button>

            <button
              onClick={async () => {
                await signOut(auth);
                setCurrentUser(null);
                localStorage.removeItem("phuloi_current_user");
                sessionStorage.removeItem("phuloi_current_user");
                localStorage.removeItem("phuloi_remember_me");
                localStorage.removeItem("phuloi_cached_creds");
                sessionStorage.removeItem("phuloi_cached_creds");
                setIsAdminViewActive(false);
              }}
              className="flex items-center space-x-2 bg-red-950/40 hover:bg-red-950/60 text-xs font-semibold px-4 py-2.5 rounded-xl border border-red-900/30 text-red-400 hover:text-red-300 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* Core content with beautiful layout */}
        <div className="max-w-[1550px] w-full mx-auto p-4 md:p-8 flex-1 flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full lg:w-72 shrink-0 space-y-6">
            <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 space-y-4">
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
                {currentUser?.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt="Avatar" className="w-12 h-12 rounded-2xl object-cover shadow-lg shadow-blue-500/10 border border-blue-100" />
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-500 to-teal-500 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-500/10 border border-blue-100">
                    {currentUser?.fullName ? currentUser.fullName.charAt(0).toUpperCase() : "A"}
                  </div>
                )}
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider leading-snug">{currentUser?.fullName}</h3>
                  <p className="text-[10px] text-slate-500 font-light truncate max-w-[180px]">{currentUser?.email}</p>
                  <span className="inline-flex items-center px-2 py-0.5 mt-1.5 rounded-full text-[8px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20">
                    QUẢN TRỊ VIÊN CẤP CAO
                  </span>
                </div>
              </div>
              {/* Sidebar Menu */}
              <div className="space-y-1">
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest px-2.5 mb-2">Phân hệ Quản trị</div>
                
                {[
                  { id: "roles", icon: Users, label: "Phân vai trò quản trị" },
                  { id: "analytics", icon: Activity, label: "Báo cáo & Thống kê số" },
                  { id: "config", icon: Settings, label: "Cấu hình Hệ thống" },
                  { id: "campaigns", icon: Gift, label: "Chiến dịch An sinh" },
                  { id: "jobs", icon: Briefcase, label: "Quản lý tin tuyển dụng" },
                  { id: "requests", icon: FileText, label: "Duyệt hồ sơ nâng cao" },
                  { id: "notifications", icon: BellRing, label: "Thông báo đẩy FCM" },
                  { id: "news", icon: Globe, label: "Quản lý tin tức AI" },
                  { id: "policies", icon: Landmark, label: "Chính sách An sinh" },
                  { id: "events", icon: Calendar, label: "Quản lý Lịch Sự kiện" },
                  { id: "volunteers", icon: HeartHandshake, label: "Xét duyệt Tình nguyện viên", iconClass: "text-rose-500" },
                  { id: "brain", icon: Brain, label: "Bộ脑 Trợ lý (Drive)", iconClass: "text-amber-500" },
                  { id: "partners", icon: Award, label: "Đơn vị đồng hành", iconClass: "text-indigo-500" },
                  { id: "forum", icon: MessageSquare, label: "Diễn đàn & Phản ánh", iconClass: "text-indigo-500" },
                  { id: "partyFeedback", icon: Vote, label: "Góp ý xây dựng Đảng", iconClass: "text-red-600" },
                  { id: "aiPersonality", icon: Sparkles, label: "Cấu hình AI", iconClass: "text-sky-500" },
                  { id: "imageUpload", icon: ImagePlus, label: "Upload Ảnh Drive", iconClass: "text-emerald-500" }
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = adminActiveTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setAdminActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-3 rounded-2xl text-xs font-bold transition-all text-left cursor-pointer ${
                        isActive 
                          ? "bg-sky-500 text-white shadow-md shadow-sky-500/20" 
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${tab.iconClass || ""}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-6 text-xs text-slate-500 space-y-3 font-light leading-relaxed">
              <span className="block text-[10px] font-black uppercase tracking-wider text-slate-800">💡 Hướng dẫn vận hành</span>
              <p>Mọi chỉnh sửa vai trò, duyệt hồ sơ an sinh hoặc đăng tuyển dụng sẽ lập tức được đồng bộ hóa tức thời xuống cơ sở dữ liệu quốc gia bảo mật của Phường Phú Lợi.</p>
              <p>Trợ lý ảo AI Gemini của công dân cũng sẽ được tự động cập nhật kiến thức khi có sự thay đổi cấu hình cổng thông tin hoặc các chiến dịch mới.</p>
            </div>
          </div>
          
          {/* Main Dashboard Viewport */}
          <div className="flex-1 bg-transparent min-w-0" id="admin-hub-panel">
            
              <AdminPanel 
                currentUser={currentUser}
                events={events}
          setEvents={setEvents}
          policyDocuments={policyDocuments}
          setPolicyDocuments={setPolicyDocuments}
                onConfigChange={(newConfig) => {
                  setWebConfig(newConfig);
                }}
                partyContributions={partyContributions}
                onUpdatePartyContribution={handleUpdatePartyContribution}
                onCampaignsChange={async () => {
                  const camps = await fetchAllCampaigns();
                  setCampaigns(camps);
                }}
                onJobsChange={async () => {
                  const jbs = await fetchAllJobs();
                  setJobs(jbs);
                }}
                allCampaigns={campaigns}
                allJobs={jobs}
                allRequests={requests}
                onRefreshRequests={async () => {
                  const reqs = await fetchAllRequests();
                  setRequests(reqs);
                }}
                activeTab={adminActiveTab}
                onTabChange={setAdminActiveTab}
                news={newsArticles}
                
                
                
                
                
                
                onAddNews={handleAddNews}
                onDeleteNews={handleDeleteNews}
                onDeleteMultipleNews={handleDeleteMultipleNews}
                onEditNews={handleEditNews}
                onRestoreDefaultNews={handleRestoreDefaultNews}
                officialPartners={officialPartners}
                onSavePartner={async (partner) => {
                  // Update local state immediately
                  setOfficialPartners(prev => {
                    const idx = prev.findIndex(p => p.id === partner.id);
                    let updated;
                    if (idx > -1) {
                      updated = [...prev];
                      updated[idx] = partner;
                    } else {
                      updated = [...prev, partner];
                    }
                    localStorage.setItem("phuloi_official_partners", JSON.stringify(updated));
                    return updated;
                  });

                  // Attempt background save to Firestore
                  try {
                    await saveOfficialPartnerToFirestore(partner);
                  } catch (err) {
                    console.error("Firestore save failed:", err);
                    const isRealAdmin = currentUser?.email?.toLowerCase() === "nguyenhuy.thudaumot@gmail.com" || currentUser?.isAdmin;
                    if (isRealAdmin) {
                      showToast("Cảnh báo đồng bộ", "Không thể lưu trực tiếp lên đám mây, dữ liệu đã được lưu tạm ở trình duyệt.", "warning");
                    }
                  }
                }}
                onDeletePartner={async (id) => {
                  // Update local state immediately
                  setOfficialPartners(prev => {
                    const updated = prev.filter(p => p.id !== id);
                    localStorage.setItem("phuloi_official_partners", JSON.stringify(updated));
                    return updated;
                  });

                  // Attempt background delete from Firestore
                  try {
                    await deleteOfficialPartnerFromFirestore(id);
                  } catch (err) {
                    console.error("Firestore delete failed:", err);
                    const isRealAdmin = currentUser?.email?.toLowerCase() === "nguyenhuy.thudaumot@gmail.com" || currentUser?.isAdmin;
                    if (isRealAdmin) {
                      showToast("Cảnh báo đồng bộ", "Không thể xóa trực tiếp trên đám mây, dữ liệu đã được xóa ở trình duyệt.", "warning");
                    }
                  }
                }}
              />
          </div>
        </div>

        {/* Admin Footer */}
        <div className="bg-white border-t border-slate-200 py-4 text-center text-[10px] text-slate-500 font-mono">
          BẢN QUYỀN © 2026 ỦY BAN MTTQ VIỆT NAM PHƯỜNG PHÚ LỢI • CỔNG QUẢN TRỊ AN SINH SỐ MẬT
        </div>

        {/* Global Toast Container inside admin */}
        <div id="app-toast-container" className="fixed top-24 right-4 sm:right-6 z-50 flex flex-col gap-3 max-w-md w-[calc(100%-2rem)] md:w-96 pointer-events-none">
          <AnimatePresence>
            {toasts.map((toast) => {
              const isSuccess = toast.type === "success";
              const isWarning = toast.type === "warning";
              const isError = toast.type === "error";
              
              // Light blue background configuration (nền xanh dương nhẹ) as requested by the user, with matching color borders
              const bgClass = isSuccess ? "bg-sky-50/95 border-emerald-200 shadow-emerald-500/5 text-slate-800" :
                              isWarning ? "bg-sky-50/95 border-amber-200 shadow-amber-500/5 text-slate-800" :
                              isError ? "bg-sky-50/95 border-rose-200 shadow-rose-500/5 text-slate-800" :
                              "bg-sky-50/95 border-sky-200 shadow-sky-500/5 text-slate-800";
                              
              const titleColor = isSuccess ? "text-emerald-700" :
                                 isWarning ? "text-amber-700" :
                                 isError ? "text-rose-700" :
                                 "text-sky-700";
              return (
                <motion.div
                  key={toast.id}
                  layout
                  initial={{ opacity: 0, x: 50, y: -20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 50, scale: 0.9 }}
                  className={`p-4 rounded-2xl border ${bgClass} shadow-lg backdrop-blur-md pointer-events-auto flex items-start space-x-3.5`}
                >
                  <div className="shrink-0">
                    {isSuccess ? <CheckCircle className="w-5 h-5 text-emerald-500 animate-pulse" /> :
                     isWarning ? <AlertTriangle className="w-5 h-5 text-amber-500" /> :
                     isError ? <AlertCircle className="w-5 h-5 text-rose-500" /> :
                     <BellRing className="w-5 h-5 text-sky-500" />}
                  </div>
                  <div className="flex-1 space-y-1 text-left">
                    <div className="flex justify-between items-center">
                      <h5 className={`font-black text-xs uppercase tracking-wider ${titleColor} font-sans`}>
                        {toast.title}
                      </h5>
                      <span className="text-[8px] text-slate-400 font-mono">Bây giờ</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-light">{toast.message}</p>
                  </div>
                  <button
                    onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                    className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer px-1 py-0.5 rounded hover:bg-sky-100/50 shrink-0"
                  >
                    ✕
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen tech-bg flex flex-col text-slate-800 font-sans selection:bg-sky-500 selection:text-white antialiased">
      <CircuitBackground />
      {/* 1. Header with Time, secure status, and visitor stats */}
      <Header 
        currentUser={currentUser}
        onAuthClick={() => setIsAuthModalOpen(true)}
        onLogoutClick={async () => {
          await signOut(auth);
          setCurrentUser(null);
          localStorage.removeItem("phuloi_current_user");
          sessionStorage.removeItem("phuloi_current_user");
          localStorage.removeItem("phuloi_remember_me");
          localStorage.removeItem("phuloi_cached_creds");
          sessionStorage.removeItem("phuloi_cached_creds");
        }}
        portalTitle={webConfig?.portalTitle}
        onAdminNavigate={handleAdminNavigate}
        onUpdateProfile={(updatedUser) => setCurrentUser(updatedUser)}
        totalVisits={visitorStats?.totalVisits || 14205}
        onlineCount={visitorStats?.onlineCount || 18}
      />

      {/* 2. Hero banner */}
      <ScrollReveal duration={0.8} yOffset={25}>
        <Hero webConfig={webConfig} />
      </ScrollReveal>

      {/* 4. Core Service Hub with lookups, registrations, jobs, and donors zone */}
      <ScrollReveal duration={1.0} yOffset={35}>
        <div className="py-6">
          <ServiceHub 
            webConfig={webConfig || undefined}
            requests={requests}
            campaigns={campaigns}
            donations={donations}
            jobs={jobs}
            currentUser={currentUser}
            onSubmitRequest={handleSubmitRequest}
            onSubmitDonation={handleSubmitDonation}
            onAuthClick={() => setIsAuthModalOpen(true)}
            onUpdateRequest={handleUpdateRequest}
            showToast={showToast}
            news={newsArticles}
            bookmarkedCampaignIds={bookmarkedCampaignIds}
            bookmarkedNewsIds={bookmarkedNewsIds}
            onToggleBookmarkCampaign={handleToggleBookmarkCampaign}
            onToggleBookmarkNews={handleToggleBookmarkNews}
            partyContributions={partyContributions}
            onSubmitPartyContribution={handleSubmitPartyContribution}
            onRatingSubmit={handleRatingSubmit}
          />
        </div>
      </ScrollReveal>

      {/* 5. Information Section: Slideshow & News in a grid */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 w-full items-stretch">
        <div className="lg:col-span-7">
          <ScrollReveal duration={1.0} yOffset={40} className="h-full">
            <ImageSlideshow currentUser={currentUser} />
          </ScrollReveal>
        </div>
        <div className="lg:col-span-5 flex flex-col h-[450px] lg:h-full">
          <ScrollReveal duration={1.0} yOffset={40} delay={0.2} className="h-full flex flex-col">
            <div className="flex-1 min-h-0">
              <NewsFeed 
                news={newsArticles} 
                currentUser={currentUser} 
                bookmarkedNewsIds={bookmarkedNewsIds}
                onToggleBookmarkNews={handleToggleBookmarkNews}
              />
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* 5.5 Community Forum */}
      <div className="max-w-7xl mx-auto px-4 pb-8 w-full h-[600px]">
        <ScrollReveal duration={1.0} yOffset={40} className="h-full">
          <CommunityForum currentUser={currentUser} onRequireAuth={() => setIsAuthModalOpen(true)} />
        </ScrollReveal>
      </div>

      {/* 5.5 Event Calendar */}
      <div className="max-w-7xl mx-auto px-4 pb-8 w-full">
        <ScrollReveal duration={1.0} yOffset={40}>
          <EventCalendar events={events} />
        </ScrollReveal>
      </div>

      {/* 5.6 Policy Documents */}
      <div id="policy-documents" className="max-w-7xl mx-auto px-4 pb-8 w-full">
        <ScrollReveal duration={1.0} yOffset={40}>
          <PolicyDocuments documents={policyDocuments} />
        </ScrollReveal>
      </div>

      {/* 6. AI Virtual Assistant (Gemini integration) */}
      <ScrollReveal duration={1.0} yOffset={45}>
        <AIChatbot webConfig={webConfig} />
      </ScrollReveal>

      {/* 7. Typical Partners Marquee (Đặc tả các đối tác đồng hành) */}
      <ScrollReveal duration={1.0} yOffset={45}>
        <PartnersMarquee officialPartners={officialPartners} />
      </ScrollReveal>

      {/* 8. Administrative contacts & Local quarters details */}
      <ScrollReveal duration={1.0} yOffset={45}>
        <ContactMap requests={requests} />
      </ScrollReveal>

      {/* 10. Government-portal styled footer */}
      <Footer />

      {/* 11. Interactive floating hearts (Emotional Connection Widget) */}
      <KindnessHearts news={newsArticles} />

      {/* 12. Floating Online Support Chat Widget (Khung chat hỗ trợ trực tuyến 24/7) */}
      <FloatingChat />

      {/* Real-time automated Toast Notifications Container */}
      <div id="app-toast-container" className="fixed top-24 right-4 sm:right-6 z-50 flex flex-col gap-3 max-w-md w-[calc(100%-2rem)] md:w-96 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => {
            const isSuccess = toast.type === "success";
            const isWarning = toast.type === "warning";
            const isError = toast.type === "error";
            
            // Light blue background configuration (nền xanh dương nhẹ) as requested by the user, with matching color borders
            const bgClass = isSuccess ? "bg-sky-50/95 border-emerald-200 shadow-emerald-500/5 text-slate-800" :
                            isWarning ? "bg-sky-50/95 border-amber-200 shadow-amber-500/5 text-slate-800" :
                            isError ? "bg-sky-50/95 border-rose-200 shadow-rose-500/5 text-slate-800" :
                            "bg-sky-50/95 border-sky-200 shadow-sky-500/5 text-slate-800";
                            
            const titleColor = isSuccess ? "text-emerald-700" :
                               isWarning ? "text-amber-700" :
                               isError ? "text-rose-700" :
                               "text-sky-700";

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, x: 50, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                exit={{ opacity: 0, x: 50, scale: 0.9 }}
                className={`p-4 rounded-2xl border ${bgClass} shadow-lg backdrop-blur-md pointer-events-auto flex items-start space-x-3.5`}
              >
                <div className="shrink-0">
                  {isSuccess ? <CheckCircle className="w-5 h-5 text-emerald-500 animate-pulse" /> :
                   isWarning ? <AlertTriangle className="w-5 h-5 text-amber-500" /> :
                   isError ? <AlertCircle className="w-5 h-5 text-rose-500" /> :
                   <BellRing className="w-5 h-5 text-sky-500" />}
                </div>
                
                <div className="flex-1 space-y-1 text-left">
                  <div className="flex justify-between items-center">
                    <h5 className={`font-black text-xs uppercase tracking-wider ${titleColor} font-sans`}>
                      {toast.title}
                    </h5>
                    <span className="text-[8px] text-slate-400 font-mono">Bây giờ</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed font-light">{toast.message}</p>
                </div>

                <button
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer px-1 py-0.5 rounded hover:bg-sky-100/50 shrink-0"
                >
                  ✕
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Auth Modal overlay */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(profile) => {
          setCurrentUser(profile);
        }}
      />
    </div>
  );
}
