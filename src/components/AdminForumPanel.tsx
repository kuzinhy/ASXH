import React, { useState, useEffect } from "react";
import { MessageSquare, RefreshCw, Trash2, CheckCircle2, User, Filter, MessageCircle, AlertCircle, HelpCircle } from "lucide-react";
import { ForumPost } from "../types";
import { fetchForumPostsFromFirestore, saveForumPostToFirestore, deleteForumPostFromFirestore } from "../lib/firebaseSync";


export default function AdminForumPanel() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("Tất cả");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const data = await fetchForumPostsFromFirestore();
    setPosts(data);
    setIsLoading(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: "Chờ xử lý" | "Đang giải quyết" | "Đã giải quyết") => {
    const post = posts.find(p => p.id === id);
    if (!post) return;
    
    const updated = { ...post, status: newStatus };
    try {
      await saveForumPostToFirestore(updated);
      setPosts(prev => prev.map(p => p.id === id ? updated : p));
      alert("Cập nhật trạng thái thành công!");
    } catch (err) {
      alert("Lỗi khi cập nhật trạng thái");
    }
  };

  const handleApprove = async (id: string, approve: boolean) => {
    const post = posts.find(p => p.id === id);
    if (!post) return;
    
    const updated = { ...post, isApproved: approve };
    try {
      await saveForumPostToFirestore(updated);
      setPosts(prev => prev.map(p => p.id === id ? updated : p));
      alert(approve ? "Đã duyệt bài viết thành công!" : "Đã hủy duyệt bài viết!");
    } catch (err) {
      alert("Lỗi khi cập nhật trạng thái duyệt");
    }
  };

  const handleReply = async (id: string, reply: string) => {
    const post = posts.find(p => p.id === id);
    if (!post) return;
    
    const updated = { 
      ...post, 
      officialReply: reply,
      resolvedBy: "UBND Phường Phú Lợi",
      resolvedAt: new Date().toISOString()
    };
    
    try {
      await saveForumPostToFirestore(updated);
      setPosts(prev => prev.map(p => p.id === id ? updated : p));
      alert("Đã gửi phản hồi thành công!");
    } catch (err) {
      alert("Lỗi khi gửi phản hồi");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) return;
    
    try {
      await deleteForumPostFromFirestore(id);
      setPosts(prev => prev.filter(p => p.id !== id));
      alert("Đã xóa bài viết thành công!");
    } catch (err) {
      alert("Lỗi khi xóa bài viết");
    }
  };

  const filteredPosts = posts.filter(p => {
    if (filterStatus === "Tất cả") return true;
    if (filterStatus === "Chờ duyệt") return p.isApproved === false;
    if (filterStatus === "Đã duyệt") return p.isApproved !== false;
    return p.status === filterStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Đã giải quyết": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Đang giải quyết": return "bg-amber-100 text-amber-700 border-amber-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Phản ánh": return <AlertCircle className="w-4 h-4 text-rose-500" />;
      case "Cần trợ giúp": return <HelpCircle className="w-4 h-4 text-amber-500" />;
      case "Góp ý": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      default: return <MessageSquare className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-indigo-500" />
            <span>Quản lý diễn đàn & Phản ánh</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">Quản lý bài viết, phản ánh, yêu cầu trợ giúp từ người dân.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select 
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="Tất cả">Tất cả trạng thái</option>
              <option value="Chờ xử lý">Chờ xử lý</option>
              <option value="Đang giải quyết">Đang giải quyết</option>
              <option value="Đã giải quyết">Đã giải quyết</option>
              <option value="Chờ duyệt">Chờ duyệt bài</option>
              <option value="Đã duyệt">Đã duyệt bài</option>
            </select>
          </div>
          <button 
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12 text-slate-400 text-sm">Đang tải dữ liệu...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-slate-500 text-sm">
            Chưa có bài viết nào
          </div>
        ) : (
          filteredPosts.map(post => (
            <div key={post.id} className="border border-slate-200 rounded-2xl p-4 flex flex-col gap-4 transition-all hover:shadow-md">
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    {getCategoryIcon(post.category)}
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{post.category}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusColor(post.status)}`}>
                      {post.status}
                    </span>
                    {post.isApproved === false ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold border bg-amber-50 text-amber-600 border-amber-200">
                        Chờ duyệt bài
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold border bg-emerald-50 text-emerald-600 border-emerald-200">
                        Đã duyệt bài
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-base text-slate-800 mb-1">{post.title}</h4>
                  <p className="text-sm text-slate-600 font-light mb-3">{post.content}</p>
                  
                  <div className="flex items-center gap-4 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span className="font-medium text-slate-700">{post.authorName}</span>
                      {post.quarter && <span>({post.quarter})</span>}
                    </span>
                    <span>{new Date(post.createdAt).toLocaleString('vi-VN')}</span>
                  </div>
                </div>

                <div className="flex flex-col items-center sm:items-end justify-between sm:justify-start gap-2.5 shrink-0 w-full sm:w-auto">
                  <select 
                    value={post.status}
                    onChange={(e) => handleUpdateStatus(post.id, e.target.value as any)}
                    className="w-full sm:w-auto px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none"
                  >
                    <option value="Chờ xử lý">Chờ xử lý</option>
                    <option value="Đang giải quyết">Đang giải quyết</option>
                    <option value="Đã giải quyết">Đã giải quyết</option>
                  </select>
                  
                  {post.isApproved === false ? (
                    <button 
                      onClick={() => handleApprove(post.id, true)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-extrabold transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Duyệt bài</span>
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleApprove(post.id, false)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-colors"
                    >
                      <span>Bỏ duyệt</span>
                    </button>
                  )}

                  <button 
                    onClick={() => handleDelete(post.id)}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 text-rose-500 hover:bg-rose-50 rounded-lg text-xs font-medium transition-colors border border-rose-100 sm:border-none"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa</span>
                  </button>
                </div>
              </div>

              {/* Reply Section */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                  <MessageCircle className="w-3.5 h-3.5 text-indigo-500" />
                  Phản hồi chính thức từ Phường
                </p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    id={`reply-${post.id}`}
                    placeholder="Nhập nội dung phản hồi..."
                    defaultValue={post.officialReply || ""}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <button 
                    onClick={() => {
                      const input = document.getElementById(`reply-${post.id}`) as HTMLInputElement;
                      if (input && input.value.trim()) {
                        handleReply(post.id, input.value.trim());
                      }
                    }}
                    className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shrink-0"
                  >
                    Gửi phản hồi
                  </button>
                </div>
              </div>

            </div>
          ))
        )}
      </div>
    </div>
  );
}
