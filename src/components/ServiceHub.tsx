/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Heart, ShieldAlert, ShieldCheck, Search, Award, Building, Briefcase, 
  Coins, HelpCircle, Send, CheckCircle2, FileText, ChevronRight,
  Sparkles, Gift, Printer, ArrowRight, UserCheck, Calendar, Landmark,
  Edit3, Save, LogIn, Plus, HeartHandshake, MapPin, Phone, Mail, Trophy, X,
  Lock, User, Check, Sliders, Activity, TrendingUp, Vote, Bookmark, Share2, Star
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import html2canvas from "html2canvas";
import ShareModal from "./ShareModal";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { SupportCategory, RequestStatus, CitizenRequest, Donation, Campaign, JobListing, UserProfile, CalendarEvent, VolunteerRegistration, WebConfig, NewsArticle, PartyContribution } from "../types";
import { lookupRequestsFromFirestore, updateUserProfileInFirestore, submitVolunteerRegistrationToFirestore, fetchVolunteerRegistrationsFromFirestore } from "../lib/firebaseSync";
import { getAccessToken, googleSignIn } from "../lib/googleAuth";
import { QUARTERS_LIST } from "../constants";
import { canViewSensitiveInfo, maskName, maskPhone, maskAddress } from "../utils/privacy";
import { fuzzyMatch, rankJobsByRelevance, searchRank } from "../utils/algorithms";
import CitizenSurvey from "./CitizenSurvey";
import DigitalBadgeWallet from "./DigitalBadgeWallet";


interface ServiceHubProps {
  requests: CitizenRequest[];
  campaigns: Campaign[];
  donations: Donation[];
  jobs: JobListing[];
  events?: CalendarEvent[];
  currentUser: UserProfile | null;
  onSubmitRequest: (req: { fullName: string; phone: string; address: string; quarter: string; category: SupportCategory | string; description: string; email?: string }) => void;
  onSubmitDonation: (donation: { donorName: string; amount: number; campaignId: string; message: string }) => Donation;
  onAuthClick?: () => void;
  onUpdateRequest?: (requestId: string, status: RequestStatus, notes?: string) => Promise<void>;
  showToast: (title: string, message: string, type: "success" | "info" | "warning" | "error") => void;
  webConfig?: WebConfig;
  news?: NewsArticle[];
  bookmarkedCampaignIds?: string[];
  bookmarkedNewsIds?: string[];
  onToggleBookmarkCampaign?: (id: string) => void;
  onToggleBookmarkNews?: (id: string) => void;
  partyContributions?: PartyContribution[];
  onSubmitPartyContribution?: (contrib: Omit<PartyContribution, "id" | "createdAt">) => Promise<void>;
  onRatingSubmit?: (requestId: string, rating: number, ratingComment?: string) => Promise<void>;
}

interface RequestActionCardProps {
  key?: React.Key | string;
  request: CitizenRequest;
  onUpdate: (requestId: string, status: RequestStatus, notes?: string) => Promise<void>;
}

