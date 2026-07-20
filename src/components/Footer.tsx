/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Landmark, CheckCircle, HeartHandshake } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-b from-slate-950 to-blue-950 text-slate-300 border-t border-blue-900/40 py-16 px-6 shrink-0 relative z-10 font-sans overflow-hidden" id="portal-footer">
      {/* Modern blue/cyan bleeding light glow effects */}
      <div className="absolute top-0 left-1/4 w-[400px] h-[400px] rounded-full bg-blue-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-cyan-500/10 blur-[110px] pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* Left Column - Legal Credits */}
        <div className="md:col-span-5 space-y-5 text-center md:text-left animate-fadeIn">
          <div className="flex items-center justify-center md:justify-start space-x-4">
            <div className="flex -space-x-3 shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary-600 to-blue-400 flex items-center justify-center border-2 border-slate-950 shadow-lg shrink-0">
                <Landmark className="w-5 h-5 text-white" />
              </div>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-400 flex items-center justify-center border-2 border-slate-950 shadow-lg shrink-0">
                <HeartHandshake className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-left">
              <h4 className="text-xs font-black tracking-widest text-white uppercase font-sans">ỦY BAN MTTQ VIỆT NAM PHƯỜNG PHÚ LỢI</h4>
              <p className="text-[10px] text-primary-400 font-mono font-bold uppercase tracking-[0.2em] mt-0.5">Thành phố Hồ Chí Minh</p>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
            Bản quyền thuộc về UBMTTQVN Phường Phú Lợi, Thành phố Hồ Chí Minh.<br />
            Chịu trách nhiệm nội dung: Ban chỉ đạo Chương trình Chuyển đổi số & Đề án An sinh xã hội số Phường Phú Lợi.
          </p>
          
          <div className="text-[11px] text-slate-300 leading-relaxed font-medium mt-3 space-y-1 border-l-2 border-emerald-500 pl-4">
            <p><strong className="text-white font-black">Cán bộ phụ trách:</strong> Huỳnh Cẩm Tú - Chuyên viên Mặt trận Tổ quốc Việt Nam phường Phú Lợi</p>
            <p><strong className="text-white font-black">SĐT:</strong> 0902.662.323</p>
            <p><strong className="text-white font-black">Email:</strong> vp.mttq.phuongphuloi@gmail.com</p>
          </div>

          <p className="text-[10px] text-slate-500 italic font-medium border-l-2 border-primary-500/30 pl-4">
            Phần mềm được nâng cấp, tối ưu hóa giao diện và tính năng dựa trên nguyên mẫu nhằm phục vụ cộng đồng tốt nhất.
          </p>
        </div>

        {/* Middle Column - External official government links */}
        <div className="md:col-span-4 space-y-4 text-center md:text-left">
          <h5 className="text-[11px] font-black uppercase tracking-widest text-white border-b border-blue-900/50 pb-2 font-sans">Liên kết Liên quan</h5>
          <ul className="text-xs space-y-3 font-bold text-slate-400">
            <li>
              <a href="https://dichvucong.gov.vn" target="_blank" rel="noreferrer" className="hover:text-primary-400 transition flex items-center justify-center md:justify-start space-x-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 inline-block"></span>
                <span>Cổng Dịch vụ công Quốc gia</span>
              </a>
            </li>
            <li>
              <a href="#" target="_blank" rel="noreferrer" className="hover:text-primary-400 transition flex items-center justify-center md:justify-start space-x-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 inline-block"></span>
                <span>Cổng Dịch vụ công Thành phố Hồ Chí Minh</span>
              </a>
            </li>
            <li>
              <a href="https://baohiemxahoi.gov.vn" target="_blank" rel="noreferrer" className="hover:text-primary-400 transition flex items-center justify-center md:justify-start space-x-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 inline-block"></span>
                <span>Bảo hiểm xã hội Việt Nam</span>
              </a>
            </li>
            <li>
              <a href="#" target="_blank" rel="noreferrer" className="hover:text-primary-400 transition flex items-center justify-center md:justify-start space-x-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 inline-block"></span>
                <span>Cổng thông tin điện tử Thành phố</span>
              </a>
            </li>
          </ul>
        </div>

        {/* Right Column - Tech stamp */}
        <div className="md:col-span-3 space-y-4 text-center md:text-left">
          <h5 className="text-[11px] font-black uppercase tracking-widest text-white border-b border-blue-900/50 pb-2 font-sans">Tiêu chuẩn Cổng điện tử</h5>
          <div className="space-y-4 flex flex-col items-center md:items-start">
            <div className="inline-flex items-center space-x-2 bg-blue-950/60 border border-blue-900/50 px-3 py-2 rounded-xl text-[10px] text-primary-400 font-black uppercase tracking-widest">
              <CheckCircle className="w-4 h-4 text-primary-600" />
              <span>An toàn thông tin ISO 27001</span>
            </div>
            
            <div className="text-[10px] text-slate-400 leading-relaxed font-medium">
              Hệ thống đáp ứng toàn bộ các tiêu chí kỹ thuật công nghệ thông tin quy định tại Thông tư 32/2017/TT-BTTTT của Bộ Thông tin & Truyền thông.
            </div>
          </div>
        </div>

      </div>

      <div className="max-w-7xl mx-auto border-t border-blue-900/30 mt-10 pt-8 flex flex-col sm:flex-row justify-between items-center text-[10px] text-slate-500 gap-4 font-mono font-bold uppercase tracking-widest relative z-10">
        <span>© 2026 UBMTTQVN Phường Phú Lợi. Toàn quyền bảo lưu.</span>
        <div className="flex space-x-5">
          <a href="#contact" className="hover:text-primary-400 transition">Điều khoản bảo mật</a>
          <span className="text-slate-800">•</span>
          <a href="#services" className="hover:text-primary-400 transition">Quy chế hoạt động</a>
          <span className="text-slate-800">•</span>
          <a href="#ai-assistant" className="hover:text-primary-400 transition">Hỏi đáp AI</a>
        </div>
      </div>
    </footer>
  );
}
