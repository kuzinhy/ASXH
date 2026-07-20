import React from "react";
import { 
  Heart, 
  Activity, 
  Users, 
  BookOpen, 
  Zap, 
  Coins, 
  Briefcase, 
  Shield, 
  HeartPulse, 
  Building2, 
  Sparkles,
  ArrowUpRight,
  Award
} from "lucide-react";
import { OfficialPartner } from "../types";

interface PartnersMarqueeProps {
  officialPartners?: OfficialPartner[];
}

interface Partner {
  id: string;
  name: string;
  role: string;
  description: string;
  icon: React.ComponentType<any>;
  badgeText: string;
  badgeColor: string;
  gradient: string;
  textColor: string;
}

const PARTNERS_COL_1: Partner[] = [
  {
    id: "part-1",
    name: "Ủy ban MTTQ Việt Nam Phường Phú Lợi",
    role: "Ban Chỉ Đạo & Giám Sát",
    description: "Cơ quan chủ quản định hướng, điều phối ngân sách xã hội và thẩm định các hồ sơ hỗ trợ khẩn cấp đảm bảo đúng người, đúng thời điểm.",
    icon: Building2,
    badgeText: "CHỦ QUẢN",
    badgeColor: "bg-sky-700/10 text-slate-800 border-red-200/50",
    gradient: "from-red-50 to-rose-50/50 hover:border-red-300",
    textColor: "text-red-650"
  },
  {
    id: "part-2",
    name: "Hội Chữ Thập Đỏ Phường Phú Lợi",
    role: "Điều Phối Túi Thuốc & Lương Thực",
    description: "Nhận tài trợ, kết nối trực tiếp đến các gia đình có hoàn cảnh đặc biệt khó khăn, cung ứng tủ thuốc tình thương và cứu trợ thực phẩm.",
    icon: HeartPulse,
    badgeText: "CỨU TRỢ Y TẾ",
    badgeColor: "bg-rose-500/10 text-rose-600 border-rose-200/50",
    gradient: "from-rose-50 to-pink-50/50 hover:border-rose-300",
    textColor: "text-rose-650"
  },
  {
    id: "part-3",
    name: "Đoàn Thanh Niên Phường Phú Lợi",
    role: "Lực Lượng Xung Kích Giao Nhận",
    description: "Lực lượng thanh niên xung kích phụ trách vận chuyển, cấp phát quà, lương thực và xác minh thực tế các hồ sơ trực tuyến trong 24h.",
    icon: Users,
    badgeText: "XUNG KÍCH",
    badgeColor: "bg-sky-100 text-slate-800 border-slate-200/50",
    gradient: "from-blue-50 to-indigo-50/50 hover:border-slate-300",
    textColor: "text-blue-650"
  },
  {
    id: "part-4",
    name: "Hội Liên Hiệp Phụ Nữ Phường",
    role: "Gian Hàng An Sinh 0 Đồng",
    description: "Vận hành hệ thống kho nhu yếu phẩm '0 đồng', chia sẻ thực phẩm tươi sạch và chăm lo dinh dưỡng cho trẻ em, phụ nữ khó khăn.",
    icon: Award,
    badgeText: "AN SINH 0Đ",
    badgeColor: "bg-purple-500/10 text-purple-600 border-purple-200/50",
    gradient: "from-purple-50 to-fuchsia-50/50 hover:border-purple-300",
    textColor: "text-purple-650"
  },
  {
    id: "part-5",
    name: "Trạm Y Tế Phường Phú Lợi",
    role: "Bảo Trợ Y Tế Cộng Đồng",
    description: "Hỗ trợ thăm khám tại nhà, cấp phát thuốc miễn phí và xác nhận tình trạng sức khỏe cho các trường hợp bệnh nhân hiểm nghèo.",
    icon: Activity,
    badgeText: "Y TẾ SỐ",
    badgeColor: "bg-emerald-500/10 text-emerald-600 border-emerald-200/50",
    gradient: "from-emerald-50 to-teal-50/50 hover:border-emerald-300",
    textColor: "text-emerald-650"
  }
];

