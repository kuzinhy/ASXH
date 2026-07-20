import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Copy, Check, Share2, Facebook, MessageSquare, Globe, ExternalLink, AlertCircle } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  shareTitle: string;
  shareText: string;
  shareUrl: string;
  showToast?: (title: string, message: string, type: "success" | "info" | "warning" | "error") => void;
}

export default function ShareModal({
  isOpen,
  onClose,
  title,
  shareTitle,
  shareText,
  shareUrl,
  showToast
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  // Check if Web Share API is supported
  const isWebShareSupported = typeof navigator !== "undefined" && !!navigator.share;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      if (showToast) {
        showToast("Đã sao chép!", "Liên kết chia sẻ đã được sao chép vào bộ nhớ tạm.", "success");
      }
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        if (showToast) {
          showToast("Đã sao chép!", "Liên kết chia sẻ đã được sao chép vào bộ nhớ tạm.", "success");
        }
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        if (showToast) {
          showToast("Lỗi sao chép", "Không thể sao chép liên kết tự động. Hãy sao chép thủ công.", "error");
        }
      }
      document.body.removeChild(textArea);
    }
  };

  const handleWebShare = async () => {
    if (!isWebShareSupported) return;
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      });
      if (showToast) {
        showToast("Chia sẻ thành công", "Cảm ơn bạn đã lan tỏa thông tin tích cực!", "success");
      }
      onClose();
    } catch (err) {
      // Don't show toast if user cancelled sharing
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("Web Share API failed:", err);
        if (showToast) {
          showToast("Chia sẻ thất bại", "Có lỗi xảy ra khi dùng tính năng chia sẻ hệ thống.", "error");
        }
      }
    }
  };

  const handleShareFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(fbUrl, "_blank", "width=600,height=400,resizable=yes");
    if (showToast) {
      showToast("Đang mở Facebook", "Hệ thống đang chuyển hướng bạn tới trang chia sẻ Facebook.", "info");
    }
    onClose();
  };

  const handleShareZalo = () => {
    const zaloUrl = `https://sp.zalo.me/share_to_zalo?url=${encodeURIComponent(shareUrl)}`;
    window.open(zaloUrl, "_blank", "width=600,height=500,resizable=yes");
    if (showToast) {
      showToast("Đang mở Zalo", "Hệ thống đang chuyển hướng bạn tới trang chia sẻ Zalo.", "info");
    }
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" id="share-modal-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-slate-100"
            id="share-modal-container"
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-sky-500" />
                  <span>{title}</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Lan tỏa thông tin vì cộng đồng an sinh</p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
                id="close-share-modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Target Item Card */}
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                <span className="text-[8px] uppercase tracking-wider font-extrabold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">Đang chia sẻ</span>
                <h4 className="font-bold text-xs text-slate-700 mt-1.5 line-clamp-1">{shareTitle}</h4>
                <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{shareText}</p>
              </div>

              {/* Direct Native Share (Web Share API) Button */}
              {isWebShareSupported && (
                <button
                  onClick={handleWebShare}
                  className="w-full bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-500 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-sky-500/20 hover:opacity-95 transition-all duration-300 transform active:scale-98 cursor-pointer"
                  id="share-native-btn"
                >
                  <Globe className="w-4 h-4" />
                  <span>Chia sẻ bằng thiết bị (Nhanh nhất)</span>
                </button>
              )}

              {/* Grid of sharing options */}
              <div className="grid grid-cols-3 gap-3">
                {/* Facebook Share */}
                <button
                  onClick={handleShareFacebook}
                  className="flex flex-col items-center justify-center p-3.5 border border-slate-150 rounded-2xl hover:border-blue-500 hover:bg-blue-50/10 transition-all duration-200 group cursor-pointer"
                  id="share-fb-btn"
                >
                  <div className="bg-blue-100 text-blue-600 p-2.5 rounded-full group-hover:bg-blue-600 group-hover:text-white transition duration-200">
                    <Facebook className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 mt-2 group-hover:text-blue-600 transition">Facebook</span>
                </button>

                {/* Zalo Share */}
                <button
                  onClick={handleShareZalo}
                  className="flex flex-col items-center justify-center p-3.5 border border-slate-150 rounded-2xl hover:border-sky-500 hover:bg-sky-50/10 transition-all duration-200 group cursor-pointer"
                  id="share-zalo-btn"
                >
                  <div className="bg-sky-100 text-sky-600 p-2.5 rounded-full group-hover:bg-sky-600 group-hover:text-white transition duration-200">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 mt-2 group-hover:text-sky-600 transition">Zalo</span>
                </button>

                {/* Copy link */}
                <button
                  onClick={handleCopyLink}
                  className="flex flex-col items-center justify-center p-3.5 border border-slate-150 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50/10 transition-all duration-200 group cursor-pointer"
                  id="share-copy-btn"
                >
                  <div className={`p-2.5 rounded-full transition duration-200 ${
                    copied 
                      ? "bg-emerald-500 text-white" 
                      : "bg-emerald-100 text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white"
                  }`}>
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 mt-2 group-hover:text-emerald-600 transition">Sao chép link</span>
                </button>
              </div>

              {/* Sandbox Tip inside general ShareModal */}
              <div className="bg-amber-50/75 border border-amber-200/60 rounded-xl p-3 text-[10px] text-amber-900 flex gap-2 leading-relaxed shadow-sm">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-amber-950 mb-0.5">Lưu ý khi chia sẻ lên MXH (Môi trường Sandbox):</span>
                  Do ứng dụng đang chạy ở máy chủ phát triển bảo mật, Facebook/Zalo không thể quét trực tiếp liên kết này để tự động lấy tiêu đề/ảnh. Bạn nên bấm <strong>"Sao chép link"</strong> rồi dán trực tiếp khi tạo bài đăng của mình!
                </div>
              </div>

              {/* Direct share URL preview */}
              <div className="flex items-center space-x-2 bg-slate-50 border border-slate-150 rounded-xl p-2.5 min-w-0">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  onClick={handleCopyLink}
                  className="flex-1 bg-transparent border-none text-[10px] text-slate-500 font-mono focus:outline-none focus:ring-0 truncate cursor-pointer"
                />
                <button
                  onClick={handleCopyLink}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-200 shrink-0 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
