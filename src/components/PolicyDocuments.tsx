import React, { useState } from 'react';
import { 
  BookOpen, FileText, Landmark, Scale, ChevronRight, Download, ExternalLink, Search, Filter, 
  X, Clock, Building, CheckCircle2, ArrowRight, AlertCircle, Calendar, User, FileCheck, Printer, Eye 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PolicyDocument } from '../types';

// Mock data for policy documents
const POLICY_DOCUMENTS = [
  {
    id: 'pol-1',
    title: 'Nghị quyết 42-NQ/TW',
    description: 'Về tiếp tục đổi mới, nâng cao chất lượng chính sách xã hội, đáp ứng yêu cầu sự nghiệp xây dựng và bảo vệ Tổ quốc trong giai đoạn mới.',
    category: 'Nghị quyết',
    agency: 'Ban Chấp hành Trung ương Đảng',
    date: '24/11/2023',
    iconName: 'Landmark',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-100',
    link: '#',
  },
  {
    id: 'pol-2',
    title: 'Quy trình xét duyệt hồ sơ an sinh xã hội (Nghị định 20/2021/NĐ-CP)',
    description: 'Quy trình xét duyệt hồ sơ an sinh xã hội theo quy định tại Nghị định số 20/2021/NĐ-CP của Chính phủ.',
    category: 'Quy trình',
    agency: 'Chính phủ',
    date: '15/03/2021',
    iconName: 'Scale',
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
    link: 'https://docs.google.com/document/d/1jkgyMHqdkbMiD0AIOu1y4D8yg8zXBEK2kRTFxx4cqgY/edit?tab=t.0',
  },
  {
    id: 'pol-3',
    title: 'Quyết định 1719/QĐ-TTg',
    description: 'Phê duyệt Chương trình mục tiêu quốc gia phát triển kinh tế - xã hội vùng đồng bào dân tộc thiểu số và miền núi.',
    category: 'Quyết định',
    agency: 'Thủ tướng Chính phủ',
    date: '14/10/2021',
    iconName: 'BookOpen',
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    link: '#',
  },
  {
    id: 'pol-4',
    title: 'Chỉ thị 14-CT/TW',
    description: 'Về tiếp tục tăng cường sự lãnh đạo của Đảng đối với công tác người có công với cách mạng.',
    category: 'Chỉ thị',
    agency: 'Ban Bí thư',
    date: '19/07/2017',
    iconName: 'FileText',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    link: '#',
  }
];

const CATEGORIES = ["Tất cả", "Nghị quyết", "Nghị định", "Quyết định", "Chỉ thị", "Quy trình"];

interface PolicyDocumentsProps {
  documents: PolicyDocument[];
}

const renderIcon = (category: string) => {
  switch (category) {
    case 'Nghị quyết': return <Landmark className="w-5 h-5" />;
    case 'Nghị định': return <Scale className="w-5 h-5" />;
    case 'Quyết định': return <BookOpen className="w-5 h-5" />;
    case 'Chỉ thị': return <FileText className="w-5 h-5" />;
    default: return <FileText className="w-5 h-5" />;
  }
};

