import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Calendar, Share2, Bookmark, ExternalLink, Globe, Eye, BookOpen } from "lucide-react";
import { NewsArticle, UserProfile } from "../types";

interface NewsDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: NewsArticle | null;
  currentUser?: UserProfile | null;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  onShareClick: () => void;
}

export default function NewsDetailModal({
  isOpen,
  onClose,
  article,
  currentUser,
  isBookmarked,
  onToggleBookmark,
  onShareClick,
}: NewsDetailModalProps) {
  if (!article) return null;

  // Split content body into paragraphs for editorial layout
  const paragraphs = article.body.split(/\n+/).filter(p => p.trim().length > 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[105] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
          id="news-detail-modal-overlay"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.45 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col border border-slate-100"
            id="news-detail-modal-container"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
          >
            {/* Cover Image Block */}
            <div className="relative h-48 sm:h-64 w-full bg-slate-100 shrink-0 overflow-hidden" id="news-detail-cover-block">
              <img
                src={article.imageUrl || "https://lh3.googleusercontent.com/d/1MT0t2jwh0jomWuJmtMxyT59XTjDHJ2AP"}
                alt={article.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                id="news-detail-cover-img"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
              
              {/* Category Tag on Image */}
              <span 
                className="absolute top-4 left-4 bg-blue-600/90 backdrop-blur-sm text-white text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-full shadow-lg"
                id="news-detail-category-tag"
              >
                {article.category}
              </span>

              {/* Close Button overlay */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-slate-900/40 hover:bg-slate-900/70 backdrop-blur-sm text-white rounded-full transition-all duration-200 cursor-pointer"
                id="news-detail-close-btn"
                title="Đóng bản tin"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Meta Date & Views Overlay */}
              <div className="absolute bottom-4 left-4 right-4 text-white flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-3 text-xs font-medium text-slate-200">
                  <span className="flex items-center">
                    <Calendar className="w-3.5 h-3.5 mr-1 text-sky-400" />
                    {article.date}
                  </span>
                  {article.viewsCount !== undefined && (
                    <span className="flex items-center">
                      <Eye className="w-3.5 h-3.5 mr-1 text-sky-400" />
                      {article.viewsCount} lượt xem
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Body & Content Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6" id="news-detail-scroll-area">
              {/* News Title */}
              <div className="space-y-2">
                <h2 
                  className="text-xl sm:text-2xl font-black text-slate-900 leading-snug tracking-tight font-sans"
                  id="news-detail-title"
                >
                  {article.title}
                </h2>
                <div className="h-1 w-16 bg-blue-600 rounded-full" />
              </div>

              {/* News Paragraphs */}
              <div className="space-y-4 text-slate-700" id="news-detail-body-text">
                {paragraphs.length > 0 ? (
                  paragraphs.map((para, i) => (
                    <p 
                      key={i} 
                      className="text-slate-600 text-sm leading-relaxed font-normal whitespace-pre-wrap font-sans"
                    >
                      {para.trim()}
                    </p>
                  ))
                ) : (
                  <p className="text-slate-400 text-sm italic">Không có chi tiết nội dung văn bản cho tin tức này.</p>
                )}
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div 
              className="p-5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 shrink-0"
              id="news-detail-footer"
            >
              {/* Interaction buttons */}
              <div className="flex items-center space-x-3">
                {/* Toggle Bookmark */}
                <button
                  onClick={onToggleBookmark}
                  className={`flex items-center space-x-2 text-xs font-bold uppercase tracking-wider py-2 px-3.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                    isBookmarked
                      ? "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100"
                      : "bg-white text-slate-600 border-slate-200 hover:text-blue-900 hover:border-blue-200"
                  }`}
                  id="news-detail-bookmark-btn"
                  title={isBookmarked ? "Xóa khỏi mục yêu thích" : "Lưu vào mục yêu thích"}
                >
                  <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-amber-500 text-amber-500" : ""}`} />
                  <span>{isBookmarked ? "Đã yêu thích" : "Yêu thích"}</span>
                </button>

                {/* Share article */}
                <button
                  onClick={onShareClick}
                  className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider py-2 px-3.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl border border-blue-100 transition-all duration-300 cursor-pointer"
                  id="news-detail-share-btn"
                  title="Chia sẻ tin tức này rộng rãi"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Chia sẻ</span>
                </button>
              </div>

              {/* Source Original Post Link */}
              <a
                href={article.originalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-blue-700 transition-colors bg-white hover:bg-slate-100 py-2 px-4 rounded-xl shadow-sm border border-slate-200/80 cursor-pointer"
                id="news-detail-source-link"
              >
                <BookOpen className="w-4 h-4 text-blue-500" />
                <span>Xem bài gốc trên Facebook</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