function RequestActionCard({ request, onUpdate }: RequestActionCardProps) {
  const [status, setStatus] = useState<RequestStatus>(request.status);
  const [notes, setNotes] = useState<string>(request.notes || "");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setStatus(request.status);
    setNotes(request.notes || "");
  }, [request]);

  const handleUpdate = async () => {
    setSaving(true);
    try {
      await onUpdate(request.id, status, notes);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-lg hover:border-primary-200 transition-all duration-300">
      <div className="flex justify-between items-start flex-wrap gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-extrabold text-slate-900 text-sm">{request.fullName}</span>
            <span className="font-mono text-[9px] text-primary-700 bg-primary-100/60 px-1.5 py-0.5 rounded border border-primary-200">{request.id}</span>
          </div>
          <div className="text-slate-500 text-[10px] mt-1 flex flex-wrap gap-x-3">
            <span>SĐT: <strong className="text-primary-600 font-mono font-semibold">{request.phone}</strong></span>
            <span>Khu phố: <strong className="text-slate-700 font-semibold">{request.quarter}</strong></span>
          </div>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
          request.status === RequestStatus.COMPLETED ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
          request.status === RequestStatus.APPROVED ? "bg-primary-100 text-primary-800 border border-primary-200" :
          request.status === RequestStatus.VERIFYING ? "bg-amber-100 text-amber-800 border border-amber-200" :
          "bg-slate-100 text-slate-600 border border-slate-200"
        }`}>
          {request.status}
        </span>
      </div>

      <div className="p-3 bg-white border border-primary-100 rounded-xl space-y-1">
        <div className="text-[10px] font-extrabold text-primary-700 uppercase tracking-wider">Hạng mục: {request.category}</div>
        <p className="text-slate-600 italic">"{request.description}"</p>
        <div className="text-[9px] text-slate-400 pt-1 text-right font-mono">Gửi lúc: {new Date(request.createdAt).toLocaleString("vi-VN")}</div>
      </div>

      <div className="border-t border-slate-100 pt-3.5 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-4">
            <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Cập nhật trạng thái:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as RequestStatus)}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-2 py-1.5 text-[11px] font-semibold focus:outline-none focus:border-primary-500"
            >
              <option value={RequestStatus.SUBMITTED}>Đã tiếp nhận</option>
              <option value={RequestStatus.VERIFYING}>Đang xác minh</option>
              <option value={RequestStatus.APPROVED}>Đã duyệt hỗ trợ</option>
              <option value={RequestStatus.COMPLETED}>Đã hoàn thành</option>
            </select>
          </div>
          <div className="sm:col-span-8">
            <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Phản hồi của Ủy ban MTTQ / Cán bộ:</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ghi chú xác minh thực tế, kết quả trợ giúp..."
              className="w-full bg-white border border-slate-200 text-slate-850 rounded-lg px-3 py-1.5 text-[11px] focus:outline-none focus:border-sky-500 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <motion.button
            onClick={handleUpdate}
            disabled={saving}
            className={`px-6 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-2 transition-all cursor-pointer ${
              success 
                ? "bg-emerald-600 text-white" 
                : "bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow-md"
            }`}
          >
            {saving ? (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : success ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Đã cập nhật</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Cập nhật hồ sơ</span>
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

const CustomDonationTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 backdrop-blur-md p-4 border border-slate-200 rounded-2xl shadow-xl space-y-1.5 text-left max-w-sm font-sans">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">{data.date}</p>
        <div className="space-y-1">
          <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary-500" />
            Nhà hảo tâm: <span className="font-semibold text-primary-600">{data["Nhà hảo tâm"]}</span>
          </p>
          <p className="text-[11px] text-slate-500">
            Chiến dịch: <span className="text-slate-700 font-medium">{data["Chiến dịch"]}</span>
          </p>
          <div className="border-t border-slate-100 pt-1.5 mt-1">
            <p className="text-xs text-slate-500">
              Số tiền: <span className="font-extrabold text-slate-800 font-mono">+{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(data["Đóng góp"])}</span>
            </p>
            <p className="text-xs text-slate-500">
              Lũy kế hệ thống: <span className="font-black text-emerald-600 font-mono">{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(data["Lũy kế đóng góp"])}</span>
            </p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

function RatingInput({ rId, onRatingSubmit }: { rId: string; onRatingSubmit?: (requestId: string, rating: number, ratingComment?: string) => Promise<void> }) {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onRatingSubmit) return;
    setSubmitting(true);
    try {
      await onRatingSubmit(rId, rating, comment);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      <div className="flex items-center space-x-2">
        <div className="flex space-x-1.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              type="button"
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(null)}
              className="focus:outline-none transition-transform hover:scale-115 cursor-pointer"
            >
              <Star
                className={`w-6 h-6 transition-all duration-150 ${
                  star <= (hoverRating ?? rating)
                    ? "text-amber-400 fill-amber-400 drop-shadow-[0_1px_3px_rgba(245,158,11,0.25)]"
                    : "text-slate-300"
                }`}
              />
            </button>
          ))}
        </div>
        <span className="text-xs font-bold text-amber-600 font-mono">
          {rating === 5 ? "Rất hài lòng" :
           rating === 4 ? "Hài lòng" :
           rating === 3 ? "Bình thường" :
           rating === 2 ? "Chưa hài lòng" : "Rất không hài lòng"}
        </span>
      </div>
      <div className="space-y-2">
        <textarea
          placeholder="Nhập ý kiến góp ý thêm cho cán bộ phục vụ (tùy chọn)..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/20 leading-relaxed font-sans"
          rows={2}
          maxLength={500}
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black rounded-xl shadow-md shadow-amber-500/15 transition-all duration-200 flex items-center space-x-1 cursor-pointer disabled:opacity-50"
          >
            <span>{submitting ? "Đang gửi..." : "Gửi đánh giá cán bộ"}</span>
          </button>
        </div>
      </div>
    </form>
  );
}

export default function ServiceHub({
  requests,
  campaigns,
  donations,
  jobs,
  events = [],
  currentUser,
  onSubmitRequest,
  onSubmitDonation,
  onAuthClick,
  onUpdateRequest,
  showToast,
  webConfig,
  news = [],
  bookmarkedCampaignIds = [],
  bookmarkedNewsIds = [],
  onToggleBookmarkCampaign = () => {},
  onToggleBookmarkNews = () => {},
  partyContributions = [],
  onSubmitPartyContribution,
  onRatingSubmit
}: ServiceHubProps) {
  const [activeTab, setActiveTab] = useState<"lookup" | "request" | "job" | "charity" | "citizen" | "survey" | "volunteer" | "bookmarks">("lookup");
  
  // Handle URL deep linking for Charity Campaign and Bookmarks
  // Handle Custom Navigation Event
  useEffect(() => {
    const handleNavigate = (e) => {
      if (e.detail) {
        setActiveTab(e.detail);
        const el = document.getElementById("services");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }
    };
    window.addEventListener("navigateTab", handleNavigate);
    return () => window.removeEventListener("navigateTab", handleNavigate);
  }, []);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get("tab");
      const campaignIdParam = params.get("campaignId");
      
      if (tabParam === "charity" || campaignIdParam) {
        setActiveTab("charity");
        if (campaignIdParam && campaigns && campaigns.length > 0) {
          const matchedCamp = campaigns.find(c => c.id === campaignIdParam);
          if (matchedCamp) {
            setSelectedCampaign(matchedCamp);
            setTimeout(() => {
              const element = document.getElementById(`campaign-card-${campaignIdParam}`);
              if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
                element.classList.add("ring-2", "ring-primary-500", "scale-[1.01]", "transition-all", "duration-1000");
                setTimeout(() => {
                  element.classList.remove("ring-2", "ring-primary-500", "scale-[1.01]");
                }, 3000);
              }
            }, 600);
          }
        }
      } else if (tabParam === "bookmarks") {
        setActiveTab("bookmarks");
      }
    } catch (err) {
      console.warn("Deep linking parser failed:", err);
    }
  }, [campaigns]);

  const savedCampaigns = campaigns.filter(camp => bookmarkedCampaignIds.includes(camp.id));
  const savedNews = news.filter(n => bookmarkedNewsIds.includes(n.id));
  // Role Simulation State for PII security plan testing
  const [simulatedRole, setSimulatedRole] = useState<"guest" | "citizen" | "officer" >("guest");
  const [simulatedOfficerQuarter, setSimulatedOfficerQuarter] = useState<string>(QUARTERS_LIST[0].name);
  const [maskingStrategy, setMaskingStrategy] = useState<"initials" | "asterisks" | "hidden">("initials");

  // Sync simulated role with actual user profile on authentication changes
  useEffect(() => {
    if (currentUser) {
      if (currentUser.isAdmin || currentUser.email?.toLowerCase() === "nguyenhuy.thudaumot@gmail.com") {
        setSimulatedRole("admin");
      } else if (currentUser.isOfficer) {
        setSimulatedRole("officer");
        setSimulatedOfficerQuarter(currentUser.officerQuarter || currentUser.quarter || QUARTERS_LIST[0].name);
      } else {
        setSimulatedRole("citizen");
      }
    } else {
      setSimulatedRole("guest");
    }
  }, [currentUser]);

  // Tab 1: Policy Lookup & Calculator State
  const [lookupSubTab, setLookupSubTab] = useState<"pension" | "bhyt">("pension");
  const [lookupQuery, setLookupQuery] = useState("");
  const [searchResult, setSearchResult] = useState<CitizenRequest[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [calcAge, setCalcAge] = useState<number | "">("");
  const [calcDisability, setCalcDisability] = useState("none");
  const [calcIncome, setCalcIncome] = useState("normal");
  const [calcPension, setCalcPension] = useState("yes");
  const [calcResult, setCalcResult] = useState<string | null>(null);

  // BHYT Calculator State
  const [bhytMembers, setBhytMembers] = useState<number>(1);
  const [bhytSubject, setBhytSubject] = useState<"normal" | "near_poor" | "poor" | "student" | "children_under_6" | "social_protection">("normal");
  const [bhytResult, setBhytResult] = useState<{
    basePremium: number;
    totalPremiumBeforeSubsidy: number;
    governmentSubsidy: number;
    binhDuongSubsidy: number;
    finalCitizenPay: number;
    breakdown: { personIndex: number; costBeforeSubsidy: number; finalPay: number }[];
  } | null>(null);

  // Community feedback & supervision state
  const [feedbackTopic, setFeedbackTopic] = useState<string>("An sinh xã hội");
  const [feedbackQuarter, setFeedbackQuarter] = useState<string>(QUARTERS_LIST[0].name);
  const [feedbackImageUrl, setFeedbackImageUrl] = useState("");
  const [isUploadingFeedbackImage, setIsUploadingFeedbackImage] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState<string>("");
  const [feedbackName, setFeedbackName] = useState<string>("");
  const [feedbackPhone, setFeedbackPhone] = useState<string>("");
  const [feedbackSaving, setFeedbackSaving] = useState<boolean>(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
  const [feedbackAnonymous, setFeedbackAnonymous] = useState<boolean>(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  // Party & Political System Contributions State
  const [contribTitle, setContribTitle] = useState("");
  const [contribCategory, setContribCategory] = useState("Sinh hoạt chi bộ");
  const [contribContent, setContribContent] = useState("");
  const [contribIsAnonymous, setContribIsAnonymous] = useState(false);
  const [contribSaving, setContribSaving] = useState(false);
  const [contribSuccess, setContribSuccess] = useState(false);
  
  const [feedbacks, setFeedbacks] = useState([
    {
      id: "FB-01",
      topic: "Ý kiến hỗ trợ",
      name: "Trần Văn Nam",
      phone: "091***456",
      quarter: "Chánh An",
      content: "Đề nghị UBMTTQ khảo sát thêm hoàn cảnh cụ ông neo đơn ở hẻm 276 Phạm Ngọc Thạch. Cụ tuổi cao, sức yếu không có người chăm sóc.",
      status: "Đã xử lý",
      response: "Mặt trận Tổ quốc phường phối hợp cùng Trưởng Ban CTMT khu phố Chánh An đã trực tiếp đến thăm hỏi cụ. Hiện tại đã đưa cụ vào diện nhận gạo định kỳ mỗi tháng 15kg và lập hồ sơ bảo trợ xã hội.",
      date: "2026-07-01",
    },
    {
      id: "FB-02",
      topic: "Ngày thứ bảy văn minh",
      name: "Nguyễn Thị Mai",
      phone: "098***812",
      quarter: "Hiệp Thành",
      content: "Các buổi dọn dẹp vệ sinh ngày thứ bảy rất bổ ích. Đề nghị Mặt trận trang bị thêm dụng cụ bảo hộ và nước uống cho các bạn thanh thiếu niên tham gia.",
      status: "Đã ghi nhận",
      response: "Cảm ơn ý kiến đóng góp của chị Mai. UB MTTQ đã trích quỹ hoạt động tình nguyện mua sắm thêm găng tay bảo hộ và chuẩn bị nước suối đóng chai tiếp sức cho tình nguyện viên từ Thứ Bảy tuần tới.",
      date: "2026-07-08",
    },
    {
      id: "FB-03",
      topic: "Bảo hiểm y tế",
      name: "Lê Minh Trí",
      phone: "097***110",
      quarter: "Phú Thuận",
      content: "Thủ tục mua BHYT hộ gia đình qua ứng dụng rất nhanh chóng, đỡ phải xếp hàng ở phường. Cảm ơn ứng dụng rất tiện lợi.",
      status: "Đã xử lý",
      response: "Cảm ơn anh Trí đã tin tưởng và sử dụng hệ thống An sinh xã hội số Phường Phú Lợi.",
      date: "2026-07-12",
    }
  ]);

  // Tab 2: Request Form State
  const [reqName, setReqName] = useState("");
  const [reqPhone, setReqPhone] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqAddress, setReqAddress] = useState("");
  const [reqQuarter, setReqQuarter] = useState(QUARTERS_LIST[0].name);
  const [reqCategory, setReqCategory] = useState<SupportCategory | string>(SupportCategory.FOOD);
  const [reqDescription, setReqDescription] = useState("");
  const [reqSubmitted, setReqSubmitted] = useState(false);

  // Sync Form Fields with Logged-in User Profile
  useEffect(() => {
    if (currentUser) {
      setReqName(currentUser.fullName);
      setReqPhone(currentUser.phone);
      setReqEmail(currentUser.email || "");
      setReqAddress(currentUser.address);
      setReqQuarter(currentUser.quarter);
    } else {
      setReqName("");
      setReqPhone("");
      setReqEmail("");
      setReqAddress("");
      setReqQuarter(QUARTERS_LIST[0].name);
    }
  }, [currentUser]);

  // Tab 3: Job Application State
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [jobApplicantName, setJobApplicantName] = useState("");
  const [jobApplicantPhone, setJobApplicantPhone] = useState("");
  const [jobApplicantSkills, setJobApplicantSkills] = useState("");
  const [jobApplied, setJobApplied] = useState(false);

  // Tab 4: Charity Donation State
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [donorName, setDonorName] = useState("");
  const [donateAmount, setDonateAmount] = useState<number | "">("");
  const [donateMessage, setDonateMessage] = useState("");
  const [generatedCertificate, setGeneratedCertificate] = useState<Donation | null>(null);

  // Share Campaign States
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [selectedShareCampaign, setSelectedShareCampaign] = useState<Campaign | null>(null);

  const handleShareCampaign = (camp: Campaign) => {
    setSelectedShareCampaign(camp);
    setIsShareOpen(true);
  };

  // Tab 4: Charity Trend Chart State
  const [trendMetric, setTrendMetric] = useState<"cumulative" | "individual">("cumulative");

  const getDonationTrendData = () => {
    if (!donations || donations.length === 0) return [];
    
    // Sort donations by date chronologically
    const sorted = [...donations].sort((a, b) => {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    let cumulativeSum = 0;
    return sorted.map(d => {
      cumulativeSum += d.amount;
      const dateObj = new Date(d.createdAt);
      return {
        date: dateObj.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "2-digit" }),
        "Đóng góp": d.amount,
        "Lũy kế đóng góp": cumulativeSum,
        "Nhà hảo tâm": d.donorName,
        "Chiến dịch": d.campaignTitle,
      };
    });
  };

  const trendData = getDonationTrendData();

  const totalDonationsAmount = donations.reduce((sum, d) => sum + d.amount, 0);
  const distinctDonorsCount = new Set(donations.map(d => d.donorName)).size;
  const maxDonationAmount = donations.length > 0 ? Math.max(...donations.map(d => d.amount)) : 0;
  const avgDonationAmount = donations.length > 0 ? Math.round(totalDonationsAmount / donations.length) : 0;

  // Tab 5: Citizen Dashboard State
  const [citizenSubTab, setCitizenSubTab] = useState<"requests" | "donations" | "feedback" | "volunteer" | "badges">("requests");
  const [viewedPersonalCertificate, setViewedPersonalCertificate] = useState<Donation | null>(null);
  const [citizenRequestFilter, setCitizenRequestFilter] = useState<string>("all");
  const [citizenRequestSearch, setCitizenRequestSearch] = useState<string>("");

  // Volunteer form state
  const [selectedVolunteerQuarters, setSelectedVolunteerQuarters] = useState<string[]>([]);
  const [volunteerSaving, setVolunteerSaving] = useState(false);

  // Volunteer Community Case Report form state
  const [volReportName, setVolReportName] = useState("");
  const [volReportPhone, setVolReportPhone] = useState("");
  const [volReportAddr, setVolReportAddr] = useState("");
  const [volReportQuarter, setVolReportQuarter] = useState(QUARTERS_LIST[0].name);
  const [volReportCategory, setVolReportCategory] = useState<SupportCategory | string>(SupportCategory.FOOD);
  const [volReportDesc, setVolReportDesc] = useState("");
  const [volReportSubmitted, setVolReportSubmitted] = useState(false);
  const [volReportSaving, setVolReportSaving] = useState(false);

  // Viewed certificate in Dashboard
  const [viewedCert, setViewedCert] = useState<Donation | null>(null);

  // Initialize Profile form with currentUser values
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setSelectedVolunteerQuarters(currentUser.volunteerQuarters || [currentUser.quarter]);
    }
  }, [currentUser]);

  const handleJoinVolunteer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setVolunteerSaving(true);
    try {
      const updatedProfile = {
        ...currentUser,
        isVolunteer: true,
        volunteerQuarters: selectedVolunteerQuarters.length > 0 ? selectedVolunteerQuarters : [currentUser.quarter]
      };
      await updateUserProfileInFirestore(currentUser.uid, updatedProfile);
      localStorage.setItem("phuloi_user", JSON.stringify(updatedProfile));
      setProfileSuccess("Đăng ký gia nhập Đội ngũ Tình nguyện viên Phú Lợi thành công!");
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error(err);
      setProfileError("Lỗi kết nối. Không thể đăng ký tình nguyện viên.");
    } finally {
      setVolunteerSaving(false);
    }
  };

  const handleVolunteerReportCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!volReportName.trim() || !volReportPhone.trim() || !volReportDesc.trim()) {
      alert("Vui lòng điền đủ Họ tên, Số điện thoại và mô tả trường hợp khó khăn.");
      return;
    }
    setVolReportSaving(true);
    try {
      onSubmitRequest({
        fullName: volReportName,
        phone: volReportPhone,
        address: `${volReportAddr} (Phản ánh bởi CTV: ${currentUser?.fullName || "Ẩn danh"})`,
        quarter: volReportQuarter,
        category: volReportCategory,
        description: `[CA KHÓ KHĂN ĐỊA BÀN] - ${volReportDesc}`
      });
      setVolReportSubmitted(true);
      setVolReportName("");
      setVolReportPhone("");
      setVolReportAddr("");
      setVolReportDesc("");
      setTimeout(() => setVolReportSubmitted(false), 5000);
    } catch (err) {
      console.error("Failed to submit volunteer case:", err);
    } finally {
      setVolReportSaving(false);
    }
  };

  // Handlers
  const handleLookupSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupQuery.trim()) {
      setSearchResult([]);
      return;
    }
    setSearching(true);
    try {
      const matched = await lookupRequestsFromFirestore(lookupQuery);
      setSearchResult(matched);
    } catch (err) {
      console.error("Firestore lookup failed, trying local filter fallback:", err);
      const matched = searchRank(requests, lookupQuery, ["fullName", "phone", "id"]);
      setSearchResult(matched);
    } finally {
      setSearching(false);
    }
  };


  const handleCalculatePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    const age = Number(calcAge);
    let eligibility = "";
    let rate = 0;

    if (calcIncome === "poor") {
      if (age >= 80 && calcPension === "no") {
        rate = 540000;
        eligibility = `Hộ nghèo + Người cao tuổi từ 80 tuổi trở lên không có lương hưu/trợ cấp BHXH. Đủ điều kiện nhận trợ cấp bảo trợ xã hội hàng tháng.`;
      } else if (age < 16) {
        rate = 540000;
        eligibility = `Trẻ em dưới 16 tuổi thuộc diện hộ nghèo có hoàn cảnh đặc biệt khó khăn. Đủ điều kiện nhận trợ cấp hàng tháng.`;
      } else if (calcDisability === "severe") {
        rate = 720000;
        eligibility = `Người khuyết tật nặng thuộc hộ nghèo. Đủ điều kiện nhận trợ cấp xã hội hàng tháng.`;
      } else if (calcDisability === "special") {
        rate = 900000;
        eligibility = `Người khuyết tật đặc biệt nặng thuộc hộ nghèo. Đủ điều kiện nhận trợ cấp xã hội và hỗ trợ chăm sóc hàng tháng.`;
      } else {
        rate = 360000;
        eligibility = `Hộ nghèo thuộc diện hỗ trợ chính sách an sinh xã hội chung của phường (Được cấp thẻ BHYT miễn phí 100%, hỗ trợ tiền điện, tiền Tết).`;
      }
    } else {
      if (age >= 80 && calcPension === "no") {
        rate = 360000;
        eligibility = `Người cao tuổi từ 80 tuổi trở lên không có lương hưu/trợ cấp BHXH (được hỗ trợ theo Nghị định 20/2021/NĐ-CP). Đủ điều kiện nhận trợ cấp xã hội hàng tháng và thẻ BHYT miễn phí.`;
      } else if (calcDisability === "severe") {
        rate = 540000;
        eligibility = `Người khuyết tật nặng (có giấy xác nhận của Hội đồng giám định y khoa). Đủ điều kiện nhận trợ cấp hàng tháng.`;
      } else if (calcDisability === "special") {
        rate = 720000;
        eligibility = `Người khuyết tật đặc biệt nặng. Đủ điều kiện nhận trợ cấp xã hội hàng tháng.`;
      } else {
        rate = 0;
        eligibility = `Chưa đủ điều kiện nhận trợ cấp xã hội hàng tháng theo Nghị định 20/2021/NĐ-CP. Tuy nhiên, quý bà con vẫn có thể tham gia Bảo hiểm y tế hộ gia đình (được Nhà nước hỗ trợ một phần mức đóng) hoặc nộp đơn hỗ trợ đột xuất nếu gặp tai nạn/khó khăn khẩn cấp.`;
      }
    }

    setCalcResult(
      rate > 0 
        ? `Hệ thống tính toán: Quý bà con ĐỦ ĐIỀU KIỆN hưởng trợ cấp bảo trợ xã hội hàng tháng. Mức trợ cấp dự kiến tối thiểu khoảng: ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(rate)}/tháng. ${eligibility}`
        : `Hệ thống tính toán: ${eligibility}`
    );
  };

  const handleCalculateBHYT = (e: React.FormEvent) => {
    e.preventDefault();
    const members = Number(bhytMembers);
    const standardFeePerYear = 1263600; // 4.5% of 2,340,000 base salary * 12 months
    
    const getDiscountMultiplier = (idx: number) => {
      if (idx === 1) return 1.0;
      if (idx === 2) return 0.7;
      if (idx === 3) return 0.6;
      if (idx === 4) return 0.5;
      return 0.4;
    };

    let totalBeforeSubsidy = 0;
    const breakdownList = [];

    for (let i = 1; i <= members; i++) {
      const multiplier = getDiscountMultiplier(i);
      const costBeforeSubsidy = Math.round(standardFeePerYear * multiplier);
      
      let subsidyPercent = 0;
      let binhDuongSubsidyPercent = 0;
      
      if (bhytSubject === "poor") {
        subsidyPercent = 1.0;
      } else if (bhytSubject === "near_poor") {
        subsidyPercent = 0.7;
        binhDuongSubsidyPercent = 0.3; // Binh Duong covers remaining 30%
      } else if (bhytSubject === "student") {
        subsidyPercent = 0.3;
      } else if (bhytSubject === "children_under_6" || bhytSubject === "social_protection") {
        subsidyPercent = 1.0;
      }

      const govSubsidyVal = Math.round(costBeforeSubsidy * subsidyPercent);
      const bdSubsidyVal = Math.round(costBeforeSubsidy * binhDuongSubsidyPercent);
      const finalPay = Math.max(0, costBeforeSubsidy - govSubsidyVal - bdSubsidyVal);

      totalBeforeSubsidy += costBeforeSubsidy;
      breakdownList.push({
        personIndex: i,
        costBeforeSubsidy,
        finalPay
      });
    }

    const totalGovernmentSubsidy = breakdownList.reduce((sum, item) => {
      const subsidyPercent = (bhytSubject === "poor" || bhytSubject === "children_under_6" || bhytSubject === "social_protection") ? 1.0 : (bhytSubject === "near_poor" ? 0.7 : (bhytSubject === "student" ? 0.3 : 0));
      return sum + Math.round(item.costBeforeSubsidy * subsidyPercent);
    }, 0);

    const totalBinhDuongSubsidy = breakdownList.reduce((sum, item) => {
      const binhDuongSubsidyPercent = bhytSubject === "near_poor" ? 0.3 : 0;
      return sum + Math.round(item.costBeforeSubsidy * binhDuongSubsidyPercent);
    }, 0);

    const totalCitizenPay = breakdownList.reduce((sum, item) => sum + item.finalPay, 0);

    setBhytResult({
      basePremium: standardFeePerYear,
      totalPremiumBeforeSubsidy: totalBeforeSubsidy,
      governmentSubsidy: totalGovernmentSubsidy,
      binhDuongSubsidy: totalBinhDuongSubsidy,
      finalCitizenPay: totalCitizenPay,
      breakdown: breakdownList
    });
  };

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackContent.trim()) {
      alert("Vui lòng nhập nội dung góp ý, phản ánh.");
      return;
    }
    setFeedbackSaving(true);
    setFeedbackSuccess(null);
    setTimeout(() => {
      const senderNameVal = feedbackAnonymous 
        ? "Công dân ẩn danh" 
        : (currentUser?.fullName || feedbackName.trim() || "Công dân");
      
      const rawPhone = currentUser?.phone || feedbackPhone.trim();
      const maskedPhoneVal = feedbackAnonymous || !rawPhone
        ? "Ẩn danh"
        : rawPhone.replace(/(\d{3})\d+(\d{3})/, "$1***$2");

      const newFeedback = {
        id: `FB-${String(feedbacks.length + 1).padStart(2, "0")}`,
        topic: feedbackTopic,
        name: senderNameVal,
        senderName: senderNameVal, // For consistency in UI rendering
        phone: maskedPhoneVal,
        quarter: feedbackQuarter,
        content: feedbackContent,
        imageUrl: feedbackImageUrl,
        status: "Đang xử lý",
        response: "Ủy ban MTTQ Phường đã tiếp nhận ý kiến phản ánh của bà con và đang khẩn trương chuyển giao cho cán bộ phụ trách khu phố xác minh, giải quyết. Tiến độ xử lý sẽ được cập nhật trong 24-48h tới.",
        date: new Date().toISOString().split("T")[0]
      };
      setFeedbacks(prev => [newFeedback, ...prev]);
      setFeedbackSaving(false);
      setFeedbackSubmitted(true);
      setFeedbackSuccess("Gửi phản ánh thành công! Ủy ban MTTQ Phường Phú Lợi sẽ khẩn trương xác minh.");
      setFeedbackContent("");
      setFeedbackName("");
      setFeedbackPhone("");
      setFeedbackImageUrl("");
      setTimeout(() => {
        setFeedbackSubmitted(false);
        setFeedbackSuccess(null);
      }, 5000);
    }, 1000);
  };

  const renderPIISecurityDashboard = () => {
    const getDynamicLogs = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString("vi-VN", { hour12: false });
      
      const common = [
        { time: timeStr, category: "MÃ HÓA", msg: "Áp dụng thuật toán che giấu thông tin nguồn (PII Protect Engine v2.0).", type: "info" },
        { time: timeStr, category: "HỆ THỐNG", msg: "Máy chủ an sinh Phú Lợi kết nối thành công với cổng dữ liệu dân cư.", type: "success" }
      ];

      switch (simulatedRole) {
        case "admin":
          return [
            { time: timeStr, category: "CẤP PHÉP", msg: "Phát hiện tài khoản Quản trị viên (Chủ tịch UBMTTQ). Cấp quyền giải mã dữ liệu PII toàn Phường Phú Lợi.", type: "success" },
            { time: timeStr, category: "TRUY CẬP", msg: "Quản trị viên đang xem chi tiết danh sách tất cả hồ sơ trợ giúp.", type: "info" },
            ...common
          ];
        case "officer":
          return [
            { time: timeStr, category: "PHÂN QUYỀN", msg: `Cán bộ phụ trách địa bàn [${simulatedOfficerQuarter}] đã đăng nhập. Cấp quyền giải mã hồ sơ thuộc địa bàn quản lý.`, type: "success" },
            { time: timeStr, category: "MÃ HÓA", msg: `Tự động ẩn thông tin liên hệ các hồ sơ thuộc khu phố khác ngoài địa bàn [${simulatedOfficerQuarter}].`, type: "warning" },
            ...common
          ];
        case "citizen":
          return [
            { time: timeStr, category: "XÁC THỰC", msg: currentUser ? `Xác thực thành công công dân [${currentUser.fullName}].` : "Công dân đăng nhập ẩn danh.", type: "success" },
            { time: timeStr, category: "PHÂN QUYỀN", msg: "Cấp quyền xem đầy đủ và chỉnh sửa hồ sơ thuộc sở hữu cá nhân.", type: "info" },
            { time: timeStr, category: "MÃ HÓA", msg: "Dữ liệu của tất cả người dân khác trong Phường được khóa bằng giao thức PII.", type: "warning" },
            ...common
          ];
        case "guest":
        default:
          return [
            { time: timeStr, category: "CẢNH BÁO", msg: "Khách vãng lai truy cập. Từ chối yêu cầu giải mã thông tin liên hệ.", type: "danger" },
            { time: timeStr, category: "MÃ HÓA", msg: "Áp dụng kỹ thuật mã hóa ký tự để bảo vệ danh tính bà con.", type: "warning" },
            ...common
          ];
      }
    };

    const logs = getDynamicLogs();

    return (
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 border border-blue-600 p-6 sm:p-8 rounded-3xl shadow-2xl space-y-6 relative overflow-hidden mt-8 text-white">
        {/* Background Glowing Orb Accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-100 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-blue-600/80 pb-6 relative z-10">
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold text-blue-400 tracking-[0.2em] uppercase flex items-center gap-1.5 font-sans">
              <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>PHƯƠNG ÁN AN TOÀN & BẢO MẬT THÔNG TIN CÁ NHÂN (PII PROTECTION PLAN)</span>
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white font-sans tracking-tight flex items-center gap-2">
              Giám Sát Phân Quyền & Giải Pháp Mã Hóa Dữ Liệu
            </h3>
            <p className="text-slate-400 text-xs font-light max-w-2xl leading-relaxed">
              Mô hình tính toán bảo mật đa lớp tự động xử lý và che giấu dữ liệu nhạy cảm (Họ tên, SĐT, Địa chỉ) tại tầng giao diện. Đảm bảo tuân thủ nghiêm ngặt Luật Bảo vệ dữ liệu cá nhân Nghị định 13/2023/NĐ-CP.
            </p>
          </div>

          {/* Dynamic Shield Status Badge */}
          <div className="bg-blue-700/80 border border-slate-700/80 rounded-2xl px-5 py-3 text-xs shadow-inner flex items-center space-x-3.5 shrink-0">
            <div className={`w-3.5 h-3.5 rounded-full ${
              simulatedRole === "admin" ? "bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.6)]" :
              simulatedRole === "officer" ? "bg-indigo-400 shadow-[0_0_12px_rgba(129,140,248,0.6)]" :
              simulatedRole === "citizen" ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]" :
              "bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.6)]"
            } animate-pulse`} />
            <div>
              <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Trạng thái bảo mật</div>
              <div className="font-extrabold mt-0.5 uppercase tracking-wide text-xs text-white">
                {simulatedRole === "admin" ? "CẤP 4: TOÀN QUYỀN (ADMIN)" :
                 simulatedRole === "officer" ? `CẤP 3: NỘI BỘ (${simulatedOfficerQuarter.toUpperCase()})` :
                 simulatedRole === "citizen" ? "CẤP 2: CÁ NHÂN (CÔNG DÂN)" :
                 "CẤP 1: MÃ HÓA (KHÁCH VÃNG LAI)"}
              </div>
            </div>
          </div>
        </div>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
          
          {/* Column 1: Interactive Security Matrix */}
          <div className="lg:col-span-7 bg-blue-700/40 border border-blue-600/60 p-5 rounded-2xl space-y-5">
            <div>
              <h4 className="font-bold text-sm text-slate-250 flex items-center space-x-2 font-sans">
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span>Bảng Tính Toán Phân Quyền Thông Tin Nhạy Cảm</span>
              </h4>
              <p className="text-slate-400 text-[10px] mt-1 font-light">
                Hệ thống tự động che giấu hoặc giải mã thông tin liên hệ của bà con dựa trên quyền hạn được kiểm tra ở thời điểm hiển thị.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-blue-600/80">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-blue-700/60 text-slate-400 font-bold border-b border-blue-600">
                    <th className="p-3">Vai trò hệ thống</th>
                    <th className="p-3 text-center">Họ và Tên</th>
                    <th className="p-3 text-center">Số điện thoại</th>
                    <th className="p-3 text-center">Địa chỉ cụ thể</th>
                    <th className="p-3 text-center">Tình trạng hỗ trợ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  <tr className={`transition-colors ${simulatedRole === "guest" ? "bg-blue-100 text-white font-semibold" : "text-slate-400"}`}>
                    <td className="p-3 flex items-center space-x-1.5 font-bold">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>Khách vãng lai</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-700 text-[10px] border border-slate-700/30 text-sky-500">
                        <Lock className="w-2.5 h-2.5 mr-1 text-sky-500" /> Mã hóa
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-700 text-[10px] border border-slate-700/30 text-sky-500">
                        <Lock className="w-2.5 h-2.5 mr-1 text-sky-500" /> Mã hóa
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-700 text-[10px] border border-slate-700/30 text-sky-500">
                        <Lock className="w-2.5 h-2.5 mr-1 text-sky-500" /> Ẩn chi tiết
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/10 text-[10px] text-emerald-400 border border-emerald-500/20">
                        <Check className="w-2.5 h-2.5 mr-1 text-emerald-400" /> Cho phép
                      </span>
                    </td>
                  </tr>

                  <tr className={`transition-colors ${simulatedRole === "citizen" ? "bg-emerald-500/10 text-white font-semibold" : "text-slate-400"}`}>
                    <td className="p-3 flex items-center space-x-1.5 font-bold">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Công dân sở tại</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-700 text-[10px] border border-slate-700/30 text-emerald-400">
                        <User className="w-2.5 h-2.5 mr-1 text-emerald-400" /> Riêng tư (Cá nhân)
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-700 text-[10px] border border-slate-700/30 text-emerald-400">
                        <User className="w-2.5 h-2.5 mr-1 text-emerald-400" /> Riêng tư (Cá nhân)
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-700 text-[10px] border border-slate-700/30 text-emerald-400">
                        <User className="w-2.5 h-2.5 mr-1 text-emerald-400" /> Riêng tư (Cá nhân)
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/10 text-[10px] text-emerald-400 border border-emerald-500/20">
                        <Check className="w-2.5 h-2.5 mr-1 text-emerald-400" /> Cho phép
                      </span>
                    </td>
                  </tr>

                  <tr className={`transition-colors ${simulatedRole === "officer" ? "bg-sky-500/10 text-white font-semibold" : "text-slate-400"}`}>
                    <td className="p-3 flex items-center space-x-1.5 font-bold">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <span>Cán bộ khu phố</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-sky-500/10 text-[10px] border border-indigo-500/20 text-indigo-300">
                        👮 Địa bàn phụ trách
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-sky-500/10 text-[10px] border border-indigo-500/20 text-indigo-300">
                        👮 Địa bàn phụ trách
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-sky-500/10 text-[10px] border border-indigo-500/20 text-indigo-300">
                        👮 Địa bàn phụ trách
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/10 text-[10px] text-emerald-400 border border-emerald-500/20">
                        <Check className="w-2.5 h-2.5 mr-1 text-emerald-400" /> Cho phép
                      </span>
                    </td>
                  </tr>

                  <tr className={`transition-colors ${simulatedRole === "admin" ? "bg-sky-500/10 text-white font-semibold" : "text-slate-400"}`}>
                    <td className="p-3 flex items-center space-x-1.5 font-bold">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span>Quản trị viên MTTQ</span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-sky-500/20 text-[10px] text-amber-400 border border-sky-500/30">
                        <Check className="w-2.5 h-2.5 mr-1 text-amber-450" /> Toàn quyền
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-sky-500/20 text-[10px] text-amber-400 border border-sky-500/30">
                        <Check className="w-2.5 h-2.5 mr-1 text-amber-450" /> Toàn quyền
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-sky-500/20 text-[10px] text-amber-400 border border-sky-500/30">
                        <Check className="w-2.5 h-2.5 mr-1 text-amber-450" /> Toàn quyền
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/10 text-[10px] text-emerald-400 border border-emerald-500/20">
                        <Check className="w-2.5 h-2.5 mr-1 text-emerald-400" /> Cho phép
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Column 2: Masking Strategy Controls & Real-Time Security Logs */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-6">
            
            {/* Masking Style Switcher */}
            <div className="bg-blue-700/40 border border-blue-600/60 p-5 rounded-2xl space-y-4">
              <div>
                <h4 className="font-bold text-sm text-slate-200 flex items-center space-x-2 font-sans">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  <span>Cấu Hình Tùy Chọn Che Giấu PII</span>
                </h4>
                <p className="text-slate-400 text-[10px] mt-1 font-light">
                  Lựa chọn cách thức mã hóa hiển thị danh tính khi người dùng không đủ quyền truy cập thông tin liên hệ gốc.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-sky-500/60 p-1 rounded-xl border border-blue-600/80">
                <motion.button
                  type="button"
                  onClick={() => setMaskingStrategy("initials")}
                  className={`py-2 px-1 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer ${
                    maskingStrategy === "initials" 
                      ? "bg-sky-500 text-white shadow-md shadow-sky-500/15" 
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Viết tắt hành chính
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => setMaskingStrategy("asterisks")}
                  className={`py-2 px-1 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer ${
                    maskingStrategy === "asterisks" 
                      ? "bg-sky-500 text-white shadow-md shadow-sky-500/15" 
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Mã hóa ký tự (*)
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => setMaskingStrategy("hidden")}
                  className={`py-2 px-1 rounded-lg text-[10px] font-bold text-center transition-all cursor-pointer ${
                    maskingStrategy === "hidden" 
                      ? "bg-sky-500 text-white shadow-md shadow-sky-500/15" 
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Khóa hoàn toàn
                </motion.button>
              </div>

              {/* Strategy Preview */}
              <div className="bg-sky-500/40 border border-slate-850 p-3 rounded-xl text-[10px] font-mono leading-relaxed space-y-1">
                <div className="text-slate-500 text-[9px] uppercase font-bold tracking-wider mb-1">Bản xem trước dữ liệu ẩn:</div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Họ tên:</span>
                  <span className="text-blue-400 font-semibold">{maskName("Nguyễn Văn Hùng", maskingStrategy)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">SĐT:</span>
                  <span className="text-blue-400 font-semibold">{maskPhone("0912345678", maskingStrategy)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Địa chỉ:</span>
                  <span className="text-blue-400 font-semibold">{maskAddress("12/4 Huỳnh Văn Lũy, KP3", QUARTERS_LIST[0].name, maskingStrategy)}</span>
                </div>
              </div>
            </div>

            {/* Real-time security access audit logs */}
            <div className="bg-blue-700/40 border border-blue-600/60 p-5 rounded-2xl flex-1 flex flex-col justify-between gap-3 min-h-[160px]">
              <div>
                <h4 className="font-bold text-sm text-slate-200 flex items-center space-x-2 font-sans">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  <span>Nhật Ký Giám Sát Truy Cập Thời Gian Thực</span>
                </h4>
                <p className="text-slate-400 text-[10px] mt-1 font-light">
                  Các yêu cầu truy cập thông tin liên hệ được hệ thống lưu vết minh bạch phục vụ giám sát và kiểm toán an toàn.
                </p>
              </div>

              <div className="bg-sky-500/80 rounded-xl p-3 border border-blue-600/80 font-mono text-[9px] leading-relaxed flex-1 space-y-2 overflow-y-auto max-h-[110px] custom-scrollbar">
                {logs.map((log, idx) => (
                  <div key={idx} className="flex items-start space-x-1.5 text-slate-300">
                    <span className="text-slate-500 shrink-0">[{log.time}]</span>
                    <span className={`px-1.5 py-0.2 rounded font-extrabold uppercase shrink-0 text-[8px] tracking-wide ${
                      log.type === "success" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                      log.type === "warning" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                      log.type === "danger" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                      "bg-blue-100 text-blue-400 border border-sky-500/20"
                    }`}>
                      {log.category}
                    </span>
                    <span className="flex-1 font-semibold text-slate-400">{log.msg}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    );
  };

  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqName.trim() || !reqPhone.trim() || !reqDescription.trim()) {
      alert("Vui lòng nhập đầy đủ Họ tên, Số điện thoại và mô tả hoàn cảnh khó khăn.");
      return;
    }
    onSubmitRequest({
      fullName: reqName,
      phone: reqPhone,
      address: reqAddress || "Phú Lợi, Thành phố Hồ Chí Minh",
      quarter: reqQuarter,
      category: reqCategory,
      description: reqDescription,
      email: reqEmail.trim() || undefined
    });
    setReqSubmitted(true);
    // Reset Form
    setReqName("");
    setReqPhone("");
    setReqEmail("");
    setReqAddress("");
    setReqDescription("");
    setTimeout(() => setReqSubmitted(false), 5000);
  };

  const handleJobApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobApplicantName || !jobApplicantPhone) {
      alert("Vui lòng điền Họ tên và Số điện thoại.");
      return;
    }
    setJobApplied(true);
    setTimeout(() => {
      setJobApplied(false);
      setSelectedJob(null);
      setJobApplicantName("");
      setJobApplicantPhone("");
      setJobApplicantSkills("");
    }, 4000);
  };

  const handleDonationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!donorName.trim() || !donateAmount || Number(donateAmount) <= 0) {
      alert("Vui lòng điền đầy đủ Tên nhà hảo tâm và số tiền ủng hộ hợp lệ.");
      return;
    }

    const donationDetails = onSubmitDonation({
      donorName,
      amount: Number(donateAmount),
      campaignId: selectedCampaign ? selectedCampaign.id : campaigns[0].id,
      message: donateMessage
    });

    setGeneratedCertificate(donationDetails);
    // Reset Form
    setDonorName("");
    setDonateAmount("");
    setDonateMessage("");
  };

  return (
    <section className="py-10 md:py-12 px-4 bg-transparent" id="services">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-8">
          <span className="text-[10px] font-bold text-primary-600 tracking-[0.2em] uppercase flex items-center justify-center space-x-1.5 font-sans">
            <HeartHandshake className="w-4 h-4 text-primary-500 animate-pulse" />
            <span>Cổng Dịch Vụ Trực Tuyến</span>
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 mt-2 font-serif">Hệ Thống Dịch Vụ <span className="text-primary-600 italic font-medium">An Sinh Số</span></h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-3 leading-relaxed font-light">
            Thực hiện trực tuyến các thủ tục đăng ký cứu trợ khẩn cấp, tra cứu tiến độ thẩm định hồ sơ, kết nối việc làm và vinh danh đóng góp của các nhà hảo tâm trên địa bàn phường Phú Lợi.
          </p>
        </div>

        {/* Tab Navigation buttons */}
        <div className="flex flex-wrap justify-center items-center gap-2 mb-6 bg-white/60 backdrop-blur-xl p-1.5 rounded-2xl max-w-7xl mx-auto border border-slate-200 shadow-2xl relative w-full">
          <motion.button
            onClick={() => setActiveTab("lookup")}
            className={`relative flex-1 min-w-[120px] lg:min-w-0 flex items-center justify-center space-x-2 py-4 px-2 sm:px-4 lg:px-2 xl:px-4 rounded-2xl text-[11px] sm:text-xs font-bold transition-all duration-300 uppercase tracking-widest select-none cursor-pointer ${
              activeTab === "lookup" ? "text-white font-black shadow-lg shadow-primary-500/25" : "text-slate-500 hover:text-primary-700 hover:bg-primary-50/50"
            }`}
            id="tab-lookup"
            whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
            {activeTab === "lookup" && (
              <motion.div
                layoutId="activeServiceTabBg"
                className="absolute inset-0 bg-gradient-to-r from-primary-600 to-blue-700 rounded-2xl"
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
              />
            )}
            <Search className={`relative z-10 w-4 h-4 ${activeTab === "lookup" ? "text-white" : "text-slate-600"}`} />
            <span className="relative z-10 font-sans">Tra Cứu & Đăng Ký</span>
          </motion.button>
          
          <motion.button
            onClick={() => setActiveTab("request")}
            className={`relative flex-1 min-w-[120px] lg:min-w-0 flex items-center justify-center space-x-2 py-4 px-2 sm:px-4 lg:px-2 xl:px-4 rounded-2xl text-[11px] sm:text-xs font-bold transition-all duration-300 uppercase tracking-widest select-none cursor-pointer ${
              activeTab === "request" ? "text-white font-black shadow-lg shadow-primary-500/25" : "text-slate-500 hover:text-primary-700 hover:bg-primary-50/50"
            }`}
            id="tab-request"
            whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
            {activeTab === "request" && (
              <motion.div
                layoutId="activeServiceTabBg"
                className="absolute inset-0 bg-gradient-to-r from-primary-600 to-blue-700 rounded-2xl"
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
              />
            )}
            <ShieldAlert className={`relative z-10 w-4 h-4 ${activeTab === "request" ? "text-white" : "text-slate-600"}`} />
            <span className="relative z-10 font-sans">Đăng Ký Nhận Cứu Trợ</span>
          </motion.button>

          <motion.button
            onClick={() => setActiveTab("job")}
            className={`relative flex-1 min-w-[120px] lg:min-w-0 flex items-center justify-center space-x-2 py-4 px-2 sm:px-4 lg:px-2 xl:px-4 rounded-2xl text-[11px] sm:text-xs font-bold transition-all duration-300 uppercase tracking-widest select-none cursor-pointer ${
              activeTab === "job" ? "text-white font-black shadow-lg shadow-primary-500/25" : "text-slate-500 hover:text-primary-700 hover:bg-primary-50/50"
            }`}
            id="tab-job"
            whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
            {activeTab === "job" && (
              <motion.div
                layoutId="activeServiceTabBg"
                className="absolute inset-0 bg-gradient-to-r from-primary-600 to-blue-700 rounded-2xl"
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
              />
            )}
            <Briefcase className={`relative z-10 w-4 h-4 ${activeTab === "job" ? "text-white" : "text-slate-600"}`} />
            <span className="relative z-10 font-sans">Việc Làm An Sinh</span>
          </motion.button>

          <motion.button
            onClick={() => setActiveTab("charity")}
            className={`relative flex-1 min-w-[120px] lg:min-w-0 flex items-center justify-center space-x-2 py-4 px-2 sm:px-4 lg:px-2 xl:px-4 rounded-2xl text-[11px] sm:text-xs font-bold transition-all duration-300 uppercase tracking-widest select-none cursor-pointer ${
              activeTab === "charity" ? "text-white font-black shadow-lg shadow-primary-500/25" : "text-slate-500 hover:text-primary-700 hover:bg-primary-50/50"
            }`}
            id="tab-charity"
            whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
            {activeTab === "charity" && (
              <motion.div
                layoutId="activeServiceTabBg"
                className="absolute inset-0 bg-gradient-to-r from-primary-600 to-blue-700 rounded-2xl"
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
              />
            )}
            <Heart className={`relative z-10 w-4 h-4 ${activeTab === "charity" ? "text-white" : "text-slate-600"}`} />
            <span className="relative z-10 font-sans">Nhà Hảo Tâm & Sổ Vàng</span>
          </motion.button>



          <motion.button
            onClick={() => setActiveTab("survey")}
            className={`relative flex-1 min-w-[120px] lg:min-w-0 flex items-center justify-center space-x-2 py-4 px-2 sm:px-4 lg:px-2 xl:px-4 rounded-2xl text-[11px] sm:text-xs font-bold transition-all duration-300 uppercase tracking-widest select-none cursor-pointer ${
              activeTab === "survey" ? "text-white font-black shadow-lg shadow-primary-500/25" : "text-slate-500 hover:text-primary-700 hover:bg-primary-50/50"
            }`}
            id="tab-survey"
            whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
            {activeTab === "survey" && (
              <motion.div
                layoutId="activeServiceTabBg"
                className="absolute inset-0 bg-gradient-to-r from-primary-600 to-blue-700 rounded-2xl"
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
              />
            )}
            <Vote className={`relative z-10 w-4 h-4 ${activeTab === "survey" ? "text-white" : "text-slate-600"}`} />
            <span className="relative z-10 font-sans">Khảo Sát Nhanh</span>
          </motion.button>

          <motion.button
            onClick={() => setActiveTab("volunteer")}
            className={`relative flex-1 min-w-[120px] lg:min-w-0 flex items-center justify-center space-x-2 py-4 px-2 sm:px-4 lg:px-2 xl:px-4 rounded-2xl text-[11px] sm:text-xs font-bold transition-all duration-300 uppercase tracking-widest select-none cursor-pointer ${
              activeTab === "volunteer" ? "text-white font-black shadow-lg shadow-primary-500/25" : "text-slate-500 hover:text-primary-700 hover:bg-primary-50/50"
            }`}
            id="tab-volunteer"
            whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
            {activeTab === "volunteer" && (
              <motion.div
                layoutId="activeServiceTabBg"
                className="absolute inset-0 bg-gradient-to-r from-primary-600 to-blue-700 rounded-2xl"
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
              />
            )}
            <HeartHandshake className={`relative z-10 w-4 h-4 ${activeTab === "volunteer" ? "text-white" : "text-slate-600"}`} />
            <span className="relative z-10 font-sans">Đăng Ký Tình Nguyện</span>
          </motion.button>

          <motion.button
            onClick={() => setActiveTab("bookmarks")}
            className={`relative flex-1 min-w-[120px] lg:min-w-0 flex items-center justify-center space-x-2 py-3.5 px-2 sm:px-4 lg:px-2 xl:px-4 rounded-xl text-[11px] sm:text-xs font-bold transition-all duration-300 uppercase tracking-wider select-none cursor-pointer ${
              activeTab === "bookmarks" ? "text-white font-black" : "text-slate-500 hover:text-sky-700 hover:bg-sky-50/50"
            }`}
            id="tab-bookmarks"
           whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.97 }}>
            {activeTab === "bookmarks" && (
              <motion.div
                layoutId="activeServiceTabBg"
                className="absolute inset-0 bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500 rounded-xl shadow-[0_4px_15px_rgba(14,165,233,0.3)]"
                transition={{ type: "spring", stiffness: 350, damping: 28 }}
              />
            )}
            <Bookmark className={`relative z-10 w-4 h-4 ${activeTab === "bookmarks" ? "text-white" : "text-slate-850"}`} />
            <span className="relative z-10 font-sans">Mục Yêu Thích</span>
          </motion.button>
        </div>

        {/* Tab Contents */}
        <div className="bg-white/80 backdrop-blur-3xl border border-primary-100 rounded-[40px] p-6 sm:p-10 shadow-[0_40px_80px_-20px_rgba(37,99,235,0.1)] min-h-[600px] relative overflow-hidden">
          {/* Subtle background glow inside container */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary-50/50 blur-[100px] pointer-events-none" />
          
          {/* TAB 1: LOOKUP & CALCULATOR */}
          {activeTab === "lookup" && (
            <div className="space-y-10 animate-fadeIn relative z-10" id="content-lookup">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
              {/* Policy & BHYT Calculator Form */}
              <div className="lg:col-span-7 bg-white/50 backdrop-blur-md border border-primary-50 p-8 rounded-[32px] shadow-sm hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-500 space-y-8">
                
                {/* Sub-tab Toggle */}
                <div className="flex bg-slate-100/80 backdrop-blur-sm p-1.5 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setLookupSubTab("pension")}
                    className={`flex-1 py-3 rounded-xl text-xs font-black text-center transition-all cursor-pointer uppercase tracking-widest ${
                      lookupSubTab === "pension" 
                        ? "bg-white text-primary-600 shadow-sm" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Trợ Cấp Hàng Tháng
                  </button>
                  <button
                    type="button"
                    onClick={() => setLookupSubTab("bhyt")}
                    className={`flex-1 py-3 rounded-xl text-xs font-black text-center transition-all cursor-pointer uppercase tracking-widest ${
                      lookupSubTab === "bhyt" 
                        ? "bg-white text-primary-600 shadow-sm" 
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Tính BHYT Hộ Gia Đình
                  </button>
                </div>

                {lookupSubTab === "pension" ? (
                  <>
                    <div className="border-b border-slate-200 pb-3">
                      <h3 className="font-bold text-base text-slate-800 flex items-center space-x-2 font-sans">
                        <Sparkles className="w-5 h-5 text-slate-800" />
                        <span>Khảo Sát Đủ Điều Kiện Trợ Cấp Hàng Tháng</span>
                      </h3>
                      <p className="text-slate-500 text-xs mt-1 font-light">
                        Nhập nhanh thông tin của bà con để hệ thống tự động đánh giá quyền lợi theo Nghị định 20/2021/NĐ-CP (Nghị định chính sách trợ giúp xã hội đối với bảo trợ xã hội).
                      </p>
                    </div>

                    <form onSubmit={handleCalculatePolicy} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Độ tuổi của người khảo sát</label>
                          <input 
                            type="number" 
                            value={calcAge} 
                            onChange={(e) => setCalcAge(e.target.value ? Number(e.target.value) : "")}
                            placeholder="Ví dụ: 82, 12,..."
                            className="w-full bg-blue-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500/50 transition-colors placeholder:text-slate-500 font-medium"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Thuộc diện hộ gia đình nào?</label>
                          <select 
                            value={calcIncome} 
                            onChange={(e) => setCalcIncome(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500/50 transition-colors font-medium bg-white border-slate-200 text-slate-800"
                          >
                            <option value="normal" className="bg-white text-slate-800">Gia đình bình thường</option>
                            <option value="poor" className="bg-white text-slate-800">Hộ Nghèo / Hộ Cận Nghèo</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Mức độ khuyết tật (nếu có)</label>
                          <select 
                            value={calcDisability} 
                            onChange={(e) => setCalcDisability(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500/50 transition-colors font-medium bg-white border-slate-200 text-slate-800"
                          >
                            <option value="none" className="bg-white text-slate-800">Không khuyết tật</option>
                            <option value="severe" className="bg-white text-slate-800">Khuyết tật Nặng (được xác nhận)</option>
                            <option value="special" className="bg-white text-slate-800">Khuyết tật Đặc biệt nặng</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Có lương hưu hoặc BHXH hàng tháng?</label>
                          <select 
                            value={calcPension} 
                            onChange={(e) => setCalcPension(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500/50 transition-colors font-medium bg-white border-slate-200 text-slate-800"
                          >
                            <option value="yes" className="bg-white text-slate-800">Có lương hưu / Có trợ cấp BHXH</option>
                            <option value="no" className="bg-white text-slate-800">Không có lương hưu / Trợ cấp nào</option>
                          </select>
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        className="w-full bg-sky-500 hover:bg-slate-500 text-white font-bold py-3.5 rounded-xl transition duration-300 text-xs uppercase tracking-wider shadow-md border border-slate-200 flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <span>Khảo Sát Ngay</span>
                        <ChevronRight className="w-4 h-4 text-white" />
                      </button>
                    </form>

                    {calcResult && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-50 border border-sky-500/20 rounded-2xl p-4 text-xs sm:text-sm text-slate-500 leading-relaxed backdrop-blur-sm"
                      >
                        <div className="font-bold text-slate-800 mb-1.5 text-[10px] uppercase tracking-wider flex items-center space-x-1 font-sans">
                          <Sparkles className="w-4 h-4 shrink-0 text-slate-800" />
                          <span>KẾT QUẢ ĐÁNH GIÁ CHÍNH SÁCH</span>
                        </div>
                        {calcResult}
                      </motion.div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="border-b border-slate-200 pb-3">
                      <h3 className="font-bold text-base text-slate-800 flex items-center space-x-2 font-sans">
                        <Heart className="w-5 h-5 text-slate-800" />
                        <span>Công Cụ Tính Phí BHYT Hộ Gia Đình</span>
                      </h3>
                      <p className="text-slate-500 text-xs mt-1 font-light">
                        Tự động tính giảm trừ bảo hiểm xã hội theo Nghị định 24/2024/NĐ-CP (Áp dụng mức lương cơ sở mới <strong className="text-slate-700">2.340.000đ</strong>) và các chính sách hỗ trợ bổ sung của Thành phố Hồ Chí Minh.
                      </p>
                    </div>

                    <form onSubmit={handleCalculateBHYT} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Số thành viên hộ gia đình tham gia</label>
                          <select 
                            value={bhytMembers} 
                            onChange={(e) => setBhytMembers(Number(e.target.value))}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500/50 transition-colors font-medium bg-white border-slate-200 text-slate-800"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                              <option key={n} value={n} className="bg-white text-slate-800">{n} người</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Nhóm đối tượng ưu tiên</label>
                          <select 
                            value={bhytSubject} 
                            onChange={(e) => setBhytSubject(e.target.value as any)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500/50 transition-colors font-medium bg-white border-slate-200 text-slate-800"
                          >
                            <option value="normal" className="bg-white text-slate-800">Hộ gia đình thông thường</option>
                            <option value="near_poor" className="bg-white text-slate-800">Hộ cận nghèo (Thành phố Hồ Chí Minh hỗ trợ 100%)</option>
                            <option value="poor" className="bg-white text-slate-800">Hộ nghèo (Nhà nước cấp miễn phí)</option>
                            <option value="student" className="bg-white text-slate-800">Học sinh / Sinh viên (TW hỗ trợ 30%)</option>
                            <option value="children_under_6" className="bg-white text-slate-800">Trẻ em dưới 6 tuổi (Cấp miễn phí)</option>
                            <option value="social_protection" className="bg-white text-slate-800">Đối tượng Bảo trợ xã hội (Cấp miễn phí)</option>
                          </select>
                        </div>
                      </div>

                      <button 
                        type="submit" 
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-xl transition duration-300 text-xs uppercase tracking-wider shadow-md border border-slate-200 flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        <span>Tính Toán Chi Phí</span>
                        <ChevronRight className="w-4 h-4 text-white" />
                      </button>
                    </form>

                    {bhytResult && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 text-xs space-y-4 backdrop-blur-sm text-left"
                      >
                        <div className="font-bold text-emerald-600 mb-1.5 text-[10px] uppercase tracking-wider flex items-center space-x-1.5 font-sans">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                          <span>CHI TIẾT MỨC ĐÓNG BHYT HỘ GIA ĐÌNH</span>
                        </div>

                        {/* Breakdown Summary */}
                        <div className="grid grid-cols-2 gap-4 border-b border-slate-200 pb-3">
                          <div>
                            <div className="text-slate-500 text-[10px] uppercase">Tổng mức đóng gốc:</div>
                            <div className="text-slate-800 font-bold text-sm mt-0.5">
                              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(bhytResult.totalPremiumBeforeSubsidy)}
                            </div>
                          </div>
                          <div>
                            <div className="text-slate-500 text-[10px] uppercase">Thực tế gia đình nộp:</div>
                            <div className="text-emerald-500 font-black text-sm mt-0.5">
                              {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(bhytResult.finalCitizenPay)}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1 text-slate-500">
                          {bhytResult.governmentSubsidy > 0 && (
                            <div className="flex justify-between">
                              <span>Trung ương hỗ trợ:</span>
                              <span className="font-semibold text-slate-800">-{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(bhytResult.governmentSubsidy)}</span>
                            </div>
                          )}
                          {bhytResult.binhDuongSubsidy > 0 && (
                            <div className="flex justify-between">
                              <span>Thành phố Hồ Chí Minh hỗ trợ đặc thù:</span>
                              <span className="font-semibold text-teal-500">-{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(bhytResult.binhDuongSubsidy)}</span>
                            </div>
                          )}
                          <div className="flex justify-between text-[10px] font-mono border-t border-dashed border-slate-200 pt-1">
                            <span>Lương cơ sở áp dụng:</span>
                            <span>2.340.000 VND</span>
                          </div>
                        </div>

                        {/* Person-by-Person Breakdown Table */}
                        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 text-slate-500 text-[9px] uppercase tracking-wider">
                                <th className="p-2 border-b border-slate-200">Thành viên</th>
                                <th className="p-2 border-b border-slate-200 text-center">Tỷ lệ giảm</th>
                                <th className="p-2 border-b border-slate-200 text-right">Phí gốc</th>
                                <th className="p-2 border-b border-slate-200 text-right">Thực nộp</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-[11px] font-medium text-slate-800">
                              {bhytResult.breakdown.map((item, index) => {
                                let label = `Người thứ ${item.personIndex}`;
                                let discountStr = "100% (Gốc)";
                                if (item.personIndex === 2) discountStr = "Giảm 30%";
                                if (item.personIndex === 3) discountStr = "Giảm 40%";
                                if (item.personIndex === 4) discountStr = "Giảm 50%";
                                if (item.personIndex >= 5) discountStr = "Giảm 60%";

                                return (
                                  <tr key={index} className="hover:bg-slate-50/50">
                                    <td className="p-2 font-semibold text-slate-850">{label}</td>
                                    <td className="p-2 text-center text-[10px] text-slate-500">{discountStr}</td>
                                    <td className="p-2 text-right text-slate-500 font-mono">
                                      {new Intl.NumberFormat("vi-VN").format(item.costBeforeSubsidy)}đ
                                    </td>
                                    <td className="p-2 text-right text-emerald-500 font-bold font-mono">
                                      {new Intl.NumberFormat("vi-VN").format(item.finalPay)}đ
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Interactive registration button */}
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              alert(`Đăng ký thành công! Đội ngũ cán bộ UBMTTQ Việt Nam Phường Phú Lợi sẽ liên hệ qua số điện thoại đăng ký của quý bà con để hướng dẫn hoàn tất hồ sơ và nhận thẻ BHYT vật lý tại Trụ sở Ủy ban MTTQ Việt Nam Phường Phú Lợi.`);
                            }}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-2.5 rounded-xl text-center text-xs uppercase tracking-wider block shadow-sm cursor-pointer"
                          >
                            Đăng Ký Cấp Mới / Gia Hạn Trực Tuyến
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </div>

              {/* Citizen Lookup Tool */}
              <div className="lg:col-span-5 bg-white/60 bg-slate-50/20 border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-6">
                <div>
                  <div className="border-b border-slate-200 pb-3">
                    <h3 className="font-bold text-base text-slate-800 flex items-center space-x-2 font-sans">
                      <Search className="w-5 h-5 text-slate-800" />
                      <span>Tra Cứu Hồ Sơ & Đơn Thư</span>
                    </h3>
                    <p className="text-slate-500 text-xs mt-1 font-light">
                      Tra cứu tình trạng giải quyết đơn hỗ trợ hoặc tình trạng xét duyệt diện ưu tiên bằng Họ tên hoặc Số điện thoại.
                    </p>
                  </div>

                  {currentUser && (
                    <div className="mt-3 bg-blue-50 border border-sky-500/10 p-3.5 rounded-xl">
                      <p className="text-[11px] text-slate-500 mb-2">
                        Đăng nhập: <strong className="text-slate-800">{currentUser.fullName}</strong>
                      </p>
                      <button
                        type="button"
                        onClick={async () => {
                          setLookupQuery(currentUser.phone);
                          setSearching(true);
                          try {
                            const matched = await lookupRequestsFromFirestore(currentUser.phone);
                            setSearchResult(matched);
                          } catch (err) {
                            const matched = requests.filter(r => r.phone === currentUser.phone);
                            setSearchResult(matched);
                          } finally {
                            setSearching(false);
                          }
                        }}
                        className="w-full bg-sky-500 hover:bg-slate-500 text-white font-bold py-2 px-3 rounded-lg text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all shadow-sm"
                      >
                        <UserCheck className="w-3.5 h-3.5 text-white" />
                        Xem các hồ sơ trợ giúp của tôi
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleLookupSearch} className="mt-4 flex space-x-2">
                    <input 
                      type="text" 
                      value={lookupQuery} 
                      onChange={(e) => setLookupQuery(e.target.value)}
                      placeholder="Nhập Họ Tên hoặc CMND/CCCD/SĐT..."
                      className="flex-1 bg-blue-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500/50 transition-colors placeholder:text-slate-500 font-medium"
                    />
                    <button 
                      type="submit" 
                      disabled={searching}
                      className="bg-sky-500 hover:bg-slate-500 disabled:bg-blue-700 disabled:text-slate-450 text-white p-2.5 rounded-xl transition duration-150 shrink-0 shadow-sm flex items-center justify-center min-w-[44px]"
                    >
                      {searching ? (
                        <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Search className="w-5 h-5 text-white" />
                      )}
                    </button>
                  </form>

                  <div className="mt-6 space-y-3 min-h-[150px]">
                    {searching ? (
                      <div className="h-full flex flex-col items-center justify-center py-12 text-center text-slate-500">
                        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
                        <p className="text-xs font-semibold animate-pulse text-slate-800/80">Đang tìm kiếm cơ sở dữ liệu an sinh...</p>
                      </div>
                    ) : searchResult === null ? (
                      <div className="h-full flex flex-col items-center justify-center py-6 text-center text-slate-450 italic">
                        <FileText className="w-10 h-10 text-slate-500 stroke-1 mb-2 animate-pulse" />
                        <p className="text-xs font-light">Vui lòng nhập Họ tên, CMND/CCCD hoặc Số điện thoại để tra cứu hồ sơ.</p>
                      </div>
                    ) : searchResult.length === 0 ? (
                      <div className="bg-blue-50/500/10 text-red-400 text-xs p-4 rounded-xl border border-red-500/20 font-light leading-relaxed">
                        Không tìm thấy hồ sơ nào trùng khớp với từ khóa "{lookupQuery}". Xin quý bà con vui lòng kiểm tra lại họ tên hoặc số điện thoại.
                      </div>
                    ) : (
                      searchResult.map((r, rIdx) => {
                        const canView = canViewSensitiveInfo(
                          currentUser,
                          r.quarter,
                          r.userId,
                          r.fullName,
                          r.phone,
                          { role: simulatedRole, officerQuarter: simulatedOfficerQuarter }
                        );

                        return (
                          <motion.div 
                            key={r.id} 
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 22, delay: rIdx * 0.05 }}
                            whileHover={{ y: -3, scale: 1.01, boxShadow: "0 12px 24px -8px rgba(37,99,235,0.08)" }}
                            className="bg-white border border-slate-200 rounded-2xl p-5 text-xs space-y-3 shadow-[0_2px_8px_rgba(37,99,235,0.01)] transition-colors duration-300 hover:border-sky-500/35 relative overflow-hidden"
                          >
                            <div className="flex justify-between items-center flex-wrap gap-1">
                              <div className="flex items-center space-x-1.5 flex-wrap">
                                <span className="font-bold text-slate-800 text-sm">
                                  {canView ? r.fullName : maskName(r.fullName, maskingStrategy)}
                                </span>
                                
                                {canView ? (
                                  <span className="inline-flex items-center space-x-0.5 bg-emerald-500/10 text-emerald-600 text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider border border-emerald-500/20">
                                    <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
                                    <span>{simulatedRole === "admin" ? "ADMIN" : simulatedRole === "officer" ? `CB ${r.quarter}` : "CÔNG DÂN"}</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center space-x-0.5 bg-slate-100 text-slate-450 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-slate-200/50">
                                    <span>🔒 BẢO MẬT</span>
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-slate-450 text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">{r.id}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-500">
                              <div>SĐT: <span className="font-mono font-medium text-slate-500">{canView ? r.phone : maskPhone(r.phone, maskingStrategy)}</span></div>
                              <div>Khu phố: <span className="font-medium text-slate-500">{r.quarter}</span></div>
                              <div className="col-span-2">Dịch vụ: <span className="font-medium text-slate-800/90">{r.category}</span></div>
                            </div>
                            <p className="text-slate-500 text-[11px] italic bg-slate-50/20 p-2.5 rounded border border-slate-200">"{r.description}"</p>
                            
                            {/* LỘ TRÌNH XỬ LÝ HỒ SƠ AN SINH SỐ */}
                            <div className="py-3 px-2 bg-slate-50/50 rounded-2xl border border-slate-200/80 my-3 text-left">
                              <div className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider mb-2.5 flex items-center justify-between">
                                <span>Lộ trình giải quyết hồ sơ an sinh</span>
                                <span className="font-mono text-slate-500 font-bold bg-slate-100 px-1.5 py-0.5 rounded">Bước {
                                  r.status === RequestStatus.COMPLETED ? "4/4" :
                                  r.status === RequestStatus.APPROVED ? "3/4" :
                                  r.status === RequestStatus.VERIFYING ? "2/4" : "1/4"
                                }</span>
                              </div>
                              
                              <div className="relative flex justify-between items-center w-full px-2">
                                {/* Connecting line */}
                                <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -translate-y-1/2 z-0 rounded-full">
                                  <div 
                                    className="h-full bg-gradient-to-r from-sky-500 to-emerald-500 transition-all duration-500 rounded-full"
                                    style={{ 
                                      width: r.status === RequestStatus.COMPLETED ? "100%" :
                                             r.status === RequestStatus.APPROVED ? "66%" :
                                             r.status === RequestStatus.VERIFYING ? "33%" : "0%"
                                    }}
                                  />
                                </div>
                                
                                {/* 4 Steps */}
                                {[
                                  { label: "Gửi đơn", status: RequestStatus.SUBMITTED, icon: Send, activeBg: "bg-blue-500 text-white ring-blue-100" },
                                  { label: "Xác minh", status: RequestStatus.VERIFYING, icon: Activity, activeBg: "bg-amber-500 text-white ring-amber-100" },
                                  { label: "Duyệt cấp", status: RequestStatus.APPROVED, icon: ShieldCheck, activeBg: "bg-sky-500 text-white ring-sky-100" },
                                  { label: "Trao nhận", status: RequestStatus.COMPLETED, icon: Gift, activeBg: "bg-emerald-500 text-white ring-emerald-100" }
                                ].map((step, idx) => {
                                  const stepOrder = idx + 1;
                                  const currentOrder = 
                                    r.status === RequestStatus.COMPLETED ? 4 :
                                    r.status === RequestStatus.APPROVED ? 3 :
                                    r.status === RequestStatus.VERIFYING ? 2 : 1;
                                  
                                  const isCompleted = stepOrder < currentOrder;
                                  const isActive = stepOrder === currentOrder;
                                  
                                  const StepIcon = step.icon;
                                  
                                  return (
                                    <div key={idx} className="flex flex-col items-center relative z-10 flex-1">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 border shadow-xs ${
                                        isCompleted 
                                          ? "bg-emerald-500 border-emerald-500 text-white shadow-emerald-100" 
                                          : isActive 
                                            ? `${step.activeBg} border-transparent animate-pulse ring-4` 
                                            : "bg-white border-slate-200 text-slate-400"
                                      }`}>
                                        <StepIcon className="w-3.5 h-3.5 shrink-0" />
                                      </div>
                                      <span className={`text-[9px] font-extrabold mt-1.5 tracking-tight ${
                                        isCompleted ? "text-emerald-600" : isActive ? "text-slate-800 font-black" : "text-slate-400 font-medium"
                                      }`}>
                                        {step.label}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Progress Status Note */}
                              <div className="mt-3 pt-2 border-t border-slate-200/50 text-[10px] text-slate-500 font-light leading-normal bg-white/40 p-2 rounded-xl border border-slate-100">
                                <span className="font-bold text-slate-700">Cập nhật mới nhất: </span>
                                {r.status === RequestStatus.SUBMITTED && "Hồ sơ cứu trợ trực tuyến đã tiếp nhận thành công trên hệ thống Phú Lợi Số, đang trong danh sách chờ phân công cán bộ khu phố xuống xác minh thực tế."}
                                {r.status === RequestStatus.VERIFYING && "Cán bộ ban chỉ đạo Mặt trận Tổ quốc và Khu phố đang tiến hành kiểm tra, xác minh hoàn cảnh gia đình thực tế tại địa bàn."}
                                {r.status === RequestStatus.APPROVED && "Ban chỉ đạo Chương trình An sinh xã hội số phường đã họp xét duyệt hồ sơ đạt chuẩn cứu trợ khẩn cấp."}
                                {r.status === RequestStatus.COMPLETED && "Đã trao hỗ trợ / hiện vật / sinh kế đến tay công dân. Cảm ơn bà con và các đơn vị đồng hành."}
                              </div>
                            </div>

                            <div className="flex justify-between items-center pt-1 border-t border-slate-200 flex-wrap gap-1">
                              <span className="text-[10px] text-slate-450">Gửi: {new Date(r.createdAt).toLocaleDateString("vi-VN")}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                r.status === RequestStatus.COMPLETED ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                                r.status === RequestStatus.APPROVED ? "bg-sky-100 text-slate-800 border border-sky-500/20" :
                                r.status === RequestStatus.VERIFYING ? "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20" :
                                "bg-blue-100 text-slate-500"
                              }`}>{r.status}</span>
                            </div>
                            {r.notes && (
                              <div className="text-[10px] bg-blue-50 text-slate-800 p-2.5 rounded-lg border border-sky-500/10">
                                <strong>Ủy ban MTTQ phản hồi:</strong> {r.notes}
                              </div>
                            )}
                          </motion.div>
                        );
                      }))}
                    </div>
                </div>

                <div className="bg-blue-50/50 p-4 rounded-xl border border-slate-200 text-[11px] text-slate-500 leading-relaxed font-light mt-4 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <strong>🔒 Bảo mật thông tin (PII):</strong> Hệ thống Cổng An sinh xã hội số tự động mã hóa và bảo vệ danh tính của bà con. 
                  </div>
                  
                </div>
              </div>
            </div>
          </div>
        )}

          {/* TAB 2: REQUEST FORM */}
          {activeTab === "request" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="content-request">
              {/* Form to submit request */}
              <div className="lg:col-span-7 bg-white/60 bg-slate-50/20 border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm space-y-6">
                <div className="border-b border-slate-200 pb-3.5">
                  <h3 className="font-bold text-base text-slate-800 flex items-center space-x-2 font-sans">
                    <ShieldAlert className="w-5.5 h-5.5 text-slate-800" />
                    <span>Nộp Đơn Khai Trợ Giúp Khẩn Cấp</span>
                  </h3>
                  <p className="text-slate-500 text-xs mt-1 font-light">
                    Bà con gặp hoàn cảnh khó khăn đột xuất, cần hỗ trợ lương thực, thẻ BHYT, học bổng hoặc gia đình gặp thiên tai hoạn nạn vui lòng điền mẫu đơn này. Phường sẽ liên hệ xác minh trong 24h.
                  </p>
                </div>

                {reqSubmitted ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-emerald-500/5 border border-emerald-500/25 text-emerald-400 p-6 rounded-2xl text-center space-y-4 backdrop-blur-sm"
                  >
                    <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
                    <div>
                      <h4 className="font-bold text-sm tracking-wider uppercase">GỬI TỜ KHAI THÀNH CÔNG!</h4>
                      <p className="text-xs mt-1 font-light leading-relaxed text-slate-500">
                        Hệ thống đã ghi nhận hồ sơ trực tuyến của bà con. Thông tin đã được chuyển giao cho Ban chỉ đạo An sinh xã hội Khu phố & Cán bộ Lao động - Thương binh & Xã hội phường thẩm định.
                      </p>
                    </div>
                    <div className="text-xs bg-slate-50/40 p-3 rounded-xl border border-slate-200 max-w-sm mx-auto font-mono text-emerald-400">
                      Mã hồ sơ: REQ-{requests.length + 1}
                    </div>
                    <button 
                      onClick={() => setReqSubmitted(false)}
                      className="text-xs font-bold text-slate-800 underline hover:text-sky-500 block mx-auto transition-colors"
                    >
                      Tiếp tục nộp tờ khai khác
                    </button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleRequestSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Họ và tên người cần trợ giúp *</label>
                        <input 
                          type="text" 
                          required
                          value={reqName} 
                          onChange={(e) => setReqName(e.target.value)}
                          placeholder="Nhập họ và tên đầy đủ..."
                          className="w-full bg-blue-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500/50 transition-colors placeholder:text-slate-500 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Số điện thoại liên hệ trực tiếp *</label>
                        <input 
                          type="tel" 
                          required
                          value={reqPhone} 
                          onChange={(e) => setReqPhone(e.target.value)}
                          placeholder="Nhập số điện thoại..."
                          className="w-full bg-blue-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500/50 transition-colors placeholder:text-slate-500 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Email nhận thông báo (nếu có)</label>
                        <input 
                          type="email" 
                          value={reqEmail} 
                          onChange={(e) => setReqEmail(e.target.value)}
                          placeholder="Nhập email để nhận kết quả..."
                          className="w-full bg-blue-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500/50 transition-colors placeholder:text-slate-500 font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Địa chỉ cụ thể (Tổ, số nhà, đường) *</label>
                        <input 
                          type="text" 
                          required
                          value={reqAddress} 
                          onChange={(e) => setReqAddress(e.target.value)}
                          placeholder="Ví dụ: Số 24 hẻm 12, đường Phú Lợi, tổ 5"
                          className="w-full bg-blue-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500/50 transition-colors placeholder:text-slate-500 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Thuộc Khu phố *</label>
                        <select 
                          value={reqQuarter} 
                          onChange={(e) => setReqQuarter(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500/50 transition-colors font-medium bg-white border-slate-200 text-slate-800"
                        >
                          {QUARTERS_LIST.map(kp => (
                            <option key={kp.id} value={kp.name} className="bg-white text-slate-800">{kp.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1.5">Hạng mục đề xuất hỗ trợ *</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[...Object.values(SupportCategory), ...(webConfig?.customCategories || [])].map(cat => (
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            key={cat}
                            type="button"
                            onClick={() => setReqCategory(cat)}
                            className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all duration-300 ${
                              reqCategory === cat 
                                ? "bg-sky-600/10 border-blue-600 text-slate-800 shadow-[0_2px_8px_rgba(37,99,235,0.1)]" 
                                : "bg-slate-50/20 border-slate-200 text-slate-500 hover:text-sky-700 hover:bg-sky-50/50"
                            }`}
                          >
                            {cat}
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Mô tả cụ thể gia cảnh và khó khăn *</label>
                      <textarea 
                        rows={3}
                        required
                        value={reqDescription} 
                        onChange={(e) => setReqDescription(e.target.value)}
                        placeholder="Quý bà con vui lòng mô tả chi tiết hoàn cảnh gia đình hiện tại (ví dụ: neo đơn, đau ốm, mất việc làm...) và mong muốn nhận hỗ trợ gì cụ thể."
                        className="w-full bg-blue-50/50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500/50 transition-colors placeholder:text-slate-500 font-light"
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full bg-sky-500 hover:bg-slate-500 text-white font-bold py-3.5 rounded-xl transition duration-300 text-xs uppercase tracking-wider shadow-md border border-slate-200 flex items-center justify-center space-x-2"
                    >
                      <Send className="w-4 h-4 text-white" />
                      <span>GỬI ĐƠN ĐĂNG KÝ TRỰC TUYẾN</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Real-time Tracking Panel */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white/60 bg-slate-50/20 border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                  <h4 className="font-bold text-sm text-slate-800 flex items-center space-x-1.5 font-sans">
                    <UserCheck className="w-5 h-5 text-slate-800" />
                    <span>Tiến độ Hồ sơ Khảo sát của Phường</span>
                  </h4>
                  <p className="text-xs text-slate-500 font-light">
                    Danh sách theo dõi hành trình thẩm định cứu trợ đang diễn ra công khai tại 14 Khu phố trên địa bàn Phường.
                  </p>

                  <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
                    {requests.map((r, rIdx) => {
                      const canView = canViewSensitiveInfo(
                        currentUser,
                        r.quarter,
                        r.userId,
                        r.fullName,
                        r.phone,
                        { role: simulatedRole, officerQuarter: simulatedOfficerQuarter }
                      );

                      return (
                        <motion.div 
                          key={r.id} 
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.35, delay: Math.min(10, rIdx) * 0.03 }}
                          whileHover={{ x: 3 }}
                          className="relative pl-5 border-l border-blue-200/50 pb-3 text-xs space-y-1.5 group/timeline-item cursor-pointer bg-white/40 hover:bg-blue-50/20 p-3 rounded-2xl border border-transparent hover:border-blue-100/40 transition-all shadow-xs"
                        >
                          {/* Dot indicator */}
                          <div className={`absolute -left-[5px] top-4.5 w-2.5 h-2.5 rounded-full border border-white transition-transform duration-300 group-hover/timeline-item:scale-125 ${
                            r.status === RequestStatus.COMPLETED ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" :
                            r.status === RequestStatus.APPROVED ? "bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]" :
                            "bg-sky-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                          }`} />

                          <div className="flex justify-between items-start gap-1 flex-wrap">
                            <div className="flex items-center space-x-1.5 flex-wrap">
                              <span className="font-bold text-slate-800 text-xs sm:text-sm group-hover/timeline-item:text-slate-800 transition-colors">
                                {canView ? r.fullName : maskName(r.fullName)}
                              </span>
                              
                              {/* Security Clearance Tag */}
                              {canView ? (
                                <span className="inline-flex items-center space-x-0.5 bg-emerald-500/10 text-emerald-600 text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider border border-emerald-500/20">
                                  <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
                                  <span>{simulatedRole === "admin" ? "ADMIN" : simulatedRole === "officer" ? `CB ${r.quarter}` : "CÔNG DÂN"}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-0.5 bg-slate-100 text-slate-450 text-[8px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider border border-slate-200/50">
                                  <span>🔒 BẢO MẬT</span>
                                </span>
                              )}
                            </div>
                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold shadow-xs ${
                              r.status === RequestStatus.COMPLETED ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                              r.status === RequestStatus.APPROVED ? "bg-sky-500/10 text-sky-600 border border-sky-500/20" :
                              "bg-sky-500/10 text-sky-600 border border-sky-500/20"
                            }`}>{r.status}</span>
                          </div>

                          {/* Contact Info (PII) */}
                          <div className="flex items-center space-x-3 text-[10px] text-slate-500 mt-1 font-medium flex-wrap">
                            <span className="flex items-center gap-1 font-mono">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {canView ? r.phone : maskPhone(r.phone, maskingStrategy)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {canView ? r.address : maskAddress(r.address, r.quarter, maskingStrategy)}
                            </span>
                          </div>

                          <p className="text-slate-500 text-[10px] leading-tight font-light mt-1">
                            {r.quarter} • Hỗ trợ: <span className="text-slate-800/90 font-semibold bg-slate-50/80 px-1.5 py-0.5 rounded">{r.category}</span>
                          </p>
                          <p className="text-slate-500 text-[10px] italic line-clamp-1 font-light bg-blue-50/50 p-2 rounded-lg mt-1 border border-slate-100/40">"{r.description}"</p>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-blue-50 backdrop-blur-sm text-slate-800/90 p-4 rounded-xl border border-sky-500/20 text-[11px] leading-relaxed space-y-2 font-light">
                  <div className="font-bold text-slate-800 flex items-center space-x-1 font-sans uppercase tracking-wider text-[10px]">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-slate-800" />
                    <span>⚠️ QUY ĐỊNH VỀ TÍNH CHÍNH XÁC</span>
                  </div>
                  <p>
                    Mọi hành vi khai báo thông tin gian dối nhằm trục lợi chính sách từ thiện sẽ bị xử lý nghiêm minh theo quy định pháp luật. Kính mong bà con trung thực, cùng xây dựng xã hội nghĩa tình, đúng người, đúng việc.
                  </p>
                </div>
              </div>
            </div>
        )}

          {/* TAB 3: JOBS BOARD */}
          {activeTab === "job" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="content-job">
              {/* Job listings list */}
              <div className="lg:col-span-7 bg-white/60 bg-slate-50/20 border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="font-bold text-base text-slate-800 flex items-center space-x-2 font-sans">
                    <Briefcase className="w-5.5 h-5.5 text-slate-800" />
                    <span>Bản Tin Giới Thiệu Việc Làm Miễn Phí</span>
                  </h3>
                  <p className="text-slate-500 text-xs mt-1 font-light">
                    Kế hoạch hỗ trợ lao động nghèo, mất việc kết nối việc làm ổn định cuộc sống. Tổng hợp danh sách nhu cầu tuyển dụng uy tín từ các doanh nghiệp trên địa bàn phường Phú Lợi.
                  </p>
                </div>

                {jobApplied ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-blue-50 border border-sky-500/20 text-slate-800 p-8 rounded-2xl text-center space-y-4 backdrop-blur-sm"
                  >
                    <CheckCircle2 className="w-12 h-12 text-slate-800 mx-auto" />
                    <div>
                      <h4 className="font-bold text-sm tracking-wider uppercase">ỨNG TUYỂN THÀNH CÔNG!</h4>
                      <p className="text-xs mt-1 leading-relaxed text-slate-500">
                        Ủy ban MTTQ Phường đã ghi nhận thông tin ứng tuyển của bạn cho vị trí: <strong className="text-slate-800">{selectedJob?.title}</strong> tại <strong className="text-slate-800">{selectedJob?.company}</strong>.
                      </p>
                      <p className="text-[11px] text-slate-500 mt-2 font-light">
                        Thông tin ứng tuyển của bạn sẽ được chuyển giao cho Bộ phận tuyển dụng của doanh nghiệp. Họ sẽ liên hệ phỏng vấn trực tiếp trong 2 - 3 ngày tới.
                      </p>
                    </div>
                  </motion.div>
                ) : selectedJob ? (
                  <div className="space-y-4 bg-blue-50/50 p-6 rounded-2xl border border-slate-200 backdrop-blur-sm">
                    <button 
                      onClick={() => setSelectedJob(null)}
                      className="text-xs font-bold text-slate-800 hover:text-slate-800 mb-2 block transition-colors"
                    >
                      ← Quay lại danh sách tuyển dụng
                    </button>
                    <div>
                      <span className="text-[9px] uppercase tracking-wider font-bold text-slate-800 bg-sky-600/10 border border-sky-500/20 px-2.5 py-1 rounded-full">{selectedJob.company}</span>
                      <h4 className="font-bold text-base text-slate-800 mt-2.5 font-sans">{selectedJob.title}</h4>
                      <p className="text-xs text-slate-800 font-bold mt-1">Mức lương: {selectedJob.salary}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Địa điểm: {selectedJob.location}</p>
                    </div>

                    <div className="text-xs space-y-2 text-slate-500 font-light">
                      <div>
                        <strong className="text-slate-800 font-bold">Mô tả công việc:</strong>
                        <p className="mt-1">{selectedJob.description}</p>
                      </div>
                      <div>
                        <strong className="text-slate-800 font-bold">Yêu cầu hồ sơ & kỹ năng:</strong>
                        <ul className="list-disc pl-4 mt-1 space-y-0.5">
                          {selectedJob.requirements.map((req, idx) => (
                            <li key={idx}>{req}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <form onSubmit={handleJobApply} className="bg-slate-50/40 p-4 rounded-xl border border-slate-200 space-y-3.5">
                      <h5 className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-1.5 font-sans">Thông tin Đăng Ký Ứng Tuyển</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Họ và tên của bạn *</label>
                          <input 
                            type="text" 
                            required
                            value={jobApplicantName} 
                            onChange={(e) => setJobApplicantName(e.target.value)}
                            placeholder="Nhập họ tên ứng viên..."
                            className="w-full bg-blue-50/50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500/50"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Số điện thoại liên lạc *</label>
                          <input 
                            type="tel" 
                            required
                            value={jobApplicantPhone} 
                            onChange={(e) => setJobApplicantPhone(e.target.value)}
                            placeholder="Số điện thoại..."
                            className="w-full bg-blue-50/50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500/50"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-slate-500 mb-0.5">Kinh nghiệm hoặc Ghi chú ngắn cho nhà tuyển dụng (nếu có)</label>
                        <input 
                          type="text" 
                          value={jobApplicantSkills} 
                          onChange={(e) => setJobApplicantSkills(e.target.value)}
                          placeholder="Ví dụ: Đã có kinh nghiệm may, khỏe mạnh, có bằng lái xe..."
                          className="w-full bg-blue-50/50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500/50"
                        />
                      </div>
                      <button 
                        type="submit" 
                        className="w-full bg-sky-500 hover:bg-slate-500 text-white font-bold py-2 rounded-xl text-xs uppercase tracking-wider transition duration-300 shadow-md shadow-sky-500/10"
                      >
                        Gửi Hồ Sơ Ứng Tuyển
                      </button>
                    </form>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rankJobsByRelevance(jobs, currentUser?.quarter || "").map((job, jIdx) => {
                      const isHighlyRecommended = currentUser && currentUser.quarter && jIdx === 0;
                      return (
                      <motion.div 
                        key={job.id} 
                        initial={{ opacity: 0, y: 15 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.35, delay: Math.min(8, jIdx) * 0.04 }}
                        whileHover={{ 
                          y: -3, 
                          boxShadow: "0 12px 24px -10px rgba(37,99,235,0.06)",
                          borderColor: "rgba(37,99,235,0.25)"
                        }}
                        className="p-5 border border-slate-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/80 backdrop-blur-sm transition-all duration-300 shadow-[0_4px_10px_-2px_rgba(37,99,235,0.01)]"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center space-x-2">
                            <span className="text-[9px] bg-sky-600/10 text-slate-800 px-2 py-0.5 rounded font-bold border border-sky-500/20">{job.company}</span>
                            <span className="text-[10px] text-emerald-600 font-bold font-mono">{job.salary}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-bold text-sm text-slate-800">{job.title}</h4>
                            {isHighlyRecommended && (
                               <span className="bg-gradient-to-r from-sky-400 to-indigo-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded flex items-center shadow-sm">
                                 ✨ AI Gợi ý
                               </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1 font-light">{job.description}</p>
                        </div>
                        <button 
                          onClick={() => setSelectedJob(job)}
                          className="bg-sky-500 hover:bg-slate-500 text-white font-bold px-4 py-2 rounded-lg text-xs tracking-wider flex items-center space-x-1 shrink-0 w-full sm:w-auto justify-center shadow-sm cursor-pointer"
                        >
                          <span>Xem & Ứng Tuyển</span>
                          <ChevronRight className="w-3.5 h-3.5 text-white" />
                        </button>
                      </motion.div>
                    )})}
                  </div>
                )}
              </div>

              {/* Employer notice card */}
              <div className="lg:col-span-5 bg-white/60 bg-slate-50/20 border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="border-b border-slate-200 pb-3">
                    <h3 className="font-bold text-base text-slate-800 flex items-center space-x-1.5 font-sans">
                      <Building className="w-5 h-5 text-slate-800" />
                      <span>Dành Cho Doanh Nghiệp Tuyển Dụng</span>
                    </h3>
                    <p className="text-slate-500 text-xs mt-1 font-light">
                      Các cơ sở kinh doanh, hộ cá thể, nhà máy trên địa bàn phường có nhu cầu đăng tin tuyển dụng lao động miễn phí vui lòng liên hệ Ủy ban MTTQ phường.
                    </p>
                  </div>

                  <div className="space-y-3 bg-blue-50/50 p-4 rounded-xl border border-slate-200 text-xs leading-relaxed text-slate-500 font-light">
                    <p>
                      Cổng An Sinh Xã Hội Số hỗ trợ kết nối nhân sự hoàn toàn miễn phí cho cả nhà tuyển dụng và người tìm việc. Mục tiêu giải quyết công ăn việc làm cho lao động mất việc, người thuộc diện hộ nghèo, cận nghèo.
                    </p>
                    <div className="pt-2 border-t border-slate-200 font-semibold text-slate-800">
                      📌 Thủ tục đăng tuyển dụng:
                      <ul className="list-decimal pl-4 mt-1 font-light space-y-1 text-slate-500">
                        <li>Chuẩn bị Bản chụp Đăng ký kinh doanh.</li>
                        <li>Soạn thảo chi tiết mô tả công việc và mức lương rõ ràng.</li>
                        <li>Gửi qua email: <strong>phuongphuloi@hochiminhcity.gov.vn</strong> hoặc nộp trực tiếp tại Bộ phận Một Cửa Ủy ban MTTQ Phường.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-sky-500/20 text-[11px] text-slate-500 flex items-start space-x-2 leading-relaxed font-light">
                  <Calendar className="w-4 h-4 text-slate-800 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800 font-bold">Lịch Ngày Hội Việc Làm Phường:</strong> Ngày 15 hàng tháng, Ủy ban MTTQ phường Phú Lợi kết hợp cùng Trung tâm dịch vụ việc làm Thành phố Hồ Chí Minh tổ chức Sàn giao dịch việc làm trực tiếp tại Nhà văn hóa phường. Bà con có thể đến nộp hồ sơ phỏng vấn trực tiếp!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CHARITY PORTAL */}
          {activeTab === "charity" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="content-charity">
              {/* Active Donation Campaigns */}
              <div className="lg:col-span-7 bg-white/60 bg-slate-50/20 border border-slate-200 p-6 rounded-2xl shadow-sm space-y-6">
                <div className="border-b border-slate-200 pb-3">
                  <h3 className="font-bold text-base text-slate-800 flex items-center space-x-2 font-sans">
                    <Gift className="w-5.5 h-5.5 text-slate-800" />
                    <span>Cổng Vận Động & Đóng Góp Quỹ An Sinh</span>
                  </h3>
                  <p className="text-slate-500 text-xs mt-1 font-light">
                    Chung tay cùng Ủy ban MTTQ phường Phú Lợi tài trợ các hoạt động giúp đỡ cộng đồng nghèo, cấp phát thẻ BHYT, trao học bổng, xây nhà chữ thập đỏ.
                  </p>
                </div>

                {generatedCertificate ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* Beautiful Dynamic Golden Heart Certificate */}
                    <div className="border-4 border-double border-blue-300/40 p-6 sm:p-8 bg-white/80 backdrop-blur-md rounded-2xl relative shadow-md overflow-hidden text-center golden-shimmer shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]" id="golden-certificate">
                      {/* Decorative elements */}
                      <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-sky-500/50" />
                      <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-sky-500/50" />
                      <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-sky-500/50" />
                      <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-sky-500/50" />
                      
                      <div className="max-w-md mx-auto space-y-4">
                        <span className="text-[10px] font-bold tracking-[0.2em] text-slate-800 uppercase block">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span>
                        <span className="text-[9px] font-bold text-slate-500 block -mt-3.5">Độc lập - Tự do - Hạnh phúc</span>
                        <div className="w-20 h-px bg-white/10 mx-auto -mt-1" />
                        
                        <div className="pt-2 text-center">
                          <Landmark className="w-8 h-8 text-slate-800 mx-auto animate-pulse" />
                          <h4 className="font-bold text-slate-800 text-base sm:text-lg uppercase tracking-wider mt-1 font-sans">GIẤY CHỨNG NHẬN</h4>
                          <span className="text-xs font-bold text-slate-800 uppercase block mt-0.5 tracking-[0.2em]">TẤM LÒNG VÀNG</span>
                        </div>

                        <p className="text-xs text-slate-500 italic font-light leading-relaxed">
                          Ban chỉ đạo Chương trình An sinh xã hội số phường Phú Lợi, Thành phố Hồ Chí Minh kính ghi nhận và tri ân sâu sắc:
                        </p>

                        <div>
                          <h5 className="font-bold text-base sm:text-xl text-slate-800 border-b border-dashed border-white/15 pb-1 inline-block px-4 font-sans">
                            {generatedCertificate.donorName}
                          </h5>
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed font-light">
                          Đã có nghĩa cử cao đẹp, chung tay đóng góp số tiền quý báu:<br />
                          <span className="font-bold text-lg text-slate-800 font-mono mt-1 block">
                            {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(generatedCertificate.amount)}
                          </span>
                        </p>

                        <p className="text-xs text-slate-500 leading-tight font-light">
                          Ủng hộ chiến dịch: <span className="font-bold text-slate-800">{generatedCertificate.campaignTitle}</span>
                        </p>

                        {generatedCertificate.message && (
                          <p className="text-[10px] text-slate-500 bg-sky-500/60 p-2.5 rounded-xl border border-slate-200 max-w-xs mx-auto italic leading-normal font-light">
                            "{generatedCertificate.message}"
                          </p>
                        )}

                        <div className="pt-4 flex justify-between items-end text-left">
                          <div className="text-[9px] text-slate-450 font-mono leading-relaxed">
                            Số: {generatedCertificate.id}<br />
                            Ngày: {new Date(generatedCertificate.createdAt).toLocaleDateString("vi-VN")}
                          </div>
                          
                          {/* Official Stamp */}
                          <div className="relative flex flex-col items-center shrink-0">
                            <div className="w-16 h-16 rounded-full border-4 border-dashed border-sky-500/50 flex items-center justify-center font-bold text-slate-800 text-[8px] uppercase tracking-tighter text-center rotate-12 bg-blue-50 shadow-inner">
                              <span>ỦY BAN PHƯỜNG<br />PHÚ LỢI<br />★ AN SINH ★</span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-500 mt-1 text-center block font-sans">BCĐ AN SINH SỐ</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-center space-x-3 text-xs">
                      <button 
                        onClick={() => window.print()}
                        className="bg-sky-500 hover:bg-slate-500 text-white font-bold px-4 py-2 rounded-xl flex items-center space-x-1 transition duration-150 cursor-pointer shadow"
                      >
                        <Printer className="w-4 h-4" />
                        <span>In Chứng Nhận</span>
                      </button>
                      <button 
                        onClick={() => setGeneratedCertificate(null)}
                        className="bg-blue-700 hover:bg-slate-700 text-slate-800 font-bold px-4 py-2 rounded-xl transition duration-150 cursor-pointer shadow border border-slate-200"
                      >
                        Quyên góp thêm
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-6">
                    {/* Campaigns Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {campaigns.map((camp, cIdx) => {
                        const progressPercent = Math.min(100, Math.round((camp.currentAmount / camp.targetAmount) * 100));
                        return (
                          <motion.div 
                            key={camp.id} 
                            id={`campaign-card-${camp.id}`}
                            initial={{ opacity: 0, y: 15 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: Math.min(6, cIdx) * 0.05 }}
                            whileHover={{ 
                              y: -5, 
                              boxShadow: "0 20px 40px -15px rgba(37,99,235,0.1)",
                              borderColor: "rgba(37,99,235,0.3)" 
                            }}
                            className="p-5 border border-slate-200 rounded-3xl flex flex-col justify-between space-y-4 bg-white/80 backdrop-blur-sm shadow-[0_4px_15px_rgba(37,99,235,0.015)] transition-colors duration-300 group/camp"
                          >
                            <div className="space-y-2">
                              {camp.imageUrl && (
                                <div className="w-full h-32 rounded-lg overflow-hidden mb-2">
                                  <img src={camp.imageUrl} alt={camp.title} className="w-full h-full object-cover group-hover/camp:scale-105 transition-transform duration-500" />
                                </div>
                              )}
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] uppercase font-bold text-slate-800 bg-sky-600/10 border border-sky-500/25 px-2.5 py-0.5 rounded-full">{camp.category}</span>
                                <div className="flex items-center space-x-1">
                                  {/* Share Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleShareCampaign(camp);
                                    }}
                                    className="p-1.5 rounded-full text-slate-400 hover:text-sky-500 hover:bg-slate-100 transition-all duration-250 cursor-pointer"
                                    title="Chia sẻ chiến dịch này"
                                  >
                                    <Share2 className="w-4 h-4" />
                                  </button>

                                  {/* Bookmark Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onToggleBookmarkCampaign(camp.id);
                                    }}
                                    className="p-1.5 rounded-full text-slate-400 hover:text-amber-500 hover:bg-slate-100 transition-all duration-250 cursor-pointer"
                                    title={bookmarkedCampaignIds.includes(camp.id) ? "Xóa khỏi mục yêu thích" : "Yêu thích"}
                                  >
                                    <Bookmark className={`w-4 h-4 ${bookmarkedCampaignIds.includes(camp.id) ? "text-amber-500 fill-amber-500" : ""}`} />
                                  </button>
                                </div>
                              </div>
                              <h4 className="font-bold text-sm text-slate-800 leading-snug font-sans group-hover/camp:text-slate-800 transition-colors duration-300">{camp.title}</h4>
                              <p className="text-[10px] text-slate-500 leading-normal font-light line-clamp-2">{camp.description}</p>
                            </div>

                            {/* Progress bar */}
                            <div className="space-y-1.5 pt-1">
                              <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-slate-500 font-medium">Đạt: {progressPercent}%</span>
                                <span className="text-slate-800 font-mono">Mục tiêu: {new Intl.NumberFormat("vi-VN").format(camp.targetAmount)}đ</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-blue-50/50">
                                <div className="bg-gradient-to-r from-slate-800 to-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                              </div>
                            </div>

                            <button 
                              onClick={() => setSelectedCampaign(camp)}
                              className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all duration-300 shadow-md shadow-sky-500/10"
                            >
                              Ủng hộ ngay
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Donation Modal overlay triggered */}
                    {selectedCampaign && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="p-5 bg-blue-50/50 border border-slate-200 backdrop-blur-md rounded-2xl space-y-4"
                      >
                        <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                          <div>
                            <span className="text-[10px] text-slate-800 font-bold font-sans uppercase tracking-wider">ĐANG ỦNG HỘ CHIẾN DỊCH:</span>
                            <h4 className="font-bold text-sm text-slate-800">{selectedCampaign.title}</h4>
                          </div>
                          <button 
                            onClick={() => setSelectedCampaign(null)}
                            className="text-xs font-bold text-slate-450 hover:text-slate-500 cursor-pointer"
                          >
                            Hủy bỏ
                          </button>
                        </div>

                        <form onSubmit={handleDonationSubmit} className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Tên Cá nhân / Đơn vị ủng hộ *</label>
                              <input 
                                type="text" 
                                required
                                value={donorName} 
                                onChange={(e) => setDonorName(e.target.value)}
                                placeholder="Tên hiển thị trên Sổ Vàng..."
                                className="w-full bg-blue-50/50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500/50 font-medium"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1">Số tiền quyên góp (VND) *</label>
                              <input 
                                type="number" 
                                required
                                value={donateAmount} 
                                onChange={(e) => setDonateAmount(e.target.value ? Number(e.target.value) : "")}
                                placeholder="Ví dụ: 1000000..."
                                className="w-full bg-blue-50/50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500/50 font-medium"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Lời nhắn gửi cộng đồng Phú Lợi (nếu có)</label>
                            <input 
                              type="text" 
                              value={donateMessage} 
                              onChange={(e) => setDonateMessage(e.target.value)}
                              placeholder="Lời chúc, lời nhắn nhủ gửi tới các gia dịch khó khăn..."
                              className="w-full bg-blue-50/50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500/50 font-light"
                            />
                          </div>

                          <button 
                            type="submit" 
                            className="w-full bg-sky-500 hover:bg-slate-500 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow shadow-sky-500/10 cursor-pointer transition-all"
                          >
                            <Coins className="w-4 h-4 text-white" />
                            <span>Hoàn Tất Quyên Góp & Nhận Chứng Nhận</span>
                          </button>
                        </form>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>

              {/* Honor Golden Ledger (Sổ Vàng) */}
              <div className="lg:col-span-5 bg-white/60 bg-slate-50/20 border border-slate-200 p-6 rounded-2xl shadow-sm flex flex-col justify-between space-y-6">
                <div>
                  <div className="border-b border-slate-200 pb-3">
                    <h3 className="font-bold text-base text-slate-800 flex items-center space-x-1.5 font-sans">
                      <Award className="w-5 h-5 text-slate-800" />
                      <span>Sổ Vàng Danh Dự - Vinh Danh Tổ Chức</span>
                    </h3>
                    <p className="text-slate-500 text-xs mt-1 font-light">
                      Kính cẩn ghi ơn, vinh danh danh sách những nhà hảo tâm, doanh nghiệp đã đóng góp thiết thực cho công tác xóa nghèo, an sinh xã hội trên địa bàn phường.
                    </p>
                  </div>

                  <div className="mt-4 space-y-3 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                    {donations.map((d, dIdx) => (
                      <motion.div 
                        key={d.id} 
                        initial={{ opacity: 0, x: 10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.35, delay: Math.min(10, dIdx) * 0.03 }}
                        whileHover={{ x: -2, borderColor: "rgba(37,99,235,0.25)" }}
                        className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2 shadow-[0_2px_8px_rgba(37,99,235,0.01)] transition-all duration-300"
                      >
                        <div className="flex justify-between items-start text-xs">
                          <span className="font-bold text-slate-800 flex items-center space-x-1 font-sans">
                            <span className="text-slate-800 text-xs animate-pulse">★</span>
                            <span>{d.donorName}</span>
                          </span>
                          <span className="font-black text-slate-800 shrink-0 font-mono text-[11px]">
                            +{new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(d.amount)}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium leading-none">
                          Chiến dịch: <span className="text-slate-800/90 font-semibold">{d.campaignTitle}</span>
                        </p>
                        <p className="text-slate-500 text-[10px] italic leading-tight font-light">"{d.message}"</p>
                        <div className="text-[9px] text-slate-400 text-right font-mono">
                          {new Date(d.createdAt).toLocaleDateString("vi-VN")}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="bg-blue-50 backdrop-blur-sm border border-sky-500/20 p-4 rounded-xl text-[11px] leading-relaxed text-slate-500 font-light">
                  <strong className="text-slate-800 font-bold">💡 Gửi Tấm Lòng Vàng:</strong> Cổng An sinh số Phú Lợi đảm bảo mọi khoản quyên góp được chuyển thẳng 100% về tài khoản chuyên dùng của Quỹ Vì Người Nghèo phường Phú Lợi (STK chính thống của UB MTTQ Phường) và phục vụ trực tiếp hỗ trợ bà con.
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CITIZEN DASHBOARD */}
          {activeTab === "citizen" && (
            <div id="content-citizen" className="space-y-8 animate-fadeIn">
              {!currentUser ? (
                /* Unauthenticated Guard Screen */
                <div className="max-w-2xl mx-auto text-center py-12 px-4 space-y-6">
                  <div className="inline-flex p-4 rounded-full bg-sky-600/10 border border-sky-500/20 text-slate-800 shadow-inner">
                    <UserCheck className="w-10 h-10 animate-bounce text-slate-800" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-800 font-sans">Cổng Công Dân Số Phường Phú Lợi</h3>
                    <p className="text-slate-500 text-xs sm:text-sm font-light leading-relaxed">
                      Chào mừng bà con đến với không gian cá nhân số hóa. Vui lòng đăng nhập hoặc đăng ký tài khoản để trải nghiệm các chức năng quản trị an sinh chuyên nghiệp:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-xl mx-auto pt-2">
                    <div className="p-4 bg-white/60 bg-sky-500/30 border border-slate-200 rounded-2xl shadow-sm space-y-1">
                      <div className="text-slate-800 font-bold text-lg font-sans">01</div>
                      <h4 className="font-bold text-slate-800 text-xs">Theo Dõi Trực Tuyến</h4>
                      <p className="text-slate-500 text-[10px] leading-relaxed font-light">Theo dõi tiến độ duyệt hồ sơ cứu trợ, BHYT tự nguyện theo thời gian thực.</p>
                    </div>
                    <div className="p-4 bg-white/60 bg-sky-500/30 border border-slate-200 rounded-2xl shadow-sm space-y-1">
                      <div className="text-slate-800 font-bold text-lg font-sans">02</div>
                      <h4 className="font-bold text-slate-800 text-xs">Tình Nguyện Viên</h4>
                      <p className="text-slate-500 text-[10px] leading-relaxed font-light">Tham gia đội ngũ cộng tác viên khu phố để giúp đỡ các hộ nghèo tại địa bàn.</p>
                    </div>
                    <div className="p-4 bg-white/60 bg-sky-500/30 border border-slate-200 rounded-2xl shadow-sm space-y-1">
                      <div className="text-slate-800 font-bold text-lg font-sans">03</div>
                      <h4 className="font-bold text-slate-800 text-xs">Thư Cảm Ơn</h4>
                      <p className="text-slate-500 text-[10px] leading-relaxed font-light">Lưu trữ, tra cứu và tải xuống Thư cảm ơn, Chứng nhận Sổ Vàng kỹ thuật số.</p>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={onAuthClick}
                      className="inline-flex items-center space-x-2 bg-sky-500 hover:bg-slate-500 text-white font-bold px-8 py-3.5 rounded-xl text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-sky-500/20 cursor-pointer"
                    >
                      <LogIn className="w-4 h-4 text-white" />
                      <span>Đăng Nhập / Đăng Ký Tài Khoản Số</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Authenticated Citizen Dashboard */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                  
                  {/* Left Column: Profile Card & Volunteer Enrollment */}
                  <div className="lg:col-span-4 space-y-6">
                    {/* Volunteer Section */}
                    {currentUser.isVolunteer ? (
                      /* Volunteer Badge Card */
                      <div className="bg-gradient-to-tr from-blue-700 to-blue-500 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-6 -mt-6" />
                        <div className="relative z-10 space-y-3">
                          <div className="inline-flex items-center space-x-1 bg-white/10 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                            <Trophy className="w-3 h-3 text-yellow-300 animate-pulse" />
                            <span>Tình Nguyện Viên</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-sm font-sans">Đồng hành cùng Phú Lợi</h4>
                            <p className="text-slate-800 text-[10px] leading-relaxed mt-1 font-semibold">
                              Cảm ơn tấm lòng vàng của anh/chị đã tự nguyện góp sức vì cuộc sống tốt đẹp hơn của người nghèo.
                            </p>
                          </div>
                          <div className="pt-2 border-t border-slate-950/10 text-[10px] font-semibold">
                            <span className="text-slate-800">Khu vực hỗ trợ:</span> {currentUser.volunteerQuarters?.join(", ") || currentUser.quarter}
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Volunteer Enrollment Form Card */
                      <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm space-y-4">
                        <h4 className="font-bold text-sm text-slate-800 flex items-center space-x-1.5 font-sans">
                          <HeartHandshake className="w-4 h-4 text-slate-800" />
                          <span>Đăng Ký Làm Tình Nguyện Viên</span>
                        </h4>
                        <p className="text-slate-500 text-[10px] sm:text-xs leading-relaxed font-light">
                          Chung tay cùng Ủy ban MTTQ Phường giúp đỡ xác minh nhanh các hộ dân gặp thiên tai, hoạn nạn hoặc người neo đơn trong khu phố cư trú của anh/chị.
                        </p>

                        <form onSubmit={handleJoinVolunteer} className="space-y-3">
                          <div>
                            <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Khu phố hỗ trợ chính *</label>
                            <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto p-1.5 bg-blue-50/50 rounded-xl border border-slate-200 custom-scrollbar">
                              {QUARTERS_LIST.map(kp => (
                                <label key={kp.id} className="flex items-center space-x-1.5 text-[10px] font-semibold text-slate-500 cursor-pointer hover:text-slate-800">
                                  <input 
                                    type="checkbox"
                                    checked={selectedVolunteerQuarters.includes(kp.name)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedVolunteerQuarters(prev => [...prev, kp.name]);
                                      } else {
                                        setSelectedVolunteerQuarters(prev => prev.filter(item => item !== kp.name));
                                      }
                                    }}
                                    className="rounded text-slate-800 focus:ring-sky-500 w-3 h-3 cursor-pointer bg-white border-slate-200"
                                  />
                                  <span>{kp.name}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <button
                            type="submit"
                            disabled={volunteerSaving}
                            className="w-full bg-sky-500 hover:bg-slate-500 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer shadow-sm shadow-sky-500/10 transition-colors"
                          >
                            {volunteerSaving ? "Đang xử lý..." : "Xác Nhận Gia Nhập Đội Ngũ"}
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Digital Volunteer Badges Wallet */}
                    <DigitalBadgeWallet currentUser={currentUser} showToast={showToast} />
                  </div>

                  {/* Right Column: Relief Tracker, Honor Books, or Community Reporter Form */}
                  <div className="lg:col-span-8 space-y-6">
                    {(() => {
                      const myRequests = requests.filter(r => r.phone === currentUser.phone);
                      const totalRequestsCount = myRequests.length;
                      const verifyingRequestsCount = myRequests.filter(r => r.status === RequestStatus.VERIFYING).length;
                      const approvedRequestsCount = myRequests.filter(r => r.status === RequestStatus.APPROVED).length;
                      const completedRequestsCount = myRequests.filter(r => r.status === RequestStatus.COMPLETED).length;

                      const filteredRequests = myRequests.filter(r => {
                        const matchesFilter = citizenRequestFilter === "all" || r.status === citizenRequestFilter;
                        const matchesSearch = citizenRequestSearch.trim() === "" || 
                          r.id.toLowerCase().includes(citizenRequestSearch.toLowerCase()) ||
                          r.category.toLowerCase().includes(citizenRequestSearch.toLowerCase()) ||
                          r.description.toLowerCase().includes(citizenRequestSearch.toLowerCase());
                        return matchesFilter && matchesSearch;
                      });

                      return (
                        <div className="bg-white border border-slate-200/60 rounded-3xl shadow-sm flex flex-col min-h-[640px]">
                          
                          {/* Title Bar with Sub-tabs */}
                          <div className="flex border-b border-slate-200 bg-white/60 p-4 justify-between items-center flex-wrap gap-3">
                            <div className="flex space-x-2 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/50">
                              <button
                                onClick={() => setCitizenSubTab("requests")}
                                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                                  citizenSubTab === "requests" 
                                    ? "bg-sky-500 text-white shadow-md shadow-sky-500/15" 
                                    : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                                }`}
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Hồ sơ trợ giúp</span>
                              </button>
                              
                              <button
                                onClick={() => setCitizenSubTab("donations")}
                                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                                  citizenSubTab === "donations" 
                                    ? "bg-sky-500 text-white shadow-md shadow-sky-500/15" 
                                    : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                                }`}
                              >
                                <Award className="w-3.5 h-3.5" />
                                <span>Đóng góp</span>
                              </button>

                              <button
                                onClick={() => setCitizenSubTab("feedback")}
                                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                                  citizenSubTab === "feedback" 
                                    ? "bg-sky-500 text-white shadow-md shadow-sky-500/15" 
                                    : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                                }`}
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Góp ý & Giám sát</span>
                              </button>

                              <button
                                onClick={() => setCitizenSubTab("volunteer")}
                                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                                  citizenSubTab === "volunteer" 
                                    ? "bg-sky-500 text-white shadow-md shadow-sky-500/15" 
                                    : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                                }`}
                              >
                                <HeartHandshake className="w-3.5 h-3.5" />
                                <span>Đăng Ký Sự Kiện</span>
                              </button>

                              <button
                                onClick={() => setCitizenSubTab("badges")}
                                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                                  citizenSubTab === "badges" 
                                    ? "bg-sky-500 text-white shadow-md shadow-sky-500/15" 
                                    : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                                }`}
                              >
                                <Trophy className="w-3.5 h-3.5" />
                                <span>Huy hiệu của tôi</span>
                              </button>
                            </div>
                            <div className="text-[10px] font-mono text-slate-800 font-semibold bg-sky-600/10 border border-sky-500/20 px-3 py-1 rounded-full flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-ping" />
                              <span>Cập nhật: Thời gian thực</span>
                            </div>
                          </div>

                          {/* Content Area of Workspace */}
                          <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
                            {citizenSubTab === "requests" ? (
                              <>
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                                  <div>
                                    <h4 className="font-bold text-base text-slate-800 flex items-center space-x-2 font-sans">
                                      <FileText className="w-5 h-5 text-slate-800" />
                                      <span>Theo Dõi Trực Tuyến Hồ Sơ Trợ Giúp Của Tôi</span>
                                    </h4>
                                    <p className="text-slate-500 text-xs mt-1 font-light">
                                      Dưới đây là danh sách và biểu đồ tiến độ phê duyệt, bàn giao của các hồ sơ có số điện thoại: <strong className="text-slate-800 font-mono font-bold">{currentUser.phone || "(Chưa cập nhật)"}</strong>
                                    </p>
                                  </div>
                                </div>

                                {myRequests.length === 0 ? (
                                  <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl bg-blue-50/50 space-y-4">
                                    <HelpCircle className="w-10 h-10 text-slate-400 mx-auto" />
                                    <div className="space-y-1">
                                      <h5 className="font-bold text-sm text-slate-800">Chưa có hồ sơ trợ giúp nào</h5>
                                      <p className="text-xs text-slate-500 max-w-md mx-auto font-light leading-relaxed">
                                        Tài khoản số của bà con chưa liên kết với hồ sơ trợ giúp nào trên hệ thống. Nếu bà con đang gặp hoàn cảnh đặc biệt khó khăn, hãy chuyển sang thẻ **"Đăng Ký Nhận Trợ Giúp"** để gửi yêu cầu hỗ trợ trực tiếp.
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-6">
                                    {/* Interactive Stats Grid */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                      <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block font-sans">Tổng số hồ sơ</span>
                                        <span className="text-lg font-black text-slate-800 font-mono mt-1 block">{totalRequestsCount}</span>
                                      </div>
                                      <div className="p-3 bg-sky-500/[0.04] border border-sky-500/10 rounded-xl">
                                        <span className="text-[9px] font-bold text-sky-700 uppercase tracking-wider block font-sans">Đang xác minh</span>
                                        <span className="text-lg font-black text-sky-600 font-mono mt-1 block">{verifyingRequestsCount}</span>
                                      </div>
                                      <div className="p-3 bg-slate-500/[0.04] border border-sky-500/10 rounded-xl">
                                        <span className="text-[9px] font-bold text-sky-700 uppercase tracking-wider block font-sans">Đã phê duyệt</span>
                                        <span className="text-lg font-black text-slate-800 font-mono mt-1 block">{approvedRequestsCount}</span>
                                      </div>
                                      <div className="p-3 bg-emerald-500/[0.04] border border-emerald-500/10 rounded-xl">
                                        <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider block font-sans">Hoàn thành</span>
                                        <span className="text-lg font-black text-emerald-600 font-mono mt-1 block">{completedRequestsCount}</span>
                                      </div>
                                    </div>

                                    {/* Filter and Search controls */}
                                    <div className="flex flex-col sm:flex-row gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200/50">
                                      <div className="relative flex-1">
                                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                        <input
                                          type="text"
                                          placeholder="Tìm kiếm theo Mã hồ sơ, Danh mục, Nội dung..."
                                          value={citizenRequestSearch}
                                          onChange={(e) => setCitizenRequestSearch(e.target.value)}
                                          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500/50"
                                        />
                                      </div>
                                      <div className="flex items-center space-x-2 shrink-0">
                                        <span className="text-xs text-slate-500 font-medium whitespace-nowrap font-sans">Trạng thái:</span>
                                        <select
                                          value={citizenRequestFilter}
                                          onChange={(e) => setCitizenRequestFilter(e.target.value)}
                                          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500/50 font-semibold"
                                        >
                                          <option value="all">Tất cả trạng thái</option>
                                          <option value={RequestStatus.SUBMITTED}>Đã tiếp nhận</option>
                                          <option value={RequestStatus.VERIFYING}>Đang xác minh</option>
                                          <option value={RequestStatus.APPROVED}>Đã duyệt hỗ trợ</option>
                                          <option value={RequestStatus.COMPLETED}>Đã hoàn thành</option>
                                        </select>
                                      </div>
                                    </div>

                                    {/* List of Requests */}
                                    {filteredRequests.length === 0 ? (
                                      <div className="text-center py-8 text-slate-500 text-xs italic font-sans">
                                        Không tìm thấy hồ sơ nào khớp với bộ lọc hiện tại.
                                      </div>
                                    ) : (
                                      <div className="grid grid-cols-1 gap-5">
                                        {filteredRequests.map((r) => {
                                          return (
                                            <motion.div
                                              key={r.id}
                                              initial={{ opacity: 0, y: 15 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              transition={{ duration: 0.3 }}
                                              className={`p-6 bg-white border rounded-2xl shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md border-l-4 ${
                                                r.status === RequestStatus.COMPLETED ? "border-l-emerald-500 border-slate-100/85 hover:border-emerald-500/40 bg-emerald-50/[0.01]" :
                                                r.status === RequestStatus.APPROVED ? "border-l-blue-500 border-slate-100/85 hover:border-blue-300/40 bg-slate-50/[0.01]" :
                                                r.status === RequestStatus.VERIFYING ? "border-l-blue-500 border-slate-100/85 hover:border-blue-300/40 bg-blue-50/[0.01]" :
                                                "border-l-slate-400 border-slate-100/85 hover:border-slate-500/40 bg-slate-50/[0.01]"
                                              }`}
                                            >
                                              {/* Card Header */}
                                              <div className="flex flex-wrap justify-between items-start gap-3 pb-3 border-b border-slate-100">
                                                <div className="space-y-1">
                                                  <div className="flex items-center space-x-2">
                                                    <span className="inline-flex px-2 py-0.5 rounded-lg bg-sky-500 text-slate-300 font-bold font-mono text-[10px] tracking-wider border border-sky-500/10 shadow-sm">
                                                      #{r.id}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 font-mono flex items-center space-x-1">
                                                      <Calendar className="w-3 h-3 text-slate-400" />
                                                      <span>{new Date(r.createdAt).toLocaleDateString("vi-VN")}</span>
                                                    </span>
                                                  </div>
                                                  <h5 className="font-bold text-sm sm:text-base text-slate-800 tracking-tight flex items-center space-x-2 pt-1 font-sans">
                                                    {r.category === SupportCategory.FOOD && <Gift className="w-4 h-4 text-emerald-500" />}
                                                    {r.category === SupportCategory.MEDICAL && <ShieldCheck className="w-4 h-4 text-sky-500" />}
                                                    {r.category === SupportCategory.FINANCIAL && <Coins className="w-4 h-4 text-sky-500" />}
                                                    {r.category === SupportCategory.EDUCATION && <Award className="w-4 h-4 text-purple-500" />}
                                                    {r.category === SupportCategory.HOUSING && <Building className="w-4 h-4 text-rose-500" />}
                                                    {r.category === SupportCategory.JOB && <Briefcase className="w-4 h-4 text-sky-500" />}
                                                    <span>{r.category}</span>
                                                  </h5>
                                                </div>

                                                {/* Status Pill Badge with Icon */}
                                                <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                                                  r.status === RequestStatus.COMPLETED ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                                  r.status === RequestStatus.APPROVED ? "bg-sky-100 text-slate-800 border-sky-500/20" :
                                                  r.status === RequestStatus.VERIFYING ? "bg-sky-500/10 text-sky-600 border-sky-500/20" :
                                                  "bg-slate-100 text-slate-500 border-slate-200"
                                                }`}>
                                                  <span className={`w-1.5 h-1.5 rounded-full ${
                                                    r.status === RequestStatus.COMPLETED ? "bg-emerald-500" :
                                                    r.status === RequestStatus.APPROVED ? "bg-slate-500" :
                                                    r.status === RequestStatus.VERIFYING ? "bg-sky-500 animate-pulse" :
                                                    "bg-slate-400"
                                                  }`} />
                                                  <span>{r.status}</span>
                                                </span>
                                              </div>

                                              {/* Description */}
                                              <div className="py-4">
                                                <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1.5 font-sans">Nội dung yêu cầu hỗ trợ:</div>
                                                <p className="text-xs text-slate-500 bg-blue-50/50 p-3 rounded-xl border border-slate-100/60 leading-relaxed italic font-light font-sans">
                                                  "{r.description}"
                                                </p>
                                              </div>

                                              {/* Visual Timeline and Processing Statuses ("trạng thái xử lý hồ sơ") */}
                                              <div className="pt-2 border-t border-slate-100/60 font-sans">
                                                <div className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-4 font-sans">Tiến trình xử lý hồ sơ:</div>
                                                
                                                <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                                                  {/* Step 1: SUBMITTED */}
                                                  <div className="relative">
                                                    <div className={`absolute -left-[21px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                      r.status === RequestStatus.SUBMITTED || r.status === RequestStatus.VERIFYING || r.status === RequestStatus.APPROVED || r.status === RequestStatus.COMPLETED
                                                        ? "bg-emerald-500 border-emerald-500"
                                                        : "bg-white border-slate-200"
                                                    }`}>
                                                      <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                                                    </div>
                                                    <div className="pl-2">
                                                      <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-slate-800">Đã tiếp nhận hồ sơ</span>
                                                        <span className="text-[9px] text-slate-500 font-mono">Hoàn thành</span>
                                                      </div>
                                                      <p className="text-[10px] text-slate-500 mt-0.5 font-light">Hồ sơ số #{r.id} đã gửi thành công lên hệ thống Phú Lợi.</p>
                                                    </div>
                                                  </div>

                                                  {/* Step 2: VERIFYING */}
                                                  <div className="relative">
                                                    <div className={`absolute -left-[21px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                      r.status === RequestStatus.VERIFYING || r.status === RequestStatus.APPROVED || r.status === RequestStatus.COMPLETED
                                                        ? "bg-sky-500 border-sky-500"
                                                        : "bg-white border-slate-200"
                                                    }`}>
                                                      {r.status === RequestStatus.VERIFYING ? (
                                                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                                                      ) : r.status === RequestStatus.APPROVED || r.status === RequestStatus.COMPLETED ? (
                                                        <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                                                      ) : (
                                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                      )}
                                                    </div>
                                                    <div className="pl-2">
                                                      <div className="flex items-center justify-between">
                                                        <span className={`text-xs font-bold ${r.status === RequestStatus.VERIFYING ? "text-sky-600 font-black" : "text-slate-800"}`}>Xác minh thực tế</span>
                                                        <span className={`text-[9px] font-mono ${
                                                          r.status === RequestStatus.VERIFYING ? "text-sky-600 font-bold" :
                                                          r.status === RequestStatus.APPROVED || r.status === RequestStatus.COMPLETED ? "text-slate-500" : "text-slate-400"
                                                        }`}>
                                                          {r.status === RequestStatus.VERIFYING ? "Đang xử lý" : 
                                                           r.status === RequestStatus.APPROVED || r.status === RequestStatus.COMPLETED ? "Hoàn thành" : "Chờ thực hiện"}
                                                        </span>
                                                      </div>
                                                      <p className="text-[10px] text-slate-500 mt-0.5 font-light">Cán bộ chuyên trách Phú Lợi tiến hành rà soát thực tế gia cảnh của bà con.</p>
                                                    </div>
                                                  </div>

                                                  {/* Step 3: APPROVED */}
                                                  <div className="relative">
                                                    <div className={`absolute -left-[21px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                      r.status === RequestStatus.APPROVED || r.status === RequestStatus.COMPLETED
                                                        ? "bg-slate-500 border-sky-500"
                                                        : "bg-white border-slate-200"
                                                    }`}>
                                                      {r.status === RequestStatus.APPROVED ? (
                                                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                                                      ) : r.status === RequestStatus.COMPLETED ? (
                                                        <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                                                      ) : (
                                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                      )}
                                                    </div>
                                                    <div className="pl-2">
                                                      <div className="flex items-center justify-between">
                                                        <span className={`text-xs font-bold ${r.status === RequestStatus.APPROVED ? "text-slate-800 font-black" : "text-slate-800"}`}>Đã phê duyệt hỗ trợ</span>
                                                        <span className={`text-[9px] font-mono ${
                                                          r.status === RequestStatus.APPROVED ? "text-slate-800 font-bold" :
                                                          r.status === RequestStatus.COMPLETED ? "text-slate-500" : "text-slate-400"
                                                        }`}>
                                                          {r.status === RequestStatus.APPROVED ? "Đang xử lý" :
                                                           r.status === RequestStatus.COMPLETED ? "Hoàn thành" : "Chờ thực hiện"}
                                                        </span>
                                                      </div>
                                                      <p className="text-[10px] text-slate-500 mt-0.5 font-light">Ủy ban MTTQ Phường nhất trí thông qua và chuẩn bị điều phối nguồn lực / cấp phát thẻ BHYT.</p>
                                                    </div>
                                                  </div>

                                                  {/* Step 4: COMPLETED */}
                                                  <div className="relative">
                                                    <div className={`absolute -left-[21px] top-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                      r.status === RequestStatus.COMPLETED
                                                        ? "bg-emerald-500 border-emerald-500"
                                                        : "bg-white border-slate-200"
                                                    }`}>
                                                      {r.status === RequestStatus.COMPLETED ? (
                                                        <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                                                      ) : (
                                                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                                      )}
                                                    </div>
                                                    <div className="pl-2">
                                                      <div className="flex items-center justify-between">
                                                        <span className={`text-xs font-bold ${r.status === RequestStatus.COMPLETED ? "text-emerald-600 font-black" : "text-slate-800"}`}>Hoàn thành bàn giao</span>
                                                        <span className={`text-[9px] font-mono ${r.status === RequestStatus.COMPLETED ? "text-emerald-600 font-bold" : "text-slate-400"}`}>
                                                          {r.status === RequestStatus.COMPLETED ? "Hoàn thành" : "Chờ thực hiện"}
                                                        </span>
                                                      </div>
                                                      <p className="text-[10px] text-slate-500 mt-0.5 font-light">Đã hoàn thành thủ tục hỗ trợ / trao hiện vật cứu trợ tận nhà công dân.</p>
                                                    </div>
                                                  </div>
                                                </div>
                                              </div>

                                              {/* Administrative notes */}
                                              {r.notes && (
                                                <div className="mt-4 p-3 bg-slate-500/[0.03] border border-sky-500/10 rounded-xl text-[11px] text-slate-500 leading-normal font-light flex items-start space-x-2">
                                                  <Sparkles className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                                                  <div>
                                                    <strong className="text-slate-800 font-bold">Phản hồi từ Ban Chỉ Đạo Phú Lợi:</strong>{" "}
                                                    <span className="italic">"{r.notes}"</span>
                                                  </div>
                                                </div>
                                              )}

                                              {/* 5-Star Rating Section for Completed Requests */}
                                              {r.status === RequestStatus.COMPLETED && (
                                                <div className="mt-5 pt-4 border-t border-dashed border-slate-100 font-sans">
                                                  <div className="flex items-center space-x-2 text-slate-700 mb-2">
                                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                    <span className="text-xs font-bold uppercase tracking-wider">Đánh giá chất lượng phục vụ của cán bộ xử lý</span>
                                                  </div>
                                                  {r.rating ? (
                                                    <div className="bg-amber-500/[0.03] border border-amber-500/15 rounded-xl p-3.5 space-y-2">
                                                      <div className="flex items-center space-x-2">
                                                        <div className="flex space-x-0.5">
                                                          {[1, 2, 3, 4, 5].map((star) => (
                                                            <Star
                                                              key={star}
                                                              className={`w-4 h-4 ${star <= r.rating! ? "text-amber-400 fill-amber-400" : "text-slate-200"}`}
                                                            />
                                                          ))}
                                                        </div>
                                                        <span className="text-xs font-semibold text-amber-800">
                                                          {r.rating} / 5 Sao
                                                        </span>
                                                        {r.officerName && (
                                                          <span className="text-[10px] text-slate-400 font-normal">
                                                            (Cán bộ xử lý: {r.officerName})
                                                          </span>
                                                        )}
                                                      </div>
                                                      {r.ratingComment && (
                                                        <p className="text-xs text-slate-600 bg-white/60 px-2.5 py-1.5 rounded-lg border border-amber-500/5 italic">
                                                          "{r.ratingComment}"
                                                        </p>
                                                      )}
                                                      <div className="text-[9px] text-slate-400 font-mono text-right">
                                                        Đánh giá ngày: {r.ratedAt ? new Date(r.ratedAt).toLocaleDateString("vi-VN") : "Gần đây"}
                                                      </div>
                                                    </div>
                                                  ) : (
                                                    <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3.5 space-y-3">
                                                      <p className="text-[11px] text-slate-500 font-light">
                                                        Bà con vui lòng đánh giá mức độ hài lòng đối với sự hỗ trợ của cán bộ xử lý hồ sơ <span className="font-bold">({r.officerName || "Cán bộ Phường Phú Lợi"})</span> để giúp chúng tôi phục vụ tốt hơn:
                                                      </p>
                                                      <div className="flex items-center space-x-4 w-full">
                                                        <RatingInput rId={r.id} onRatingSubmit={onRatingSubmit} />
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              )}
                                            </motion.div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            ) : citizenSubTab === "donations" ? (
                              <>
                                {/* TAB 2: DONATIONS */}
                                <div className="font-sans">
                                  <h4 className="font-bold text-base text-slate-800 flex items-center space-x-2 font-sans">
                                    <Award className="w-5 h-5 text-sky-500 animate-pulse" />
                                    <span>Nhật Ký Đóng Góp Cộng Đồng Của Tôi</span>
                                  </h4>
                                  <p className="text-slate-500 text-xs mt-1 font-light">
                                    Trân trọng ghi nhận và tri ân sâu sắc nghĩa cử cao đẹp, chung tay cùng địa phương thực hiện các chiến dịch an sinh tại phường Phú Lợi.
                                  </p>
                                </div>

                                {(() => {
                                  const myDons = donations.filter(d => 
                                    d.userId === currentUser.uid || 
                                    (currentUser.fullName && d.donorName.toLowerCase().trim() === currentUser.fullName.toLowerCase().trim())
                                  );

                                  if (myDons.length === 0) {
                                    return (
                                      <div className="p-12 text-center border border-dashed border-slate-200 rounded-2xl bg-blue-50/50 space-y-4 font-sans">
                                        <Heart className="w-10 h-10 text-red-400 mx-auto" />
                                        <div className="space-y-1">
                                          <h5 className="font-bold text-sm text-slate-800">Chưa ghi nhận khoản quyên góp nào</h5>
                                          <p className="text-xs text-slate-500 max-w-md mx-auto font-light leading-relaxed">
                                            Tài khoản số chưa liên kết với khoản quyên góp nào. Bà con có thể tham gia quyên góp tại thẻ **"Nhà Hảo Tâm & Sổ Vàng"** để cùng chung tay ủng hộ cộng đồng.
                                          </p>
                                        </div>
                                      </div>
                                    );
                                  }

                                  const totalAmount = myDons.reduce((sum, d) => sum + d.amount, 0);
                                  const donationCount = myDons.length;
                                  
                                  let honorLevel = "Tấm Lòng Đồng";
                                  let badgeColor = "bg-orange-50 border-orange-200 text-orange-600";
                                  if (totalAmount >= 100000000) {
                                    honorLevel = "Tấm Lòng Kim Cương ★★★";
                                    badgeColor = "bg-cyan-50 border-cyan-200 text-cyan-600";
                                  } else if (totalAmount >= 50000000) {
                                    honorLevel = "Tấm Lòng Bạch Kim ★★";
                                    badgeColor = "bg-slate-100 border-slate-300 text-slate-500";
                                  } else if (totalAmount >= 10000000) {
                                    honorLevel = "Tấm Lòng Vàng ★";
                                    badgeColor = "bg-yellow-50 border-yellow-200 text-sky-600";
                                  } else if (totalAmount >= 5000000) {
                                    honorLevel = "Tấm Lòng Bạc";
                                    badgeColor = "bg-slate-50 border-slate-200 text-slate-500";
                                  }

                                  return (
                                    <div className="space-y-6 font-sans">
                                      {/* Stats widgets */}
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="p-5 bg-gradient-to-tr from-blue-50 to-indigo-50 border border-slate-200/50 rounded-2xl relative overflow-hidden shadow-sm">
                                          <div className="absolute right-3 bottom-3 opacity-15">
                                            <Coins className="w-14 h-14 text-slate-800" />
                                          </div>
                                          <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">Tổng đóng góp</span>
                                          <span className="text-2xl font-black text-slate-800 font-mono mt-2 block">
                                            {(totalAmount || 0).toLocaleString("vi-VN")}đ
                                          </span>
                                        </div>

                                        <div className="p-5 bg-gradient-to-tr from-emerald-50 to-teal-50 border border-emerald-100/50 rounded-2xl relative overflow-hidden shadow-sm">
                                          <div className="absolute right-3 bottom-3 opacity-15">
                                            <Heart className="w-14 h-14 text-emerald-600" />
                                          </div>
                                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Số lượt ủng hộ</span>
                                          <span className="text-2xl font-black text-emerald-600 font-mono mt-2 block">
                                            {donationCount} lượt
                                          </span>
                                        </div>

                                        <div className="p-5 bg-gradient-to-tr from-blue-50 to-yellow-50 border border-blue-50/50 rounded-2xl relative overflow-hidden shadow-sm">
                                          <div className="absolute right-3 bottom-3 opacity-15">
                                            <Trophy className="w-14 h-14 text-sky-500" />
                                          </div>
                                          <span className="text-[10px] font-bold text-sky-700 uppercase tracking-wider block">Danh hiệu vinh danh</span>
                                          <span className="text-xs font-black text-sky-600 mt-3 block uppercase tracking-wider">
                                            {honorLevel}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="border-t border-slate-100 pt-5">
                                        <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider mb-4 font-sans">Chi Tiết Lịch Sử Đóng Góp</h5>
                                        
                                        <div className="grid grid-cols-1 gap-4 max-h-[320px] overflow-y-auto pr-1.5 custom-scrollbar">
                                          {myDons.map((d, idx) => (
                                            <motion.div 
                                              key={d.id} 
                                              initial={{ opacity: 0, y: 10 }}
                                              whileInView={{ opacity: 1, y: 0 }}
                                              viewport={{ once: true }}
                                              transition={{ duration: 0.3, delay: Math.min(10, idx) * 0.05 }}
                                              className="p-5 bg-white border border-slate-100 rounded-2xl space-y-4 relative overflow-hidden transition-all duration-300 hover:shadow-md hover:border-blue-100 group/don"
                                            >
                                              <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/[0.01] rounded-full blur-2xl -mr-8 -mt-8 pointer-events-none" />
                                              
                                              {/* Verified Watermark Stamp */}
                                              <div className="absolute right-20 top-4 rotate-12 opacity-5 select-none pointer-events-none border-2 border-double border-blue-600 p-1 font-bold text-slate-800 uppercase text-[9px] tracking-[0.2em] rounded">
                                                ĐÃ XÁC NHẬN ★ BCĐ PHÚ LỢI
                                              </div>

                                              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-3 relative z-10">
                                                <div className="space-y-1">
                                                  <div className="flex items-center space-x-2">
                                                    <span className="inline-flex px-2 py-0.5 rounded bg-sky-500 text-slate-300 font-bold text-[9px] font-mono border border-sky-500/10 shadow-inner">
                                                      #{d.id}
                                                    </span>
                                                    <span className="text-[10px] text-slate-500 font-mono">
                                                      {new Date(d.createdAt).toLocaleDateString("vi-VN")}
                                                    </span>
                                                  </div>
                                                  <h5 className="font-bold text-sm text-slate-800 mt-1 font-sans group-hover/don:text-slate-800 transition-colors">
                                                    {d.campaignTitle}
                                                  </h5>
                                                </div>
                                                <div className="shrink-0 text-left sm:text-right">
                                                  <span className="text-sky-600 font-black font-mono text-base sm:text-lg block">
                                                    +{(d.amount || 0).toLocaleString("vi-VN")}đ
                                                  </span>
                                                </div>
                                              </div>

                                              {d.message && (
                                                <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl leading-relaxed italic font-light border border-slate-100 relative z-10">
                                                  "{d.message}"
                                                </p>
                                              )}

                                              <div className="flex justify-end pt-1 relative z-10 border-t border-slate-100/60">
                                                <button
                                                  onClick={() => setViewedPersonalCertificate(d)}
                                                  className="inline-flex items-center space-x-1 text-sky-600 hover:text-sky-700 text-xs font-bold transition-all cursor-pointer"
                                                >
                                                  <Award className="w-4 h-4 text-sky-500" />
                                                  <span>Xem thư tri ân & Sổ Vàng</span>
                                                  <ChevronRight className="w-3.5 h-3.5 text-sky-500 transition-transform group-hover/don:translate-x-1" />
                                                </button>
                                              </div>
                                            </motion.div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </>
                            ) : citizenSubTab === "feedback" ? (
                              <>
                                {/* TAB: PARTY & POLITICAL SYSTEM CONTRIBUTION */}
                                <div className="space-y-6 font-sans">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                                    <div>
                                      <h4 className="font-bold text-base text-slate-800 flex items-center space-x-2 font-sans">
                                        <Vote className="w-5 h-5 text-red-600 animate-pulse" />
                                        <span>Góp Ý Xây Dựng Đảng & Hệ Thống Chính Trị</span>
                                      </h4>
                                      <p className="text-slate-500 text-xs mt-1 font-light">
                                        Ý kiến đóng góp, sáng kiến của bà con về sinh hoạt chi bộ, thủ tục hành chính, an ninh trật tự, môi trường, sự cố... sẽ được gửi trực tiếp đến Tổ tiếp nhận & Lãnh đạo hỗ trợ giải quyết thông tin.
                                      </p>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                    {/* Left side: Submit feedback form */}
                                    <div className="lg:col-span-5 bg-slate-50 border border-slate-200/50 p-5 rounded-2xl space-y-4">
                                      <h5 className="font-bold text-xs text-red-700 uppercase tracking-wider flex items-center space-x-1">
                                        <Edit3 className="w-4 h-4 text-red-600" />
                                        <span>Gửi ý kiến đóng góp mới</span>
                                      </h5>

                                      {contribSuccess ? (
                                        <motion.div
                                          initial={{ opacity: 0, scale: 0.95 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3"
                                        >
                                          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                                          <h6 className="font-bold text-xs text-emerald-800">Gửi góp ý thành công!</h6>
                                          <p className="text-[11px] text-slate-600 leading-normal font-light">
                                            Chân thành cảm ơn tinh thần xây dựng và phản ánh thiết thực của bà con. Ban tiếp nhận thông tin sẽ xem xét, phản hồi sớm nhất.
                                          </p>
                                          <button
                                            onClick={() => {
                                              setContribSuccess(false);
                                              setContribTitle("");
                                              setContribContent("");
                                            }}
                                            className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
                                          >
                                            Gửi ý kiến khác
                                          </button>
                                        </motion.div>
                                      ) : (
                                        <form
                                          onSubmit={async (e) => {
                                            e.preventDefault();
                                            if (!contribTitle.trim() || !contribContent.trim()) {
                                              showToast("Thiếu thông tin", "Vui lòng nhập tiêu đề và nội dung góp ý.", "warning");
                                              return;
                                            }
                                            setContribSaving(true);
                                            try {
                                              if (onSubmitPartyContribution) {
                                                await onSubmitPartyContribution({
                                                  title: contribTitle,
                                                  category: contribCategory,
                                                  content: contribContent,
                                                  isAnonymous: contribIsAnonymous,
                                                  userName: contribIsAnonymous ? "Ẩn danh" : (currentUser.fullName || "Người dân Phú Lợi"),
                                                  userPhone: contribIsAnonymous ? "" : (currentUser.phone || ""),
                                                  userEmail: contribIsAnonymous ? "" : (currentUser.email || ""),
                                                  userQuarter: currentUser.quarter || "",
                                                  status: "Mới nhận",
                                                  responseNotes: "",
                                                });
                                                setContribSuccess(true);
                                                showToast("Gửi thành công", "Ý kiến đóng góp xây dựng Đảng và hệ thống chính trị đã được chuyển đến ban tiếp nhận.", "success");
                                              }
                                            } catch (err) {
                                              console.error(err);
                                              showToast("Lỗi gửi góp ý", "Có lỗi xảy ra khi kết nối máy chủ.", "error");
                                            } finally {
                                              setContribSaving(false);
                                            }
                                          }}
                                          className="space-y-3"
                                        >
                                          <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Danh mục góp ý:</label>
                                            <select
                                              value={contribCategory}
                                              onChange={(e) => setContribCategory(e.target.value)}
                                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-semibold focus:outline-none focus:border-red-500/50"
                                            >
                                              <option value="Sinh hoạt chi bộ">Sinh hoạt chi bộ & Công tác Đảng</option>
                                              <option value="Thủ tục hành chính">Thủ tục hành chính & Phục vụ công</option>
                                              <option value="An ninh trật tự">An ninh trật tự & An toàn xã hội</option>
                                              <option value="Môi trường & Rác thải">Môi trường & Rác thải đô thị</option>
                                              <option value="Sự cố hạ tầng">Sự cố hạ tầng (Đường xá, Điện nước...)</option>
                                              <option value="Ý kiến khác">Ý kiến khác & Sáng kiến hiến kế</option>
                                            </select>
                                          </div>

                                          <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Tiêu đề góp ý:</label>
                                            <input
                                              type="text"
                                              placeholder="Nhập tiêu đề hoặc chủ đề tóm tắt..."
                                              value={contribTitle}
                                              onChange={(e) => setContribTitle(e.target.value)}
                                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-red-500/50"
                                              required
                                            />
                                          </div>

                                          <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Nội dung chi tiết:</label>
                                            <textarea
                                              placeholder="Nhập nội dung đóng góp ý kiến hoặc phản ánh chi tiết..."
                                              value={contribContent}
                                              onChange={(e) => setContribContent(e.target.value)}
                                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-red-500/50 leading-relaxed"
                                              rows={4}
                                              required
                                            />
                                          </div>

                                          <div className="flex items-center space-x-2 py-1">
                                            <input
                                              type="checkbox"
                                              id="contribAnonymous"
                                              checked={contribIsAnonymous}
                                              onChange={(e) => setContribIsAnonymous(e.target.checked)}
                                              className="w-3.5 h-3.5 text-red-600 border-slate-300 rounded focus:ring-red-500"
                                            />
                                            <label htmlFor="contribAnonymous" className="text-xs text-slate-600 font-medium select-none cursor-pointer">
                                              Gửi dưới dạng ẩn danh (Bảo mật danh tính)
                                            </label>
                                          </div>

                                          <button
                                            type="submit"
                                            disabled={contribSaving}
                                            className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-red-500/15 transition-all duration-200 flex items-center justify-center space-x-1 cursor-pointer disabled:opacity-50"
                                          >
                                            <Send className="w-4 h-4 text-slate-200" />
                                            <span>{contribSaving ? "Đang gửi..." : "Gửi ý kiến xây dựng"}</span>
                                          </button>
                                        </form>
                                      )}
                                    </div>

                                    {/* Right side: List of contributions submitted by current user, or showing resolving statuses */}
                                    <div className="lg:col-span-7 space-y-4">
                                      <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center space-x-1.5">
                                        <Activity className="w-4 h-4 text-red-600 animate-pulse" />
                                        <span>Lịch sử góp ý & kết quả tiếp nhận</span>
                                      </h5>

                                      {(() => {
                                        const myContributions = (partyContributions || []).filter(c => {
                                          if (c.isAnonymous) {
                                            return false;
                                          }
                                          return (
                                            (currentUser.phone && c.userPhone === currentUser.phone) ||
                                            (currentUser.email && c.userEmail === currentUser.email)
                                          );
                                        });

                                        if (myContributions.length === 0) {
                                          return (
                                            <div className="p-10 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50 space-y-3">
                                              <Vote className="w-8 h-8 text-slate-400 mx-auto" />
                                              <div className="space-y-1">
                                                <h6 className="font-bold text-xs text-slate-700">Chưa ghi nhận ý kiến đóng góp định danh</h6>
                                                <p className="text-[11px] text-slate-500 leading-relaxed font-light max-w-sm mx-auto font-sans">
                                                  Bà con chưa gửi ý kiến đóng góp chính danh nào trên hệ thống này. Góp ý của bà con giúp xây dựng chính quyền phường trong sạch, vững mạnh hơn!
                                                </p>
                                              </div>
                                            </div>
                                          );
                                        }

                                        return (
                                          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1.5 custom-scrollbar">
                                            {myContributions.map((c, idx) => (
                                              <motion.div
                                                key={c.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2, delay: idx * 0.05 }}
                                                className="p-4 bg-white border border-slate-200/60 rounded-xl space-y-3 shadow-sm hover:shadow-md transition-all border-l-4 border-l-red-500"
                                              >
                                                <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-2">
                                                  <div>
                                                    <span className="px-2 py-0.5 bg-red-50 border border-red-200 text-red-700 rounded-md text-[9px] font-bold font-mono">
                                                      {c.category}
                                                    </span>
                                                    <h6 className="font-bold text-xs text-slate-800 mt-1 font-sans">
                                                      {c.title}
                                                    </h6>
                                                  </div>
                                                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                                                    c.status === "Đã tiếp thu" || c.status === "Đã giải quyết"
                                                      ? "bg-emerald-500/10 text-emerald-700 border border-emerald-500/10"
                                                      : c.status === "Đang tiếp thu"
                                                      ? "bg-sky-500/10 text-sky-700 border border-sky-500/10"
                                                      : "bg-slate-100 text-slate-600"
                                                  }`}>
                                                    {c.status || "Mới nhận"}
                                                  </span>
                                                </div>

                                                <p className="text-xs text-slate-600 italic font-light leading-relaxed">
                                                  "{c.content}"
                                                </p>

                                                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                                                  <span>Người gửi: {c.isAnonymous ? "Ẩn danh" : c.userName}</span>
                                                  <span>{new Date(c.createdAt).toLocaleDateString("vi-VN")}</span>
                                                </div>

                                                {/* Official Response */}
                                                {c.responseNotes ? (
                                                  <div className="p-3 bg-red-500/[0.02] border border-red-500/10 rounded-xl space-y-1">
                                                    <div className="flex items-center space-x-1 text-red-700 text-[10px] font-bold uppercase tracking-wider">
                                                      <Sparkles className="w-3.5 h-3.5 text-red-600" />
                                                      <span>Phản hồi từ Ban Thường Vụ Đảng Ủy:</span>
                                                    </div>
                                                    <p className="text-xs text-slate-600 leading-normal font-light italic">
                                                      "{c.responseNotes}"
                                                    </p>
                                                    {c.respondedBy && (
                                                      <div className="text-[9px] text-slate-400 font-mono text-right mt-1">
                                                        Người xử lý: {c.respondedBy}
                                                      </div>
                                                    )}
                                                  </div>
                                                ) : (
                                                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center space-x-1.5 text-slate-500 text-[10px]">
                                                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" />
                                                    <span>Ý kiến của bà con đã được tiếp nhận và đang chuyển đến phòng ban chuyên môn giải quyết...</span>
                                                  </div>
                                                )}
                                              </motion.div>
                                            ))}
                                          </div>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                </div>
                              </>
                            ) : citizenSubTab === "volunteer" ? (
                              <>
                                <div className="space-y-6">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                                    <div>
                                      <h4 className="font-bold text-base text-slate-800 flex items-center space-x-2 font-sans">
                                        <HeartHandshake className="w-5 h-5 text-sky-500" />
                                        <span>Lịch Sử Đăng Ký Sự Kiện Tình Nguyện Của Tôi</span>
                                      </h4>
                                      <p className="text-slate-500 text-xs mt-1 font-light">
                                        Dưới đây là danh sách các sự kiện tình nguyện quý công dân đã đăng ký tham gia đóng góp sức trẻ cho địa phương.
                                      </p>
                                    </div>
                                  </div>

                                  <CitizenVolunteerList currentUser={currentUser} />
                                </div>
                              </>
                            ) : citizenSubTab === "badges" ? (
                              <>
                                <div className="space-y-6">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                                    <div>
                                      <h4 className="font-bold text-base text-slate-800 flex items-center space-x-2 font-sans">
                                        <Trophy className="w-5 h-5 text-sky-500" />
                                        <span>Ví Huy Hiệu Tình Nguyện Số Của Tôi</span>
                                      </h4>
                                      <p className="text-slate-500 text-xs mt-1 font-light">
                                        Ví điện tử lưu trữ và vinh danh các cấp bậc & huy hiệu số bà con đã đóng góp tích lũy trên Hệ thống An Sinh Phường Phú Lợi.
                                      </p>
                                    </div>
                                  </div>

                                  <div className="max-w-2xl mx-auto">
                                    <DigitalBadgeWallet 
                                      currentUser={currentUser} 
                                      onNavigateTab={(tab) => setCitizenSubTab(tab as any)}
                                      showToast={showToast}
                                    />
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                {/* TAB 3: FEEDBACK / COMMUNITY MONITORING */}
                                <div className="space-y-6">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                                    <div>
                                      <h4 className="font-bold text-base text-slate-800 flex items-center space-x-2 font-sans">
                                        <Send className="w-5 h-5 text-sky-500" />
                                        <span>Cổng Góp Ý & Giám Sát Nhân Dân</span>
                                      </h4>
                                      <p className="text-slate-500 text-xs mt-1 font-light">
                                        Nơi tiếp nhận phản ánh, đóng góp ý kiến và giám sát tiến trình giải quyết an sinh xã hội tại địa phương dưới sự phối hợp của <strong>Ủy ban MTTQ Việt Nam Phường Phú Lợi</strong>.
                                      </p>
                                    </div>
                                  </div>

                                  {/* Grid for submission and list */}
                                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                    
                                    {/* Left: Submit form (5 cols) */}
                                    <div className="lg:col-span-5 bg-slate-50/50 border border-slate-200/60 p-5 rounded-2xl shadow-xs space-y-4">
                                      <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center space-x-1">
                                        <HeartHandshake className="w-4 h-4 text-sky-500" />
                                        <span>Gửi Góp Ý / Phản Ánh Mới</span>
                                      </h5>

                                      <form onSubmit={handleFeedbackSubmit} className="space-y-3">
                                        <div>
                                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Chủ đề phản ánh *</label>
                                          <select
                                            value={feedbackTopic}
                                            onChange={(e) => setFeedbackTopic(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500/50 transition-colors font-medium text-slate-800 bg-white"
                                          >
                                            <option value="Chính sách & Cứu trợ">Chính sách & Cứu trợ an sinh</option>
                                            <option value="Vệ sinh & Môi trường">Vệ sinh & Môi trường đô thị</option>
                                            <option value="Nếp sống văn minh">Nếp sống văn minh khu phố</option>
                                            <option value="Thái độ phục vụ">Thái độ phục vụ của cán bộ</option>
                                            <option value="Đóng góp ý kiến khác">Đóng góp ý kiến khác</option>
                                          </select>
                                        </div>

                                        <div>
                                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Địa bàn liên quan *</label>
                                          <select
                                            value={feedbackQuarter}
                                            onChange={(e) => setFeedbackQuarter(e.target.value)}
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500/50 transition-colors font-medium text-slate-800 bg-white"
                                          >
                                            {QUARTERS_LIST.map(kp => (
                                              <option key={kp.id} value={kp.name}>{kp.name}</option>
                                            ))}
                                          </select>
                                        </div>

                                        <div>
                                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Nội dung chi tiết *</label>
                                          <textarea
                                            rows={4}
                                            required
                                            value={feedbackContent}
                                            onChange={(e) => setFeedbackContent(e.target.value)}
                                            placeholder="Mô tả chi tiết ý kiến đóng góp, phản ánh của bà con (địa điểm, sự việc, đề xuất giải pháp...)"
                                            className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-sky-500/50 transition-colors placeholder:text-slate-500 font-light"
                                          />
                                        </div>

                                        <div>
                                          <label className="block text-[9px] font-bold text-slate-500 uppercase mb-1">Đính kèm hình ảnh (Tuỳ chọn)</label>
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="text"
                                              readOnly
                                              value={feedbackImageUrl}
                                              placeholder={feedbackImageUrl ? "Đã đính kèm ảnh" : "Chưa chọn ảnh..."}
                                              className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-500 focus:outline-none focus:border-sky-500/50 transition-colors font-light"
                                            />
                                            <label className="bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer flex items-center shrink-0 border border-sky-100 shadow-3xs">
                                              <span>{isUploadingFeedbackImage ? "Đang tải..." : "Tải ảnh lên"}</span>
                                              <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                disabled={isUploadingFeedbackImage}
                                                onClick={async (e) => { const token = await getAccessToken(); if (!token) { e.preventDefault(); try { await googleSignIn(); alert("Đã kết nối Google Drive! Vui lòng nhấn chọn ảnh lại."); } catch (err) { alert("Lỗi: " + (err.message || err)); } } }}
                                                onChange={async (e) => {
                                                  const file = e.target.files?.[0];
                                                  if (file) {
                                                    setIsUploadingFeedbackImage(true);
                                                    try {
                                                      let token = await getAccessToken();
                                                      if (!token) {
                                                        const authResult = await googleSignIn();
                                                        token = authResult?.accessToken || null;
                                                      }
                                                      if (!token) throw new Error("Authentication failed");
                                                      
                                                      const FOLDER_ID = "1I_T3tDST5TBbOgWusxsmfKT0VuitlCFi";
                                                      const metadata = { name: `${Date.now()}_${file.name}`, parents: [FOLDER_ID] };
                                                      const form = new FormData();
                                                      form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
                                                      form.append('file', file);
                                                      
                                                      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
                                                      const data = await response.json();
                                                      if (data.id) {
                                                        setFeedbackImageUrl(`https://drive.google.com/uc?id=${data.id}`);
                                                      } else {
                                                        throw new Error(data.error?.message || "Upload failed");
                                                      }
                                                    } catch (error) {
                                                      console.error("Upload error", error);
                                                      alert("Không thể tải lên hình ảnh. Vui lòng thử lại.");
                                                    } finally {
                                                      setIsUploadingFeedbackImage(false);
                                                    }
                                                  }
                                                }}
                                              />
                                            </label>
                                          </div>
                                        </div>
                                        <div className="flex items-center space-x-2 py-1">
                                          <input
                                            type="checkbox"
                                            id="anonymous"
                                            checked={feedbackAnonymous}
                                            onChange={(e) => setFeedbackAnonymous(e.target.checked)}
                                            className="rounded text-sky-500 focus:ring-sky-500 w-3 h-3 cursor-pointer bg-white border-slate-200"
                                          />
                                          <label htmlFor="anonymous" className="text-[10px] text-slate-500 select-none cursor-pointer">
                                            Phản ánh ẩn danh (bảo mật danh tính cá nhân)
                                          </label>
                                        </div>

                                        {feedbackSuccess && (
                                          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-lg text-[10px] font-bold">
                                            {feedbackSuccess}
                                          </div>
                                        )}

                                        <button
                                          type="submit"
                                          className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer"
                                        >
                                          <Send className="w-3.5 h-3.5" />
                                          <span>Gửi Ý Kiến Phản Ánh</span>
                                        </button>
                                      </form>
                                    </div>

                                    {/* Right: Feedback List & Action Status (7 cols) */}
                                    <div className="lg:col-span-7 space-y-4">
                                      <h5 className="font-bold text-xs text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-200 flex items-center space-x-1.5">
                                        <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
                                        <span>Danh Sách Phản Ánh Đang Giám Sát</span>
                                      </h5>

                                      <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
                                        {feedbacks.length === 0 ? (
                                          <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl bg-white space-y-2">
                                            <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
                                            <p className="text-xs text-slate-500 font-light">Chưa có phản ánh nào được ghi nhận gần đây.</p>
                                          </div>
                                        ) : (
                                          feedbacks.map((item, idx) => (
                                            <motion.div 
                                              key={item.id} 
                                              initial={{ opacity: 0, y: 10 }}
                                              whileInView={{ opacity: 1, y: 0 }}
                                              viewport={{ once: true }}
                                              transition={{ duration: 0.3, delay: Math.min(10, idx) * 0.05 }}
                                              className="p-4 bg-white border border-slate-100 rounded-2xl space-y-3 relative overflow-hidden shadow-xs hover:border-slate-200 transition-colors"
                                            >
                                              
                                              {/* Header of FeedBack Item */}
                                              <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-2">
                                                <div className="space-y-0.5">
                                                  <div className="flex items-center space-x-1.5">
                                                    <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200/50 text-slate-500 text-[8px] font-mono font-bold">
                                                      #{item.id}
                                                    </span>
                                                    <span className="text-[10px] font-semibold text-slate-700 bg-blue-50 px-2 py-0.5 rounded-full">
                                                      {item.category}
                                                    </span>
                                                  </div>
                                                  <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                                                    Địa bàn: <strong className="text-slate-700">{item.quarter}</strong> • {item.date}
                                                  </div>
                                                </div>

                                                <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                                                  item.status === "Đã giải quyết" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                                  item.status === "Đang xử lý" ? "bg-sky-500/10 text-sky-600 border-sky-500/20" :
                                                  "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                                }`}>
                                                  <span className={`w-1 h-1 rounded-full ${
                                                    item.status === "Đã giải quyết" ? "bg-emerald-500" :
                                                    item.status === "Đang xử lý" ? "bg-sky-500 animate-pulse" :
                                                    "bg-amber-500"
                                                  }`} />
                                                  <span>{item.status}</span>
                                                </span>
                                              </div>

                                              {/* Content */}
                                              <div className="text-xs text-slate-500 leading-relaxed font-sans">
                                                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Nội dung góp ý:</div>
                                                <p className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 italic">
                                                  "{item.content}"
                                                </p>
                                                <div className="text-[9px] text-slate-500 font-light mt-1 flex justify-between">
                                                  <span>Người gửi: <strong>{item.name}</strong></span>
                                                </div>
                                              </div>

                                              {/* UBMTTQ response if available */}
                                              {item.response && (
                                                <div className="p-2.5 bg-sky-500/[0.02] border border-blue-500/10 rounded-xl space-y-1 text-xs">
                                                  <div className="text-[9px] font-bold text-sky-600 uppercase tracking-wider flex items-center space-x-1">
                                                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-500" />
                                                    <span>ỦY BAN MTTQ PHƯỜNG PHÚ LỢI TRẢ LỜI:</span>
                                                  </div>
                                                  <p className="text-slate-500 font-medium italic pl-1 text-[11px]">
                                                    "{item.response}"
                                                  </p>
                                                </div>
                                              )}
                                            </motion.div>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                    
                                  </div>
                                </div>
                              </>
                            )}
                          </div>

                        </div>
                      );
                    })()}
                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB: VOLUNTEER REGISTRATION FOR COMMUNITY EVENTS */}
          {activeTab === "volunteer" && (
            <div className="space-y-8 animate-fadeIn" id="content-volunteer">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left side: Intro, Statistics, and Event Listing */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-gradient-to-br from-sky-50 to-indigo-50 border border-sky-100 rounded-2xl p-6 space-y-4 text-left">
                    <div className="flex items-center space-x-3 text-sky-600">
                      <div className="p-2 bg-white rounded-xl shadow-md">
                        <HeartHandshake className="w-6 h-6 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-blue-950 text-sm sm:text-base">Liên minh Tình nguyện viên Phú Lợi</h4>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-sky-500">Chung tay vì cộng đồng văn minh</span>
                      </div>
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed font-light">
                      Hãy tham gia cùng hàng trăm công dân tích cực của Phường Phú Lợi trong các chiến dịch bảo vệ môi trường, hỗ trợ người khẩn cấp, chăm sóc cụ già neo đơn và trẻ em cơ nhỡ. Mỗi đóng góp nhỏ của quý bà con đều kiến tạo nên những thay đổi to lớn.
                    </p>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="bg-white/80 p-3 rounded-xl border border-sky-100 text-center">
                        <div className="text-xl font-extrabold text-sky-600 font-mono">250+</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Tình nguyện viên</div>
                      </div>
                      <div className="bg-white/80 p-3 rounded-xl border border-sky-100 text-center">
                        <div className="text-xl font-extrabold text-indigo-600 font-mono">18+</div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">Chiến dịch hoàn thành</div>
                      </div>
                    </div>
                  </div>

                  {/* Upcoming Volunteer Events list */}
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-sky-500" />
                      <span>Sự Kiện Tình Nguyện Sắp Diễn Ra</span>
                    </h4>
                    
                    <div className="space-y-3">
                      {(events && events.length > 0) ? (
                        events.map((evt, idx) => (
                          <motion.div 
                            key={evt.id} 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: Math.min(10, idx) * 0.05 }}
                            className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:border-sky-300 transition-all flex gap-3.5 items-start"
                          >
                            <div className="p-2.5 rounded-xl text-center min-w-[50px]" style={{ backgroundColor: evt.bgColor || '#f0fdf4', color: evt.textColor || '#16a34a' }}>
                              <span className="block text-xs font-black uppercase font-mono">{evt.date.split('/')[0]}</span>
                              <span className="block text-[9px] font-bold uppercase tracking-wider -mt-1">Th{evt.date.split('/')[1]}</span>
                            </div>
                            <div className="space-y-1 text-left flex-1 min-w-0">
                              <h5 className="font-bold text-slate-800 text-xs sm:text-sm truncate">{evt.title}</h5>
                              <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-3">
                                <span>⏰ {evt.time}</span>
                                <span className="truncate">📍 {evt.location}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 font-light line-clamp-2 pt-1 leading-relaxed">{evt.description}</p>
                            </div>
                          </motion.div>
                        ))
                      ) : (
                        // Fallback events if no events passed
                        [
                          {
                            id: "evt-01",
                            title: "Ngày Thứ Bảy Văn Minh - Dọn vệ sinh môi trường",
                            date: "18/07/2026",
                            time: "07:00 - 10:30",
                            location: "Công viên khu phố 4, Phường Phú Lợi",
                            description: "Tuyên truyền nâng cao ý thức giữ gìn vệ sinh chung, tổ chức ra quân dọn rác, làm sạch các tuyến đường thanh niên tự quản."
                          },
                          {
                            id: "evt-02",
                            title: "Phát bữa cơm ấm lòng cho người vô gia cư & neo đơn",
                            date: "22/07/2026",
                            time: "16:30 - 19:30",
                            location: "Văn phòng UBMTTQ Phường Phú Lợi",
                            description: "Phối hợp cùng các nhà hảo tâm chuẩn bị và trao tận tay 200 suất cơm dinh dưỡng cho các cụ già bán vé số, lao động nghèo trên địa bàn."
                          },
                          {
                            id: "evt-03",
                            title: "Hỗ trợ rà soát cập nhật hồ sơ an sinh xã hội",
                            date: "25/07/2026",
                            time: "08:00 - 11:30",
                            location: "Văn phòng các khu phố 1 - 9",
                            description: "Hỗ trợ cán bộ phường nhập liệu, khảo sát thực trạng bà con gặp khó khăn, hướng dẫn cài đặt và sử dụng ứng dụng an sinh số Phú Lợi."
                          }
                        ].map((evt, idx) => (
                          <motion.div 
                            key={evt.id} 
                            initial={{ opacity: 0, y: 10 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.3, delay: Math.min(10, idx) * 0.05 }}
                            className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-sm hover:border-sky-300 transition-all flex gap-3.5 items-start"
                          >
                            <div className="p-2 bg-sky-50 rounded-xl text-center min-w-[50px] text-sky-600 border border-sky-100/50">
                              <span className="block text-xs font-black uppercase font-mono">{evt.date.split('/')[0]}</span>
                              <span className="block text-[9px] font-bold uppercase tracking-wider -mt-1">Th{evt.date.split('/')[1]}</span>
                            </div>
                            <div className="space-y-1 text-left flex-1 min-w-0">
                              <h5 className="font-bold text-slate-800 text-xs sm:text-sm truncate">{evt.title}</h5>
                              <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-3">
                                <span>⏰ {evt.time}</span>
                                <span className="truncate">📍 {evt.location}</span>
                              </div>
                              <p className="text-[11px] text-slate-500 font-light line-clamp-2 pt-1 leading-relaxed">{evt.description}</p>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Interactive Form */}
                <div className="lg:col-span-7 bg-white/80 border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-xl space-y-6">
                  <div className="text-left border-b border-slate-100 pb-4">
                    <h4 className="font-black text-slate-800 text-lg">Đơn Đăng Ký Tham Gia Hoạt Động Tình Nguyện</h4>
                    <p className="text-xs text-slate-500 mt-1">Thông tin đăng ký sẽ được Mặt trận Tổ quốc và Ban tổ chức sự kiện lưu giữ bảo mật và liên hệ trực tiếp qua số điện thoại/email.</p>
                  </div>

                  <VolunteerRegForm 
                    currentUser={currentUser}
                    events={events}
                    showToast={showToast}
                  />
                </div>

              </div>
            </div>
          )}

          {/* TAB 6: CITIZEN SURVEYS FOR PARTICIPATION / VOTING */}
          {activeTab === "survey" && (
            <div className="space-y-6">
              <CitizenSurvey
                currentUser={currentUser}
                onOpenAuthModal={onAuthClick || (() => {})}
                showToast={showToast}
                resultsOnly={false}
              />
            </div>
          )}

          {/* TAB 8: BOOKMARKS / YÊU THÍCH */}
          {activeTab === "bookmarks" && (
            <div className="space-y-8 animate-fadeIn" id="content-bookmarks">
              <div className="border-b border-slate-150 pb-4">
                <h3 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
                  <Bookmark className="w-5 h-5 text-sky-500 fill-sky-500" />
                  <span>Danh Sách Tin Tức & Chiến Dịch Yêu Thích</span>
                </h3>
                <p className="text-xs text-slate-500 font-light mt-1">
                  Nơi lưu trữ các tin tức quan trọng và chiến dịch an sinh xã hội mà bạn quan tâm để xem lại bất cứ lúc nào.
                </p>
              </div>

              {savedCampaigns.length === 0 && savedNews.length === 0 ? (
                <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200 flex flex-col items-center justify-center max-w-xl mx-auto">
                  <Bookmark className="w-12 h-12 text-slate-350 mb-3 animate-bounce" />
                  <h4 className="font-bold text-sm text-slate-700">Chưa có mục yêu thích nào</h4>
                  <p className="text-xs text-slate-400 font-light max-w-md mt-2 px-4 leading-relaxed">
                    Bạn có thể nhấn vào biểu tượng <Bookmark className="inline-block w-3.5 h-3.5 mx-1" /> (Yêu thích) ở góc phải của các chiến dịch quyên góp hoặc dưới mỗi bản tin Facebook để lưu lại tại đây.
                  </p>
                </div>
              ) : (
                <div className="space-y-10">
                  {/* SAVED CAMPAIGNS */}
                  {savedCampaigns.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                        <span className="w-1.5 h-4 bg-sky-500 rounded-full" />
                        <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Chiến dịch quyên góp đã lưu ({savedCampaigns.length})</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {savedCampaigns.map((camp, cIdx) => {
                          const progressPercent = Math.min(100, Math.round((camp.currentAmount / camp.targetAmount) * 100));
                          return (
                            <motion.div 
                              key={`fav-camp-${camp.id}`} 
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: cIdx * 0.05 }}
                              className="p-5 border border-slate-200 rounded-3xl flex flex-col justify-between space-y-4 bg-white shadow-sm hover:shadow-md hover:border-sky-200 transition-all duration-300 relative group/camp"
                            >
                              <div className="space-y-2">
                                {camp.imageUrl && (
                                  <div className="w-full h-32 rounded-lg overflow-hidden mb-2">
                                    <img src={camp.imageUrl} alt={camp.title} className="w-full h-full object-cover" />
                                  </div>
                                )}
                                <div className="flex justify-between items-center">
                                  <span className="text-[9px] uppercase font-bold text-slate-800 bg-sky-600/10 border border-sky-500/25 px-2.5 py-0.5 rounded-full">{camp.category}</span>
                                  <div className="flex items-center space-x-1">
                                    {/* Share Button */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleShareCampaign(camp);
                                      }}
                                      className="p-1.5 rounded-full text-slate-400 hover:text-sky-500 hover:bg-slate-50 transition-all duration-200 cursor-pointer"
                                      title="Chia sẻ chiến dịch"
                                    >
                                      <Share2 className="w-4 h-4" />
                                    </button>

                                    {/* Bookmark Button */}
                                    <button
                                      type="button"
                                      onClick={() => onToggleBookmarkCampaign(camp.id)}
                                      className="p-1.5 rounded-full text-amber-500 hover:text-slate-400 hover:bg-slate-50 transition-all duration-200 cursor-pointer"
                                      title="Xóa khỏi mục yêu thích"
                                    >
                                      <Bookmark className="w-4 h-4 fill-amber-500 text-amber-500" />
                                    </button>
                                  </div>
                                </div>
                                <h4 className="font-bold text-sm text-slate-800 leading-snug font-sans">{camp.title}</h4>
                                <p className="text-[10px] text-slate-500 leading-normal font-light line-clamp-2">{camp.description}</p>
                              </div>

                              {/* Progress bar */}
                              <div className="space-y-1.5 pt-1">
                                <div className="flex justify-between items-center text-[10px] font-bold">
                                  <span className="text-slate-500 font-medium">Đạt: {progressPercent}%</span>
                                  <span className="text-slate-800 font-mono">Mục tiêu: {new Intl.NumberFormat("vi-VN").format(camp.targetAmount)}đ</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-blue-50/50">
                                  <div className="bg-gradient-to-r from-slate-800 to-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                                </div>
                              </div>

                              <button 
                                onClick={() => setSelectedCampaign(camp)}
                                className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-2 rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all duration-300 shadow-md shadow-sky-500/10"
                              >
                                Ủng hộ ngay
                              </button>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* SAVED NEWS */}
                  {savedNews.length > 0 && (
                    <div className="space-y-4 pt-4">
                      <div className="flex items-center space-x-2 border-b border-slate-100 pb-2">
                        <span className="w-1.5 h-4 bg-sky-500 rounded-full" />
                        <h4 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Tin tức & Bản tin đã lưu ({savedNews.length})</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {savedNews.map((item, nIdx) => (
                          <motion.article
                            key={`fav-news-${item.id}`}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: nIdx * 0.05 }}
                            className="bg-white rounded-3xl border border-slate-200 p-4 flex gap-4 hover:border-sky-200 transition-all duration-300 shadow-sm hover:shadow-md"
                          >
                            <div className="relative w-24 sm:w-28 h-24 shrink-0 bg-slate-100 rounded-xl overflow-hidden">
                              <img
                                src={item.imageUrl || "https://lh3.googleusercontent.com/d/1MT0t2jwh0jomWuJmtMxyT59XTjDHJ2AP"}
                                alt={item.title}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                              <span className="absolute top-1.5 left-1.5 bg-blue-600/90 backdrop-blur-sm text-white text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full shadow-sm">
                                {item.category}
                              </span>
                            </div>

                            <div className="flex-1 flex flex-col justify-between min-w-0">
                              <div>
                                <div className="flex items-center text-[9px] text-slate-400 font-medium mb-1">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  <span>{item.date}</span>
                                </div>
                                <h3 className="text-xs font-bold text-blue-900 leading-snug line-clamp-2">
                                  {item.title}
                                </h3>
                                <p className="text-slate-500 text-[10px] font-light mt-1 line-clamp-2">
                                  {item.body}
                                </p>
                              </div>

                              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                                <button
                                  type="button"
                                  onClick={() => onToggleBookmarkNews(item.id)}
                                  className="flex items-center space-x-1 text-[9px] font-bold uppercase tracking-wider text-amber-500 hover:text-slate-400 transition-colors cursor-pointer"
                                  title="Bỏ lưu bài viết"
                                >
                                  <Bookmark className="w-3 h-3 fill-amber-500 text-amber-500" />
                                  <span>Bỏ lưu</span>
                                </button>

                                <a
                                  href={item.originalUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9px] font-medium text-slate-400 hover:text-blue-900 flex items-center space-x-1 transition-colors bg-slate-50 px-2 py-1 rounded-md border border-slate-100"
                                >
                                  <span>Đọc tiếp</span>
                                  <span className="text-[8px]">↗</span>
                                </a>
                              </div>
                            </div>
                          </motion.article>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
        {/* Personal Registration Certificate View */}
        {viewedPersonalCertificate && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop blur */}
          <div 
            className="fixed inset-0 bg-white/85 backdrop-blur-sm transition-opacity" 
            onClick={() => setViewedPersonalCertificate(null)}
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative bg-sky-500 border border-blue-600 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 z-20 overflow-hidden"
          >
            {/* Close button */}
            <button 
              onClick={() => setViewedPersonalCertificate(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-500 cursor-pointer z-30 bg-sky-500/80 p-1.5 rounded-full hover:bg-slate-700/80"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {/* Certificate content */}
            <div className="border-4 border-double border-blue-300/40 p-6 sm:p-8 bg-white backdrop-blur-md rounded-xl relative overflow-hidden text-center golden-shimmer shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]" id="personal-golden-certificate">
              {/* Decorative elements */}
              <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-sky-500/50" />
              <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-sky-500/50" />
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-sky-500/50" />
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-sky-500/50" />
              
              <div className="space-y-4">
                <span className="text-[10px] font-bold tracking-[0.2em] text-sky-600 uppercase block">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</span>
                <span className="text-[9px] font-bold text-slate-750 block -mt-3">Độc lập - Tự do - Hạnh phúc</span>
                <div className="w-16 h-px bg-slate-300 mx-auto -mt-1" />
                
                <div className="pt-2 text-center">
                  <Trophy className="w-8 h-8 text-sky-500 mx-auto animate-pulse" />
                  <h4 className="font-bold text-sky-600 text-sm sm:text-base uppercase tracking-wider mt-1 font-sans">GIẤY CHỨNG NHẬN</h4>
                  <span className="text-[10px] font-bold text-sky-600 block mt-0.5 tracking-[0.2em]">TẤM LÒNG VÀNG</span>
                </div>

                <p className="text-[11px] text-slate-500 italic font-light leading-relaxed">
                  Ban chỉ đạo Chương trình An sinh xã hội số phường Phú Lợi, Thành phố Hồ Chí Minh kính ghi nhận và tri ân sâu sắc:
                </p>

                <div>
                  <h5 className="font-bold text-base sm:text-lg text-sky-600 border-b border-dashed border-sky-500/20 pb-1 inline-block px-4 font-sans">
                    {viewedPersonalCertificate.donorName}
                  </h5>
                </div>

                <p className="text-[11px] text-slate-500 leading-relaxed font-light">
                  Đã có nghĩa cử cao đẹp, chung tay đóng góp số tiền quý báu:<br />
                  <span className="font-bold text-base text-sky-600 font-mono mt-1 block">
                    {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(viewedPersonalCertificate.amount)}
                  </span>
                </p>

                <p className="text-[11px] text-slate-500 leading-tight font-light">
                  Ủng hộ chiến dịch: <span className="font-bold text-slate-850">{viewedPersonalCertificate.campaignTitle}</span>
                </p>

                {viewedPersonalCertificate.message && (
                  <p className="text-[10px] text-slate-500 bg-sky-500/5 p-2.5 rounded-lg border border-sky-500/10 max-w-xs mx-auto italic leading-normal font-light">
                    "{viewedPersonalCertificate.message}"
                  </p>
                )}

                <div className="pt-4 flex justify-between items-end text-left">
                  <div className="text-[9px] text-slate-500 font-mono leading-relaxed">
                    Số: {viewedPersonalCertificate.id}<br />
                    Ngày: {new Date(viewedPersonalCertificate.createdAt).toLocaleDateString("vi-VN")}
                  </div>
                  
                  {/* Official Stamp */}
                  <div className="relative flex flex-col items-center shrink-0">
                    <div className="w-14 h-14 rounded-full border-4 border-dashed border-sky-500/50 flex items-center justify-center font-bold text-sky-600 text-[8px] uppercase tracking-tighter text-center rotate-12 bg-blue-50 shadow-inner">
                      <span>ỦY BAN PHƯỜNG<br />PHÚ LỢI<br />★ AN SINH ★</span>
                    </div>
                    <span className="text-[8px] font-bold text-slate-500 mt-1 text-center block font-sans">BCĐ AN SINH SỐ</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center space-x-3 text-xs">
              <button 
                onClick={() => window.print()}
                className="bg-sky-500 hover:bg-sky-500 text-white font-bold px-4 py-2 rounded-xl flex items-center space-x-1 transition duration-150 cursor-pointer shadow"
              >
                <Printer className="w-4 h-4" />
                <span>In Chứng Nhận</span>
              </button>
              <button 
                onClick={() => setViewedPersonalCertificate(null)}
                className="bg-sky-500 hover:bg-slate-700 text-slate-300 font-bold px-4 py-2 rounded-xl transition duration-150 cursor-pointer shadow border border-slate-200"
              >
                Đóng
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Share Modal rendering */}
      {selectedShareCampaign && (
        <ShareModal
          isOpen={isShareOpen}
          onClose={() => {
            setIsShareOpen(false);
            setSelectedShareCampaign(null);
          }}
          title="Chia sẻ Chiến dịch An sinh"
          shareTitle={selectedShareCampaign.title}
          shareText={selectedShareCampaign.description}
          shareUrl={`${window.location.origin}${window.location.pathname}?tab=charity&campaignId=${selectedShareCampaign.id}`}
          showToast={showToast}
        />
      )}
      </div>
    </section>
  );
}

interface VolunteerRegFormProps {
  currentUser: UserProfile | null;
  events?: CalendarEvent[];
  showToast: (title: string, message: string, type: "success" | "info" | "warning" | "error") => void;
}

function VolunteerRegForm({ currentUser, events = [], showToast }: VolunteerRegFormProps) {
  const [volName, setVolName] = useState("");
  const [volPhone, setVolPhone] = useState("");
  const [volEmail, setVolEmail] = useState("");
  const [volQuarter, setVolQuarter] = useState(QUARTERS_LIST[0].name);
  const [volEventId, setVolEventId] = useState("");
  const [volEventTitle, setVolEventTitle] = useState("");
  const [volSkills, setVolSkills] = useState("");
  const [volReason, setVolReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ticketResult, setTicketResult] = useState<VolunteerRegistration | null>(null);

  // Sync with current logged-in user
  useEffect(() => {
    if (currentUser) {
      setVolName(currentUser.fullName);
      setVolPhone(currentUser.phone);
      setVolEmail(currentUser.email || "");
      setVolQuarter(currentUser.quarter);
    } else {
      setVolName("");
      setVolPhone("");
      setVolEmail("");
      setVolQuarter(QUARTERS_LIST[0].name);
    }
  }, [currentUser]);

  // Handle Event selection to keep title in state
  const availableEvents = events && events.length > 0 ? events : [
    { id: "evt-01", title: "Ngày Thứ Bảy Văn Minh - Dọn vệ sinh môi trường" },
    { id: "evt-02", title: "Phát bữa cơm ấm lòng cho người vô gia cư & neo đơn" },
    { id: "evt-03", title: "Hỗ trợ rà soát cập nhật hồ sơ an sinh xã hội" }
  ];

  useEffect(() => {
    if (availableEvents.length > 0 && !volEventId) {
      setVolEventId(availableEvents[0].id);
      setVolEventTitle(availableEvents[0].title);
    }
  }, [availableEvents, volEventId]);

  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setVolEventId(id);
    const matched = availableEvents.find(evt => evt.id === id);
    if (matched) {
      setVolEventTitle(matched.title);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!volName.trim()) {
      showToast("Lỗi nhập liệu", "Vui lòng nhập Họ và Tên của bạn.", "error");
      return;
    }
    if (!volPhone.trim() || !/^[0-9+]{8,15}$/.test(volPhone.trim())) {
      showToast("Lỗi nhập liệu", "Vui lòng nhập số điện thoại hợp lệ.", "error");
      return;
    }
    if (!volEmail.trim() || !/^\S+@\S+\.\S+$/.test(volEmail.trim())) {
      showToast("Lỗi nhập liệu", "Vui lòng nhập địa chỉ email liên hệ hợp lệ.", "error");
      return;
    }
    if (!volReason.trim() || volReason.trim().length < 10) {
      showToast("Lỗi nhập liệu", "Vui lòng nhập lý do/thông điệp chi tiết hơn (tối thiểu 10 ký tự).", "error");
      return;
    }

    setSubmitting(true);
    try {
      const regObj = {
        fullName: volName.trim(),
        phone: volPhone.trim(),
        email: volEmail.trim(),
        quarter: volQuarter,
        eventId: volEventId,
        eventTitle: volEventTitle,
        skills: volSkills.trim(),
        reason: volReason.trim(),
        userId: currentUser?.uid
      };

      const savedReg = await submitVolunteerRegistrationToFirestore(regObj);
      if (savedReg) {
        setTicketResult(savedReg);
        showToast(
          "Đăng ký thành công",
          `Hệ thống đã ghi nhận đơn đăng ký tình nguyện của quý bà con. Mã đăng ký: ${savedReg.id}`,
          "success"
        );
        // Track locally
        try {
          const localVolRegs = JSON.parse(localStorage.getItem("phuloi_volunteer_regs") || "[]");
          localVolRegs.push(savedReg);
          localStorage.setItem("phuloi_volunteer_regs", JSON.stringify(localVolRegs));
        } catch (err) {
          console.error(err);
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Đồng bộ thất bại", "Có lỗi xảy ra khi gửi đăng ký đến máy chủ Firestore.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPoster = async () => {
    const poster = document.getElementById("volunteer-certificate-poster");
    if (!poster) return;
    try {
      const canvas = await html2canvas(poster, { scale: 2, useCORS: true, backgroundColor: null });
      const imgData = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `chung_nhan_tinh_nguyen_${ticketResult?.id || "phuloi"}.png`;
      link.href = imgData;
      link.click();
    } catch (err) {
      console.error("Error generating poster image", err);
      showToast("Lỗi", "Không thể tạo hình ảnh tải về lúc này.", "error");
    }
  };

  if (ticketResult) {
    return (
      <div className="space-y-6 text-center animate-fadeIn py-4">
        <div className="inline-flex p-3 bg-emerald-100 rounded-full border border-emerald-200 mb-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 animate-bounce" />
        </div>
        <div>
          <h5 className="text-lg font-black text-slate-800">Đăng Ký Hoàn Tất!</h5>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Cảm ơn tấm lòng vàng của quý công dân. Ban chỉ đạo sẽ gửi thông báo và mã điều phối sự kiện qua SMS/Zalo/Email trước giờ ra quân.
          </p>
        </div>

        {/* Volunteer Certificate Poster Card */}
        <div 
          id="volunteer-certificate-poster"
          className="relative bg-white p-8 rounded-xl max-w-lg mx-auto text-center shadow-2xl overflow-hidden border-[8px] border-double border-amber-200"
          style={{ backgroundImage: 'radial-gradient(circle at center, #ffffff 0%, #fdfbf7 100%)' }}
        >
          {/* Decorative Corner Ornaments */}
          <div className="absolute top-2 left-2 w-16 h-16 border-t-4 border-l-4 border-amber-300 opacity-50 rounded-tl-lg" />
          <div className="absolute top-2 right-2 w-16 h-16 border-t-4 border-r-4 border-amber-300 opacity-50 rounded-tr-lg" />
          <div className="absolute bottom-2 left-2 w-16 h-16 border-b-4 border-l-4 border-amber-300 opacity-50 rounded-bl-lg" />
          <div className="absolute bottom-2 right-2 w-16 h-16 border-b-4 border-r-4 border-amber-300 opacity-50 rounded-br-lg" />

          {/* Background Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
            <HeartHandshake className="w-64 h-64 text-amber-900" />
          </div>
                    
          <div className="relative z-10 font-sans space-y-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1 text-left">
                <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-700">Đảng Cộng Sản Việt Nam</h5>
                <h6 className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Ủy Ban MTTQ Phường Phú Lợi, TP. Hồ Chí Minh</h6>
              </div>
              <div className="bg-white p-1 shadow-sm rounded-sm border border-slate-100">
                <QRCodeSVG value={`https://phuloi.gov.vn/volunteer/verify/${ticketResult.id}`} size={48} level="M" />
              </div>
            </div>

            <div className="py-4 border-y border-amber-100/50 my-4">
              <h1 className="text-2xl sm:text-3xl font-black text-amber-600 uppercase tracking-wide" style={{ fontFamily: '"Playfair Display", serif' }}>
                Chứng Nhận Tình Nguyện
              </h1>
              <p className="text-[10px] text-amber-700/70 font-semibold tracking-widest uppercase mt-2">Volunteer Certificate</p>
            </div>

            <div className="space-y-1 py-2">
              <p className="text-xs text-slate-500 italic">Ban Chỉ Đạo trân trọng ghi nhận và cảm ơn tấm lòng vàng của công dân:</p>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 uppercase text-blue-900">{ticketResult.fullName}</h2>
              <p className="text-xs text-slate-600 font-medium">({ticketResult.quarter})</p>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed px-4">
              Đã đăng ký tham gia đóng góp sức mình vào hoạt động:
              <br/>
              <strong className="text-sm text-red-700 block mt-1">"{ticketResult.eventTitle}"</strong>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 text-left border-t border-amber-100/50">
              <div>
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wide block">Mã Chứng Nhận</span>
                <span className="text-[10px] font-mono font-black text-slate-700">{ticketResult.id}</span>
              </div>
              <div className="text-right">
                <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wide block">Ngày Ghi Nhận</span>
                <span className="text-[10px] font-mono font-black text-slate-700">{new Date(ticketResult.createdAt).toLocaleDateString("vi-VN")}</span>
              </div>
            </div>

            {/* Seal / Stamp */}
            <div className="absolute bottom-6 right-6 w-16 h-16 rounded-full border-2 border-red-600/80 flex items-center justify-center opacity-80 rotate-[-15deg]">
              <div className="w-14 h-14 rounded-full border border-red-500/50 flex flex-col items-center justify-center text-red-600 bg-white">
                <Star className="w-4 h-4 fill-current mb-0.5" />
                <span className="text-[6px] font-black uppercase tracking-tighter text-center leading-[1.2]">MTTQ<br/>Phú Lợi</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-3 mt-6">
          <button
            onClick={handleDownloadPoster}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
          >
            <Share2 className="w-4 h-4" />
            Lưu Hình Ảnh Chứng Nhận
          </button>
          <button
            onClick={() => {
              setTicketResult(null);
              setVolReason("");
              setVolSkills("");
            }}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl shadow-md uppercase tracking-wider transition-all cursor-pointer"
          >
            Hoàn Tất
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-5 text-left font-sans">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-1.5 tracking-wider">Họ và Tên công dân *</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              required
              value={volName}
              onChange={(e) => setVolName(e.target.value)}
              placeholder="Nhập họ và tên đầy đủ..."
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-850 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-sky-500 placeholder:text-slate-400 transition-all font-semibold"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-1.5 tracking-wider">Số điện thoại *</label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="tel"
              required
              value={volPhone}
              onChange={(e) => setVolPhone(e.target.value)}
              placeholder="Ví dụ: 0912345678..."
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-850 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-sky-500 placeholder:text-slate-400 transition-all font-semibold font-mono"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-1.5 tracking-wider">Email liên hệ *</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="email"
              required
              value={volEmail}
              onChange={(e) => setVolEmail(e.target.value)}
              placeholder="email@example.com..."
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-850 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-sky-500 placeholder:text-slate-400 transition-all font-semibold"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-1.5 tracking-wider">Địa bàn cư trú (Khu phố) *</label>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={volQuarter}
              onChange={(e) => setVolQuarter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-850 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-sky-500 transition-all font-semibold appearance-none bg-white text-slate-800"
            >
              {QUARTERS_LIST.map((kp) => (
                <option key={kp.name} value={kp.name}>{kp.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-1.5 tracking-wider">Lựa chọn Sự kiện Tình nguyện *</label>
        <div className="relative">
          <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={volEventId}
            onChange={handleEventChange}
            className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-850 rounded-xl pl-10 pr-4 py-3 text-xs sm:text-sm focus:outline-none focus:border-sky-500 transition-all font-semibold appearance-none bg-white text-slate-800"
          >
            {availableEvents.map((evt) => (
              <option key={evt.id} value={evt.id}>{evt.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-1.5 tracking-wider">Sở trường / Kỹ năng đặc biệt (Nếu có)</label>
        <textarea
          value={volSkills}
          onChange={(e) => setVolSkills(e.target.value)}
          placeholder="Ví dụ: Lái xe, cứu hộ sơ cứu y tế, điều phối hoạt động đoàn, sư phạm/dạy học, văn nghệ, chụp ảnh..."
          rows={2}
          className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-850 rounded-xl p-3 text-xs sm:text-sm focus:outline-none focus:border-sky-500 placeholder:text-slate-400 transition-all"
        />
      </div>

      <div>
        <label className="block text-[11px] font-extrabold uppercase text-slate-500 mb-1.5 tracking-wider">Lý do & Mong muốn đóng góp * (Tối thiểu 10 ký tự)</label>
        <textarea
          required
          value={volReason}
          onChange={(e) => setVolReason(e.target.value)}
          placeholder="Chia sẻ lý do quý bà con mong muốn tham gia sự kiện lần này để ban tổ chức sắp xếp công việc phù hợp..."
          rows={3}
          maxLength={1000}
          className="w-full bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-850 rounded-xl p-3 text-xs sm:text-sm focus:outline-none focus:border-sky-500 placeholder:text-slate-400 transition-all font-light"
        />
        <div className="text-[10px] text-slate-400 text-right mt-1 font-mono">{volReason.length}/1000 ký tự</div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500 hover:brightness-110 disabled:opacity-50 text-white font-black uppercase py-3.5 px-6 rounded-xl text-xs sm:text-sm shadow-[0_4px_15px_rgba(14,165,233,0.35)] transition-all flex items-center justify-center space-x-2 cursor-pointer"
        >
          {submitting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <HeartHandshake className="w-5 h-5" />
              <span>Gửi Đăng Ký Tình Nguyện</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

interface CitizenVolunteerListProps {
  currentUser: UserProfile;
}

function CitizenVolunteerList({ currentUser }: CitizenVolunteerListProps) {
  const [registrations, setRegistrations] = useState<VolunteerRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const all = await fetchVolunteerRegistrationsFromFirestore();
        const mine = all.filter(reg => reg.userId === currentUser.uid || reg.phone === currentUser.phone);
        setRegistrations(mine);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (registrations.length === 0) {
    return (
      <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl bg-white space-y-3 font-sans">
        <HeartHandshake className="w-8 h-8 text-slate-400 mx-auto" />
        <p className="text-xs text-slate-500 font-light">Quý công dân chưa đăng ký tham gia sự kiện tình nguyện nào.</p>
        <p className="text-[10px] text-slate-400 leading-normal font-light">Bà con hãy chuyển qua tab **"Đăng Ký Tình Nguyện"** ngoài thanh công cụ chính để đăng ký tham gia các chiến dịch nhé!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar font-sans">
      {registrations.map((item, idx) => (
        <motion.div 
          key={item.id} 
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: Math.min(10, idx) * 0.05 }}
          className="p-4 bg-white border border-slate-100 rounded-2xl space-y-3 relative overflow-hidden shadow-xs text-left"
        >
          <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-2">
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200/50 text-slate-500 text-[8px] font-mono font-bold">
                  #{item.id}
                </span>
                <span className="text-[9px] font-mono text-slate-400">
                  {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <h5 className="font-bold text-xs sm:text-sm text-slate-800 mt-1 font-sans">{item.eventTitle}</h5>
            </div>

            <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${
              item.status === "Đã duyệt" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
              item.status === "Chờ duyệt" ? "bg-sky-500/10 text-sky-600 border-sky-500/20" :
              "bg-rose-500/10 text-rose-600 border-rose-500/20"
            }`}>
              <span className={`w-1 h-1 rounded-full ${
                item.status === "Đã duyệt" ? "bg-emerald-500" :
                item.status === "Chờ duyệt" ? "bg-sky-500 animate-pulse" :
                "bg-rose-500"
              }`} />
              <span>{item.status}</span>
            </span>
          </div>

          <div className="text-xs text-slate-500 leading-relaxed space-y-2">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Lý do mong muốn tham gia:</span>
              <p className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100 italic">"{item.reason}"</p>
            </div>
            {item.skills && (
              <div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wide">Sở trường đăng ký:</span>
                <p className="text-slate-600 font-semibold">{item.skills}</p>
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

