import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Share2, Trash2, Globe, Loader2, Calendar, Link2, AlertCircle, CheckCircle,
  Flame, Heart, Award, Users, HeartHandshake, Flower, Landmark, X, Bookmark,
  Copy, Facebook, MessageSquare
} from "lucide-react";
import { NewsArticle, UserProfile } from "../types";
import { incrementUserShares } from "../lib/firebaseSync";
import ShareModal from "./ShareModal";
import NewsDetailModal from "./NewsDetailModal";

interface NewsArticleFeedProps {
  news: NewsArticle[];
  currentUser?: UserProfile | null;
  bookmarkedNewsIds?: string[];
  onToggleBookmarkNews?: (id: string) => void;
  showToast?: (title: string, message: string, type: "success" | "info" | "warning" | "error") => void;
}

export default function NewsArticleFeed({
  news,
  currentUser,
  bookmarkedNewsIds = [],
  onToggleBookmarkNews,
  showToast
}: NewsArticleFeedProps) {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [selectedShareNews, setSelectedShareNews] = useState<NewsArticle | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // States for full-text detailed news modal
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDetailNews, setSelectedDetailNews] = useState<NewsArticle | null>(null);

  // Handle opening the detailed news modal
  const handleArticleClick = (item: NewsArticle) => {
    setSelectedDetailNews(item);
    setIsDetailOpen(true);
    recordNewsRead();
  };

  const trackShare = () => {
    if (currentUser?.uid) {
      incrementUserShares(currentUser.uid);
    }
    recordNewsRead();
  };

  // Handle opening the customized Share modal
  const handleShareClick = (item: NewsArticle) => {
    setSelectedShareNews(item);
    setIsShareOpen(true);
    trackShare();
  };

  const handleQuickCopy = async (id: string, url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      showToast?.("Đã sao chép!", "Liên kết bài viết đã được lưu vào bộ nhớ tạm.", "success");
      trackShare();
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleQuickShare = (platform: 'fb' | 'zalo', item: NewsArticle) => {
    const url = `${window.location.origin}${window.location.pathname}?newsId=${item.id}`;
    if (platform === 'fb') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank", "width=600,height=400");
    } else {
      window.open(`https://sp.zalo.me/share_to_zalo?url=${encodeURIComponent(url)}`, "_blank", "width=600,height=500");
    }
    trackShare();
  };

  const recordNewsRead = () => {
    if (!currentUser) return;
    const key = `phuloi_newsreads_${currentUser.uid}`;
    const current = parseInt(localStorage.getItem(key) || "0", 10);
    localStorage.setItem(key, (current + 1).toString());
    // Trigger custom state updates in local components immediately
    window.dispatchEvent(new Event("storage"));
  };

  // Only display published news articles
  const publishedNews = news.filter(item => !item.status || item.status === "published");

  return (
    <div id="facebook-news-feed" className="bg-white rounded-3xl border border-primary-100 shadow-[0_20px_50px_rgba(37,99,235,0.04)] h-full flex flex-col relative overflow-hidden">
      {/* Dynamic Background Accents */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary-50/50 rounded-full blur-3xl -z-10" />

      <div className="p-6 sm:p-8 flex-1 flex flex-col overflow-hidden">
        {/* Section Title */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between border-b border-primary-50 pb-4 shrink-0 gap-4">
          <div className="flex flex-col items-start">
            <span className="text-[10px] font-black text-primary-600 tracking-[0.2em] uppercase flex items-center space-x-2 font-sans mb-2">
              <Globe className="w-4 h-4 text-primary-500 animate-spin-slow" />
              <span>Kênh Tin Tức & Truyền Thông</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-sans tracking-tight">
              Bản Tin <span className="text-primary-600">Facebook</span>
            </h2>
          </div>
          <a 
            href="https://web.facebook.com/TuoitrephuongPhuLoi" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#1877F2] hover:bg-[#166fe5] text-white text-[10px] font-bold px-4 py-2 rounded-full shadow-md transition-all shrink-0"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Theo dõi trên Facebook</span>
          </a>
        </div>



        {/* News Feed List */}
        {publishedNews.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-3xl flex-1 flex flex-col items-center justify-center">
            <Globe className="w-10 h-10 text-slate-300 mx-auto animate-bounce" />
            <p className="text-slate-500 text-xs mt-3 font-light">Chưa có bài viết tin tức nào được đăng tải từ Facebook.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden relative group min-h-[300px]">
            <div 
              className="flex flex-col gap-4 relative sm:absolute top-0 w-full pr-2 sm:animate-marquee-vertical group-hover:[animation-play-state:paused] overflow-y-auto sm:overflow-y-visible h-full sm:h-auto pb-4 sm:pb-0"
              style={{ animationDuration: `${Math.max(publishedNews.length * 5, 20)}s` }}
            >
              {[...publishedNews, ...publishedNews].map((item, idx) => (
                <article
                  key={`${item.id}-${idx}`}
                  id={`news-card-${item.id}`}
                  onClick={() => handleArticleClick(item)}
                  className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden flex hover:bg-white hover:shadow-lg hover:scale-[1.015] transition-all duration-300 shrink-0 cursor-pointer transform"
                  title="Bấm để xem chi tiết đầy đủ của bản tin này"
                >
                  {/* News Media Thumbnail */}
                  <div className="relative w-32 sm:w-36 shrink-0 bg-slate-200 overflow-hidden">
                    <img
                      src={item.imageUrl || "https://lh3.googleusercontent.com/d/1MT0t2jwh0jomWuJmtMxyT59XTjDHJ2AP"}
                      alt={item.title}
                      className="w-full h-full object-cover transition-all duration-700"
                      referrerPolicy="no-referrer"
                    />
                    {/* Category Overlay Tag */}
                    <span className="absolute top-2 left-2 bg-blue-600/90 backdrop-blur-sm text-white text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full shadow-sm">
                      {item.category}
                    </span>
                  </div>

                  {/* News Content Body */}
                  <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      {/* Date Block */}
                      <div className="flex items-center text-[10px] text-slate-400 font-medium mb-1.5">
                        <Calendar className="w-3.5 h-3.5 mr-1" />
                        <span>{item.date}</span>
                      </div>

                      <h3 className="text-base sm:text-sm font-bold text-blue-900 leading-snug tracking-tight hover:text-blue-900 transition-colors line-clamp-2">
                        {item.title}
                      </h3>

                      <p className="text-slate-500 text-xs sm:text-[11px] font-medium mt-1.5 leading-relaxed line-clamp-2 sm:line-clamp-3">
                        {item.body}
                      </p>
                    </div>

                    {/* News Footer Interactions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mt-4 pt-3 border-t border-slate-100/60 gap-3">
                      <div className="flex items-center space-x-3">
                        {/* Quick Share Label (Desktop) */}
                        <span className="hidden sm:inline text-[8px] font-black text-slate-300 uppercase tracking-widest">Chia sẻ nhanh:</span>
                        
                        <div className="flex items-center gap-1.5">
                          {/* Copy Link Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickCopy(item.id, `${window.location.origin}${window.location.pathname}?newsId=${item.id}`);
                            }}
                            className={`p-1.5 rounded-lg transition-all duration-200 border ${
                              copiedId === item.id 
                                ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                                : "bg-white border-slate-100 text-slate-400 hover:text-emerald-600 hover:border-emerald-100 hover:bg-emerald-50/30"
                            }`}
                            title="Sao chép liên kết"
                          >
                            {copiedId === item.id ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>

                          {/* Facebook Quick Share */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickShare('fb', item);
                            }}
                            className="p-1.5 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-[#1877F2] hover:border-blue-100 hover:bg-blue-50/30 transition-all duration-200"
                            title="Chia sẻ lên Facebook"
                          >
                            <Facebook className="w-3.5 h-3.5" />
                          </button>

                          {/* Zalo Quick Share */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleQuickShare('zalo', item);
                            }}
                            className="p-1.5 bg-white border border-slate-100 rounded-lg text-slate-400 hover:text-[#0068ff] hover:border-sky-100 hover:bg-sky-50/30 transition-all duration-200"
                            title="Chia sẻ qua Zalo"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* Full Share Modal Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleShareClick(item);
                            }}
                            className="ml-1 p-1.5 bg-slate-50 text-slate-400 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-colors"
                            title="Thêm tùy chọn chia sẻ khác"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4">
                        {/* Bookmark / Yêu thích button */}
                        {onToggleBookmarkNews && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onToggleBookmarkNews(item.id);
                            }}
                            className={`flex items-center space-x-1.5 text-[10px] sm:text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                              bookmarkedNewsIds.includes(item.id)
                                ? "text-amber-500 hover:text-amber-600"
                                : "text-slate-400 hover:text-blue-900"
                            }`}
                            title={bookmarkedNewsIds.includes(item.id) ? "Xóa khỏi mục yêu thích" : "Lưu vào mục yêu thích"}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${bookmarkedNewsIds.includes(item.id) ? "fill-amber-500 text-amber-500" : ""}`} />
                            <span className="sm:inline">{bookmarkedNewsIds.includes(item.id) ? "Đã lưu" : "Yêu thích"}</span>
                          </button>
                        )}

                        {/* Primary Link block */}
                        <a
                          href={item.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.stopPropagation();
                            recordNewsRead();
                          }}
                          className="text-[10px] sm:text-[9px] font-bold text-slate-400 hover:text-blue-900 flex items-center space-x-1 transition-colors bg-white px-2.5 py-1.5 rounded-lg shadow-sm border border-slate-100 shrink-0"
                        >
                          <span>Xem bài gốc</span>
                          <span className="text-[10px]">↗</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Share Modal rendering */}
      {selectedShareNews && (
        <ShareModal
          isOpen={isShareOpen}
          onClose={() => {
            setIsShareOpen(false);
            setSelectedShareNews(null);
          }}
          title="Chia sẻ Bản tin Facebook"
          shareTitle={selectedShareNews.title}
          shareText={selectedShareNews.body}
          shareUrl={`${window.location.origin}${window.location.pathname}?newsId=${selectedShareNews.id}`}
          showToast={showToast}
        />
      )}

      {/* News Article Detail Modal */}
      {selectedDetailNews && (
        <NewsDetailModal
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setSelectedDetailNews(null);
          }}
          article={selectedDetailNews}
          currentUser={currentUser}
          isBookmarked={bookmarkedNewsIds.includes(selectedDetailNews.id)}
          onToggleBookmark={() => onToggleBookmarkNews?.(selectedDetailNews.id)}
          onShareClick={() => {
            handleShareClick(selectedDetailNews);
          }}
        />
      )}
    </div>
  );
}
