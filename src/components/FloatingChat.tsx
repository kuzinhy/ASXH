/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  Phone, 
  User, 
  Landmark, 
  AlertCircle, 
  Clock, 
  PhoneCall, 
  CheckCircle,
  ChevronRight,
  ShieldAlert,
  Calendar
} from "lucide-react";
import { ChatMessage } from "../types";
import { db } from "../lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"ai" | "officer" | "hotline">("ai");
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem("phuloi_floating_chat_history");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return [
      {
        id: "init-floating-msg",
        sender: "bot",
        text: "Xin kính chào quý bà con! Tôi là Trợ lý số 24/7 của Ủy ban MTTQ Việt Nam Phường Phú Lợi. Bà con cần tìm hiểu thông tin gì về an sinh, chính sách hoặc cần gặp cán bộ trực ban ạ?",
        timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
      }
    ];
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showWelcomeTip, setShowWelcomeTip] = useState(false);
  const [brainContext, setBrainContext] = useState<string>("");

  // Form for human officer contact
  const [officerName, setOfficerName] = useState("");
  const [officerPhone, setOfficerPhone] = useState("");
  const [officerContent, setOfficerContent] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Trigger welcome tip after a short delay
  useEffect(() => {
    const timer = setTimeout(() => {
      const hasSeen = localStorage.getItem("phuloi_floating_chat_welcome_seen");
      if (!hasSeen) {
        setShowWelcomeTip(true);
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Save messages to localStorage
  useEffect(() => {
    localStorage.setItem("phuloi_floating_chat_history", JSON.stringify(messages));
  }, [messages]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, loading, isOpen]);

  // Load brain documents from Firestore as context
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

  const closeWelcomeTip = () => {
    setShowWelcomeTip(false);
    localStorage.setItem("phuloi_floating_chat_welcome_seen", "true");
  };

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

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          messages: [...messages, userMsg],
          driveContext: brainContext 
        }),
      });

      if (!response.ok) {
        throw new Error("Lỗi kết nối");
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
      console.warn("Using fallback rule-based replies in floating chat:", err);
      
      const query = textToSend.toLowerCase();
      let reply = "";

      if (query.includes("địa chỉ") || query.includes("ubnd") || query.includes("ủy ban") || query.includes("ở đâu")) {
        reply = "Trụ sở Ủy ban MTTQ Việt Nam Phường Phú Lợi tọa lạc tại:\n📍 **Số 171 đường Huỳnh Văn Lũy, Khu phố Phú Thuận, Phường Phú Lợi, Thành phố Hồ Chí Minh**.";
      } else if (query.includes("giờ") || query.includes("làm việc") || query.includes("thời gian")) {
        reply = "🕒 **Giờ làm việc của Ủy ban MTTQ Việt Nam Phường Phú Lợi:**\n- Buổi sáng: 07:30 – 11:30\n- Buổi chiều: 13:30 – 17:00\n- Làm việc từ Thứ Hai đến hết sáng Thứ Bảy hằng tuần.";
      } else if (query.includes("trợ giúp") || query.includes("nhận gạo") || query.includes("cứu trợ") || query.includes("khó khăn")) {
        reply = "Dạ, để đăng ký nhận hỗ trợ an sinh (gạo, nhu yếu phẩm, học bổng...), bà con vui lòng truy cập thẻ **'Đăng Ký Nhận Trợ Giúp'** trên trang chủ và điền thông tin chi tiết để cán bộ khu phố đến xác minh nhé!";
      } else if (query.includes("bảo hiểm") || query.includes("bhyt") || query.includes("y tế")) {
        reply = "Bà con muốn đăng ký hoặc gia hạn Bảo hiểm y tế (BHYT) hộ gia đình, vui lòng liên hệ Bộ phận Một cửa tại Ủy ban MTTQ Việt Nam Phường Phú Lợi hoặc các đại lý thu BHXH, BHYT thuộc hệ thống bưu điện đóng trên địa bàn phường.";
      } else if (query.includes("việc làm") || query.includes("tuyển dụng") || query.includes("tìm việc")) {
        reply = "Hiện có các tin tuyển dụng việc làm phổ thông (bán hàng siêu thị Co.opmart, công nhân may mặc, shipper...) được niêm yết trong mục **'Giới Thiệu Việc Làm'**. Bà con có thể ứng tuyển trực tiếp tại đó ạ.";
      } else {
        reply = "Dạ, Trợ lý ảo đã nhận câu hỏi của bà con. Bà con có thể liên hệ trực tiếp số hotline trực ban Phú Lợi: **0274.3824.225** để gặp cán bộ phụ trách hoặc chuyển qua thẻ 'Cán bộ trực ban' ngay trên khung chat này để gửi lời nhắn nhé ạ!";
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

  const handleOfficerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!officerName.trim() || !officerPhone.trim() || !officerContent.trim()) return;

    // Simulate sending to database/notifications
    console.log("Urgent Citizen Call Request Submitted:", {
      fullName: officerName,
      phone: officerPhone,
      description: officerContent,
      quarter: "Khu phố trực ban",
      category: "Gặp cán bộ trực ban",
    });

    // Write a mock request submission to localStorage requests
    try {
      const existingReqs = localStorage.getItem("phuloi_citizen_requests");
      const reqList = existingReqs ? JSON.parse(existingReqs) : [];
      reqList.unshift({
        id: `REQ-WEB-${Date.now().toString().slice(-4)}`,
        fullName: officerName,
        phone: officerPhone,
        address: "Liên hệ qua cổng hỗ trợ trực tuyến",
        quarter: "Trực tuyến",
        category: "Chăm sóc Y tế, Thẻ BHYT",
        description: `[YÊU CẦU GỌI LẠI KHẨN CẤP] ${officerContent}`,
        status: "Đã tiếp nhận",
        createdAt: new Date().toISOString(),
        notes: "Yêu cầu gửi qua khung chat hỗ trợ trực tuyến. Đang phân công cán bộ trực cuộc gọi."
      });
      localStorage.setItem("phuloi_citizen_requests", JSON.stringify(reqList));
    } catch (e) {
      // ignore
    }

    setIsSubmitted(true);
    
    // Add simulated message to history so it looks continuous
    const systemNotice: ChatMessage = {
      id: `notice-${Date.now()}`,
      sender: "bot",
      text: `Chào ông/bà ${officerName}. Yêu cầu phản ánh/gọi lại của ông/bà về nội dung: "${officerContent}" đã được chuyển tiếp khẩn đến Ban Chỉ đạo An sinh xã hội Phường Phú Lợi.\n\nCán bộ trực ban sẽ liên hệ trực tiếp với ông/bà qua số điện thoại: **${officerPhone}** trong vòng tối đa 2 giờ làm việc sắp tới. Xin cảm ơn bà con!`,
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    };
    
    setMessages(prev => [...prev, systemNotice]);

    // Reset form fields after 2s
    setTimeout(() => {
      setOfficerContent("");
      setIsSubmitted(false);
      setActiveTab("ai"); // Switch back to AI tab to view response
    }, 3000);
  };

  const hotlines = [
    { name: "Đường dây nóng Ủy ban MTTQ Phường", phone: "0274.3824.225", desc: "Hỗ trợ chung & Giải quyết thủ tục hành chính" },
    { name: "Cứu hỏa & Cứu nạn Phường", phone: "114 (hoặc 0274.3822.115)", desc: "Trực ứng phó hỏa hoạn, ngập lụt, thiên tai" },
    { name: "Trực ban Công an Phường Phú Lợi", phone: "0274.3824.226", desc: "Phản ánh an ninh trật tự, trộm cắp, tệ nạn" },
    { name: "Trạm Y tế Phường Phú Lợi", phone: "0274.3837.070", desc: "Cấp cứu y tế khẩn cấp & Tư vấn dịch bệnh, BHYT" },
    { name: "Tư vấn Bảo hiểm Y tế tự nguyện", phone: "0918.552.261 (Bà Lan)", desc: "Hướng dẫn gia hạn, mua mới BHYT hộ gia đình" },
    { name: "Ban Thường trực MTTQ Phường", phone: "0274.3838.112", desc: "Hỗ trợ quà cứu trợ, nhà Đại đoàn kết, học bổng" }
  ];

  return (
    <>
      {/* Floating Buttons Group on Bottom Right */}
      <div className="fixed bottom-24 right-6 z-40 flex flex-col items-end space-y-4">
        
        {/* Welcome message balloon above the chat button */}
        <AnimatePresence>
          {showWelcomeTip && !isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-700/60 text-xs text-left max-w-[260px] relative pointer-events-auto flex flex-col space-y-1.5"
            >
              {/* Little speech bubble tail */}
              <div className="absolute bottom-[-6px] right-6 w-3 h-3 bg-slate-900 border-r border-b border-slate-700/60 rotate-45" />
              
              <div className="flex items-center space-x-1.5 text-sky-400 font-bold uppercase tracking-wider text-[10px]">
                <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                <span>Cần trợ giúp trực tuyến?</span>
              </div>
              <p className="text-slate-200 leading-relaxed font-light font-sans">
                Trực ban Ủy ban MTTQ Phường Phú Lợi sẵn sàng giải đáp thắc mắc của bà con 24/7!
              </p>
              <div className="flex justify-between items-center pt-1">
                <button 
                  onClick={() => { setIsOpen(true); closeWelcomeTip(); }}
                  className="text-sky-300 hover:text-sky-200 font-bold text-[10px] uppercase flex items-center cursor-pointer"
                >
                  Trò chuyện ngay <ChevronRight className="w-3 h-3 ml-0.5" />
                </button>
                <button 
                  onClick={closeWelcomeTip}
                  className="text-slate-400 hover:text-slate-200 text-[10px] px-1 cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Chat Circle Button */}
        <motion.button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              closeWelcomeTip();
            }
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          className={`pointer-events-auto relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 cursor-pointer ${
            isOpen 
              ? "bg-slate-900 hover:bg-slate-850 text-white ring-4 ring-slate-100" 
              : "bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white shadow-blue-500/30"
          }`}
          id="btn-online-support-chat"
        >
          {/* Pulse Green Ring to indicate online agent status */}
          {!isOpen && (
            <span className="absolute top-0 right-0 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white"></span>
            </span>
          )}

          {isOpen ? (
            <X className="w-6 h-6 animate-spin-once" />
          ) : (
            <MessageSquare className="w-6 h-6" />
          )}
        </motion.button>
      </div>

      {/* Expandable Chat Window Drawer Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9, x: 0 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-24 right-6 sm:right-6 z-50 w-[calc(100%-2rem)] sm:w-[380px] h-[540px] rounded-3xl bg-white shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden pointer-events-auto font-sans"
            id="online-support-chat-window"
          >
            {/* Header portion */}
            <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-950 p-4.5 text-white flex justify-between items-center shrink-0 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-sm relative shrink-0">
                  <Landmark className="w-5 h-5 text-sky-400" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-slate-900 rounded-full" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm tracking-tight flex items-center space-x-1.5">
                    <span>Hỗ Trợ Trực Tuyến 24/7</span>
                  </h4>
                  <p className="text-[10px] text-slate-300 font-light leading-none mt-0.5">Trợ lý ảo UBMTTQ Việt Nam Phường Phú Lợi</p>
                </div>
              </div>
              
              <button 
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center text-white/80 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Support Mode Tabs bar */}
            <div className="bg-slate-50 border-b border-slate-200 p-2 flex gap-1 shrink-0">
              <button
                onClick={() => setActiveTab("ai")}
                className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  activeTab === "ai"
                    ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 mr-1 text-sky-500" />
                <span>Trợ lý AI</span>
              </button>
              
              <button
                onClick={() => setActiveTab("officer")}
                className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  activeTab === "officer"
                    ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                <User className="w-3.5 h-3.5 mr-1 text-indigo-500" />
                <span>Gặp Cán Bộ</span>
              </button>

              <button
                onClick={() => setActiveTab("hotline")}
                className={`flex-1 flex items-center justify-center py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                  activeTab === "hotline"
                    ? "bg-white text-blue-700 shadow-sm border border-slate-200"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                <Phone className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                <span>Đường Dây Nóng</span>
              </button>
            </div>

            {/* Dynamic content window body */}
            <div className="flex-1 overflow-hidden relative flex flex-col bg-slate-50/50">
              
              {activeTab === "ai" && (
                <>
                  {/* Messages list for AI Virtual assistant */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3.5 min-h-0 text-xs scrollbar-thin">
                    <AnimatePresence initial={false}>
                      {messages.map((m) => (
                        <motion.div
                          key={m.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"} items-start space-x-2`}
                        >
                          {m.sender === "bot" && (
                            <div className="w-7 h-7 rounded-full bg-blue-100 border border-blue-200/50 flex items-center justify-center shrink-0">
                              <Landmark className="w-3.5 h-3.5 text-blue-700" />
                            </div>
                          )}
                          
                          <div className="flex flex-col space-y-0.5 max-w-[80%]">
                            <div className={`rounded-2xl px-3.5 py-2.5 text-[11px] sm:text-xs leading-relaxed whitespace-pre-wrap shadow-sm border ${
                              m.sender === "user"
                                ? "bg-blue-600 text-white rounded-tr-none border-blue-500 font-medium"
                                : "bg-white text-slate-800 rounded-tl-none border-slate-200"
                            }`}>
                              {m.text}
                            </div>
                            <span className="text-[9px] text-slate-400 font-medium tracking-tight px-1 self-start">
                              {m.timestamp}
                            </span>
                          </div>
                        </motion.div>
                      ))}

                      {loading && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex justify-start items-center space-x-2 text-[10px] text-slate-500 italic bg-white border border-slate-200 rounded-xl px-3 py-2 w-fit font-medium shadow-sm"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-sky-500 animate-spin" />
                          <span>An Sinh Số đang trả lời...</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>

                  {/* AI Quick suggestion replies */}
                  <div className="p-3 bg-white border-t border-slate-200 flex flex-wrap gap-1.5 shrink-0">
                    <span className="text-[9px] font-bold uppercase text-slate-400 tracking-wider w-full mb-1 flex items-center">
                      <Sparkles className="w-3 h-3 text-sky-500 mr-1 shrink-0 animate-pulse" />
                      Gợi ý câu hỏi nhanh:
                    </span>
                    {[
                      "Giờ làm việc UBND?",
                      "Địa chỉ Ủy ban Phường?",
                      "Nhận gạo hỗ trợ khó khăn?",
                      "Đại lý mua thẻ BHYT?"
                    ].map((txt, index) => (
                      <button
                        key={index}
                        onClick={() => handleSendMessage(txt)}
                        className="text-[10px] bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 rounded-full px-2.5 py-1 transition text-left cursor-pointer font-medium leading-normal"
                      >
                        {txt}
                      </button>
                    ))}
                  </div>

                  {/* Input form for AI conversation */}
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleSendMessage(input); }}
                    className="p-3 bg-white border-t border-slate-200 flex space-x-2 shrink-0"
                  >
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Hỏi về thủ tục, cứu trợ, bảo hiểm..."
                      className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white font-medium"
                      disabled={loading}
                    />
                    <button
                      type="submit"
                      disabled={loading || !input.trim()}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 text-white p-2.5 rounded-xl transition flex items-center justify-center shadow-sm cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </>
              )}

              {activeTab === "officer" && (
                <div className="flex-1 p-4.5 overflow-y-auto space-y-4 text-xs scrollbar-thin">
                  <div className="bg-indigo-50 border border-indigo-100 p-3.5 rounded-2xl space-y-1 text-slate-700 leading-relaxed shadow-sm">
                    <div className="flex items-center space-x-1.5 text-indigo-700 font-extrabold text-xs">
                      <User className="w-4 h-4" />
                      <span>Trực Ban Chăm Sóc Người Dân</span>
                    </div>
                    <p className="text-[11px] font-light">
                      Quý bà con có thể để lại số điện thoại và nội dung phản ánh hoặc yêu cầu trợ giúp. Cán bộ MTTQ Việt Nam Phường Phú Lợi sẽ nhận được thông tin tức thời và gọi điện lại hỗ trợ trực tiếp cho bà con.
                    </p>
                  </div>

                  <form onSubmit={handleOfficerSubmit} className="space-y-3">
                    <div className="space-y-1 text-left">
                      <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Họ và tên của bà con *</label>
                      <input
                        type="text"
                        value={officerName}
                        onChange={(e) => setOfficerName(e.target.value)}
                        placeholder="Ví dụ: Nguyễn Văn A"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
                        required
                        disabled={isSubmitted}
                      />
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Số điện thoại liên lạc *</label>
                      <input
                        type="tel"
                        value={officerPhone}
                        onChange={(e) => setOfficerPhone(e.target.value)}
                        placeholder="Ví dụ: 0912345678"
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-medium"
                        required
                        disabled={isSubmitted}
                      />
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider">Nội dung bà con cần hỗ trợ cụ thể *</label>
                      <textarea
                        value={officerContent}
                        onChange={(e) => setOfficerContent(e.target.value)}
                        placeholder="Hãy viết cụ thể mong muốn của bà con (ví dụ: Cần cán bộ hướng dẫn thủ tục gia hạn thẻ BHYT, phản ánh cây xanh ngã đổ, xin túi quà an sinh...)"
                        rows={3}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-light leading-normal"
                        required
                        disabled={isSubmitted}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitted}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold py-2.5 px-4 rounded-xl transition duration-150 flex items-center justify-center space-x-1.5 shadow-md cursor-pointer"
                    >
                      {isSubmitted ? (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span>Đã gửi thông tin thành công!</span>
                        </>
                      ) : (
                        <>
                          <PhoneCall className="w-4 h-4" />
                          <span>Gửi Yêu Cầu Gặp Cán Bộ</span>
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}

              {activeTab === "hotline" && (
                <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs scrollbar-thin">
                  <div className="bg-emerald-50 border border-emerald-100 p-3.5 rounded-2xl space-y-1 text-slate-700 leading-relaxed shadow-sm">
                    <div className="flex items-center space-x-1.5 text-emerald-700 font-extrabold text-xs">
                      <ShieldAlert className="w-4 h-4 text-emerald-600" />
                      <span>Đường Dây Nóng Khẩn Cấp</span>
                    </div>
                    <p className="text-[11px] font-light">
                      Trong trường hợp khẩn cấp, thiên tai, tai nạn hoặc cần báo cáo an ninh trật tự, bà con có thể bấm gọi trực tiếp các số điện thoại dưới đây của Ủy ban MTTQ/Công an Phường Phú Lợi:
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {hotlines.map((h, idx) => (
                      <div 
                        key={idx}
                        className="bg-white border border-slate-200 rounded-2xl p-3 flex justify-between items-center hover:border-emerald-200 transition duration-150 shadow-sm"
                      >
                        <div className="space-y-0.5 text-left pr-2">
                          <h5 className="font-extrabold text-xs text-slate-800 leading-tight">{h.name}</h5>
                          <p className="text-[10px] text-slate-400 font-light leading-tight">{h.desc}</p>
                        </div>
                        <a 
                          href={`tel:${h.phone.replace(/[^0-9]/g, "")}`}
                          className="bg-emerald-100 hover:bg-emerald-500 text-emerald-700 hover:text-white px-3 py-2 rounded-xl text-xs font-bold transition flex items-center shrink-0 border border-emerald-200/50 cursor-pointer"
                        >
                          <Phone className="w-3.5 h-3.5 mr-1" />
                          <span>Gọi</span>
                        </a>
                      </div>
                    ))}
                  </div>

                  <div className="text-center text-[10px] text-slate-400 py-2">
                    - Ủy ban MTTQ Việt Nam Phường Phú Lợi đồng hành cùng nhân dân -
                  </div>
                </div>
              )}

            </div>
            
            {/* Footer notice bar */}
            <div className="bg-slate-100 p-2.5 text-center text-[9px] text-slate-400 border-t border-slate-200/60 shrink-0 font-medium">
              Bảo mật tuyệt đối • Kết nối an sinh số quốc gia
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
