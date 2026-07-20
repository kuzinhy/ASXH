import React, { useState } from "react";
import { UserProfile } from "../types";
import { updateUserProfileInFirestore } from "../lib/firebaseSync";
import { X, Camera, Save, Loader2, Award, Star, Activity, Share2, Calendar, Info } from "lucide-react";
import { getUserRank } from "../utils/rank";
import { motion, AnimatePresence } from "motion/react";
import { QUARTERS_LIST } from "../constants";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onUpdate: (updatedUser: UserProfile) => void;
}

export default function ProfileModal({ isOpen, onClose, currentUser, onUpdate }: ProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState(currentUser.fullName || "");
  const [phone, setPhone] = useState(currentUser.phone || "");
  const [address, setAddress] = useState(currentUser.address || "");
  const initialIsCustom = !!currentUser.quarter && !QUARTERS_LIST.some(q => q.name === currentUser.quarter);
  const [quarterSelect, setQuarterSelect] = useState(initialIsCustom ? "Khác" : (currentUser.quarter || QUARTERS_LIST[0].name));
  const [customQuarter, setCustomQuarter] = useState(initialIsCustom ? currentUser.quarter : "");
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || "");

  const rankInfo = getUserRank(currentUser);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const finalQuarter = quarterSelect === "Khác" ? customQuarter : quarterSelect;
    
    const updatedUser = {
      ...currentUser,
      fullName,
      phone,
      address,
      quarter: finalQuarter,
      avatarUrl
    };

    try {
      await updateUserProfileInFirestore(currentUser.uid, updatedUser);
      onUpdate(updatedUser);
      onClose();
    } catch (err) {
      console.error("Failed to update profile", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200"
        >
          {/* HEADER */}
          <div className="bg-sky-500 p-6 text-white text-center relative shrink-0">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold font-sans">Thông tin cá nhân</h2>
            <p className="text-xs font-medium text-sky-100 mt-1">Cập nhật hồ sơ để nhận hỗ trợ tốt nhất</p>
          </div>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto bg-slate-50 p-6 flex flex-col md:flex-row gap-8 custom-scrollbar">
            
            {/* Hạng Thành viên - Cột trái */}
            <div className="w-full md:w-5/12 space-y-6">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Xếp hạng Thành viên</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{rankInfo.icon}</span>
                      <span className={`px-3 py-1 rounded-lg text-sm font-black border uppercase tracking-widest ${rankInfo.color}`}>
                        {rankInfo.name}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-slate-800">{rankInfo.points} <span className="text-sm text-slate-400 font-medium">điểm</span></div>
                    {rankInfo.nextRankPoints && (
                      <div className="text-[10px] text-slate-500 font-medium mt-1">
                        Còn {Math.max(0, rankInfo.nextRankPoints - rankInfo.points)} điểm nữa
                      </div>
                    )}
                  </div>
                </div>

                {rankInfo.nextRankPoints && (
                  <div className="w-full bg-slate-100 rounded-full h-2 mb-5 overflow-hidden">
                    <div className={`${!rankInfo.isEligible && rankInfo.points >= 50 ? "bg-amber-400" : "bg-sky-500"} h-2 rounded-full transition-all duration-1000`} style={{ width: `${rankInfo.progress}%` }}></div>
                  </div>
                )}

                {!rankInfo.isEligible && (
                  <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-3">
                    <h5 className="text-[10px] font-bold text-amber-800 uppercase tracking-wider mb-2 flex items-center gap-1.5"><Award className="w-3.5 h-3.5" /> Điều kiện thăng hạng</h5>
                    <ul className="space-y-1">
                      {rankInfo.missingRequirements.map((req, idx) => (
                        <li key={idx} className="text-[10px] font-medium text-amber-700 flex items-center gap-1.5">
                          <div className="w-1 h-1 rounded-full bg-amber-500"></div> {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                    <Calendar className="w-4 h-4 text-sky-500 mx-auto mb-1" />
                    <div className="text-sm font-bold text-slate-800">{currentUser.visitDays || 0} <span className="text-[10px] text-slate-400">/ 30</span></div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wide">Truy cập</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                    <Award className="w-4 h-4 text-rose-500 mx-auto mb-1" />
                    <div className="text-sm font-bold text-slate-800">{currentUser.contributionsCount || 0} <span className="text-[10px] text-slate-400">/ 5</span></div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wide">Đóng góp</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                    <Activity className="w-4 h-4 text-emerald-500 mx-auto mb-1" />
                    <div className="text-sm font-bold text-slate-800">{currentUser.eventsAttended || 0} <span className="text-[10px] text-slate-400">/ 2</span></div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wide">Hoạt động</div>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                    <Share2 className="w-4 h-4 text-indigo-500 mx-auto mb-1" />
                    <div className="text-sm font-bold text-slate-800">{currentUser.sharesCount || 0} <span className="text-[10px] text-slate-400">/ 3</span></div>
                    <div className="text-[9px] text-slate-500 uppercase tracking-wide">Chia sẻ</div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 font-light flex items-start gap-1.5 leading-relaxed">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <p>Điểm hoạt động được tính qua số ngày truy cập (+1đ), đóng góp trực tuyến (+5đ), tham gia hoạt động (+3đ) và chia sẻ thông tin (+2đ).</p>
                </div>
              </div>
            </div>

            {/* Form - Cột phải */}
            <div className="w-full md:w-7/12">
              <form id="profile-form" onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
                <div className="flex items-center gap-4 mb-2">
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 bg-slate-100 rounded-2xl p-0.5 shadow-sm border border-slate-200">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full rounded-xl object-cover" />
                      ) : (
                        <div className="w-full h-full rounded-xl bg-gradient-to-tr from-sky-500 to-teal-500 flex items-center justify-center text-white text-2xl font-bold">
                          {fullName ? fullName.charAt(0).toUpperCase() : "A"}
                        </div>
                      )}
                    </div>
                    <label className="absolute -bottom-2 -right-2 bg-white p-1 rounded-full shadow-md cursor-pointer hover:scale-110 transition-transform border border-slate-100">
                      <div className="bg-sky-500 p-1 rounded-full text-white">
                        <Camera className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setAvatarUrl(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="text-xs font-bold text-slate-700">Ảnh đại diện (Link/Tải lên)</label>
                    <input
                      type="text"
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-sky-500 font-light"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Họ và tên</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Số điện thoại</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Địa chỉ cụ thể</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Khu phố</label>
                  <select
                    required
                    value={quarterSelect}
                    onChange={(e) => setQuarterSelect(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500"
                  >
                    {QUARTERS_LIST.map(q => (
                      <option key={q.id} value={q.name}>{q.name}</option>
                    ))}
                    <option value="Khác">Khác (Ngoài địa bàn Phường Phú Lợi)</option>
                  </select>
                  {quarterSelect === "Khác" && (
                    <input
                      type="text"
                      required
                      placeholder="Nhập tên khu phố/phường xã/tỉnh thành..."
                      value={customQuarter}
                      onChange={(e) => setCustomQuarter(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 mt-2"
                    />
                  )}
                </div>

                </form>
            </div>
          </div>
          <div className="p-4 border-t border-slate-100 bg-white flex justify-end shrink-0 z-10 relative shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl text-slate-500 font-bold text-sm hover:bg-slate-100 transition mr-2"
            >
              Hủy
            </button>
            <button
              type="submit"
              form="profile-form"
              disabled={loading}
              className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-8 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Lưu Thông Tin</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
