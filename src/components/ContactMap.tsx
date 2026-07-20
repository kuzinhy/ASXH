/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { MapPin, Phone, Mail, Clock, ShieldCheck, Building, BarChart3, Users, CheckCircle, Activity } from "lucide-react";
import { QUARTERS_LIST } from "../constants";

const HOVER_COLORS = [
  "hover:bg-red-50 hover:text-red-600 hover:border-red-200 hover:shadow-sm",
  "hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 hover:shadow-sm",
  "hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 hover:shadow-sm",
  "hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 hover:shadow-sm",
  "hover:bg-cyan-50 hover:text-cyan-600 hover:border-cyan-200 hover:shadow-sm",
  "hover:bg-sky-50 hover:text-sky-600 hover:border-sky-200 hover:shadow-sm",
  "hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 hover:shadow-sm",
  "hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 hover:shadow-sm",
  "hover:bg-violet-50 hover:text-violet-600 hover:border-violet-200 hover:shadow-sm",
  "hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 hover:shadow-sm",
  "hover:bg-fuchsia-50 hover:text-fuchsia-600 hover:border-fuchsia-200 hover:shadow-sm",
  "hover:bg-pink-50 hover:text-pink-600 hover:border-pink-200 hover:shadow-sm",
  "hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 hover:shadow-sm",
  "hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 hover:shadow-sm"
];

import { CitizenRequest } from "../types";

interface ContactMapProps {
  requests?: CitizenRequest[];
}