export const PolicyDocuments: React.FC<PolicyDocumentsProps> = ({ documents }) => {
  const activeDocs = documents && documents.length > 0 ? documents : POLICY_DOCUMENTS;

  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<PolicyDocument | typeof POLICY_DOCUMENTS[0] | null>(null);

  const filteredDocs = activeDocs.filter(doc => {
    const matchesCat = activeCategory === "Tất cả" || doc.category === activeCategory;
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleDownload = (e: React.MouseEvent, link: string, title: string) => {
    e.stopPropagation();
    if (!link || link === "#") {
      alert("Văn bản này hiện chưa đính kèm tệp tin chi tiết.");
      return;
    }
    try {
      if (link.startsWith("data:")) {
        const linkElement = document.createElement('a');
        linkElement.href = link;
        
        const mimeMatch = link.match(/data:([^;]+);/);
        let extension = "pdf";
        if (mimeMatch && mimeMatch[1]) {
          const mime = mimeMatch[1];
          if (mime.includes("pdf")) extension = "pdf";
          else if (mime.includes("word") || mime.includes("officedocument.word")) extension = "docx";
          else if (mime.includes("sheet") || mime.includes("officedocument.spread")) extension = "xlsx";
          else if (mime.includes("png")) extension = "png";
          else if (mime.includes("jpeg") || mime.includes("jpg")) extension = "jpg";
        }
        
        linkElement.download = `${title.replace(/[/\\?%*:|"<>\s]+/g, "_")}.${extension}`;
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
      } else {
        window.open(link, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("Lỗi khi mở/tải tài liệu:", err);
    }
  };

  const isDecree20Process = (doc: any) => {
    if (!doc) return false;
    return doc.id === 'pol-2' || 
           doc.title.includes('20/2021') || 
           doc.title.toLowerCase().includes('quy trình xét duyệt');
  };

  return (
    <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 lg:p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <span className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <Landmark className="w-6 h-6" />
            </span>
            Chính sách An sinh Xã hội
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-2 max-w-2xl">
            Tra cứu các văn bản, chủ trương của Đảng, chính sách pháp luật của Nhà nước về công tác an sinh xã hội, bảo trợ xã hội và chăm lo đời sống nhân dân.
          </p>
        </div>
        
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm văn bản..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm w-full sm:w-64 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition"
            />
          </div>
        </div>
      </div>

      {/* Categories Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeCategory === cat 
                ? 'bg-slate-800 text-white shadow-md' 
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredDocs.map((doc, idx) => (
            <motion.div
              key={doc.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, delay: idx * 0.05 }}
              onClick={() => setSelectedDoc(doc)}
              className={`p-5 rounded-2xl border ${doc.border || 'border-slate-200'} bg-white hover:${doc.bg || 'bg-slate-50'} transition-all cursor-pointer group relative overflow-hidden shadow-xs hover:shadow-md`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${doc.bg || 'bg-slate-100'} ${doc.color || 'text-slate-700'} shrink-0`}>
                  {renderIcon(doc.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${doc.bg || 'bg-slate-100'} ${doc.color || 'text-slate-700'}`}>
                      {doc.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold font-mono">
                      {doc.date}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-slate-800 mb-1.5 leading-tight group-hover:text-sky-700 transition-colors">
                    {doc.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {doc.description}
                  </p>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-slate-400">
                      Cơ quan ban hành: <strong className="text-slate-600">{doc.agency}</strong>
                    </span>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => handleDownload(e, doc.link, doc.title)}
                        className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer" 
                        title="Tải về / Mở tệp"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDoc(doc);
                        }}
                        className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer" 
                        title="Xem chi tiết quy trình"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          
          {filteredDocs.length === 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-12 text-center bg-slate-50 rounded-2xl border border-slate-200"
            >
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-slate-600 font-bold mb-1">Không tìm thấy văn bản</h3>
              <p className="text-sm text-slate-400">Vui lòng thử lại với từ khóa hoặc danh mục khác.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* View All Link */}
      <div className="mt-6 text-center">
        <button className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-sky-600 hover:text-sky-700 uppercase tracking-wider hover:bg-sky-50 rounded-lg transition">
          Xem tất cả văn bản
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* DETAIL MODAL FOR POLICY DOCUMENT & DECREE 20/2021 WORKFLOW */}
      <AnimatePresence>
        {selectedDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative flex flex-col"
            >
              {/* Modal Header */}
              <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Scale className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {selectedDoc.category} • {selectedDoc.agency}
                    </span>
                    <h3 className="text-base sm:text-lg font-black text-slate-800 leading-snug mt-0.5">
                      {selectedDoc.title}
                    </h3>
                  </div>
                </div>
                
                <button 
                  onClick={() => setSelectedDoc(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content Body */}
              <div className="p-6 sm:p-8 space-y-8 flex-1">
                {isDecree20Process(selectedDoc) ? (
                  /* FULL DETAILED DECREE 20/2021/NĐ-CP APPROVAL PROCESS DISPLAY */
                  <div className="space-y-8">
                    {/* Header Summary Banner */}
                    <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
                      <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-300/30 text-amber-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3">
                          <Clock className="w-3.5 h-3.5" />
                          Tổng thời gian tối đa: 16 ngày làm việc
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wide text-white">
                          QUY TRÌNH XÉT DUYỆT HỒ SƠ AN SINH XÃ HỘI
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-300 font-light mt-1 max-w-2xl">
                          (Theo quy định tại Nghị định số 20/2021/NĐ-CP của Chính phủ quy định chính sách trợ giúp xã hội đối với đối tượng bảo trợ xã hội)
                        </p>
                      </div>
                      <div className="absolute -right-10 -bottom-10 opacity-10 text-white">
                        <Scale className="w-64 h-64" />
                      </div>
                    </div>

                    {/* SECTION I: SƠ ĐỒ TÓM TẤT TIẾN TRÌNH */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6">
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-indigo-600" />
                        I. Sơ Đồ Tóm Tắt Tiến Trình
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
                        {/* Flow Card 1 */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                          <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider mb-1">Bắt đầu</div>
                          <div className="font-extrabold text-xs text-slate-800 mb-2">1. Người dân nộp hồ sơ</div>
                          <p className="text-[11px] text-slate-500 font-light">Nộp tờ khai Mẫu 01 & giấy tờ chứng minh hoàn cảnh.</p>
                        </div>

                        {/* Flow Card 2 */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between relative">
                          <div className="text-[10px] font-bold text-sky-600 uppercase tracking-wider mb-1">Cấp Xã (07 ngày)</div>
                          <div className="font-extrabold text-xs text-slate-800 mb-2">2. UBND Cấp Xã</div>
                          <p className="text-[11px] text-slate-500 font-light">Thẩm định thực tế & Niêm yết công khai tại trụ sở.</p>
                        </div>

                        {/* Flow Card 3 */}
                        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
                          <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Cấp Huyện (07 ngày)</div>
                          <div className="font-extrabold text-xs text-slate-800 mb-2">3. Phòng LĐ-TB&XH</div>
                          <p className="text-[11px] text-slate-500 font-light">Tiếp nhận, thẩm định chuyên môn & đối chiếu pháp luật.</p>
                        </div>

                        {/* Flow Card 4 */}
                        <div className="bg-white p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-xs flex flex-col justify-between">
                          <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">Kết quả</div>
                          <div className="font-extrabold text-xs text-slate-800 mb-2">4. Chủ tịch UBND Cấp Huyện</div>
                          <p className="text-[11px] text-slate-500 font-light">Ký ban hành Quyết định trợ cấp hàng tháng.</p>
                        </div>
                      </div>
                    </div>

                    {/* SECTION II: BẢNG CHI TIẾT QUY TRÌNH XÉT DUYỆT HƯỞNG MỚI */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                          <Building className="w-4 h-4 text-indigo-600" />
                          II. Bảng Chi Tiết Quy Trình Xét Duyệt Hưởng Mới (6 Bước)
                        </h4>
                        <span className="text-[11px] text-slate-500 font-medium">
                          Thời gian tối đa: <strong className="text-slate-800 font-bold">16 ngày làm việc</strong>
                        </span>
                      </div>

                      {/* Responsive Steps List */}
                      <div className="space-y-3">
                        {/* Step 1 */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-indigo-200 transition">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">1</span>
                              <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">Người nộp hồ sơ (hoặc người giám hộ)</span>
                            </div>
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full self-start sm:self-auto">
                              Thời điểm bắt đầu
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-light">
                            Nộp <strong>Tờ khai (Mẫu số 01 kèm Nghị định 20/2021/NĐ-CP)</strong> và các giấy tờ chứng minh hoàn cảnh tại UBND cấp xã (qua các hình thức: <em>trực tiếp, bưu điện hoặc cổng dịch vụ công trực tuyến</em>).
                          </p>
                        </div>

                        {/* Step 2 */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-indigo-200 transition">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">2</span>
                              <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">Công chức phụ trách LĐ-TB&XH cấp xã</span>
                            </div>
                            <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-full self-start sm:self-auto">
                              Trong vòng 05 ngày làm việc đầu
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-light">
                            Tiếp nhận, kiểm tra tính hợp lệ và đầy đủ của hồ sơ, tiến hành <strong>xác minh thực tế hoàn cảnh</strong> của đối tượng tại địa bàn.
                          </p>
                        </div>

                        {/* Step 3 */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-indigo-200 transition">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">3</span>
                              <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">Hội đồng xét duyệt trợ giúp xã hội cấp xã</span>
                            </div>
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full self-start sm:self-auto">
                              02 ngày làm việc (thời gian niêm yết)
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-light">
                            Tổ chức họp xét duyệt công khai, lập biên bản và tiến hành <strong>niêm yết công khai kết quả xét duyệt</strong> tại trụ sở UBND cấp xã.
                          </p>
                        </div>

                        {/* Step 4 */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-indigo-200 transition">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">4</span>
                              <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">Chủ tịch UBND cấp xã</span>
                            </div>
                            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full self-start sm:self-auto">
                              Ngay sau khi hết hạn niêm yết
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-light">
                            Trường hợp không có khiếu nại sau thời gian niêm yết, Chủ tịch UBND cấp xã ký văn bản kiến nghị kèm hồ sơ gửi lên Phòng LĐ-TB&XH cấp huyện.
                          </p>
                        </div>

                        {/* Step 5 */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-indigo-200 transition">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">5</span>
                              <span className="font-extrabold text-xs text-slate-800 uppercase tracking-wide">Phòng LĐ-TB&XH cấp huyện</span>
                            </div>
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full self-start sm:self-auto">
                              Trong vòng 07 ngày làm việc
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed font-light">
                            Tiếp nhận hồ sơ từ cấp xã chuyển lên, tiến hành thẩm định chuyên môn, đối chiếu các quy định và tiêu chuẩn pháp luật hiện hành.
                          </p>
                        </div>

                        {/* Step 6 */}
                        <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-4 shadow-xs transition">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 pb-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">6</span>
                              <span className="font-extrabold text-xs text-emerald-950 uppercase tracking-wide">Chủ tịch UBND cấp huyện</span>
                            </div>
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full self-start sm:self-auto">
                              Nằm trong hạn 07 ngày của Bước 5
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 leading-relaxed font-light">
                            <strong>Ký ban hành Quyết định trợ cấp xã hội hàng tháng</strong> cho đối tượng. Trường hợp hồ sơ không đủ điều kiện, phải trả lời bằng văn bản nêu rõ lý do từ chối.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* SECTION III: CÁC LƯU Ý QUAN TRỌNG VỀ THỜI GIAN */}
                    <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-widest text-amber-900 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600" />
                        III. Các Lưu Ý Quan Trọng Về Thời Gian
                      </h4>

                      <ul className="space-y-2 text-xs text-slate-700 leading-relaxed">
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                          <span><strong>Thời điểm tính hưởng:</strong> Tiền trợ cấp hàng tháng của đối tượng được tính bắt đầu từ <em>tháng Chủ tịch UBND cấp huyện ký Quyết định hưởng trợ cấp</em>.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                          <span><strong>Quy trình thôi hưởng:</strong> Khi đối tượng qua đời hoặc không còn đủ điều kiện, cấp xã phải báo cáo trong <strong>03 ngày làm việc</strong>; cấp huyện phải ra quyết định thôi hưởng trong <strong>03 ngày làm việc tiếp theo</strong>. Việc dừng trợ cấp tính từ tháng ngay sau tháng đối tượng chết hoặc không còn đủ điều kiện.</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  /* GENERAL POLICY DOCUMENT DISPLAY */
                  <div className="space-y-6">
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs font-bold text-slate-500">Cơ quan ban hành:</span>
                        <span className="text-xs font-extrabold text-slate-800 bg-white px-3 py-1 rounded-lg border border-slate-200">
                          {selectedDoc.agency}
                        </span>
                        <span className="text-xs font-bold text-slate-500 ml-auto">Ngày ban hành: {selectedDoc.date}</span>
                      </div>
                      <h2 className="text-lg font-black text-slate-800 mb-3">{selectedDoc.title}</h2>
                      <p className="text-sm text-slate-600 leading-relaxed font-light">{selectedDoc.description}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div className="sticky bottom-0 bg-slate-50 px-6 py-4 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3 rounded-b-3xl">
                <span className="text-xs text-slate-500 font-medium">
                  Cập nhật theo Nghị định 20/2021/NĐ-CP
                </span>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-xs"
                  >
                    <Printer className="w-4 h-4" />
                    In văn bản
                  </button>
                  
                  {selectedDoc.link && selectedDoc.link !== "#" && (
                    <button
                      onClick={(e) => handleDownload(e, selectedDoc.link, selectedDoc.title)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      Tải / Xem file đính kèm
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedDoc(null)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Đóng lại
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(PolicyDocuments);

