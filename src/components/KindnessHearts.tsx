/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Heart, 
  Sparkles, 
  Share2, 
  Copy, 
  Check, 
  X, 
  HeartHandshake, 
  Globe, 
  ExternalLink,
  Award,
  ChevronRight,
  Bookmark,
  AlertCircle
} from "lucide-react";
import { NewsArticle } from "../types";

interface HeartParticle {
  id: number;
  x: number; 
  y: number; 
  size: number;
  color: string;
  emoji: string;
  text?: string;
  drift: number; 
}

interface KindnessHeartsProps {
  news?: NewsArticle[];
}

const SHARING_QUOTES = [
  "Chúc bà con Phú Lợi luôn bình an! 🌸",
  "Nghĩa tình Phú Lợi - Sẻ chia nụ cười! ❤️",
  "Lá lành đùm lá rách - Gắn kết cộng đồng! 🤝",
  "Phú Lợi văn minh, ấm áp tình người! ✨",
  "Đồng lòng vượt gian khó! 🇻🇳",
  "Sát cánh cùng hộ nghèo & người già neo đơn! 🏡",
  "Cảm ơn những tấm lòng vàng đã sẻ chia! 🏆",
  "Bảo hiểm y tế cho mọi nhà - Khỏe mạnh an vui! 🩺",
  "Trao cơ hội việc làm - Kiến tạo tương lai! 💼",
  "Không ai bị bỏ lại phía sau tại Phú Lợi! ☀️"
];

const HEART_COLORS = [
  "text-blue-900",
  "text-rose-500",
  "text-pink-500",
  "text-sky-500",
  "text-orange-500",
  "text-emerald-500"
];

const EMOJIS = ["❤️", "💖", "💝", "🌸", "✨", "🙏", "🌻"];

