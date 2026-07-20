import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, Clock, Menu, X, Landmark, Activity, LogIn, LogOut, User,
  ChevronDown, ChevronUp, Users, Settings, Gift, Briefcase, FileText, Globe, HeartHandshake, Eye
} from "lucide-react";
import { UserProfile } from "../types";
import { getUserRank } from "../utils/rank";

import ProfileModal from "./ProfileModal";

interface HeaderProps {
  currentUser: UserProfile | null;
  onUpdateProfile?: (user: UserProfile) => void;
  onAuthClick: () => void;
  onLogoutClick: () => void;
  portalTitle?: string;
  onAdminNavigate?: (tab: string) => void;
  totalVisits?: number;
  onlineCount?: number;
}

export default function Header({ 
  currentUser, 
  onAuthClick, 
  onLogoutClick, 
  portalTitle, 
  onAdminNavigate, 
  onUpdateProfile,
  totalVisits,
  onlineCount
}: HeaderProps) {
  const [time, setTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [mobileAdminOpen, setMobileAdminOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  };

  const isAdmin = currentUser?.isAdmin || currentUser?.email?.toLowerCase() === "nguyenhuy.thudaumot@gmail.com";
  const isOfficer = currentUser?.isOfficer;
  const isVolunteer = currentUser?.isVolunteer;

  const getRoleLabel = () => {
    if (isAdmin) return "Quản trị viên";
    if (isOfficer) return "Cán bộ Phường";
    if (isVolunteer) return "Tình nguyện viên";
    return "Công dân";
  };

  const handleAdminClick = (tab: string) => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    if (onAdminNavigate) {
      onAdminNavigate(tab);
    } else {
      // Fallback scroll
      const el = document.getElementById("admin-hub-panel");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <>
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl text-slate-900 border-b border-blue-100/50 shadow-[0_2px_15px_-3px_rgba(37,99,235,0.07)]" id="portal-header">
      {/* Top Bar with Time and Secure Status */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-blue-900 px-4 py-2.5 text-[10px] sm:text-[11px] text-blue-100 flex flex-col md:flex-row justify-between items-center gap-2 md:gap-0 border-b border-blue-500/20 relative overflow-hidden">
        {/* Modern high-tech blue/cyan color bleed circles */}
        <div className="absolute top-0 left-10 w-40 h-40 bg-cyan-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 right-20 w-32 h-32 bg-blue-500/25 rounded-full blur-2xl pointer-events-none" />
        {/* Decorative thin light glow line at the bottom of top bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />

        <div className="flex items-center space-x-2 relative z-10">
          <Clock className="w-3.5 h-3.5 text-primary-400 animate-pulse" />
          <span className="font-mono text-blue-100 font-bold tracking-wide">{formatTime(time)}</span>
          <span className="text-blue-800/60">|</span>
          <span className="hidden sm:inline text-blue-300/80 font-medium">{formatDate(time)}</span>
        </div>
        
        {/* Visitors and Online count placed compactly here */}
        <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] relative z-10">
          {totalVisits !== undefined && (
            <div className="flex items-center space-x-1.5 text-blue-200/90 font-medium">
              <Eye className="w-3.5 h-3.5 text-blue-400" />
              <span>Truy cập:</span>
              <span className="font-bold font-mono text-blue-100 bg-blue-900/40 px-2 py-0.5 rounded-lg border border-blue-800/30">{totalVisits.toLocaleString("vi-VN")}</span>
            </div>
          )}
          
          {onlineCount !== undefined && (
            <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Trực tuyến:</span>
              <span className="font-bold font-mono text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded-lg border border-emerald-500/30">{onlineCount.toLocaleString("vi-VN")}</span>
            </div>
          )}
          
          <span className="text-blue-900 hidden md:inline">|</span>
 
          <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold">
            <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span className="text-[9px] tracking-widest uppercase font-black">Cổng Live</span>
          </div>
          <span className="text-blue-900 hidden lg:inline">|</span>
          <div className="flex items-center space-x-1.5 text-primary-300 font-black bg-primary-950/60 px-2.5 py-1 rounded-lg border border-primary-800/30 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5 text-primary-400 animate-pulse" />
            <span className="text-[9px] uppercase tracking-widest font-sans">Mạng An Sinh Số</span>
          </div>
        </div>
      </div>

      {/* Main Banner Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex justify-between items-center">
        {/* Logo and National/Municipal Header */}
        <div className="flex items-center space-x-4">
          {/* Emblem Design */}
          <div className="flex -space-x-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-700 via-primary-600 to-primary-500 flex items-center justify-center border-2 border-white shadow-md shrink-0 transition-transform duration-300 hover:scale-105 z-10">
              <Landmark className="w-5.5 h-5.5 text-white" />
            </div>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-red-600 via-red-500 to-orange-500 flex items-center justify-center border-2 border-white shadow-md shrink-0 transition-transform duration-300 hover:scale-105">
              <HeartHandshake className="w-5.5 h-5.5 text-white" />
            </div>
          </div>
          
          <div className="flex flex-col">
            <span className="text-[9px] sm:text-[10px] font-extrabold tracking-[0.2em] text-primary-900/60 uppercase font-sans">
              ỦY BAN MTTQ VIỆT NAM PHƯỜNG PHÚ LỢI
            </span>
            <h1 className="text-[18px] sm:text-[20px] font-black tracking-tighter text-slate-900 uppercase flex items-center font-sans whitespace-nowrap bg-clip-text text-transparent bg-gradient-to-r from-primary-900 to-primary-700">
              CỔNG AN SINH XÃ HỘI SỐ
              <span className="ml-2 hidden md:inline-block bg-primary-600 text-white text-[9px] px-2.5 py-0.5 rounded-full font-black border border-primary-400 shadow-sm uppercase tracking-widest">
                v3.0
              </span>
            </h1>
            <span className="text-[10px] text-slate-500 font-semibold tracking-wide">
              Thành phố Hồ Chí Minh — <span className="text-primary-600">Kết Nối & Sẻ Chia</span>
            </span>
          </div>
        </div>

        {/* Navigation Menu (Desktop) */}
        <nav className="hidden lg:flex items-center space-x-4 xl:space-x-6 text-[10px] leading-[13px] whitespace-nowrap uppercase tracking-wider font-semibold font-sans">



          <a href="#services" className="text-slate-600 hover:text-primary-600 hover:underline decoration-primary-500/30 underline-offset-8 decoration-2 transition-all duration-300 whitespace-nowrap">Dịch vụ trực tuyến</a>
          <a href="#facebook-news-feed" className="text-slate-600 hover:text-primary-600 hover:underline decoration-primary-500/30 underline-offset-8 decoration-2 transition-all duration-300 whitespace-nowrap">Tin tức Facebook</a>
          <a href="#ai-assistant" className="text-slate-600 hover:text-primary-600 hover:underline decoration-primary-500/30 underline-offset-8 decoration-2 transition-all duration-300 whitespace-nowrap">Trợ lý ảo AI</a>
          
          {/* Auth State Button */}
          {currentUser ? (
            <div className="flex items-center space-x-2">
              <div className="relative">
                <button 
                   onClick={() => setDropdownOpen(!dropdownOpen)}
                   className="flex items-center space-x-3 bg-white hover:bg-primary-50 border border-slate-200/80 shadow-sm hover:shadow-md hover:border-primary-300/60 rounded-2xl p-1.5 pr-5 transition-all duration-300 cursor-pointer text-left focus:outline-none group"
                >
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt="Avatar" className="w-9 h-9 rounded-xl object-cover shadow-sm ring-2 ring-white" />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-black text-xs shadow-sm ring-2 ring-white">
                      {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className={`text-[9px] font-bold leading-none uppercase tracking-widest ${isAdmin ? "text-primary-700" : "text-slate-500"}`}>
                      {getRoleLabel()}
                    </span>
                    <span className="text-[9px] font-black leading-none uppercase tracking-widest text-primary-600 mt-0.5">
                      {getUserRank(currentUser).name}
                    </span>
  
                    <span className="text-xs font-bold text-slate-900 leading-tight max-w-[120px] truncate group-hover:text-primary-700 transition-colors">
                      {currentUser.fullName}
                    </span>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : 'group-hover:text-primary-500'}`} />
                </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {dropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 cursor-default" 
                      onClick={() => setDropdownOpen(false)}
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="absolute right-0 mt-2.5 w-72 bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-[24px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-5 z-50 text-left space-y-4"
                    >
                      {/* User Header Info */}
                      <div className="flex items-center space-x-4 border-b border-slate-100 pb-4">
                        {currentUser.avatarUrl ? (
                          <img src={currentUser.avatarUrl} alt="Avatar" className="w-12 h-12 rounded-full object-cover shadow-sm" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-slate-800 to-blue-500 flex items-center justify-center text-white font-black text-lg shadow-sm">
                            {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : "U"}
                          </div>
                        )}
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-[13px] font-bold text-slate-900 truncate leading-tight mb-0.5">{currentUser.fullName}</span>
                          <span className="text-[11px] text-slate-500 truncate leading-tight">{currentUser.email}</span>
                          
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                              isAdmin ? "bg-red-50 text-red-600 border-red-100" : "bg-slate-50 text-slate-600 border-slate-200"
                            }`}>
                              {isAdmin && <ShieldCheck className="w-2.5 h-2.5 mr-1" />}
                              {getRoleLabel()}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${getUserRank(currentUser).color}`}>
                              {getUserRank(currentUser).icon} {getUserRank(currentUser).name}
                            </span>
                          </div>
  
                        </div>
                      </div>

                      {/* Quick Access List */}
                      <div className="space-y-1">
                        <div className="px-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Tài khoản</div>
                        
                        <button 
                          onClick={() => {
                            setDropdownOpen(false);
                            window.dispatchEvent(new CustomEvent("navigateTab", { detail: "citizen" }));
                          }}
                          className="w-full flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-sm text-primary-700 bg-primary-50/50 hover:bg-primary-100/70 border border-primary-200/50 transition-all text-left group/nav"
                        >
                          <Globe className="w-4 h-4 text-primary-600 group-hover/nav:scale-110 transition-transform" />
                          <span className="font-black uppercase tracking-wider text-[11px]">Cổng Công Dân Số</span>
                        </button>

                        <button 
                          onClick={() => {
                            setDropdownOpen(false);
                            setIsProfileOpen(true);
                          }}
                          className="w-full flex items-center space-x-3 px-3.5 py-3 rounded-2xl text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all text-left group/nav"
                        >
                          <User className="w-4 h-4 text-slate-400 group-hover/nav:text-primary-500" />
                          <span className="font-bold">Thông tin cá nhân</span>
                        </button>
                      </div>

                      {/* Admin Actions if Admin */}
                      {isAdmin && (
                        <div className="pt-2 border-t border-slate-100">
                          <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 mt-1">Quản trị</div>
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              handleAdminClick("roles");
                            }}
                            className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm text-sky-700 hover:bg-sky-50 transition-colors text-left cursor-pointer"
                          >
                            <ShieldCheck className="w-4 h-4 text-sky-600" />
                            <span className="font-bold">Cổng Quản trị hệ thống</span>
                          </button>
                        </div>
                      )}

                      {/* Logout Trigger */}
                      <div className="pt-2 border-t border-slate-100">
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            onLogoutClick();
                          }}
                          className="w-full flex items-center justify-center space-x-2 mt-1 py-2.5 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
          ) : (
            <button 
              onClick={onAuthClick}
              className="bg-slate-50 hover:bg-sky-500 hover:text-white text-slate-800 font-bold px-4 py-2.5 rounded-xl transition-all duration-300 border border-slate-200 text-[10px] uppercase tracking-wider flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Đăng Nhập
            </button>
          )}

          <a 
            href="#services" 
            className="bg-primary-600 hover:bg-primary-700 text-white font-black px-6 py-3 rounded-2xl transition-all duration-300 shadow-[0_8px_20px_-4px_rgba(37,99,235,0.4)] hover:shadow-[0_12px_25px_-5px_rgba(37,99,235,0.5)] hover:-translate-y-0.5 active:translate-y-0 text-[10px] uppercase tracking-widest active:scale-95 text-center"
          >
            Đăng Ký Hỗ Trợ
          </a>
        </nav>

        {/* Burger Button (Mobile) */}
        <button 
          className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 hover:underline decoration-sky-500/50 underline-offset-4 rounded-lg focus:outline-none cursor-pointer"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-200 px-4 py-5 space-y-3 shadow-2xl text-slate-800 max-h-[85vh] overflow-y-auto"
        >
          


          {currentUser && (
            <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-2">
              <div className="flex items-center space-x-3">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt="Avatar" className="w-9 h-9 rounded-lg object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-sky-500 flex items-center justify-center text-white font-extrabold text-sm">
                    {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
                <div className="flex-1 text-left">
                  
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`block text-[10px] font-bold uppercase ${isAdmin ? "text-slate-800" : "text-slate-500"}`}>
                      {getRoleLabel()}
                    </span>
                    <span className={`block text-[10px] font-bold uppercase ${getUserRank(currentUser).color.split(' ')[0]}`}>
                      - {getUserRank(currentUser).name}
                    </span>
                  </div>
  
                  <span className="block text-sm font-bold text-slate-800">{currentUser.fullName}</span>
                </div>
                <button 
                  onClick={() => { onLogoutClick(); setMobileMenuOpen(false); }}
                  className="bg-sky-700/10 text-slate-800 p-2 rounded-xl border border-red-500/20 flex items-center justify-center cursor-pointer"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4.5 h-4.5" />
                </button>
              </div>

              <div className="pt-2.5 border-t border-slate-200 space-y-1">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    window.dispatchEvent(new CustomEvent("navigateTab", { detail: "citizen" }));
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-sky-50 transition-colors text-left"
                >
                  <Globe className="w-4 h-4 text-slate-800" />
                  <span>Cổng Công Dân Số</span>
                </button>

                <button
                  onClick={() => {
                    setIsProfileOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-sky-50 transition-colors text-left"
                >
                  <User className="w-4 h-4 text-slate-800" />
                  <span>Thông tin cá nhân</span>
                </button>
              </div>
              {/* Mobile Admin Section */}
              {isAdmin && (
                <div className="pt-2.5 border-t border-slate-200">
                  <button
                    onClick={() => {
                      handleAdminClick("roles");
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl text-xs font-bold text-slate-800 hover:bg-red-50 transition-colors text-left"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-800" />
                    <span>Truy cập Cổng Quản trị ↗</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <a 
            href="#services" 
            className="block text-xs uppercase tracking-wider text-slate-500 hover:text-slate-800 font-bold py-2.5 border-b border-slate-100"
            onClick={() => setMobileMenuOpen(false)}
          >
            Dịch vụ trực tuyến
          </a>

          <a 
            href="#facebook-news-feed" 
            className="block text-xs uppercase tracking-wider text-slate-500 hover:text-slate-800 font-bold py-2.5 border-b border-slate-100"
            onClick={() => setMobileMenuOpen(false)}
          >
            Tin tức Facebook
          </a>
          <a 
            href="#ai-assistant" 
            className="block text-xs uppercase tracking-wider text-slate-500 hover:text-slate-800 font-bold py-2.5 border-b border-slate-100"
            onClick={() => setMobileMenuOpen(false)}
          >
            Trợ lý ảo AI
          </a>
          
          {!currentUser && (
            <button 
              onClick={() => { onAuthClick(); setMobileMenuOpen(false); }}
              className="w-full text-center bg-slate-50 hover:bg-sky-500 hover:text-white text-slate-800 font-bold py-3 rounded-xl text-[10px] uppercase tracking-wider border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              Đăng Nhập Công Dân
            </button>
          )}

          <a 
            href="#services" 
            className="block text-center bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-xl text-[10px] uppercase tracking-wider shadow-lg"
            onClick={() => setMobileMenuOpen(false)}
          >
            Đăng Ký Hỗ Trợ Khẩn Cấp
          </a>
        </motion.div>
      )}
    </header>
      {currentUser && (
        <ProfileModal
          isOpen={isProfileOpen}
          onClose={() => setIsProfileOpen(false)}
          currentUser={currentUser}
          onUpdate={(updatedUser) => {
            if (onUpdateProfile) onUpdateProfile(updatedUser);
          }}
        />
      )}
    </>
  );
}
