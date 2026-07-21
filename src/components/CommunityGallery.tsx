import React, { useState, useEffect } from "react";
import { 
  Upload, 
  Trash2, 
  Plus, 
  X, 
  Loader2, 
  Camera, 
  User, 
  Calendar,
  Maximize2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, GalleryImage } from "../types";
import { 
  fetchGalleryImagesFromFirestore, 
  saveGalleryImageToFirestore, 
  deleteGalleryImageFromFirestore,
  uploadImageToStorage
} from "../lib/firebaseSync";

interface CommunityGalleryProps {
  currentUser: UserProfile | null;
}

const CommunityGallery: React.FC<CommunityGalleryProps> = ({ currentUser }) => {
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewImage, setViewImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    setLoading(true);
    try {
      const data = await fetchGalleryImagesFromFirestore();
      setImages(data);
    } catch (error) {
      console.error("Lỗi tải thư viện:", error);
    } finally {
      setLoading(false);
    }
  };

  const isOwner = (img: GalleryImage) => {
    return currentUser && (currentUser.isAdmin || currentUser.uid === img.authorId);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ảnh này khỏi thư viện?")) return;
    try {
      await deleteGalleryImageFromFirestore(id);
      setImages(images.filter(img => img.id !== id));
    } catch (error) {
      console.error(error);
      alert("Lỗi khi xóa ảnh.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Thư viện Cộng đồng</h2>
          <p className="text-slate-500 mt-1">Nơi lưu giữ những khoảnh khắc đẹp tại Phường Phú Lợi.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-xs">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-slate-500 font-medium">Đang tải thư viện...</p>
        </div>
      ) : images.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
          <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Camera className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Chưa có hình ảnh nào</h3>
          <p className="text-slate-500 max-w-xs mx-auto mt-2">Các hoạt động cộng đồng sẽ được cập nhật tại đây bởi ban quản trị.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {images.map((image) => (
              <motion.div
                key={image.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-xs hover:shadow-xl transition-all duration-300 relative"
              >
                <div className="aspect-square relative overflow-hidden bg-slate-100 cursor-pointer" onClick={() => setViewImage(image)}>
                  <img
                    src={image.url}
                    alt={image.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Maximize2 className="text-white w-8 h-8" />
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 truncate">{image.title}</h3>
                  <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-500">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span>{image.authorName}</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(image.createdAt).toLocaleDateString("vi-VN")}</span>
                    </div>
                  </div>
                </div>

                {(currentUser?.isAdmin || currentUser?.uid === image.authorId) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(image.id);
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Image Viewer Modal */}
      {viewImage && (
        <div className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center p-4 lg:p-10" onClick={() => setViewImage(null)}>
          <button className="absolute top-5 right-5 text-white/70 hover:text-white transition">
            <X className="w-10 h-10" />
          </button>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-5xl w-full flex flex-col lg:flex-row bg-white rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lg:flex-1 bg-black flex items-center justify-center">
              <img src={viewImage.url} alt={viewImage.title} className="max-h-[80vh] object-contain" referrerPolicy="no-referrer" />
            </div>
            
            <div className="w-full lg:w-80 p-8 flex flex-col">
              <h2 className="text-2xl font-bold text-slate-900 leading-tight">{viewImage.title}</h2>
              <div className="flex items-center gap-3 mt-4 pb-6 border-b border-slate-100">
                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                  <User className="text-indigo-600 w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{viewImage.authorName}</p>
                  <p className="text-xs text-slate-500">{viewImage.quarter ? viewImage.quarter : "Phú Lợi"}</p>
                </div>
              </div>
              
              <div className="mt-6 flex-1 overflow-y-auto">
                <p className="text-slate-600 leading-relaxed italic">
                  {viewImage.description || "Không có mô tả cho bức ảnh này."}
                </p>
              </div>
              
              <div className="mt-8 flex items-center justify-between text-slate-400 text-xs">
                <div className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(viewImage.createdAt).toLocaleDateString("vi-VN", { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default CommunityGallery;
