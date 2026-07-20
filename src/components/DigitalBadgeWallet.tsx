import React, { useState, useEffect, useMemo } from "react";
import { 
  Award, Flame, Heart, Sparkles, Lock, CheckCircle2, Newspaper, 
  HelpCircle, ArrowRight, Star, Calendar, RefreshCw, Trophy, Shield, Zap, Info
} from "lucide-react";
import { UserProfile } from "../types";
import { updateUserProfileInFirestore, fetchVolunteerRegistrationsFromFirestore, fetchSystemBadges } from "../lib/firebaseSync";
import { SystemBadge, UserBadgeInfo } from "../types";

interface DigitalBadge {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgClass: string;
  metricType: "visits" | "newsReads" | "eventsRegistered" | "isVolunteer";
  targetValue: number;
  criteriaText: string;
  pointsContribution: number;
}

const ALL_BADGES: DigitalBadge[] = [
  {
    id: "badge-visits",
    title: "Tiên Phong Số",
    description: "Thường xuyên đồng hành trực tuyến cùng chuyển đổi số và cổng an sinh số Phường Phú Lợi.",
    icon: Flame,
    color: "from-amber-400 via-orange-500 to-red-500 text-white",
    bgClass: "bg-amber-500/10 border-amber-500/20 text-amber-600",
    metricType: "visits",
    targetValue: 5,
    criteriaText: "Truy cập Cổng dịch vụ số Phường Phú Lợi tối thiểu 5 lần.",
    pointsContribution: 50 // 10 pts per visit up to 50
  },
  {
    id: "badge-news",
    title: "Sứ Giả Tin Tức",
    description: "Nhạy bén và chủ động cập nhật các hoạt động, chủ trương chính thống của MTTQ & chính quyền địa phương.",
    icon: Newspaper,
    color: "from-sky-400 via-blue-500 to-indigo-500 text-white",
    bgClass: "bg-sky-500/10 border-sky-500/20 text-sky-600",
    metricType: "newsReads",
    targetValue: 3,
    criteriaText: "Tìm hiểu & xem chi tiết tin tức tuyên truyền trên website từ 3 lần trở lên.",
    pointsContribution: 60 // 20 pts per read up to 60
  },
  {
    id: "badge-events",
    title: "Trái Tim Hồng",
    description: "Tinh thần vì cộng đồng tuyệt vời, tích cực đăng ký đóng góp sức trẻ cho các sự kiện tình nguyện tại địa bàn.",
    icon: Heart,
    color: "from-pink-400 via-rose-500 to-red-500 text-white",
    bgClass: "bg-pink-500/10 border-pink-500/20 text-rose-600",
    metricType: "eventsRegistered",
    targetValue: 1,
    criteriaText: "Đăng ký tham gia thành công ít nhất 1 sự kiện tình nguyện, dọn vệ sinh, phát cơm từ thiện...",
    pointsContribution: 100 // 100 pts per event up to multiple
  },
  {
    id: "badge-volunteer",
    title: "Chiến Sĩ Tình Nguyện",
    description: "Thành viên nòng cốt chính thức đứng vào hàng ngũ tình nguyện viên sẵn sàng hỗ trợ khẩn cấp.",
    icon: Award,
    color: "from-emerald-400 via-teal-500 to-cyan-500 text-white",
    bgClass: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600",
    metricType: "isVolunteer",
    targetValue: 1,
    criteriaText: "Đăng ký gia nhập đội ngũ Tình nguyện viên Phường Phú Lợi.",
    pointsContribution: 150 // 150 points for official status
  }
];

interface TierConfig {
  id: "bronze" | "silver" | "gold";
  title: string;
  pointsRequired: number;
  color: string;
  badgeBg: string;
  borderClass: string;
  textClass: string;
  description: string;
  benefits: string[];
}

