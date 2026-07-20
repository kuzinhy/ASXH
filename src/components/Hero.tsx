import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Heart, Search, Award, MessageSquare, ShieldCheck, Landmark, CheckCircle2, MapPin, Sparkles, Users, Compass, Feather, Medal, Briefcase, ArrowUpRight } from "lucide-react";
import { WebConfig } from "../types";
import OfficialFanpagesBar from "./OfficialFanpagesBar";
import { DEFAULT_WEB_CONFIG } from "../lib/firebaseSync";

export default function Hero({ webConfig }: { webConfig: WebConfig | null }) {
  const config = webConfig || DEFAULT_WEB_CONFIG;
  const [tickerIndex, setTickerIndex] = useState(0);

  const liveActivities = [
    { 
      org: "Ủy ban MTTQ Phường", 
      text: "Ngày hội 'Xuân đoàn kết – Tết nhân ái': Trao 2.548 phần quà chăm lo Tết với tổng kinh phí hơn 2,3 tỷ đồng.", 
      time: "Báo cáo nổi bật", 
      type: "mttq",
      color: "bg-red-50 text-red-700 border-red-200/40 text-[9px] font-bold" 
    },
    { 
      org: "Đoàn Thanh Niên Phường", 
      text: "Mô hình 'Căn phòng mơ ước': Trao tặng 1 căn phòng miễn phí thuê trong 12 tháng cùng hơn 30 phần quà ấm lòng.", 
      time: "Điểm sáng tiêu biểu", 
      type: "youth",
      color: "bg-primary-50 text-primary-700 border-primary-200/40 text-[9px] font-bold" 
    },
    { 
      org: "Hội Liên Hiệp Phụ Nữ", 
      text: "Đồng hành nhân ái: Nhận đỡ đầu 2 trẻ em mồ côi đặc biệt khó khăn mức hỗ trợ 6 triệu đồng/em/năm học.", 
      time: "Ý nghĩa sâu sắc", 
      type: "women",
      color: "bg-rose-50 text-rose-700 border-rose-200/40 text-[9px] font-bold" 
    },
    { 
      org: "Hội Cựu Chiến Binh", 
      text: "Đền ơn đáp nghĩa: Tổ chức hành trình về nguồn, tặng quà và hỗ trợ sửa chữa nhà đồng đội CCB khó khăn hơn 20 triệu.", 
      time: "Ý nghĩa cao cả", 
      type: "veterans",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200/40 text-[9px] font-bold" 
    },
    { 
      org: "Công Đoàn Phường", 
      text: "Tháng Công nhân: Tổ chức trao tặng 70 phần quà hỗ trợ người lao động và phát 350 suất ăn sáng miễn phí.", 
      time: "Đồng hành công nhân", 
      type: "union",
      color: "bg-indigo-50 text-indigo-700 border-indigo-200/40 text-[9px] font-bold" 
    },
    { 
      org: "Ủy ban MTTQ Phường", 
      text: "Mô hình 'Cà phê sáng - Trao đổi với Nhân dân': Đã tiếp xúc trực tiếp, lắng nghe và giải quyết kịp thời 113 ý kiến bà con.", 
      time: "Dân vận khéo", 
      type: "mttq",
      color: "bg-red-50 text-red-700 border-red-200/40 text-[9px] font-bold" 
    },
    { 
      org: "Cứu Trợ Khẩn Cấp", 
      text: "Bàn giao túi thuốc an sinh đột xuất và hỗ trợ y tế khẩn cấp tại nhà cho hộ cụ Lê Văn Hùng (Khu phố 2).", 
      time: "Vừa xong", 
      type: "live",
      color: "bg-amber-50 text-amber-700 border-amber-200/40 text-[9px] font-bold" 
    },
    { 
      org: "Hỗ Trợ Học Tập", 
      text: "Tiếp nhận 5.000.000đ đóng góp vào Quỹ Khuyến Học từ doanh nghiệp hỗ trợ học sinh vượt khó học giỏi.", 
      time: "2 phút trước", 
      type: "live",
      color: "bg-teal-50 text-teal-700 border-teal-200/40 text-[9px] font-bold" 
    }
  ];

  const getOrgIcon = (type: string) => {
    const imgClass = "w-6 h-6 object-contain shrink-0";
    switch (type) {
      case "mttq":
        return <img src="/partners/avatar_matsg.jpg" alt="MTTQ" className={imgClass} referrerPolicy="no-referrer" onError={(e) => { (e.target as any).src = "https://www.mattrancantho.vn/files/images/Logo%20-%20Icon/Logo%20MTTQ.png"; }} />;
      case "youth":
        return <img src="https://upload.wikimedia.org/wikipedia/vi/0/09/Huy_Hi%E1%BB%87u_%C4%90o%C3%A0n.png" alt="Đoàn Thanh Niên" className={imgClass} referrerPolicy="no-referrer" />;
      case "women":
        return <img src="https://www.hoilhpn.org.vn/documents/20182/2314395/logohoimoi.jpg" alt="Hội Phụ Nữ" className={imgClass} referrerPolicy="no-referrer" />;
      case "veterans":
        return <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/08/logo-hoi-cuu-chien-binh-viet-nam.png" alt="Cựu Chiến Binh" className={imgClass} referrerPolicy="no-referrer" />;
      case "union":
        return <img src="https://cdn.haitrieu.com/wp-content/uploads/2021/11/Logo-Cong-Doan-Viet-Nam-CDVN.png" alt="Công Đoàn" className={imgClass} referrerPolicy="no-referrer" />;
      default:
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
    }
  };

  const highlightStats = (text: string) => {
    const regex = /(\d+(?:[.,]\d+)*\s*(?:tỷ đồng|triệu đồng|triệu|tỷ|phần quà|suất ăn|ý kiến|căn phòng|tháng|đồng|đ|trẻ em))/gi;
    const parts = text.split(regex);
    return parts.map((part, index) => {
      if (regex.test(part)) {
        return (
          <strong key={index} className="text-primary-700 font-extrabold font-sans bg-primary-100/60 border border-primary-200/40 px-1.5 py-0.5 rounded-lg mx-0.5 inline-block text-[11.5px] shadow-sm">
            {part}
          </strong>
        );
      }
      return part;
    });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % liveActivities.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [liveActivities.length]);

  return (
    <section className="relative overflow-hidden py-10 md:py-20 px-4 bg-transparent" id="portal-hero">
      {/* Background soft cinematic glowing light orbs */}
      <div className="absolute top-1/4 left-1/10 w-[500px] h-[500px] rounded-full bg-primary-100/40 blur-[130px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/10 right-1/10 w-[600px] h-[600px] rounded-full bg-blue-100/30 blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center relative z-10">
        
        {/* Left Column - Main Text Content */}
        <div className="lg:col-span-7 space-y-7 text-center lg:text-left">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center space-x-2 bg-primary-50/85 text-primary-800 border border-primary-100/50 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm backdrop-blur-md"
          >
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse shrink-0" />
            <span className="font-sans whitespace-nowrap">{config.heroSubtitle || DEFAULT_WEB_CONFIG.heroSubtitle}</span>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15] text-slate-900 font-serif"
          >
            {config.heroTitleLine1 || DEFAULT_WEB_CONFIG.heroTitleLine1} <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-700 via-primary-600 to-blue-500 font-extrabold whitespace-nowrap">{config.heroTitleLine2 || DEFAULT_WEB_CONFIG.heroTitleLine2}</span> <br className="hidden md:inline" />
            <span className="whitespace-nowrap">{config.heroTitleLine3 || DEFAULT_WEB_CONFIG.heroTitleLine3}</span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-slate-600 text-sm sm:text-base max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium"
          >
            <span dangerouslySetInnerHTML={{ __html: config.heroDescription || DEFAULT_WEB_CONFIG.heroDescription || "" }} />
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row justify-center lg:justify-start items-center gap-5 pt-4"
          >
            <a 
              href="#services" 
              className="w-full sm:w-auto bg-gradient-to-br from-primary-600 to-blue-700 hover:from-primary-700 hover:to-blue-800 text-white font-black px-10 py-5 rounded-2xl transition-all duration-300 text-center shadow-[0_15px_30px_-5px_rgba(37,99,235,0.4)] hover:shadow-[0_20px_35px_-5px_rgba(37,99,235,0.5)] flex items-center justify-center space-x-3 text-[11px] uppercase tracking-widest font-sans active:scale-95 cursor-pointer"
            >
              <Search className="w-4.5 h-4.5 shrink-0" />
              <span>Sử dụng Dịch vụ</span>
            </a>
            <a 
              href="#ai-assistant" 
              className="w-full sm:w-auto bg-white hover:bg-primary-50 text-slate-900 font-black px-10 py-5 rounded-2xl transition-all duration-300 text-center flex items-center justify-center space-x-3 text-[11px] uppercase tracking-widest font-sans border-2 border-primary-100 shadow-sm hover:border-primary-200 active:scale-95 cursor-pointer"
            >
              <MessageSquare className="w-4.5 h-4.5 text-primary-600 shrink-0" />
              <span>Hỏi Trợ lý ảo AI</span>
            </a>
          </motion.div>
        </div>

        {/* Right Column - Upgraded Interactive Smart Welfare Monitor Visual */}
        <div className="lg:col-span-5 w-full flex flex-col gap-4">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="-mt-4 lg:-mt-10"
          >
            <OfficialFanpagesBar />
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="bg-white/90 backdrop-blur-2xl border border-primary-100 p-6 sm:p-8 rounded-[32px] shadow-[0_30px_70px_-15px_rgba(37,99,235,0.15)] space-y-7 relative overflow-hidden"
          >
            {/* Ambient decorative grid or circle lines */}
            <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-primary-50 blur-3xl pointer-events-none" />

            {/* Title Block with Government Authenticity Accent */}
            <div className="flex justify-between items-center border-b border-primary-50 pb-5">
              <div className="flex items-center space-x-4">
                <div className="w-11 h-11 rounded-2xl bg-primary-50 flex items-center justify-center border border-primary-100 shadow-sm">
                  <Landmark className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <h4 className="font-black text-xs sm:text-sm text-slate-900 tracking-wider uppercase font-sans">Màn Giám Sát An Sinh</h4>
                  <p className="text-[10px] text-primary-600 font-mono font-bold uppercase tracking-[0.1em]">Cập nhật trực tuyến địa bàn</p>
                </div>
              </div>

              {/* Verified badge */}
              <div className="flex items-center space-x-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl text-[9px] text-emerald-700 font-black uppercase tracking-widest font-sans shadow-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-600 animate-pulse" />
                <span>Đã Chứng Thực</span>
              </div>
            </div>

            {/* Live activity ticker widget with integrated monitoring results */}
            <div className="bg-gradient-to-br from-primary-50/50 to-white border border-primary-100/50 p-5 rounded-3xl min-h-[130px] flex flex-col justify-center group hover:shadow-xl hover:shadow-primary-500/5 transition-all duration-500">
              <div className="relative h-[90px] overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={tickerIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="absolute inset-0 flex items-start space-x-4 text-slate-600 text-xs leading-relaxed"
                  >
                    <div className="w-12 h-12 bg-white p-2.5 rounded-2xl border border-primary-100 shadow-sm flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300">
                      {getOrgIcon(liveActivities[tickerIndex].type)}
                    </div>
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`px-2.5 py-1 rounded-lg border-2 uppercase tracking-[0.1em] flex items-center space-x-2 ${liveActivities[tickerIndex].color}`}>
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shrink-0" />
                          <span>{liveActivities[tickerIndex].org}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono font-bold whitespace-nowrap shrink-0 flex items-center space-x-1">
                          <span>{liveActivities[tickerIndex].time}</span>
                          <ArrowUpRight className="w-3 h-3 text-primary-400" />
                        </span>
                      </div>
                      <p className="text-slate-900 font-bold line-clamp-2 text-sm leading-snug pr-1">
                        {highlightStats(liveActivities[tickerIndex].text)}
                      </p>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Grid Features Panel */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-white border border-slate-100 p-5 rounded-[24px] space-y-2 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300 group">
                <div className="flex items-center space-x-2.5 text-slate-900 font-black font-sans">
                  <div className="p-1.5 rounded-lg bg-primary-50 group-hover:bg-primary-600 transition-colors">
                    <Heart className="w-4 h-4 text-primary-600 group-hover:text-white fill-current" />
                  </div>
                  <span>Xác Minh 24h</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                  Hệ thống tiếp nhận và Ban điều hành khu phố xác minh thực tế trong 24h nhanh chóng.
                </p>
              </div>

              <div className="bg-white border border-slate-100 p-5 rounded-[24px] space-y-2 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300 group">
                <div className="flex items-center space-x-2.5 text-slate-900 font-black font-sans">
                  <div className="p-1.5 rounded-lg bg-emerald-50 group-hover:bg-emerald-600 transition-colors">
                    <Award className="w-4 h-4 text-emerald-600 group-hover:text-white" />
                  </div>
                  <span>Tấm Lòng Vàng</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                  Ghi nhận và tôn vinh đóng góp của nhà hảo tâm một cách tự động, minh bạch.
                </p>
              </div>
            </div>

            {/* Decorative Connection Line */}
            <div className="border-t border-primary-50 pt-5 flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              <span className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-primary-500 animate-spin-slow" />
                <span className="font-mono text-[9px]">Trục dữ liệu liên thông 06</span>
              </span>
              <div className="flex items-center space-x-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Hệ thống ổn định</span>
              </div>
            </div>

          </motion.div>
        </div>

      </div>
    </section>
  );
}


