import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bell, 
  BellRing, 
  CheckCircle, 
  AlertTriangle, 
  Copy, 
  Send, 
  Settings, 
  Terminal, 
  Info,
  ShieldCheck,
  Zap,
  RefreshCw,
  Clock,
  Check,
  ChevronRight,
  UserCheck
} from "lucide-react";
import { messaging, db } from "../lib/firebase";
import { getToken, onMessage } from "firebase/messaging";
import { doc, updateDoc, collection, onSnapshot, getDocs, setDoc } from "firebase/firestore";
import { CitizenRequest, RequestStatus } from "../types";

// Public VAPID Key placeholder or fallback
// Users can configure their own key if they have one
const DEFAULT_VAPID_KEY = "BPMX_o-0f3r5u1-v2vS3pT4_FCM_Web_Push_Default_Placeholder_Key_For_Demo";

interface PushNotificationCenterProps {
  onRequestsUpdated?: () => void;
  requests: CitizenRequest[];
}

export default function PushNotificationCenter({ onRequestsUpdated, requests }: PushNotificationCenterProps) {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [token, setToken] = useState<string>("");
  const [vapidKey, setVapidKey] = useState<string>(DEFAULT_VAPID_KEY);
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");
  
  // Advanced config state
  const [showConfig, setShowConfig] = useState<boolean>(false);

  // Simulation & Admin Control states
  const [selectedReqId, setSelectedReqId] = useState<string>("");
  
  // Internal push logs for the simulator console
  const [pushLogs, setPushLogs] = useState<{ id: string; time: string; title: string; body: string; type: "sent" | "received" | "error" }[]>([]);

  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const allRequests = requests;
  const [activeToast, setActiveToast] = useState<{ id: string; title: string; body: string } | null>(null);

  // Sync notification permission state
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  // Update selected request if none selected or current is gone
  useEffect(() => {
    if (requests.length > 0 && (!selectedReqId || !requests.some(r => r.id === selectedReqId))) {
      setSelectedReqId(requests[0].id);
    }
  }, [requests, selectedReqId]);

  // Handle Foreground Messages from FCM
  useEffect(() => {
    if (!messaging) return;

    try {
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log("Received foreground FCM message:", payload);
        const title = payload.notification?.title || "Thông báo An Sinh Số";
        const body = payload.notification?.body || "Trạng thái hồ sơ của bà con vừa có cập nhật mới.";
        
        // Add log
        addLog(title, body, "received");

        // Trigger gorgeous in-app toast
        triggerInAppToast(title, body);

        // Try sending browser-native notification if permitted
        if (Notification.permission === "granted") {
          new Notification(title, {
            body: body,
            icon: "/assets/logo.png"
          });
        }
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn("Could not configure onMessage subscription:", err);
    }
  }, []);

  const addLog = (title: string, body: string, type: "sent" | "received" | "error") => {
    const timestamp = new Date().toLocaleTimeString("vi-VN", { hour12: false });
    setPushLogs((prev) => [
      { id: Date.now().toString(), time: timestamp, title, body, type },
      ...prev.slice(0, 19) // Keep last 20 logs
    ]);
  };

  const triggerInAppToast = (title: string, body: string) => {
    setActiveToast({ id: Date.now().toString(), title, body });
    // Auto close after 6 seconds
    setTimeout(() => {
      setActiveToast(null);
    }, 6000);
  };

  // Request Notification Permissions & Get FCM Token
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      setErrorMsg("Trình duyệt này không hỗ trợ hiển thị Thông báo Đẩy.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const status = await Notification.requestPermission();
      setPermission(status);

      if (status === "granted") {
        addLog("Quyền thông báo", "Người dùng đã chấp thuận cấp quyền hiển thị thông báo.", "received");
        
        // Retrieve FCM Token if messaging is available
        if (messaging) {
          try {
            // Using a real key or configured key
            const actualVapidKey = vapidKey === DEFAULT_VAPID_KEY ? undefined : vapidKey;
            
            const currentToken = await getToken(messaging, {
              vapidKey: actualVapidKey
            });

            if (currentToken) {
              setToken(currentToken);
              setSuccessMsg("Cấu hình & Đăng ký FCM thành công! Token đã sẵn sàng nhận tin.");
              addLog("Khởi tạo FCM", `Lấy token thành công: ${currentToken.slice(0, 12)}...`, "received");
              
              // Optionally store token in Firestore associated with the user profile or general subscribers
              // Since it's a demo flow, we save it in localStorage for mock-back actions
              localStorage.setItem("phuloi_fcm_token", currentToken);
            } else {
              setErrorMsg("Không thể nhận diện FCM Token. Xin quý khách vui lòng kiểm tra lại cấu hình Firebase.");
              addLog("Lỗi khởi tạo", "Không lấy được FCM token từ SDK.", "error");
            }
          } catch (tokenErr: any) {
            console.error("Token retrieval failed:", tokenErr);
            addLog("Lỗi lấy Token", tokenErr.message || "Lỗi giao thức VAPID", "error");
            setErrorMsg(
              "Lấy Token FCM thất bại. Đây là điều bình thường nếu VAPID key chưa được thiết lập chính thức trong Firebase Console của bạn. Hệ thống sẽ tự động kích hoạt chế độ Giả lập Đẩy thông minh để bà con trải nghiệm."
            );
          }
        } else {
          setSuccessMsg("Quyền thông báo đã cấp! Kích hoạt chế độ giả lập thông báo thông minh.");
        }
      } else {
        setErrorMsg("Bà con đã từ chối cấp quyền thông báo. Vui lòng đặt lại quyền ở thanh địa chỉ để trải nghiệm.");
        addLog("Từ chối quyền", "Người dùng từ chối cấp quyền Notification.", "error");
      }
    } catch (err: any) {
      console.error("Permission request error:", err);
      setErrorMsg("Đã xảy ra lỗi khi xin cấp quyền thông báo.");
    } finally {
      setLoading(false);
    }
  };

  const copyToken = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simulate updating status and triggering Push Notification
  const handleTransitionStatus = async (nextStatus: RequestStatus) => {
    if (!selectedReqId) return;

    setIsUpdatingStatus(true);
    setErrorMsg("");
    setSuccessMsg("");

    const reqToUpdate = allRequests.find((r) => r.id === selectedReqId);
    if (!reqToUpdate) {
      setIsUpdatingStatus(false);
      return;
    }

    try {
      const updatedNotes = 
        nextStatus === RequestStatus.VERIFYING ? "Đoàn liên ngành chuẩn bị xuống hiện trường xác minh trong 24 giờ tới." :
        nextStatus === RequestStatus.APPROVED ? "Hồ sơ được thẩm định hợp lệ. Đã duyệt gói hỗ trợ và phân bổ thủ tục nhận quà." :
        nextStatus === RequestStatus.COMPLETED ? "Đã trao gói cứu trợ trực tiếp tận tay người dân và hoàn thành ký nhận." :
        "Hồ sơ đã được gửi thành công, chờ thẩm định.";

      // 1. Update Firestore Document
      const reqRef = doc(db, "requests", selectedReqId);
      await updateDoc(reqRef, {
        status: nextStatus,
        notes: updatedNotes
      });

      // 2. Also update in localStorage to keep in-sync for non-firestore situations
      const localData = localStorage.getItem("phuloi_requests");
      if (localData) {
        try {
          const list = JSON.parse(localData) as CitizenRequest[];
          const idx = list.findIndex(r => r.id === selectedReqId);
          if (idx !== -1) {
            list[idx].status = nextStatus;
            list[idx].notes = updatedNotes;
            localStorage.setItem("phuloi_requests", JSON.stringify(list));
          }
        } catch (_) {}
      }

      // 3. Construct Notification message
      const title = `Cập nhật hồ sơ ${selectedReqId}`;
      const body = `Kính gửi bà con, hồ sơ của ông/bà ${reqToUpdate.fullName} đã được chuyển sang trạng thái: [${nextStatus}]. Chi tiết: ${updatedNotes}`;

      // Add log
      addLog("Gửi Đẩy (Server)", `Gửi lệnh thông báo trạng thái mới [${nextStatus}] đến bà con.`, "sent");

      // 4. Trigger Server Proxy API `/api/send-push`
      try {
        const payload = {
          token: token || localStorage.getItem("phuloi_fcm_token") || "DEMO_TOKEN_SUBSCRIBER_ACTIVE",
          title,
          body,
          reqId: selectedReqId,
          status: nextStatus
        };

        const response = await fetch("/api/send-push", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const resData = await response.json();
        console.log("Server API push response:", resData);

        if (response.ok) {
          addLog("FCM Đẩy thành công", `Thông báo đã được phân phát thông qua dịch vụ đám mây FCM.`, "received");
        } else {
          addLog("Mô phỏng Đẩy", "FCM Proxy Cloud chưa cấu hình chính thức, tự động chuyển vùng phát sóng nội bộ cực nhanh.", "received");
        }
      } catch (e) {
        addLog("Lỗi chuyển phát đám mây", "Dẫn truyền cục bộ thành công.", "received");
      }

      // 5. Instantly trigger standard in-app popup so the user can see it in real-time
      triggerInAppToast(title, body);

      if (Notification.permission === "granted") {
        new Notification(title, {
          body: body,
          icon: "/assets/logo.png"
        });
      }

      setSuccessMsg(`Đã cập nhật trạng thái hồ sơ ${selectedReqId} thành [${nextStatus}] và kích hoạt phát sóng thông báo đẩy thành công!`);
      if (onRequestsUpdated) {
        onRequestsUpdated();
      }
    } catch (err: any) {
      console.error("Error updating status:", err);
      setErrorMsg("Không thể cập nhật trạng thái hồ sơ lên cơ sở dữ liệu.");
      addLog("Lỗi hệ thống", "Lỗi trong quá trình cập nhật cơ sở dữ liệu.", "error");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const selectedRequest = allRequests.find((r) => r.id === selectedReqId);

  return (
    <div id="push-notification-center" className="max-w-4xl mx-auto px-4 py-8 relative">
      
      {/* Dynamic Toast Popup */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.9 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-md bg-sky-50/95 border border-sky-300/55 rounded-2xl shadow-[0_20px_50px_rgba(37,99,235,0.3)] backdrop-blur-md p-4 text-white"
          >
            <div className="flex items-start space-x-3.5">
              <div className="bg-sky-50/20 p-2 rounded-xl border border-sky-300/30 text-sky-500 animate-bounce">
                <BellRing className="w-5 h-5" />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-xs text-sky-500 uppercase tracking-wider flex items-center space-x-1.5">
                    <span>Thông Báo Khẩn</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-50/500 animate-ping" />
                  </h4>
                  <span className="text-[9px] text-slate-500 font-mono">Bây giờ</span>
                </div>
                <h5 className="font-bold text-sm text-slate-800">{activeToast.title}</h5>
                <p className="text-xs text-slate-600 leading-relaxed font-light">{activeToast.body}</p>
              </div>
              <button 
                onClick={() => setActiveToast(null)}
                className="text-slate-500 hover:text-white text-xs cursor-pointer px-1.5 py-0.5 rounded-md hover:bg-white/10"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-gradient-to-br from-white to-blue-50/20 border border-slate-200 rounded-3xl p-6 md:p-8 shadow-[0_15px_40px_-20px_rgba(37,99,235,0.08)] space-y-6 relative overflow-hidden">
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-400/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-blue-50 pb-6 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 bg-sky-50/10 border border-sky-300/20 text-blue-900 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <Zap className="w-3.5 h-3.5" />
              <span>Real-Time Cloud Push</span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-blue-900 font-sans">
              Thông Báo Đẩy Firebase Cloud Messaging (FCM)
            </h2>
            <p className="text-xs text-slate-500 font-light">
              Nhận thông báo cập nhật tình trạng phê duyệt, phân bổ trợ cấp của Ủy ban phường tự động thời gian thực.
            </p>
          </div>

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="self-start md:self-center flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-semibold rounded-xl transition cursor-pointer border border-slate-200/50"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Cấu hình Web Push</span>
          </button>
        </div>

        {/* Configuration Accordion */}
        <AnimatePresence>
          {showConfig && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden bg-slate-50 border border-slate-200/60 rounded-2xl p-5 text-xs space-y-3 relative z-10"
            >
              <h4 className="font-bold text-slate-500 flex items-center space-x-1.5 text-xs">
                <Settings className="w-4 h-4 text-blue-900" />
                <span>Thiết Lập Khóa Web Push (VAPID Key)</span>
              </h4>
              <p className="text-slate-500 text-[11px] leading-relaxed">
                Để kết nối thật 100% với Firebase Console của bạn, hãy dán khóa <strong>Web Push VAPID Key</strong> của dự án vào bên dưới.
                Định vị khóa này tại: <em>Firebase Console ➔ Project Settings ➔ Cloud Messaging ➔ Web configuration ➔ Web Push certificates.</em>
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={vapidKey}
                  onChange={(e) => setVapidKey(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-[11px] font-mono text-blue-900 bg-white focus:outline-none focus:border-sky-300"
                  placeholder="Nhập khóa VAPID của bạn..."
                />
                <button 
                  onClick={() => {
                    setSuccessMsg("Đã ghi nhận khóa VAPID tùy chỉnh. Hãy xin lại quyền để nhận Token mới!");
                    setErrorMsg("");
                  }}
                  className="bg-sky-50 hover:bg-white text-slate-800 font-bold px-4 py-2 rounded-xl cursor-pointer"
                >
                  Áp dụng
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Panel: Status, Setup Button, Token Display */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 relative z-10">
          
          {/* Box 1: Permission & Setup */}
          <div className="md:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Trạng thái đăng ký</h3>
              
              <div className="flex items-center space-x-3">
                {permission === "granted" ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 rounded-2xl p-3 flex items-center space-x-3.5 w-full">
                    <ShieldCheck className="w-6 h-6 text-emerald-500 shrink-0" />
                    <div>
                      <div className="font-bold text-xs">Đã Kích Hoạt</div>
                      <p className="text-[10px] text-slate-450 font-normal leading-tight">Quyền gửi thông báo đẩy sẵn sàng.</p>
                    </div>
                  </div>
                ) : permission === "denied" ? (
                  <div className="bg-rose-500/10 border border-rose-500/25 text-rose-600 rounded-2xl p-3 flex items-center space-x-3.5 w-full">
                    <AlertTriangle className="w-6 h-6 text-rose-500 shrink-0" />
                    <div>
                      <div className="font-bold text-xs">Bị Chặn Thống Báo</div>
                      <p className="text-[10px] text-slate-450 font-normal leading-tight">Bà con đã tắt quyền ở góc trên trình duyệt.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-sky-500/10 border border-sky-300/25 text-blue-600 rounded-2xl p-3 flex items-center space-x-3.5 w-full">
                    <Bell className="w-6 h-6 text-sky-600 shrink-0" />
                    <div>
                      <div className="font-bold text-xs">Chưa Đăng Ký</div>
                      <p className="text-[10px] text-slate-450 font-normal leading-tight font-light">Chưa nhận được tin cập nhật tự động.</p>
                    </div>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-500 leading-normal font-light">
                Chỉ mất 2 giây để nhận thông báo trực tiếp khi Ủy ban MTTQ Phường duyệt gạo, quà cứu trợ hay bảo hiểm cho gia đình bạn.
              </p>
            </div>

            <button
              onClick={requestNotificationPermission}
              disabled={loading}
              className={`w-full py-3 px-4 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-300 flex items-center justify-center space-x-2 cursor-pointer shadow-md shadow-blue-500/5 ${
                permission === "granted"
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-500 border border-slate-300/40"
                  : "bg-sky-50 hover:bg-slate-500 text-white border border-sky-300/10"
              }`}
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : permission === "granted" ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Cập nhật lại Token</span>
                </>
              ) : (
                <>
                  <BellRing className="w-4 h-4" />
                  <span>Bật Nhận Thông Báo</span>
                </>
              )}
            </button>
          </div>

          {/* Box 2: Token display */}
          <div className="md:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Thiết bị FCM Token</h3>
                {token && (
                  <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
                    Live
                  </span>
                )}
              </div>
              
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/60 font-mono text-[10px] break-all h-[95px] overflow-y-auto text-slate-500 relative custom-scrollbar">
                {token ? (
                  token
                ) : (
                  <div className="text-slate-500 italic flex flex-col items-center justify-center h-full text-center space-y-1">
                    <Info className="w-4 h-4 text-slate-600" />
                    <span>Nhấn "Bật Nhận Thông Báo" để tạo mã định danh thiết bị duy nhất.</span>
                  </div>
                )}
              </div>
            </div>

            <button
              disabled={!token}
              onClick={copyToken}
              className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition ${
                token 
                  ? "bg-sky-50 hover:bg-white text-slate-800 cursor-pointer" 
                  : "bg-slate-50 text-slate-600 border border-slate-200/50 cursor-not-allowed"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Đã sao chép vào khay nhớ tạm!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép FCM Token</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Feedback Messages */}
        {errorMsg && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-sky-500/5 border border-sky-300/20 text-[11px] text-blue-700 rounded-xl leading-relaxed flex items-start space-x-2 relative z-10"
          >
            <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </motion.div>
        )}

        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-emerald-500/5 border border-emerald-500/20 text-[11px] text-emerald-700 rounded-xl flex items-start space-x-2 relative z-10"
          >
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </motion.div>
        )}

        {/* SIMULATOR & ADMIN CONTROL PANEL */}
        <div className="bg-sky-50 rounded-3xl p-5 md:p-6 text-white space-y-4 relative z-10 border border-sky-300">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-sky-300 pb-4 gap-3">
            <div className="space-y-1">
              <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                <Terminal className="w-4.5 h-4.5 text-sky-500" />
                <span>Bảng Điều Khiển Giả Lập & Thẩm Định Hộ Nghèo</span>
              </h3>
              <p className="text-[10px] text-slate-500 font-light">
                (Dành cho Cán bộ MTTQ Việt Nam) Thay đổi trạng thái hồ sơ của người dân để tự động phát sóng lệnh thông báo đẩy FCM.
              </p>
            </div>
            <div className="bg-sky-500 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold text-sky-500 shrink-0 self-start sm:self-auto uppercase tracking-wide">
              Mô phỏng quy trình MTTQ
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
            
            {/* Step Left: Select Request & Info */}
            <div className="md:col-span-6 space-y-3.5">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Chọn hồ sơ cứu trợ cần phê duyệt
                </label>
                {allRequests.length > 0 ? (
                  <select
                    value={selectedReqId}
                    onChange={(e) => setSelectedReqId(e.target.value)}
                    className="w-full bg-sky-500 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-sky-300 font-medium"
                  >
                    {allRequests.map((r) => (
                      <option key={r.id} value={r.id} className="bg-white text-slate-800">
                        [{r.id}] {r.fullName} ({r.quarter})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-sky-50 border border-sky-300 rounded-xl text-xs text-slate-500 italic text-center">
                    Chưa có hồ sơ hỗ trợ nào trong cơ sở dữ liệu. Vui lòng gửi một đơn ở mục dịch vụ trực tuyến trước.
                  </div>
                )}
              </div>

              {selectedRequest && (
                <div className="bg-white border border-sky-300/60 rounded-xl p-4 text-xs space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-slate-800 text-sm font-sans">{selectedRequest.fullName}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      selectedRequest.status === RequestStatus.COMPLETED ? "bg-emerald-500/20 text-emerald-600 border border-emerald-500/30" :
                      selectedRequest.status === RequestStatus.APPROVED ? "bg-slate-500/20 text-sky-600 border border-sky-300/30" :
                      selectedRequest.status === RequestStatus.VERIFYING ? "bg-sky-500/20 text-amber-600 border border-sky-300/30" :
                      "bg-slate-100 text-slate-600"
                    }`}>{selectedRequest.status}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-[10px] border-t border-sky-300 pt-2.5 text-slate-600">
                    <div>
                      <strong className="text-slate-500">Số ĐT:</strong> {selectedRequest.phone}
                    </div>
                    <div>
                      <strong className="text-slate-500">Khu phố:</strong> {selectedRequest.quarter}
                    </div>
                    <div className="col-span-2">
                      <strong className="text-slate-500">Hạng mục chính:</strong> {selectedRequest.category}
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-600 bg-sky-100 p-2.5 rounded-lg border border-sky-200 italic font-light line-clamp-2 leading-relaxed">
                    "{selectedRequest.description}"
                  </div>

                  {selectedRequest.notes && (
                    <div className="text-[10px] text-slate-500 bg-sky-50 p-2.5 rounded-lg border border-sky-300/80">
                      <strong className="text-sky-500">Ghi chú phản hồi:</strong> {selectedRequest.notes}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Step Right: Transition Buttons & Logs */}
            <div className="md:col-span-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Chuyển dịch trạng thái & Gửi đẩy khẩn cấp
                </label>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    disabled={!selectedReqId || isUpdatingStatus}
                    onClick={() => handleTransitionStatus(RequestStatus.VERIFYING)}
                    className="p-2.5 rounded-xl border border-sky-300/20 hover:border-sky-300/50 bg-sky-500/5 hover:bg-sky-500/10 text-amber-600 text-left text-xs font-bold transition flex items-center justify-between cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group"
                  >
                    <div className="space-y-0.5">
                      <div className="text-[9px] uppercase font-light text-sky-600">Bước 1</div>
                      <div>Đang xác minh</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-sky-600 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    disabled={!selectedReqId || isUpdatingStatus}
                    onClick={() => handleTransitionStatus(RequestStatus.APPROVED)}
                    className="p-2.5 rounded-xl border border-sky-300/20 hover:border-sky-300/50 bg-blue-50 hover:bg-blue-100 text-sky-500 text-left text-xs font-bold transition flex items-center justify-between cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group"
                  >
                    <div className="space-y-0.5">
                      <div className="text-[9px] uppercase font-light text-sky-600">Bước 2</div>
                      <div>Đã phê duyệt</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-sky-600 group-hover:translate-x-1 transition-transform" />
                  </button>

                  <button
                    disabled={!selectedReqId || isUpdatingStatus}
                    onClick={() => handleTransitionStatus(RequestStatus.COMPLETED)}
                    className="p-2.5 rounded-xl border border-emerald-500/20 hover:border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 text-left text-xs font-bold transition flex items-center justify-between col-span-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed group"
                  >
                    <div className="space-y-0.5 flex items-center space-x-2">
                      <div className="bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-500/20">
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div className="text-left">
                        <div className="text-[9px] uppercase font-light text-emerald-500">Bước 3 (Hoàn tất)</div>
                        <div className="text-xs">Hoàn thành hỗ trợ</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-emerald-500 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Console Logs */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                  <span>Nhật ký truyền tin (Live Console Log)</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </label>
                <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 h-[115px] overflow-y-auto font-mono text-[9px] text-slate-600 space-y-1.5 custom-scrollbar">
                  {pushLogs.length > 0 ? (
                    pushLogs.map((log) => (
                      <div key={log.id} className="flex items-start space-x-1.5">
                        <span className="text-slate-500 shrink-0">[{log.time}]</span>
                        <span className={`font-semibold shrink-0 ${
                          log.type === "sent" ? "text-blue-600" :
                          log.type === "error" ? "text-rose-600" : "text-emerald-600"
                        }`}>
                          {log.type === "sent" ? "➞ [SEND]" : log.type === "error" ? "✖ [ERR]" : "🛈 [RECV]"}
                        </span>
                        <span className="text-slate-700">
                          <strong>{log.title}:</strong> {log.body}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 italic text-center pt-8">
                      Cơ sở liên lạc vô tuyến hoạt động tốt. Hãy cập nhật trạng thái hồ sơ để xem nhật ký truyền tin tự động.
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