const TIER_CONFIGS: TierConfig[] = [
  {
    id: "bronze",
    title: "Hạng Đồng (Bronze Volunteer)",
    pointsRequired: 40,
    color: "from-amber-600 to-amber-800 text-white",
    badgeBg: "bg-gradient-to-br from-amber-500/20 to-amber-700/10",
    borderClass: "border-amber-500/30",
    textClass: "text-amber-700",
    description: "Khởi đầu hành trình cống hiến số đầy ý nghĩa tại địa bàn Phường Phú Lợi.",
    benefits: [
      "Hiển thị huy hiệu Đồng trên hồ sơ cá nhân",
      "Nhận thông báo ưu tiên tham gia các chiến dịch an sinh số",
      "Ghi danh vào Sổ Vàng danh dự của khu phố"
    ]
  },
  {
    id: "silver",
    title: "Hạng Bạc (Silver Volunteer)",
    pointsRequired: 150,
    color: "from-slate-350 to-slate-500 text-white",
    badgeBg: "bg-gradient-to-br from-slate-300/35 to-slate-500/15",
    borderClass: "border-slate-300/40",
    textClass: "text-slate-600",
    description: "Tình nguyện viên tích cực, nhân tố nòng cốt lan tỏa tinh thần thiện nguyện chuyển đổi số.",
    benefits: [
      "Hiển thị huy hiệu Bạc lấp lánh trên trang chủ",
      "Tải Thư Tri Ân Điện Tử có chữ ký của MTTQ Phường",
      "Tham gia trực tiếp ban quản trị và đề xuất sự kiện địa bàn"
    ]
  },
  {
    id: "gold",
    title: "Hạng Vàng (Gold Volunteer)",
    pointsRequired: 300,
    color: "from-yellow-400 via-amber-400 to-yellow-600 text-slate-900",
    badgeBg: "bg-gradient-to-br from-yellow-400/25 to-amber-500/15",
    borderClass: "border-yellow-400/50",
    textClass: "text-amber-600",
    description: "Hạng danh giá cao quý nhất! Chiến sĩ an sinh số xuất sắc của toàn Phường Phú Lợi.",
    benefits: [
      "Huy hiệu Vàng Danh Dự cùng hiệu ứng hào quang lấp lánh",
      "Bằng khen danh dự trực tiếp từ UBND & MTTQ Phường Phú Lợi",
      "Ưu tiên đặc biệt trong các chương trình vinh danh gương sáng tình nguyện viên"
    ]
  }
];

interface DigitalBadgeWalletProps {
  currentUser: UserProfile;
  onNavigateTab?: (tabName: string) => void;
  showToast?: (title: string, msg: string, type: "success" | "info" | "warning" | "error") => void;
}

