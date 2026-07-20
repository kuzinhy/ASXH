import React, { useState, useEffect, useMemo, useRef } from "react";
import Papa from "papaparse";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area, LineChart, Line } from "recharts";
import { ShieldCheck, ShieldAlert, Users, Settings, Sliders, Activity, ChevronDown,
  Plus, Edit2, Trash2, Save, X, Check, Info, Lock,
  MapPin, Phone, Mail, Clock, RefreshCw, AlertCircle, FileText, Gift, Briefcase, CheckCircle2,
  BellRing, Download, Globe, Link2, Loader2, Calendar, Award, Trophy, Star,
  MessageSquare, Copy, ExternalLink, Send, Search, Archive, Eye, Filter,
  Vote, Edit3, Sparkles, ImagePlus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, WebConfig, Campaign, JobListing, CitizenRequest, SupportCategory, RequestStatus, NewsArticle, OfficialPartner, SystemBadge, UserBadgeInfo, PartyContribution, CalendarEvent } from "../types";
import AdminForumPanel from "./AdminForumPanel";
import ProfileModal from "./ProfileModal";
import PushNotificationCenter from "./PushNotificationCenter";
import ConfirmDialog from "./ConfirmDialog";
import { QUARTERS_LIST } from "../constants";
import { fetchAllUserProfiles, updateUserProfileInFirestore, fetchWebConfig, saveWebConfig, DEFAULT_WEB_CONFIG, saveCampaignToFirestore, deleteCampaignFromFirestore, saveJobToFirestore, deleteJobFromFirestore, updateRequestInFirestore, fetchSystemBadges, saveSystemBadge, deleteSystemBadge, OperationType, saveEventToFirestore, deleteEventFromFirestore, savePolicyDocumentToFirestore, deletePolicyDocumentFromFirestore } from "../lib/firebaseSync";
import { googleSignIn, getAccessToken } from "../lib/googleAuth";
import { sendSmsNotification, sendEmailNotification } from "../lib/email";
import { auth } from "../lib/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { syncDriveFolderToFirestore, fetchSyncedBrainDocuments, DEFAULT_FOLDER_ID, BrainDocument } from "../lib/brainSync";
import { fuzzyMatch, smartSortRequests, searchRank } from "../utils/algorithms";
import { AccessLog, getOrCreateAccessLogs, simulateIncomingLiveVisitor } from "../lib/analyticsSync";

interface AdminPanelProps {
  events?: CalendarEvent[];
  setEvents?: React.Dispatch<React.SetStateAction<CalendarEvent[]>>;
  policyDocuments?: import('../types').PolicyDocument[];
  setPolicyDocuments?: React.Dispatch<React.SetStateAction<import('../types').PolicyDocument[]>>;
  currentUser: UserProfile | null;
  onConfigChange?: (newConfig: WebConfig) => void;
  onCampaignsChange?: () => void;
  onJobsChange?: () => void;
  allCampaigns: Campaign[];
  allJobs: JobListing[];
  allRequests: CitizenRequest[];
  onRefreshRequests?: () => void;
  activeTab?: any;
  onTabChange?: (tab: any) => void;
  news?: NewsArticle[];
  fbUrl?: string;
  setFbUrl?: (url: string) => void;
  analyzingFb?: boolean;
  newsSuccess?: string;
  newsError?: string;
  onAnalyze?: (e: React.FormEvent) => void;
  onAddNews?: (news: Omit<NewsArticle, "id" | "publishedAt">) => void;
  onDeleteNews?: (id: string) => void;
  onDeleteMultipleNews?: (ids: string[]) => void;
  onEditNews?: (id: string, updatedData: Partial<NewsArticle>) => void;
  onRestoreDefaultNews?: () => void;
  officialPartners?: OfficialPartner[];
  onSavePartner?: (partner: OfficialPartner) => Promise<void>;
  onDeletePartner?: (id: string) => Promise<void>;
  partyContributions?: PartyContribution[];
  onUpdatePartyContribution?: (id: string, updates: Partial<PartyContribution>) => Promise<void>;
}

type AdminTab = "roles" | "policies" | "config" | "campaigns" | "jobs" | "requests" | "notifications" | "news" | "events" | "analytics" | "brain" | "partners" | "partyFeedback" | "aiPersonality";


interface ActivityLog {
  id: string;
  timestamp: string;
  adminName: string;
  action: string;
  details: string;
  type: "success" | "info" | "warning";
}

