import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Share2, Trash2, Globe, Loader2, Calendar, Link2, AlertCircle, CheckCircle,
  Flame, Heart, Award, Users, HeartHandshake, Flower, Landmark, X, Bookmark
} from "lucide-react";
import { NewsArticle, UserProfile } from "../types";
import { incrementUserShares } from "../lib/firebaseSync";
import ShareModal from "./ShareModal";

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

  // Handle opening the customized Share modal
  const handleShareClick = (item: NewsArticle) => {
    setSelectedShareNews(item);
    setIsShareOpen(true);
    recordNewsRead();
    if (currentUser?.uid) {
      incrementUserShares(currentUser.uid);
    }
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
        <div className="mb-6 flex flex-col items-start border-b border-primary-50 pb-4 shrink-0">
          <span className="text-[10px] font-black text-primary-600 tracking-[0.2em] uppercase flex items-center space-x-2 font-sans mb-2">
            <Globe className="w-4 h-4 text-primary-500 animate-spin-slow" />
            <span>Kênh Tin Tức & Truyền Thông</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-sans tracking-tight">
            Bản Tin <span className="text-primary-600">Facebook</span>
          </h2>
        </div>



        {/* News Feed List */}
        {publishedNews.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-3xl flex-1 flex flex-col items-center justify-center">
            <Globe className="w-10 h-10 text-slate-300 mx-auto animate-bounce" />
            <p className="text-slate-500 text-xs mt-3 font-light">Chưa có bài viết tin tức nào được đăng tải từ Facebook.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden relative group">
            <div 
              className="flex flex-col gap-4 absolute w-full pr-2 animate-marquee-vertical group-hover:[animation-play-state:paused]"
              style={{ animationDuration: `${Math.max(publishedNews.length * 5, 20)}s` }}
            >
              {[...publishedNews, ...publishedNews].map((item, idx) => (
                <article
                  key={`${item.id}-${idx}`}
                  id={`news-card-${item.id}`}
                  className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden flex hover:bg-white hover:shadow-md transition-all duration-300 shrink-0"
                >
                  {/* News Media Thumbnail */}
                  <div className="relative w-28 sm:w-36 shrink-0 bg-slate-200 overflow-hidden">
                    <img
                      src={item.imageUrl || "https://lh3.googleusercontent.com/d/1MT0t2jwh0jomWuJmtMxyT59XTjDHJ2AP"}
                      alt={item.title}
                      className="w-full h-full object-cover transition-all duration-700"
                      referrerPolicy="no-referrer"
                    />
                    {/* Category Overlay Tag */}
                    <span className="absolute top-2 left-2 bg-blue-600/90 backdrop-blur-sm text-white text-[8px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full shadow-sm">
                      {item.category}
                    </span>
                  </div>

                  {/* News Content Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      {/* Date Block */}
                      <div className="flex items-center text-[9px] text-slate-400 font-medium mb-1.5">
                        <Calendar className="w-3 h-3 mr-1" />
                        <span>{item.date}</span>
                      </div>

                      <h3 className="text-sm font-bold text-blue-900 leading-snug tracking-tight hover:text-blue-900 transition-colors line-clamp-2">
                        {item.title}
                      </h3>

                      <p className="text-slate-500 text-[11px] font-light mt-1.5 leading-relaxed line-clamp-2">
                        {item.body}
                      </p>
                    </div>

                    {/* News Footer Interactions */}
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100/60">
                      <div className="flex items-center space-x-4">
                        {/* Share button */}
                        <button
                          onClick={() => handleShareClick(item)}
                          className="flex items-center space-x-1.5 text-[9px] font-bold text-blue-900 hover:text-blue-700 uppercase tracking-wider transition-colors cursor-pointer"
                          title="Bấm chia sẻ bài viết này qua Facebook, Zalo, hoặc sao chép liên kết"
                        >
                          <Share2 className="w-3 h-3" />
                          <span>Chia sẻ</span>
                        </button>

                        {/* Bookmark / Yêu thích button */}
                        {onToggleBookmarkNews && (
                          <button
                            onClick={() => onToggleBookmarkNews(item.id)}
                            className={`flex items-center space-x-1 text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                              bookmarkedNewsIds.includes(item.id)
                                ? "text-amber-500 hover:text-amber-600"
                                : "text-slate-400 hover:text-blue-900"
                            }`}
                            title={bookmarkedNewsIds.includes(item.id) ? "Xóa khỏi mục yêu thích" : "Lưu vào mục yêu thích"}
                          >
                            <Bookmark className={`w-3 h-3 ${bookmarkedNewsIds.includes(item.id) ? "fill-amber-500 text-amber-500" : ""}`} />
                            <span>{bookmarkedNewsIds.includes(item.id) ? "Đã lưu" : "Yêu thích"}</span>
                          </button>
                        )}
                      </div>

                      {/* Primary Link block */}
                      <a
                        href={item.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={recordNewsRead}
                        className="text-[9px] font-medium text-slate-400 hover:text-blue-900 flex items-center space-x-1 transition-colors bg-white px-2 py-1 rounded-md shadow-sm border border-slate-100"
                      >
                        <span>Xem bài gốc</span>
                        <span className="text-[8px]">↗</span>
                      </a>
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
    </div>
  );
}