const PARTNERS_COL_2: Partner[] = [
  {
    id: "part-6",
    name: "Hội Khuyến Học Phường Phú Lợi",
    role: "Học Bổng & Khuyến Học",
    description: "Tài trợ học bổng, tặng thiết bị học tập thông minh và bảo trợ chi phí đến trường cho con em hộ nghèo, hộ cận nghèo.",
    icon: BookOpen,
    badgeText: "KHUYẾN HỌC",
    badgeColor: "bg-teal-500/10 text-teal-600 border-teal-200/50",
    gradient: "from-teal-50 to-cyan-50/50 hover:border-teal-300",
    textColor: "text-teal-650"
  },
  {
    id: "part-7",
    name: "Hội Doanh Nhân Trẻ Bình Dương",
    role: "Bảo Trợ Việc Làm & Đào Tạo",
    description: "Kết nối việc làm cho người lao động mất việc, tài trợ học nghề miễn phí và đóng góp tài chính định kỳ vào quỹ an sinh.",
    icon: Briefcase,
    badgeText: "DOANH NGHIỆP",
    badgeColor: "bg-sky-500/10 text-sky-600 border-blue-100/50",
    gradient: "from-blue-50 to-yellow-50/50 hover:border-amber-300",
    textColor: "text-amber-650"
  },
  {
    id: "part-8",
    name: "Công Ty Điện Lực Thủ Dầu Một",
    role: "Bảo Trợ Năng Lượng An Toàn",
    description: "Hỗ trợ miễn giảm tiền điện cho hộ nghèo, rà soát nâng cấp hệ thống dây dẫn điện an toàn cho các gia đình khó khăn trên địa bàn.",
    icon: Zap,
    badgeText: "ĐIỆN LỰC",
    badgeColor: "bg-orange-500/10 text-orange-600 border-orange-200/50",
    gradient: "from-orange-50 to-blue-50/50 hover:border-orange-300",
    textColor: "text-orange-650"
  },
  {
    id: "part-9",
    name: "Ngân Hàng Chính Sách Xã Hội",
    role: "Tín Dụng Ưu Đãi An Sinh",
    description: "Giải ngân nhanh các nguồn vốn vay ưu đãi hỗ trợ sản xuất kinh doanh, xóa đói giảm nghèo cho bà con trong diện bảo trợ.",
    icon: Coins,
    badgeText: "TÍN DỤNG",
    badgeColor: "bg-cyan-500/10 text-cyan-600 border-cyan-200/50",
    gradient: "from-cyan-50 to-sky-50/50 hover:border-cyan-300",
    textColor: "text-cyan-650"
  },
  {
    id: "part-10",
    name: "Hội Cựu Chiến Binh Phường",
    role: "Bảo Trợ Người Có Công",
    description: "Quan tâm, chăm lo đời sống vật chất và tinh thần cho thương bệnh binh, gia đình liệt sĩ và cựu chiến binh khó khăn.",
    icon: Shield,
    badgeText: "TRI ÂN",
    badgeColor: "bg-sky-500/10 text-sky-600 border-blue-200/50",
    gradient: "from-indigo-50 to-violet-50/50 hover:border-indigo-300",
    textColor: "text-indigo-650"
  }
];