export default function DigitalBadgeWallet({ currentUser, onNavigateTab, showToast }: DigitalBadgeWalletProps) {
  const [visits, setVisits] = useState(1);
  const [newsReads, setNewsReads] = useState(0);
  const [eventsRegistered, setEventsRegistered] = useState(0);
  const [selectedBadge, setSelectedBadge] = useState<DigitalBadge | null>(null);
  const [selectedTier, setSelectedTier] = useState<TierConfig | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [systemBadges, setSystemBadges] = useState<SystemBadge[]>([]);
  const [selectedSystemBadge, setSelectedSystemBadge] = useState<{def: SystemBadge, level: number} | null>(null);

  useEffect(() => {
    fetchSystemBadges().then(res => setSystemBadges(res)).catch(console.error);
  }, []);

  // Load and increment tracking stats
  useEffect(() => {
    if (!currentUser) return;

    const uid = currentUser.uid;
    const vKey = `phuloi_visits_${uid}`;
    const nKey = `phuloi_newsreads_${uid}`;

    // Increment visit once per session or mount
    const savedVisits = parseInt(localStorage.getItem(vKey) || "0", 10);
    const newVisits = savedVisits === 0 ? 1 : savedVisits + 1;
    localStorage.setItem(vKey, newVisits.toString());
    setVisits(newVisits);

    // Read news clicks
    const savedReads = parseInt(localStorage.getItem(nKey) || "0", 10);
    setNewsReads(savedReads);

    // Fetch real volunteer registrations from Firestore
    async function checkRegistrations() {
      try {
        const regs = await fetchVolunteerRegistrationsFromFirestore();
        const mine = regs.filter(r => 
          r.userId === uid || 
          r.phone === currentUser.phone || 
          (currentUser.email && r.email?.toLowerCase() === currentUser.email.toLowerCase())
        );
        setEventsRegistered(mine.length);
      } catch (err) {
        console.error("Lỗi lấy số lượng đăng ký sự kiện:", err);
        // Fallback to local count
        try {
          const localRegs = JSON.parse(localStorage.getItem("phuloi_volunteer_regs") || "[]");
          setEventsRegistered(localRegs.length);
        } catch (_) {}
      }
    }
    checkRegistrations();
  }, [currentUser]);

  // Periodically sync stats to see if newsReads changed in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const uid = currentUser.uid;
      const nKey = `phuloi_newsreads_${uid}`;
      const savedReads = parseInt(localStorage.getItem(nKey) || "0", 10);
      setNewsReads(savedReads);
    };

    window.addEventListener("storage", handleStorageChange);
    // Also poll every 3 seconds to catch quick updates inside the same window
    const interval = setInterval(handleStorageChange, 3000);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [currentUser]);

  // IsVolunteer computed from profile
  const isVolunteerValue = currentUser.isVolunteer ? 1 : 0;

  // Calculate dynamic activity points
  const pointsData = useMemo(() => {
    const visitsPoints = Math.min(visits * 10, 50); // Max 50 pts
    const newsPoints = Math.min(newsReads * 20, 60); // Max 60 pts
    const eventsPoints = eventsRegistered * 100; // 100 pts per registration
    const officialPoints = isVolunteerValue * 150; // 150 pts for official volunteer
    
    const totalPoints = visitsPoints + newsPoints + eventsPoints + officialPoints;
    
    return {
      visitsPoints,
      newsPoints,
      eventsPoints,
      officialPoints,
      totalPoints
    };
  }, [visits, newsReads, eventsRegistered, isVolunteerValue]);

  // Map metric values for individual quests
  const userMetrics = useMemo(() => {
    return {
      visits,
      newsReads,
      eventsRegistered,
      isVolunteer: isVolunteerValue
    };
  }, [visits, newsReads, eventsRegistered, isVolunteerValue]);

  // Determine individual quest badges unlocked
  const unlockedQuestBadgeIds = useMemo(() => {
    const unlocked: string[] = [];
    ALL_BADGES.forEach(badge => {
      const currentVal = userMetrics[badge.metricType];
      if (currentVal >= badge.targetValue) {
        unlocked.push(badge.id);
      }
    });
    return unlocked;
  }, [userMetrics]);

  // Determine tiered badges unlocked based on points
  const currentTiersUnlocked = useMemo(() => {
    return TIER_CONFIGS.filter(tier => pointsData.totalPoints >= tier.pointsRequired).map(t => t.id);
  }, [pointsData.totalPoints]);

  const currentHighestTier = useMemo(() => {
    if (currentTiersUnlocked.includes("gold")) return "gold";
    if (currentTiersUnlocked.includes("silver")) return "silver";
    if (currentTiersUnlocked.includes("bronze")) return "bronze";
    return null;
  }, [currentTiersUnlocked]);

  // Auto sync both unlocked badges list and current tier back to Firestore
  useEffect(() => {
    if (!currentUser) return;

    // We will merge: individual badge IDs (e.g., 'badge-visits') + tiered badge IDs (e.g., 'tier-bronze', 'tier-silver', 'tier-gold')
    const cloudBadgesToSync: string[] = [...unlockedQuestBadgeIds];
    currentTiersUnlocked.forEach(tierId => {
      cloudBadgesToSync.push(`tier-${tierId}`);
    });

    const currentProfileBadges = currentUser.badges || [];
    const isDifferent = 
      cloudBadgesToSync.length !== currentProfileBadges.length ||
      cloudBadgesToSync.some(id => !currentProfileBadges.includes(id));

    if (isDifferent) {
      async function syncBadgesToCloud() {
        setSyncing(true);
        try {
          await updateUserProfileInFirestore(currentUser.uid, {
            badges: cloudBadgesToSync
          });
          
          // Mutate locally to prevent infinite loops before the next refetch
          currentUser.badges = cloudBadgesToSync;

          if (showToast) {
            // Find newly unlocked quest or tier to alert the user
            const newlyUnlocked = cloudBadgesToSync.filter(id => !currentProfileBadges.includes(id));
            newlyUnlocked.forEach(id => {
              if (id.startsWith("tier-")) {
                const tierName = id.replace("tier-", "");
                const tConfig = TIER_CONFIGS.find(tc => tc.id === tierName);
                if (tConfig) {
                  showToast(
                    "🏆 ĐẠT CẤP ĐỘ VOLUNTEER MỚI!",
                    `Chúc mừng bạn đã vinh dự đạt danh hiệu "${tConfig.title}" trên Cổng an sinh Phường Phú Lợi!`,
                    "success"
                  );
                }
              } else {
                const bConfig = ALL_BADGES.find(bc => bc.id === id);
                if (bConfig) {
                  showToast(
                    "🏅 Đạt Huy Hiệu Mới!",
                    `Chúc mừng bạn đã mở khóa huy hiệu "${bConfig.title}" thành công.`,
                    "success"
                  );
                }
              }
            });
          }
        } catch (err) {
          console.error("Lỗi đồng bộ huy hiệu lên Firestore:", err);
        } finally {
          setSyncing(false);
        }
      }
      syncBadgesToCloud();
    }
  }, [unlockedQuestBadgeIds, currentTiersUnlocked, currentUser, showToast]);

  // Compute next tier requirements
  const nextTier = useMemo(() => {
    if (!currentHighestTier) return TIER_CONFIGS[0]; // bronze
    if (currentHighestTier === "bronze") return TIER_CONFIGS[1]; // silver
    if (currentHighestTier === "silver") return TIER_CONFIGS[2]; // gold
    return null; // already maxed
  }, [currentHighestTier]);

  const progressToNextTierPercent = useMemo(() => {
    if (!nextTier) return 100;
    const currentPoints = pointsData.totalPoints;
    const reqPoints = nextTier.pointsRequired;
    return Math.min((currentPoints / reqPoints) * 100, 100);
  }, [pointsData.totalPoints, nextTier]);

  return (
    <div className="bg-white border border-slate-200/80 rounded-3xl p-5 sm:p-6 shadow-sm text-left relative overflow-hidden font-sans space-y-6">
      <div className="absolute top-0 right-0 w-32 h-32 bg-sky-50 rounded-full blur-2xl -mr-10 -mt-10 opacity-70" />
      
      {/* SECTION 1: HEADER & POINTS DASHBOARD */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4 relative z-10">
        <div>
          <h4 className="font-extrabold text-slate-800 text-sm sm:text-base flex items-center gap-2 uppercase tracking-wider font-sans">
            <Trophy className="w-5 h-5 text-amber-500 animate-bounce" />
            <span>Danh Hiệu Tình Nguyện Số</span>
          </h4>
          <span className="text-xs text-slate-400 font-light block mt-0.5">Tích lũy điểm đóng góp số để nâng cấp hạng Đồng, Bạc, Vàng</span>
        </div>
        
        {/* Total Points Badge */}
        <div className="bg-gradient-to-r from-sky-500 to-indigo-600 text-white px-4 py-2 rounded-2xl shadow-md flex items-center gap-2">
          <Zap className="w-4 h-4 fill-amber-300 stroke-amber-300 animate-pulse" />
          <div className="font-mono text-right">
            <div className="text-[9px] font-black uppercase tracking-widest text-sky-100 opacity-90 leading-none">Điểm số tích lũy</div>
            <div className="text-base font-black leading-none mt-1">{pointsData.totalPoints} PTS</div>
          </div>
        </div>
      </div>

      {/* SECTION 2: CURRENT VOLUNTEER TIER LEVEL */}
      <div className="bg-slate-50 border border-slate-150/70 p-4.5 rounded-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Cấp bậc của bạn:</span>
            {currentHighestTier ? (
              <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                currentHighestTier === "gold" ? "bg-yellow-100 text-yellow-700 border border-yellow-200" :
                currentHighestTier === "silver" ? "bg-slate-200 text-slate-700 border border-slate-300" :
                "bg-amber-100 text-amber-800 border border-amber-200"
              }`}>
                <Shield className="w-3 h-3" />
                <span>Hạng {currentHighestTier === "gold" ? "VÀNG" : currentHighestTier === "silver" ? "BẠC" : "ĐỒNG"}</span>
              </span>
            ) : (
              <span className="bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider">Chưa phân hạng</span>
            )}
          </div>

          <div className="space-y-1">
            <h5 className="font-black text-slate-800 text-sm sm:text-base font-sans flex items-center gap-1.5">
              {currentHighestTier === "gold" && "👑 Chiến Sĩ Xuất Sắc"}
              {currentHighestTier === "silver" && "🛡️ Tình Nguyện Viên Tích Cực"}
              {currentHighestTier === "bronze" && "🤝 Tình Nguyện Viên Đồng Hành"}
              {!currentHighestTier && "🌱 Thành Viên Mới Bắt Đầu"}
            </h5>
            <p className="text-slate-500 text-[11px] leading-relaxed font-light">
              {currentHighestTier 
                ? TIER_CONFIGS.find(t => t.id === currentHighestTier)?.description
                : "Hoàn thành các hành động an sinh nhỏ để nhận ngay Huy Hiệu Đồng đầu tiên."}
            </p>
          </div>
        </div>

        {/* Big Badge Icon Display */}
        <div className="flex items-center justify-center">
          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center border-2 rotate-3 shadow-md relative ${
            currentHighestTier === "gold" ? "bg-gradient-to-br from-yellow-400 via-amber-400 to-yellow-600 border-yellow-300" :
            currentHighestTier === "silver" ? "bg-gradient-to-br from-slate-200 to-slate-400 border-slate-300" :
            currentHighestTier === "bronze" ? "bg-gradient-to-br from-amber-600 to-amber-800 border-amber-500 text-white" :
            "bg-slate-100 border-slate-200 text-slate-300"
          }`}>
            <Award className={`w-10 h-10 ${currentHighestTier === "gold" ? "text-slate-900 animate-bounce" : currentHighestTier === "silver" ? "text-slate-800" : "text-white"}`} />
            {currentHighestTier && (
              <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 border border-white">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: TIER LEVEL UP PROGRESS BAR */}
      {nextTier ? (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Tiến độ lên danh hiệu kế tiếp:</span>
            <span className="font-extrabold text-slate-800 font-sans flex items-center gap-1">
              <span>{pointsData.totalPoints}</span>
              <span className="text-slate-400">/ {nextTier.pointsRequired} PTS</span>
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/40 relative">
            <div 
              className="h-full bg-gradient-to-r from-sky-500 to-indigo-600 rounded-full transition-all duration-700"
              style={{ width: `${progressToNextTierPercent}%` }}
            />
            {/* Visual indicators for other tiers */}
            {TIER_CONFIGS.map((tier) => {
              const markerLeft = (tier.pointsRequired / 300) * 100;
              if (markerLeft > 100) return null;
              return (
                <div 
                  key={tier.id}
                  className="absolute top-0 h-full w-0.5 bg-white/40"
                  style={{ left: `${Math.min(markerLeft, 98)}%` }}
                  title={`${tier.title}: ${tier.pointsRequired} PTS`}
                />
              );
            })}
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium font-mono">
            <span>Hạng Hiện Tại</span>
            <span className="text-indigo-600 font-bold uppercase animate-pulse">Hạng Tiếp Theo: {nextTier.title.split(" ")[0]}</span>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-700">Chúc mừng! Bạn đã đạt Cấp độ tối cao (Hạng Vàng Danh Dự) 🥇</span>
          </div>
        </div>
      )}

      {/* SECTION 4: TIER REWARD BENEFIT QUICK CHIPS */}
      <div className="space-y-2 text-left">
        <h5 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1 font-sans">
          <Shield className="w-3.5 h-3.5 text-sky-500" />
          <span>Thông tin các Hạng & Đặc Quyền</span>
        </h5>
        
        <div className="grid grid-cols-3 gap-2">
          {TIER_CONFIGS.map((t) => {
            const isUnlocked = currentTiersUnlocked.includes(t.id);
            return (
              <button
                key={t.id}
                onClick={() => setSelectedTier(t)}
                className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer relative ${
                  isUnlocked 
                    ? "bg-white border-slate-200 hover:border-sky-400 shadow-2xs" 
                    : "bg-slate-50 border-slate-100 opacity-60 hover:opacity-100"
                }`}
              >
                <div className="text-[10px] font-black truncate text-slate-800">
                  {t.id === "bronze" ? "🥉 Hạng ĐỒNG" : t.id === "silver" ? "🥈 Hạng BẠC" : "🥇 Hạng VÀNG"}
                </div>
                <div className="text-[9px] font-mono text-slate-400 font-semibold mt-1">
                  {t.pointsRequired} PTS
                </div>
                {isUnlocked ? (
                  <span className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5 text-[8px] leading-none">✓</span>
                ) : (
                  <Lock className="absolute top-1 right-1 w-2.5 h-2.5 text-slate-350" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 5: STATS BREAKDOWN / HOW TO EARN */}
      <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-[11px] space-y-3">
        <h5 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1 font-sans border-b border-slate-200 pb-1.5">
          <Info className="w-3.5 h-3.5 text-sky-500" />
          <span>Bảng Kê Hoạt Động & Điểm Hoạt Động Số</span>
        </h5>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-slate-600">
          <div className="flex justify-between items-center border-b border-slate-150 pb-1">
            <span className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>Truy cập Cổng ({visits} lần):</span>
            </span>
            <span className="font-bold text-slate-800 font-mono">+{pointsData.visitsPoints} PTS</span>
          </div>

          <div className="flex justify-between items-center border-b border-slate-150 pb-1">
            <span className="flex items-center gap-1">
              <Newspaper className="w-3.5 h-3.5 text-sky-500" />
              <span>Đọc tin tức ({newsReads} tin):</span>
            </span>
            <span className="font-bold text-slate-800 font-mono">+{pointsData.newsPoints} PTS</span>
          </div>

          <div className="flex justify-between items-center border-b border-slate-150 pb-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-rose-500" />
              <span>Đăng ký sự kiện ({eventsRegistered}):</span>
            </span>
            <span className="font-bold text-slate-800 font-mono">+{pointsData.eventsPoints} PTS</span>
          </div>

          <div className="flex justify-between items-center border-b border-slate-150 pb-1">
            <span className="flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-emerald-500" />
              <span>Gia nhập Tình Nguyện:</span>
            </span>
            <span className="font-bold text-slate-800 font-mono">+{pointsData.officialPoints} PTS</span>
          </div>
        </div>
      </div>

      {/* SECTION 6: INDIVIDUAL QUEST BADGES GRID */}
      <div className="space-y-3">
        <h5 className="font-extrabold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-1 font-sans">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Huy Hiệu Nhiệm Vụ Phụ ({unlockedQuestBadgeIds.length}/{ALL_BADGES.length})</span>
        </h5>

        <div className="grid grid-cols-2 gap-3">
          {ALL_BADGES.map((badge) => {
            const isUnlocked = unlockedQuestBadgeIds.includes(badge.id);
            const currentProgressVal = userMetrics[badge.metricType];
            const progressPercent = Math.min((currentProgressVal / badge.targetValue) * 100, 100);
            const BadgeIcon = badge.icon;

            return (
              <button
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className={`p-3 rounded-xl border text-center transition-all focus:outline-none flex flex-col items-center justify-between cursor-pointer relative group ${
                  isUnlocked 
                    ? "bg-white border-slate-200 shadow-2xs hover:border-sky-400 hover:shadow-xs" 
                    : "bg-slate-50/50 border-slate-100 opacity-70 hover:opacity-100"
                }`}
              >
                {/* Lock / Unlock Icon Tag */}
                <div className="absolute top-1.5 right-1.5">
                  {isUnlocked ? (
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  ) : (
                    <Lock className="w-3 h-3 text-slate-300" />
                  )}
                </div>

                {/* Badge Emblem */}
                <div className="flex flex-col items-center space-y-1.5 py-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 shadow-inner ${
                    isUnlocked 
                      ? `bg-gradient-to-br ${badge.color} shadow-[0_3px_8px_rgba(14,165,233,0.15)]` 
                      : "bg-slate-200 text-slate-400"
                  }`}>
                    <BadgeIcon className="w-5 h-5" />
                  </div>
                  <div className="text-[11px] font-extrabold text-slate-800 truncate max-w-[95px]">
                    {badge.title}
                  </div>
                </div>

                {/* Progress visual */}
                <div className="w-full mt-1.5 space-y-1">
                  <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${isUnlocked ? "bg-emerald-500" : "bg-sky-400"}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[8px] font-mono font-bold text-slate-400">
                    <span>{isUnlocked ? "Đạt nhiệm vụ" : "Tiến độ"}</span>
                    <span>{Math.round(progressPercent)}%</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Cloud Synchronizer indicator */}
      <div className="mt-4 flex justify-between items-center text-[8px] text-slate-400 border-t border-slate-50 pt-2.5 font-mono">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
          <span>Lưu đồng bộ: Đám mây Firestore</span>
        </span>
        {syncing && (
          <span className="flex items-center gap-0.5 text-sky-500">
            <RefreshCw className="w-2.5 h-2.5 animate-spin" />
            <span>Đang lưu...</span>
          </span>
        )}
      </div>

      {/* Badge Detail Modal Dialog */}
      {selectedBadge && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-sky-400 via-indigo-400 to-emerald-400" />
            
            <button 
              onClick={() => setSelectedBadge(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-full hover:bg-slate-100 transition cursor-pointer"
            >
              ✕
            </button>

            {unlockedQuestBadgeIds.includes(selectedBadge.id) ? (
              <div className="inline-flex p-4 rounded-full bg-emerald-50 border border-emerald-150 animate-pulse relative">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-500 opacity-20 blur-sm" />
                <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${selectedBadge.color} flex items-center justify-center shadow-lg relative`}>
                  {React.createElement(selectedBadge.icon, { className: "w-7 h-7" })}
                </div>
              </div>
            ) : (
              <div className="inline-flex p-4 rounded-full bg-slate-100 border border-slate-200">
                <div className="w-14 h-14 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center shadow-inner relative">
                  {React.createElement(selectedBadge.icon, { className: "w-7 h-7" })}
                  <Lock className="absolute bottom-0 right-0 w-4 h-4 bg-slate-800 text-white rounded-full p-0.5 border border-white" />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                unlockedQuestBadgeIds.includes(selectedBadge.id) 
                  ? "bg-emerald-100 text-emerald-600 border border-emerald-150" 
                  : "bg-slate-100 text-slate-500 border border-slate-200"
              }`}>
                {unlockedQuestBadgeIds.includes(selectedBadge.id) ? "★ Đã Hoàn Thành ★" : "🔒 Đang Khóa"}
              </span>
              <h4 className="font-extrabold text-slate-800 text-base font-sans">{selectedBadge.title}</h4>
            </div>

            <p className="text-slate-600 text-xs font-light leading-relaxed px-2">
              {selectedBadge.description}
            </p>

            <div className="bg-slate-50 border border-slate-100 p-3 rounded-2xl text-left text-xs space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Tiêu chí mở khóa:</span>
              <p className="text-slate-700 font-medium font-sans">{selectedBadge.criteriaText}</p>
              <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 pt-1 border-t border-slate-100 mt-1.5 font-mono">
                <span>Tiến độ thực tế:</span>
                <span className={unlockedQuestBadgeIds.includes(selectedBadge.id) ? "text-emerald-600" : "text-sky-600"}>
                  {userMetrics[selectedBadge.metricType]} / {selectedBadge.targetValue}
                </span>
              </div>
            </div>

            <button
              onClick={() => setSelectedBadge(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
            >
              Đóng lại
            </button>
          </div>
        </div>
      )}

      {/* Tier Detail Modal Dialog */}
      {selectedTier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${selectedTier.color}`} />
            
            <button 
              onClick={() => setSelectedTier(null)}
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-full hover:bg-slate-100 transition cursor-pointer"
            >
              ✕
            </button>

            <div className="space-y-1 mt-2">
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                currentTiersUnlocked.includes(selectedTier.id) 
                  ? "bg-emerald-100 text-emerald-600 border border-emerald-150" 
                  : "bg-slate-100 text-slate-500 border border-slate-200"
              }`}>
                {currentTiersUnlocked.includes(selectedTier.id) ? "✓ Đã Đạt Cấp" : "🔒 Cần Điểm Tích Lũy"}
              </span>
              <h4 className="font-extrabold text-slate-800 text-base font-sans">{selectedTier.title}</h4>
              <p className="text-slate-450 text-[10px] font-bold font-mono">Yêu cầu: {selectedTier.pointsRequired} PTS</p>
            </div>

            <p className="text-slate-600 text-xs font-light leading-relaxed px-1">
              {selectedTier.description}
            </p>

            <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl text-left text-xs space-y-2">
              <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Đặc quyền cấp {selectedTier.id.toUpperCase()}:</span>
              <ul className="space-y-1.5 list-disc pl-4 text-slate-700 font-medium">
                {selectedTier.benefits.map((b, idx) => (
                  <li key={idx} className="text-[11px] leading-relaxed">{b}</li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setSelectedTier(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 rounded-xl uppercase tracking-wider transition-colors cursor-pointer"
            >
              Đóng lại
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
