import React, { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie, 
  Legend 
} from "recharts";
import { 
  Vote, 
  Plus, 
  Trash2, 
  BarChart3, 
  PieChart as PieIcon, 
  CheckCircle2, 
  Users, 
  Clock, 
  ShieldAlert, 
  Sparkles,
  HelpCircle,
  FileText,
  Lock,
  ChevronDown,
  Trash,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Survey, SurveyOption, UserProfile } from "../types";
import { 
  fetchSurveysFromFirestore, 
  saveSurveyToFirestore, 
  deleteSurveyFromFirestore, 
  submitVoteToFirestore 
} from "../lib/firebaseSync";

interface CitizenSurveyProps {
  currentUser: UserProfile | null;
  onOpenAuthModal: () => void;
  showToast: (title: string, message: string, type: "success" | "info" | "warning" | "error") => void;
  resultsOnly?: boolean;
}

export const SEED_SURVEYS: Survey[] = [
  {
    id: "SURVEY-01",
    title: "Phân loại rác thải sinh hoạt tại nguồn",
    description: "Khảo sát mức độ sẵn sàng phân loại rác thải tại nguồn (vô cơ, hữu cơ, tái chế) của bà con nhằm thực hiện đề án bảo vệ môi trường chung phường Phú Lợi.",
    category: "vệ sinh môi trường",
    createdAt: "2026-07-10T08:00:00Z",
    createdBy: "Ủy ban MTTQ Phường",
    options: [
      { id: "opt-1", text: "Rất sẵn sàng và đã thực hiện tốt tại gia đình", votes: 245 },
      { id: "opt-2", text: "Sẵn sàng tham gia nhưng cần hướng dẫn/phát thùng phân loại", votes: 312 },
      { id: "opt-3", text: "Chưa sẵn sàng do thiếu diện tích bồn chứa hoặc thói quen", votes: 84 },
      { id: "opt-4", text: "Không đồng thuận do việc thu gom vẫn đổ chung một xe", votes: 120 }
    ],
    votedUserIds: ["test-user-1", "test-user-2"]
  },
  {
    id: "SURVEY-02",
    title: "Lắp đặt hệ thống camera an ninh tự quản",
    description: "Vận động bà con đóng góp kinh phí cùng ngân sách phường lắp đặt thêm camera hồng ngoại độ nét cao tại các tuyến hẻm nhánh tự quản Khu phố.",
    category: "an ninh trật tự",
    createdAt: "2026-07-08T10:30:00Z",
    createdBy: "Ủy ban MTTQ Phường",
    options: [
      { id: "opt-1", text: "Đồng ý 100% xã hội hóa kinh phí (nhân dân đóng góp)", votes: 189 },
      { id: "opt-2", text: "Đồng ý lắp đặt nhưng kinh phí do nhà nước chi trả", votes: 298 },
      { id: "opt-3", text: "Không đồng ý lắp đặt do lo ngại quyền riêng tư", votes: 45 },
      { id: "opt-4", text: "Ý kiến khác", votes: 23 }
    ],
    votedUserIds: ["test-user-3"]
  },
  {
    id: "SURVEY-03",
    title: "Gói hỗ trợ BHYT trả góp cho hộ cận nghèo",
    description: "Đánh giá mức độ quan tâm của bà con về chính sách hỗ trợ vay vốn không lãi suất trả góp để mua thẻ BHYT tự nguyện cả gia đình.",
    category: "chính sách mới",
    createdAt: "2026-07-05T14:15:00Z",
    createdBy: "Ủy ban MTTQ Phường",
    options: [
      { id: "opt-1", text: "Rất thiết thực, gia đình tôi muốn tham gia ngay", votes: 412 },
      { id: "opt-2", text: "Thiết thực nhưng cần kéo dài thời gian trả góp lên 6 tháng", votes: 154 },
      { id: "opt-3", text: "Chưa cần thiết, muốn được nhà nước tài trợ 100%", votes: 98 },
      { id: "opt-4", text: "Không có ý kiến", votes: 34 }
    ],
    votedUserIds: []
  }
];

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function CitizenSurvey({ currentUser, onOpenAuthModal, showToast, resultsOnly = false }: CitizenSurveyProps) {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("Tất cả");
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [chartType, setChartType] = useState<"bar" | "pie" | "percent">("percent");
  const [activeSurveyId, setActiveSurveyId] = useState<string | null>(null);

  // New Survey Form state
  const [newTitle, setNewTitle] = useState<string>("");
  const [newDesc, setNewDesc] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>("vệ sinh môi trường");
  const [newOptions, setNewOptions] = useState<string[]>(["", ""]);

  const categories = ["Tất cả", "vệ sinh môi trường", "an ninh trật tự", "chính sách mới", "khác"];

  // Fetch surveys from Firestore or LocalStorage
  const loadSurveys = async () => {
    setLoading(true);
    try {
      const cached = localStorage.getItem("phuloi_surveys");
      const initialSeed = cached ? JSON.parse(cached) : SEED_SURVEYS;
      
      const firestoreData = await fetchSurveysFromFirestore(initialSeed);
      setSurveys(firestoreData);
      localStorage.setItem("phuloi_surveys", JSON.stringify(firestoreData));
    } catch (e) {
      console.error("Error loading surveys:", e);
      setSurveys(SEED_SURVEYS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSurveys();
  }, []);

  // Save changes locally and to Firestore
  const updateSurveyInState = (updatedSurvey: Survey) => {
    const updated = surveys.map(s => s.id === updatedSurvey.id ? updatedSurvey : s);
    setSurveys(updated);
    localStorage.setItem("phuloi_surveys", JSON.stringify(updated));
  };

  // Vote implementation
  const handleVote = async (surveyId: string, optionId: string) => {
    if (!currentUser) {
      showToast(
        "Yêu cầu Đăng nhập",
        "Vui lòng đăng nhập bằng tài khoản Công dân số để tham gia bỏ phiếu khảo sát ý kiến.",
        "warning"
      );
      onOpenAuthModal();
      return;
    }

    const userId = currentUser.uid;
    const targetSurvey = surveys.find(s => s.id === surveyId);
    if (!targetSurvey) return;

    if (targetSurvey.votedUserIds?.includes(userId)) {
      showToast(
        "Không thể bình chọn",
        "Bà con đã bỏ phiếu cho khảo sát này rồi. Cảm ơn sự tham gia đóng góp của bà con!",
        "warning"
      );
      return;
    }

    try {
      // Optimistic Update
      const votedUserIds = [...(targetSurvey.votedUserIds || []), userId];
      const options = targetSurvey.options.map(opt => {
        if (opt.id === optionId) {
          return { ...opt, votes: opt.votes + 1 };
        }
        return opt;
      });

      const updatedSurvey = { ...targetSurvey, options, votedUserIds };
      updateSurveyInState(updatedSurvey);

      showToast(
        "Bình chọn thành công",
        `Ý kiến của bà con về "${targetSurvey.title}" đã được ghi nhận.`,
        "success"
      );

      // Auto-close active survey modal on success
      setActiveSurveyId(null);

      // Save to Firebase
      await submitVoteToFirestore(surveyId, optionId, userId);
    } catch (err) {
      console.error("Error voting:", err);
      showToast(
        "Lỗi bình chọn",
        "Không thể gửi bình chọn lên hệ thống đám mây. Vui lòng thử lại sau.",
        "error"
      );
      // Reload to rollback
      loadSurveys();
    }
  };

  // Add new options in the form
  const handleAddFormOption = () => {
    if (newOptions.length >= 6) {
      showToast("Giới hạn lựa chọn", "Một phiếu khảo sát chỉ nên có tối đa 6 lựa chọn.", "info");
      return;
    }
    setNewOptions([...newOptions, ""]);
  };

  // Remove option from form
  const handleRemoveFormOption = (index: number) => {
    if (newOptions.length <= 2) {
      showToast("Yêu cầu tối thiểu", "Phiếu khảo sát cần ít nhất 2 lựa chọn.", "info");
      return;
    }
    setNewOptions(newOptions.filter((_, i) => i !== index));
  };

  // Handle option text change
  const handleFormOptionChange = (index: number, val: string) => {
    const updated = [...newOptions];
    updated[index] = val;
    setNewOptions(updated);
  };

  // Save new survey
  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.isAdmin && !currentUser?.isOfficer) {
      showToast("Từ chối truy cập", "Chỉ cán bộ MTTQ mới có quyền tạo phiếu khảo sát.", "error");
      return;
    }

    if (!newTitle.trim() || !newDesc.trim()) {
      showToast("Thiếu thông tin", "Vui lòng nhập đầy đủ tiêu đề và nội dung mô tả khảo sát.", "warning");
      return;
    }

    const validOptions = newOptions.filter(opt => opt.trim() !== "");
    if (validOptions.length < 2) {
      showToast("Lỗi lựa chọn", "Vui lòng điền ít nhất 2 phương án bình chọn hợp lệ.", "warning");
      return;
    }

    const surveyId = "SURVEY-" + Date.now().toString().slice(-6);
    const options: SurveyOption[] = validOptions.map((opt, i) => ({
      id: `opt-${i + 1}`,
      text: opt.trim(),
      votes: 0
    }));

    const newSurvey: Survey = {
      id: surveyId,
      title: newTitle.trim(),
      description: newDesc.trim(),
      category: newCategory,
      options,
      createdAt: new Date().toISOString(),
      createdBy: currentUser.fullName || "Cán bộ MTTQ",
      votedUserIds: []
    };

    try {
      const updatedSurveys = [newSurvey, ...surveys];
      setSurveys(updatedSurveys);
      localStorage.setItem("phuloi_surveys", JSON.stringify(updatedSurveys));

      showToast(
        "Tạo khảo sát thành công",
        `Đã tạo và đăng tải khảo sát "${newSurvey.title}" đến toàn bộ bà con.`,
        "success"
      );

      setIsAdding(false);
      setNewTitle("");
      setNewDesc("");
      setNewOptions(["", ""]);

      // Save to Firebase
      await saveSurveyToFirestore(newSurvey);
    } catch (err) {
      console.error("Error creating survey:", err);
      showToast("Lỗi hệ thống", "Có lỗi xảy ra khi đồng bộ khảo sát lên đám mây.", "error");
      loadSurveys();
    }
  };

  // Delete survey
  const handleDeleteSurvey = async (id: string, title: string) => {
    if (!currentUser?.isAdmin && !currentUser?.isOfficer) return;

    if (!window.confirm(`Bà con có chắc chắn muốn xóa khảo sát "${title}"?`)) {
      return;
    }

    try {
      const updated = surveys.filter(s => s.id !== id);
      setSurveys(updated);
      localStorage.setItem("phuloi_surveys", JSON.stringify(updated));

      showToast("Đã xóa khảo sát", "Đã gỡ phiếu khảo sát khỏi hệ thống.", "success");

      await deleteSurveyFromFirestore(id);
    } catch (err) {
      console.error("Error deleting survey:", err);
      showToast("Lỗi xóa khảo sát", "Không thể xóa khảo sát trên máy chủ.", "error");
      loadSurveys();
    }
  };

  const filteredSurveys = selectedCategory === "Tất cả" 
    ? surveys 
    : surveys.filter(s => s.category.toLowerCase() === selectedCategory.toLowerCase());

  const getSurveyTotalVotes = (survey: Survey) => {
    return survey.options.reduce((sum, opt) => sum + opt.votes, 0);
  };

  if (resultsOnly) {
    return (
      <div id="survey-results-compact" className="bg-slate-900/60 backdrop-blur-md rounded-3xl border border-sky-500/10 p-5 sm:p-6 text-left relative overflow-hidden shadow-xl w-full">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/5 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-[60px] pointer-events-none" />

        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-800 pb-4 mb-4 relative z-10">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl">
              <Vote className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight uppercase font-sans">
                Kết Quả Ý Kiến & Trưng Cầu Dân Ý
              </h3>
              <p className="text-slate-400 text-[10px] sm:text-xs font-light">
                Số liệu tổng hợp ý kiến đóng góp xây dựng đô thị văn minh từ bà con nhân dân
              </p>
            </div>
          </div>
          <div className="text-[10px] bg-slate-950/80 border border-slate-800 text-slate-400 px-2.5 py-1 rounded-xl font-bold shrink-0 self-start sm:self-auto flex items-center space-x-1">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>{surveys.length} Khảo sát hoạt động</span>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400 flex flex-col items-center justify-center space-y-1">
            <Clock className="w-6 h-6 animate-spin text-sky-400" />
            <p className="text-[10px]">Đang cập nhật kết quả thời gian thực...</p>
          </div>
        ) : surveys.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-xs font-light">
            Chưa có phiếu trưng cầu ý kiến nào trực tuyến.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            {surveys.map(survey => {
              const totalVotes = getSurveyTotalVotes(survey);
              return (
                <div 
                  key={survey.id} 
                  className="bg-slate-950/30 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between space-y-3.5 hover:border-slate-750 transition-all duration-300"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide border ${
                        survey.category === "vệ sinh môi trường" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        survey.category === "an ninh trật tự" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                        survey.category === "chính sách mới" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        "bg-slate-500/10 text-slate-400 border-slate-500/20"
                      }`}>
                        {survey.category}
                      </span>
                      <span className="text-[9px] text-slate-500 font-light font-mono shrink-0">
                        Tổng: {totalVotes} phiếu
                      </span>
                    </div>
                    <h4 className="font-extrabold text-xs sm:text-sm text-slate-100 line-clamp-1 pr-2 tracking-tight" title={survey.title}>
                      {survey.title}
                    </h4>
                  </div>

                  <div className="space-y-2">
                    {survey.options.map((option, idx) => {
                      const percent = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                      const optionColor = COLORS[idx % COLORS.length];
                      return (
                        <div key={option.id} className="space-y-1">
                          <div className="flex justify-between text-[10px] text-slate-400">
                            <span className="truncate max-w-[85%] font-medium">{option.text}</span>
                            <span style={{ color: optionColor }} className="font-mono font-bold shrink-0">{percent}%</span>
                          </div>
                          <div className="w-full bg-slate-950 h-1 rounded-full overflow-hidden border border-slate-900/60">
                            <div 
                              style={{ width: `${percent}%`, backgroundColor: optionColor }} 
                              className="h-full rounded-full transition-all duration-700 ease-out"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div id="survey-section" className="bg-slate-900 rounded-3xl border border-sky-500/10 p-4 sm:p-8 relative overflow-hidden shadow-2xl">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 relative z-10 border-b border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center space-x-2 bg-sky-500/10 border border-sky-500/20 px-3.5 py-1 rounded-full text-xs font-semibold text-sky-400 mb-2">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Dân Biết - Dân Bàn - Dân Làm - Dân Kiểm Tra</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase flex items-center space-x-2.5">
            <Vote className="w-6 h-6 text-sky-400 shrink-0" />
            <span>Khảo Sát Ý Kiến Công Dân Số</span>
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl font-light leading-relaxed">
            Nơi Ủy ban MTTQ Việt Nam phường Phú Lợi trực tiếp trưng cầu dân ý, lắng nghe góp ý xây dựng đô thị văn minh, sạch đẹp, an toàn.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Chart selector */}
          <div className="bg-slate-950/60 p-1 rounded-xl border border-slate-800/80 flex items-center">
            <button
              onClick={() => setChartType("percent")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${chartType === "percent" ? "bg-sky-500 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Phần Trăm</span>
            </button>
            <button
              onClick={() => setChartType("bar")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${chartType === "bar" ? "bg-sky-500 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cột</span>
            </button>
            <button
              onClick={() => setChartType("pie")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer ${chartType === "pie" ? "bg-sky-500 text-white shadow-md" : "text-slate-400 hover:text-white"}`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tròn</span>
            </button>
          </div>

          {!resultsOnly && (currentUser?.isAdmin || currentUser?.isOfficer) && (
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs sm:text-sm flex items-center space-x-1.5 shadow-lg shadow-emerald-500/10 cursor-pointer transition-all"
            >
              {isAdding ? <ChevronDown className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{isAdding ? "Hủy Tạo" : "Tạo Khảo Sát"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap items-center gap-1.5 mb-6 relative z-10">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all capitalize cursor-pointer border ${selectedCategory === cat ? "bg-sky-500/20 text-sky-400 border-sky-500/30" : "bg-slate-950/40 text-slate-400 border-transparent hover:bg-slate-850"}`}
          >
            {cat === "Tất cả" ? "Tất Cả" : cat}
          </button>
        ))}
      </div>

      {/* Add Survey Form Panel */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden relative z-10 mb-8 border border-emerald-500/20 bg-emerald-500/5 rounded-2xl p-4 sm:p-6"
          >
            <h3 className="text-emerald-400 font-black uppercase text-sm tracking-wide flex items-center space-x-2 mb-4">
              <Sparkles className="w-4 h-4 animate-spin-slow text-emerald-400" />
              <span>Cổng Tạo Trưng Cầu Dân Ý / Phiếu Khảo SátÝ Kiến</span>
            </h3>

            <form onSubmit={handleCreateSurvey} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-slate-400 text-xs font-bold uppercase mb-1.5">Tiêu đề khảo sát:</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ví dụ: Khảo sát thu gom rác thải cồng kềnh..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 text-xs font-bold uppercase mb-1.5">Chủ đề:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 font-semibold cursor-pointer"
                  >
                    <option value="vệ sinh môi trường">Vệ sinh môi trường</option>
                    <option value="an ninh trật tự">An ninh trật tự</option>
                    <option value="chính sách mới">Chính sách an sinh mới</option>
                    <option value="khác">Ý kiến chủ đề khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 text-xs font-bold uppercase mb-1.5">Mô tả chi tiết bối cảnh:</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Mô tả bối cảnh, lý do khảo sát ý kiến và kỳ vọng nhận phản hồi..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-emerald-500 font-semibold"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-slate-400 text-xs font-bold uppercase mb-1">Các phương án bình chọn để bà con chọn:</label>
                {newOptions.map((opt, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-bold text-slate-400 flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => handleFormOptionChange(idx, e.target.value)}
                      placeholder={`Ví dụ: Lựa chọn số ${idx + 1}...`}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-semibold"
                    />
                    {newOptions.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveFormOption(idx)}
                        className="text-red-400 hover:text-red-500 p-2 rounded-lg cursor-pointer hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddFormOption}
                  className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 cursor-pointer pt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm một lựa chọn khác</span>
                </button>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdding(false);
                    setNewTitle("");
                    setNewDesc("");
                    setNewOptions(["", ""]);
                  }}
                  className="px-4 py-2 bg-slate-950 border border-slate-800 text-slate-400 font-bold rounded-xl text-xs uppercase cursor-pointer hover:bg-slate-900"
                >
                  Đóng Lại
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-md shadow-emerald-500/10"
                >
                  Xuất Bản Khảo Sát
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Surveys Feed */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
          <Clock className="w-8 h-8 animate-spin text-sky-400" />
          <p className="text-xs">Đang tải danh sách trưng cầu dân ý bảo mật...</p>
        </div>
      ) : filteredSurveys.length === 0 ? (
        <div className="py-12 border border-slate-800/80 rounded-2xl bg-slate-950/20 text-center text-slate-400 flex flex-col items-center justify-center p-6">
          <HelpCircle className="w-10 h-10 text-slate-600 mb-2" />
          <h4 className="font-bold text-sm text-slate-300">Không tìm thấy khảo sát</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm font-light">
            Hiện tại không có phiếu trưng cầu dân ý nào hoạt động thuộc chủ đề này tại phường Phú Lợi.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
          {filteredSurveys.map(survey => {
            const totalVotes = getSurveyTotalVotes(survey);
            const userVoted = currentUser ? survey.votedUserIds?.includes(currentUser.uid) : false;

            return (
              <motion.div
                key={survey.id}
                layout
                className={`border rounded-2xl p-5 sm:p-6 transition-all relative flex flex-col justify-between cursor-pointer group ${
                  userVoted 
                    ? "bg-sky-500/5 border-sky-500/20 shadow-md hover:border-sky-500/30" 
                    : "bg-slate-950/40 border-slate-800/80 hover:border-slate-700/80 hover:bg-slate-950/60"
                }`}
                onClick={() => setActiveSurveyId(survey.id)}
              >
                <div>
                  {/* Delete button for Admin / Officer */}
                  {!resultsOnly && (currentUser?.isAdmin || currentUser?.isOfficer) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSurvey(survey.id, survey.title);
                      }}
                      className="absolute top-4 right-4 text-slate-500 hover:text-rose-500 p-2 rounded-lg hover:bg-slate-900 cursor-pointer transition-colors z-20"
                      title="Xóa phiếu khảo sát này"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  )}

                  {/* Survey Meta */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${
                      survey.category === "vệ sinh môi trường" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      survey.category === "an ninh trật tự" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                      survey.category === "chính sách mới" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      "bg-slate-500/10 text-slate-400 border-slate-500/20"
                    }`}>
                      {survey.category}
                    </span>
                    <span className="text-[10px] text-slate-500 font-light flex items-center gap-1">
                      <Clock className="w-3 h-3 shrink-0" />
                      {new Date(survey.createdAt).toLocaleDateString("vi-VN")}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-extrabold text-white text-sm sm:text-base tracking-tight leading-snug line-clamp-1 pr-6 mb-2">
                    {survey.title}
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed font-light mb-4 line-clamp-2">
                    {survey.description}
                  </p>
                </div>

                {/* Footer with actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-900 mt-2">
                  <div className="flex items-center text-[11px] text-slate-400 space-x-1.5 font-medium">
                    <Users className="w-3.5 h-3.5 text-sky-400" />
                    <span>{totalVotes} lượt đóng góp</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveSurveyId(survey.id);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                      userVoted 
                        ? "bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-805 hover:text-white" 
                        : "bg-sky-500 hover:bg-sky-600 text-white shadow-md shadow-sky-500/15"
                    }`}
                  >
                    {userVoted ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Xem kết quả</span>
                      </>
                    ) : (
                      <>
                        <Vote className="w-3.5 h-3.5" />
                        <span>Bình chọn ngay</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Modal for detailed survey interaction */}
      <AnimatePresence>
        {activeSurveyId && (() => {
          const survey = surveys.find(s => s.id === activeSurveyId);
          if (!survey) return null;

          const totalVotes = getSurveyTotalVotes(survey);
          const userVoted = currentUser ? survey.votedUserIds?.includes(currentUser.uid) : false;

          // Prepare Recharts Data
          const rechartsData = survey.options.map((opt, i) => ({
            name: opt.text.length > 20 ? opt.text.slice(0, 20) + "..." : opt.text,
            fullName: opt.text,
            "Số phiếu": opt.votes,
            "Tỉ lệ (%)": totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0,
            fill: COLORS[i % COLORS.length]
          }));

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
              onClick={() => setActiveSurveyId(null)}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className={`bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 w-full ${userVoted ? "max-w-3xl" : "max-w-md"} max-h-[90vh] overflow-y-auto relative text-left shadow-2xl space-y-5 transition-all duration-300`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close Button */}
                <button
                  onClick={() => setActiveSurveyId(null)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors z-20"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Modal Title/Header */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                      survey.category === "vệ sinh môi trường" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      survey.category === "an ninh trật tự" ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                      survey.category === "chính sách mới" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                      "bg-slate-500/10 text-slate-400 border-slate-500/20"
                    }`}>
                      {survey.category}
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-light">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>Đăng ngày: {new Date(survey.createdAt).toLocaleDateString("vi-VN")}</span>
                    </span>
                  </div>

                  <h3 className="font-extrabold text-white text-base sm:text-lg pr-8 tracking-tight leading-snug">
                    {survey.title}
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed font-light pb-4 border-b border-slate-800">
                    {survey.description}
                  </p>
                </div>

                {/* Interactive Voting / Results Layout */}
                <div className={`grid ${userVoted ? "grid-cols-1 md:grid-cols-12 gap-6" : "grid-cols-1 gap-4"} items-start pt-1`}>
                  {/* Left Column: Choices */}
                  <div className={`${userVoted ? "md:col-span-7" : "w-full"} space-y-3`}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <Users className="w-4 h-4 text-sky-400" />
                        <span>{userVoted ? "Kết quả bình chọn hiện tại" : "Chọn nhanh ý kiến của bà con:"}</span>
                      </h4>
                      {userVoted && (
                        <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold px-2 py-0.5 rounded flex items-center space-x-1 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Đã bỏ phiếu</span>
                        </span>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      {survey.options.map((option, idx) => {
                        const optionPercent = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                        const optionColor = COLORS[idx % COLORS.length];

                        return (
                          <div key={option.id} className="relative group">
                            <button
                              disabled={userVoted}
                              onClick={() => handleVote(survey.id, option.id)}
                              className={`w-full text-left p-4 rounded-xl border transition-all text-xs sm:text-sm flex items-center justify-between gap-3 cursor-pointer relative overflow-hidden ${
                                userVoted 
                                  ? "bg-slate-950/20 border-slate-900 text-slate-300" 
                                  : "bg-slate-950/40 border-slate-800 hover:border-sky-400 hover:bg-sky-500/5 text-slate-200 hover:text-white shadow-sm active:scale-[0.98]"
                              }`}
                            >
                              {/* Background percentage fill if voted */}
                              {userVoted && (
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${optionPercent}%` }}
                                  transition={{ duration: 0.8, ease: "easeOut" }}
                                  style={{ backgroundColor: `${optionColor}12` }}
                                  className="absolute top-0 bottom-0 left-0 z-0 pointer-events-none border-r border-sky-500/5"
                                />
                              )}

                              <div className="flex items-center space-x-2.5 relative z-10">
                                {!userVoted && (
                                  <div className="w-6 h-6 rounded-full border border-slate-700 group-hover:border-sky-400 flex items-center justify-center text-[10px] font-extrabold text-slate-400 group-hover:text-sky-400 shrink-0 bg-slate-900/60 transition-colors">
                                    {idx + 1}
                                  </div>
                                )}
                                <span className="font-semibold leading-normal">{option.text}</span>
                              </div>

                              <div className="text-right shrink-0 relative z-10 flex items-center space-x-2">
                                {userVoted && (
                                  <>
                                    <span className="text-slate-500 font-mono text-[10px]">({option.votes} phiếu)</span>
                                    <span className="font-extrabold font-mono" style={{ color: optionColor }}>{optionPercent}%</span>
                                  </>
                                )}
                              </div>
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-800 font-light">
                      <span>Biểu quyết nặc danh bảo mật tuyệt đối</span>
                      <span className="font-bold flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>Tổng số phiếu: {totalVotes}</span>
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Visual Charts (Only visible to voters to inspect results) */}
                  {userVoted && (
                    <div className="md:col-span-5 bg-slate-950/40 rounded-2xl border border-slate-800/80 p-4 flex flex-col justify-between min-h-[260px] h-full">
                      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                          Phân Tích {chartType === "percent" ? "Ngang" : chartType === "bar" ? "Cột" : "Tròn"}
                        </span>
                        {totalVotes === 0 && (
                          <span className="text-[9px] text-amber-400 bg-amber-400/5 px-1.5 py-0.5 rounded border border-amber-400/10 shrink-0">
                            Chưa có biểu quyết
                          </span>
                        )}
                      </div>

                      <div className="flex-1 w-full relative min-h-[160px]">
                        {totalVotes === 0 ? (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-slate-600">
                            <BarChart3 className="w-8 h-8 mb-1 animate-pulse" />
                            <p className="text-[10px] font-semibold max-w-[150px]">Hãy đóng góp lá phiếu đầu tiên của bà con!</p>
                          </div>
                        ) : chartType === "percent" ? (
                          <div className="space-y-3 py-1">
                            {survey.options.map((option, idx) => {
                              const optionPercent = Math.round((option.votes / totalVotes) * 100);
                              const optionColor = COLORS[idx % COLORS.length];
                              return (
                                <div key={option.id} className="space-y-1">
                                  <div className="flex justify-between text-[10px] font-bold text-slate-300">
                                    <span className="truncate max-w-[80%]">{option.text}</span>
                                    <span style={{ color: optionColor }} className="font-mono">{optionPercent}%</span>
                                  </div>
                                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                                    <motion.div
                                      initial={{ width: 0 }}
                                      animate={{ width: `${optionPercent}%` }}
                                      transition={{ duration: 1, ease: "easeOut" }}
                                      style={{ backgroundColor: optionColor }}
                                      className="h-full rounded-full"
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : chartType === "bar" ? (
                          <ResponsiveContainer width="100%" height={160}>
                            <BarChart data={rechartsData} margin={{ top: 5, right: 5, left: -30, bottom: 5 }}>
                              <XAxis dataKey="name" stroke="#64748b" fontSize={8} tickLine={false} />
                              <YAxis stroke="#64748b" fontSize={8} tickLine={false} allowDecimals={false} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: "#020617", border: "1px solid #1e293b", borderRadius: "10px" }}
                                labelStyle={{ color: "#94a3b8", fontSize: "10px" }}
                                itemStyle={{ color: "#ffffff", fontSize: "10px" }}
                              />
                              <Bar dataKey="Số phiếu" radius={[3, 3, 0, 0]}>
                                {rechartsData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <ResponsiveContainer width="100%" height={160}>
                            <PieChart>
                              <Pie
                                data={rechartsData}
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={50}
                                paddingAngle={3}
                                dataKey="Số phiếu"
                              >
                                {rechartsData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{ backgroundColor: "#020617", border: "1px solid #1e293b", borderRadius: "10px" }}
                                itemStyle={{ color: "#ffffff", fontSize: "9px" }}
                              />
                              <Legend 
                                verticalAlign="bottom" 
                                height={28} 
                                iconSize={6}
                                iconType="circle"
                                wrapperStyle={{ fontSize: "8px" }} 
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>

                      <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800/85 mt-3 justify-center gap-2">
                        <button
                          onClick={() => setChartType("percent")}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${chartType === "percent" ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"}`}
                        >
                          Ngang
                        </button>
                        <button
                          onClick={() => setChartType("bar")}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${chartType === "bar" ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"}`}
                        >
                          Cột
                        </button>
                        <button
                          onClick={() => setChartType("pie")}
                          className={`px-2 py-1 rounded text-[10px] font-bold transition-all ${chartType === "pie" ? "bg-sky-500 text-white" : "text-slate-400 hover:text-white"}`}
                        >
                          Tròn
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Commit of secrecy inside Modal */}
                <div className="flex items-start space-x-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                  <Lock className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                  <span>Ý kiến được mã hóa tuyệt đối, phục vụ duy nhất cho công tác tham mưu xây dựng đô thị văn minh Phường Phú Lợi.</span>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>


      {/* Rules Notice */}
      <div className="mt-6 flex items-start space-x-2.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-850 text-xs text-slate-400 font-light leading-relaxed">
        <Lock className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-300 font-bold">Cam kết minh bạch thông tin:</strong> Mọi khảo sát trên hệ thống được tổ chức hoàn toàn công khai, trung thực. Thông tin cá nhân của bà con (email, tên tuổi) được bảo vệ tuyệt đối và không công khai trên bảng kết quả biểu đồ để đảm bảo tính riêng tư theo Luật An ninh mạng.
        </div>
      </div>
    </div>
  );
}