export default function PartnersMarquee({ officialPartners = [] }: PartnersMarqueeProps) {
  // We double the lists to create a seamless infinite scrolling effect
  const doubledCol1 = [...PARTNERS_COL_1, ...PARTNERS_COL_1];
  const doubledCol2 = [...PARTNERS_COL_2, ...PARTNERS_COL_2];

  return (
    <section className="py-20 bg-white overflow-hidden px-4 border-t border-slate-100" id="portal-partners">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column - Intro Information */}
          <div className="lg:col-span-5 space-y-7 text-center lg:text-left">
            <div className="inline-flex items-center space-x-2 bg-sky-100 text-slate-800 border border-sky-500/20 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-sky-500 animate-pulse" />
              <span className="font-sans">Chung tay kiến tạo tương lai</span>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-slate-800 font-serif">
                Đối Tác Đồng Hành <br />
                <span className="text-slate-800 font-semibold italic">Tiêu Biểu</span>
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed font-light max-w-xl mx-auto lg:mx-0">
                Sự chung tay đồng lòng của các cơ quan chính quyền, ban ngành đoàn thể, cơ sở y tế và các doanh nghiệp lớn đóng trên địa bàn Phường Phú Lợi là điểm tựa an sinh xã hội vững chắc, đảm bảo mọi hoàn cảnh khó khăn đều được tiếp sức kịp thời, trọn vẹn và văn minh nhất.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-4 pt-4 text-left max-w-md mx-auto lg:mx-0">
              <div className="space-y-1 border-l-2 border-blue-500 pl-3">
                <div className="text-xl sm:text-2xl font-black text-slate-800 font-mono">15+</div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Đơn vị liên kết</div>
              </div>
              <div className="space-y-1 border-l-2 border-emerald-500 pl-3">
                <div className="text-xl sm:text-2xl font-black text-slate-800 font-mono">14/14</div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Khu phố phủ sóng</div>
              </div>
              <div className="space-y-1 border-l-2 border-blue-500 pl-3">
                <div className="text-xl sm:text-2xl font-black text-slate-800 font-mono">100%</div>
                <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Minh bạch hồ sơ</div>
              </div>
            </div>

            {/* Interaction note */}
            <div className="pt-4 flex items-center justify-center lg:justify-start space-x-2 text-[10px] text-slate-500 italic">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Dữ liệu liên thông chính trực trực tiếp từ cổng an sinh Phường Phú Lợi</span>
            </div>
          </div>

          {/* Right Column - Beautiful Infinite Vertical Scrolling Marquee Cards */}
          <div className="lg:col-span-7 h-[480px] sm:h-[550px] relative overflow-hidden flex gap-4 sm:gap-6 rounded-3xl p-2 select-none">
            {/* Soft overlay gradients on top and bottom to fade cards away elegantly */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#faf5ff] to-transparent z-10 pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#faf5ff] to-transparent z-10 pointer-events-none" />

            {/* Column 1 - Normal Scroll */}
            <div className="flex-1 overflow-hidden h-full">
              <div className="flex flex-col gap-4 sm:gap-6 animate-marquee-vertical hover:[animation-play-state:paused] transition-all duration-300">
                {doubledCol1.map((partner, idx) => {
                  const Icon = partner.icon;
                  return (
                    <div 
                      key={`${partner.id}-${idx}`}
                      className={`p-5 sm:p-6 rounded-3xl border border-slate-200/40 bg-white/70 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[190px] relative group overflow-hidden`}
                    >
                      {/* Accent glow on hover */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      
                      <div className="space-y-3 relative z-10">
                        {/* Card Header */}
                        <div className="flex justify-between items-start">
                          <div className="p-2 bg-sky-100 border border-sky-500/20 text-slate-800 rounded-2xl group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
                            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <span className={`px-2 py-0.5 rounded-lg text-[8px] sm:text-[9px] font-bold border ${partner.badgeColor}`}>
                            {partner.badgeText}
                          </span>
                        </div>

                        {/* Title and Role */}
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 line-clamp-1 group-hover:text-slate-800 transition-colors duration-300 font-sans">
                            {partner.name}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            {partner.role}
                          </p>
                        </div>

                        {/* Description */}
                        <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed font-light line-clamp-3">
                          {partner.description}
                        </p>
                      </div>

                      {/* Card Footer Interaction Icon */}
                      <div className="flex justify-end pt-2 border-t border-slate-150/10 relative z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-[10px] text-slate-800 font-bold font-sans flex items-center gap-1">
                          <span>Chi tiết liên thông</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Column 2 - Slow Scroll */}
            <div className="flex-1 overflow-hidden h-full hidden sm:block">
              <div className="flex flex-col gap-4 sm:gap-6 animate-marquee-vertical-slow hover:[animation-play-state:paused] transition-all duration-300">
                {doubledCol2.map((partner, idx) => {
                  const Icon = partner.icon;
                  return (
                    <div 
                      key={`${partner.id}-${idx}`}
                      className={`p-5 sm:p-6 rounded-3xl border border-slate-200/40 bg-white/70 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between min-h-[190px] relative group overflow-hidden`}
                    >
                      {/* Accent glow on hover */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      
                      <div className="space-y-3 relative z-10">
                        {/* Card Header */}
                        <div className="flex justify-between items-start">
                          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">
                            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          <span className={`px-2 py-0.5 rounded-lg text-[8px] sm:text-[9px] font-bold border ${partner.badgeColor}`}>
                            {partner.badgeText}
                          </span>
                        </div>

                        {/* Title and Role */}
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 line-clamp-1 group-hover:text-emerald-600 transition-colors duration-300 font-sans">
                            {partner.name}
                          </h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            {partner.role}
                          </p>
                        </div>

                        {/* Description */}
                        <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed font-light line-clamp-3">
                          {partner.description}
                        </p>
                      </div>

                      {/* Card Footer Interaction Icon */}
                      <div className="flex justify-end pt-2 border-t border-slate-150/10 relative z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-[10px] text-emerald-600 font-bold font-sans flex items-center gap-1">
                          <span>Chi tiết liên thông</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* Co-organizers & Sponsors Real Logos Grid */}
        <div className="mt-20 pt-12 border-t border-slate-200/60" id="official-co-organizers">
          <div className="text-center max-w-3xl mx-auto mb-10 space-y-2">
            <span className="text-[9px] bg-sky-600/10 text-slate-800 font-extrabold px-3 py-1 rounded-full uppercase tracking-widest inline-block border border-sky-500/10">
              Bảo Chứng Uy Tín & Trách Nhiệm
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-800 font-sans tracking-tight uppercase">
              Hệ Thống Đơn Vị Đồng Hành Chính Thức
            </h3>
            <p className="text-[11px] text-slate-500 font-light">
              Các biểu trưng chính thức được liên thông bảo trợ, hỗ trợ tài chính và giám sát chuyên môn trực tiếp tại cổng an sinh Phú Lợi.
            </p>
          </div>

          <div className="relative w-full overflow-hidden py-4 select-none">
            {/* Fade overlays for smooth entry and exit */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#faf5ff] via-[#faf5ff]/80 to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#faf5ff] via-[#faf5ff]/80 to-transparent z-10 pointer-events-none" />

            <div className="flex gap-6 animate-marquee-horizontal-rtl hover:[animation-play-state:paused] w-max">
              {(() => {
                const baseList = officialPartners && officialPartners.length > 0 ? officialPartners : [
                  {
                    id: "fb-1",
                    name: "Ủy ban MTTQ Việt Nam",
                    role: "Ban Chỉ Đạo",
                    imageUrl: "/partners/avatar_matsg.jpg"
                  },
                  {
                    id: "fb-2",
                    name: "Vietcombank",
                    role: "Cổng Thanh Toán",
                    imageUrl: "/partners/logo_vcb.jpg"
                  },
                  {
                    id: "fb-3",
                    name: "Tổng Công ty SABECO",
                    role: "Nhà Tài Trợ Vàng",
                    imageUrl: "/partners/partner_1.jpg"
                  },
                  {
                    id: "fb-4",
                    name: "Hội Doanh Nhân Trẻ",
                    role: "Bảo Trợ Việc Làm",
                    imageUrl: "/partners/partner_2.jpg"
                  },
                  {
                    id: "fb-5",
                    name: "Điện Lực Thủ Dầu Một",
                    role: "Bảo Trợ Năng Lượng",
                    imageUrl: "/partners/partner_3.jpg"
                  }
                ];
                // Duplicate the entire list once to ensure a seamless infinite marquee wrap (A, B, C -> A, B, C, A, B, C)
                return [...baseList, ...baseList].map((partner, idx) => (
                  <div 
                    key={`${partner.id}-${idx}`} 
                    className="bg-white/80 backdrop-blur-md border border-slate-200/50 hover:border-sky-500/30 rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 hover:shadow-md w-[265px] shrink-0"
                  >
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center p-1 border border-slate-100 shadow-inner overflow-hidden shrink-0">
                      <img 
                        src={partner.imageUrl} 
                        alt={partner.name} 
                        className="w-full h-full object-contain"
                        referrerPolicy="no-referrer"
                        onError={(e) => { (e.target as any).src = "https://lh3.googleusercontent.com/d/1VdHot14lAHtlOODpodU5W1OAHIKuCwVE"; }}
                      />
                    </div>
                    <div className="text-left overflow-hidden">
                      <h5 className="font-extrabold text-[11px] sm:text-xs text-slate-800 uppercase tracking-tight font-sans truncate" title={partner.name}>
                        {partner.name}
                      </h5>
                      <span className="text-[9px] text-slate-500 font-mono font-bold block mt-0.5">
                        {partner.role}
                      </span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
