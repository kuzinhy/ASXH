/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Sparkles, User, Landmark, AlertCircle, Heart, ShieldPlus, Briefcase, Zap } from "lucide-react";
import { ChatMessage, WebConfig } from "../types";
import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function AIChatbot({ webConfig }: { webConfig?: WebConfig | null }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-msg",
      sender: "bot",
      text: "Dạ, Trợ lý An sinh số phường Phú Lợi xin kính chào quý bà con! Con có thể giải đáp, hướng dẫn bà con về các thủ tục đăng ký hỗ trợ, mua BHYT tự nguyện, giờ làm việc của Ủy ban MTTQ hoặc tìm kiếm danh sách việc làm. Bà con cần hỗ trợ gì ạ?",
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brainContext, setBrainContext] = useState<string>("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    { icon: <Landmark className="w-3 h-3 text-sky-500 mr-1.5" />, text: "Địa chỉ và giờ làm việc Ủy ban MTTQ?" },
    { icon: <Heart className="w-3 h-3 text-rose-500 mr-1.5" />, text: "Làm sao đăng ký nhận trợ cấp?" },
    { icon: <ShieldPlus className="w-3 h-3 text-sky-500 mr-1.5" />, text: "Mua Bảo hiểm y tế ở đâu?" },
    { icon: <Briefcase className="w-3 h-3 text-sky-500 mr-1.5" />, text: "Tìm việc làm phổ thông" },
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load brain documents from Firestore to feed as context
  useEffect(() => {
    const loadBrainDocs = async () => {
      try {
        const colRef = collection(db, "brain_documents");
        const snap = await getDocs(colRef);
        let contextStr = "";
        snap.forEach(doc => {
          const data = doc.data();
          contextStr += `[FILE: ${data.name}]\n${data.content}\n\n`;
        });
        setBrainContext(contextStr);
      } catch (err) {
        console.error("Error loading brain documents:", err);
      }
    };
    loadBrainDocs();
  }, []);

  // Listen for search bar inputs from Header
  useEffect(() => {
    const handleAskAI = (e) => {
      if (e.detail) {
        handleSendMessage(e.detail);
      }
    };
    window.addEventListener('ai-ask', handleAskAI);
    return () => window.removeEventListener('ai-ask', handleAskAI);
  }, [messages, brainContext, loading]);


  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [...messages, userMsg],
          driveContext: brainContext,
          systemPrompt: webConfig?.aiSystemPrompt
        }),
      });

      if (!response.ok) {
        throw new Error("Lỗi kết nối máy chủ");
      }

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "bot",
        text: data.text,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.warn("Chat API server is not available. Running client-side rule engine fallback response:", err);
      
      // Smart Client-Side pattern matching response
      const query = textToSend.toLowerCase();
      let reply = "";

      if (query.includes("địa chỉ") || query.includes("ubnd") || query.includes("ủy ban") || query.includes("ở đâu") || query.includes("đường nào") || query.includes("văn phòng")) {
        reply = "Dạ, Trụ sở **Ủy ban MTTQ Việt Nam Phường Phú Lợi** nằm ở địa chỉ: **Số 171 đường Huỳnh Văn Lũy, Khu phố Phú Thuận, Phường Phú Lợi, Thành phố Hồ Chí Minh**.\n\n**Giờ làm việc:**\n- Sáng: 07:30 – 11:30\n- Chiều: 13:30 – 17:00\n- Làm việc từ Thứ Hai đến hết sáng Thứ Bảy (Chiều Thứ Bảy và Chủ Nhật nghỉ).";
      } else if (query.includes("nhận gạo") || query.includes("gạo") || query.includes("cứu trợ") || query.includes("mì tôm") || query.includes("đăng ký") || query.includes("nhận quà") || query.includes("khó khăn")) {
        reply = "Dạ thưa bà con, để đăng ký nhận gạo, mì tôm hoặc cứu trợ khó khăn đột xuất, bà con vui lòng nhấn vào mục **'Đăng Ký Nhận Trợ Giúp'** ở ngay phần dịch vụ chính phía trên trang web này, điền đầy đủ thông tin hoặc liên hệ trực tiếp với Tổ trưởng/Trưởng khu phố nơi bà con cư trú để được tổ xác minh nhanh nhất ạ.";
      } else if (query.includes("bảo hiểm") || query.includes("bảo hiểm y tế") || query.includes("bhyt") || query.includes("mua")) {
        reply = "Dạ thưa bà con, bà con có thể mua hoặc gia hạn **Bảo hiểm y tế (BHYT) tự nguyện** tại:\n1. **Ủy ban MTTQ Việt Nam Phường Phú Lợi** (Gặp cán bộ hoặc Bộ phận Một cửa).\n2. **Các điểm bưu điện văn hóa xã/phường** hoặc Đại lý thu BHXH, BHYT đóng trên địa bàn Phường Phú Lợi.\n\nNhà nước hiện đang hỗ trợ một phần mức đóng BHYT hộ gia đình và hỗ trợ rất nhiều cho hộ nghèo/cận nghèo.";
      } else if (query.includes("việc làm") || query.includes("công việc") || query.includes("tuyển dụng") || query.includes("làm gì") || query.includes("tìm việc")) {
        reply = "Dạ hiện tại trên cổng thông tin đang kết nối trực tiếp với 3 đơn vị tuyển dụng lớn tại địa bàn:\n1. **Nhân viên Bán hàng Siêu thị Co.opmart Phú Lợi** (6.5 – 8 triệu/tháng)\n2. **Công nhân May mặc tại Công ty May mặc Đại Đăng** (7.5 – 10 triệu/tháng)\n3. **Nhân viên Giao hàng (Shipper) GHN Phú Lợi** (9 – 13 triệu/tháng)\n\nBà con hãy chuyển sang thẻ **'Giới Thiệu Việc Làm'** trên cổng này để xem chi tiết liên hệ nhé!";
      } else if (query.includes("quyên góp") || query.includes("tài trợ") || query.includes("ủng hộ") || query.includes("hảo tâm") || query.includes("giúp đỡ")) {
        reply = "Dạ, Ủy ban MTTQ Việt Nam Phường Phú Lợi trân trọng tri ân tấm lòng vàng của quý nhà hảo tâm! Để đồng hành cùng địa phương, quý vị vui lòng chuyển sang thẻ **'Nhà Hảo Tâm - Sổ Vàng'**, chọn một chiến dịch cứu trợ mong muốn, nhập tên và số tiền tài trợ. Hệ thống sẽ cấp ngay một **Thư Cảm Ơn kèm Chứng Nhận Sổ Vàng số hóa** có đóng mộc tri ân danh dự của Phường ạ!";
      } else {
        reply = "Dạ, Trợ lý An sinh Số phường Phú Lợi xin ghi nhận câu hỏi của bà con. Hiện tại do hệ thống đang chạy chế độ Vercel tối ưu hóa, nếu cần giải đáp các câu hỏi đặc thù khác, bà con có thể điền thông tin tại thẻ **'Đăng Ký Nhận Trợ Giúp'** hoặc gọi trực tiếp Hotline Ủy ban MTTQ Việt Nam Phường Phú Lợi: **0274.3824.225** để cán bộ chuyên trách giải đáp tận tình cho bà con ạ!";
      }

      const botMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "bot",
        text: reply,
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      };

      setMessages(prev => [...prev, botMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 px-4 bg-gradient-to-br from-primary-50 via-white to-blue-50 text-slate-600 relative overflow-hidden border-t border-primary-100" id="ai-assistant">
      {/* Background radial glows & patterns */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary-400/10 blur-[150px] pointer-events-none mix-blend-screen" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full bg-blue-400/10 blur-[150px] pointer-events-none mix-blend-screen" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left column: Explanatory and guidelines */}
        <div className="lg:col-span-5 space-y-8 text-center lg:text-left">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center space-x-2 bg-primary-100 text-primary-700 border border-primary-200 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm shadow-primary-500/10"
          >
            <Sparkles className="w-4 h-4 text-primary-600 animate-pulse" />
            <span>Công Nghệ AI Vì Dân</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
          >
            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 font-sans mb-6">
              Trợ Lý Ảo <span className="text-primary-600">An Sinh Số</span>
            </h2>
            <p className="text-slate-600 text-sm md:text-lg leading-relaxed font-medium mb-8">
              Hệ thống thông minh tích hợp AI, sẵn sàng giải đáp 24/7. Hỗ trợ tra cứu chính sách, bảo hiểm y tế tự nguyện, thủ tục hành chính nhanh chóng và tiện lợi.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2, staggerChildren: 0.1 }}
            className="space-y-4 text-slate-700 text-xs md:text-sm text-left max-w-md mx-auto lg:mx-0 font-light"
          >
            <div className="flex items-start space-x-3 bg-white/80 p-3 rounded-2xl border border-slate-200 backdrop-blur-sm">
              <div className="bg-emerald-100 p-1.5 rounded-lg shrink-0 mt-0.5"><Zap className="w-4 h-4 text-emerald-600" /></div>
              <span>Tra cứu 24/7 mọi lúc mọi nơi các chính sách trợ giúp xã hội, giải đáp tận tình.</span>
            </div>
            <div className="flex items-start space-x-3 bg-white/80 p-3 rounded-2xl border border-slate-200 backdrop-blur-sm">
              <div className="bg-blue-100 p-1.5 rounded-lg shrink-0 mt-0.5"><Heart className="w-4 h-4 text-blue-600" /></div>
              <span>Kết nối việc làm, hướng dẫn thủ tục quyên góp, giúp đỡ những hoàn cảnh khó khăn.</span>
            </div>
          </motion.div>
        </div>

        {/* Right column: Chat container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="lg:col-span-7 bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-xl flex flex-col h-[520px] w-full mx-auto overflow-hidden border border-white/60 ring-1 ring-slate-100"
        >
          {/* Chat Header */}
          <div className="bg-white/60 backdrop-blur-md px-6 py-4 border-b border-slate-200 flex justify-between items-center shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center border border-white/10 shadow-lg">
                <Landmark className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-800 flex items-center space-x-1.5 font-sans">
                  <span>Trợ lý An Sinh Số</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                </h4>
                <p className="text-[10px] text-slate-500">Ủy ban MTTQ Việt Nam Phường Phú Lợi</p>
              </div>
            </div>
            <span className="text-[10px] text-blue-600/80 font-bold font-mono hidden sm:inline-block">Tốc độ phản hồi ~0.5 giây</span>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 font-sans text-sm min-h-0 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"} items-start space-x-2.5`}
                >
                  {m.sender === "bot" && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border border-blue-500/30 shadow-sm mt-1">
                      <Landmark className="w-4 h-4 text-blue-600" />
                    </div>
                  )}
                  
                  <div className="flex flex-col space-y-1 max-w-[85%]">
                    <div className={`rounded-2xl px-4 py-3 text-[13px] sm:text-sm leading-relaxed whitespace-pre-wrap shadow-sm ${
                      m.sender === "user" 
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-none shadow-blue-900/50" 
                        : "bg-white border border-slate-100 text-slate-700 rounded-tl-none shadow-sm"
                    }`}>
                      {m.text}
                    </div>
                    <span className={`text-[9px] text-slate-500 font-medium ${m.sender === "user" ? "text-right" : "text-left"}`}>
                      {m.timestamp}
                    </span>
                  </div>
                  {m.sender === "user" && (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 border border-indigo-200 mt-1">
                      <User className="w-4 h-4 text-indigo-600" />
                    </div>
                  )}
                </motion.div>
              ))}
              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start items-center space-x-2 text-xs text-blue-600 italic bg-blue-50/50 p-3 rounded-xl border border-blue-100 w-fit font-medium"
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                  <span>Trợ lý ảo đang suy nghĩ câu trả lời...</span>
                </motion.div>
              )}
              {error && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-start space-x-2 text-xs text-rose-600 bg-rose-50/50 border border-rose-100 p-3.5 rounded-xl max-w-[90%] font-medium"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Quick suggestions area */}
          <div className="px-6 py-3 bg-slate-50/50 backdrop-blur border-t border-slate-100 flex flex-wrap gap-2 shrink-0">
            <div className="w-full flex items-center space-x-1 mb-1">
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gợi ý từ Trợ lý AI</span>
            </div>
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q.text)}
                className="flex items-center text-[10px] sm:text-xs text-slate-600 hover:text-blue-700 hover:bg-blue-50 bg-white border border-slate-200 rounded-full px-3 py-1.5 transition text-left leading-tight shadow-sm font-medium cursor-pointer group"
              >
                {q.icon}
                <span className="group-hover:translate-x-0.5 transition-transform">{q.text}</span>
              </button>
            ))}
          </div>

          {/* Chat Form input */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }} 
            className="p-4 bg-white/80 backdrop-blur border-t border-slate-200 flex space-x-2 shrink-0"
          >
            <input 
              type="text" 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi tại đây..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 font-sans shadow-inner font-medium transition-colors"
              disabled={loading}
            />
            <button 
              type="submit" 
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold px-4 rounded-xl transition duration-150 flex items-center justify-center shadow-md cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
