import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, AlertCircle, HelpCircle, CheckCircle2, User, Search, Filter, Plus, Send, X, ThumbsUp, Shield, ImagePlus, Loader2 } from "lucide-react";
import { ForumPost, UserProfile } from "../types";
import { fetchForumPostsFromFirestore, saveForumPostToFirestore, uploadImageToStorage } from "../lib/firebaseSync";
import { auth } from "../lib/firebase";
import { googleSignIn, getAccessToken } from "../lib/googleAuth";

interface CommunityForumProps {
  currentUser: UserProfile | null;
  onRequireAuth: () => void;
}

export default function CommunityForum({ currentUser, onRequireAuth }: CommunityForumProps) {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"Tất cả" | "Phản ánh" | "Cần trợ giúp" | "Thảo luận" | "Góp ý">("Tất cả");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState<"Phản ánh" | "Cần trợ giúp" | "Thảo luận" | "Góp ý">("Phản ánh");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setIsLoading(true);
    const data = await fetchForumPostsFromFirestore();
    setPosts(data);
    setIsLoading(false);
  };

  const filteredPosts = posts.filter(post => {
    // 1. Authorization & Approval filter:
    // If post is not approved yet (isApproved === false):
    // Only show if the current user is an Admin/Officer OR if the current user is the author of this post.
    const isApproved = post.isApproved !== false;
    const isAuthor = currentUser && post.authorId === currentUser.uid;
    const hasAdminPrivilege = currentUser?.isAdmin || currentUser?.isOfficer;
    
    if (!isApproved && !isAuthor && !hasAdminPrivilege) {
      return false;
    }

    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "Tất cả" || post.category === activeTab;
    return matchesSearch && matchesTab;
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingImage(true);
    try {
      const downloadUrl = await uploadImageToStorage(file, "forum");
      setImageUrl(downloadUrl);
      setImageFile(file);
    } catch (error) {
      console.error("Upload error", error);
      alert("Không thể tải lên hình ảnh lên Storage.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (!newPostTitle.trim() || !newPostContent.trim()) return;

    setSubmitting(true);
    const isAutoApproved = currentUser.isAdmin || currentUser.isOfficer;
    const newPost: ForumPost = {
      id: "post-" + Date.now(),
      title: newPostTitle,
      content: newPostContent,
      imageUrl: imageUrl,
      authorName: currentUser.fullName,
      authorId: currentUser.uid,
      category: newPostCategory,
      status: "Chờ xử lý",
      isApproved: isAutoApproved ? true : false,
      createdAt: new Date().toISOString(),
      quarter: currentUser.quarter,
      likesCount: 0,
      commentsCount: 0,
      likedBy: []
    };

    try {
      await saveForumPostToFirestore(newPost);
      setPosts(prev => [newPost, ...prev]);
      setIsComposeOpen(false);
      setNewPostTitle("");
      setNewPostContent("");
      setNewPostCategory("Phản ánh");
      setImageFile(null);
      setImageUrl("");
      if (!isAutoApproved) {
        alert("Bài viết đã được gửi! Phản ánh & Trợ giúp của bạn đang chờ Quản trị viên duyệt để hiển thị công khai.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!currentUser) {
      onRequireAuth();
      return;
    }

    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    const post = posts[postIndex];
    const likedBy = post.likedBy || [];
    const hasLiked = likedBy.includes(currentUser.uid);

    let newLikedBy = [...likedBy];
    if (hasLiked) {
      newLikedBy = newLikedBy.filter(id => id !== currentUser.uid);
    } else {
      newLikedBy.push(currentUser.uid);
    }

    const updatedPost = {
      ...post,
      likedBy: newLikedBy,
      likesCount: newLikedBy.length
    };

    // Optimistic update
    setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));

    try {
      await saveForumPostToFirestore(updatedPost);
    } catch (err) {
      console.error("Failed to like post", err);
      // Revert if failed
      setPosts(prev => prev.map(p => p.id === postId ? post : p));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Đã giải quyết":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700">Đã giải quyết</span>;
      case "Đang giải quyết":
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700">Đang giải quyết</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">Chờ xử lý</span>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Phản ánh": return <AlertCircle className="w-3.5 h-3.5 text-rose-500" />;
      case "Cần trợ giúp": return <HelpCircle className="w-3.5 h-3.5 text-amber-500" />;
      case "Góp ý": return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
      default: return <MessageSquare className="w-3.5 h-3.5 text-blue-500" />;
    }
  };

  return (
    <div id="community-forum" className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-full flex flex-col relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -z-10" />
      
      <div className="p-6 sm:p-8 flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-4">
          <div>
            <span className="text-[10px] font-bold text-indigo-950 tracking-widest uppercase flex items-center space-x-1.5 font-sans mb-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-950" />
              <span>Diễn Đàn Mini</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-normal text-indigo-950 font-sans">
              Phản Ánh & <span className="text-indigo-950 italic font-medium">Trợ Giúp</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">Nơi người dân trao đổi, phản ánh và hỗ trợ lẫn nhau.</p>
          </div>
          <button 
            onClick={() => {
              if (!currentUser) onRequireAuth();
              else setIsComposeOpen(true);
            }}
            className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Đăng bài mới</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm bài viết..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="flex space-x-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
            {["Tất cả", "Phản ánh", "Cần trợ giúp", "Thảo luận", "Góp ý"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === tab 
                    ? "bg-indigo-100 text-indigo-700" 
                    : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Feed */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm font-medium">Chưa có bài viết nào</p>
              <p className="text-slate-400 text-xs mt-1">Hãy là người đầu tiên đăng bài trong mục này.</p>
            </div>
          ) : (
            filteredPosts.map(post => (
              <div key={post.id} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-bold text-slate-800">{post.authorName}</span>
                        {post.quarter && <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{post.quarter}</span>}
                      </div>
                      <span className="text-[10px] text-slate-400 flex items-center mt-0.5">
                        {new Date(post.createdAt).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {post.isApproved === false && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-600 border border-amber-200">
                        Chờ Duyệt
                      </span>
                    )}
                    {post.category === "Phản ánh" || post.category === "Cần trợ giúp" || post.category === "Góp ý" ? getStatusBadge(post.status) : null}
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="flex items-center space-x-1.5 mb-1">
                    {getCategoryIcon(post.category)}
                    <h3 className="text-base font-bold text-slate-800">{post.title}</h3>
                  </div>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap font-light">{post.content}</p>
                  {post.imageUrl && (
                    <div className="mt-3 rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                      <img src={post.imageUrl} alt="Đính kèm" className="w-full h-auto max-h-80 object-contain" />
                    </div>
                  )}
                </div>

                {/* Official Reply */}
                {post.officialReply && (
                  <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                    <div className="flex items-center space-x-1.5 mb-1.5">
                      <Shield className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="text-xs font-bold text-indigo-800">Phản hồi từ UB Phường ({post.resolvedBy || "Cán bộ"})</span>
                    </div>
                    <p className="text-xs text-indigo-900 font-medium">{post.officialReply}</p>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-4">
                  <button 
                    onClick={() => handleLike(post.id)}
                    className={`flex items-center space-x-1.5 text-xs font-medium transition-colors ${
                      post.likedBy?.includes(currentUser?.uid || "") 
                        ? "text-indigo-600" 
                        : "text-slate-500 hover:text-indigo-600"
                    }`}
                  >
                    <ThumbsUp className={`w-4 h-4 ${post.likedBy?.includes(currentUser?.uid || "") ? "fill-indigo-600" : ""}`} />
                    <span>{post.likesCount || 0} Hữu ích</span>
                  </button>
                  {/* Additional interaction buttons could go here */}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {isComposeOpen && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden max-h-full">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="text-base font-bold text-slate-800">Đăng bài mới</h3>
              <button onClick={() => setIsComposeOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 flex-col flex overflow-y-auto custom-scrollbar">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Loại bài viết</label>
                  <select 
                    value={newPostCategory} 
                    onChange={(e) => setNewPostCategory(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="Phản ánh">Phản ánh (Môi trường, An ninh, ...)</option>
                    <option value="Cần trợ giúp">Cần trợ giúp (Nhu yếu phẩm, Sự cố...)</option>
                    <option value="Góp ý">Góp ý (Xây dựng cộng đồng)</option>
                    <option value="Thảo luận">Thảo luận chung</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tiêu đề</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Tóm tắt nội dung..."
                    value={newPostTitle}
                    onChange={(e) => setNewPostTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nội dung chi tiết</label>
                  <textarea 
                    required
                    placeholder="Mô tả chi tiết nội dung cần đăng..."
                    rows={4}
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none"
                  ></textarea>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Đính kèm hình ảnh</label>
                  {imageFile ? (
                    <div className="relative inline-block">
                      <img src={URL.createObjectURL(imageFile)} alt="Preview" className="h-24 w-auto rounded-lg border border-slate-200 object-cover" />
                      <button type="button" onClick={() => {setImageFile(null); setImageUrl("");}} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                      <button 
                        type="button" 
                        onClick={async () => {
                          const token = await getAccessToken();
                          if (!token) {
                            try {
                              await googleSignIn();
                              alert("Đã kết nối Google Drive! Vui lòng nhấn lại nút Tải lên.");
                            } catch (err) {
                              alert("Không thể kết nối: " + (err.message || err));
                            }
                          } else {
                            fileInputRef.current?.click();
                          }
                        }} 
                        disabled={isUploadingImage}
                        className="flex items-center justify-center gap-2 w-full border-2 border-dashed border-slate-200 rounded-xl py-4 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors text-slate-500 hover:text-indigo-600 disabled:opacity-50"
                      >
                        {isUploadingImage ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
                        <span className="text-sm font-medium">{isUploadingImage ? "Đang tải lên..." : "Tải lên hình ảnh (Google Drive)"}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsComposeOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800"
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit" 
                  disabled={submitting || !newPostTitle.trim() || !newPostContent.trim()}
                  className="flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                >
                  {submitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>Đăng bài</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