export default function KindnessHearts({ news = [] }: KindnessHeartsProps) {
  const [loveCount, setLoveCount] = useState(12480);
  const [particles, setParticles] = useState<HeartParticle[]>([]);
  const [activeQuote, setActiveQuote] = useState("");
  const [showQuoteTip, setShowQuoteTip] = useState(false);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedShareItem, setSelectedShareItem] = useState<{
    id: string;
    title: string;
    body: string;
    category: string;
    imageUrl: string;
    url: string;
  } | null>(null);
  const [customMessage, setCustomMessage] = useState("Tôi vừa đồng hành cùng Cổng An sinh xã hội số phường Phú Lợi! Hãy cùng chung tay lan tỏa yêu thương.");
  const [copied, setCopied] = useState(false);

  // Load counter from localStorage if available
  useEffect(() => {
    const saved = localStorage.getItem("phuloi_social_love_count");
    if (saved) {
      setLoveCount(parseInt(saved, 10));
    } else {
      const seed = Math.floor(Math.random() * 1000) + 12480;
      setLoveCount(seed);
      localStorage.setItem("phuloi_social_love_count", seed.toString());
    }
  }, []);

  // Filter published news
  const publishedNews = news.filter(item => !item.status || item.status === "published");

  // Prepare sharing items
  const getSharingItems = () => {
    const portalItem = {
      id: "portal",
      title: "Cổng An Sinh Xã Hội Số Phường Phú Lợi, Thành phố Hồ Chí Minh",
      body: "Không gian kết nối nghĩa tình trực tuyến, hỗ trợ người dân đăng ký cứu trợ khẩn cấp, tra cứu chính sách an sinh, tìm kiếm việc làm và đóng góp từ thiện minh bạch.",
      category: "CỔNG AN SINH SỐ",
      imageUrl: "/social_share.svg",
      url: window.location.origin
    };

    const newsItems = publishedNews.slice(0, 3).map((item) => ({
      id: item.id,
      title: item.title,
      body: item.body.replace(/[#*`_]/g, "").substring(0, 160) + "...",
      category: item.category || "TIN TỨC CỘNG ĐỒNG",
      imageUrl: item.imageUrl || "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600",
      url: `${window.location.origin}${window.location.pathname}?newsId=${item.id}`
    }));

    return [portalItem, ...newsItems];
  };

  const sharingItems = getSharingItems();

  // Initialize selected share item once items are generated
  useEffect(() => {
    if (!selectedShareItem && sharingItems.length > 0) {
      setSelectedShareItem(sharingItems[0]);
    }
  }, [news]);

  const triggerLove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const newCount = loveCount + 1;
    setLoveCount(newCount);
    localStorage.setItem("phuloi_social_love_count", newCount.toString());

    // Generate random quote
    const randomQuote = SHARING_QUOTES[Math.floor(Math.random() * SHARING_QUOTES.length)];
    setActiveQuote(randomQuote);
    setShowQuoteTip(true);
    
    // Automatically prefill customized quote in the modal
    setCustomMessage(`Tôi vừa đồng hành cùng Cổng An sinh xã hội số phường Phú Lợi! "${randomQuote}"`);

    // Hide quote tip after 3 seconds
    const timer = setTimeout(() => {
      setShowQuoteTip(false);
    }, 3000);

    // Create 6-8 heart particles
    const newParticles: HeartParticle[] = Array.from({ length: 7 }).map((_, i) => {
      const isWithText = i === 2; // only one particle carries the text popup to avoid clutter
      return {
        id: Date.now() + i + Math.random(),
        x: (Math.random() - 0.5) * 100, // spread horizontally
        y: -20 - Math.random() * 20,
        size: Math.random() * 16 + 14, 
        color: HEART_COLORS[Math.floor(Math.random() * HEART_COLORS.length)],
        emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
        text: isWithText ? randomQuote : undefined,
        drift: (Math.random() - 0.5) * 80 
      };
    });

    setParticles((prev) => [...prev, ...newParticles]);

    // Open thank you sharing modal with a subtle premium delay
    setTimeout(() => {
      setIsModalOpen(true);
    }, 550);
  };

  const removeParticle = (id: number) => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  };

  const handleCopyLink = () => {
    if (!selectedShareItem) return;
    const shareText = `💝 [AN SINH XÃ HỘI SỐ PHÚ LỢI]\n\n${customMessage}\n\n📌 Tiêu đề: ${selectedShareItem.title}\n🔗 Xem chi tiết & chung tay tại: ${selectedShareItem.url}`;
    
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error("Could not copy text: ", err);
    });
  };

  const getFacebookShareUrl = () => {
    if (!selectedShareItem) return "#";
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(selectedShareItem.url)}&quote=${encodeURIComponent(customMessage)}`;
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end pointer-events-none select-none">
        
        {/* Particles layer */}
        <div className="relative w-full h-0 overflow-visible">
          <AnimatePresence>
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, scale: 0.2, x: p.x, y: p.y, rotate: 0 }}
                animate={{ 
                  opacity: [0, 1, 1, 0.7, 0], 
                  scale: [0.2, 1.2, 1, 0.9, 0.5],
                  x: [p.x, p.x + p.drift / 2, p.x + p.drift],
                  y: [p.y, p.y - 180, p.y - 320],
                  rotate: [0, (p.drift > 0 ? 20 : -20), (p.drift > 0 ? -15 : 15)]
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2.5, ease: "easeOut" }}
                onAnimationComplete={() => removeParticle(p.id)}
                className="absolute bottom-0 right-10 flex flex-col items-center shrink-0 pointer-events-none"
              >
                {/* Particle Emoji/Heart */}
                <span className={`text-2xl drop-shadow-md filter`}>
                  {p.emoji}
                </span>

                {/* Heart floating text box */}
                {p.text && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="bg-white/95 backdrop-blur-md border border-pink-200 text-pink-600 font-extrabold text-[10px] py-1.5 px-3 rounded-full shadow-xl whitespace-nowrap mt-1 max-w-[220px]"
                  >
                    {p.text}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Love/Encouragement Balloon Tip */}
        <AnimatePresence>
          {showQuoteTip && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="bg-gradient-to-r from-red-500 to-rose-600 text-white font-black text-[11px] sm:text-xs py-2 px-4 rounded-2xl shadow-xl border border-red-400 mb-3.5 mr-2 max-w-xs text-center flex items-center space-x-2 shrink-0 pointer-events-auto"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 shrink-0 animate-spin" />
              <span>{activeQuote}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sticky Floating Love Heart Button Trigger */}
        <motion.button
          onClick={triggerLove}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          className="pointer-events-auto flex items-center space-x-2 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-400 hover:to-rose-500 text-white font-extrabold px-4.5 py-3 rounded-full shadow-2xl shadow-red-500/30 border border-red-400/30 cursor-pointer select-none group relative overflow-hidden animate-bounce"
          id="btn-kindness-heart"
        >
          {/* Pulsing visual backdrop */}
          <span className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full animate-pulse" />

          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
            className="shrink-0"
          >
            <Heart className="w-5 h-5 text-white fill-current" />
          </motion.div>
          
          <div className="flex flex-col items-start leading-none">
            <span className="text-[10px] uppercase font-bold tracking-wider text-red-100">Gửi Yêu Thương</span>
            <span className="text-xs font-black tracking-tight font-mono">
              {(loveCount || 0).toLocaleString()} tim
            </span>
          </div>
        </motion.button>

      </div>

      {/* Thank You & Sharing Popup Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="bg-white rounded-3xl w-full max-w-2xl border border-pink-500/20 shadow-[0_25px_60px_-15px_rgba(219,39,119,0.12)] overflow-hidden flex flex-col relative"
            >
              {/* Artistic Top Header Design */}
              <div className="relative bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 p-6 sm:p-8 text-white select-none overflow-hidden shrink-0">
                <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
                <div className="absolute left-10 top-0 w-32 h-32 rounded-full bg-pink-400/20 blur-xl pointer-events-none" />
                
                {/* Close Button */}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex items-center space-x-3.5 mb-2">
                  <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md">
                    <HeartHandshake className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-rose-100 uppercase tracking-[0.2em]">CỔNG AN SINH PHÚ LỢI</span>
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">Cảm Ơn Nghĩa Cử Cao Đẹp!</h3>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-pink-50/90 max-w-md font-medium leading-relaxed">
                  Lời yêu thương và sự quan tâm chân thành của bạn đã được gửi đến hệ thống để cùng thắp sáng hy vọng cho bà con khó khăn. Hãy cùng chúng tôi lan tỏa điều tử tế này đến cộng đồng nhé!
                </p>
              </div>

              {/* Modal Body: Left and Right Columns */}
              <div className="p-6 sm:p-8 space-y-6 flex-1 overflow-y-auto max-h-[calc(80vh-160px)]">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                  
                  {/* Selector Column (Left) */}
                  <div className="md:col-span-7 space-y-5">
                    
                    {/* Step 1: Choose Share Content */}
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Bookmark className="w-3.5 h-3.5 text-primary-500" />
                        <span>Bước 1: Chọn bài viết muốn lan tỏa</span>
                      </label>
                      <div className="space-y-2">
                        {sharingItems.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => setSelectedShareItem(item)}
                            className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${
                              selectedShareItem?.id === item.id
                                ? "bg-primary-50/50 border-primary-200 text-primary-950 shadow-sm"
                                : "bg-slate-50 hover:bg-slate-100/70 border-slate-200/60 text-slate-700"
                            }`}
                          >
                            <div className="flex-1 min-w-0 pr-3">
                              <span className={`text-[8px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block mb-1 ${
                                selectedShareItem?.id === item.id
                                  ? "bg-primary-100 text-primary-700"
                                  : "bg-slate-200/70 text-slate-500"
                              }`}>
                                {item.category}
                              </span>
                              <h4 className="text-xs font-bold leading-snug truncate group-hover:text-primary-600 transition-colors">
                                {item.title}
                              </h4>
                            </div>
                            <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${
                              selectedShareItem?.id === item.id ? "text-primary-500 translate-x-0.5" : "text-slate-400"
                            }`} />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Step 2: Choose Message */}
                    <div className="space-y-2.5">
                      <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                        <span>Bước 2: Chọn thông điệp gửi kèm</span>
                      </label>
                      <div className="grid grid-cols-1 gap-2">
                        {SHARING_QUOTES.slice(0, 4).map((quote, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCustomMessage(`Tôi vừa đồng hành cùng Cổng An sinh xã hội số phường Phú Lợi! "${quote}"`)}
                            className={`text-left p-2.5 text-xs rounded-xl border transition-all leading-relaxed cursor-pointer ${
                              customMessage.includes(quote)
                                ? "bg-pink-50/50 border-pink-200 text-pink-950"
                                : "bg-white hover:bg-slate-50 border-slate-200 text-slate-600"
                            }`}
                          >
                            {quote}
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>

                  {/* Visual Preview Card (Right) */}
                  <div className="md:col-span-5 space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Xem trước thẻ liên kết
                    </label>

                    {selectedShareItem && (
                      <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-3.5 shadow-sm space-y-3">
                        {/* Mock Image */}
                        <div className="w-full h-28 rounded-xl overflow-hidden relative">
                          <img 
                            src={selectedShareItem.imageUrl} 
                            alt={selectedShareItem.title}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                          <span className="absolute top-2 left-2 bg-slate-900/70 text-white font-black text-[8px] uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-sm">
                            {selectedShareItem.category}
                          </span>
                        </div>

                        {/* Title and Snippet */}
                        <div className="space-y-1">
                          <h4 className="text-xs font-extrabold text-slate-800 line-clamp-2 leading-snug">
                            {selectedShareItem.title}
                          </h4>
                          <p className="text-[10px] text-slate-500 line-clamp-3 leading-relaxed">
                            {selectedShareItem.body}
                          </p>
                        </div>

                        {/* Link Stamp */}
                        <div className="flex items-center space-x-1.5 pt-2 border-t border-slate-200/60 text-[9px] text-slate-400 font-mono">
                          <Globe className="w-3 h-3 text-primary-500" />
                          <span className="truncate">{selectedShareItem.url}</span>
                        </div>
                      </div>
                    )}

                    {/* Formatted Text Preview Area for easy viewing/copying */}
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Nội dung sẽ được sao chép:
                      </label>
                      <textarea
                        readOnly
                        value={`💝 [AN SINH XÃ HỘI SỐ PHÚ LỢI]\n\n${customMessage}\n\n📌 Tiêu đề: ${selectedShareItem?.title || ""}\n🔗 Xem chi tiết & chung tay tại: ${selectedShareItem?.url || ""}`}
                        className="w-full h-24 bg-slate-50 text-slate-700 p-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:outline-none resize-none leading-relaxed select-all"
                        title="Bạn có thể bôi đen và sao chép thủ công phần này nếu muốn!"
                      />
                    </div>

                    {/* Sandbox Notice */}
                    <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3 text-[11px] text-amber-900 space-y-1.5 leading-relaxed shadow-sm">
                      <div className="flex items-center gap-1.5 font-bold text-amber-950">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Lưu ý quan trọng khi đăng Facebook:</span>
                      </div>
                      <p>
                        Do website đang chạy trong môi trường phát triển thử nghiệm (Sandbox/AI Studio) bảo mật, Facebook <strong>không thể kết nối trực tiếp</strong> tới liên kết này để tự quét ảnh minh họa tự động.
                      </p>
                      <p className="font-semibold text-primary-800 bg-white/70 p-1.5 rounded border border-amber-100">
                        👉 <strong>Cách làm:</strong> Bạn hãy bấm nút <strong>"Sao chép Link & Lời nhắn"</strong> bên dưới. Khi trang đăng bài Facebook mở ra, bạn chỉ cần <strong>chuột phải chọn Dán (hoặc nhấn Ctrl+V / Cmd+V)</strong> là có ngay toàn bộ nội dung cực kỳ đẹp mắt!
                      </p>
                    </div>

                  </div>

                </div>

                {/* Step 3: Interactive Share Actions */}
                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                  
                  {/* Copy Button */}
                  <button
                    onClick={handleCopyLink}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md flex items-center justify-center space-x-2.5 cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="text-emerald-400">Đã sao chép link!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Sao chép Link & Lời nhắn</span>
                      </>
                    )}
                  </button>

                  {/* Facebook Button */}
                  <a
                    href={getFacebookShareUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-2xl transition-all shadow-md flex items-center justify-center space-x-2.5 text-center"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Đăng lên Facebook</span>
                  </a>

                </div>

                {/* Additional high-tech certificate seal of appreciation */}
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl p-4 flex items-start space-x-3.5">
                  <div className="bg-amber-100 p-2 rounded-xl text-amber-600 shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-amber-950">Đại Sứ An Sinh Phường Phú Lợi</h5>
                    <p className="text-[10px] text-amber-800 leading-relaxed mt-0.5 font-medium">
                      Bằng việc lan tỏa thông điệp này đến cộng đồng, bạn đã chính thức ghi danh trở thành Đại sứ truyền thông an sinh số, góp phần đem nụ cười và hỗ trợ y tế, việc làm kịp thời tới bà con.
                    </p>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-between items-center text-[10px] text-slate-400 font-mono shrink-0">
                <span>© 2026 UBMTTQVN Phường Phú Lợi, Thành phố Hồ Chí Minh</span>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="font-bold text-primary-600 hover:text-primary-700 uppercase tracking-wider cursor-pointer"
                >
                  Hoàn tất
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
