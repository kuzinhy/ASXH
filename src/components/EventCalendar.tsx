import React, { useState, useEffect } from "react";
import { Calendar, MapPin, Clock, Users, ArrowRight, Star, Vote, CheckCircle2, Sparkles, BarChart3, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CalendarEvent, Survey } from "../types";
import { fetchSurveysFromFirestore } from "../lib/firebaseSync";
import { SEED_SURVEYS } from "./CitizenSurvey";

const EVENTS = [
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
    description: "Giao lưu văn nghệ, tặng quà gia đình khó khăn, biểu dương gia đình văn hóa.",
    iconName: "Calendar",
    color: "bg-slate-500",
    textColor: "text-blue-700",
    bgColor: "bg-slate-50"
  }
];

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

interface EventCalendarProps {
  events: CalendarEvent[];
}

export default function EventCalendar({ events = [] }: EventCalendarProps) {
  const displayEvents = events.length > 0 ? events : EVENTS;
  
  // States for survey rotation
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [currentSurveyIdx, setCurrentSurveyIdx] = useState<number>(0);
  const [loadingSurveys, setLoadingSurveys] = useState<boolean>(true);

  // Fetch surveys on mount
  useEffect(() => {
    const loadSurveys = async () => {
      try {
        const cached = localStorage.getItem("phuloi_surveys");
        const initialSeed = cached ? JSON.parse(cached) : SEED_SURVEYS;
        const firestoreData = await fetchSurveysFromFirestore(initialSeed);
        setSurveys(firestoreData);
      } catch (err) {
        console.error("Error loading surveys in EventCalendar:", err);
        setSurveys(SEED_SURVEYS);
      } finally {
        setLoadingSurveys(false);
      }
    };
    loadSurveys();
  }, []);

  // Set interval to rotate / randomize survey cards every 6 seconds
  useEffect(() => {
    if (surveys.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSurveyIdx((prev) => (prev + 1) % surveys.length);
    }, 6500);

    return () => clearInterval(interval);
  }, [surveys]);

  // Handle smooth scroll to Cổng Công dân số survey tab
  const handleGoToSurvey = () => {
    document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
    setTimeout(() => {
      document.getElementById("tab-survey")?.click();
    }, 450);
  };

  const currentSurvey = surveys[currentSurveyIdx];
  const totalVotes = currentSurvey 
    ? currentSurvey.options.reduce((sum, opt) => sum + opt.votes, 0)
    : 0;

  return (
    <div className="w-full bg-white/80 backdrop-blur-md rounded-3xl p-6 lg:p-8 border border-slate-200 shadow-[0_10px_40px_-15px_rgba(37,99,235,0.1)] relative overflow-hidden group">
      {/* Decorative gradient orb */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full blur-3xl opacity-15 group-hover:opacity-30 transition-opacity duration-700 pointer-events-none"></div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 items-stretch">
        
        {/* LEFT COLUMN: EVENTS LIST (takes 8/12 cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-blue-900 tracking-tight font-sans mb-1 flex items-center gap-2">
                  Lịch Sự Kiện Nổi Bật <Calendar className="w-5 h-5 text-blue-900" />
                </h2>
                <p className="text-slate-500 text-xs md:text-sm">Các hoạt động, phong trào sắp diễn ra tại Phường Phú Lợi</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {displayEvents.map((evt, idx) => (
                <motion.div 
                  key={evt.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, type: "spring", stiffness: 200, damping: 20 }}
                  className={`p-4 rounded-2xl border border-white hover:border-${evt.color.split("-")[1]}-200 ${evt.bgColor} transition-all duration-300 hover:shadow-md cursor-default group/item flex flex-col justify-between`}
                >
                  <div className="flex flex-col gap-3 flex-1">
                    {/* Date Box */}
                    <div className="shrink-0 flex flex-col items-center justify-center bg-white rounded-xl shadow-sm border border-slate-100 w-16 h-16 text-center">
                      <span className={`text-[9px] uppercase font-bold tracking-wider ${evt.textColor} mb-0.5`}>Tháng {evt.date.split("/")[1]}</span>
                      <span className={`text-xl font-black leading-none ${evt.textColor}`}>{evt.date.split("/")[0]}</span>
                    </div>
                    
                    {/* Event Content */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${evt.color} text-white`}>
                            {evt.type}
                          </span>
                        </div>
                        <h3 className="text-xs sm:text-sm font-bold text-blue-900 line-clamp-1 mb-1" title={evt.title}>{evt.title}</h3>
                        <p className="text-[11px] text-slate-500 mb-2.5 line-clamp-2 leading-relaxed">{evt.description}</p>
                      </div>
                      
                      <div className="flex flex-col gap-1.5 border-t border-slate-100/60 pt-2 mt-auto">
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{evt.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] font-medium text-slate-500">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate" title={evt.location}>{evt.location}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex justify-center md:justify-start">
            <button className="text-blue-900 hover:text-blue-700 text-xs font-semibold flex items-center gap-1.5 transition-colors group/btn">
              Xem toàn bộ lịch sự kiện <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: COMPACT ROTATING SURVEY RESULT CARD (takes 4/12 cols) */}
        <div className="lg:col-span-4 flex flex-col h-full">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between h-full relative min-h-[340px]">
            {/* Live indicator & Top header */}
            <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-800">
              <div className="flex items-center space-x-1.5">
                <div className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg">
                  <Vote className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-extrabold uppercase text-slate-300 tracking-wider font-sans">Ý Kiến Bà Con</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Trực tuyến</span>
              </div>
            </div>

            {loadingSurveys ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 space-y-2">
                <Clock className="w-5 h-5 text-sky-400 animate-spin" />
                <span className="text-[10px] text-slate-500">Đang tải biểu ý kiến...</span>
              </div>
            ) : surveys.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-xs font-light py-10">
                Chưa có dữ liệu đóng góp ý kiến.
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between">
                {/* Transition container */}
                <div className="overflow-hidden relative flex-1 min-h-[190px]">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentSurvey.id}
                      initial={{ opacity: 0, x: 25 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -25 }}
                      transition={{ duration: 0.35, ease: "easeInOut" }}
                      className="absolute inset-0 flex flex-col justify-between"
                    >
                      <div>
                        {/* Tag Category */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide border ${
                            currentSurvey.category === "vệ sinh môi trường" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            currentSurvey.category === "an ninh trật tự" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                            currentSurvey.category === "chính sách mới" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                            "bg-slate-500/10 text-slate-400 border-slate-500/20"
                          }`}>
                            {currentSurvey.category}
                          </span>
                          <span className="text-[9px] text-slate-500 font-medium flex items-center gap-1 font-mono">
                            <Users className="w-3 h-3 text-sky-400" />
                            {totalVotes} phiếu
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-100 line-clamp-2 leading-snug tracking-tight mb-4" title={currentSurvey.title}>
                          {currentSurvey.title}
                        </h4>

                        {/* Visual results percentages */}
                        <div className="space-y-2.5">
                          {currentSurvey.options.map((option, idx) => {
                            const percent = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                            const optionColor = COLORS[idx % COLORS.length];
                            return (
                              <div key={option.id} className="space-y-1">
                                <div className="flex justify-between text-[10px] text-slate-300 font-light">
                                  <span className="truncate max-w-[82%]" title={option.text}>{option.text}</span>
                                  <span style={{ color: optionColor }} className="font-mono font-bold shrink-0">{percent}%</span>
                                </div>
                                <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden border border-slate-900/60">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percent}%` }}
                                    transition={{ duration: 0.8, ease: "easeOut" }}
                                    style={{ backgroundColor: optionColor }} 
                                    className="h-full rounded-full"
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Footer and Interactive buttons */}
                <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-1 text-[9px] text-slate-500">
                    <Sparkles className="w-3 h-3 text-sky-400 animate-pulse" />
                    <span>Tự động chuyển tiếp</span>
                  </div>
                  
                  <button
                    onClick={handleGoToSurvey}
                    className="bg-sky-500 hover:bg-sky-600 text-white text-[10px] font-black px-3.5 py-1.5 rounded-xl flex items-center space-x-1 shadow-md shadow-sky-500/10 cursor-pointer transition-all active:scale-95"
                  >
                    <span>Bình chọn ngay</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