export default function ContactMap({ requests = [] }: ContactMapProps) {
  const [selectedKPId, setSelectedKPId] = useState<number | null>(null);

  const selectedQuarter = QUARTERS_LIST.find(q => q.id === selectedKPId);

  // Compute live real-time stats for each quarter
  const getQuarterStats = (quarterName: string, baseStats: { requests: number; completed: number; funding: number; volunteers: number }) => {
    if (!requests || requests.length === 0) {
      return {
        ...baseStats,
        resolutionRate: baseStats.requests > 0 ? Math.round((baseStats.completed / baseStats.requests) * 100) : 100
      };
    }
    // Match requests belonging to this quarter
    const qRequests = requests.filter(r => r.quarter === quarterName);
    const liveTotal = qRequests.length;
    const liveCompleted = qRequests.filter(r => r.status === "Đã hoàn thành").length;
    
    // Merge live Firestore requests into historical stats to show continuous live updates
    const requestsCount = Math.max(baseStats.requests, liveTotal);
    const completedCount = Math.max(baseStats.completed, liveCompleted);
    const resolutionRate = requestsCount > 0 ? Math.round((completedCount / requestsCount) * 100) : 100;
    
    return {
      requests: requestsCount,
      completed: completedCount,
      resolutionRate,
      funding: baseStats.funding + (liveCompleted * 500000), // simulated live funding increments
      volunteers: baseStats.volunteers + Math.floor(liveTotal * 0.25) // simulated live volunteers registered
    };
  };

  const getMapQuery = () => {
    if (!selectedQuarter) {
      return "171 Đường Huỳnh Văn Lũy, Phú Lợi, Thành phố Hồ Chí Minh";
    }
    return `Văn phòng khu phố ${selectedQuarter.shortName}, Phú Lợi, Thành phố Hồ Chí Minh`;
  };

  return (
    <section className="py-20 px-4 bg-sky-50 border-t border-sky-100" id="contact">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column: Official ward details and Dynamic Live Google Map */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6 animate-fadeIn">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-800 tracking-wider uppercase font-sans">Trụ Sở Hành Chính</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 mt-1 font-serif">Liên hệ UB MTTQ Việt Nam phường</h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-2 leading-relaxed font-light">
                Mọi ý kiến đóng góp, thắc mắc thủ tục hành chính, hoặc đề nghị cứu trợ trực tiếp có thể liên hệ theo các kênh chính thức sau:
              </p>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm text-slate-500 font-light">
              <div className="flex items-start space-x-3 bg-white/70 backdrop-blur-md p-3.5 rounded-2xl border border-blue-100/60 hover:border-blue-300 transition-all duration-300 shadow-sm">
                <MapPin className="w-5 h-5 text-slate-800 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 text-xs uppercase tracking-wider block font-sans">Địa chỉ:</strong>
                  <span className="text-slate-500 font-normal">171 đường Huỳnh Văn Lũy, khu phố Phú Thuận, phường Phú Lợi, Thành phố Hồ Chí Minh.</span>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-white/70 backdrop-blur-md p-3.5 rounded-2xl border border-blue-100/60 hover:border-blue-300 transition-all duration-300 shadow-sm">
                <Phone className="w-5 h-5 text-slate-800 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 text-xs uppercase tracking-wider block font-sans">Đường dây nóng:</strong>
                  <span className="text-slate-500 font-normal">0274.3824.115 (Mặt trận Tổ quốc Phường)</span>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-white/70 backdrop-blur-md p-3.5 rounded-2xl border border-blue-100/60 hover:border-blue-300 transition-all duration-300 shadow-sm">
                <Mail className="w-5 h-5 text-slate-800 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 text-xs uppercase tracking-wider block font-sans">Thư điện tử chính thức (email):</strong>
                  <span className="text-slate-500 font-normal block font-mono">vp.mttq.phuloi@gmail.com</span>
                </div>
              </div>

              <div className="flex items-start space-x-3 bg-white/70 backdrop-blur-md p-3.5 rounded-2xl border border-blue-100/60 hover:border-blue-300 transition-all duration-300 shadow-sm">
                <Clock className="w-5 h-5 text-slate-800 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-800 text-xs uppercase tracking-wider block font-sans">Thời gian làm việc Bộ phận Một Cửa:</strong>
                  <span className="text-slate-500 font-normal block">Sáng: 07h30 - 11h30 | Chiều: 13h30 - 17h00</span>
                  <span className="text-slate-400 font-normal block text-[10px] mt-0.5">(Làm việc từ Thứ Hai đến hết buổi Sáng Thứ Bảy hàng tuần)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Google Maps Iframe */}
          <div className="w-full h-64 sm:h-80 rounded-3xl overflow-hidden border border-slate-200 shadow-md relative group">
            <iframe
              title="Phú Lợi Interactive Digital Map"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(getMapQuery())}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
            />
            <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-xl border border-slate-100 text-[10px] font-bold text-slate-700 flex items-center space-x-1 shadow-md pointer-events-none">
              <MapPin className="w-3.5 h-3.5 text-blue-600" />
              <span>{selectedQuarter ? `KP ${selectedQuarter.id}: ${selectedQuarter.shortName}` : "Ủy ban MTTQ Phường Phú Lợi"}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Quarters database and interactive lookup */}
        <div className="lg:col-span-7 bg-white/70 backdrop-blur-md p-6 sm:p-8 rounded-3xl border border-blue-100/60 shadow-[0_20px_50px_rgba(37,99,235,0.04)] flex flex-col justify-between space-y-6">
          <div>
            <div className="border-b border-slate-200 pb-3">
              <h3 className="font-bold text-lg text-slate-800 flex items-center space-x-1.5 font-sans">
                <Building className="w-5.5 h-5.5 text-slate-800" />
                <span>Danh Sách 14 Khu Phố - Phường Phú Lợi</span>
              </h3>
              <p className="text-slate-500 text-xs mt-1 font-light">
                Nhấp chọn Khu phố để hiển thị danh sách cán bộ chủ chốt (Bí thư chi bộ, Trưởng ban điều hành và Trưởng Ban công tác mặt trận) và số liệu thống kê an sinh số thực tế.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-4">
              {QUARTERS_LIST.map((kp, index) => (
                <button
                  key={kp.id}
                  onClick={() => setSelectedKPId(selectedKPId === kp.id ? null : kp.id)}
                  className={`py-2 px-1.5 rounded-xl text-[11px] font-bold border transition-all duration-300 cursor-pointer text-center ${
                    selectedKPId === kp.id 
                      ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10 scale-[1.03]" 
                      : `bg-slate-50/20 border-slate-200 text-slate-500 ${HOVER_COLORS[index % HOVER_COLORS.length]}`
                  }`}
                >
                  {kp.shortName}
                </button>
              ))}
            </div>
          </div>

          {selectedQuarter ? (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50/50 border border-slate-200 rounded-2xl p-5 text-xs sm:text-sm text-slate-500 space-y-4 flex-1"
            >
              <div className="font-bold text-slate-800 uppercase text-xs flex flex-wrap items-center justify-between border-b border-slate-200 pb-2 gap-2 font-sans">
                <span className="tracking-wider">BAN CHỈ ĐẠO AN SINH KHU PHỐ {selectedQuarter.id}</span>
                <span className="text-slate-500 font-normal normal-case italic text-[11px] bg-slate-100 px-2 py-0.5 rounded-full">
                  {selectedQuarter.name} ({selectedQuarter.oldName})
                </span>
              </div>
              
              {/* Live Statistics for Selected Quarter */}
              {(() => {
                const liveStats = getQuarterStats(selectedQuarter.name, selectedQuarter.stats);
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="text-center p-2 border-r border-slate-100 last:border-0">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Hồ Sơ Yêu Cầu</span>
                      <span className="text-sm font-black text-slate-800 font-mono block mt-1">{liveStats.requests}</span>
                    </div>
                    <div className="text-center p-2 border-r border-slate-100 last:border-0">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Đã Hoàn Thành</span>
                      <span className="text-sm font-black text-emerald-600 font-mono block mt-1">✓ {liveStats.completed}</span>
                    </div>
                    <div className="text-center p-2 border-r border-slate-100 last:border-0">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Tỉ Lệ Giải Quyết</span>
                      <span className="text-sm font-black text-blue-600 font-mono block mt-1">{liveStats.resolutionRate}%</span>
                    </div>
                    <div className="text-center p-2 last:border-0">
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Tình Nguyện Viên</span>
                      <span className="text-sm font-black text-slate-800 font-mono block mt-1">{liveStats.volunteers}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-4">
                <strong className="text-slate-800 text-[11px] uppercase tracking-wider block font-sans">Đội ngũ Cán bộ chủ chốt:</strong>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {selectedQuarter.officers.map((officer, oIdx) => (
                    <div key={oIdx} className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-1.5 shadow-sm hover:border-blue-400 transition-all">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-sky-600 bg-slate-50 px-2 py-0.5 rounded-md uppercase">
                          {officer.role}
                        </span>
                      </div>
                      <div className="font-bold text-slate-800 text-xs sm:text-sm">{officer.name}</div>
                      <div className="flex items-center space-x-1 text-slate-800 font-mono font-bold text-xs">
                        <Phone className="w-3 h-3 shrink-0" />
                        <span>{officer.phone}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 leading-normal font-light pt-1 border-t border-slate-100">
                        {officer.address}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-slate-50/10 border border-slate-200 rounded-2xl p-8 text-xs text-slate-400 font-light italic text-center flex-1 flex flex-col justify-center items-center space-y-2">
              <Activity className="w-8 h-8 text-slate-300 animate-pulse" />
              <span>Vui lòng nhấp chọn một Khu phố ở trên để hiển thị danh bạ cán bộ phụ trách và bản đồ số!</span>
            </div>
          )}

          <div className="bg-blue-50/50 border border-slate-200 backdrop-blur p-4 rounded-2xl text-[11px] text-slate-500 leading-relaxed flex items-start space-x-2.5">
            <ShieldCheck className="w-5 h-5 text-slate-800 shrink-0 mt-0.5" />
            <div className="font-light">
              <strong className="text-slate-800 font-bold font-sans">Ủy ban Mặt trận Tổ quốc Việt Nam Phường Phú Lợi:</strong> Đội ngũ cán bộ 14 khu phố luôn sẵn sàng đồng hành, tiếp nhận thông tin cứu trợ và phản ánh từ bà con. Mọi thông tin đều được báo cáo trực tiếp đến Ban Thường trực Ủy ban MTTQ Việt Nam phường để giám sát và xử lý kịp thời.
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