export default function AdminPanel({
  currentUser,
  onConfigChange,
  onCampaignsChange,
  onJobsChange,
  allCampaigns,
  allJobs,
  allRequests,
  onRefreshRequests,
  activeTab: propActiveTab,
  onTabChange,
  news = [],
  events = [],
  setEvents,
  policyDocuments = [],
  setPolicyDocuments,
  fbUrl = "",
  setFbUrl,
  analyzingFb = false,
  newsSuccess = "",
  newsError = "",
  onAnalyze,
  onDeleteNews,
  onDeleteMultipleNews,
  onEditNews,
  onAddNews,
  onRestoreDefaultNews,
  officialPartners = [],
  onSavePartner,
  onDeletePartner,
  partyContributions = [],
  onUpdatePartyContribution,
}: AdminPanelProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<any>("roles");
  const activeTab = propActiveTab !== undefined ? propActiveTab : internalActiveTab;
  const setActiveTab = onTabChange !== undefined ? onTabChange : setInternalActiveTab;
  const [isAdminDemoMode, setIsAdminDemoMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const getQuarterName = (q: any) => typeof q === 'object' && q !== null ? q.name : q;
  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({isOpen: false, title: "", message: "", onConfirm: () => {}});
  const showConfirm = (title: string, message: string, onConfirm: () => void) => { setConfirmConfig({ isOpen: true, title, message, onConfirm }); };
  const hideConfirm = () => { setConfirmConfig(prev => ({ ...prev, isOpen: false })); };
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [systemBadges, setSystemBadges] = useState<SystemBadge[]>([]);
  const [editingBadge, setEditingBadge] = useState<SystemBadge | null>(null);
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const [userBadgeModalOpen, setUserBadgeModalOpen] = useState(false);
  const [selectedUserForBadge, setSelectedUserForBadge] = useState<UserProfile | null>(null);
  const [editingUserProfile, setEditingUserProfile] = useState<UserProfile | null>(null);
  const [systemBadgesManagementOpen, setSystemBadgesManagementOpen] = useState(false);
  const [config, setConfig] = useState<WebConfig | null>(null);
  const [newCustomCategory, setNewCustomCategory] = useState("");

  // States for Partners Management
  const [partnerIdInput, setPartnerIdInput] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [partnerRole, setPartnerRole] = useState("");
  const [partnerImageUrl, setPartnerImageUrl] = useState("");
  const [partnerDescription, setPartnerDescription] = useState("");
  const [partnerAmount, setPartnerAmount] = useState("");
  const [isAddPartnerOpen, setIsAddPartnerOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<OfficialPartner | null>(null);

  const handleAddPartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName.trim() || !partnerRole.trim()) {
      showFeedback("⚠️ Vui lòng điền đầy đủ Tên và Vai trò của đơn vị đồng hành.", true);
      return;
    }
    setLoading(true);
    try {
      const newId = partnerIdInput.trim() || `partner-${Date.now()}`;
      
      let finalImageUrl = partnerImageUrl.trim();
      if (finalImageUrl.includes("drive.google.com")) {
        const fileIdMatch = finalImageUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (fileIdMatch && fileIdMatch[1]) {
          finalImageUrl = `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
        } else {
          const idParamMatch = finalImageUrl.match(/[?&]id=([a-zA-Z0-9_-]+)/);
          if (idParamMatch && idParamMatch[1]) {
            finalImageUrl = `https://lh3.googleusercontent.com/d/${idParamMatch[1]}`;
          }
        }
      }

      const partnerData: OfficialPartner = {
        id: newId,
        name: partnerName.trim(),
        role: partnerRole.trim(),
        imageUrl: finalImageUrl || "https://lh3.googleusercontent.com/d/1VdHot14lAHtlOODpodU5W1OAHIKuCwVE",
        description: partnerDescription.trim() || undefined,
        amount: partnerAmount.trim() || undefined,
        createdAt: editingPartner?.createdAt || new Date().toISOString()
      };
      if (onSavePartner) {
        await onSavePartner(partnerData);
      }
      addActivityLog(
        "Đối tác đồng hành",
        `Đã lưu đơn vị đồng hành: "${partnerData.name}" (${partnerData.role})`,
        "success"
      );
      showFeedback(`🎉 Đã lưu đơn vị đồng hành [${partnerData.name}] thành công!`);
      // Reset form
      setPartnerIdInput("");
      setPartnerName("");
      setPartnerRole("");
      setPartnerImageUrl("");
      setPartnerDescription("");
      setPartnerAmount("");
      setIsAddPartnerOpen(false);
      setEditingPartner(null);
    } catch (err: any) {
      console.error(err);
      showFeedback(`❌ Lỗi lưu đơn vị đồng hành: ${err.message || String(err)}`, true);
    } finally {
      setLoading(false);
    }
  };

  const handleEditPartnerClick = (partner: OfficialPartner) => {
    setEditingPartner(partner);
    setPartnerIdInput(partner.id);
    setPartnerName(partner.name);
    setPartnerRole(partner.role);
    setPartnerImageUrl(partner.imageUrl);
    setPartnerDescription(partner.description || "");
    setPartnerAmount(partner.amount || "");
    setIsAddPartnerOpen(true);
  };

  const handleDeletePartnerClick = (id: string, name: string) => {
    showConfirm(
      "Xác nhận xóa đơn vị đồng hành",
      `Bạn có chắc chắn muốn xóa đơn vị đồng hành "${name}" khỏi hệ thống? Thao tác này không thể hoàn tác.`,
      async () => {
        setLoading(true);
        try {
          if (onDeletePartner) {
            await onDeletePartner(id);
          }
          addActivityLog(
            "Đối tác đồng hành",
            `Đã xóa đơn vị đồng hành: "${name}"`,
            "warning"
          );
          showFeedback(`🗑️ Đã xóa đơn vị đồng hành [${name}] thành công.`);
        } catch (err: any) {
          console.error(err);
          showFeedback(`❌ Lỗi xóa đơn vị đồng hành: ${err.message || String(err)}`, true);
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // States for Assistant Brain & Google Drive
  const [syncFolderId, setSyncFolderId] = useState(DEFAULT_FOLDER_ID);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number; currentFileName: string } | null>(null);
  const [syncStatus, setSyncStatus] = useState<{ text: string; isError: boolean } | null>(null);
  const [manualToken, setManualToken] = useState("");
  const [syncedDocs, setSyncedDocs] = useState<BrainDocument[]>([]);

  const loadSyncedDocs = async () => {
    const docs = await fetchSyncedBrainDocuments();
    setSyncedDocs(docs);
  };

  useEffect(() => {
    loadSyncedDocs();
  }, []);

  const handleGoogleSignInAndSync = async () => {
    setSyncing(true);
    setSyncStatus(null);
    setSyncProgress(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.addScope("https://www.googleapis.com/auth/drive.readonly");
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken;

      if (!token) {
        throw new Error("Không thể nhận diện mã Access Token từ tài khoản Google của bạn.");
      }

      const syncResult = await syncDriveFolderToFirestore(token, syncFolderId, (prog) => {
        setSyncProgress(prog);
      });

      if (syncResult.success) {
        setSyncStatus({ text: `Đồng bộ thành công ${syncResult.syncedCount} tài liệu từ Google Drive!`, isError: false });
        loadSyncedDocs();
      } else {
        setSyncStatus({ text: `Đồng bộ hoàn tất với một số lỗi: ${syncResult.errors.join(", ")}`, isError: true });
      }
    } catch (err: any) {
      console.error(err);
      setSyncStatus({ text: `Lỗi xác thực hoặc đồng bộ: ${err.message || String(err)}`, isError: true });
    } finally {
      setSyncing(false);
      setSyncProgress(null);
    }
  };

  const handleManualTokenSync = async () => {
    if (!manualToken.trim()) return;
    setSyncing(true);
    setSyncStatus(null);
    setSyncProgress(null);
    try {
      const syncResult = await syncDriveFolderToFirestore(manualToken, syncFolderId, (prog) => {
        setSyncProgress(prog);
      });

      if (syncResult.success) {
        setSyncStatus({ text: `Đồng bộ thành công ${syncResult.syncedCount} tài liệu từ Google Drive bằng Token thủ công!`, isError: false });
        loadSyncedDocs();
        setManualToken("");
      } else {
        setSyncStatus({ text: `Đồng bộ thất bại: ${syncResult.errors.join(", ")}`, isError: true });
      }
    } catch (err: any) {
      console.error(err);
      setSyncStatus({ text: `Lỗi đồng bộ bằng Token: ${err.message || String(err)}`, isError: true });
    } finally {
      setSyncing(false);
      setSyncProgress(null);
    }
  };
  
  // Local copies for editing
  const [campaignsList, setCampaignsList] = useState<Campaign[]>(allCampaigns);
  const [jobsList, setJobsList] = useState<JobListing[]>(allJobs);
  const [requestsList, setRequestsList] = useState<CitizenRequest[]>(allRequests);

  // Status/Alert message states
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  // Advanced states
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [reqSearchQuery, setReqSearchQuery] = useState("");
  const [exportTimeframe, setExportTimeframe] = useState<"week" | "month" | "quarter">("week");
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [logSearchQuery, setLogSearchQuery] = useState("");
  const [editNewsData, setEditNewsData] = useState<Record<string, Partial<NewsArticle>>>({});
  const [logCategoryFilter, setLogCategoryFilter] = useState("ALL");

  // Traffic Analytics and Monitoring States
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [accessSearchQuery, setAccessSearchQuery] = useState("");
  const [accessTypeFilter, setAccessTypeFilter] = useState("ALL");
  const [accessOSFilter, setAccessOSFilter] = useState("ALL");
  const [isMonitoringTraffic, setIsMonitoringTraffic] = useState(true);

  // Initialize and periodically simulate traffic
  useEffect(() => {
    setAccessLogs(getOrCreateAccessLogs());
  }, []);

  useEffect(() => {
    if (!isMonitoringTraffic || activeTab !== "analytics") return;

    const interval = setInterval(() => {
      // 35% chance of a new incoming visitor every 10 seconds
      if (Math.random() < 0.35) {
        setAccessLogs(prev => {
          const newLog = simulateIncomingLiveVisitor(prev);
          return [...prev, newLog];
        });
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isMonitoringTraffic, activeTab]);

  // Filter access logs based on search and dropdowns
  const filteredAccessLogs = useMemo(() => {
    return accessLogs.filter(log => {
      const matchesSearch = 
        log.ip.includes(accessSearchQuery) ||
        (log.fullName && log.fullName.toLowerCase().includes(accessSearchQuery.toLowerCase())) ||
        (log.userEmail && log.userEmail.toLowerCase().includes(accessSearchQuery.toLowerCase())) ||
        log.page.toLowerCase().includes(accessSearchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(accessSearchQuery.toLowerCase()) ||
        log.location.toLowerCase().includes(accessSearchQuery.toLowerCase());

      const matchesType = accessTypeFilter === "ALL" || log.userType === accessTypeFilter;
      const matchesOS = accessOSFilter === "ALL" || log.device.toLowerCase().includes(accessOSFilter.toLowerCase());

      return matchesSearch && matchesType && matchesOS;
    });
  }, [accessLogs, accessSearchQuery, accessTypeFilter, accessOSFilter]);

  // Compute breakdown metrics
  const trafficMetrics = useMemo(() => {
    const total = accessLogs.length;
    const guests = accessLogs.filter(l => l.userType === "Khách vãng lai").length;
    const members = total - guests;
    
    // OS breakdown
    const osMap: Record<string, number> = {};
    // Browser breakdown
    const browserMap: Record<string, number> = {};
    // Page breakdown
    const pageMap: Record<string, number> = {};

    accessLogs.forEach(l => {
      // OS simplify
      let os = "Khác";
      if (l.device.includes("Windows")) os = "Windows";
      else if (l.device.includes("Mac") || l.device.includes("macOS")) os = "macOS";
      else if (l.device.includes("iOS") || l.device.includes("iPhone")) os = "iOS (Apple)";
      else if (l.device.includes("Android")) os = "Android";
      else if (l.device.includes("Linux")) os = "Linux";
      osMap[os] = (osMap[os] || 0) + 1;

      browserMap[l.browser] = (browserMap[l.browser] || 0) + 1;
      pageMap[l.page] = (pageMap[l.page] || 0) + 1;
    });

    const osChartData = Object.entries(osMap).map(([name, value]) => ({ name, value }));
    const browserChartData = Object.entries(browserMap).map(([name, value]) => ({ name, value }));
    const pageChartData = Object.entries(pageMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);

    return {
      total,
      guests,
      members,
      osChartData,
      browserChartData,
      pageChartData
    };
  }, [accessLogs]);

  // Active edit/add modals

  useEffect(() => {
    setCampaignsList(allCampaigns);
  }, [allCampaigns]);

  useEffect(() => {
    setJobsList(allJobs);
  }, [allJobs]);

  useEffect(() => {
    setRequestsList(allRequests);
  }, [allRequests]);

  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editingJob, setEditingJob] = useState<JobListing | null>(null);
  const [isAddCampaignOpen, setIsAddCampaignOpen] = useState(false);
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);

  // Form states for Campaigns
  const [campId, setCampId] = useState("");
  const [campTitle, setCampTitle] = useState("");
  const [campDesc, setCampDesc] = useState("");
  const [campTarget, setCampTarget] = useState(0);
  const [campCurrent, setCampCurrent] = useState(0);
  const [campCategory, setCampCategory] = useState("Cứu trợ");
  const [campImageUrl, setCampImageUrl] = useState("");

  // Form states for Jobs
  const [jobIdInput, setJobIdInput] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [jobCompany, setJobCompany] = useState("");
  const [jobSalary, setJobSalary] = useState("");
  const [jobLocation, setJobLocation] = useState("");
  const [jobDesc, setJobDesc] = useState("");
  const [jobRequirements, setJobRequirements] = useState("");
  const [jobContact, setJobContact] = useState("");
  const [jobImageUrl, setJobImageUrl] = useState("");
  const [manualNewsTitle, setManualNewsTitle] = useState("");
  const [manualNewsSnippet, setManualNewsSnippet] = useState("");
  const [manualNewsImageUrl, setManualNewsImageUrl] = useState("");
  const [isUploadingManualNewsImage, setIsUploadingManualNewsImage] = useState(false);
  const [isUploadingDriveImage, setIsUploadingDriveImage] = useState(false);
  const [uploadedDriveImageUrl, setUploadedDriveImageUrl] = useState("");
  const [manualNewsSourceUrl, setManualNewsSourceUrl] = useState("");
  const [newsSearchQuery, setNewsSearchQuery] = useState("");
  const [newsCategoryFilter, setNewsCategoryFilter] = useState("All");
  const [newsStatusFilter, setNewsStatusFilter] = useState("All");
  const [newsSortOrder, setNewsSortOrder] = useState<"newest" | "oldest" | "title-asc" | "title-desc">("newest");
  const [selectedNewsIds, setSelectedNewsIds] = useState<string[]>([]);
  const [editingNewsItem, setEditingNewsItem] = useState<NewsArticle | null>(null);
  const [isUploadingEditNewsImage, setIsUploadingEditNewsImage] = useState(false);
  const [isAddNewsOpen, setIsAddNewsOpen] = useState(false);
  const [manualNewsCategory, setManualNewsCategory] = useState("Tin An Sinh");
  const [manualNewsStatus, setManualNewsStatus] = useState<"published" | "draft" | "archived">("published");
  const [manualNewsAuthor, setManualNewsAuthor] = useState("Ban Biên Tập");

  // Filter and sort the news items
  const filteredNews = useMemo(() => {
    let result = [...news];

    // Search query
    if (newsSearchQuery.trim()) {
      const q = newsSearchQuery.toLowerCase();
      result = result.filter(item => 
        item.title.toLowerCase().includes(q) || 
        item.body.toLowerCase().includes(q) ||
        (item.author && item.author.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (newsCategoryFilter !== "All") {
      result = result.filter(item => item.category === newsCategoryFilter);
    }

    // Status filter
    if (newsStatusFilter !== "All") {
      result = result.filter(item => {
        const itemStatus = item.status || "published";
        return itemStatus === newsStatusFilter;
      });
    }

    // Sort order
    result.sort((a, b) => {
      if (newsSortOrder === "newest") {
        return new Date(b.publishedAt || b.date).getTime() - new Date(a.publishedAt || a.date).getTime();
      } else if (newsSortOrder === "oldest") {
        return new Date(a.publishedAt || a.date).getTime() - new Date(b.publishedAt || b.date).getTime();
      } else if (newsSortOrder === "title-asc") {
        return a.title.localeCompare(b.title, 'vi');
      } else if (newsSortOrder === "title-desc") {
        return b.title.localeCompare(a.title, 'vi');
      }
      return 0;
    });

    return result;
  }, [news, newsSearchQuery, newsCategoryFilter, newsStatusFilter, newsSortOrder]);

  // Filters for requests manager
  const [reqStatusFilter, setReqStatusFilter] = useState<string>("ALL");
  const [reqQuarterFilter, setReqQuarterFilter] = useState<string>("ALL");

  // Recharts states and data helpers
  const [chartTimeframe, setChartTimeframe] = useState<"current_month" | "all_time">("current_month");

  const getRechartsData = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const filtered = requestsList.filter(req => {
      if (chartTimeframe === "all_time") return true;
      if (!req.createdAt) return false;
      const d = new Date(req.createdAt);
      return !isNaN(d.getTime()) && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const categoryCounts: { [key: string]: number } = {};
    filtered.forEach(req => {
      const cat = req.category || "Khác";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    });

    const total = filtered.length;
    const data = Object.keys(categoryCounts).map(cat => ({
      name: cat,
      value: categoryCounts[cat],
      percentage: total > 0 ? ((categoryCounts[cat] / total) * 100).toFixed(1) : "0.0"
    })).sort((a, b) => b.value - a.value);

    return { data, total };
  };

  const { data: chartData, total: chartTotal } = getRechartsData();

  const getCategoryColor = (catName: string) => {
    switch (catName) {
      case "Lương thực, Nhu yếu phẩm":
        return "#10b981"; // Emerald
      case "Chăm sóc Y tế, Thẻ BHYT":
        return "#06b6d4"; // Cyan/Teal
      case "Trợ cấp Khó khăn, Tài chính":
        return "#f59e0b"; // Amber
      case "Học bổng, Đồ dùng học tập":
        return "#6366f1"; // Indigo
      case "Sửa chữa nhà, Nhà tình thương":
        return "#f43f5e"; // Rose
      case "Hỗ trợ việc làm":
        return "#8b5cf6"; // Violet
      default:
        return "#64748b"; // Slate
    }
  };

  const getQuarterDensityData = () => {
    return QUARTERS_LIST.map(kp => {
      const liveCount = requestsList.filter(req => req.quarter === kp.name).length;
      const baseCount = kp.stats.requests;
      return {
        name: kp.shortName,
        "Yêu cầu trực tuyến (Mới)": liveCount,
        "Hồ sơ lưu trữ (Lịch sử)": baseCount,
        total: liveCount + baseCount
      };
    }).sort((a, b) => b.total - a.total);
  };

  const quarterDensityData = getQuarterDensityData();

  const hasAdminPrivilege = currentUser?.isAdmin || currentUser?.email?.toLowerCase() === "nguyenhuy.thudaumot@gmail.com" || isAdminDemoMode;

  // Message Templates states
  const [msgTemplates, setMsgTemplates] = useState<{ [key: string]: string }>({
    SUBMITTED: "Kính chào ông/bà {FullName}, hồ sơ cứu trợ mã số {ReqId} của ông/bà đã được hệ thống của Ủy ban MTTQ Việt Nam Phường Phú Lợi tiếp nhận thành công vào lúc {CreatedAt}. Chúng tôi sẽ nhanh chóng tiến hành xác minh thực tế. Trân trọng!",
    VERIFYING: "Kính chào ông/bà {FullName}, hồ sơ cứu trợ mã số {ReqId} của ông/bà đang được Tổ công tác địa phương Khu phố {Quarter} kiểm tra xác minh thực tế hoàn cảnh. Xin vui lòng giữ liên lạc. Trân trọng!",
    APPROVED: "Kính chào ông/bà {FullName}, hồ sơ cứu trợ mã số {ReqId} của ông/bà đã được Ban Chỉ đạo Xét duyệt Phường Phú Lợi phê duyệt hỗ trợ danh mục [{Category}]. Ghi chú: {Notes}. Trân trọng!",
    COMPLETED: "Kính chào ông/bà {FullName}, hồ sơ cứu trợ mã số {ReqId} của ông/bà đã xử lý xong và hoàn tất cấp phát cứu trợ. Chi tiết: {Notes}. Chúc ông/bà và gia đình nhiều sức khỏe, vượt qua khó khăn!"
  });
  const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
  const [activeTemplateTab, setActiveTemplateTab] = useState<string>("COMPLETED");

  // Send Quick message Modal
  const [sendingRequest, setSendingRequest] = useState<CitizenRequest | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<"zalo" | "sms">("zalo");
  const [editedMsgText, setEditedMsgText] = useState("");
  const [copiedStatus, setCopiedStatus] = useState(false);

  // Load saved templates
  useEffect(() => {
    const saved = localStorage.getItem("phuloi_message_templates");
    if (saved) {
      try {
        setMsgTemplates(JSON.parse(saved));
      } catch (e) {
        console.error("Lỗi đọc mẫu tin nhắn:", e);
      }
    }
  }, []);

  // Load and seed activity logs
  useEffect(() => {
    const saved = localStorage.getItem("phuloi_admin_activity_logs");
    if (saved) {
      try {
        setActivityLogs(JSON.parse(saved));
      } catch (e) {
        console.error("Lỗi đọc nhật ký hoạt động:", e);
      }
    } else {
      const initialLogs: ActivityLog[] = [
        {
          id: "log-1",
          timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
          adminName: "Nguyễn Huy",
          action: "Phân quyền người dùng",
          details: "Cập nhật quyền Cán bộ khu phố cho tài khoản tranbinh.officer@gmail.com",
          type: "success"
        },
        {
          id: "log-2",
          timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
          adminName: "Nguyễn Huy",
          action: "Cập nhật cổng thông tin",
          details: "Thay đổi thông báo khẩn cấp và đường dây nóng an sinh xã hội",
          type: "info"
        },
        {
          id: "log-3",
          timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
          adminName: "Nguyễn Huy",
          action: "Chiến dịch cứu trợ",
          details: "Khởi động chiến dịch 'Mùa trăng yêu thương trẻ em Phú Lợi'",
          type: "success"
        }
      ];
      setActivityLogs(initialLogs);
      localStorage.setItem("phuloi_admin_activity_logs", JSON.stringify(initialLogs));
    }
  }, []);

  const addActivityLog = (action: string, details: string, type: "success" | "info" | "warning" = "info") => {
    const newLog: ActivityLog = {
      id: "log-" + Date.now(),
      timestamp: new Date().toISOString(),
      adminName: currentUser?.fullName || "Quản trị viên",
      action,
      details,
      type
    };
    setActivityLogs(prev => {
      const updated = [newLog, ...prev].slice(0, 50); // Keep last 50 logs
      localStorage.setItem("phuloi_admin_activity_logs", JSON.stringify(updated));
      return updated;
    });
  };

  const getFormattedMessage = (req: CitizenRequest, templateText: string) => {
    if (!req) return "";
    let text = templateText || "";
    text = text.replace(/{FullName}/g, req.fullName || "");
    text = text.replace(/{ReqId}/g, req.id || "");
    text = text.replace(/{Phone}/g, req.phone || "");
    text = text.replace(/{Quarter}/g, req.quarter || "");
    text = text.replace(/{Category}/g, req.category || "");
    text = text.replace(/{Notes}/g, req.notes || "Không có");
    text = text.replace(/{CreatedAt}/g, req.createdAt ? new Date(req.createdAt).toLocaleString("vi-VN") : "");
    return text;
  };

  const handleSaveTemplates = () => {
    localStorage.setItem("phuloi_message_templates", JSON.stringify(msgTemplates));
    showFeedback("💾 Đã lưu cấu hình mẫu tin nhắn tự động thành công!");
  };

  // Sync prop changes
  useEffect(() => {
    setCampaignsList(allCampaigns);
  }, [allCampaigns]);

  useEffect(() => {
    setJobsList(allJobs);
  }, [allJobs]);

  useEffect(() => {
    setRequestsList(allRequests);
  }, [allRequests]);

  // Load Admin Data on tab changes or demo toggle
  useEffect(() => {
    if (!hasAdminPrivilege) return;

    const defaultUsers: UserProfile[] = [
      {
        uid: "user-dem-1",
        email: "nguyenhuy.thudaumot@gmail.com",
        fullName: "Nguyễn Huy",
        phone: "0909112233",
        address: "15 Huỳnh Văn Lũy, Khu phố 3",
        quarter: "Khu phố 3",
        isAdmin: true
      },
      {
        uid: "user-dem-2",
        email: "tranbinh.officer@gmail.com",
        fullName: "Trần Bình",
        phone: "0912345678",
        address: "Ủy ban MTTQ Phường Phú Lợi, Đường Phú Lợi",
        quarter: "Khu phố 1",
        isOfficer: true,
        officerQuarter: "Khu phố 1"
      },
      {
        uid: "user-dem-3",
        email: "lehoa.volunteer@gmail.com",
        fullName: "Lê Hoa",
        phone: "0988776655",
        address: "88 Phạm Ngọc Thạch, Khu phố 4",
        quarter: "Khu phố 4",
        isVolunteer: true,
        volunteerQuarters: ["Khu phố 4", "Khu phố 5"]
      }
    ];

    const loadData = async () => {
      setLoading(true);
      try {
        const usersRes = await fetchAllUserProfiles().catch(e => {
          console.warn("Could not fetch users:", e);
          return null;
        });
        if (usersRes && usersRes.length > 0) {
          setUsers(usersRes);
        } else {
          setUsers(defaultUsers);
        }
      } catch(e) {
        setUsers(defaultUsers);
      }

      try {
        
      try {
        const badgesRes = await fetchSystemBadges();
        setSystemBadges(badgesRes);
      } catch(e) { console.error(e); }
      const configRes = await fetchWebConfig().catch(e => {
          console.warn("Could not fetch config:", e);
          return null;
        });
        if (configRes) {
          setConfig(configRes);
        } else {
          setConfig({
            portalTitle: "Cổng An Sinh Xã Hội Số",
            emergencyPhone: "0909.112.xxx - 028.3821.xxx",
            contactEmail: "mttq.phuloi@binhduong.gov.vn",
            workingHours: "Thứ Hai - Thứ Sáu: 07:30 - 11:30 | 13:30 - 17:00",
            announcementText: "Ủy ban MTTQ Việt Nam phường Phú Lợi triển khai mở rộng tiếp nhận đăng ký cứu trợ trực tuyến, hỗ trợ tìm việc làm và kết nối quyên góp minh bạch.",
            socialLinks: { facebook: "", zalo: "", website: "" }
          });
        }
      } catch (e) {
        console.warn("Could not fetch config:", e);
      }
      
      setLoading(false);
    };

    loadData();
  }, [hasAdminPrivilege]);

  const showFeedback = (text: string, isError = false) => {
    setStatusMessage({ text, isError });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // 1. Role Change Handler
  const handleRoleChange = async (userId: string, roleField: keyof UserProfile, value: any) => {
    setUpdatingUserId(userId);
    try {
      const targetUser = users.find(u => u.uid === userId);
      if (!targetUser) return;

      const updatedUser = {
        ...targetUser,
        [roleField]: value
      };

      // Clean up contradictory roles
      if (roleField === "isAdmin" && value === true) {
        updatedUser.isOfficer = false;
        updatedUser.isVolunteer = false;
      }
      if (roleField === "isOfficer" && value === true) {
        updatedUser.isAdmin = false;
        updatedUser.officerQuarter = updatedUser.quarter || "Khu phố 3";
      }

      await updateUserProfileInFirestore(userId, updatedUser);
      setUsers(prev => prev.map(u => u.uid === userId ? updatedUser : u));
      addActivityLog(
        "Phân quyền người dùng",
        `Đã thay đổi vai trò [${roleField === "isAdmin" ? "Quản trị viên" : roleField === "isOfficer" ? "Cán bộ địa bàn" : "Tình nguyện viên"}] thành [${value ? "Bật" : "Tắt"}] cho người dùng ${targetUser.fullName}`,
        "info"
      );
      showFeedback(`🎉 Đã cập nhật quyền hạn cho ${targetUser.fullName} thành công!`);
    } catch (e) {
      console.error(e);
      showFeedback("Lỗi khi cập nhật vai trò người dùng.", true);
    } finally {
      setUpdatingUserId(null);
    }
  };

    const handleAddCustomCategory = async () => {
    if (!newCustomCategory.trim() || !config) return;
    const updatedCategories = [...(config.customCategories || []), newCustomCategory.trim()];
    const newConfig = { ...config, customCategories: updatedCategories };
    setConfig(newConfig);
    setNewCustomCategory("");
    
    try {
      await saveWebConfig(newConfig);
      if (onConfigChange) onConfigChange(newConfig);
      addActivityLog("Quản lý danh mục", "Thêm danh mục hỗ trợ mới: " + newCustomCategory, "success");
      showFeedback("Thêm danh mục hỗ trợ thành công!");
    } catch (e) {
      console.error(e);
      showFeedback("Lỗi khi thêm danh mục hỗ trợ!");
    }
  };

  const handleDeleteCustomCategory = async (catToDelete: string) => {
    if (!config || !config.customCategories) return;
    const updatedCategories = config.customCategories.filter(c => c !== catToDelete);
    const newConfig = { ...config, customCategories: updatedCategories };
    setConfig(newConfig);
    
    try {
      await saveWebConfig(newConfig);
      if (onConfigChange) onConfigChange(newConfig);
      addActivityLog("Quản lý danh mục", "Xóa danh mục hỗ trợ: " + catToDelete, "success");
      showFeedback("Đã xóa danh mục hỗ trợ!");
    } catch (e) {
      console.error(e);
      showFeedback("Lỗi khi xóa danh mục hỗ trợ!");
    }
  };

  // 2. Web Config Handler
  

  const handleSaveBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBadge) return;
    setLoading(true);
    try {
      await saveSystemBadge(editingBadge);
      const res = await fetchSystemBadges();
      setSystemBadges(res);
      setBadgeModalOpen(false);
      setEditingBadge(null);
      showFeedback("Lưu huy hiệu thành công!");
    } catch (err) {
      console.error(err);
      showFeedback("Lỗi khi lưu huy hiệu!");
    }
    setLoading(false);
  };

  const handleDeleteBadge = async (id: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa huy hiệu này?")) return;
    setLoading(true);
    try {
      await deleteSystemBadge(id);
      setSystemBadges(systemBadges.filter(b => b.id !== id));
      showFeedback("Đã xóa huy hiệu!");
    } catch (err) {
      console.error(err);
      showFeedback("Lỗi khi xóa huy hiệu!");
    }
    setLoading(false);
  };

  const handleGrantBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForBadge) return;
    const form = e.target as HTMLFormElement;
    const badgeId = form.badgeId.value;
    const level = parseInt(form.level.value);
    
    setLoading(true);
    try {
      const currentBadges = selectedUserForBadge.systemBadges || [];
      const existingIdx = currentBadges.findIndex(b => b.badgeId === badgeId);
      
      let newBadges = [...currentBadges];
      if (existingIdx >= 0) {
        newBadges[existingIdx] = { ...newBadges[existingIdx], level };
      } else {
        newBadges.push({ badgeId, level, grantedAt: new Date().toISOString() });
      }
      
      const updatedUser = { ...selectedUserForBadge, systemBadges: newBadges };
      await updateUserProfileInFirestore(updatedUser.uid, updatedUser);
      
      // Update local state
      setUsers(users.map(u => u.uid === updatedUser.uid ? updatedUser : u));
      setSelectedUserForBadge(updatedUser);
      showFeedback("Đã cấp/cập nhật huy hiệu thành công!");
    } catch (err) {
      console.error(err);
      showFeedback("Lỗi cấp huy hiệu!");
    }
    setLoading(false);
  };

  const handleRemoveUserBadge = async (uid: string, badgeId: string) => {
    if (!window.confirm("Gỡ huy hiệu này khỏi người dùng?")) return;
    setLoading(true);
    try {
      const user = users.find(u => u.uid === uid);
      if (!user) return;
      const newBadges = (user.systemBadges || []).filter(b => b.badgeId !== badgeId);
      const updatedUser = { ...user, systemBadges: newBadges };
      await updateUserProfileInFirestore(updatedUser.uid, updatedUser);
      
      setUsers(users.map(u => u.uid === updatedUser.uid ? updatedUser : u));
      if (selectedUserForBadge?.uid === uid) {
        setSelectedUserForBadge(updatedUser);
      }
      showFeedback("Đã gỡ huy hiệu!");
    } catch (err) {
      console.error(err);
      showFeedback("Lỗi gỡ huy hiệu!");
    }
    setLoading(false);
  };


  const handleConfigSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setLoading(true);

    try {
      await saveWebConfig(config);
      if (onConfigChange) {
        onConfigChange(config);
      }
      addActivityLog(
        "Cấu hình cổng thông tin",
        `Đã cập nhật cấu hình chung của hệ thống (Hotline: ${config.emergencyHotline}, Thông báo khẩn: "${config.urgentNoticeText ? config.urgentNoticeText.substring(0, 30) + '...' : 'Không có'}")`,
        "success"
      );
      showFeedback("💾 Đã cập nhật cấu hình hệ thống lên hệ thống Firestore thành công!");
    } catch (e) {
      console.error(e);
      showFeedback("Lỗi khi cập nhật cấu hình cổng thông tin.", true);
    } finally {
      setLoading(false);
    }
  };

  // 3. Campaign CRUD operations
  const handleAddNews = async (e: React.FormEvent) => { e.preventDefault(); };
  const handleAddCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campId || !campTitle) {
      showFeedback("Vui lòng cung cấp đầy đủ thông tin chiến dịch.", true);
      return;
    }

    const newCamp: Campaign = {
      id: campId.trim(),
      title: campTitle.trim(),
      description: campDesc.trim(),
      targetAmount: Number(campTarget),
      currentAmount: Number(campCurrent),
      category: campCategory,
      imageUrl: campImageUrl.trim()
    };

    try {
      await saveCampaignToFirestore(newCamp);
      if (onCampaignsChange) onCampaignsChange();
      setIsAddCampaignOpen(false);
      addActivityLog(
        "Chiến dịch an sinh",
        `Đã tạo chiến dịch mới: "${newCamp.title}" (Mục tiêu: ${newCamp.targetAmount.toLocaleString("vi-VN")} VNĐ)`,
        "success"
      );
      showFeedback(`🎉 Đã tạo chiến dịch [${newCamp.title}] thành công!`);
      // Reset
      setCampId("");
      setCampTitle("");
      setCampDesc("");
      setCampTarget(0);
      setCampCurrent(0);
    } catch (e) {
      console.error(e);
      showFeedback("Lỗi tạo chiến dịch cứu trợ.", true);
    }
  };

  const handleEditCampaignSave = async () => {
    if (!editingCampaign) return;
    try {
      await saveCampaignToFirestore(editingCampaign);
      if (onCampaignsChange) onCampaignsChange();
      addActivityLog(
        "Chiến dịch an sinh",
        `Đã cập nhật thông tin chiến dịch: "${editingCampaign.title}"`,
        "info"
      );
      setEditingCampaign(null);
      showFeedback("✏️ Đã cập nhật thông tin chiến dịch thành công!");
    } catch (e) {
      console.error(e);
      showFeedback("Lỗi cập nhật thông tin chiến dịch.", true);
    }
  };

  const handleDeleteCampaign = (id: string) => {
    showConfirm("Xóa chiến dịch", "Bạn có chắc chắn muốn xóa chiến dịch này không? Hành động này không thể hoàn tác.", async () => {
    try {
      await deleteCampaignFromFirestore(id);
      if (onCampaignsChange) onCampaignsChange();
      addActivityLog(
        "Chiến dịch an sinh",
        `Đã xóa chiến dịch cứu trợ mã số [${id}] khỏi hệ thống`,
        "warning"
      );
      showFeedback("🗑️ Đã xóa chiến dịch cứu trợ khỏi cơ sở dữ liệu.");
    } catch (e) {
      console.error(e);
      showFeedback("Lỗi khi xóa chiến dịch.", true);
    }
    });
  };

  // 4. Job CRUD operations
  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobIdInput || !jobTitle || !jobCompany) {
      showFeedback("Vui lòng cung cấp đầy đủ thông tin việc làm.", true);
      return;
    }

    const reqList = jobRequirements.split("\n").filter(r => r.trim() !== "");

    const newJob: JobListing = {
      id: jobIdInput.trim(),
      title: jobTitle.trim(),
      company: jobCompany.trim(),
      salary: jobSalary.trim() || "Thỏa thuận",
      location: jobLocation.trim() || "Phú Lợi, Thành phố Hồ Chí Minh",
      description: jobDesc.trim(),
      requirements: reqList,
      contact: jobContact.trim(),
      imageUrl: jobImageUrl.trim()
    };

    try {
      await saveJobToFirestore(newJob);
      if (onJobsChange) onJobsChange();
      setIsAddJobOpen(false);
      addActivityLog(
        "Tuyển dụng việc làm",
        `Đã tạo cơ hội việc làm mới: "${newJob.title}" tại ${newJob.company}`,
        "success"
      );
      showFeedback(`💼 Đã đăng cơ hội việc làm [${newJob.title}] thành công!`);
      // Reset
      setJobIdInput("");
      setJobTitle("");
      setJobCompany("");
      setJobSalary("");
      setJobLocation("");
      setJobDesc("");
      setJobRequirements("");
      setJobContact("");
      setJobImageUrl("");
    } catch (e) {
      console.error(e);
      showFeedback("Lỗi đăng tin việc làm.", true);
    }
  };

  const handleEditJobSave = async () => {
    if (!editingJob) return;
    try {
      await saveJobToFirestore(editingJob);
      if (onJobsChange) onJobsChange();
      addActivityLog(
        "Tuyển dụng việc làm",
        `Đã cập nhật thông tin tuyển dụng: "${editingJob.title}" tại ${editingJob.company}`,
        "info"
      );
      setEditingJob(null);
      showFeedback("✏️ Đã cập nhật tin việc làm thành công!");
    } catch (e) {
      console.error(e);
      showFeedback("Lỗi cập nhật tin việc làm.", true);
    }
  };

  const handleDeleteJob = (id: string) => {
    showConfirm("Xóa tin việc làm", "Bạn có chắc chắn muốn xóa tin việc làm này không? Hành động này không thể hoàn tác.", async () => {
    try {
      await deleteJobFromFirestore(id);
      if (onJobsChange) onJobsChange();
      addActivityLog(
        "Tuyển dụng việc làm",
        `Đã gỡ bỏ tin tuyển dụng mã số [${id}] khỏi hệ thống`,
        "warning"
      );
      showFeedback("🗑️ Đã xóa tin việc làm khỏi cơ sở dữ liệu.");
    } catch (e) {
      console.error(e);
      showFeedback("Lỗi xóa tin việc làm.", true);
    }
    });
  };

  // 5. Advanced request management status updating
  const handleRequestStatusChange = async (reqId: string, status: RequestStatus, notes: string) => {
    try {
      await updateRequestInFirestore(reqId, status, notes);
      if (onRefreshRequests) onRefreshRequests();
      
      const req = allRequests.find(r => r.id === reqId);
      addActivityLog(
        "Xử lý hồ sơ an sinh",
        `Đã cập nhật trạng thái hồ sơ [${reqId}] ${req ? "của " + req.fullName : ""} sang [${status}]`,
        status === RequestStatus.COMPLETED ? "success" : "info"
      );
      
      showFeedback(`🎉 Đã cập nhật hồ sơ [${reqId}] sang trạng thái "${status}" thành công!`);
      // Gửi thông báo tự động qua Email thay vì SMS
      if (req && req.email) {
        const defaultTmpl = msgTemplates[status] || msgTemplates["COMPLETED"];
        const msg = getFormattedMessage(req, defaultTmpl);
        showFeedback("📧 Đang gửi Email thông báo tự động cho công dân...");
        sendEmailNotification(req.email, `Thông báo trạng thái hồ sơ: ${status}`, msg.replace(/\n/g, "<br>")).then(success => {
          if (success) {
            showFeedback("✅ Đã gửi Email thông báo thành công!");
          } else {
            showFeedback("⚠️ Không thể gửi Email.", true);
          }
        });
      } else if (req && !req.email) {
        showFeedback("⚠️ Công dân không cung cấp Email, bỏ qua gửi thông báo.", true);
      }
    } catch (e) {
      console.error(e);
      showFeedback("Lỗi cập nhật trạng thái hồ sơ.", true);
    }
  };

  const handleBulkStatusChange = async (status: RequestStatus) => {
    if (selectedRequestIds.length === 0) {
      showFeedback("Vui lòng chọn ít nhất một hồ sơ để xử lý hàng loạt.", true);
      return;
    }
    setLoading(true);
    try {
      let count = 0;
      for (const id of selectedRequestIds) {
        await updateRequestInFirestore(id, status, "Xử lý hàng loạt bởi quản trị viên");
        count++;
      }
      if (onRefreshRequests) onRefreshRequests();
      addActivityLog(
        "Xử lý hồ sơ hàng loạt",
        `Đã cập nhật trạng thái của ${count} hồ sơ sang [${status}]`,
        "success"
      );
      setSelectedRequestIds([]);
      showFeedback(`🎉 Đã cập nhật thành công ${count} hồ sơ sang trạng thái hàng loạt!`);
    } catch (e) {
      console.error(e);
      showFeedback("Lỗi khi xử lý hồ sơ hàng loạt.", true);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCampaignsCSV = () => {
    const csvData = campaignsList.map(camp => ({
      ID: camp.id,
      "Tên chiến dịch": camp.title,
      "Mô tả": camp.description,
      "Mục tiêu quyên góp (VND)": camp.targetAmount,
      "Đã quyên góp được (VND)": camp.currentAmount,
      "Phân loại": camp.category,
      "Hình ảnh": camp.imageUrl || ""
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `danh_sach_chien_dich_an_sinh_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addActivityLog("Xuất dữ liệu", "Xuất danh sách chiến dịch quyên góp ra định dạng CSV", "info");
  };

  const handleExportJobsCSV = () => {
    const csvData = jobsList.map(job => ({
      ID: job.id,
      "Vị trí công việc": job.title,
      "Đơn vị tuyển dụng": job.company,
      "Mức lương": job.salary,
      "Địa điểm": job.location,
      "Mô tả công việc": job.description,
      "Yêu cầu công việc": job.requirements.join("; "),
      "Liên hệ tuyển dụng": job.contact
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `danh_sach_viec_lam_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addActivityLog("Xuất dữ liệu", "Xuất danh sách cơ hội việc làm địa phương ra định dạng CSV", "info");
  };

  const handleExportEventsCSV = () => {
    if (!events) return;
    const csvData = events.map(evt => ({
      ID: evt.id,
      "Tên sự kiện": evt.title,
      "Nội dung": evt.description,
      "Địa điểm": evt.location,
      "Ngày": evt.date,
      "Thời gian": evt.time,
      "Thể loại": evt.type
    }));
    const csv = Papa.unparse(csvData);
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `lich_su_kien_an_sinh_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addActivityLog("Xuất dữ liệu", "Xuất lịch sự kiện an sinh ra định dạng CSV", "info");
  };

  const handleExportCSV = () => {
    const csvData = filteredRequests.map(req => ({
      ID: req.id,
      "Họ và tên": req.fullName,
      "Số điện thoại": req.phone,
      "Địa chỉ": req.address,
      "Khu phố": req.quarter,
      "Loại hỗ trợ": req.category,
      "Mô tả": req.description,
      "Trạng thái": req.status,
      "Ghi chú": req.notes || "",
      "Ngày gửi": new Date(req.createdAt).toLocaleString("vi-VN")
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `danh_sach_ho_so_an_sinh_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter requests using Smart Search Rank
  let baseFilteredRequests = requestsList.filter(req => {
    const matchStatus = reqStatusFilter === "ALL" || req.status === reqStatusFilter;
    const matchQuarter = reqQuarterFilter === "ALL" || req.quarter === reqQuarterFilter;
    return matchStatus && matchQuarter;
  });

  if (reqSearchQuery) {
    baseFilteredRequests = searchRank(baseFilteredRequests, reqSearchQuery, ["fullName", "phone", "id", "category", "reason", "content"]);
  }

  const filteredRequests = smartSortRequests<CitizenRequest>(baseFilteredRequests, {
    [RequestStatus.SUBMITTED]: 1,
    [RequestStatus.VERIFYING]: 2,
    [RequestStatus.APPROVED]: 3,
    [RequestStatus.COMPLETED]: 4
  });

  // Filter users
  const filteredUsers = users.filter(user => {
    const query = userSearchQuery.toLowerCase();
    return (
      user.fullName.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.phone && user.phone.includes(query)) ||
      (user.quarter && getQuarterName(user.quarter).toLowerCase().includes(query))
    );
  });

  // Filter logs
  const filteredLogs = activityLogs.filter(log => {
    const matchCategory = logCategoryFilter === "ALL" || log.category === logCategoryFilter;
    const matchSearch = !logSearchQuery || 
      log.action.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
      log.admin.toLowerCase().includes(logSearchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Requests by Category memo for Charts
  const requestsByCategoryData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    requestsList.forEach(r => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [requestsList]);

  // Campaigns progression memo for Charts
  const campaignsProgressData = useMemo(() => {
    return campaignsList.map(camp => ({
      name: camp.title.length > 15 ? camp.title.substring(0, 15) + "..." : camp.title,
      "Đã đóng góp": camp.currentAmount,
      "Mục tiêu": camp.targetAmount
    }));
  }, [campaignsList]);

  // Requests trend over time memo for Charts
  const requestsOverTimeData = useMemo(() => {
    const timeline: { [key: string]: number } = {};
    // Seed with last 7 days to guarantee a pretty baseline trend if requestsList is sparse
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const label = `${d.getDate()}/${d.getMonth() + 1}`;
      timeline[label] = 0;
    }

    requestsList.forEach(r => {
      const d = new Date(r.createdAt);
      const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;
      if (timeline[dateStr] !== undefined) {
        timeline[dateStr] += 1;
      } else {
        timeline[dateStr] = 1;
      }
    });

    return Object.entries(timeline).map(([date, count]) => ({
      date,
      "Hồ sơ đã nộp": count
    }));
  }, [requestsList]);

  // Monthly received vs resolved requests for Area/Bar Chart
  const requestsMonthlyData = useMemo(() => {
    const monthlyStats = Array.from({ length: 12 }, (_, index) => ({
      name: `T${index + 1}`,
      "Tiếp nhận": 0,
      "Đã giải quyết": 0,
    }));

    let totalReal = 0;
    requestsList.forEach(r => {
      const d = new Date(r.createdAt);
      const monthIndex = d.getMonth(); // 0 to 11
      if (monthIndex >= 0 && monthIndex < 12) {
        monthlyStats[monthIndex]["Tiếp nhận"] += 1;
        totalReal += 1;
        if (r.status === RequestStatus.COMPLETED) {
          monthlyStats[monthIndex]["Đã giải quyết"] += 1;
        }
      }
    });

    // Seed realistic baseline data for past months if the real database is empty/sparse
    if (totalReal < 5) {
      const demoData = [
        { month: 0, received: 14, completed: 11 }, // Jan
        { month: 1, received: 22, completed: 18 }, // Feb
        { month: 2, received: 29, completed: 25 }, // Mar
        { month: 3, received: 18, completed: 16 }, // Apr
        { month: 4, received: 35, completed: 30 }, // May
        { month: 5, received: 48, completed: 42 }, // Jun
        { month: 6, received: 31, completed: 26 }, // Jul
        { month: 7, received: 39, completed: 32 }, // Aug
        { month: 8, received: 45, completed: 40 }, // Sep
        { month: 9, received: 37, completed: 34 }, // Oct
        { month: 10, received: 52, completed: 48 }, // Nov
        { month: 11, received: 58, completed: 54 }, // Dec
      ];
      demoData.forEach(d => {
        monthlyStats[d.month]["Tiếp nhận"] += d.received;
        monthlyStats[d.month]["Đã giải quyết"] += d.completed;
      });
    }

    return monthlyStats;
  }, [requestsList]);

  // Memo for overdue requests (> 5 days and not completed)
  const overdueRequests = useMemo(() => {
    return requestsList.filter(r => {
      if (r.status === RequestStatus.COMPLETED) return false;
      const createdTime = new Date(r.createdAt).getTime();
      if (isNaN(createdTime)) return false;
      const diffTime = Date.now() - createdTime;
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      return diffDays > 5;
    });
  }, [requestsList]);

  // Memoized top 10 volunteer leaderboard data based on badges count
  const leaderboardData = useMemo(() => {
    const defaultRichUsers: UserProfile[] = [
      {
        uid: "user-dem-1",
        email: "nguyenhuy.thudaumot@gmail.com",
        fullName: "Nguyễn Huy",
        phone: "0909112233",
        address: "15 Huỳnh Văn Lũy, Khu phố 3",
        quarter: "Khu phố 3",
        isAdmin: true,
        badges: ["badge-visits", "badge-news"]
      },
      {
        uid: "user-dem-2",
        email: "tranbinh.officer@gmail.com",
        fullName: "Trần Bình",
        phone: "0912345678",
        address: "Ủy ban MTTQ Phường Phú Lợi, Đường Phú Lợi",
        quarter: "Khu phố 1",
        isOfficer: true,
        officerQuarter: "Khu phố 1",
        badges: ["badge-visits", "badge-news", "tier-bronze"]
      },
      {
        uid: "user-dem-3",
        email: "lehoa.volunteer@gmail.com",
        fullName: "Lê Hoa",
        phone: "0988776655",
        address: "88 Phạm Ngọc Thạch, Khu phố 4",
        quarter: "Khu phố 4",
        isVolunteer: true,
        volunteerQuarters: ["Khu phố 4", "Khu phố 5"],
        badges: ["badge-visits", "badge-news", "badge-events", "badge-volunteer", "tier-bronze"]
      },
      {
        uid: "user-dem-4",
        email: "ngo.thao@gmail.com",
        fullName: "Ngô Thảo",
        phone: "0981223344",
        address: "12 Phú Lợi, Khu phố 6",
        quarter: "Khu phố 6",
        isVolunteer: true,
        badges: ["badge-visits", "badge-news", "badge-events", "badge-volunteer", "tier-silver", "tier-gold"]
      },
      {
        uid: "user-dem-5",
        email: "pham.minh@gmail.com",
        fullName: "Phạm Minh",
        phone: "0909667788",
        address: "45 Huỳnh Văn Lũy, Khu phố 2",
        quarter: "Khu phố 2",
        isVolunteer: true,
        badges: ["badge-visits", "badge-news", "badge-events", "badge-volunteer", "tier-silver"]
      },
      {
        uid: "user-dem-6",
        email: "do.quynh@gmail.com",
        fullName: "Đỗ Quỳnh",
        phone: "0918445566",
        address: "77 Lê Hồng Phong, Khu phố 1",
        quarter: "Khu phố 1",
        isVolunteer: true,
        badges: ["badge-visits", "badge-news", "badge-events", "tier-bronze"]
      },
      {
        uid: "user-dem-7",
        email: "hoang.nam@gmail.com",
        fullName: "Hoàng Nam",
        phone: "0977221144",
        address: "209 Phú Lợi, Khu phố 5",
        quarter: "Khu phố 5",
        isVolunteer: true,
        badges: ["badge-visits", "badge-news", "tier-bronze"]
      },
      {
        uid: "user-dem-8",
        email: "bui.tuan@gmail.com",
        fullName: "Bùi Tuấn",
        phone: "0908332211",
        address: "100 Huỳnh Văn Lũy, Khu phố 3",
        quarter: "Khu phố 3",
        isVolunteer: true,
        badges: ["badge-visits", "badge-volunteer", "tier-bronze"]
      },
      {
        uid: "user-dem-9",
        email: "vu.dat@gmail.com",
        fullName: "Vũ Đạt",
        phone: "0966442200",
        address: "123 Đường Phú Lợi, Khu phố 4",
        quarter: "Khu phố 4",
        isVolunteer: true,
        badges: ["badge-visits", "badge-news"]
      },
      {
        uid: "user-dem-10",
        email: "tran.ha@gmail.com",
        fullName: "Trần Hà",
        phone: "0911889900",
        address: "56 Nguyễn Thị Minh Khai, Khu phố 2",
        quarter: "Khu phố 2",
        isVolunteer: true,
        badges: ["badge-visits"]
      }
    ];

    const merged: { [key: string]: UserProfile } = {};
    
    defaultRichUsers.forEach(u => {
      merged[u.email.toLowerCase()] = u;
    });

    users.forEach(u => {
      if (u.email) {
        const emailKey = u.email.toLowerCase();
        merged[emailKey] = {
          ...merged[emailKey],
          ...u
        };
      } else {
        merged[u.uid] = {
          ...merged[u.uid],
          ...u
        };
      }
    });

    return Object.values(merged)
      .map(u => ({
        ...u,
        badgesCount: (u.systemBadges ? u.systemBadges.length : 0) + (u.badges ? u.badges.length : 0),
      }))
      .sort((a, b) => b.badgesCount - a.badgesCount || (a.fullName || "").localeCompare(b.fullName || ""))
      .slice(0, 10);
  }, [users]);

  const getFilteredRequestsForExport = () => {
    const now = new Date();
    const filtered = requestsList.filter((req) => {
      if (!req.createdAt) return false;
      const date = new Date(req.createdAt);
      if (exportTimeframe === "week") {
        const diff = (now.getTime() - date.getTime()) / (1000 * 3600 * 24);
        return diff <= 7;
      } else if (exportTimeframe === "month") {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      } else if (exportTimeframe === "quarter") {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const reqQuarter = Math.floor(date.getMonth() / 3);
        return reqQuarter === currentQuarter && date.getFullYear() === now.getFullYear();
      }
      return true;
    });
    return filtered;
  };

  const handleExportAnalyticsCSV = () => {
    const filteredRequests = getFilteredRequestsForExport();
    
    const csvData = filteredRequests.map(req => ({
      "Mã Hồ Sơ": req.id,
      "Thời Gian Nhận": new Date(req.createdAt).toLocaleString("vi-VN"),
      "Khu Phố": req.quarter,
      "Danh Mục": req.category,
      "Trạng Thái": req.status === "COMPLETED" ? "Đã Giải Quyết" : (req.status === "IN_PROGRESS" ? "Đang Xử Lý" : "Mới Tiếp Nhận"),
      "Người Gửi": req.userName || "Ẩn danh",
      "Tiêu Đề": req.title
    }));
    
    const csv = Papa.unparse(csvData);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }); 
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Bao_Cao_An_Sinh_Xa_Hoi_${exportTimeframe}_${new Date().getTime()}.csv`;
    link.click();
    showFeedback("Đã xuất báo cáo CSV thành công!");
  };

  const handleExportAnalyticsPDF = async () => {
    const element = document.getElementById("analytics-report-view");
    if (!element) return;
    setIsExportingPDF(true);
    showFeedback("Đang khởi tạo tệp PDF...");
    try {
      // Allow react to re-render any potential loading states
      await new Promise((r) => setTimeout(r, 300));
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF("p", "mm", "a4");
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      
      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
      
      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }
      
      pdf.save(`Bao_Cao_An_Sinh_Xa_Hoi_${exportTimeframe}_${new Date().getTime()}.pdf`);
      showFeedback("Đã xuất báo cáo PDF thành công!");
    } catch (err) {
      console.error(err);
      showFeedback("Lỗi khi xuất PDF. Vui lòng thử lại.", true);
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <>
      <ConfirmDialog 
        isOpen={confirmConfig.isOpen} 
        title={confirmConfig.title} 
        message={confirmConfig.message} 
        onConfirm={() => { confirmConfig.onConfirm(); hideConfirm(); }} 
        onCancel={hideConfirm} 
      />
    <section className="py-12 bg-slate-50 border-t border-slate-200 relative overflow-hidden px-4" id="admin-hub-panel">
      {/* Light decorative lines */}
      <div className="absolute top-0 left-1/4 w-px h-full bg-slate-200/40 pointer-events-none"></div>
      <div className="absolute top-0 right-1/4 w-px h-full bg-slate-200/40 pointer-events-none"></div>

      <div className="max-w-[1550px] mx-auto space-y-8 relative">
        
        
        
          <div className="w-full animate-in fade-in zoom-in-95 duration-500">
            
            {/* Main Workspace Area */}
            <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-xs p-6 text-left min-h-[500px]">
              
              {/* Feedback messages inside work area */}
              {statusMessage && (
                <div className={`p-4 rounded-xl text-xs mb-5 flex items-center gap-2 shadow-xs border ${
                  statusMessage.isError ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {statusMessage.isError ? <AlertCircle className="w-4 h-4 text-rose-500" /> : <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  <span className="font-semibold">{statusMessage.text}</span>
                </div>
              )}
              {loading && (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <RefreshCw className="w-8 h-8 text-slate-800 animate-spin" />
                  <span className="text-xs text-slate-500">Đang đồng bộ cơ sở dữ liệu Firestore...</span>
                </div>
              )}
              {!loading && (
                <AnimatePresence mode="wait">
                  
                  {/* TAB 1: USER ROLES MANAGEMENT */}
                  {activeTab === "roles" && (
                    <motion.div
                      key="tab-roles"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="border-b border-slate-100 pb-3 flex justify-between items-center flex-wrap gap-3">
                        <div>
                          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Phân quyền vai trò thành viên</h3>
                          <p className="text-[11px] text-slate-400 font-light">Quản trị viên có quyền nâng/hạ cấp các tài khoản công dân sang cán bộ khu phố quản lý và cấp phát huy hiệu.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSystemBadgesManagementOpen(true)}
                            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          >
                            <Trophy className="w-3.5 h-3.5 text-white" />
                            <span>Cấu hình Huy Hiệu ({systemBadges.length})</span>
                          </button>
                          <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {filteredUsers.length} / {users.length} tài khoản
                          </span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 flex items-center gap-3 text-xs">
                        <Users className="w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          placeholder="Tìm người dùng theo họ tên, email, SĐT hoặc khu phố..."
                          className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 outline-none focus:border-sky-500 font-semibold placeholder-slate-400"
                        />
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-sm text-left block lg:table">
                          <thead className="hidden lg:table-header-group bg-slate-50 text-xs font-extrabold uppercase tracking-widest text-slate-500 border-b border-slate-200">
                            <tr>
                              <th className="px-4 py-3.5">Họ và tên / Email</th>
                              <th className="px-4 py-3.5">Quyền Admin</th>
                              <th className="px-4 py-3.5">Cán bộ khu phố</th>
                              <th className="px-4 py-3.5">Tình nguyện viên</th>
                              <th className="px-4 py-3.5 text-right">Trạng thái</th>
                              <th className="px-4 py-3.5 text-center">Huy hiệu</th>
                            </tr>
                          </thead>
                          <tbody className="block lg:table-row-group divide-y divide-slate-100 lg:divide-y-0 space-y-3 lg:space-y-0 bg-slate-50/50 lg:bg-transparent p-2 lg:p-0">
                            {filteredUsers.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-slate-400 font-medium">
                                  Không tìm thấy thành viên nào phù hợp với từ khóa tìm kiếm.
                                </td>
                              </tr>
                            ) : (
                              filteredUsers.map(user => (
                              <tr key={user.uid} className="hover:bg-blue-50/50 block lg:table-row bg-white rounded-xl border border-slate-100 lg:border-none p-3 lg:p-0 shadow-sm lg:shadow-none">
                                <td className="px-0 py-2 lg:px-4 lg:py-4 block lg:table-cell border-b border-slate-50 lg:border-none">
                                  <div className="lg:hidden text-[10px] font-bold uppercase text-slate-400 mb-1">Họ và tên / Email</div>
                                  <div className="font-bold text-slate-800 flex items-center gap-2">
                                    {user.fullName}
                                    <button
                                      onClick={() => setEditingUserProfile(user)}
                                      className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-sky-600 transition"
                                      title="Chỉnh sửa thông tin thành viên"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                  <div className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</div>
                                  <div className="text-xs text-slate-400 font-light mt-0.5">{user.phone || "Không có SĐT"} - {getQuarterName(user.quarter)}</div>
                                </td>
                                
                                <td className="px-0 py-2 lg:px-4 lg:py-4 block lg:table-cell border-b border-slate-50 lg:border-none flex items-center justify-between lg:justify-start">
                                  <div className="lg:hidden text-[10px] font-bold uppercase text-slate-400">Quyền Admin</div>
                                  <input 
                                    type="checkbox"
                                    checked={user.isAdmin === true}
                                    onChange={(e) => handleRoleChange(user.uid, "isAdmin", e.target.checked)}
                                    className="w-4 h-4 text-slate-800 border-slate-300 rounded-sm focus:ring-sky-500"
                                    disabled={updatingUserId === user.uid}
                                  />
                                </td>

                                <td className="px-0 py-2 lg:px-4 lg:py-4 block lg:table-cell border-b border-slate-50 lg:border-none flex items-center justify-between lg:justify-start lg:space-y-2">
                                  <div className="lg:hidden text-[10px] font-bold uppercase text-slate-400">Cán bộ khu phố</div>
                                  <div className="flex items-center space-x-2">
                                    <input 
                                      type="checkbox"
                                      checked={user.isOfficer === true}
                                      onChange={(e) => handleRoleChange(user.uid, "isOfficer", e.target.checked)}
                                      className="w-4 h-4 text-slate-800 border-slate-300 rounded-sm focus:ring-sky-500"
                                      disabled={updatingUserId === user.uid}
                                    />
                                    <span className="text-xs text-slate-500">Cán bộ</span>
                                  </div>
                                  {user.isOfficer && (
                                    <select
                                      value={user.officerQuarter || getQuarterName(user.quarter)}
                                      onChange={(e) => handleRoleChange(user.uid, "officerQuarter", e.target.value)}
                                      className="text-xs bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-slate-500 focus:outline-none"
                                      disabled={updatingUserId === user.uid}
                                    >
                                      <option value="">Chọn khu phố</option>
                                      {QUARTERS_LIST.map(kp => (
                                        <option key={kp.name} value={kp.name}>{kp.name}</option>
                                      ))}
                                    </select>
                                  )}
                                </td>

                                <td className="px-0 py-2 lg:px-4 lg:py-4 block lg:table-cell border-b border-slate-50 lg:border-none flex items-center justify-between lg:justify-start">
                                  <div className="lg:hidden text-[10px] font-bold uppercase text-slate-400">Tình nguyện viên</div>
                                  <div className="flex items-center space-x-2">
                                    <input 
                                      type="checkbox"
                                      checked={user.isVolunteer === true}
                                      onChange={(e) => handleRoleChange(user.uid, "isVolunteer", e.target.checked)}
                                      className="w-4 h-4 text-slate-800 border-slate-300 rounded-sm focus:ring-sky-500"
                                      disabled={updatingUserId === user.uid}
                                    />
                                    <span className="text-xs text-slate-500">TN Viên</span>
                                  </div>
                                </td>

                                <td className="px-0 py-2 lg:px-4 lg:py-4 block lg:table-cell border-b border-slate-50 lg:border-none flex items-center justify-between lg:text-right">
                                  <div className="lg:hidden text-[10px] font-bold uppercase text-slate-400">Trạng thái</div>
                                  {updatingUserId === user.uid ? (
                                    <RefreshCw className="w-3.5 h-3.5 text-slate-800 animate-spin ml-auto" />
                                  ) : (
                                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                                      user.isAdmin ? "bg-blue-50/50 text-red-700 border border-red-100" :
                                      user.isOfficer ? "bg-slate-50 text-blue-700 border border-slate-200" :
                                      user.isVolunteer ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                      "bg-slate-100 text-slate-500"
                                    }`}>
                                      {user.isAdmin ? "Admin" : user.isOfficer ? "Cán bộ" : user.isVolunteer ? "TN Viên" : "Công dân"}
                                    </span>
                                  )}
                                </td>

                                <td className="px-0 py-3 lg:px-4 lg:py-4 block lg:table-cell lg:text-center align-top">
                                  <div className="lg:hidden text-[10px] font-bold uppercase text-slate-400 mb-2">Huy hiệu thành viên</div>
                                  <div className="flex flex-col items-center gap-2">
                                    {user.systemBadges && user.systemBadges.length > 0 && (
                                      <div className="flex flex-wrap items-center justify-center gap-1.5 w-[100px]">
                                        {user.systemBadges.map(ub => {
                                          const badgeDetail = systemBadges.find(sb => sb.id === ub.badgeId);
                                          if (!badgeDetail) return null;
                                          return (
                                            <div key={ub.badgeId} className="flex flex-col items-center bg-white border border-amber-200/50 rounded-lg p-1.5 shadow-sm" title={`${badgeDetail.name} - ${ub.level} sao`}>
                                              <span className="text-base leading-none">{badgeDetail.icon}</span>
                                              <div className="flex items-center gap-0.5 mt-0.5">
                                                <span className="text-[9px] font-black text-amber-500 font-mono">{ub.level}</span>
                                                <svg className="w-1.5 h-1.5 text-amber-500 fill-amber-500" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedUserForBadge(user);
                                        setUserBadgeModalOpen(true);
                                      }}
                                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-md text-xs font-bold uppercase tracking-wider transition cursor-pointer flex items-center gap-1 mx-auto"
                                    >
                                      <Trophy className="w-3 h-3 text-amber-500" />
                                      <span>{user.systemBadges && user.systemBadges.length > 0 ? "Quản lý" : "Cấp xét"}</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                          </tbody>
                        </table>
                      </div>

                      {/* USER BADGE MANAGEMENT DIALOG */}
                      {userBadgeModalOpen && selectedUserForBadge && (
                        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-xl border border-slate-100 text-left space-y-4">
                            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                              <div>
                                <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                  <Trophy className="w-4 h-4 text-amber-500" />
                                  Cấp Huy Hiệu Thành Viên
                                </h3>
                                <p className="text-[10px] text-slate-400 mt-0.5">Người dùng: <strong className="text-slate-600">{selectedUserForBadge.fullName}</strong> ({selectedUserForBadge.email})</p>
                              </div>
                              <button 
                                type="button" 
                                onClick={() => { setUserBadgeModalOpen(false); setSelectedUserForBadge(null); }}
                                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            {/* List of current badges */}
                            <div className="space-y-2">
                              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Huy hiệu hiện tại của thành viên</h4>
                              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 max-h-[160px] overflow-y-auto space-y-2">
                                {(!selectedUserForBadge.systemBadges || selectedUserForBadge.systemBadges.length === 0) ? (
                                  <p className="text-[10px] text-slate-400 text-center py-4 italic">Người dùng này chưa sở hữu huy hiệu nào.</p>
                                ) : (
                                  selectedUserForBadge.systemBadges.map(ub => {
                                    const badgeDetail = systemBadges.find(sb => sb.id === ub.badgeId);
                                    return (
                                      <div key={ub.badgeId} className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-xl shadow-3xs">
                                        <div className="flex items-center gap-2">
                                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${badgeDetail?.color || 'bg-slate-100 text-slate-600'}`}>
                                            <Trophy className="w-4 h-4" />
                                          </div>
                                          <div>
                                            <div className="text-[11px] font-bold text-slate-800">{badgeDetail?.name || ub.badgeId}</div>
                                            <div className="flex items-center gap-0.5 mt-0.5">
                                              {Array.from({ length: 10 }).map((_, starIdx) => (
                                                <Star 
                                                  key={starIdx} 
                                                  className={`w-2.5 h-2.5 ${starIdx < ub.level ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} 
                                                />
                                              ))}
                                              <span className="text-[9px] text-slate-400 font-bold font-mono ml-1">({ub.level} sao)</span>
                                            </div>
                                            <div className="w-full h-1 bg-slate-100 rounded-full mt-1.5 overflow-hidden">
                                              <div 
                                                className="h-full bg-amber-400 rounded-full" 
                                                style={{ width: `${(ub.level / 10) * 100}%` }}
                                              />
                                            </div>
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveUserBadge(selectedUserForBadge.uid, ub.badgeId)}
                                          className="text-[10px] font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition"
                                        >
                                          Gỡ bỏ
                                        </button>
                                      </div>
                                    );
                                  })
                                )}
                                {selectedUserForBadge.badges && selectedUserForBadge.badges.map((badgeId, bIdx) => {
                                  let icon = "🎖️";
                                  let tooltip = "Huy hiệu";
                                  let colorClass = "bg-slate-100 text-slate-600";
                                  if (badgeId === "tier-gold") {
                                    icon = "🥇"; tooltip = "Hạng Vàng"; colorClass = "bg-amber-100 text-amber-700";
                                  } else if (badgeId === "tier-silver") {
                                    icon = "🥈"; tooltip = "Hạng Bạc"; colorClass = "bg-slate-200 text-slate-700";
                                  } else if (badgeId === "tier-bronze") {
                                    icon = "🥉"; tooltip = "Hạng Đồng"; colorClass = "bg-amber-800 text-amber-100";
                                  } else if (badgeId === "badge-visits") {
                                    icon = "🔥"; tooltip = "Tiên Phong Số"; colorClass = "bg-orange-100 text-orange-600";
                                  } else if (badgeId === "badge-news") {
                                    icon = "📰"; tooltip = "Sứ Giả Tin Tức"; colorClass = "bg-blue-100 text-blue-600";
                                  } else if (badgeId === "badge-events") {
                                    icon = "💖"; tooltip = "Trái Tim Hồng"; colorClass = "bg-pink-100 text-pink-600";
                                  } else if (badgeId === "badge-volunteer") {
                                    icon = "🎖️"; tooltip = "Chiến Sĩ Tình Nguyện"; colorClass = "bg-emerald-100 text-emerald-600";
                                  }

                                  return (
                                    <div key={`std-${bIdx}`} className="flex items-center justify-between bg-white border border-slate-100 p-2 rounded-xl shadow-3xs">
                                      <div className="flex items-center gap-2">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${colorClass}`}>
                                          <span className="text-sm">{icon}</span>
                                        </div>
                                        <div>
                                          <div className="text-[11px] font-bold text-slate-800">{tooltip}</div>
                                          <div className="text-[9px] text-slate-400 font-medium mt-0.5">Huy hiệu hệ thống mặc định</div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Form to grant badge */}
                            <form onSubmit={handleGrantBadge} className="space-y-3 pt-2 border-t border-slate-100">
                              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Cấp mới / Nâng cấp huy hiệu</h4>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="block text-[9px] font-bold text-slate-500">Chọn Huy Hiệu</label>
                                  <select 
                                    name="badgeId" 
                                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white outline-none focus:border-sky-500 font-medium"
                                    required
                                  >
                                    {systemBadges.map(sb => (
                                      <option key={sb.id} value={sb.id}>{sb.name}</option>
                                    ))}
                                    {systemBadges.length === 0 && (
                                      <option value="">Chưa có huy hiệu hệ thống</option>
                                    )}
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-[9px] font-bold text-slate-500">Số sao cấp độ (1-10)</label>
                                  <select 
                                    name="level" 
                                    className="w-full text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white outline-none focus:border-sky-500 font-medium"
                                    required
                                  >
                                    {Array.from({ length: 10 }).map((_, idx) => (
                                      <option key={idx + 1} value={idx + 1}>{idx + 1} sao</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div className="flex gap-2 pt-2">
                                <button 
                                  type="submit" 
                                  disabled={systemBadges.length === 0}
                                  className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                                >
                                  <Award className="w-3.5 h-3.5" />
                                  <span>Xác nhận cấp</span>
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => { setUserBadgeModalOpen(false); setSelectedUserForBadge(null); }}
                                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-2 rounded-xl transition cursor-pointer"
                                >
                                  Đóng lại
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}

                      {/* SYSTEM BADGES DICTIONARY/MANAGEMENT DIALOG */}
                      {systemBadgesManagementOpen && (
                        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-xl border border-slate-100 text-left space-y-5">
                            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                              <div>
                                <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                  <Trophy className="w-4 h-4 text-amber-500" />
                                  Quản Lý Danh Mục Huy Hiệu Hệ Thống
                                </h3>
                                <p className="text-[10px] text-slate-400 mt-0.5">Tạo, sửa đổi hoặc xóa các tiêu chuẩn huy hiệu cấp cho các thành viên/tình nguyện viên.</p>
                              </div>
                              <button 
                                type="button" 
                                onClick={() => setSystemBadgesManagementOpen(false)}
                                className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="flex justify-between items-center bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
                              <span className="text-[10px] text-slate-500 font-medium">Hiện có {systemBadges.length} loại huy hiệu trong hệ thống</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingBadge({ id: "badge-" + Date.now(), name: "", description: "", iconName: "Award", color: "bg-sky-500 text-white" });
                                  setBadgeModalOpen(true);
                                }}
                                className="px-2.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Thêm Huy Hiệu Mới</span>
                              </button>
                            </div>

                            {/* Badge list */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
                              {systemBadges.map(badge => (
                                <div key={badge.id} className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-3.5 flex flex-col justify-between relative shadow-sm transition">
                                  <div className="absolute top-2.5 right-2.5 flex gap-1">
                                    <button 
                                      type="button" 
                                      onClick={() => { setEditingBadge(badge); setBadgeModalOpen(true); }} 
                                      className="p-1 bg-slate-50 hover:bg-slate-200 text-slate-500 rounded-lg border border-slate-200/40"
                                      title="Chỉnh sửa"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button 
                                      type="button" 
                                      onClick={() => handleDeleteBadge(badge.id)} 
                                      className="p-1 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-lg border border-rose-200/30"
                                      title="Xóa"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="flex items-start gap-2.5">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-inner ${badge.color || 'bg-slate-100'}`}>
                                      <Trophy className="w-4.5 h-4.5 text-white" /> 
                                    </div>
                                    <div className="space-y-1 text-left">
                                      <h4 className="font-bold text-xs text-slate-800 leading-snug">{badge.name}</h4>
                                      <p className="text-[10px] text-slate-500 leading-normal line-clamp-2">{badge.description}</p>
                                    </div>
                                  </div>
                                  <div className="mt-3 pt-2 border-t border-slate-50 flex items-center justify-between text-[8px] font-mono text-slate-400">
                                    <span>ID: {badge.id}</span>
                                    <span className="capitalize">{badge.color?.split(' ')[0]?.replace('bg-', '') || 'Mặc định'}</span>
                                  </div>
                                </div>
                              ))}
                              {systemBadges.length === 0 && (
                                <div className="col-span-full py-12 text-center text-slate-400 text-xs italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                  <span className="text-xl block mb-1">🏅</span>
                                  Chưa cấu hình huy hiệu nào cho hệ thống.
                                </div>
                              )}
                            </div>

                            <div className="flex justify-end pt-2 border-t border-slate-100">
                              <button 
                                type="button" 
                                onClick={() => setSystemBadgesManagementOpen(false)}
                                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
                              >
                                Đóng lại
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* CREATE/EDIT SYSTEM BADGE SUB-MODAL */}
                      {badgeModalOpen && editingBadge && (
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-left space-y-4">
                            <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
                              <Trophy className="w-4 h-4 text-amber-500 animate-pulse" />
                              {editingBadge.name ? "Chỉnh sửa tiêu chuẩn huy hiệu" : "Thêm mới loại huy hiệu"}
                            </h3>
                            <form onSubmit={handleSaveBadge} className="space-y-4 text-xs">
                              <div className="space-y-1">
                                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide">Mã Huy Hiệu (ID)</label>
                                <input type="text" value={editingBadge.id} disabled className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-slate-150 text-slate-400 font-mono focus:outline-none" />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide">Tên Huy Hiệu *</label>
                                <input 
                                  type="text" 
                                  value={editingBadge.name} 
                                  onChange={e => setEditingBadge({...editingBadge, name: e.target.value})} 
                                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white outline-none focus:border-sky-500 font-semibold" 
                                  placeholder="Ví dụ: Tình nguyện viên Ưu tú"
                                  required 
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide">Mô tả tiêu chí *</label>
                                <textarea 
                                  value={editingBadge.description} 
                                  onChange={e => setEditingBadge({...editingBadge, description: e.target.value})} 
                                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white outline-none focus:border-sky-500 leading-relaxed resize-none" 
                                  rows={3} 
                                  placeholder="Ví dụ: Trao tặng cho thành viên tích cực tham gia trên 5 đợt cứu trợ khẩn cấp."
                                  required 
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wide">Màu sắc chủ đạo</label>
                                <select 
                                  value={editingBadge.color} 
                                  onChange={e => setEditingBadge({...editingBadge, color: e.target.value})} 
                                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl bg-white outline-none focus:border-sky-500 font-semibold"
                                >
                                  <option value="bg-sky-500 text-white">Màu xanh dương (Sky)</option>
                                  <option value="bg-emerald-500 text-white">Màu xanh lá (Emerald)</option>
                                  <option value="bg-amber-500 text-white">Màu vàng ánh kim (Amber)</option>
                                  <option value="bg-rose-500 text-white">Màu đỏ nhiệt huyết (Rose)</option>
                                  <option value="bg-indigo-500 text-white">Màu tím hoàng gia (Indigo)</option>
                                  <option value="bg-slate-800 text-white">Màu đen huyền bí (Slate)</option>
                                </select>
                              </div>
                              <div className="flex gap-2 pt-2 border-t border-slate-100">
                                <button type="submit" className="flex-1 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold py-2.5 rounded-xl cursor-pointer transition">Lưu Lại</button>
                                <button type="button" onClick={() => { setBadgeModalOpen(false); setEditingBadge(null); }} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-2.5 rounded-xl cursor-pointer transition">Hủy bỏ</button>
                              </div>
                            </form>
                          </div>
                        </div>
                      )}
                    </motion.div>

                    )}
                  {/* TAB 2: PORTAL CONFIGURATION */}
                  {activeTab === "config" && config && (
                    <motion.div
                      key="tab-config"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="border-b border-slate-100 pb-3">
                        <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Cấu hình cổng an sinh số</h3>
                        <p className="text-[11px] text-slate-400 font-light">Chỉnh sửa tiêu đề chính chủ, hotline, thông tin liên lạc hành chính được cập nhật tức thì trên website.</p>
                      </div>

                      <form onSubmit={handleConfigSave} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Tiêu đề cổng an sinh *</label>
                            <input 
                              type="text"
                              value={config.portalTitle}
                              onChange={(e) => setConfig(prev => prev ? { ...prev, portalTitle: e.target.value } : null)}
                              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Đường dây nóng hỗ trợ khẩn cấp *</label>
                            <input 
                              type="text"
                              value={config.emergencyPhone}
                              onChange={(e) => setConfig(prev => prev ? { ...prev, emergencyPhone: e.target.value } : null)}
                              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Thư điện tử liên hệ hành chính *</label>
                            <input 
                              type="email"
                              value={config.contactEmail}
                              onChange={(e) => setConfig(prev => prev ? { ...prev, contactEmail: e.target.value } : null)}
                              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                              required
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Giờ làm việc cơ quan *</label>
                            <input 
                              type="text"
                              value={config.workingHours}
                              onChange={(e) => setConfig(prev => prev ? { ...prev, workingHours: e.target.value } : null)}
                              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Bản tin thông báo tiêu điểm của phường</label>
                          <textarea 
                            value={config.announcementText}
                            onChange={(e) => setConfig(prev => prev ? { ...prev, announcementText: e.target.value } : null)}
                            rows={3}
                            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                            placeholder="Nhập nội dung tiêu điểm..."
                          />
                        </div>

                        
                        <div className="border-b border-slate-100 pb-3 mt-6">
                          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Cấu hình giao diện Trang chủ</h3>
                          <p className="text-[11px] text-slate-400 font-light">Tùy chỉnh các câu khẩu hiệu, tiêu đề và lời giới thiệu ở phần đầu trang web.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Khẩu hiệu phụ (Subtitle)</label>
                            <input 
                              type="text"
                              value={config.heroSubtitle || ""}
                              onChange={(e) => setConfig(prev => prev ? { ...prev, heroSubtitle: e.target.value } : null)}
                              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                              placeholder="VD: Chính Sách Nhân Văn • Nghĩa Tình Phú Lợi"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Tiêu đề - Dòng 1</label>
                            <input 
                              type="text"
                              value={config.heroTitleLine1 || ""}
                              onChange={(e) => setConfig(prev => prev ? { ...prev, heroTitleLine1: e.target.value } : null)}
                              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                              placeholder="Vì một cộng đồng"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Tiêu đề - Dòng 2 (Nổi bật)</label>
                            <input 
                              type="text"
                              value={config.heroTitleLine2 || ""}
                              onChange={(e) => setConfig(prev => prev ? { ...prev, heroTitleLine2: e.target.value } : null)}
                              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                              placeholder="Phú Lợi thân thiện"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Tiêu đề - Dòng 3</label>
                            <input 
                              type="text"
                              value={config.heroTitleLine3 || ""}
                              onChange={(e) => setConfig(prev => prev ? { ...prev, heroTitleLine3: e.target.value } : null)}
                              className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                              placeholder="văn minh, kết nối số."
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Lời giới thiệu (Mô tả chi tiết)</label>
                          <textarea 
                            value={config.heroDescription || ""}
                            onChange={(e) => setConfig(prev => prev ? { ...prev, heroDescription: e.target.value } : null)}
                            rows={3}
                            className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                            placeholder="Nhập nội dung lời giới thiệu..."
                          />
                        </div>

                        <div className="flex items-center space-x-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 mt-6">
                          <input 
                            type="checkbox" 
                            id="maintenanceModeCheckbox"
                            checked={config.maintenanceMode}
                            onChange={(e) => setConfig(prev => prev ? { ...prev, maintenanceMode: e.target.checked } : null)}
                            className="w-4 h-4 text-slate-800 border-slate-300 rounded focus:ring-sky-500"
                          />
                          <div className="text-left">
                            <label htmlFor="maintenanceModeCheckbox" className="block text-xs font-bold text-slate-500 cursor-pointer">Bật Chế Độ Bảo Trì Hệ Thống</label>
                            <span className="text-[10px] text-slate-400 block font-light">Khi bật chế độ bảo trì, cổng an sinh sẽ tạm ngắt kết nối phục vụ nâng cấp hệ thống định kỳ.</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 mt-4">
                          <input 
                            type="checkbox" 
                            id="enableDonationEmailCheckbox"
                            checked={config.enableDonationEmail || false}
                            onChange={(e) => setConfig(prev => prev ? { ...prev, enableDonationEmail: e.target.checked } : null)}
                            className="w-4 h-4 text-slate-800 border-slate-300 rounded focus:ring-sky-500"
                          />
                          <div className="text-left">
                            <label htmlFor="enableDonationEmailCheckbox" className="block text-xs font-bold text-slate-500 cursor-pointer">Gửi Email Xác Nhận Quyên Góp</label>
                            <span className="text-[10px] text-slate-400 block font-light">Tự động gửi email cảm ơn đến người dùng sau khi quyên góp thành công.</span>
                          </div>
                        </div>

                        {/* Configure AI Personality Section */}
                        <div className="border-t border-slate-100 pt-5 mt-6">
                          <div className="flex justify-between items-start flex-wrap gap-2 mb-2">
                            <div className="text-left">
                              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="text-sky-500">🧠</span> Cấu hình Tính cách & Chỉ thị Trợ lý ảo AI
                              </h3>
                              <p className="text-[11px] text-slate-400 font-light">Tùy chỉnh vai trò, phong cách trả lời và các ràng buộc thông tin cho Trợ lý An sinh số Phường Phú Lợi.</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm("Bạn có chắc chắn muốn khôi phục chỉ thị AI về mặc định chính quyền Phường Phú Lợi?")) {
                                  setConfig(prev => prev ? { ...prev, aiSystemPrompt: DEFAULT_WEB_CONFIG.aiSystemPrompt } : null);
                                }
                              }}
                              className="px-2.5 py-1 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg border border-slate-200 cursor-pointer transition flex items-center gap-1"
                            >
                              <span>Khôi phục mặc định</span>
                            </button>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left">Hệ chỉ thị hệ thống (System Prompt) cho Gemini</label>
                              <textarea
                                value={config.aiSystemPrompt || ""}
                                onChange={(e) => setConfig(prev => prev ? { ...prev, aiSystemPrompt: e.target.value } : null)}
                                rows={8}
                                className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 font-mono leading-relaxed text-left"
                                placeholder="Hãy nhập chỉ thị hệ thống tại đây để thay đổi hành vi và phong cách trả lời của Trợ lý ảo AI..."
                              />
                              <div className="text-[10px] text-slate-400 bg-sky-50/50 p-3 rounded-lg border border-sky-100/60 leading-relaxed text-left space-y-1">
                                <span className="font-bold text-sky-700 block">💡 Mẹo viết chỉ thị cho chính quyền:</span>
                                <ul className="list-disc list-inside space-y-0.5 font-light">
                                  <li>Xác định rõ vai trò là Trợ lý số chính thống của <strong className="text-sky-600">Ủy ban MTTQ Việt Nam Phường Phú Lợi, Thành phố Hồ Chí Minh</strong>.</li>
                                  <li>Yêu cầu sử dụng từ ngữ kính trọng, lễ phép, mộc mạc chuẩn nghĩa tình (VD: "Dạ thưa bà con...", "Kính chào quý cô bác...").</li>
                                  <li>Ràng buộc thông tin nghiêm ngặt, chỉ trả lời các thông tin liên quan đến an sinh xã hội hoặc hướng dẫn người dân trong địa bàn.</li>
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>

                        <button 
                          type="submit"
                          className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-md transition-all cursor-pointer mt-6"
                        >
                          <Save className="w-4 h-4" />
                          <span>Lưu cấu hình hệ thống lên Firestore</span>
                        </button>
                      </form>
                    </motion.div>

                    )}
                  {/* TAB 3: CAMPAIGNS MANAGER */}
                  {activeTab === "campaigns" && (
                    <motion.div
                      key="tab-campaigns"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="border-b border-slate-100 pb-3 flex justify-between items-center flex-wrap gap-2">
                        <div>
                          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Quản lý chiến dịch an sinh</h3>
                          <p className="text-[11px] text-slate-400 font-light">Tạo lập chiến dịch cứu trợ mới, theo dõi tiến độ đóng góp hiện kim trực tiếp từ người dân số.</p>
                        </div>
                        
                        <button
                          className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          {isAddCampaignOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                          <span>{isAddCampaignOpen ? "Đóng Form" : "Tạo Chiến Dịch"}</span>
                        </button>
                      </div>

                      {/* --- Tùy chỉnh danh mục hỗ trợ --- */}
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-4">
                        <div>
                          <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                            <Settings className="w-4 h-4 text-sky-500" />
                            Quản lý danh mục hỗ trợ
                          </h4>
                          <p className="text-[11px] text-slate-500 font-light">
                            Tạo các danh mục hỗ trợ mới để người dân có thể chọn khi gửi yêu cầu hỗ trợ, ngoài các danh mục mặc định.
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {Object.values(SupportCategory).map(cat => (
                            <div key={cat} className="bg-white border border-slate-200 text-slate-500 text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center">
                              {cat} (Mặc định)
                            </div>
                          ))}
                          {config?.customCategories?.map(cat => (
                            <div key={cat} className="bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold px-2 py-1 rounded shadow-sm flex items-center gap-1.5">
                              {cat}
                              <button type="button" onClick={() => handleDeleteCustomCategory(cat)} className="text-red-500 hover:text-red-700">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-2 items-center">
                          <input 
                            type="text" 
                            value={newCustomCategory} 
                            onChange={(e) => setNewCustomCategory(e.target.value)}
                            placeholder="Nhập tên danh mục mới..."
                            className="flex-1 text-xs px-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                          />
                          <button 
                            type="button"
                            onClick={handleAddCustomCategory}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap"
                          >
                            Thêm danh mục
                          </button>
                        </div>
                      </div>
                      {/* --- Hết Tùy chỉnh danh mục hỗ trợ --- */}


                      {/* Add campaign form */}
                      {isAddCampaignOpen && (
                        <form onSubmit={handleAddCampaign} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3">
                          <div className="md:col-span-3 space-y-1">
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">Mã Chiến Dịch (ID) *</label>
                            <input 
                              type="text" 
                              value={campId} 
                              onChange={(e) => setCampId(e.target.value)}
                              placeholder="CAMP-XX"
                              className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                              required
                            />
                          </div>
                          
                          <div className="md:col-span-6 space-y-1">
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">Tên chiến dịch kêu gọi *</label>
                            <input 
                              type="text" 
                              value={campTitle} 
                              onChange={(e) => setCampTitle(e.target.value)}
                              placeholder="Ví dụ: Ủng hộ bão lụt"
                              className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                              required
                            />
                          </div>

                          <div className="md:col-span-3 space-y-1">
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">Phân loại *</label>
                            <input 
                              type="text" 
                              value={campCategory} 
                              onChange={(e) => setCampCategory(e.target.value)}
                              placeholder="Cứu trợ / Khuyến học"
                              className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                              required
                            />
                          </div>

                          <div className="md:col-span-12 space-y-1">
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">Hình ảnh minh họa (URL)</label>
                            <input 
                              type="text" 
                              value={campImageUrl} 
                              onChange={(e) => setCampImageUrl(e.target.value)}
                              placeholder="https://example.com/image.jpg"
                              className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                            />
                          </div>
                          <div className="md:col-span-12 space-y-1">
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">Nội dung / Lời kêu gọi cụ thể</label>
                            <textarea 
                              value={campDesc} 
                              onChange={(e) => setCampDesc(e.target.value)}
                              placeholder="Mô tả cụ thể đối tượng thụ hưởng và kế hoạch chi tiết..."
                              rows={2}
                              className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                            />
                          </div>

                          <div className="md:col-span-6 space-y-1">
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">Số tiền kêu gọi đích thực (VNĐ) *</label>
                            <input 
                              type="number" 
                              value={campTarget} 
                              onChange={(e) => setCampTarget(Number(e.target.value))}
                              className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                              required
                            />
                          </div>

                          <div className="md:col-span-6 space-y-1">
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">Số tiền hiện có khởi điểm (VNĐ) *</label>
                            <input 
                              type="number" 
                              value={campCurrent} 
                              onChange={(e) => setCampCurrent(Number(e.target.value))}
                              className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                              required
                            />
                          </div>

                          <div className="md:col-span-12 flex justify-end">
                            <button 
                              type="submit"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Đăng chiến dịch lên Firestore</span>
                            </button>
                          </div>
                        </form>

                    )}
                      {/* Editing campaign popup modal block */}
                      {editingCampaign && (
                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-slate-200 space-y-3">
                          <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                            <Edit2 className="w-4 h-4 text-slate-800" />
                            Đang chỉnh sửa chiến dịch: {editingCampaign.title}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="block text-[9px] font-bold uppercase text-slate-500">Tên chiến dịch</label>
                              <input 
                                type="text"
                                value={editingCampaign.title}
                                onChange={(e) => setEditingCampaign(prev => prev ? { ...prev, title: e.target.value } : null)}
                                className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[9px] font-bold uppercase text-slate-500">Hình ảnh URL</label>
                              <input 
                                type="text"
                                value={editingCampaign.imageUrl || ""}
                                onChange={(e) => setEditingCampaign(prev => prev ? { ...prev, imageUrl: e.target.value } : null)}
                                className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none mb-2"
                              />
                              <label className="block text-[9px] font-bold uppercase text-slate-500">Phân loại</label>
                              <input 
                                type="text"
                                value={editingCampaign.category}
                                onChange={(e) => setEditingCampaign(prev => prev ? { ...prev, category: e.target.value } : null)}
                                className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                              />
                            </div>
                            <div className="md:col-span-2 space-y-1">
                              <label className="block text-[9px] font-bold uppercase text-slate-500">Lời kêu gọi</label>
                              <textarea 
                                value={editingCampaign.description}
                                onChange={(e) => setEditingCampaign(prev => prev ? { ...prev, description: e.target.value } : null)}
                                rows={2}
                                className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[9px] font-bold uppercase text-slate-500">Định mức kêu gọi (VNĐ)</label>
                              <input 
                                type="number"
                                value={editingCampaign.targetAmount}
                                onChange={(e) => setEditingCampaign(prev => prev ? { ...prev, targetAmount: Number(e.target.value) } : null)}
                                className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[9px] font-bold uppercase text-slate-500">Số tiền đã có (VNĐ)</label>
                              <input 
                                type="number"
                                value={editingCampaign.currentAmount}
                                onChange={(e) => setEditingCampaign(prev => prev ? { ...prev, currentAmount: Number(e.target.value) } : null)}
                                className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <button 
                              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded text-slate-500 text-xs font-bold"
                            >
                              Hủy
                            </button>
                            <button 
                              className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded text-xs font-bold flex items-center gap-1"
                            >
                              <Save className="w-3.5 h-3.5" />
                              Lưu thay đổi
                            </button>
                          </div>
                        </div>

                    )}
                      {/* Campaigns Grid Table */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {campaignsList.map(camp => (
                          <div key={camp.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3 relative hover:border-slate-300 transition-all text-xs flex flex-col justify-between">
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center">
                                <div className="flex gap-2 items-center">
    {camp.imageUrl && <img src={camp.imageUrl} alt="" className="w-8 h-8 rounded object-cover" />}
    <span className="font-mono text-[9px] bg-sky-100 text-blue-700 px-2 py-0.5 rounded-sm font-bold">{camp.id}</span>
  </div>
                                <span className="text-[10px] text-slate-400 uppercase font-bold">{camp.category}</span>
                              </div>
                              <h4 className="font-bold text-slate-800 text-sm leading-tight">{camp.title}</h4>
                              <p className="text-slate-500 font-light line-clamp-2">{camp.description}</p>
                              
                              {/* Money progress */}
                              <div className="space-y-1 pt-1">
                                <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                                </div>
                                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-sky-500 h-full rounded-full transition-all duration-500" 
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200/50 mt-2">
                              <button
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-lg border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                                title="Chỉnh sửa"
                              >
                              </button>
                              <button
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}


                  {/* TAB 4: JOBS MANAGER */}
                  {activeTab === "jobs" && (
                    <motion.div
                      key="tab-jobs"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="border-b border-slate-100 pb-3 flex justify-between items-center flex-wrap gap-2">
                        <div>
                          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Quản lý cơ hội việc làm</h3>
                          <p className="text-[11px] text-slate-400 font-light">Tạo lập, đăng tin tuyển dụng việc làm mới, giúp gia tăng sinh kế bền vững cho các hộ cận nghèo địa bàn.</p>
                        </div>
                        
                        <button
                          className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                        >
                          {isAddJobOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                          <span>{isAddJobOpen ? "Đóng Form" : "Đăng Việc Làm"}</span>
                        </button>
                      </div>

                      {/* Add job listing form */}
                      {isAddJobOpen && (
                        <form onSubmit={handleAddJob} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-3">
                          <div className="md:col-span-3 space-y-1">
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">Mã Tuyển Dụng (ID) *</label>
                            <input 
                              type="text" 
                              value={jobIdInput} 
                              onChange={(e) => setJobIdInput(e.target.value)}
                              placeholder="JOB-XX"
                              className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                              required
                            />
                          </div>

                          <div className="md:col-span-5 space-y-1">
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">Vị trí tuyển dụng *</label>
                            <input 
                              type="text" 
                              value={jobTitle} 
                              onChange={(e) => setJobTitle(e.target.value)}
                              placeholder="Ví dụ: Nhân viên bảo vệ"
                              className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                              required
                            />
                          </div>

                          <div className="md:col-span-4 space-y-1">
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">Đơn vị tuyển dụng (Công ty) *</label>
                            <input 
                              type="text" 
                              value={jobCompany} 
                              onChange={(e) => setJobCompany(e.target.value)}
                              placeholder="Ví dụ: Co.opmart Phú Lợi"
                              className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                              required
                            />
                          </div>

                          <div className="md:col-span-4 space-y-1">
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">Lương cơ bản *</label>
                            <input 
                              type="text" 
                              value={jobSalary} 
                              onChange={(e) => setJobSalary(e.target.value)}
                              placeholder="Ví dụ: 7.000.000đ/tháng"
                              className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                              required
                            />
                          </div>

                          <div className="md:col-span-8 space-y-1">
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">Địa điểm làm việc cụ thể *</label>
                            <input 
                              type="text" 
                              value={jobLocation} 
                              onChange={(e) => setJobLocation(e.target.value)}
                              placeholder="Ví dụ: 88 Huỳnh Văn Lũy, Phú Lợi"
                              className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                              required
                            />
                          </div>

                          <div className="md:col-span-12 space-y-1">
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">Mô tả công việc hàng ngày *</label>
                            <textarea 
                              value={jobDesc} 
                              onChange={(e) => setJobDesc(e.target.value)}
                              rows={2}
                              className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                              required
                            />
                          </div>

                          <div className="md:col-span-12 space-y-1">
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">Yêu cầu hồ sơ & Trình độ (Xuống dòng cho mỗi yêu cầu) *</label>
                            <textarea 
                              value={jobRequirements} 
                              onChange={(e) => setJobRequirements(e.target.value)}
                              placeholder="Sức khỏe tốt&#10;Nhanh nhẹn, trung thực"
                              rows={3}
                              className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                              required
                            />
                          </div>

                          <div className="md:col-span-12 space-y-1">
                            <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-500">Thông tin liên hệ nộp hồ sơ *</label>
                            <input 
                              type="text" 
                              value={jobContact} 
                              onChange={(e) => setJobContact(e.target.value)}
                              placeholder="Ví dụ: Phòng nhân sự - ĐT: 028.3821.xxx"
                              className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                              required
                            />
                          </div>
                          <div className="md:col-span-12 flex justify-end">
                            <button 
                              type="submit"
                              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm cursor-pointer"
                            >
                              <Plus className="w-4 h-4" />
                              <span>Đăng tuyển dụng lên Firestore</span>
                            </button>
                          </div>
                        </form>

                    )}
                      {/* Editing job popup block */}
                      {editingJob && (
                        <div className="bg-blue-50/50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
                          <h4 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                            <Edit2 className="w-4 h-4 text-slate-800" />
                            Đang chỉnh sửa việc làm: {editingJob.title}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="block text-[9px] font-bold uppercase text-slate-500">Vị trí tuyển dụng</label>
                              <input 
                                type="text"
                                value={editingJob.title}
                                onChange={(e) => setEditingJob(prev => prev ? { ...prev, title: e.target.value } : null)}
                                className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[9px] font-bold uppercase text-slate-500">Công ty tuyển dụng</label>
                              <input 
                                type="text"
                                value={editingJob.company}
                                onChange={(e) => setEditingJob(prev => prev ? { ...prev, company: e.target.value } : null)}
                                className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[9px] font-bold uppercase text-slate-500">Lương cơ bản</label>
                              <input 
                                type="text"
                                value={editingJob.salary}
                                onChange={(e) => setEditingJob(prev => prev ? { ...prev, salary: e.target.value } : null)}
                                className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[9px] font-bold uppercase text-slate-500">Địa điểm làm việc</label>
                              <input 
                                type="text"
                                value={editingJob.location}
                                onChange={(e) => setEditingJob(prev => prev ? { ...prev, location: e.target.value } : null)}
                                className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                              />
                            </div>
                            <div className="md:col-span-2 space-y-1">
                              <label className="block text-[9px] font-bold uppercase text-slate-500">Mô tả công việc</label>
                              <textarea 
                                value={editingJob.description}
                                onChange={(e) => setEditingJob(prev => prev ? { ...prev, description: e.target.value } : null)}
                                rows={2}
                                className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                              />
                            </div>
                            <div className="md:col-span-2 space-y-1">
                              <label className="block text-[9px] font-bold uppercase text-slate-500">Liên hệ nộp hồ sơ</label>
                              <input 
                                type="text"
                                value={editingJob.contact}
                                onChange={(e) => setEditingJob(prev => prev ? { ...prev, contact: e.target.value } : null)}
                                className="w-full text-xs px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end space-x-2">
                            <button 
                              type="button"
                              onClick={() => {  setEditingJob(null); }}
                              className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 rounded text-slate-500 text-xs font-bold"
                            >
                              Hủy
                            </button>
                            <button 
                              onClick={handleEditJobSave}
                              className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded text-xs font-bold flex items-center gap-1"
                            >
                              <Save className="w-3.5 h-3.5" />
                              Lưu thay đổi
                            </button>
                          </div>
                        </div>

                        )}

                      {/* Jobs Grid Table */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {jobsList.map(job => (
                          <div key={job.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3 relative hover:border-slate-300 transition-all text-xs flex flex-col justify-between">
                            <div className="space-y-1.5">
                              <div className="flex justify-between items-center">
                                <span className="font-mono text-[9px] bg-indigo-100 text-blue-700 px-2 py-0.5 rounded-sm font-bold">{job.id}</span>
                                <span className="text-[10px] font-extrabold text-slate-800 font-mono">{job.salary}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                <MapPin className="w-3.5 h-3.5" />
                                <span className="truncate">{job.location}</span>
                              </div>
                              
                              <p className="text-slate-500 font-light line-clamp-2 mt-1 italic">"{job.description}"</p>
                              
                              <div className="space-y-1 pt-1 text-left">
                                <div className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Yêu cầu tiêu biểu:</div>
                                <ul className="list-disc list-inside text-[10px] text-slate-500 font-light space-y-0.5">
                                  {job.requirements.slice(0, 2).map((r, i) => (
                                    <li key={i} className="truncate">{r}</li>
                                  ))}
                                  {job.requirements.length > 2 && <li className="text-slate-400">và {job.requirements.length - 2} yêu cầu khác...</li>}
                                </ul>
                              </div>
                            </div>
                            <div className="flex justify-end space-x-2 pt-3 border-t border-slate-200/50 mt-2">
                              <button
                                title="Chỉnh sửa"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-200 transition-all cursor-pointer"
                                title="Xóa"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>


                        )}

                  {/* TAB 5: ADVANCED REQUESTS MANAGER */}
                  {activeTab === "requests" && (
                    <motion.div
                      key="tab-requests"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="border-b border-slate-100 pb-3 flex justify-between items-center flex-wrap gap-2">
                        <div>
                          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Hệ thống xét duyệt cứu trợ nâng cao</h3>
                          <p className="text-[11px] text-slate-400 font-light">Lọc, tìm kiếm, cập nhật trạng thái hồ sơ của công dân phường và gửi phản hồi xác minh tức thì.</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setIsTemplateManagerOpen(!isTemplateManagerOpen)}
                            className={`px-3 py-1.5 border rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all cursor-pointer ${
                              isTemplateManagerOpen 
                                ? "bg-sky-500 text-white border-sky-600 hover:bg-sky-600" 
                                : "bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-700"
                            }`}
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Mẫu tin nhắn</span>
                          </button>
                          <button
                            onClick={() => { if (onRefreshRequests) onRefreshRequests(); }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Đồng bộ</span>
                          </button>
                          <button
                            onClick={handleExportCSV}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Xuất CSV</span>
                          </button>
                        </div>
                      </div>

                      {/* BIỂU ĐỒ TRỰC QUAN TỶ LỆ CỨU TRỢ */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
                          <div>
                            <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                              <span className="p-1.5 bg-sky-100 text-sky-700 rounded-lg">
                                <Activity className="w-4 h-4" />
                              </span>
                              <span>Tỷ Lệ Hồ Sơ Tiếp Nhận Theo Loại Hỗ Trợ</span>
                            </h4>
                            <p className="text-[11px] text-slate-400 font-light mt-1">
                              Thống kê trực quan cơ cấu nhu cầu an sinh xã hội để tối ưu phân bổ nguồn lực cứu trợ.
                            </p>
                          </div>
                          
                          {/* Timeframe Selector */}
                          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 p-1 rounded-xl">
                            <button
                              onClick={() => setChartTimeframe("current_month")}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                                chartTimeframe === "current_month"
                                  ? "bg-white text-sky-600 shadow-xs border border-sky-100"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              Tháng này
                            </button>
                            <button
                              onClick={() => setChartTimeframe("all_time")}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                                chartTimeframe === "all_time"
                                  ? "bg-white text-sky-600 shadow-xs border border-sky-100"
                                  : "text-slate-500 hover:text-slate-800"
                              }`}
                            >
                              Tất cả
                            </button>
                          </div>
                        </div>

                        {chartTotal === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center">
                            <FileText className="w-8 h-8 text-slate-300 mb-2" />
                            <span className="text-xs text-slate-400 font-medium">Chưa có hồ sơ nào trong khoảng thời gian này.</span>
                            {chartTimeframe === "current_month" && (
                              <button
                                onClick={() => setChartTimeframe("all_time")}
                                className="mt-2 text-[10px] font-extrabold uppercase text-sky-600 hover:underline cursor-pointer"
                              >
                                Xem tất cả các tháng
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                            {/* Chart Area */}
                            <div className="md:col-span-7 h-[260px] flex items-center justify-center relative">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={3}
                                    dataKey="value"
                                  >
                                    {chartData.map((entry: any, index: number) => (
                                      <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} />
                                    ))}
                                  </Pie>
                                  <Tooltip 
                                    contentStyle={{ 
                                      backgroundColor: "#ffffff", 
                                      border: "1px solid #e2e8f0", 
                                      borderRadius: "12px",
                                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                                      fontFamily: "Inter, sans-serif",
                                      fontSize: "11px"
                                    }}
                                    formatter={(value: any, name: any, props: any) => [
                                      `${value} hồ sơ (${props.payload.percentage}%)`,
                                      name
                                    ]}
                                  />
                                </PieChart>
                              </ResponsiveContainer>
                              
                              {/* Center text of doughnut */}
                              <div className="absolute text-center flex flex-col justify-center items-center pointer-events-none">
                                <span className="text-2xl font-black text-slate-800">{chartTotal}</span>
                                <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">Hồ sơ</span>
                              </div>
                            </div>

                            {/* Legend / Statistics Detail Grid */}
                            <div className="md:col-span-5 space-y-3">
                              <h5 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Chi tiết nhu cầu cứu trợ</h5>
                              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-2 scrollbar-thin">
                                {chartData.map((item: any, idx: number) => {
                                  const color = getCategoryColor(item.name);
                                  return (
                                    <div key={idx} className="flex items-center justify-between p-2 border border-slate-50 hover:border-slate-100 rounded-xl bg-slate-50/50 transition">
                                      <div className="flex items-center space-x-2.5 min-w-0">
                                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                        <span className="text-[11px] font-medium text-slate-700 truncate">{item.name}</span>
                                      </div>
                                      <div className="flex items-center space-x-2 shrink-0">
                                        <span className="text-[11px] font-bold text-slate-800">{item.value} bộ</span>
                                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">{item.percentage}%</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* BIỂU ĐỒ TRỰC QUAN MẬT ĐỘ THEO KHU PHỐ */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mt-6 text-left">
                        <div>
                          <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                            <span className="p-1.5 bg-indigo-100 text-indigo-700 rounded-lg">
                              <MapPin className="w-4 h-4" />
                            </span>
                            <span>Mật Độ Hồ Sơ Cứu Trợ Tại 14 Khu Phố</span>
                          </h4>
                          <p className="text-[11px] text-slate-400 font-light mt-1">
                            Tổng hợp nhu cầu cứu trợ (Hồ sơ trực tuyến mới kết hợp cơ sở dữ liệu lưu trữ lịch sử) để phân bổ cán bộ xác minh và nguồn lực từ thiện tối ưu nhất.
                          </p>
                        </div>

                        <div className="h-[300px] mt-6">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={quarterDensityData}
                              margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis 
                                dataKey="name" 
                                tick={{ fill: '#64748b', fontSize: 9, fontWeight: 500 }} 
                                axisLine={{ stroke: '#cbd5e1' }}
                                tickLine={false}
                              />
                              <YAxis 
                                tick={{ fill: '#64748b', fontSize: 10 }}
                                axisLine={{ stroke: '#cbd5e1' }}
                                tickLine={false}
                              />
                              <Tooltip
                                contentStyle={{ 
                                  backgroundColor: "#ffffff", 
                                  border: "1px solid #e2e8f0", 
                                  borderRadius: "12px",
                                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                                  fontFamily: "Inter, sans-serif",
                                  fontSize: "11px"
                                }}
                              />
                              <Legend 
                                wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', fontFamily: 'Inter, sans-serif', paddingTop: '10px' }}
                                verticalAlign="bottom"
                                height={36}
                              />
                              <Bar dataKey="Yêu cầu trực tuyến (Mới)" stackId="a" fill="#0ea5e9" radius={[0, 0, 0, 0]} />
                              <Bar dataKey="Hồ sơ lưu trữ (Lịch sử)" stackId="a" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* COLLAPSIBLE MESSAGE TEMPLATE MANAGER */}
                      {isTemplateManagerOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-sky-50/50 border border-sky-100 rounded-3xl p-5 space-y-4 text-xs overflow-hidden text-left"
                        >
                          <div className="flex justify-between items-center border-b border-sky-100 pb-2.5 flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="p-2 bg-sky-500 text-white rounded-xl">
                                <MessageSquare className="w-4 h-4" />
                              </span>
                              <div>
                                <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">Cấu hình mẫu tin nhắn tự động</h4>
                                <p className="text-[10px] text-slate-400 font-light mt-0.5">Mẫu tin nhắn tương ứng với từng trạng thái hồ sơ để cán bộ gửi nhanh cho người dân.</p>
                              </div>
                            </div>
                            <button
                              onClick={handleSaveTemplates}
                              className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                            >
                              <Save className="w-3.5 h-3.5" />
                              Lưu thay đổi
                            </button>
                          </div>

                          {/* Status Selection Tabs */}
                          <div className="flex flex-wrap gap-1.5 border-b border-slate-200 pb-2">
                            {Object.keys(msgTemplates).map((statusKey) => {
                              const statusLabel = statusKey === "SUBMITTED" ? "Đã tiếp nhận" :
                                statusKey === "VERIFYING" ? "Đang xác minh" :
                                statusKey === "APPROVED" ? "Đã duyệt hỗ trợ" : "Đã hoàn thành";
                              const isActive = activeTemplateTab === statusKey;
                              return (
                                <button
                                  key={statusKey}
                                  type="button"
                                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                                    isActive 
                                      ? "bg-white text-sky-600 shadow-sm border border-sky-200" 
                                      : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                                  }`}
                                >
                                  {statusLabel}
                                </button>
                              );
                            })}
                          </div>

                          {/* Template Editor */}
                          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                            <div className="lg:col-span-8 space-y-2">
                              <label className="block text-[10px] font-extrabold text-slate-500 uppercase">Nội dung mẫu tin nhắn</label>
                              <textarea
                                rows={4}
                                value={msgTemplates[activeTemplateTab]}
                                onChange={(e) => setMsgTemplates({
                                  ...msgTemplates,
                                  [activeTemplateTab]: e.target.value
                                })}

                                className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-sky-500 font-light leading-relaxed shadow-inner"
                              />
                            </div>
                            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                              <div>
                                <span className="block text-[10px] font-extrabold text-slate-600 uppercase tracking-wide mb-1.5">💡 Từ khóa tự động điền</span>
                                <div className="grid grid-cols-2 gap-1 font-mono text-[9px] text-slate-500">
                                  <div><strong className="text-sky-600">{`{FullName}`}</strong>: Họ tên</div>
                                  <div><strong className="text-sky-600">{`{ReqId}`}</strong>: Mã số</div>
                                  <div><strong className="text-sky-600">{`{Phone}`}</strong>: SĐT</div>
                                  <div><strong className="text-sky-600">{`{Quarter}`}</strong>: Khu phố</div>
                                  <div className="col-span-2"><strong className="text-sky-600">{`{Category}`}</strong>: Loại hỗ trợ</div>
                                  <div className="col-span-2"><strong className="text-sky-600">{`{Notes}`}</strong>: Ghi chú xử lý</div>
                                  <div className="col-span-2"><strong className="text-sky-600">{`{CreatedAt}`}</strong>: Ngày nộp</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>

                        )}

                      {/* CẢNH BÁO HỒ SƠ QUÁ HẠN XỬ LÝ (> 5 NGÀY) */}
                      {overdueRequests.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-rose-50 border border-rose-200 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-rose-950 text-left shadow-xs"
                        >
                          <div className="flex items-start md:items-center gap-3">
                            <span className="p-2.5 bg-rose-500 text-white rounded-2xl font-extrabold text-sm shadow-sm animate-pulse">
                              <AlertCircle className="w-5 h-5" />
                            </span>
                            <div>
                              <span className="font-extrabold text-sm text-rose-900 block">Cảnh báo: Có {overdueRequests.length} hồ sơ trễ hạn xử lý!</span>
                              <span className="text-[10px] text-rose-700/80 font-medium block mt-0.5">
                                Phát hiện {overdueRequests.length} hồ sơ cứu trợ trực tuyến của công dân đã nộp quá 5 ngày nhưng chưa được giải quyết (hoàn thành). Vui lòng kiểm tra và xử lý kịp thời để hỗ trợ người dân địa phương.
                              </span>
                            </div>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => {
                              // Set filter to "ALL" status and filter query to empty
                              setReqStatusFilter("ALL");
                              setReqSearchQuery("");
                              // Scroll smoothly to the first overdue request
                              setTimeout(() => {
                                const firstRedItem = document.querySelector(".border-rose-300");
                                if (firstRedItem) {
                                  firstRedItem.scrollIntoView({ behavior: "smooth", block: "center" });
                                }
                              }, 100);
                            }}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold uppercase tracking-wider text-[10px] rounded-xl shadow-xs cursor-pointer transition-all shrink-0 text-center"
                          >
                            Xem hồ sơ trễ hạn
                          </button>
                        </motion.div>
                      )}

                      {/* Filter Bar */}
                      <div className="bg-slate-50 p-4 rounded-3xl border border-slate-200 flex flex-wrap gap-4 items-end text-xs shadow-xs">
                        <div className="space-y-1 flex-1 min-w-[200px]">
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Tìm kiếm nhanh</label>
                          <input
                            type="text"
                            value={reqSearchQuery}
                            onChange={(e) => setReqSearchQuery(e.target.value)}
                            placeholder="Tìm theo họ tên, SĐT, mã số..."
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-600 outline-none focus:border-sky-500 font-medium placeholder-slate-400"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Trạng thái hồ sơ</label>
                          <select
                            value={reqStatusFilter}
                            onChange={(e) => setReqStatusFilter(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-500 font-semibold cursor-pointer outline-none focus:border-sky-500"
                          >
                            <option value="ALL">Tất cả trạng thái</option>
                            <option value={RequestStatus.SUBMITTED}>{RequestStatus.SUBMITTED}</option>
                            <option value={RequestStatus.VERIFYING}>{RequestStatus.VERIFYING}</option>
                            <option value={RequestStatus.APPROVED}>{RequestStatus.APPROVED}</option>
                            <option value={RequestStatus.COMPLETED}>{RequestStatus.COMPLETED}</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Khu phố địa bàn</label>
                          <select 
                            value={reqQuarterFilter}
                            onChange={(e) => setReqQuarterFilter(e.target.value)}
                            className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-500 font-semibold cursor-pointer outline-none focus:border-sky-500"
                          >
                            <option value="ALL">Tất cả khu phố</option>
                             {QUARTERS_LIST.map(kp => (
                               <option key={kp.name} value={kp.name}>{kp.name}</option>
                             ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg font-bold text-[10px] uppercase tracking-wider shadow-xs transition cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={filteredRequests.length > 0 && filteredRequests.every(r => selectedRequestIds.includes(r.id))}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  const newIds = filteredRequests.map(r => r.id);
                                  setSelectedRequestIds(prev => Array.from(new Set([...prev, ...newIds])));
                                } else {
                                  setSelectedRequestIds(prev => prev.filter(id => !filteredRequests.some(r => r.id === id)));
                                }
                              }}
                              className="w-3.5 h-3.5 text-sky-600 border-slate-300 rounded focus:ring-sky-500 cursor-pointer"
                            />
                            <span>Chọn nhiều ({selectedRequestIds.length})</span>
                          </label>

                          {selectedRequestIds.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedRequestIds([])}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-[9px] uppercase tracking-wider shadow-xs transition cursor-pointer"
                            >
                              Hủy chọn
                            </button>
                          )}
                        </div>

                        <div className="ml-auto bg-sky-100 text-sky-800 text-[10px] font-bold px-3 py-1.5 rounded-full border border-sky-200">
                          Tìm thấy: {filteredRequests.length} hồ sơ
                        </div>
                      </div>

                      {/* Bulk Actions Panel */}
                      {selectedRequestIds.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.98 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-amber-50/90 backdrop-blur-xs border-2 border-amber-200 rounded-3xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs text-amber-950 text-left shadow-md"
                        >
                          <div className="flex items-center gap-3">
                            <span className="p-3 bg-amber-500 text-white rounded-2xl font-extrabold text-sm shadow-sm animate-bounce">
                              {selectedRequestIds.length}
                            </span>
                            <div>
                              <span className="font-extrabold text-sm text-amber-900 block">Công cụ xử lý hồ sơ cứu trợ hàng loạt</span>
                              <span className="text-[10px] text-amber-700 font-light block mt-0.5">
                                Đang chọn <strong>{selectedRequestIds.length}</strong> hồ sơ của bà con. Chọn một tác vụ bên dưới để áp dụng hàng loạt:
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 items-center">
                            <button
                              type="button"
                              onClick={() => handleBulkStatusChange(RequestStatus.SUBMITTED)}
                              className="px-3.5 py-2 bg-slate-600 hover:bg-slate-700 text-white font-extrabold uppercase tracking-wider text-[10px] rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>Đang tiếp nhận</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBulkStatusChange(RequestStatus.VERIFYING)}
                              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold uppercase tracking-wider text-[10px] rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>Đang xác minh</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBulkStatusChange(RequestStatus.APPROVED)}
                              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-extrabold uppercase tracking-wider text-[10px] rounded-xl shadow-xs cursor-pointer transition-all flex items-center gap-1.5"
                            >
                              <Award className="w-3.5 h-3.5" />
                              <span>Duyệt hỗ trợ</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBulkStatusChange(RequestStatus.COMPLETED)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold uppercase tracking-wider text-[10px] rounded-xl shadow-md cursor-pointer transition-all flex items-center gap-1.5 hover:scale-[1.02]"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Giải quyết (Hoàn thành)</span>
                            </button>
                            
                            <div className="h-6 w-[1px] bg-amber-200 mx-1 hidden sm:block"></div>

                            <button
                              type="button"
                              onClick={() => setSelectedRequestIds([])}
                              className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-extrabold uppercase tracking-wider text-[10px] rounded-xl cursor-pointer transition-all"
                            >
                              Bỏ chọn ({selectedRequestIds.length})
                            </button>
                          </div>
                        </motion.div>
                      )}

                      {/* Requests List */}
                      <div className="space-y-3.5">
                        {filteredRequests.length === 0 ? (
                          <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 text-xs">
                            Không tìm thấy hồ sơ nào phù hợp với bộ lọc hiện hành.
                          </div>
                        ) : (
                          filteredRequests.map(req => {
                            const isReqOverdue = req.status !== RequestStatus.COMPLETED && (() => {
                              const createdTime = new Date(req.createdAt).getTime();
                              if (isNaN(createdTime)) return false;
                              const diffTime = Date.now() - createdTime;
                              const diffDays = diffTime / (1000 * 60 * 60 * 24);
                              return diffDays > 5;
                            })();
                            const reqOverdueDays = isReqOverdue ? Math.floor((Date.now() - new Date(req.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;

                            return (
                              <div 
                                key={req.id} 
                                className={`rounded-2xl p-4.5 text-xs transition-all text-left grid grid-cols-1 md:grid-cols-12 gap-4 ${
                                  isReqOverdue 
                                    ? "bg-rose-50/70 border-2 border-rose-300 shadow-sm hover:border-rose-400 animate-in fade-in duration-300" 
                                    : "bg-slate-50 border border-slate-200 hover:border-slate-300"
                                }`}
                              >
                                
                                <div className="md:col-span-4 space-y-1.5 flex items-start gap-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedRequestIds.includes(req.id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedRequestIds(prev => [...prev, req.id]);
                                      } else {
                                        setSelectedRequestIds(prev => prev.filter(id => id !== req.id));
                                      }
                                    }}
                                    className="mt-1 w-4.5 h-4.5 text-sky-600 border-slate-300 rounded-lg focus:ring-sky-500 cursor-pointer shadow-xs"
                                  />
                                  <div className="space-y-1.5 flex-1">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                      <span className="font-extrabold text-slate-800 text-sm">{req.fullName}</span>
                                      <span className="font-mono text-[9px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-bold">{req.id}</span>
                                      {isReqOverdue && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-500 text-white text-[9px] font-black rounded-md uppercase tracking-wider animate-pulse">
                                          <AlertCircle className="w-3 h-3" />
                                          Trễ hạn ({reqOverdueDays} ngày)
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-slate-500 text-[10px] space-y-0.5 font-light">
                                      <div>SĐT liên lạc: <strong className="font-mono text-slate-800">{req.phone}</strong></div>
                                      <div>Địa chỉ: {req.address} ({req.quarter})</div>
                                      <div>Ngày nộp: <span className="font-semibold text-slate-700">{new Date(req.createdAt).toLocaleDateString("vi-VN")} {new Date(req.createdAt).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}</span></div>
                                    </div>
                                  </div>
                                </div>

                                <div className="md:col-span-4 p-3 bg-white border border-slate-200/80 rounded-xl space-y-2 flex flex-col">
                                  <div>
                                    <span className="inline-block px-2 py-0.5 bg-slate-50 text-slate-800 text-[9px] font-black uppercase rounded border border-slate-200 mb-1">{req.category}</span>
                                    <p className="text-slate-500 italic text-xs">"{req.description}"</p>
                                  </div>
                                  <div className="mt-auto pt-2 border-t border-slate-100">
                                    <div className="flex justify-between items-center mb-1">
                                      <label className="block text-[9px] font-bold text-slate-400 uppercase">Ghi chú xác minh:</label>
                                      <button 
                                        className="text-[9px] bg-slate-200 hover:bg-slate-300 text-slate-600 px-2 py-0.5 rounded font-bold"
                                      >
                                        Lưu ghi chú
                                      </button>
                                    </div>
                                    <textarea
                                      className="w-full text-[10px] bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none focus:border-sky-500"
                                      placeholder="Ghi chú nội bộ..."
                                      rows={2}
                                      value={req.notes || ""}
                                      onChange={(e) => {
                                        setRequestsList(prev => prev.map(r => r.id === req.id ? { ...r, notes: e.target.value } : r));
                                      }}
                                    />
                                  </div>
                                </div>

                                <div className="md:col-span-4 space-y-2 flex flex-col justify-between">
                                  <div className="space-y-1">
                                    <label className="block text-[9px] font-extrabold uppercase text-slate-400 mb-1">Cập nhật trạng thái:</label>
                                    <div className="flex gap-2">
                                      <select
                                        value={req.status}
                                        onChange={async (e) => {
                                          await handleRequestStatusChange(req.id, e.target.value, req.notes || "");
                                          if (onRefreshRequests) onRefreshRequests();
                                        }}
                                        className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-slate-500"
                                      >
                                        <option value={RequestStatus.SUBMITTED}>Đã tiếp nhận</option>
                                        <option value={RequestStatus.VERIFYING}>Đang xác minh</option>
                                        <option value={RequestStatus.COMPLETED}>Đã hoàn thành</option>
                                      </select>
                                    </div>
                                  </div>

                                  <button
                                    onClick={() => {
                                      setSendingRequest(req);
                                      const defaultTmpl = msgTemplates[req.status] || msgTemplates["COMPLETED"];
                                      setEditedMsgText(getFormattedMessage(req, defaultTmpl));
                                      setCopiedStatus(false);
                                    }}
                                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-sky-700 font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span>Gửi thông báo</span>
                                  </button>
                                </div>

                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Modal Gửi thông báo nhanh */}
                      <AnimatePresence>
                        {sendingRequest && (
                          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-xl overflow-hidden text-left"
                            >
                              {/* Modal Header */}
                              <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <span className="p-2 bg-sky-100 text-sky-700 rounded-xl">
                                    <MessageSquare className="w-4 h-4" />
                                  </span>
                                  <div>
                                    <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-wide">Gửi thông báo nhanh qua Email</h4>
                                    <p className="text-[10px] text-slate-400 font-light mt-0.5">Gửi email thông báo cho công dân theo trạng thái hồ sơ hiện tại.</p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setSendingRequest(null)}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition cursor-pointer"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Modal Body */}
                              <div className="p-6 space-y-4 text-xs">
                                {/* Citizen Info Summary */}
                                <div className="bg-sky-50/50 border border-sky-100/60 p-3.5 rounded-2xl grid grid-cols-2 gap-3">
                                  <div>
                                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Họ và tên công dân:</span>
                                    <span className="font-bold text-slate-700">{sendingRequest.fullName}</span>
                                  </div>
                                  <div>
                                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Email liên hệ:</span>
                                    <span className="font-mono font-bold text-slate-700">{sendingRequest.email || "Chưa cung cấp"}</span>
                                  </div>
                                  <div>
                                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Loại hồ sơ & Địa bàn:</span>
                                    <span className="font-medium text-slate-600">{sendingRequest.category} ({sendingRequest.quarter})</span>
                                  </div>
                                  <div>
                                    <span className="block text-[9px] font-bold text-slate-400 uppercase">Trạng thái hiện hành:</span>
                                    <span className="inline-block mt-0.5 px-2 py-0.5 bg-sky-100 text-sky-800 rounded text-[9px] font-black uppercase border border-sky-200">
                                      {sendingRequest.status}
                                    </span>
                                  </div>
                                </div>

                                {/* Template Selector/Regenerator */}
                                <div className="space-y-1.5">
                                  <div className="flex justify-between items-center">
                                    <label className="block text-[10px] font-extrabold text-slate-500 uppercase">Nội dung thông báo (Có thể chỉnh sửa)</label>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const defaultTmpl = msgTemplates[sendingRequest.status] || msgTemplates["COMPLETED"];
                                        setEditedMsgText(getFormattedMessage(sendingRequest, defaultTmpl));
                                        setCopiedStatus(false);
                                      }}
                                      className="text-[9px] bg-sky-50 hover:bg-sky-100 text-sky-700 px-2 py-0.5 rounded font-bold transition"
                                    >
                                      Khôi phục mẫu gốc
                                    </button>
                                  </div>
                                  <textarea
                                    rows={5}
                                    value={editedMsgText}
                                    onChange={(e) => setEditedMsgText(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs outline-none focus:border-sky-500 font-light leading-relaxed shadow-inner"
                                  />
                                </div>

                                {/* Copy button helper */}
                                <div className="flex items-center justify-between gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                                  <span className="text-[10px] text-slate-400 font-light">
                                    💡 Nhấn nút bên để copy nội dung, sau đó dán vào email phản hồi thủ công nếu cần.
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(editedMsgText);
                                      setCopiedStatus(true);
                                      setTimeout(() => setCopiedStatus(false), 2000);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition shrink-0 ${
                                      copiedStatus 
                                        ? "bg-emerald-500 text-white" 
                                        : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                                    }`}
                                  >
                                    {copiedStatus ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    <span>{copiedStatus ? "Đã copy" : "Copy nội dung"}</span>
                                  </button>
                                </div>
                              </div>
                              {/* Modal Footer actions */}
                              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setSendingRequest(null)}
                                  className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-500 rounded-xl font-bold uppercase tracking-wider text-[10px] transition cursor-pointer"
                                >
                                  Đóng
                                </button>
                                <button type="button" onClick={() => {
                                      if (!sendingRequest.email) {
                                        showFeedback("⚠️ Công dân không cung cấp Email.", true);
                                        return;
                                      }
                                      showFeedback("📧 Đang gửi Email cho công dân...");
                                      sendEmailNotification(
                                        sendingRequest.email,
                                        `Thông báo trạng thái hồ sơ: ${sendingRequest.status}`,
                                        editedMsgText.replace(/\n/g, "<br>")
                                      ).then((success) => {
                                        if (success) {
                                          showFeedback("✅ Đã gửi Email thành công!");
                                          setSendingRequest(null);
                                        } else {
                                          showFeedback("⚠️ Gửi Email thất bại.", true);
                                        }
                                      });
                                    }}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 shadow-sm transition inline-flex items-center justify-center"
                                  >
                                    <span>Gửi qua Email</span>
                                    <Send className="w-3.5 h-3.5" />
                                  </button>

                              </div>

                            </motion.div>

                          </div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}

                  {activeTab === "notifications" && (
                    <motion.div
                      key="notifications"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <PushNotificationCenter onRequestsUpdated={onRefreshRequests} />
                    </motion.div>

                  )}


                  {activeTab === "news" && (
                    <motion.div
                      key="news"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      {/* STATS OVERVIEW */}
                      {(() => {
                        const total = news.length;
                        const published = news.filter(item => !item.status || item.status === "published").length;
                        const drafts = news.filter(item => item.status === "draft").length;
                        const archived = news.filter(item => item.status === "archived").length;

                        return (
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-3xs flex items-center space-x-3.5">
                              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                                <Globe className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Tổng bản tin</p>
                                <p className="text-xl font-bold text-slate-800 font-mono mt-0.5">{total}</p>
                              </div>
                            </div>
                            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-3xs flex items-center space-x-3.5">
                              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                                <CheckCircle2 className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Đang hoạt động</p>
                                <p className="text-xl font-bold text-slate-800 font-mono mt-0.5">{published}</p>
                              </div>
                            </div>
                            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-3xs flex items-center space-x-3.5">
                              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                                <FileText className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Bản nháp</p>
                                <p className="text-xl font-bold text-slate-800 font-mono mt-0.5">{drafts}</p>
                              </div>
                            </div>
                            <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-3xs flex items-center space-x-3.5">
                              <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl shrink-0">
                                <Archive className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Đã lưu trữ</p>
                                <p className="text-xl font-bold text-slate-800 font-mono mt-0.5">{archived}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* COLLAPSIBLE MANUAL ADDITION FORM */}
                      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs transition-all">
                        <button
                          onClick={() => setIsAddNewsOpen(!isAddNewsOpen)}
                          className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition cursor-pointer"
                        >
                          <div>
                            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
                              <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                                <Plus className="w-4 h-4" />
                              </span>
                              <span>Đăng tin tức mới</span>
                            </h3>
                          </div>
                          <div className={`p-1.5 rounded-full transition ${isAddNewsOpen ? "bg-slate-100 rotate-180" : "bg-slate-50 hover:bg-slate-100"}`}>
                            <ChevronDown className="w-4 h-4 text-slate-500" />
                          </div>
                        </button>
                        <AnimatePresence>
                          {isAddNewsOpen && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <form onSubmit={(e) => {
                                e.preventDefault();
                                if (!manualNewsTitle.trim() || !manualNewsSnippet.trim()) {
                                  alert("Vui lòng nhập đầy đủ Tiêu đề và Nội dung bài viết.");
                                  return;
                                }
                                onAddNews?.({
                                  title: manualNewsTitle,
                                  body: manualNewsSnippet,
                                  category: manualNewsCategory,
                                  imageUrl: manualNewsImageUrl || "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&auto=format&fit=crop&q=60",
                                  originalUrl: manualNewsSourceUrl || "https://facebook.com/mttqphuoloi",
                                  date: new Date().toLocaleDateString("vi-VN"),
                                  status: manualNewsStatus,
                                  author: manualNewsAuthor
                                });
                                // Reset form
                                setManualNewsTitle("");
                                setManualNewsSnippet("");
                                setManualNewsImageUrl("");
                                setManualNewsSourceUrl("");
                                setManualNewsCategory("Tin An Sinh");
                                setManualNewsStatus("published");
                                setManualNewsAuthor("Ban Biên Tập");
                                setIsAddNewsOpen(false);
                              }} className="p-6 pt-0 border-t border-slate-100 mt-2 space-y-4 bg-slate-50/50">
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">Tiêu đề bài viết</label>
                                    <input
                                      type="text"
                                      value={manualNewsTitle}
                                      onChange={(e) => setManualNewsTitle(e.target.value)}
                                      placeholder="Ví dụ: Ủy ban MTTQ phường trao tặng 50 phần quà cho hộ khó khăn..."
                                      className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-2xl text-xs focus:outline-none transition-all font-light"
                                      required
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">Tác giả biên soạn</label>
                                    <input
                                      type="text"
                                      value={manualNewsAuthor}
                                      onChange={(e) => setManualNewsAuthor(e.target.value)}
                                      placeholder="Ban Biên Tập"
                                      className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-2xl text-xs focus:outline-none transition-all font-light"
                                    />
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">Phân loại tin tức</label>
                                    <select
                                      value={manualNewsCategory}
                                      onChange={(e) => setManualNewsCategory(e.target.value)}
                                      className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-2xl text-xs focus:outline-none transition-all font-light appearance-none"
                                    >
                                      <option value="Tin An Sinh">Tin An Sinh</option>
                                      <option value="Cứu trợ">Cứu trợ</option>
                                      <option value="Ngày thứ bảy văn minh">Ngày thứ bảy văn minh</option>
                                      <option value="Tuyên truyền">Tuyên truyền</option>
                                      <option value="Hoạt động phong trào">Hoạt động phong trào</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">Đường dẫn bài viết gốc (Tuỳ chọn)</label>
                                    <input
                                      type="url"
                                      value={manualNewsSourceUrl}
                                      onChange={(e) => setManualNewsSourceUrl(e.target.value)}
                                      placeholder="https://facebook.com/..."
                                      className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-2xl text-xs focus:outline-none transition-all font-light"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">Đường dẫn hình ảnh minh hoạ</label>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      value={manualNewsImageUrl}
                                      onChange={(e) => setManualNewsImageUrl(e.target.value)}
                                      placeholder="URL hình ảnh (VD: https://lh3.googleusercontent.com/...)"
                                      className="flex-1 px-4 py-3 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-2xl text-xs focus:outline-none transition-all font-light"
                                    />
                                    <label className="bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold px-4 py-3 rounded-2xl transition cursor-pointer flex items-center shrink-0 border border-sky-100 shadow-3xs">
                                      <span>{isUploadingManualNewsImage ? "Đang tải..." : "Chọn ảnh"}</span>
                                      <input 
                                        type="file" 
                                        accept="image/*" 
                                        className="hidden"
                                        disabled={isUploadingManualNewsImage}
                                        onClick={async (e) => { const token = await getAccessToken(); if (!token) { e.preventDefault(); try { await googleSignIn(); alert("Đã kết nối Google Drive! Vui lòng nhấn chọn ảnh lại."); } catch (err) { alert("Lỗi: " + (err.message || err)); } } }}
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            setIsUploadingManualNewsImage(true);
                                            try {
                                              let token = await getAccessToken();
                                              if (!token) {
                                                const authResult = await googleSignIn();
                                                token = authResult?.accessToken || null;
                                              }
                                              if (!token) throw new Error("Authentication failed");
                                              
                                              const FOLDER_ID = "1LZQhcPm0WiMd1IiqLxW2MrNl6J9PjhrS";
                                              let metadata = { name: `${Date.now()}_${file.name}`, parents: [FOLDER_ID] };
                                              
                                              // 1. Create file metadata
                                              let createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
                                                method: 'POST',
                                                headers: {
                                                  'Authorization': `Bearer ${token}`,
                                                  'Content-Type': 'application/json'
                                                },
                                                body: JSON.stringify(metadata)
                                              });
                                              let createData = await createRes.json();
                                              
                                              if (!createData.id && createData.error) {
                                                console.warn("Falling back to root drive folder", createData.error);
                                                metadata = { name: `${Date.now()}_${file.name}` } as any;
                                                createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
                                                  method: 'POST',
                                                  headers: {
                                                    'Authorization': `Bearer ${token}`,
                                                    'Content-Type': 'application/json'
                                                  },
                                                  body: JSON.stringify(metadata)
                                                });
                                                createData = await createRes.json();
                                              }
                                              
                                              if (!createData.id) throw new Error(createData.error?.message || "Failed to create file");
                                              
                                              // 2. Upload file content
                                              const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${createData.id}?uploadType=media`, {
                                                method: 'PATCH',
                                                headers: {
                                                  'Authorization': `Bearer ${token}`,
                                                  'Content-Type': file.type
                                                },
                                                body: file
                                              });
                                              
                                              if (uploadRes.ok) {
                                                await fetch(`https://www.googleapis.com/drive/v3/files/${createData.id}/permissions`, {
                                                  method: 'POST',
                                                  headers: {
                                                    'Authorization': `Bearer ${token}`,
                                                    'Content-Type': 'application/json'
                                                  },
                                                  body: JSON.stringify({ role: 'reader', type: 'anyone' })
                                                });
                                                setManualNewsImageUrl(`https://drive.google.com/uc?id=${createData.id}`);
                                              } else {
                                                throw new Error("Upload failed");
                                              }
                                            } catch (error) {
                                              console.error("Upload error", error);
                                              alert("Không thể tải lên hình ảnh. Vui lòng cấp quyền Google Drive và thử lại.");
                                            } finally {
                                              setIsUploadingManualNewsImage(false);
                                            }
                                          }
                                        }}
                                      />
                                    </label>
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">Nội dung tóm tắt chi tiết</label>
                                  <textarea
                                    value={manualNewsSnippet}
                                    onChange={(e) => setManualNewsSnippet(e.target.value)}
                                    rows={4}
                                    placeholder="Nội dung bài viết..."
                                    className="w-full px-4 py-3 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-2xl text-xs focus:outline-none transition-all resize-none font-light leading-relaxed"
                                    required
                                  />
                                </div>
                                <div className="flex justify-end pt-2">
                                  <button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider px-6 py-3.5 rounded-2xl shadow-sm transition-all duration-200 cursor-pointer flex items-center space-x-1.5"
                                  >
                                    <Plus className="w-4 h-4" />
                                    <span>Tạo & Đăng Bản Tin</span>
                                  </button>
                                </div>
                              </form>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      {/* MAIN ARCHIVE ENGINE & FILTER BAR */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">Kho dữ liệu tin tức</h4>
                            <p className="text-slate-400 text-[11px] font-light mt-0.5">Tìm kiếm, lọc trạng thái hoạt động và lưu trữ bài viết an sinh.</p>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2">
                            {onRestoreDefaultNews && (
                              <button
                                onClick={() => {
                                  if (window.confirm("Bạn có chắc chắn muốn khôi phục lại các bài viết tin tức mẫu?")) {
                                    onRestoreDefaultNews();
                                  }
                                }}
                                className="text-[10px] bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-150 font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl transition duration-200 flex items-center gap-1.5 cursor-pointer shadow-3xs"
                                title="Khôi phục các bản tin mẫu mặc định"
                              >
                                🔄 Khôi phục tin mẫu
                              </button>
                            )}
                            {news.length > 0 && (
                              <button
                                onClick={() => {
                                  if (window.confirm("CẢNH BÁO: Hành động này sẽ XÓA TOÀN BỘ bài tin tức trong hệ thống! Bạn có chắc chắn muốn tiếp tục?")) {
                                    if (onDeleteMultipleNews) {
                                      onDeleteMultipleNews(news.map(n => n.id));
                                    } else {
                                      news.forEach(n => onDeleteNews?.(n.id));
                                    }
                                    setSelectedNewsIds([]);
                                  }
                                }}
                                className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-150 font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl transition duration-200 flex items-center gap-1.5 cursor-pointer shadow-3xs"
                              >
                                🗑️ Xóa sạch tin tức
                              </button>
                            )}
                          </div>
                        </div>

                        {/* ADVANCED UNIFIED FILTERS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="relative">
                            <input
                              type="text"
                              value={newsSearchQuery}
                              onChange={(e) => setNewsSearchQuery(e.target.value)}
                              placeholder="Tìm kiếm tiêu đề, nội dung, tác giả..."
                              className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-blue-500 rounded-xl text-xs focus:outline-none transition font-light"
                            />
                            <Search className="absolute left-3 top-3 w-3.5 h-3.5 text-slate-400" />
                          </div>

                          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <select
                              value={newsCategoryFilter}
                              onChange={(e) => setNewsCategoryFilter(e.target.value)}
                              className="w-full bg-transparent border-none text-xs focus:outline-none cursor-pointer font-light text-slate-600"
                            >
                              <option value="All">Tất cả danh mục</option>
                              <option value="Tin An Sinh">Tin An Sinh</option>
                              <option value="Hoạt Động Phường">Hoạt Động Phường</option>
                              <option value="Thông Báo Khẩn">Thông Báo Khẩn</option>
                              <option value="Gương Sáng Việc Tốt">Gương Sáng Việc Tốt</option>
                              <option value="Cứu Trợ Xã Hội">Cứu Trợ Xã Hội</option>
                            </select>
                          </div>

                          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                            <Archive className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <select
                              value={newsStatusFilter}
                              onChange={(e) => setNewsStatusFilter(e.target.value)}
                              className="w-full bg-transparent border-none text-xs focus:outline-none cursor-pointer font-light text-slate-600"
                            >
                              <option value="All">Tất cả trạng thái</option>
                              <option value="published">Đang hoạt động (Công khai)</option>
                              <option value="draft">Bản nháp (Ẩn)</option>
                              <option value="archived">Đã lưu trữ (Lưu trữ)</option>
                            </select>
                          </div>

                          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5">
                            <Sliders className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <select
                              value={newsSortOrder}
                              onChange={(e) => setNewsSortOrder(e.target.value as any)}
                              className="w-full bg-transparent border-none text-xs focus:outline-none cursor-pointer font-light text-slate-600"
                            >
                              <option value="newest">Mới nhất đăng trước</option>
                              <option value="oldest">Cũ nhất đăng trước</option>
                              <option value="title-asc">Tiêu đề (A → Z)</option>
                              <option value="title-desc">Tiêu đề (Z → A)</option>
                            </select>
                          </div>
                        </div>

                        {/* CONTEXTUAL BATCH ACTIONS FLOATING BAR */}
                        {selectedNewsIds.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-3 shadow-md"
                          >
                            <div className="flex items-center space-x-2">
                              <span className="flex h-2 w-2 rounded-full bg-blue-400 animate-ping" />
                              <span className="text-xs font-semibold">Đang chọn {selectedNewsIds.length} bản tin</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                onClick={() => {
                                  selectedNewsIds.forEach(id => {
                                    onEditNews?.(id, { status: "published" });
                                  });
                                  setSelectedNewsIds([]);
                                }}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold uppercase transition"
                              >
                                🚀 Công khai
                              </button>
                              <button
                                onClick={() => {
                                  selectedNewsIds.forEach(id => {
                                    onEditNews?.(id, { status: "draft" });
                                  });
                                  setSelectedNewsIds([]);
                                }}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-bold uppercase transition"
                              >
                                📝 Đặt làm nháp
                              </button>
                              <button
                                onClick={() => {
                                  selectedNewsIds.forEach(id => {
                                    onEditNews?.(id, { status: "archived" });
                                  });
                                  setSelectedNewsIds([]);
                                }}
                                className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-[10px] font-bold uppercase transition"
                              >
                                📥 Lưu trữ
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Bạn thực sự muốn xóa vĩnh viễn ${selectedNewsIds.length} bản tin này?`)) {
                                    if (onDeleteMultipleNews) {
                                      onDeleteMultipleNews(selectedNewsIds);
                                    } else {
                                      selectedNewsIds.forEach(id => onDeleteNews?.(id));
                                    }
                                    setSelectedNewsIds([]);
                                  }
                                }}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[10px] font-bold uppercase transition"
                              >
                                🗑️ Xóa vĩnh viễn
                              </button>
                              <button
                                onClick={() => setSelectedNewsIds([])}
                                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[10px] font-bold uppercase transition"
                              >
                                Hủy chọn
                              </button>
                            </div>
                          </motion.div>
                        )}

                        {/* HIGH DENSITY NEWS TABLE GRID */}
                        {(() => {
                          const currentFiltered = filteredNews;

                          if (currentFiltered.length === 0) {
                            return (
                              <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center gap-3">
                                <span className="p-3 bg-slate-100 text-slate-400 rounded-full">
                                  <Search className="w-6 h-6" />
                                </span>
                                <span className="text-slate-500 text-xs font-light">
                                  Không tìm thấy tin tức nào khớp với bộ lọc hiện tại.
                                </span>
                                {(newsSearchQuery || newsCategoryFilter !== "All" || newsStatusFilter !== "All") && (
                                  <button
                                    onClick={() => {
                                      setNewsSearchQuery("");
                                      setNewsCategoryFilter("All");
                                      setNewsStatusFilter("All");
                                    }}
                                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-xl transition cursor-pointer"
                                  >
                                    Xóa các bộ lọc
                                  </button>
                                )}
                              </div>
                            );
                          }

                          return (
                            <div className="overflow-x-auto rounded-2xl border border-slate-250/50 bg-white">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                                    <th className="p-3.5 w-10 text-center">
                                      <input
                                        type="checkbox"
                                        checked={currentFiltered.length > 0 && selectedNewsIds.length === currentFiltered.length}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setSelectedNewsIds(currentFiltered.map(item => item.id));
                                          } else {
                                            setSelectedNewsIds([]);
                                          }
                                        }}
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/50 h-3.5 w-3.5 cursor-pointer"
                                      />
                                    </th>
                                    <th className="p-3.5">Bản tin</th>
                                    <th className="p-3.5 w-32">Danh mục</th>
                                    <th className="p-3.5 w-40">Tác giả & Ngày đăng</th>
                                    <th className="p-3.5 w-32">Trạng thái</th>
                                    <th className="p-3.5 w-24 text-center">Hành động</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {currentFiltered.map((item) => {
                                    const isSelected = selectedNewsIds.includes(item.id);
                                    const itemStatus = item.status || "published";

                                    return (
                                      <tr
                                        key={item.id}
                                        className={`hover:bg-slate-50/50 transition-colors ${isSelected ? "bg-blue-50/15" : ""}`}
                                      >
                                        {/* CHECKBOX SELECTION */}
                                        <td className="p-3.5 text-center">
                                          <input
                                            type="checkbox"
                                            checked={isSelected}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                setSelectedNewsIds(prev => [...prev, item.id]);
                                              } else {
                                                setSelectedNewsIds(prev => prev.filter(id => id !== item.id));
                                              }
                                            }}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/50 h-3.5 w-3.5 cursor-pointer"
                                          />
                                        </td>

                                        {/* BANNER & INFO COLUMN */}
                                        <td className="p-3.5">
                                          <div className="flex items-center space-x-3.5">
                                            <img
                                              src={item.imageUrl || "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=120&auto=format&fit=crop&q=60"}
                                              alt={item.title}
                                              className="w-12 h-12 object-cover rounded-lg border border-slate-200 bg-white"
                                              onError={(e) => {
                                                (e.target as HTMLImageElement).src = "https://lh3.googleusercontent.com/d/1MT0t2jwh0jomWuJmtMxyT59XTjDHJ2AP";
                                              }}
                                            />
                                            <div className="min-w-0 max-w-md">
                                              <p className="text-xs font-semibold text-slate-800 truncate" title={item.title}>
                                                {item.title}
                                              </p>
                                              <div className="flex items-center space-x-2 mt-1">
                                                <span className="text-[10px] text-slate-400 font-mono font-light">
                                                  ID: {item.id}
                                                </span>
                                                <span className="text-slate-300 text-[10px]">•</span>
                                                <span className="text-[10px] text-slate-400 font-light flex items-center">
                                                  {item.body.length} ký tự
                                                </span>
                                                {item.originalUrl && (
                                                  <>
                                                    <span className="text-slate-300 text-[10px]">•</span>
                                                    <a
                                                      href={item.originalUrl}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="text-[10px] text-blue-500 hover:underline flex items-center space-x-0.5 shrink-0"
                                                    >
                                                      <span>Bài gốc</span>
                                                      <ExternalLink className="w-2.5 h-2.5" />
                                                    </a>
                                                  </>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </td>

                                        {/* CATEGORY TAG */}
                                        <td className="p-3.5">
                                          <span className="px-2.5 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-100">
                                            {item.category}
                                          </span>
                                        </td>

                                        {/* AUTHOR & DATE */}
                                        <td className="p-3.5">
                                          <p className="text-xs text-slate-700 font-light truncate max-w-32">
                                            👤 {item.author || "Ban Biên Tập"}
                                          </p>
                                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                            📅 {item.date}
                                          </p>
                                        </td>

                                        {/* STATUS BADGE */}
                                        <td className="p-3.5">
                                          {itemStatus === "published" && (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-bold uppercase rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                              Đã đăng
                                            </span>
                                          )}
                                          {itemStatus === "draft" && (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-bold uppercase rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                              Bản nháp
                                            </span>
                                          )}
                                          {itemStatus === "archived" && (
                                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-[9px] font-bold uppercase rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                                              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                              Lưu trữ
                                            </span>
                                          )}
                                        </td>

                                        {/* QUICK ACTIONS */}
                                        <td className="p-3.5 text-center">
                                          <div className="flex items-center justify-center space-x-1.5">
                                            <button
                                              onClick={() => setEditingNewsItem(item)}
                                              className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded-lg border border-slate-250/50 transition cursor-pointer"
                                              title="Chỉnh sửa nội dung & trạng thái lưu trữ"
                                            >
                                              <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                              onClick={() => {
                                                if (window.confirm("Bạn có chắc chắn muốn xóa bài viết này không? Hành động không thể hoàn tác.")) {
                                                  onDeleteNews?.(item.id);
                                                }
                                              }}
                                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 hover:text-rose-700 rounded-lg border border-rose-100 transition cursor-pointer"
                                              title="Xóa vĩnh viễn"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          );
                        })()}
                      </div>

                      {/* EDIT DETAILED NEWS MODAL WITH LIVE MOBILE PREVIEW */}
                      {editingNewsItem && (
                        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[200] p-4">
                          <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col"
                          >
                            {/* Modal Header */}
                            <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
                              <div>
                                <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-1.5">
                                  <span className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                                    <Sliders className="w-4 h-4" />
                                  </span>
                                  <span>Chỉnh Sửa Chi Tiết & Tối Ưu Lưu Trữ</span>
                                </h3>
                                <p className="text-[10px] text-slate-400 font-light mt-0.5">Mã tài liệu: {editingNewsItem.id}</p>
                              </div>
                              <button
                                onClick={() => setEditingNewsItem(null)}
                                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition cursor-pointer"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>

                            {/* Modal Content Grid */}
                            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                              {/* Left column: Edit Form (7 cols) */}
                              <div className="lg:col-span-7 space-y-4">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider pb-1.5 border-b border-slate-100">Biên tập nội dung</h4>

                                <div className="space-y-3.5">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tiêu đề bài viết</label>
                                    <input
                                      type="text"
                                      value={editingNewsItem.title}
                                      onChange={(e) => setEditingNewsItem({ ...editingNewsItem, title: e.target.value })}
                                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 focus:border-blue-500 focus:bg-white rounded-xl text-xs focus:outline-none transition"
                                      required
                                    />
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Danh mục</label>
                                      <select
                                        value={editingNewsItem.category}
                                        onChange={(e) => setEditingNewsItem({ ...editingNewsItem, category: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 focus:border-blue-500 focus:bg-white rounded-xl text-xs focus:outline-none transition cursor-pointer"
                                      >
                                        <option value="Tin An Sinh">Tin An Sinh</option>
                                        <option value="Hoạt Động Phường">Hoạt Động Phường</option>
                                        <option value="Thông Báo Khẩn">Thông Báo Khẩn</option>
                                        <option value="Gương Sáng Việc Tốt">Gương Sáng Việc Tốt</option>
                                        <option value="Cứu Trợ Xã Hội">Cứu Trợ Xã Hội</option>
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Trạng thái xuất bản</label>
                                      <select
                                        value={editingNewsItem.status || "published"}
                                        onChange={(e) => setEditingNewsItem({ ...editingNewsItem, status: e.target.value as any })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 focus:border-blue-500 focus:bg-white rounded-xl text-xs focus:outline-none transition cursor-pointer"
                                      >
                                        <option value="published">Đã đăng (Công khai)</option>
                                        <option value="draft">Bản nháp (Nội bộ)</option>
                                        <option value="archived">Lưu trữ (Ẩn khỏi trang chủ)</option>
                                      </select>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Tác giả biên soạn</label>
                                      <input
                                        type="text"
                                        value={editingNewsItem.author || "Ban Biên Tập"}
                                        onChange={(e) => setEditingNewsItem({ ...editingNewsItem, author: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 focus:border-blue-500 focus:bg-white rounded-xl text-xs focus:outline-none transition"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Ngày xuất bản</label>
                                      <input
                                        type="text"
                                        value={editingNewsItem.date}
                                        onChange={(e) => setEditingNewsItem({ ...editingNewsItem, date: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 focus:border-blue-500 focus:bg-white rounded-xl text-xs focus:outline-none transition"
                                      />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Đường dẫn hình ảnh</label>
                                    <input
                                      type="text"
                                      value={editingNewsItem.imageUrl}
                                      onChange={(e) => setEditingNewsItem({ ...editingNewsItem, imageUrl: e.target.value })}
                                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 focus:border-blue-500 focus:bg-white rounded-xl text-xs focus:outline-none transition"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Liên kết nguồn Facebook</label>
                                    <input
                                      type="url"
                                      value={editingNewsItem.originalUrl}
                                      onChange={(e) => setEditingNewsItem({ ...editingNewsItem, originalUrl: e.target.value })}
                                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-250 focus:border-blue-500 focus:bg-white rounded-xl text-xs focus:outline-none transition"
                                    />
                                  </div>

                                  <div>
                                    <div className="flex justify-between items-center mb-1">
                                      <label className="text-[10px] font-bold text-slate-500 uppercase">Nội dung tóm tắt chi tiết</label>
                                      <span className="text-[9px] text-slate-400 font-mono">
                                        Độ dài: {editingNewsItem.body.length} ký tự
                                      </span>
                                    </div>
                                    <textarea
                                      value={editingNewsItem.body}
                                      onChange={(e) => setEditingNewsItem({ ...editingNewsItem, body: e.target.value })}
                                      rows={6}
                                      className="w-full px-4 py-3 bg-slate-50 border border-slate-250 focus:border-blue-500 focus:bg-white rounded-xl text-xs focus:outline-none transition resize-none font-light"
                                      required
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Right column: Mobile Citizen Preview (5 cols) */}
                              <div className="lg:col-span-5 flex flex-col justify-between bg-slate-50 rounded-2xl border border-slate-200 p-5 overflow-hidden">
                                <div className="space-y-4">
                                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Xem trước hiển thị</h4>
                                    <span className="text-[8px] bg-sky-100 text-sky-700 px-2 py-0.5 rounded font-mono uppercase tracking-widest font-bold">
                                      Bà con xem
                                    </span>
                                  </div>

                                  {/* SIMULATED RESPONSIVE FEED CARD */}
                                  <div className="bg-white rounded-2xl border border-slate-150 overflow-hidden shadow-xs flex flex-col">
                                    <div className="relative h-44 bg-slate-200 overflow-hidden">
                                      <img
                                        src={editingNewsItem.imageUrl || "https://lh3.googleusercontent.com/d/1MT0t2jwh0jomWuJmtMxyT59XTjDHJ2AP"}
                                        alt={editingNewsItem.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = "https://lh3.googleusercontent.com/d/1MT0t2jwh0jomWuJmtMxyT59XTjDHJ2AP";
                                        }}
                                      />
                                      <span className="absolute top-2.5 left-2.5 bg-blue-600/95 backdrop-blur-xs text-white text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full shadow-xs">
                                        {editingNewsItem.category}
                                      </span>
                                    </div>

                                    <div className="p-4 flex-1 flex flex-col justify-between">
                                      <div>
                                        <div className="flex items-center text-[9px] text-slate-400 font-medium mb-1.5">
                                          <Calendar className="w-3 h-3 mr-1" />
                                          <span>{editingNewsItem.date}</span>
                                          <span className="mx-1">•</span>
                                          <span>Tác giả: {editingNewsItem.author || "Ban Biên Tập"}</span>
                                        </div>

                                        <h3 className="text-xs font-bold text-blue-900 leading-snug line-clamp-2">
                                          {editingNewsItem.title || "Vui lòng nhập tiêu đề bài viết..."}
                                        </h3>

                                        <p className="text-slate-500 text-[10px] font-light mt-1.5 leading-relaxed line-clamp-3">
                                          {editingNewsItem.body || "Vui lòng nhập nội dung tóm tắt..."}
                                        </p>
                                      </div>

                                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                                        <span className="flex items-center space-x-1 text-[8px] font-bold text-blue-900 uppercase">
                                          <Globe className="w-2.5 h-2.5" />
                                          <span>Chia sẻ</span>
                                        </span>

                                        <span className="text-[8px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 flex items-center space-x-0.5">
                                          <span>Xem bài gốc</span>
                                          <span>↗</span>
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-slate-200">
                                  <p className="text-[10px] text-slate-400 font-light leading-relaxed">
                                    💡 <b>Mẹo lưu trữ:</b> Các bài viết có trạng thái <b>Lưu trữ</b> hoặc <b>Bản nháp</b> sẽ không hiển thị trên bảng tin công cộng của người dân, giúp giữ sạch sẽ trang tin tức trong khi lưu trữ tư liệu chất lượng cao cho Mặt trận phường.
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4.5 bg-slate-50 border-t border-slate-150 flex items-center justify-end space-x-2.5">
                              <button
                                onClick={() => setEditingNewsItem(null)}
                                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition cursor-pointer"
                              >
                                Hủy bỏ
                              </button>
                              <button
                                onClick={() => {
                                  if (onEditNews && editingNewsItem) {
                                    onEditNews(editingNewsItem.id, editingNewsItem);
                                  }
                                  setEditingNewsItem(null);
                                }}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer flex items-center space-x-1.5"
                              >
                                <Save className="w-4 h-4" />
                                <span>Lưu Thay Đổi</span>
                              </button>
                            </div>
                          </motion.div>
                        </div>
                      )}
                    </motion.div>
                  )}
                  
                  {/* TAB: POLICIES */}
                  {activeTab === "policies" && (
                    <motion.div
                      key="tab-policies"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="border-b border-slate-100 pb-3 flex justify-between items-center flex-wrap gap-2">
                        <div>
                          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Quản lý Chính sách An sinh Xã hội</h3>
                          <p className="text-[11px] text-slate-400 font-light">Thêm, sửa, xóa các văn bản, nghị quyết, quy định về an sinh xã hội.</p>
                        </div>
                        <button
                          onClick={() => {
                            const newDocId = "pol-" + Date.now();
                            const newDoc = {
                              id: newDocId,
                              title: "Văn bản mới",
                              description: "Mô tả văn bản...",
                              category: "Nghị quyết",
                              agency: "Cơ quan ban hành",
                              date: new Date().toLocaleDateString("vi-VN"),
                              link: "#",
                              bg: "bg-sky-50",
                              color: "text-sky-600",
                              border: "border-sky-100",
                              createdAt: new Date().toISOString()
                            };
                            if (setPolicyDocuments) {
                              setPolicyDocuments(prev => [newDoc, ...prev]);
                            }
                            savePolicyDocumentToFirestore(newDoc).then(() => {
                                showFeedback("Tạo mới thành công văn bản.");
                            }).catch(() => {
                                showFeedback("Tạo văn bản thất bại.", true);
                            });
                          }}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Thêm văn bản mới</span>
                        </button>
                      </div>

                      <div className="space-y-4">
                        {(policyDocuments || []).length === 0 ? (
                          <div className="text-center py-10 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 text-xs">
                            Chưa có văn bản chính sách nào.
                          </div>
                        ) : (
                          (policyDocuments || []).map((doc) => (
                            <div key={doc.id} className="bg-white border border-slate-200 rounded-2xl p-4 md:p-5 shadow-sm space-y-4 text-left">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tên văn bản / Số hiệu</label>
                                    <input 
                                      type="text" 
                                      value={doc.title}
                                      onChange={(e) => {
                                        const updated = { ...doc, title: e.target.value };
                                        if (setPolicyDocuments) {
                                            setPolicyDocuments(prev => prev.map(d => d.id === doc.id ? updated : d));
                                        }
                                        savePolicyDocumentToFirestore(updated);
                                      }}
                                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 font-semibold"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cơ quan ban hành</label>
                                    <input 
                                      type="text" 
                                      value={doc.agency}
                                      onChange={(e) => {
                                        const updated = { ...doc, agency: e.target.value };
                                        if (setPolicyDocuments) {
                                            setPolicyDocuments(prev => prev.map(d => d.id === doc.id ? updated : d));
                                        }
                                        savePolicyDocumentToFirestore(updated);
                                      }}
                                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Đường dẫn liên kết / Tải tài liệu</label>
                                    <div className="space-y-2">
                                      {/* Link input */}
                                      <div className="relative">
                                        <input 
                                          type="text" 
                                          value={doc.link}
                                          onChange={(e) => {
                                            const updated = { ...doc, link: e.target.value };
                                            if (setPolicyDocuments) {
                                                setPolicyDocuments(prev => prev.map(d => d.id === doc.id ? updated : d));
                                            }
                                            savePolicyDocumentToFirestore(updated);
                                          }}
                                          placeholder="Nhập link Google Drive hoặc chọn tệp tải lên..."
                                          className="w-full text-xs pl-3 pr-20 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500 font-mono"
                                        />
                                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const updated = { ...doc, link: "https://drive.google.com/drive/folders/1RIIJqdHEW_4S7rVE2fTLK0DSdqz3CCne" };
                                              if (setPolicyDocuments) {
                                                setPolicyDocuments(prev => prev.map(d => d.id === doc.id ? updated : d));
                                              }
                                              savePolicyDocumentToFirestore(updated).then(() => {
                                                showFeedback("Đã chèn liên kết Google Drive mẫu.");
                                              });
                                            }}
                                            className="px-1.5 py-0.5 text-[8px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 rounded border border-slate-200 cursor-pointer"
                                            title="Chèn liên kết Google Drive mẫu"
                                          >
                                            Mẫu Drive
                                          </button>
                                        </div>
                                      </div>

                                      {/* Drive Guideline Box */}
                                      <div className="text-[9px] text-sky-700 bg-sky-50 border border-sky-100 p-2.5 rounded-lg font-sans">
                                        <span className="font-bold block">💡 Cách chia sẻ liên kết Google Drive:</span>
                                        <p className="mt-0.5 font-light leading-normal">
                                          Vào Google Drive &gt; Nhấp chuột phải vào tệp/thư mục &gt; Chọn <strong>Chia sẻ (Share)</strong> &gt; Thay đổi quyền truy cập chung thành <strong>"Bất kỳ ai có liên kết đều xem được" (Anyone with link)</strong> &gt; Sao chép liên kết rồi dán vào ô bên trên.
                                        </p>
                                      </div>

                                      {/* Upload file directly option */}
                                      <div className="flex items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200/60 rounded-lg">
                                        <div className="flex-1 min-w-0 text-left">
                                          {doc.link && doc.link.startsWith("data:") ? (
                                            <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-semibold">
                                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                              <span className="truncate">Đã đính kèm tệp trực tiếp (~{Math.round(doc.link.length * 0.75 / 1024)} KB)</span>
                                            </div>
                                          ) : doc.link && doc.link.includes("drive.google.com") ? (
                                            <div className="flex items-center gap-1 text-[10px] text-sky-600 font-semibold">
                                              <Globe className="w-3.5 h-3.5 shrink-0" />
                                              <span className="truncate">Đường liên kết Google Drive</span>
                                            </div>
                                          ) : doc.link && doc.link !== "#" ? (
                                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                              <Link2 className="w-3.5 h-3.5 shrink-0" />
                                              <span className="truncate">Liên kết ngoài</span>
                                            </div>
                                          ) : (
                                            <span className="text-[10px] text-slate-400">Chưa có tệp đính kèm</span>
                                          )}
                                        </div>

                                        <label className="shrink-0 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition shadow-3xs flex items-center gap-1">
                                          <Download className="w-3 h-3 rotate-180" />
                                          <span>Tải tệp lên</span>
                                          <input 
                                            type="file" 
                                            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg" 
                                            className="hidden" 
                                            onChange={(e) => {
                                              const file = e.target.files?.[0];
                                              if (file) {
                                                if (file.size > 800 * 1024) {
                                                  alert("Kích thước tệp lớn hơn 800KB. Vui lòng nén tệp hoặc tải lên Google Drive của bạn rồi dán liên kết vào ô phía trên để tối ưu hoá dung lượng!");
                                                  return;
                                                }
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                  const updated = { ...doc, link: reader.result as string };
                                                  if (setPolicyDocuments) {
                                                    setPolicyDocuments(prev => prev.map(d => d.id === doc.id ? updated : d));
                                                  }
                                                  savePolicyDocumentToFirestore(updated).then(() => {
                                                    showFeedback("Đã tải lên tệp văn bản thành công.");
                                                  }).catch(() => {
                                                    showFeedback("Lưu tệp thất bại.", true);
                                                  });
                                                };
                                                reader.readAsDataURL(file);
                                              }
                                            }} 
                                          />
                                        </label>
                                      </div>
                                      
                                      {/* Danger warning for large files */}
                                      {doc.link && doc.link.startsWith("data:") && doc.link.length * 0.75 > 600 * 1024 && (
                                        <div className="text-[9px] text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100 flex items-start gap-1">
                                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                          <span>Tệp này có kích thước khá lớn. Nên chuyển sang lưu trên Google Drive và dán liên kết để đảm bảo website tải nhanh nhất.</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Loại văn bản</label>
                                    <select 
                                      value={doc.category}
                                      onChange={(e) => {
                                        const category = e.target.value;
                                        let bg = "bg-slate-50", color = "text-slate-600", border = "border-slate-100";
                                        if (category === "Nghị quyết") { bg = "bg-rose-50"; color = "text-rose-600"; border = "border-rose-100"; }
                                        else if (category === "Nghị định") { bg = "bg-indigo-50"; color = "text-indigo-600"; border = "border-indigo-100"; }
                                        else if (category === "Quyết định") { bg = "bg-emerald-50"; color = "text-emerald-600"; border = "border-emerald-100"; }
                                        else if (category === "Chỉ thị") { bg = "bg-amber-50"; color = "text-amber-600"; border = "border-amber-100"; }

                                        const updated = { ...doc, category, bg, color, border };
                                        if (setPolicyDocuments) {
                                            setPolicyDocuments(prev => prev.map(d => d.id === doc.id ? updated : d));
                                        }
                                        savePolicyDocumentToFirestore(updated);
                                      }}
                                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                                    >
                                      <option value="Nghị quyết">Nghị quyết</option>
                                      <option value="Nghị định">Nghị định</option>
                                      <option value="Quyết định">Quyết định</option>
                                      <option value="Chỉ thị">Chỉ thị</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ngày ban hành</label>
                                    <input 
                                      type="text" 
                                      value={doc.date}
                                      onChange={(e) => {
                                        const updated = { ...doc, date: e.target.value };
                                        if (setPolicyDocuments) {
                                            setPolicyDocuments(prev => prev.map(d => d.id === doc.id ? updated : d));
                                        }
                                        savePolicyDocumentToFirestore(updated);
                                      }}
                                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                                    />
                                  </div>
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Trích yếu nội dung</label>
                                    <textarea 
                                      value={doc.description}
                                      onChange={(e) => {
                                        const updated = { ...doc, description: e.target.value };
                                        if (setPolicyDocuments) {
                                            setPolicyDocuments(prev => prev.map(d => d.id === doc.id ? updated : d));
                                        }
                                        savePolicyDocumentToFirestore(updated);
                                      }}
                                      rows={2}
                                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-sky-500"
                                    />
                                </div>
                              </div>
                              <div className="flex justify-end pt-2 border-t border-slate-50">
                                <button
                                  onClick={() => {
                                    showConfirm("Xóa văn bản", "Bạn có chắc chắn muốn xóa văn bản này?", async () => {
                                      try {
                                        await deletePolicyDocumentFromFirestore(doc.id);
                                        if (setPolicyDocuments) {
                                            setPolicyDocuments(prev => prev.filter(d => d.id !== doc.id));
                                        }
                                        showFeedback("Đã xóa văn bản.");
                                      } catch (err) {
                                        showFeedback("Xóa thất bại.", true);
                                      }
                                    });
                                  }}
                                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                                >
                                  Xóa văn bản
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "events" && (
                    <motion.div
                      key="events"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
                        <div className="mb-6 flex justify-between items-center">
                          <div>
                            <h3 className="text-base font-bold text-slate-800 flex items-center space-x-2">
                              <span className="flex h-2.5 w-2.5 rounded-full bg-sky-500 animate-pulse" />
                              <span>Quản Lý Lịch Sự Kiện</span>
                            </h3>
                            <p className="text-slate-500 text-xs font-light mt-1.5 leading-relaxed">
                              Thêm, sửa, xóa các sự kiện hiển thị trên trang chủ để người dân theo dõi.
                            </p>
                          </div>
                          <button
                            onClick={async () => {
                              const newEvt = {
                                id: Date.now().toString(),
                                title: "Sự kiện mới",
                                date: new Date().toLocaleDateString("vi-VN"),
                                time: "08:00 - 10:00",
                                location: "Trụ sở Ủy ban MTTQ Phường",
                                type: "Họp mặt",
                                description: "Nhập mô tả sự kiện...",
                                color: "bg-slate-500",
                                textColor: "text-blue-700",
                                bgColor: "bg-slate-50", iconName: "Calendar"
                              };
                              if (setEvents) setEvents([...events, newEvt]);
                              await saveEventToFirestore(newEvt);
                            }}
                            className="bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition cursor-pointer"
                          >
                            + Thêm Sự Kiện Mới
                          </button>
                        </div>
                        <div className="space-y-4">
                          {events.length === 0 ? (
                            <p className="text-xs text-slate-500">Chưa có sự kiện nào.</p>
                          ) : (
                            events.map(evt => (
                              <div key={evt.id} className="flex flex-col gap-3 p-4 border border-slate-100 rounded-2xl bg-slate-50 relative">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <input
                                    className="w-full text-sm font-bold text-slate-800 bg-white border border-slate-200 rounded p-2 focus:border-sky-500 outline-none"
                                    defaultValue={evt.title}
                                    onBlur={async (e) => {
                                      const val = e.target.value;
                                      if (setEvents) setEvents(events.map(ev => ev.id === evt.id ? { ...ev, title: val } : ev));
                                      await saveEventToFirestore({ ...evt, title: val });
                                    }}
                                    placeholder="Tên sự kiện"
                                  />
                                  <div className="flex gap-2">
                                    <input
                                      className="w-1/2 text-sm text-slate-800 bg-white border border-slate-200 rounded p-2 focus:border-sky-500 outline-none"
                                      defaultValue={evt.date}
                                      onBlur={async (e) => {
                                        const val = e.target.value;
                                        if (setEvents) setEvents(events.map(ev => ev.id === evt.id ? { ...ev, date: val } : ev));
                                        await saveEventToFirestore({ ...evt, date: val });
                                      }}
                                      placeholder="Ngày (vd: 18/07/2026)"
                                    />
                                    <input
                                      className="w-1/2 text-sm text-slate-800 bg-white border border-slate-200 rounded p-2 focus:border-sky-500 outline-none"
                                      defaultValue={evt.time}
                                      onBlur={async (e) => {
                                        const val = e.target.value;
                                        if (setEvents) setEvents(events.map(ev => ev.id === evt.id ? { ...ev, time: val } : ev));
                                        await saveEventToFirestore({ ...evt, time: val });
                                      }}
                                      placeholder="Thời gian (vd: 07:00 - 11:00)"
                                    />
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <input
                                    className="w-full text-sm text-slate-800 bg-white border border-slate-200 rounded p-2 focus:border-sky-500 outline-none"
                                    defaultValue={evt.location}
                                    onBlur={async (e) => {
                                      const val = e.target.value;
                                      if (setEvents) setEvents(events.map(ev => ev.id === evt.id ? { ...ev, location: val } : ev));
                                      await saveEventToFirestore({ ...evt, location: val });
                                    }}
                                    placeholder="Địa điểm"
                                  />
                                  <input
                                    className="w-full text-sm text-slate-800 bg-white border border-slate-200 rounded p-2 focus:border-sky-500 outline-none"
                                    onBlur={async (e) => {
                                      const val = e.target.value;
                                      if (setEvents) setEvents(events.map(ev => ev.id === evt.id ? { ...ev, type: val } : ev));
                                    }}
                                    placeholder="Loại sự kiện (vd: Ra quân, Kỷ niệm)"
                                  />
                                </div>
                                <textarea
                                  className="w-full text-xs text-slate-500 bg-white border border-slate-200 rounded p-2 focus:border-sky-500 outline-none h-16"
                                  defaultValue={evt.description}
                                  onBlur={async (e) => {
                                    const val = e.target.value;
                                    if (setEvents) setEvents(events.map(ev => ev.id === evt.id ? { ...ev, description: val } : ev));
                                    await saveEventToFirestore({ ...evt, description: val });
                                  }}
                                  placeholder="Mô tả sự kiện..."
                                />
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={async () => {
                                      showConfirm("Xóa sự kiện", "Bạn có chắc chắn muốn xóa sự kiện này không? Hành động này không thể hoàn tác.", async () => {
                                        if (setEvents) setEvents(events.filter(ev => ev.id !== evt.id));
                                        await deleteEventFromFirestore(evt.id);
                                      });
                                    }}
                                    className="text-xs text-blue-700 hover:text-red-700 font-bold uppercase cursor-pointer"
                                  >
                                    Xóa
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "analytics" && (
                    <motion.div
                      key="analytics"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      {/* REPORT EXPORT TOOLBAR */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-center gap-4">
                        <div className="text-left">
                          <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Xuất Báo Cáo Tình Hình An Sinh Xã Hội</h4>
                          <p className="text-xs text-slate-500 mt-1">Chọn khung thời gian để tải về báo cáo dưới định dạng PDF hoặc CSV.</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <select 
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs rounded-xl px-3 py-2.5 outline-none focus:border-sky-500 font-medium"
                            value={exportTimeframe}
                            onChange={(e) => setExportTimeframe(e.target.value as "week" | "month" | "quarter")}
                            disabled={isExportingPDF}
                          >
                            <option value="week">7 Ngày Qua</option>
                            <option value="month">Tháng Này</option>
                            <option value="quarter">Quý Này</option>
                          </select>
                          <button onClick={handleExportAnalyticsPDF} disabled={isExportingPDF} className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50">
                            <Download className="w-4 h-4" />
                            {isExportingPDF ? "Đang xuất..." : "Xuất PDF"}
                          </button>
                          <button onClick={handleExportAnalyticsCSV} disabled={isExportingPDF} className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50">
                            <Download className="w-4 h-4" />
                            Xuất CSV
                          </button>
                        </div>
                      </div>

                      <div id="analytics-report-view" className="space-y-6 p-4 -m-4 bg-transparent rounded-xl">
                        {isExportingPDF && (
                          <div className="text-center pb-4 mb-4 border-b border-slate-200">
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-wide">Báo Cáo Thống Kê An Sinh Xã Hội</h2>
                            <p className="text-sm text-slate-500 mt-1 font-medium">UBND Phường Phú Lợi, Thành phố Hồ Chí Minh</p>
                            <p className="text-xs text-slate-400 mt-2">Kỳ báo cáo: {exportTimeframe === "week" ? "7 Ngày Qua" : (exportTimeframe === "month" ? "Tháng Này" : "Quý Này")}</p>
                          </div>
                        )}
                        {/* STATS OVERVIEW CARDS */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left">
                          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Tổng số hồ sơ tiếp nhận</span>
                          <div className="text-2xl font-black text-slate-800 mt-1">{requestsList.length}</div>
                          <span className="text-[10px] text-sky-600 font-semibold mt-1 block">Tất cả danh mục hỗ trợ</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left">
                          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Đã hoàn thành xử lý</span>
                          <div className="text-2xl font-black text-emerald-600 mt-1">
                            {requestsList.filter(r => r.status === "COMPLETED").length}
                          </div>
                          <span className="text-[10px] text-emerald-600/80 font-semibold mt-1 block">Tỷ lệ: {requestsList.length > 0 ? Math.round((requestsList.filter(r => r.status === "COMPLETED").length / requestsList.length) * 100) : 0}% thành công</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left">
                          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Quỹ vận động an sinh</span>
                          <div className="text-2xl font-black text-slate-800 mt-1">
                            {campaignsList.reduce((acc, c) => acc + c.currentAmount, 0).toLocaleString("vi-VN")}đ
                          </div>
                          <span className="text-[10px] text-amber-600 font-semibold mt-1 block">Từ {campaignsList.length} chiến dịch quyên góp</span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-left">
                          <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Nhật ký hệ thống</span>
                          <div className="text-2xl font-black text-slate-800 mt-1">{activityLogs.length}</div>
                          <span className="text-[10px] text-slate-500 font-semibold mt-1 block">Lịch sử tác vụ của quản trị viên</span>
                        </div>
                      </div>

                      {/* DATA VISUALIZATIONS */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* CHART 1: Submission Trend over Time */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs text-left">
                          <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-4">Biểu đồ xu hướng nộp hồ sơ (7 ngày qua)</h4>
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={requestsOverTimeData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                                <Tooltip />
                                <Area type="monotone" dataKey="Hồ sơ đã nộp" stroke="#0ea5e9" strokeWidth={2.5}  fill="url(#colorRequests)" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* CHART 2: Requests by Category */}
                        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs text-left">
                          <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-4">Phân bổ nhu cầu hỗ trợ an sinh của người dân</h4>
                          <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={requestsByCategoryData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                                <Tooltip />
                                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={25} name="Số hồ sơ" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      {/* CHART: Monthly Dossier Volume (Received vs Resolved) - Requested by User */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs text-left space-y-4">
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-800 flex items-center space-x-2">
                            <FileText className="w-4.5 h-4.5 text-sky-500 animate-pulse" />
                            <span>Biểu Đồ Thống Kê Tiếp Nhận & Giải Quyết Hồ Sơ Theo Từng Tháng</span>
                          </h4>
                          <p className="text-slate-400 text-[10px] font-light mt-1">
                            Tổng hợp trực quan lưu lượng hồ sơ cứu trợ được tiếp nhận gửi lên và tỷ lệ hoàn thành giải quyết số hoá theo chu kỳ 12 tháng trong năm.
                          </p>
                        </div>

                        <div className="h-72 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={requestsMonthlyData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                              <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                              <YAxis stroke="#64748b" fontSize={10} tickLine={false} allowDecimals={false} />
                              <Tooltip wrapperStyle={{ fontSize: 11, fontFamily: 'sans-serif' }} />
                              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11, fontWeight: '600' }} />
                              <Line 
                                type="monotone" 
                                dataKey="Tiếp nhận" 
                                stroke="#0ea5e9" 
                                strokeWidth={2.5} 
                                 
                                dot={{ r: 4, fill: "#0ea5e9", strokeWidth: 2, stroke: "#ffffff" }} activeDot={{ r: 6 }} 
                                name="Hồ sơ tiếp nhận"
                              />
                              <Line 
                                type="monotone" 
                                dataKey="Đã giải quyết" 
                                stroke="#10b981" 
                                strokeWidth={2.5} 
                                 
                                dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#ffffff" }} activeDot={{ r: 6 }} 
                                name="Hồ sơ đã giải quyết"
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* CHART 3: Campaign funding progression */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs text-left">
                        <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-4">Tình hình đóng góp thực tế các chiến dịch an sinh</h4>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={campaignsProgressData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                              <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                              <Tooltip formatter={(value) => `${Number(value).toLocaleString("vi-VN")} VND`} />
                              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 10 }} />
                              <Bar dataKey="Đã đóng góp" fill="#10b981" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="Mục tiêu" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* LEADERBOARD: TOP 10 DIGITAL VOLUNTEERS */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs text-left space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-800 flex items-center space-x-2">
                              <Trophy className="w-4.5 h-4.5 text-amber-500 animate-bounce" />
                              <span>Bảng Xếp Hạng Chiến Sĩ An Sinh Số</span>
                            </h4>
                            <p className="text-slate-400 text-[10px] font-light mt-1">
                              Vinh danh 10 tình nguyện viên và người dân Phú Lợi tích cực đóng góp trực tuyến & tham gia hỗ trợ cộng đồng nhiều nhất.
                            </p>
                          </div>
                          
                          <div className="bg-amber-50 border border-amber-200/55 rounded-full px-3 py-1 flex items-center gap-1.5 self-start sm:self-center">
                            <Award className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <span className="text-[10px] font-black uppercase text-amber-700 tracking-wider">Cập Nhật Trực Tuyến</span>
                          </div>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/50">
                          <table className="w-full text-left text-sm block md:table">
                            <thead className="hidden md:table-header-group bg-slate-50 text-xs font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                              <tr>
                                <th className="px-4 py-3 w-16 text-center">Thứ Hạng</th>
                                <th className="px-4 py-3">Họ và Tên Tình Nguyện Viên</th>
                                <th className="px-4 py-3">Khu phố</th>
                                <th className="px-4 py-3 text-center w-28">Số Huy Hiệu</th>
                                <th className="px-4 py-3 text-right">Trạng thái vai trò</th>
                              </tr>
                            </thead>
                            <tbody className="block md:table-row-group divide-y divide-slate-100 md:divide-y-0 space-y-2 md:space-y-0 p-2 md:p-0 text-sm">
                              {leaderboardData.map((user, index) => {
                                const isTop3 = index < 3;
                                const rankIcon = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : null;
                                
                                return (
                                  <tr
                                    key={user.uid}
                                    className={`block md:table-row bg-white rounded-xl border border-slate-100 md:border-none p-3 md:p-0 shadow-sm md:shadow-none hover:bg-slate-50/80 transition-colors ${
                                      index === 0 ? "bg-amber-500/5 font-semibold" : ""
                                    }`}
                                  >
                                    {/* Rank column */}
                                    <td className="px-0 py-1.5 md:px-4 md:py-3 block md:table-cell flex items-center justify-between md:text-center font-bold border-b border-slate-50 md:border-none">
                                      <div className="md:hidden text-[10px] font-bold uppercase text-slate-400">Thứ Hạng</div>
                                      {isTop3 ? (
                                        <span className="text-base select-none" title={`Top ${index + 1}`}>{rankIcon}</span>
                                      ) : (
                                        <span className="text-slate-400 font-mono">#{index + 1}</span>
                                      )}
                                    </td>

                                    {/* Name and Badges Column */}
                                    <td className="px-0 py-2 md:px-4 md:py-3 block md:table-cell border-b border-slate-50 md:border-none">
                                      <div className="md:hidden text-[10px] font-bold uppercase text-slate-400 mb-1">Tình Nguyện Viên</div>
                                      <div className="flex flex-col sm:flex-row sm:items-center">
                                        <span className="font-extrabold text-slate-800 text-sm tracking-tight">
                                          {user.fullName || "Người dùng ẩn danh"}
                                        </span>
                                        {/* Render badges next to user name */}
                                        <div className="flex flex-wrap items-center gap-1 mt-1 sm:mt-0 sm:ml-2">
                                          {user.systemBadges && user.systemBadges.map((ub) => {
                                            const badgeDetail = systemBadges.find(sb => sb.id === ub.badgeId);
                                            if (!badgeDetail) return null;
                                            return (
                                              <span
                                                key={`sys-${ub.badgeId}`}
                                                className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-amber-200/50 bg-white text-sm shadow-3xs cursor-help select-none"
                                                title={`${badgeDetail.name} - ${ub.level} sao`}
                                              >
                                                {badgeDetail.icon}
                                              </span>
                                            );
                                          })}
                                          {user.badges && user.badges.map((badgeId, bIdx) => {
                                            let icon = "🎖️";
                                            let tooltip = "Huy hiệu";
                                            if (badgeId === "tier-gold") {
                                              icon = "🥇"; tooltip = "Hạng Vàng";
                                            } else if (badgeId === "tier-silver") {
                                              icon = "🥈"; tooltip = "Hạng Bạc";
                                            } else if (badgeId === "tier-bronze") {
                                              icon = "🥉"; tooltip = "Hạng Đồng";
                                            } else if (badgeId === "badge-visits") {
                                              icon = "🔥"; tooltip = "Tiên Phong Số";
                                            } else if (badgeId === "badge-news") {
                                              icon = "📰"; tooltip = "Sứ Giả Tin Tức";
                                            } else if (badgeId === "badge-events") {
                                              icon = "💖"; tooltip = "Trái Tim Hồng";
                                            } else if (badgeId === "badge-volunteer") {
                                              icon = "🎖️"; tooltip = "Chiến Sĩ Tình Nguyện";
                                            }
                                            return (
                                              <span 
                                                key={bIdx} 
                                                className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-slate-200/70 bg-white text-sm shadow-3xs cursor-help select-none"
                                                title={tooltip}
                                              >
                                                {icon}
                                              </span>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </td>

                                    {/* Quarter Column */}
                                    <td className="px-4 py-3 text-slate-500 font-medium">
                                      {getQuarterName(user.quarter) || "Toàn Phường"}
                                    </td>

                                    {/* Badges count badge */}
                                    <td className="px-4 py-3 text-center">
                                      <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-full font-black font-mono text-xs ${
                                        user.badgesCount >= 5 
                                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200/50" 
                                          : user.badgesCount >= 3 
                                            ? "bg-sky-100 text-sky-800 border border-sky-200/50"
                                            : user.badgesCount > 0 
                                              ? "bg-slate-150 text-slate-700 border border-slate-200"
                                              : "bg-slate-100 text-slate-400"
                                      }`}>
                                        {user.badgesCount} Huy Hiệu
                                      </span>
                                    </td>

                                    {/* Role Status Column */}
                                    <td className="px-0 py-1.5 md:px-4 md:py-3 block md:table-cell flex items-center justify-between md:text-right">
                                      <div className="md:hidden text-[10px] font-bold uppercase text-slate-400">Trạng thái</div>
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${
                                        user.isAdmin 
                                          ? "bg-rose-50 text-rose-700 border-rose-200" 
                                          : user.isOfficer 
                                            ? "bg-indigo-50 text-indigo-700 border-indigo-200" 
                                            : user.isVolunteer 
                                              ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                                              : "bg-slate-100 text-slate-500 border-slate-200"
                                      }`}>
                                        {user.isAdmin 
                                          ? "Quản trị viên" 
                                          : user.isOfficer 
                                            ? "Cán bộ địa bàn" 
                                            : user.isVolunteer 
                                              ? "Tình nguyện viên" 
                                              : "Công dân Phú Lợi"}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* ACTIVITY LOG TERMINAL / TABLE */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs text-left space-y-4">
                        <div className="flex flex-wrap justify-between items-center gap-4 border-b border-slate-100 pb-3">
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-800 flex items-center space-x-2">
                              <Activity className="w-4.5 h-4.5 text-slate-500" />
                              <span>Nhật Ký Tác Vụ Quản Trị Hệ Thống</span>
                            </h4>
                            <p className="text-slate-400 text-[10px] font-light mt-1">Ghi nhận toàn bộ thao tác thêm mới, thay đổi trạng thái và chỉnh sửa cấu hình dịch vụ.</p>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 text-xs">
                            <input
                              type="text"
                              onChange={(e) => setLogSearchQuery(e.target.value)}
                              placeholder="Tìm kiếm tác vụ..."
                              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-600 focus:border-slate-400 outline-none placeholder-slate-400 text-[11px]"
                            />
                            <select
                              value={logCategoryFilter}
                              onChange={(e) => setLogCategoryFilter(e.target.value)}
                              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-500 font-medium text-[11px]"
                            >
                              <option value="ALL">Tất cả danh mục</option>
                              <option value="Cơ cấu nhân sự">Cơ cấu nhân sự</option>
                              <option value="Cấu hình hệ thống">Cấu hình hệ thống</option>
                              <option value="Chiến dịch quyên góp">Chiến dịch quyên góp</option>
                              <option value="Việc làm Phú Lợi">Việc làm Phú Lợi</option>
                              <option value="Xử lý hồ sơ an sinh">Xử lý hồ sơ an sinh</option>
                              <option value="Xử lý hồ sơ hàng loạt">Xử lý hồ sơ hàng loạt</option>
                              <option value="Xuất dữ liệu">Xuất dữ liệu</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => {
                                setActivityLogs([]);
                                localStorage.removeItem("phuloi_admin_activity_logs");
                                showFeedback("🧹 Đã làm sạch nhật ký tác vụ thành công!");
                              }}
                              className="text-[10px] font-bold text-rose-600 hover:text-rose-700 uppercase tracking-wider px-2 py-1 bg-rose-50 hover:bg-rose-100 rounded-lg transition"
                            >
                              Làm sạch nhật ký
                            </button>
                          </div>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/50">
                          <table className="w-full text-left text-sm block md:table">
                            <thead className="hidden md:table-header-group bg-slate-50 text-xs font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                              <tr>
                                <th className="px-4 py-3">Thời gian</th>
                                <th className="px-4 py-3">Quản trị viên</th>
                                <th className="px-4 py-3">Danh mục</th>
                                <th className="px-4 py-3">Nội dung tác vụ</th>
                                <th className="px-4 py-3 text-right">Trạng thái</th>
                              </tr>
                            </thead>
                            <tbody className="block md:table-row-group divide-y divide-slate-100 md:divide-y-0 space-y-2 md:space-y-0 p-2 md:p-0 text-sm">
                              {filteredLogs.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                                    Chưa ghi nhận tác vụ nào phù hợp với bộ lọc.
                                  </td>
                                </tr>
                              ) : (
                                filteredLogs.slice().reverse().map((log) => (
                                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors block md:table-row bg-white rounded-xl border border-slate-100 md:border-none p-3 md:p-0 shadow-sm md:shadow-none">
                                    <td className="px-0 py-1 md:px-4 md:py-3 block md:table-cell flex items-center justify-between font-mono text-xs text-slate-400 border-b border-slate-50 md:border-none">
                                      <div className="md:hidden text-[10px] font-bold uppercase text-slate-400">Thời gian</div>
                                      {new Date(log.timestamp).toLocaleTimeString("vi-VN")} - {new Date(log.timestamp).toLocaleDateString("vi-VN")}
                                    </td>
                                    <td className="px-0 py-1 md:px-4 md:py-3 block md:table-cell flex items-center justify-between font-semibold text-slate-700 border-b border-slate-50 md:border-none">
                                      <div className="md:hidden text-[10px] font-bold uppercase text-slate-400">Quản trị viên</div>
                                      {log.admin}</td>
                                    <td className="px-0 py-1 md:px-4 md:py-3 block md:table-cell flex items-center justify-between border-b border-slate-50 md:border-none">
                                      <div className="md:hidden text-[10px] font-bold uppercase text-slate-400">Danh mục</div>
                                      <span className="inline-block px-2 py-0.5 bg-slate-200 text-slate-600 text-xs font-black rounded border border-slate-300/40">
                                        {log.category}
                                      </span>
                                    </td>
                                    <td className="px-0 py-2 md:px-4 md:py-3 block md:table-cell border-b border-slate-50 md:border-none text-slate-600 font-medium">
                                      <div className="md:hidden text-[10px] font-bold uppercase text-slate-400 mb-1">Nội dung tác vụ</div>
                                      {log.details}</td>
                                    <td className="px-0 py-1.5 md:px-4 md:py-3 block md:table-cell flex items-center justify-between md:text-right">
                                      <div className="md:hidden text-[10px] font-bold uppercase text-slate-400">Trạng thái</div>
                                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                        log.status === "success" ? "bg-emerald-100 text-emerald-800" :
                                        log.status === "error" ? "bg-rose-100 text-rose-800" :
                                        "bg-sky-100 text-sky-800"
                                      }`}>
                                        ● {log.status === "success" ? "Thành công" : log.status === "error" ? "Thất bại" : "Thông tin"}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* TRAFFIC MONITORING AND ACCESS STATS DASHBOARD */}
                      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs text-left space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-800 flex items-center space-x-2">
                              <Globe className="w-5 h-5 text-sky-500 animate-spin-slow" />
                              <span>Thống Kê Truy Cập & Giám Sát Traffic Thời Gian Thực</span>
                            </h4>
                            <p className="text-slate-400 text-[10px] font-light mt-1">
                              Hệ thống định vị IP, phân tích hệ điều hành thiết bị, hoạt động của khách vãng lai và công dân đăng nhập tại địa bàn Phường Phú Lợi, Thành phố Hồ Chí Minh.
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Giám sát trực tiếp:</span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsMonitoringTraffic(!isMonitoringTraffic);
                                showFeedback(isMonitoringTraffic ? "⏸️ Đã tạm dừng cập nhật traffic trực tiếp." : "⚡ Đã kích hoạt giám sát traffic thời gian thực!");
                              }}
                              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                isMonitoringTraffic ? "bg-sky-500" : "bg-slate-200"
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                  isMonitoringTraffic ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                            <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                              isMonitoringTraffic 
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                                : "bg-slate-100 text-slate-400 border-slate-200"
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${isMonitoringTraffic ? "animate-ping" : ""}`} />
                              {isMonitoringTraffic ? "LIVE" : "PAUSED"}
                            </span>
                          </div>
                        </div>

                        {/* KEY METRICS CARDS */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-gradient-to-br from-sky-50 to-blue-50/35 border border-sky-100 rounded-2xl p-4 text-left">
                            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5 text-sky-500" /> Total Hits (Lượt xem)
                            </span>
                            <div className="text-2xl font-black text-slate-800 mt-1">
                              {trafficMetrics.total.toLocaleString("vi-VN")}
                            </div>
                            <span className="text-[10px] text-sky-600 font-semibold mt-1 block">Tích luỹ từ lịch sử hệ thống</span>
                          </div>

                          <div className="bg-gradient-to-br from-amber-50 to-yellow-50/35 border border-amber-100 rounded-2xl p-4 text-left">
                            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                              <Users className="w-3.5 h-3.5 text-amber-500" /> Khách vãng lai (Guest)
                            </span>
                            <div className="text-2xl font-black text-amber-600 mt-1">
                              {trafficMetrics.guests.toLocaleString("vi-VN")}
                            </div>
                            <span className="text-[10px] text-amber-600/80 font-semibold mt-1 block">
                              Chiếm: {trafficMetrics.total > 0 ? Math.round((trafficMetrics.guests / trafficMetrics.total) * 100) : 0}% lượng truy cập
                            </span>
                          </div>

                          <div className="bg-gradient-to-br from-indigo-50 to-violet-50/35 border border-indigo-100 rounded-2xl p-4 text-left">
                            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" /> Thành viên (Members)
                            </span>
                            <div className="text-2xl font-black text-indigo-600 mt-1">
                              {trafficMetrics.members.toLocaleString("vi-VN")}
                            </div>
                            <span className="text-[10px] text-indigo-600/80 font-semibold mt-1 block">
                              Chiếm: {trafficMetrics.total > 0 ? Math.round((trafficMetrics.members / trafficMetrics.total) * 100) : 0}% cán bộ & công dân
                            </span>
                          </div>

                          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/35 border border-emerald-100 rounded-2xl p-4 text-left">
                            <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1">
                              <Activity className="w-3.5 h-3.5 text-emerald-500" /> Tần Suất Traffic
                            </span>
                            <div className="text-2xl font-black text-emerald-600 mt-1">
                              ~2.8 <span className="text-xs font-medium text-slate-400">giây/hit</span>
                            </div>
                            <span className="text-[10px] text-emerald-600/80 font-semibold mt-1 block flex items-center gap-1">
                              {isMonitoringTraffic ? "Đang nhận gói tin IP liên tục..." : "Tạm dừng lắng nghe..."}
                            </span>
                          </div>
                        </div>

                        {/* DATA BREAKDOWN GRAPHS */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* OS DISTRIBUTION CHART */}
                          <div className="bg-slate-50/65 border border-slate-200/70 rounded-3xl p-5 text-left">
                            <h5 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                              <Settings className="w-4 h-4 text-slate-500" />
                              Phân Phối Hệ Điều Hành & Thiết Bị Truy Cập
                            </h5>
                            <div className="h-56 w-full flex flex-col sm:flex-row items-center justify-between gap-2">
                              <div className="h-full w-full sm:w-1/2">
                                <ResponsiveContainer width="100%" height="100%">
                                  <PieChart>
                                    <Pie
                                      data={trafficMetrics.osChartData}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={45}
                                      outerRadius={70}
                                      paddingAngle={3}
                                      dataKey="value"
                                    >
                                      {trafficMetrics.osChartData.map((entry, index) => {
                                        const colors = ["#0ea5e9", "#6366f1", "#10b981", "#f59e0b", "#64748b", "#ec4899"];
                                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                      })}
                                    </Pie>
                                    <Tooltip formatter={(value) => [`${value} lượt`, 'Thiết bị']} />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                              <div className="w-full sm:w-1/2 space-y-2 text-xs">
                                {trafficMetrics.osChartData.map((item, idx) => {
                                  const colors = ["bg-sky-500", "bg-indigo-500", "bg-emerald-500", "bg-amber-500", "bg-slate-500", "bg-pink-500"];
                                  const pct = trafficMetrics.total > 0 ? Math.round((item.value / trafficMetrics.total) * 100) : 0;
                                  return (
                                    <div key={idx} className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className={`w-2.5 h-2.5 rounded-full ${colors[idx % colors.length]}`} />
                                        <span className="font-medium text-slate-600">{item.name}</span>
                                      </div>
                                      <span className="font-bold text-slate-700 font-mono">{item.value} ({pct}%)</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          {/* PAGE POPULARITY CHART */}
                          <div className="bg-slate-50/65 border border-slate-200/70 rounded-3xl p-5 text-left">
                            <h5 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-slate-500" />
                              Lưu Lượng Hoạt Động Theo Từng Chuyên Mục
                            </h5>
                            <div className="h-56 w-full">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={trafficMetrics.pageChartData.slice(0, 5)} layout="vertical">
                                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                                  <XAxis type="number" stroke="#94a3b8" fontSize={9} tickLine={false} />
                                  <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={100} tickLine={false} />
                                  <Tooltip />
                                  <Bar dataKey="value" fill="#0ea5e9" radius={[0, 4, 4, 0]} barSize={16} name="Số lượt tương tác" />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>

                        {/* ADVANCED CONTROLS */}
                        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
                          <div className="flex flex-wrap items-center gap-3 flex-1">
                            <div className="relative flex-1 min-w-[180px] max-w-xs">
                              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                              <input
                                type="text"
                                value={accessSearchQuery}
                                onChange={(e) => setAccessSearchQuery(e.target.value)}
                                placeholder="Tìm IP, Họ tên, Email, Chuyên mục..."
                                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-700 focus:border-sky-500 outline-none placeholder-slate-400 font-medium transition-colors"
                              />
                            </div>

                            <select
                              value={accessTypeFilter}
                              onChange={(e) => setAccessTypeFilter(e.target.value)}
                              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 font-bold outline-none focus:border-sky-500"
                            >
                              <option value="ALL">Tất cả thành phần</option>
                              <option value="Khách vãng lai">Khách vãng lai</option>
                              <option value="Công dân">Công dân Phú Lợi</option>
                              <option value="Tình nguyện viên">Tình nguyện viên</option>
                              <option value="Cán bộ">Cán bộ địa bàn</option>
                              <option value="Quản trị viên">Quản trị viên</option>
                            </select>

                            <select
                              value={accessOSFilter}
                              onChange={(e) => setAccessOSFilter(e.target.value)}
                              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 font-bold outline-none focus:border-sky-500"
                            >
                              <option value="ALL">Tất cả thiết bị</option>
                              <option value="Windows">Windows</option>
                              <option value="macOS">macOS</option>
                              <option value="iOS">iOS (iPhone)</option>
                              <option value="Android">Android</option>
                              <option value="Linux">Linux</option>
                            </select>
                          </div>

                          <div className="flex items-center gap-2 self-end md:self-auto">
                            <button
                              type="button"
                              onClick={() => {
                                setAccessLogs([]);
                                localStorage.removeItem("phuloi_visitor_access_logs");
                                showFeedback("🧹 Đã làm sạch toàn bộ nhật ký truy cập!");
                              }}
                              className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Làm Sạch Logs
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (accessLogs.length === 0) {
                                  showFeedback("⚠️ Không có nhật ký để xuất báo cáo.");
                                  return;
                                }
                                const headers = ["ID", "Địa chỉ IP", "Thời gian", "Thành phần", "Họ tên", "Email", "Thiết bị", "Trình duyệt", "Chuyên mục", "Hành động", "Vị trí địa lý"];
                                const rows = accessLogs.map(l => [
                                  l.id,
                                  l.ip,
                                  l.timestamp,
                                  l.userType,
                                  l.fullName || "",
                                  l.userEmail || "",
                                  l.device,
                                  l.browser,
                                  l.page,
                                  l.action,
                                  l.location
                                ]);
                                const csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
                                const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement("a");
                                link.setAttribute("href", url);
                                link.setAttribute("download", `phuloi_access_report_${new Date().toISOString().slice(0,10)}.csv`);
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                                showFeedback("📊 Xuất báo cáo CSV nhật ký truy cập thành công!");
                              }}
                              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Xuất CSV Logs
                            </button>
                          </div>
                        </div>

                        {/* ACCESS LOGS TABLE LIST */}
                        <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50/50">
                          <table className="w-full text-left text-sm block md:table">
                            <thead className="hidden md:table-header-group bg-slate-50 text-xs font-extrabold uppercase tracking-widest text-slate-400 border-b border-slate-100">
                              <tr>
                                <th className="px-4 py-3 w-28">Thời gian</th>
                                <th className="px-4 py-3 w-36">Địa chỉ IP</th>
                                <th className="px-4 py-3">Thành phần truy cập</th>
                                <th className="px-4 py-3 w-40">Hệ điều hành / Trình duyệt</th>
                                <th className="px-4 py-3">Chuyên mục / Hành động</th>
                                <th className="px-4 py-3 text-right">Địa chỉ / Vị trí</th>
                              </tr>
                            </thead>
                            <tbody className="block md:table-row-group divide-y divide-slate-100 md:divide-y-0 space-y-2 md:space-y-0 p-2 md:p-0 text-xs font-medium">
                              {filteredAccessLogs.length === 0 ? (
                                <tr>
                                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400 font-medium">
                                    Không tìm thấy nhật ký truy cập nào trùng khớp với bộ lọc.
                                  </td>
                                </tr>
                              ) : (
                                [...filteredAccessLogs].reverse().slice(0, 15).map((log, idx) => {
                                  const isLiveFresh = log.id.includes("live") && idx === 0 && isMonitoringTraffic;
                                  return (
                                    <tr 
                                      key={log.id} 
                                      className={`hover:bg-slate-50/80 transition-all duration-700 block md:table-row bg-white rounded-xl border border-slate-100 md:border-none p-3 md:p-0 shadow-sm md:shadow-none ${
                                        isLiveFresh ? "animate-pulse bg-sky-500/10 border-sky-300" : ""
                                      }`}
                                    >
                                      {/* Timestamp */}
                                      <td className="px-0 py-1 md:px-4 md:py-3 block md:table-cell flex items-center justify-between font-mono text-[10px] text-slate-400 border-b border-slate-50 md:border-none">
                                        <div className="md:hidden text-[10px] font-bold uppercase text-slate-400">Thời gian</div>
                                        {new Date(log.timestamp).toLocaleTimeString("vi-VN")} - {new Date(log.timestamp).toLocaleDateString("vi-VN")}
                                      </td>

                                      {/* IP Address */}
                                      <td className="px-0 py-1 md:px-4 md:py-3 block md:table-cell flex items-center justify-between font-mono text-[11px] text-slate-700 font-bold border-b border-slate-50 md:border-none">
                                        <div className="md:hidden text-[10px] font-bold uppercase text-slate-400">Địa chỉ IP</div>
                                        <span className="flex items-center gap-1.5">
                                          <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                                          {log.ip}
                                        </span>
                                      </td>

                                      {/* Member Type & Info */}
                                      <td className="px-0 py-1.5 md:px-4 md:py-3 block md:table-cell flex flex-col md:flex-row md:items-center gap-1 md:gap-2 border-b border-slate-50 md:border-none">
                                        <div className="md:hidden text-[10px] font-bold uppercase text-slate-400 mb-1">Thành phần</div>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-extrabold uppercase border self-start ${
                                          log.userType === "Quản trị viên" ? "bg-rose-50 text-rose-600 border-rose-200" :
                                          log.userType === "Cán bộ" ? "bg-indigo-50 text-indigo-600 border-indigo-200" :
                                          log.userType === "Tình nguyện viên" ? "bg-emerald-50 text-emerald-600 border-emerald-200" :
                                          log.userType === "Khách vãng lai" ? "bg-slate-100 text-slate-500 border-slate-200" :
                                          "bg-sky-50 text-sky-600 border-sky-200"
                                        }`}>
                                          {log.userType}
                                        </span>
                                        {log.fullName && (
                                          <div className="text-slate-800">
                                            <span className="font-extrabold">{log.fullName}</span>
                                            {log.userEmail && <span className="block text-[10px] text-slate-400 font-light">{log.userEmail}</span>}
                                          </div>
                                        )}
                                      </td>

                                      {/* OS / Browser */}
                                      <td className="px-0 py-1 md:px-4 md:py-3 block md:table-cell flex items-center justify-between text-slate-600 border-b border-slate-50 md:border-none text-[11px]">
                                        <div className="md:hidden text-[10px] font-bold uppercase text-slate-400">Thiết bị</div>
                                        <span>{log.device} • <span className="font-semibold text-slate-500">{log.browser}</span></span>
                                      </td>

                                      {/* Category / Action */}
                                      <td className="px-0 py-2 md:px-4 md:py-3 block md:table-cell border-b border-slate-50 md:border-none">
                                        <div className="md:hidden text-[10px] font-bold uppercase text-slate-400 mb-1">Hành động</div>
                                        <div className="flex flex-col">
                                          <span className="text-slate-800 font-bold">{log.page}</span>
                                          <span className="text-[10px] text-slate-500 font-normal">{log.action}</span>
                                        </div>
                                      </td>

                                      {/* Location */}
                                      <td className="px-0 py-1 md:px-4 md:py-3 block md:table-cell flex items-center justify-between md:text-right text-[11px] text-slate-500">
                                        <div className="md:hidden text-[10px] font-bold uppercase text-slate-400">Vị trí</div>
                                        <span className="font-semibold text-slate-700 flex items-center gap-1 justify-end">
                                          <MapPin className="w-3 h-3 text-red-400" />
                                          {log.location}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })
                              )}
                            </tbody>
                          </table>
                        </div>

                        {filteredAccessLogs.length > 15 && (
                          <div className="text-center text-[10px] text-slate-400 font-light pt-2">
                            * Hiển thị tối đa 15 truy cập gần đây nhất. Tải file CSV để xem tất cả ({filteredAccessLogs.length}) lượt traffic.
                          </div>
                        )}
                      </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "brain" && (
                    <motion.div
                      key="brain"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-5 gap-4">
                        <div>
                          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <span className="text-amber-500">🧠</span> Bộ Não Trợ Lý Ảo (Google Drive Context)
                          </h2>
                          <p className="text-xs text-slate-500 mt-1">
                            Kết nối trợ lý ảo của người dân với dữ liệu thực tế từ thư mục Google Drive của Ủy ban.
                          </p>
                        </div>
                        <a 
                          href="https://drive.google.com/drive/folders/1RIIJqdHEW_4S7rVE2fTLK0DSdqz3CCne" 
                          target="_blank" 
                          rel="noreferrer" 
                          className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:underline bg-sky-50 px-3 py-2 rounded-xl"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          Mở Thư Mục Drive Của Tôi
                        </a>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Cấu hình kết nối */}
                        <div className="lg:col-span-1 bg-slate-50 border border-slate-200/60 rounded-3xl p-5 space-y-4 text-left">
                          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <Settings className="w-4 h-4 text-slate-500" /> Cấu hình Kết nối
                          </h3>
                          
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mã thư mục (Folder ID)</label>
                            <input 
                              type="text" 
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
                              value={syncFolderId}
                              onChange={(e) => setSyncFolderId(e.target.value)}
                            />
                            <span className="text-[9px] text-slate-400 block leading-tight">Mã định danh nằm ở cuối liên kết URL thư mục Google Drive của bạn.</span>
                          </div>

                          <div className="pt-2 border-t border-slate-200/60 space-y-3">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 block">⚡ Phương thức 1: Đăng nhập Google</span>
                            <button
                              onClick={handleGoogleSignInAndSync}
                              disabled={syncing}
                              className="w-full bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                            >
                              {syncing ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  Đang đồng bộ...
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3.5 h-3.5 animate-pulse" />
                                  Xác thực & Đồng bộ
                                </>
                              )}
                            </button>
                            <span className="text-[9px] text-slate-400 block leading-tight">Yêu cầu quyền truy cập đọc các tệp tin trong thư mục Drive để chuyển thành trí thông minh của AI.</span>
                          </div>

                          <div className="pt-2 border-t border-slate-200/60 space-y-3">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-800 block">🛠️ Phương thức 2: Nhập mã Access Token thủ công</span>
                            <div className="space-y-1.5">
                              <input 
                                type="password" 
                                placeholder="Nhập OAuth Access Token..."
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                value={manualToken}
                                onChange={(e) => setManualToken(e.target.value)}
                              />
                            </div>
                            <button
                              onClick={handleManualTokenSync}
                              disabled={syncing || !manualToken}
                              className="w-full bg-sky-600 text-white hover:bg-sky-500 text-xs font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                            >
                              {syncing ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  Đang xử lý...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  Đồng bộ bằng Token
                                </>
                              )}
                            </button>
                            <span className="text-[9px] text-slate-400 block leading-tight">Sử dụng trong trường hợp cơ chế popup xác thực bị trình duyệt chặn hoặc trong môi trường sandbox.</span>
                          </div>
                        </div>

                        {/* Danh sách tệp đã đồng bộ */}
                        <div className="lg:col-span-2 space-y-4 text-left">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                              <FileText className="w-4 h-4 text-sky-500" /> Tài liệu hiện hữu trong Bộ não ({syncedDocs.length})
                            </h3>
                            <button
                              onClick={loadSyncedDocs}
                              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                              title="Tải lại danh sách"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {syncStatus && (
                            <div className={`p-3 rounded-xl text-[11px] border ${
                              syncStatus.isError ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}>
                              {syncStatus.text}
                            </div>
                          )}

                          {syncProgress && (
                            <div className="p-4 bg-sky-50 border border-sky-100 rounded-2xl space-y-2">
                              <div className="flex justify-between text-xs font-bold text-sky-800">
                                <span>Đang xử lý: {syncProgress.currentFileName}</span>
                                <span>{syncProgress.current}/{syncProgress.total}</span>
                              </div>
                              <div className="w-full bg-sky-200/60 h-2 rounded-full overflow-hidden">
                                <div 
                                  className="bg-sky-600 h-full transition-all duration-300"
                                  style={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                                ></div>
                              </div>
                            </div>
                          )}

                          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden max-h-[450px] overflow-y-auto divide-y divide-slate-100">
                            {syncedDocs.length === 0 ? (
                              <div className="p-10 text-center text-slate-400 space-y-2">
                                <span className="text-3xl block">🧠</span>
                                <p className="text-xs font-medium">Bộ não trợ lý hiện đang trống.</p>
                                <p className="text-[10px] text-slate-400">Vui lòng đồng bộ dữ liệu từ thư mục Google Drive để cung cấp kiến thức cho AI.</p>
                              </div>
                            ) : (
                              syncedDocs.map((doc) => (
                                <div key={doc.id} className="p-4 hover:bg-slate-50/50 transition-all">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                      <h4 className="text-xs font-bold text-slate-800">{doc.name}</h4>
                                      <p className="text-[10px] font-mono text-slate-400">Mã tệp: {doc.id} | Định dạng: {doc.mimeType}</p>
                                      <p className="text-[10px] text-slate-500">Đồng bộ lúc: {new Date(doc.updatedAt).toLocaleString("vi-VN")}</p>
                                    </div>
                                    <span className="shrink-0 text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 rounded">
                                      Đã Đồng Bộ
                                    </span>
                                  </div>
                                  {doc.content && (
                                    <div className="mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px] text-slate-600 font-mono whitespace-pre-wrap max-h-[120px] overflow-y-auto">
                                      {doc.content.substring(0, 400)}{doc.content.length > 400 ? "..." : ""}
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "partners" && (
                    <motion.div
                      key="partners"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 pb-5 gap-4">
                        <div>
                          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <span className="text-indigo-500">🤝</span> Quản Lý Hệ Thống Đơn Vị Đồng Hành
                          </h2>
                          <p className="text-xs text-slate-500 mt-1">
                            Thêm mới, sửa đổi hoặc xóa bớt thông tin các đơn vị đồng hành chính thức và nhà tài trợ của Cổng An sinh.
                          </p>
                        </div>
                        {!isAddPartnerOpen && (
                          <button
                            onClick={() => {
                              setEditingPartner(null);
                              setPartnerIdInput("");
                              setPartnerName("");
                              setPartnerRole("");
                              setPartnerImageUrl("");
                              setPartnerDescription("");
                              setPartnerAmount("");
                              setIsAddPartnerOpen(true);
                            }}
                            className="inline-flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            Thêm Đơn Vị Mới
                          </button>
                        )}
                      </div>

                      {isAddPartnerOpen && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-slate-50 border border-slate-200/60 rounded-3xl p-6 text-left"
                        >
                          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                              {editingPartner ? "✏️ Hiệu Chỉnh Đơn Vị Đồng Hành" : "➕ Thêm Đơn Vị Đồng Hành Mới"}
                            </h3>
                            <button 
                              type="button"
                              onClick={() => {
                                setIsAddPartnerOpen(false);
                                setEditingPartner(null);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-all cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <form onSubmit={handleAddPartnerSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Tên đơn vị đồng hành *</label>
                                <input 
                                  type="text" 
                                  required
                                  placeholder="Ví dụ: Tổng Công ty SABECO"
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                  value={partnerName}
                                  onChange={(e) => setPartnerName(e.target.value)}
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Vai trò / Nhóm tài trợ *</label>
                                <input 
                                  type="text" 
                                  required
                                  placeholder="Ví dụ: Nhà Tài Trợ Vàng, Bảo Trợ An Sinh, v.v."
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                  value={partnerRole}
                                  onChange={(e) => setPartnerRole(e.target.value)}
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Số tiền tài trợ / Giá trị đóng góp (Không bắt buộc)</label>
                                <input 
                                  type="text" 
                                  placeholder="Ví dụ: 100,000,000đ"
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                  value={partnerAmount}
                                  onChange={(e) => setPartnerAmount(e.target.value)}
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Logo URL (Hình ảnh biểu trưng)</label>
                                <input 
                                  type="text" 
                                  placeholder="Link hình ảnh logo đơn vị..."
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                  value={partnerImageUrl}
                                  onChange={(e) => setPartnerImageUrl(e.target.value)}
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">Mô tả / Sứ mệnh đồng hành (Không bắt buộc)</label>
                              <textarea 
                                rows={3}
                                placeholder="Nhập tóm tắt vai trò đóng góp, cam kết xã hội của đơn vị..."
                                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none"
                                value={partnerDescription}
                                onChange={(e) => setPartnerDescription(e.target.value)}
                              />
                            </div>

                            {partnerImageUrl && (
                              <div className="p-3 bg-white border border-slate-100 rounded-2xl flex items-center gap-3 w-fit">
                                <div className="w-12 h-12 rounded-full border border-slate-100 p-0.5 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0">
                                  <img 
                                    src={partnerImageUrl} 
                                    alt="Preview" 
                                    className="w-full h-full object-contain"
                                    referrerPolicy="no-referrer"
                                    onError={(e) => { (e.target as any).src = "https://lh3.googleusercontent.com/d/1VdHot14lAHtlOODpodU5W1OAHIKuCwVE"; }}
                                  />
                                </div>
                                <div>
                                  <span className="text-[9px] font-bold uppercase text-slate-400 block leading-none">Ảnh xem trước (Preview)</span>
                                  <span className="text-[10px] text-slate-500 line-clamp-1">{partnerImageUrl}</span>
                                </div>
                              </div>
                            )}

                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200/50">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsAddPartnerOpen(false);
                                  setEditingPartner(null);
                                }}
                                className="px-4 py-2 border border-slate-250 hover:bg-slate-100 text-xs font-bold rounded-xl transition-all cursor-pointer text-slate-600"
                              >
                                Hủy Bỏ
                              </button>
                              <button
                                type="submit"
                                disabled={loading}
                                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                {loading ? (
                                  <>
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                    Đang lưu...
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-3.5 h-3.5" />
                                    {editingPartner ? "Cập Nhật" : "Thêm Mới"}
                                  </>
                                )}
                              </button>
                            </div>
                          </form>
                        </motion.div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-left">
                        {officialPartners.map((partner) => (
                          <div 
                            key={partner.id} 
                            className="bg-white border border-slate-200 rounded-3xl p-5 hover:shadow-md transition-all relative flex flex-col justify-between group"
                          >
                            <div>
                              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-full border border-slate-100 p-1 bg-slate-50 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
                                    <img 
                                      src={partner.imageUrl} 
                                      alt={partner.name} 
                                      className="w-full h-full object-contain"
                                      referrerPolicy="no-referrer"
                                      onError={(e) => { (e.target as any).src = "https://lh3.googleusercontent.com/d/1VdHot14lAHtlOODpodU5W1OAHIKuCwVE"; }}
                                    />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight line-clamp-1">{partner.name}</h4>
                                    <span className="text-[10px] font-bold text-sky-600">{partner.role}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 absolute top-4 right-4 bg-white/95 backdrop-blur px-1.5 py-1 rounded-xl shadow-sm border border-slate-200 z-10">
                                  <button
                                    onClick={() => handleEditPartnerClick(partner)}
                                    className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-all cursor-pointer"
                                    title="Chỉnh sửa thông tin"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePartnerClick(partner.id, partner.name)}
                                    className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-all cursor-pointer"
                                    title="Xóa đơn vị"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-2 text-[11px] text-slate-600">
                                {partner.amount && (
                                  <div className="flex items-center gap-1 bg-emerald-50 text-emerald-800 px-2 py-1 rounded-lg w-fit font-bold">
                                    <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>Đã đóng góp: {partner.amount}</span>
                                  </div>
                                )}
                                {partner.description ? (
                                  <p className="text-[10px] text-slate-500 leading-relaxed font-light line-clamp-3">
                                    {partner.description}
                                  </p>
                                ) : (
                                  <p className="text-[10px] italic text-slate-400">Không có mô tả chi tiết.</p>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-50 text-[9px] font-mono text-slate-400 flex justify-between items-center">
                              <span>Mã đơn vị: {partner.id}</span>
                              {partner.createdAt && (
                                <span>Đăng lúc: {new Date(partner.createdAt).toLocaleDateString("vi-VN")}</span>
                              )}
                            </div>
                          </div>
                        ))}

                        {officialPartners.length === 0 && (
                          <div className="col-span-full py-16 bg-white border border-slate-200 rounded-3xl text-center space-y-3">
                            <span className="text-4xl block">🤝</span>
                            <p className="text-sm font-bold text-slate-800">Chưa có thông tin đơn vị đồng hành.</p>
                            <p className="text-xs text-slate-500 max-w-md mx-auto">
                              Vui lòng nhấn nút "Thêm Đơn Vị Mới" ở góc trên bên phải để bắt đầu thiết lập danh sách nhà tài trợ & đối tác liên kết của Cổng.
                            </p>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "forum" && (
                    <AdminForumPanel />
                  )}
                  {activeTab === "partyFeedback" && (
                    <motion.div
                      key="partyFeedback"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="border-b border-slate-100 pb-5">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                          <span className="text-red-600">🏛️</span> Quản Lý Ý Kiến Đóng Góp Xây Dựng Đảng & Hệ Thống Chính Trị
                        </h2>
                        <p className="text-xs text-slate-500 mt-1 font-sans">
                          Tiếp nhận, thẩm định và phản hồi công khai các ý kiến, sáng kiến hiến kế của bà con Phường Phú Lợi, Thành phố Hồ Chí Minh.
                        </p>
                      </div>

                      {/* Stats widgets */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 font-sans">
                        <div className="p-4 bg-slate-50 border border-slate-200/50 rounded-2xl">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tổng số góp ý</span>
                          <span className="text-2xl font-black text-slate-800 block mt-1">{(partyContributions || []).length}</span>
                        </div>
                        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                          <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">Mới tiếp nhận</span>
                          <span className="text-2xl font-black text-red-700 block mt-1">
                            {(partyContributions || []).filter(c => c.status === "Mới nhận" || !c.status).length}
                          </span>
                        </div>
                        <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                          <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">Đang xem xét</span>
                          <span className="text-2xl font-black text-amber-700 block mt-1">
                            {(partyContributions || []).filter(c => c.status === "Đang tiếp thu").length}
                          </span>
                        </div>
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                          <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Đã giải quyết</span>
                          <span className="text-2xl font-black text-emerald-700 block mt-1">
                            {(partyContributions || []).filter(c => c.status === "Đã tiếp thu" || c.status === "Đã giải quyết").length}
                          </span>
                        </div>
                      </div>

                      {/* List & Response Editor */}
                      <div className="space-y-4 font-sans">
                        {(partyContributions || []).length === 0 ? (
                          <div className="p-16 text-center bg-slate-50 border border-slate-200 rounded-3xl text-slate-400">
                            <Vote className="w-12 h-12 mx-auto text-slate-300" />
                            <h4 className="font-bold text-sm text-slate-700 mt-3">Chưa có ý kiến đóng góp nào</h4>
                            <p className="text-xs text-slate-500 mt-1">
                              Hệ thống sẽ hiển thị danh sách khi người dân gửi các góp ý chính trị xã hội.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {(partyContributions || []).map((c) => (
                              <div key={c.id} className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs space-y-4 relative border-l-4 border-l-red-600 text-left">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="px-2.5 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded-lg text-[10px] font-bold">
                                        {c.category}
                                      </span>
                                      <span className="text-[10px] font-mono text-slate-400">ID: {c.id}</span>
                                    </div>
                                    <h4 className="font-bold text-sm text-slate-800 mt-1.5">{c.title}</h4>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      c.status === "Đã tiếp thu" || c.status === "Đã giải quyết"
                                        ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/10"
                                        : c.status === "Đang tiếp thu"
                                        ? "bg-sky-500/10 text-sky-700 border border-sky-500/10"
                                        : "bg-slate-100 text-slate-600"
                                    }`}>
                                      {c.status || "Mới nhận"}
                                    </span>
                                  </div>
                                </div>

                                <div className="space-y-2">
                                  <p className="text-xs text-slate-600 leading-relaxed italic">
                                    "{c.content}"
                                  </p>

                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] text-slate-400 font-mono py-1 bg-slate-50 rounded-xl px-3 border border-slate-100">
                                    <span>Gửi bởi: {c.isAnonymous ? "Ẩn danh (Bảo mật)" : `${c.userName} (${c.userPhone})`}</span>
                                    <span>Khu phố: {c.userQuarter || "Chưa chọn"}</span>
                                    <span>Ngày gửi: {new Date(c.createdAt).toLocaleDateString("vi-VN")}</span>
                                  </div>
                                </div>

                                {/* Response Form */}
                                <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-3">
                                  <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                    <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Giải quyết & Phản hồi thông tin</span>
                                  </h5>

                                  <form
                                    onSubmit={async (e) => {
                                      e.preventDefault();
                                      const form = e.currentTarget;
                                      const status = (form.elements.namedItem("status") as HTMLSelectElement).value as PartyContribution["status"];
                                      const responseNotes = (form.elements.namedItem("responseNotes") as HTMLTextAreaElement).value;
                                      const respondedBy = (form.elements.namedItem("respondedBy") as HTMLInputElement).value;

                                      try {
                                        if (onUpdatePartyContribution) {
                                          await onUpdatePartyContribution(c.id, {
                                            status,
                                            responseNotes,
                                            respondedBy,
                                            respondedAt: new Date().toISOString()
                                          });
                                          showFeedback("💾 Đã cập nhật phản hồi ý kiến đóng góp thành công.");
                                        }
                                      } catch (err) {
                                        console.error(err);
                                        showFeedback("Có lỗi xảy ra khi cập nhật ý kiến.", true);
                                      }
                                    }}
                                    className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end"
                                  >
                                    <div className="md:col-span-3">
                                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cập nhật trạng thái</label>
                                      <select
                                        name="status"
                                        defaultValue={c.status || "Mới nhận"}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-red-500/50"
                                      >
                                        <option value="Mới nhận">Mới tiếp nhận</option>
                                        <option value="Đang tiếp thu">Đang xem xét xử lý</option>
                                        <option value="Đã tiếp thu">Đã giải quyết / Tiếp thu</option>
                                        <option value="Từ chối">Từ chối giải quyết</option>
                                      </select>
                                    </div>

                                    <div className="md:col-span-6">
                                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nội dung phản hồi công khai</label>
                                      <textarea
                                        name="responseNotes"
                                        defaultValue={c.responseNotes || ""}
                                        placeholder="Nhập ý kiến phản hồi chỉ đạo, kết quả giải quyết của Thường vụ..."
                                        rows={2}
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-red-500/50"
                                        required
                                      />
                                    </div>

                                    <div className="md:col-span-2">
                                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Cán bộ xử lý</label>
                                      <input
                                        type="text"
                                        name="respondedBy"
                                        defaultValue={c.respondedBy || currentUser?.fullName || "Đảng ủy Phường Phú Lợi"}
                                        placeholder="Họ tên cán bộ..."
                                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-red-500/50"
                                        required
                                      />
                                    </div>

                                    <div className="md:col-span-1">
                                      <button
                                        type="submit"
                                        className="w-full py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1 shadow-sm"
                                      >
                                        <Save className="w-3.5 h-3.5" />
                                        <span>Lưu</span>
                                      </button>
                                    </div>
                                  </form>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "aiPersonality" && config && (
                    <motion.div
                      key="aiPersonality"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-6"
                    >
                      <div className="border-b border-slate-100 pb-5">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                          <span className="text-sky-500">🧠</span> Cấu Hình Tính Cách Trợ Lý Ảo AI
                        </h2>
                        <p className="text-xs text-slate-500 mt-1 font-sans">
                          Tùy chỉnh vai trò, phong cách trả lời và các ràng buộc thông tin cho Trợ lý An sinh số để phản ánh đúng chuẩn mực giao tiếp chính quyền địa phương tại Phường Phú Lợi, Thành phố Hồ Chí Minh.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
                        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-3xl p-6 space-y-4">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 text-left">Hệ chỉ thị hệ thống (System Prompt) cho Gemini</label>
                            <textarea
                              value={config.aiSystemPrompt || ""}
                              onChange={(e) => setConfig(prev => prev ? { ...prev, aiSystemPrompt: e.target.value } : null)}
                              rows={12}
                              className="w-full text-xs px-3.5 py-3 border border-slate-200 rounded-2xl focus:outline-none focus:border-sky-500 font-mono leading-relaxed text-left"
                              placeholder="Hãy nhập chỉ thị hệ thống tại đây để thay đổi hành vi và phong cách trả lời của Trợ lý ảo AI..."
                            />
                          </div>

                          <div className="flex justify-end gap-3 pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm("Bạn có chắc chắn muốn khôi phục chỉ thị AI về mặc định chính quyền Phường Phú Lợi, Thành phố Hồ Chí Minh?")) {
                                  setConfig(prev => prev ? { ...prev, aiSystemPrompt: DEFAULT_WEB_CONFIG.aiSystemPrompt } : null);
                                  showFeedback("Đã đặt lại chỉ thị về mặc định.");
                                }
                              }}
                              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer transition"
                            >
                              Khôi phục mặc định
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                if (!config) return;
                                setLoading(true);
                                try {
                                  await saveWebConfig(config);
                                  if (onConfigChange) {
                                    onConfigChange(config);
                                  }
                                  showFeedback("💾 Đã lưu cấu hình tính cách trợ lý ảo AI thành công!");
                                } catch (err) {
                                  console.error(err);
                                  showFeedback("Lỗi khi lưu cấu hình AI.", true);
                                } finally {
                                  setLoading(false);
                                }
                              }}
                              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl cursor-pointer transition flex items-center gap-1"
                            >
                              <Save className="w-4 h-4" />
                              <span>Lưu cấu hình</span>
                            </button>
                          </div>
                        </div>

                        {/* Presets Sidebar */}
                        <div className="lg:col-span-4 bg-slate-50 border border-slate-200/50 p-5 rounded-3xl space-y-4 text-left">
                          <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-amber-500" />
                            <span>Mẫu tính cách gợi ý</span>
                          </h4>
                          <p className="text-[11px] text-slate-500 leading-normal font-light">
                            Nhấp chọn một phong cách bên dưới để tải trước mẫu chỉ thị, sau đó điều chỉnh và nhấn nút "Lưu cấu hình":
                          </p>

                          <div className="space-y-3">
                            <button
                              type="button"
                              onClick={() => {
                                const prompt = `Bạn là Trợ lý ảo chính thức của chính quyền Phường Phú Lợi, Thành phố Hồ Chí Minh. Hãy trả lời người dân bằng thái độ trang trọng, lịch sự, đúng chuẩn mực văn bản hành chính nhà nước. Sử dụng các đại từ như 'Ban tiếp nhận', 'Quý công dân', 'Cơ quan'. Chỉ cung cấp thông tin chính thống về an sinh, thủ tục hành chính, danh sách khu phố và chính sách của phường. Địa chỉ Ủy ban: Số 171 Huỳnh Văn Lũy, Khu phố Phú Thuận, Phường Phú Lợi, Thành phố Hồ Chí Minh.`;
                                setConfig(prev => prev ? { ...prev, aiSystemPrompt: prompt } : null);
                                showFeedback("Đã tải mẫu phong cách Trang trọng.");
                              }}
                              className="w-full p-3.5 bg-white border border-slate-200 hover:border-sky-300 rounded-2xl text-left transition hover:shadow-sm cursor-pointer block"
                            >
                              <div className="font-bold text-xs text-slate-800">1. Trang trọng & Hành chính</div>
                              <p className="text-[10px] text-slate-500 mt-1 font-light leading-normal">
                                Chuẩn mực văn bản nhà nước, trang nghiêm, chính xác, sử dụng từ ngữ pháp lý rõ ràng.
                              </p>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const prompt = `Dạ, Trợ lý ảo Phú Lợi thân chào cô bác! Bạn là Trợ lý an sinh nghĩa tình của Phường Phú Lợi, Thành phố Hồ Chí Minh. Hãy trả lời bà con với thái độ vô cùng ấm áp, kính trọng và thân mật. Sử dụng các từ xưng hô thân thương như 'dạ thưa bà con', 'kính thưa quý cô bác', 'em'. Sẵn lòng giúp đỡ bà con hết mình với tinh thần lá lành đùm lá rách, hướng dẫn bà con đăng ký nhận quà tết, hỗ trợ khó khăn.`;
                                setConfig(prev => prev ? { ...prev, aiSystemPrompt: prompt } : null);
                                showFeedback("Đã tải mẫu phong cách Thân thiện.");
                              }}
                              className="w-full p-3.5 bg-white border border-slate-200 hover:border-sky-300 rounded-2xl text-left transition hover:shadow-sm cursor-pointer block"
                            >
                              <div className="font-bold text-xs text-emerald-800">2. Thân thiện, mộc mạc & Nghĩa tình</div>
                              <p className="text-[10px] text-slate-500 mt-1 font-light leading-normal">
                                Gần gũi, kính mến bà con, xưng hô lễ phép "dạ thưa cô bác", đề cao sự tương trợ cộng đồng.
                              </p>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const prompt = `Bạn là Trợ lý phản hồi nhanh của Phường Phú Lợi, Thành phố Hồ Chí Minh. Hãy trả lời ngắn gọn, trực diện vào câu hỏi của người dân. Tránh viết dài dòng hay giải thích lý thuyết, tập trung vào các bước thực hiện cụ thể, thông tin liên lạc rõ ràng và số điện thoại đường dây nóng hỗ trợ khẩn cấp. Địa chỉ: Số 171 Huỳnh Văn Lũy.`;
                                setConfig(prev => prev ? { ...prev, aiSystemPrompt: prompt } : null);
                                showFeedback("Đã tải mẫu phong cách Ngắn gọn.");
                              }}
                              className="w-full p-3.5 bg-white border border-slate-200 hover:border-sky-300 rounded-2xl text-left transition hover:shadow-sm cursor-pointer block"
                            >
                              <div className="font-bold text-xs text-amber-800">3. Ngắn gọn, xúc tích & Hành động</div>
                              <p className="text-[10px] text-slate-500 mt-1 font-light leading-normal">
                                Tập trung vào hành động, cung cấp nhanh số hotline, địa chỉ hoặc form đăng ký cụ thể không rườm rà.
                              </p>
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                
                  {activeTab === "imageUpload" && (
                    <motion.div
                      key="imageUpload"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <ImagePlus className="w-5 h-5" />
                          </div>
                          <div>
                            <h2 className="text-xl font-bold font-sans text-slate-800">Công cụ Upload Ảnh</h2>
                            <p className="text-sm font-medium text-slate-500 mt-1">Tải ảnh lên Google Drive và lấy liên kết trực tiếp (như up-anh-lay-link)</p>
                          </div>
                        </div>
                        
                        <div className="max-w-xl mx-auto space-y-6">
                          <div className="border-2 border-dashed border-slate-300 rounded-3xl p-10 flex flex-col items-center justify-center text-center hover:bg-slate-50 transition-colors">
                            <ImagePlus className="w-12 h-12 text-slate-300 mb-4" />
                            <p className="text-sm font-semibold text-slate-700 mb-2">Kéo thả ảnh vào đây hoặc</p>
                            <label className="bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold px-6 py-3 rounded-xl transition cursor-pointer shadow-md inline-flex items-center gap-2">
                              <span>{isUploadingDriveImage ? "Đang tải lên..." : "Chọn ảnh từ máy tính"}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                disabled={isUploadingDriveImage}
                                onClick={async (e) => {
                                  const token = await getAccessToken();
                                  if (!token) {
                                    e.preventDefault();
                                    try {
                                      await googleSignIn();
                                      alert("Đã kết nối Google Drive thành công! Vui lòng nhấn 'Chọn ảnh' lại để tải lên.");
                                    } catch (err) {
                                      alert("Không thể kết nối Google Drive: " + (err.message || err));
                                    }
                                  }
                                }}
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setIsUploadingDriveImage(true);
                                    try {
                                      let token = await getAccessToken();
                                      if (!token) {
                                        const authResult = await googleSignIn();
                                        token = authResult?.accessToken || null;
                                      }
                                      if (!token) throw new Error("Authentication failed");
                                      
                                      const FOLDER_ID = "1LZQhcPm0WiMd1IiqLxW2MrNl6J9PjhrS";
                                      const metadata = { name: `${Date.now()}_${file.name}`, parents: [FOLDER_ID] };
                                      
                                      let createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
                                        method: 'POST',
                                        headers: {
                                          'Authorization': `Bearer ${token}`,
                                          'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify(metadata)
                                      });
                                      let createData = await createRes.json();
                                      
                                      if (!createData.id && createData.error) {
                                        console.warn("Falling back to root drive folder", createData.error);
                                        const fallbackMetadata = { name: `${Date.now()}_${file.name}` };
                                        createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
                                          method: 'POST',
                                          headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Content-Type': 'application/json'
                                          },
                                          body: JSON.stringify(fallbackMetadata)
                                        });
                                        createData = await createRes.json();
                                      }
                                      
                                      if (!createData.id) throw new Error(createData.error?.message || "Failed to create file");
                                      
                                      const uploadRes = await fetch(`https://www.googleapis.com/upload/drive/v3/files/${createData.id}?uploadType=media`, {
                                        method: 'PATCH',
                                        headers: {
                                          'Authorization': `Bearer ${token}`,
                                          'Content-Type': file.type
                                        },
                                        body: file
                                      });
                                      
                                      if (uploadRes.ok) {
                                        await fetch(`https://www.googleapis.com/drive/v3/files/${createData.id}/permissions`, {
                                          method: 'POST',
                                          headers: {
                                            'Authorization': `Bearer ${token}`,
                                            'Content-Type': 'application/json'
                                          },
                                          body: JSON.stringify({ role: 'reader', type: 'anyone' })
                                        });
                                        
                                        const url = `https://drive.google.com/uc?export=view&id=${createData.id}`;
                                        setUploadedDriveImageUrl(url);
                                      } else {
                                        throw new Error("Upload content failed");
                                      }
                                    } catch (err) {
                                      console.error("Lỗi upload:", err);
                                      alert("Lỗi tải ảnh: " + (err.message || err));
                                    } finally {
                                      setIsUploadingDriveImage(false);
                                      e.target.value = '';
                                    }
                                  }
                                }}
                              />
                            </label>
                          </div>

                          {uploadedDriveImageUrl && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                              <h3 className="text-emerald-800 font-bold mb-4 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5" />
                                Tải ảnh thành công!
                              </h3>
                              <div className="aspect-video w-full max-w-sm mx-auto bg-slate-100 rounded-xl overflow-hidden mb-4 border border-emerald-100 flex items-center justify-center relative">
                                <img src={uploadedDriveImageUrl} alt="Uploaded" className="max-w-full max-h-full object-contain" />
                              </div>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  readOnly
                                  value={uploadedDriveImageUrl}
                                  className="flex-1 px-4 py-3 bg-white border border-emerald-200 rounded-xl text-sm font-medium focus:outline-none"
                                />
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(uploadedDriveImageUrl);
                                    alert("Đã sao chép đường dẫn!");
                                  }}
                                  className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shrink-0"
                                >
                                  Copy Link
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
</AnimatePresence>

              )}
            </div>
          </div>
      </div>
    </section>
      {editingUserProfile && (
        <ProfileModal
          isOpen={true}
          onClose={() => setEditingUserProfile(null)}
          currentUser={editingUserProfile}
          onUpdate={(updatedUser) => {
            setUsers(prev => prev.map(u => u.uid === updatedUser.uid ? updatedUser : u));
          }}
        />
      )}
    </>
  );
}