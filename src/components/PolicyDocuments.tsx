import React, { useState } from 'react';
import { BookOpen, FileText, Landmark, Scale, ChevronRight, Download, ExternalLink, Search, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Mock data for policy documents
const POLICY_DOCUMENTS = [
  {
    id: 'pol-1',
    title: 'Nghị quyết 42-NQ/TW',
    description: 'Về tiếp tục đổi mới, nâng cao chất lượng chính sách xã hội, đáp ứng yêu cầu sự nghiệp xây dựng và bảo vệ Tổ quốc trong giai đoạn mới.',
    category: 'Nghị quyết',
    agency: 'Ban Chấp hành Trung ương Đảng',
    date: '24/11/2023',
    icon: <Landmark className="w-5 h-5" />,
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
    icon: <Scale className="w-5 h-5" />,
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
    icon: <BookOpen className="w-5 h-5" />,
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
    icon: <FileText className="w-5 h-5" />,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-100',
    link: '#',
  }
];

const CATEGORIES = ["Tất cả", "Nghị quyết", "Nghị định", "Quyết định", "Chỉ thị", "Quy trình"];

import { PolicyDocument } from '../types';

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

  const filteredDocs = activeDocs.filter(doc => {
    const matchesCat = activeCategory === "Tất cả" || doc.category === activeCategory;
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleDownload = (link: string, title: string) => {
    if (!link || link === "#") {
      alert("Văn bản này hiện chưa đính kèm tệp tin chi tiết.");
      return;
    }
    try {
      if (link.startsWith("data:")) {
        // It's an uploaded file Base64 Data URL
        const linkElement = document.createElement('a');
        linkElement.href = link;
        
        // Try to identify extension from MIME type
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
        
        // Clean vietnamese accents or characters for clean filenames if preferred, or keep as is
        linkElement.download = `${title.replace(/[/\\?%*:|"<>\s]+/g, "_")}.${extension}`;
        document.body.appendChild(linkElement);
        linkElement.click();
        document.body.removeChild(linkElement);
      } else {
        // External link (e.g. Google Drive URL)
        window.open(link, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("Lỗi khi mở/tải tài liệu:", err);
    }
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
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
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
              className={`p-5 rounded-2xl border ${doc.border} bg-white hover:${doc.bg} transition-colors group relative overflow-hidden`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${doc.bg} ${doc.color} shrink-0`}>
                  {doc.icon ? doc.icon : renderIcon(doc.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${doc.bg} ${doc.color}`}>
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
                        onClick={() => handleDownload(doc.link, doc.title)}
                        className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer" 
                        title="Tải về"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDownload(doc.link, doc.title)}
                        className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition cursor-pointer" 
                        title="Xem chi tiết"
                      >
                        <ExternalLink className="w-4 h-4" />
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
    </div>
  );
};
