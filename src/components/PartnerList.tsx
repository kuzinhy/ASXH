import React from "react";
import { Users } from "lucide-react";
import { OfficialPartner } from "../types";

interface PartnerListProps {
  partners?: OfficialPartner[];
}

export default function PartnerList({ partners = [] }: PartnerListProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-[500px] flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full blur-3xl -z-10" />
      <div className="p-6 sm:p-8 flex-1 flex flex-col overflow-hidden">
        <div className="mb-6 flex flex-col items-start border-b border-slate-100 pb-4 shrink-0">
          <span className="text-[10px] font-bold text-blue-900 tracking-widest uppercase flex items-center space-x-1.5 font-sans mb-1.5">
            <Users className="w-3.5 h-3.5 text-blue-900" />
            <span>Đối Tác Đồng Hành Tiêu Biểu</span>
          </span>
          <h2 className="text-xl sm:text-2xl font-normal text-blue-900 font-sans">
            Đơn vị <span className="text-blue-900 italic font-medium">Tài Trợ</span>
          </h2>
          <p className="text-slate-500 text-[11px] sm:text-xs mt-1.5 leading-relaxed font-light">
            Tri ân các đơn vị, tổ chức và cơ sở tôn giáo đã đồng hành lâu dài cùng địa phương.
          </p>
        </div>

        <div className="flex flex-col gap-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {partners && partners.length > 0 ? (
            partners.map((partner) => (
              <div key={partner.id} className="p-4 bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-lg -mr-4 -mt-4 transition-all duration-500 group-hover:scale-150" />
                <div className="flex justify-between items-start space-x-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl p-1 flex items-center justify-center shrink-0 shadow-xs">
                      <img 
                        src={partner.imageUrl} 
                        alt={partner.name} 
                        className="max-w-full max-h-full object-contain"
                        referrerPolicy="no-referrer"
                        onError={(e) => { (e.target as any).src = "https://lh3.googleusercontent.com/d/1VdHot14lAHtlOODpodU5W1OAHIKuCwVE"; }}
                      />
                    </div>
                    <div>
                      <span className="text-[9px] bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded-full border border-blue-500/10 uppercase tracking-wide">
                        {partner.role}
                      </span>
                      <h5 className="font-bold text-xs text-blue-900 mt-1.5 font-sans">{partner.name}</h5>
                    </div>
                  </div>
                  {partner.amount && (
                    <span className="text-blue-900 font-bold font-mono text-[10px] block bg-slate-50 px-2 py-1 rounded shrink-0">
                      {partner.amount}
                    </span>
                  )}
                </div>
                {partner.description && (
                  <p className="text-[10px] text-slate-500 leading-relaxed mt-2 font-light">
                    {partner.description}
                  </p>
                )}
              </div>
            ))
          ) : (
            <>
              {/* Partner 1 */}
              <div className="p-4 bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50 rounded-full blur-lg -mr-4 -mt-4 transition-all duration-500 group-hover:scale-150" />
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] bg-blue-100 text-blue-900 font-bold px-2 py-0.5 rounded-full border border-blue-500/10 uppercase tracking-wide">Doanh nghiệp</span>
                    <h5 className="font-bold text-xs text-blue-900 mt-1.5 font-sans">Tập đoàn Bia SABECO</h5>
                  </div>
                  <span className="text-blue-900 font-bold font-mono text-[10px] block bg-slate-50 px-2 py-1 rounded">90.000.000đ</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed mt-2 font-light">
                  Đồng hành cùng chương trình "Chung vị tết Việt gắn kết muôn miền", trao tặng 100 phần quà Tết trị giá 900.000đ/phần.
                </p>
              </div>

              {/* Partner 2 */}
              <div className="p-4 bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-lg -mr-4 -mt-4 transition-all duration-500 group-hover:scale-150" />
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] bg-blue-500/10 text-blue-600 font-bold px-2 py-0.5 rounded-full border border-indigo-500/10 uppercase tracking-wide">Nhà nước</span>
                    <h5 className="font-bold text-xs text-blue-900 mt-1.5 font-sans">Công ty Xổ số kiến thiết TP.HCM</h5>
                  </div>
                  <span className="text-blue-600 font-bold font-mono text-[10px] block bg-blue-50 px-2 py-1 rounded">12.000.000đ</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed mt-2 font-light">
                  Phối hợp chăm lo, tổ chức thăm hỏi và tặng quà Tết chu đáo cho các Mẹ Việt Nam Anh Hùng, thương binh và gia đình chính sách.
                </p>
              </div>

              {/* Partner 3 */}
              <div className="p-4 bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-emerald-200 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/5 rounded-full blur-lg -mr-4 -mt-4 transition-all duration-500 group-hover:scale-150" />
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-600 font-bold px-2 py-0.5 rounded-full border border-emerald-500/10 uppercase tracking-wide">Tôn giáo</span>
                    <h5 className="font-bold text-xs text-blue-900 mt-1.5 font-sans">Chùa Phước An & Chùa An Hòa</h5>
                  </div>
                  <span className="text-emerald-600 font-bold font-mono text-[10px] block bg-emerald-50 px-2 py-1 rounded">50.000.000đ</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed mt-2 font-light">
                  Cùng Ủy ban MTTQ Việt Nam phường trao tặng 180 phần quà an sinh ý nghĩa hỗ trợ bà con nghèo, người già neo đơn đón tết.
                </p>
              </div>

              {/* Partner 4 */}
              <div className="p-4 bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-blue-100 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 rounded-full blur-lg -mr-4 -mt-4 transition-all duration-500 group-hover:scale-150" />
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] bg-blue-500/10 text-blue-600 font-bold px-2 py-0.5 rounded-full border border-blue-500/10 uppercase tracking-wide">Cộng đồng</span>
                    <h5 className="font-bold text-xs text-blue-900 mt-1.5 font-sans">Bếp ăn Thiện nguyện Phú Lợi</h5>
                  </div>
                  <span className="text-blue-600 font-bold font-mono text-[10px] block bg-blue-50 px-2 py-1 rounded">60.000.000đ</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed mt-2 font-light">
                  Tổ chức nấu và phát hơn 3.000 suất cơm "0 đồng" nghĩa tình mỗi tuần cho người khuyết tật, người lao động tự do.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
