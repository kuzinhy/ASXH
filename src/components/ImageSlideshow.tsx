import React, { useState, useEffect } from "react";
import { 
  Image as ImageIcon, 
  Plus, 
  HelpCircle, 
  ExternalLink, 
  Info, 
  Check, 
  Trash2, 
  Play, 
  Pause, 
  Sparkles,
  Link as LinkIcon,
  Clipboard,
  AlertCircle,
  X,
  Edit2,
  Save,
  CheckCircle,
  Settings,
  UserCheck,
  Calendar,
  Share2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { UserProfile, SlideshowImage } from "../types";
import { 
  fetchSlideshowImagesFromFirestore, 
  saveSlideshowImageToFirestore, 
  deleteSlideshowImageFromFirestore,
  uploadImageToStorage
} from "../lib/firebaseSync";
import { convertToDirectDriveLink } from "../lib/imageUtils";
import { Loader2 } from "lucide-react";

interface ImageSlideshowProps {
  currentUser: UserProfile | null;
}

// Pre-configured community photos from the Google Drive folder
const DEFAULT_IMAGES: SlideshowImage[] = [
  {
    id: "img-drive-1",
    title: "Kết nối An sinh Phường Phú Lợi",
    caption: "Lực lượng chức năng phối hợp cùng ban ngành phát huy nghĩa tình, hỗ trợ chuyển giao thực phẩm thiết thực cho bà con có hoàn cảnh đặc biệt khó khăn.",
    url: "https://lh3.googleusercontent.com/d/1MT0t2jwh0jomWuJmtMxyT59XTjDHJ2AP",
    date: "10/07/2026",
    source: "default"
  },
  {
    id: "img-drive-2",
    title: "Phát quà cứu trợ tại khu phố",
    caption: "Trao tặng các túi quà nhu yếu phẩm thiết thực tận tay bà con hộ nghèo và các cụ già neo đơn tại các ngõ hẻm địa bàn.",
    url: "https://lh3.googleusercontent.com/d/1AxoJ1oRLZ3HPlxo555Ii9cAsXML-oS4S",
    date: "09/07/2026",
    source: "default"
  },
  {
    id: "img-drive-3",
    title: "Bữa cơm ấm áp nghĩa tình Phú Lợi",
    caption: "Sự chuẩn bị chu đáo mang lại niềm vui, sẻ chia và động viên tinh thần lớn cho mọi tầng lớp nhân dân.",
    url: "https://lh3.googleusercontent.com/d/1mXuLTwNEPVwT-O5ebl8vSpRoxDHxq477",
    date: "08/07/2026",
    source: "default"
  },
  {
    id: "img-drive-4",
    title: "Chăm lo đời sống an sinh xã hội",
    caption: "Cung cấp gạo chất lượng cao, dầu ăn và gia vị an toàn cho các hộ cận nghèo, đảm bảo an tâm sinh hoạt thường nhật.",
    url: "https://lh3.googleusercontent.com/d/1_b0foONit1vCTvEuRMEnDZH361-h4Clk",
    date: "07/07/2026",
    source: "default"
  },
  {
    id: "img-drive-5",
    title: "Hỗ trợ thuốc men & y tế gia đình",
    caption: "Vận động tủ thuốc an sinh xã hội chăm sóc sức khỏe ban đầu cho nhân dân nghèo, giúp phòng bệnh kịp thời.",
    url: "https://lh3.googleusercontent.com/d/1Wh3ChZbD8Mlfa4nDzWuJMh80eLhk2HZh",
    date: "06/07/2026",
    source: "default"
  },
  {
    id: "img-drive-6",
    title: "Đoàn Thanh Niên vì cộng đồng",
    caption: "Thanh niên tình nguyện hăng hái hỗ trợ công tác phân loại, đóng gói an sinh chu đáo, nhanh chóng trước khi giao đi.",
    url: "https://lh3.googleusercontent.com/d/1F075dRHArHGW3LhYsFfsj5poYTZIxKpJ",
    date: "05/07/2026",
    source: "default"
  },
  {
    id: "img-drive-7",
    title: "Bàn giao nhà đại đoàn kết",
    caption: "Đóng góp sửa sang mái ấm nghĩa tình cho các hộ gia đình có hoàn cảnh đặc biệt khó khăn, ổn định chỗ ở lâu dài.",
    url: "https://lh3.googleusercontent.com/d/1yLc4vI0Iy32dXgY5HAWkW8kPuktCUmbN",
    date: "04/07/2026",
    source: "default"
  },
  {
    id: "img-drive-8",
    title: "Gian hàng 0 đồng phục vụ bà con",
    caption: "Cung ứng thực phẩm tươi sạch với tinh thần nhường cơm sẻ áo, gắn kết tình đoàn kết nhân dân trong phường.",
    url: "https://lh3.googleusercontent.com/d/1VdHot14lAHtlOODpodU5W1OAHIKuCwVE",
    date: "03/07/2026",
    source: "default"
  },
  {
    id: "img-drive-9",
    title: "Lắng nghe tâm tư nguyện vọng bà con",
    caption: "Cán bộ ban ngành trực tiếp thăm hỏi tình trạng sức khỏe, lắng nghe những chia sẻ thực tế trong đời sống để kịp thời tháo gỡ.",
    url: "https://lh3.googleusercontent.com/d/1bn4C9daPR-arjEG-AAjIvXPWS92UWuGs",
    date: "02/07/2026",
    source: "default"
  },
  {
    id: "img-drive-10",
    title: "Tiếp sức khuyến học cho học sinh",
    caption: "Tặng sách vở, thiết bị thông minh tiếp thêm nghị lực vượt lên số phận cho các em học sinh nghèo hiếu học.",
    url: "https://lh3.googleusercontent.com/d/1vW0Lr5pRuNLRdODUzlJ0_hm9bqoNK_BO",
    date: "01/07/2026",
    source: "default"
  },
  {
    id: "img-drive-11",
    title: "San sẻ yêu thương khẩn cấp",
    caption: "Kịp thời có mặt, hỗ trợ chi phí thuốc men khẩn cấp đối với các hoàn cảnh gặp tai nạn lao động hoặc bệnh hiểm nghèo đột xuất.",
    url: "https://lh3.googleusercontent.com/d/1mqAZF-k6xZpJWe4IufGLIY-NYAzuVBQK",
    date: "30/06/2026",
    source: "default"
  },
  {
    id: "img-drive-12",
    title: "Chung tay kiến tạo cộng đồng",
    caption: "Mọi đóng góp, hỗ trợ đều được cập nhật công tâm, chính xác, minh bạch hóa dữ liệu giúp công tác điều phối đạt hiệu quả tối ưu.",
    url: "https://lh3.googleusercontent.com/d/1Np2NxdLaH4wLDIMOULqrwGf4ia4K_doz",
    date: "29/06/2026",
    source: "default"
  },
  {
    id: "img-drive-13",
    title: "Phú Lợi chuyển mình cùng công nghệ số",
    caption: "Ứng dụng Cổng An sinh Số giúp xóa nhòa khoảng cách cứu trợ, hỗ trợ người yếu thế nhanh nhất có thể.",
    url: "https://lh3.googleusercontent.com/d/1Mmo3nJ2wsTS0bU1v5hkA8qzEa58iElwy",
    date: "28/06/2026",
    source: "default"
  }
];

export default function ImageSlideshow({ currentUser }: ImageSlideshowProps) {
  const [images, setImages] = useState<SlideshowImage[]>([]);
  
  // Modals and Interaction states
  const [selectedImage, setSelectedImage] = useState<SlideshowImage | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  
  // Admin simulation and control states
  const [isAdminDemoMode, setIsAdminDemoMode] = useState(false);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditingInModal, setIsEditingInModal] = useState(false);

  // Form input states
  const [inputUrl, setInputUrl] = useState("");
  const [inputTitle, setInputTitle] = useState("");
  const [inputCaption, setInputCaption] = useState("");
  const [inputDate, setInputDate] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Modal editing states
  const [editTitle, setEditTitle] = useState("");
  const [editCaption, setEditCaption] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editDate, setEditDate] = useState("");

  const [shareCopied, setShareCopied] = useState(false);

  // Check if active user is actual administrator OR if demo mode is enabled
  const hasAdminPrivilege = currentUser?.isAdmin || currentUser?.email?.toLowerCase() === "nguyenhuy.thudaumot@gmail.com" || isAdminDemoMode;

  // Initialize and load slideshow images
  useEffect(() => {
    // 1. Try local cache first for instant load
    const cached = localStorage.getItem("phuloi_slideshow_list");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setImages(parsed);
        }
      } catch (e) {
        console.error("Lỗi parse dữ liệu ảnh từ cache:", e);
      }
    }

    // 2. Fetch live data from Firestore
    fetchSlideshowImagesFromFirestore(DEFAULT_IMAGES)
      .then((liveImages) => {
        if (liveImages && liveImages.length > 0) {
          setImages(liveImages);
          localStorage.setItem("phuloi_slideshow_list", JSON.stringify(liveImages));
        }
      })
      .catch((err) => {
        console.error("Không thể tải ảnh slideshow từ Firestore:", err);
      });
  }, []);

  // Utility to clean and extract Google Drive IDs for instant display
  const extractDriveId = (url: string): string | null => {
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9_-]+)/,
      /\/folders\/([a-zA-Z0-9_-]+)/,
      /id=([a-zA-Z0-9_-]+)/,
      /\/open\?id=([a-zA-Z0-9_-]+)/,
      /([a-zA-Z0-9_-]{28,40})/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const getDirectDriveUrl = (id: string): string => {
    return `https://lh3.googleusercontent.com/d/${id}`;
  };

  // Add new image operation (Admin / User with privilege)
  const handleAddImage = (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    if (!inputUrl.trim()) {
      setStatusMessage({ text: "Vui lòng dán link ảnh hoặc link Google Drive.", isError: true });
      return;
    }

    let finalUrl = inputUrl.trim();
    const driveId = extractDriveId(finalUrl);

    if (driveId) {
      finalUrl = getDirectDriveUrl(driveId);
    } else if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      setStatusMessage({ text: "Đường liên kết không đúng định dạng. Cần dùng link HTTP/HTTPS hoặc Google Drive.", isError: true });
      return;
    }

    const newImage: SlideshowImage = {
      id: "img-" + Date.now(),
      title: inputTitle.trim() || "Hoạt động an sinh mới",
      caption: inputCaption.trim() || "Hình ảnh chia sẻ chân thực từ chiến dịch đồng hành tại phường Phú Lợi.",
      url: finalUrl,
      date: inputDate.trim() || new Date().toLocaleDateString("vi-VN"),
      source: "user"
    };

    const updated = [newImage, ...images];
    setImages(updated);
    localStorage.setItem("phuloi_slideshow_list", JSON.stringify(updated));

    // Async save to Firestore
    saveSlideshowImageToFirestore(newImage)
      .then(() => {
        console.log("Đã lưu ảnh mới lên Firestore");
      })
      .catch((err) => {
        console.error("Lỗi đồng bộ Firestore khi thêm ảnh:", err);
      });

    // Reset fields
    setInputUrl("");
    setInputTitle("");
    setInputCaption("");
    setInputDate("");
    setIsAddFormOpen(false);

    // Toast/Alert
    setStatusMessage({ text: "🎉 Đã thêm ảnh vào slideshow thành công!", isError: false });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Trigger modal and set edit fields
  const handleOpenDetailModal = (img: SlideshowImage) => {
    setSelectedImage(img);
    setEditTitle(img.title);
    setEditCaption(img.caption);
    setEditUrl(img.url);
    setEditDate(img.date);
    setIsEditingInModal(false);
  };

  // Edit existing image operation (Save changes)
  const handleSaveChanges = () => {
    if (!selectedImage) return;

    let finalUrl = editUrl.trim();
    const driveId = extractDriveId(finalUrl);
    if (driveId) {
      finalUrl = getDirectDriveUrl(driveId);
    }

    const targetImage: SlideshowImage = {
      ...selectedImage,
      title: editTitle.trim() || selectedImage.title,
      caption: editCaption.trim() || selectedImage.caption,
      url: finalUrl || selectedImage.url,
      date: editDate.trim() || selectedImage.date
    };

    const updatedList = images.map(img => img.id === selectedImage.id ? targetImage : img);

    setImages(updatedList);
    localStorage.setItem("phuloi_slideshow_list", JSON.stringify(updatedList));
    
    // Update active modal selected image
    setSelectedImage(targetImage);

    setIsEditingInModal(false);

    // Async save to Firestore
    saveSlideshowImageToFirestore(targetImage)
      .then(() => {
        console.log("Đã cập nhật thông tin ảnh trên Firestore");
      })
      .catch((err) => {
        console.error("Lỗi đồng bộ Firestore khi cập nhật ảnh:", err);
      });

    setStatusMessage({ text: "✏️ Đã cập nhật thông tin ảnh thành công!", isError: false });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Delete image operation
  const handleDeleteImage = (id: string) => {
    const updatedList = images.filter(img => img.id !== id);
    setImages(updatedList);
    localStorage.setItem("phuloi_slideshow_list", JSON.stringify(updatedList));
    
    if (selectedImage?.id === id) {
      setSelectedImage(null);
    }

    // Async delete from Firestore
    deleteSlideshowImageFromFirestore(id)
      .then(() => {
        console.log("Đã xóa ảnh trên Firestore");
      })
      .catch((err) => {
        console.error("Lỗi đồng bộ Firestore khi xóa ảnh:", err);
      });

    setStatusMessage({ text: "🗑️ Đã xóa ảnh khỏi thư viện hoạt động.", isError: false });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  // Helper double list for seamless loop scrolling
  const doubledImages = [...images, ...images];

  return (
    <div id="community-album" className="bg-white rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] lg:h-[560px] h-[500px] flex flex-col relative overflow-hidden">
      <div className="p-6 sm:p-8 flex-1 flex flex-col w-full relative overflow-hidden">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-100 pb-4 mb-6 shrink-0">
          <div className="space-y-2 text-left">
            <div className="inline-flex items-center space-x-2 bg-blue-500/10 text-blue-600 border border-indigo-500/20 px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
              <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
              <span>Góc Nhìn Thực Tế Phú Lợi</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-normal tracking-tight text-blue-900 font-sans leading-tight">
              Thư Viện Ảnh <span className="text-blue-600 font-semibold italic">An Sinh</span>
            </h2>
            <p className="text-slate-500 text-[11px] sm:text-xs max-w-xl font-light">
              <span className="font-semibold text-blue-600">Mẹo:</span> Nhấp vào bất kỳ ảnh nào để xem chi tiết.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Play/Pause switch */}
            <button 
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-500 shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-slate-500" />
                  <span>Dừng</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                  <span>Cuộn</span>
                </>
              )}
            </button>

            {/* Simulated Demo Admin Switch */}
            <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1 rounded-xl border border-slate-200">
              <Settings className={`w-3 h-3 ${hasAdminPrivilege ? 'text-blue-600 animate-spin-slow' : 'text-slate-400'}`} />
              <button
                onClick={() => setIsAdminDemoMode(!isAdminDemoMode)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  hasAdminPrivilege ? "bg-blue-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    hasAdminPrivilege ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Admin Add button */}
            {hasAdminPrivilege && (
              <button 
                onClick={() => setIsAddFormOpen(!isAddFormOpen)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold shadow-sm flex items-center gap-1 cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm</span>
              </button>
            )}
          </div>
        </div>

        {/* Global/Inline status message */}
        {statusMessage && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 max-w-2xl mx-auto shadow-xs border ${statusMessage.isError ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
            {statusMessage.isError ? <AlertCircle className="w-4 h-4 text-rose-500" /> : <CheckCircle className="w-4 h-4 text-emerald-500" />}
            <span className="font-medium">{statusMessage.text}</span>
          </div>
        )}

        {/* Admin Form block (Interactive add) */}
        <AnimatePresence>
          {isAddFormOpen && hasAdminPrivilege && (
            <motion.div 
              initial={{ opacity: 0, y: -10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              className="overflow-hidden bg-blue-50/50 rounded-2xl p-4 border border-blue-100 max-w-3xl mx-auto text-left"
            >
              <h3 className="text-xs font-black uppercase tracking-wider text-blue-800 mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                Khu vực Quản trị: Thêm ảnh hoạt động mới
              </h3>

              <form onSubmit={handleAddImage} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-500">Đường dẫn Google Drive / Link Ảnh *</label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={inputUrl}
                      onChange={(e) => setInputUrl(convertToDirectDriveLink(e.target.value))}
                      placeholder="https://drive.google.com/file/d/1YWAF01bo... hoặc link ảnh"
                      className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                      required
                    />
                    <label className="bg-sky-50 hover:bg-sky-100 text-sky-700 text-[10px] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center shrink-0 border border-sky-100 shadow-3xs">
                      {isUploadingImage ? <Loader2 className="w-3 h-3 animate-spin" /> : <span>Tải lên</span>}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden"
                        disabled={isUploadingImage}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setIsUploadingImage(true);
                            try {
                              const downloadUrl = await uploadImageToStorage(file, "slideshow");
                              setInputUrl(downloadUrl);
                            } catch (error) {
                              console.error(error);
                              alert("Lỗi tải ảnh lên Storage");
                            } finally {
                              setIsUploadingImage(false);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>
                  <span className="text-[8px] text-slate-400 block font-light">Tự động nhận diện & tối ưu hóa liên kết ảnh Google Drive cực nhanh!</span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-500">Tiêu đề ảnh *</label>
                  <input 
                    type="text" 
                    value={inputTitle}
                    onChange={(e) => setInputTitle(e.target.value)}
                    placeholder="Ví dụ: Chuyển gạo đến Khu phố 3..."
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-500">Mô tả ngắn, chi tiết hoạt động *</label>
                  <textarea 
                    value={inputCaption}
                    onChange={(e) => setInputCaption(e.target.value)}
                    placeholder="Ví dụ: Vận động mạnh thường quân hỗ trợ 500kg gạo sạch thơm dẻo chia nhỏ..."
                    rows={2}
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none resize-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[9px] font-extrabold uppercase tracking-wider text-slate-500">Ngày ghi hình (Tùy chọn)</label>
                  <input 
                    type="text" 
                    value={inputDate}
                    onChange={(e) => setInputDate(e.target.value)}
                    placeholder="Ví dụ: 10/07/2026 hoặc Hôm nay"
                    className="w-full text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-end justify-end gap-2 md:col-span-1">
                  <button 
                    type="button"
                    onClick={() => setIsAddFormOpen(false)}
                    className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Lưu Ảnh Vào Slide
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Sliding Album Track (Scrolling from Left to Right - Slower Rate) */}
        <div className="relative overflow-hidden rounded-2xl p-1.5 select-none bg-blue-600/5 border border-slate-200/40 flex-1 flex items-center">
          {/* Soft fading overlays on edge sides */}
          <div className="absolute top-0 bottom-0 left-0 w-12 sm:w-20 bg-gradient-to-r from-[#faf5ff] to-transparent z-10 pointer-events-none" />
          <div className="absolute top-0 bottom-0 right-0 w-12 sm:w-20 bg-gradient-to-l from-[#faf5ff] to-transparent z-10 pointer-events-none" />

          <div 
            className={`flex gap-4 ${
              isPlaying 
                ? "animate-marquee-horizontal-ltr hover:[animation-play-state:paused]" 
                : ""
            } transition-all duration-300`}
            style={{ width: "max-content" }}
          >
            {doubledImages.map((img, index) => (
              <div 
                key={`${img.id}-${index}`} 
                onClick={() => handleOpenDetailModal(img)}
                className="w-56 sm:w-60 lg:w-[260px] shrink-0 bg-white border border-slate-200/50 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-blue-200 active:scale-[0.98] transition-all duration-300 flex flex-col group relative cursor-pointer"
              >
                {/* Image Wrap */}
                <div className="h-32 sm:h-36 lg:h-44 overflow-hidden relative bg-slate-100">
                  <img 
                    src={img.url} 
                    alt={img.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    onError={(e) => {
                      // fallback representation if link fails
                      e.currentTarget.src = "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=80&w=800";
                    }}
                  />
                  <div className="absolute top-2 left-2 bg-blue-600/60 backdrop-blur-md px-2 py-0.5 rounded-lg text-[8px] font-mono font-medium text-white/90">
                    {img.date}
                  </div>

                  {hasAdminPrivilege && (
                    <div className="absolute top-2 right-2 flex gap-1 z-10" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => handleOpenDetailModal(img)}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg text-xs hover:scale-110 active:scale-95 transition-all cursor-pointer shadow"
                        title="Chỉnh sửa hoặc xóa hình này"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Content Box */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5 bg-white text-left">
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-[11px] sm:text-xs text-blue-900 line-clamp-1 group-hover:text-blue-600 transition-colors font-sans">
                      {img.title}
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-relaxed font-light line-clamp-2">
                      {img.caption}
                    </p>
                  </div>

                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[9px]">
                    <span className="text-slate-400 font-medium">Nguồn: {img.source === "default" ? "MTTQ" : "Đóng góp"}</span>
                    <span className="text-blue-600 font-bold tracking-wider uppercase text-[7px] bg-blue-50 px-1 py-0.5 rounded">CHI TIẾT</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Info Modal (Dialog) with Admin Editing capability */}
        <AnimatePresence>
          {selectedImage && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blue-600/60 backdrop-blur-xs">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-2xl w-full border border-slate-100 flex flex-col relative text-left"
              >
                
                {/* Header of Modal */}
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-extrabold text-slate-500 font-sans uppercase tracking-widest">Chi Tiết Hoạt Động An Sinh</span>
                  </div>
                  <button 
                    onClick={() => setSelectedImage(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-500 hover:bg-slate-100 rounded-full cursor-pointer transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col md:flex-row max-h-[80vh] overflow-y-auto">
                  {/* Image Part */}
                  <div className="w-full md:w-1/2 bg-blue-50/40 flex items-center justify-center min-h-[220px] relative">
                    <img 
                      src={selectedImage.url} 
                      alt={selectedImage.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover max-h-[350px]"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=80&w=800";
                      }}
                    />
                    
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                      <div className="bg-blue-600/70 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] font-semibold text-white flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{selectedImage.date}</span>
                      </div>
                      
                      <button 
                        onClick={() => handleCopyLink(selectedImage.url)}
                        className="p-2 bg-blue-600/70 backdrop-blur-md hover:bg-blue-600 text-white rounded-xl text-xs flex items-center gap-1 cursor-pointer transition-all"
                        title="Sao chép link hình ảnh"
                      >
                        {shareCopied ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Clipboard className="w-3.5 h-3.5" />
                        )}
                        <span className="text-[10px]">{shareCopied ? "Đã chép" : "Sao chép link"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Info / Editing Area */}
                  <div className="w-full md:w-1/2 p-6 flex flex-col justify-between space-y-4">
                    {!isEditingInModal ? (
                      /* Display details to normal users */
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <span className="inline-block text-[8px] uppercase tracking-wider font-extrabold px-2 py-0.5 bg-blue-50 text-blue-700 rounded">
                            Nguồn: {selectedImage.source === "default" ? "Ủy ban Mặt Trận Tổ Quốc" : "Công dân cư trú đóng góp"}
                          </span>
                          <h3 className="text-base font-bold text-blue-900 font-sans tracking-tight leading-snug">
                            {selectedImage.title}
                          </h3>
                        </div>

                        <p className="text-xs text-slate-500 leading-relaxed font-light whitespace-pre-line">
                          {selectedImage.caption}
                        </p>

                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2 text-[10px] text-slate-500">
                          <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                          <p className="leading-normal">
                            Ảnh được tải và hiển thị trực tiếp từ hạ tầng đám mây Google Drive công khai, đảm bảo lưu trữ chính thống, chất lượng nguyên bản và không làm chậm tải trang.
                          </p>
                        </div>
                      </div>
                    ) : (
                      /* Editing area for administrators */
                      <div className="space-y-3">
                        <div className="p-2 bg-blue-50 border border-blue-100 rounded-xl text-[10px] text-blue-800 font-bold flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5" />
                          Chế độ Quản trị: Chỉnh sửa thông tin hình ảnh
                        </div>

                        <div className="space-y-2 text-xs">
                          <div className="space-y-1">
                            <label className="block text-[9px] font-extrabold uppercase text-slate-500">Tiêu đề ảnh</label>
                            <input 
                              type="text" 
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md focus:border-indigo-500 focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[9px] font-extrabold uppercase text-slate-500">Chi tiết mô tả</label>
                            <textarea 
                              value={editCaption}
                              onChange={(e) => setEditCaption(e.target.value)}
                              rows={3}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md focus:border-indigo-500 focus:outline-none resize-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[9px] font-extrabold uppercase text-slate-500">Liên kết hình ảnh (hoặc link Google Drive)</label>
                            <input 
                              type="text" 
                              value={editUrl}
                              onChange={(e) => setEditUrl(e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md focus:border-indigo-500 focus:outline-none text-[10px] font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="block text-[9px] font-extrabold uppercase text-slate-500">Ngày lưu trữ</label>
                            <input 
                              type="text" 
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded-md focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Footer buttons on right side of modal */}
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                      {hasAdminPrivilege ? (
                        <>
                          {!isEditingInModal ? (
                            <div className="flex gap-1.5 w-full justify-between">
                              <button 
                                onClick={() => handleDeleteImage(selectedImage.id)}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                                title="Xóa hình này"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Gỡ bỏ ảnh</span>
                              </button>

                              <button 
                                onClick={() => setIsEditingInModal(true)}
                                className="px-3.5 py-1.5 bg-blue-50 hover:bg-indigo-100 text-blue-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Sửa thông tin</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-1.5 w-full justify-end">
                              <button 
                                onClick={() => setIsEditingInModal(false)}
                                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-semibold cursor-pointer"
                              >
                                Quay lại
                              </button>
                              <button 
                                onClick={handleSaveChanges}
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Lưu thay đổi</span>
                              </button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex w-full justify-end">
                          <button 
                            onClick={() => setSelectedImage(null)}
                            className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow"
                          >
                            Đóng cửa sổ
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
