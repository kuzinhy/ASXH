import React, { useState } from "react";
import { 
  X, Mail, Lock, User, Phone, MapPin, LogIn, UserPlus, ShieldAlert, CheckCircle2, Copy, Check, ExternalLink 
} from "lucide-react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db, firebaseConfig } from "../lib/firebase";
import { UserProfile } from "../types";
import { QUARTERS_LIST } from "../constants";


const FIRESTORE_RULES_CONTENT = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 1. Global Safety Net
    match /{document=**} {
      allow read, write: if false;
    }

    // Helper functions
    function isSignedIn() {
      return request.auth != null;
    }

    function isValidId(id) {
      return id is string && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\\\-]+$');
    }

    // Validate UserProfile
    function isValidUser(data) {
      return data.keys().hasAll(['uid', 'email', 'fullName', 'phone', 'address', 'quarter'])
        && (data.keys().size() >= 6 && data.keys().size() <= 12)
        && data.uid is string && data.uid.size() <= 128
        && data.email is string && data.email.size() <= 300
        && data.fullName is string && data.fullName.size() <= 200
        && data.phone is string && data.phone.size() <= 100
        && data.address is string && data.address.size() <= 500
        && data.quarter is string && data.quarter.size() <= 100
        && (!data.keys().hasAll(['isVolunteer']) || data.isVolunteer is bool)
        && (!data.keys().hasAll(['volunteerQuarters']) || (data.volunteerQuarters is list && (data.volunteerQuarters.size() == 0 || data.volunteerQuarters[0] is string)))
        && (!data.keys().hasAll(['isAdmin']) || data.isAdmin is bool)
        && (!data.keys().hasAll(['isOfficer']) || data.isOfficer is bool)
        && (!data.keys().hasAll(['officerQuarter']) || (data.officerQuarter is string && data.officerQuarter.size() <= 100));
    }

    // Validate Campaign
    function isValidCampaign(data) {
      return data.keys().hasAll(['id', 'title', 'description', 'targetAmount', 'currentAmount', 'category'])
        && data.keys().size() == 6
        && data.id is string && data.id.size() <= 128
        && data.title is string && data.title.size() <= 200
        && data.description is string && data.description.size() <= 2000
        && (data.targetAmount is int || data.targetAmount is float)
        && (data.currentAmount is int || data.currentAmount is float)
        && data.category is string && data.category.size() <= 100;
    }

    // Validate JobListing
    function isValidJob(data) {
      return data.keys().hasAll(['id', 'title', 'company', 'salary', 'location', 'description', 'requirements', 'contact'])
        && data.keys().size() == 8
        && data.id is string && data.id.size() <= 128
        && data.title is string && data.title.size() <= 200
        && data.company is string && data.company.size() <= 200
        && data.salary is string && data.salary.size() <= 100
        && data.location is string && data.location.size() <= 500
        && data.description is string && data.description.size() <= 2000
        && data.requirements is list && data.requirements.size() <= 20 && (data.requirements.size() == 0 || data.requirements[0] is string)
        && data.contact is string && data.contact.size() <= 200;
    }

    // Validate CitizenRequest
    function isValidRequest(data) {
      return data.keys().hasAll(['id', 'fullName', 'phone', 'address', 'quarter', 'category', 'description', 'status', 'createdAt'])
        && data.keys().size() >= 9 && data.keys().size() <= 12
        && data.id is string && data.id.size() <= 128
        && data.fullName is string && data.fullName.size() <= 200
        && data.phone is string && data.phone.size() <= 100
        && data.address is string && data.address.size() <= 500
        && data.quarter is string && data.quarter.size() <= 100
        && data.category is string && data.category.size() <= 100
        && data.description is string && data.description.size() <= 2000
        && data.status is string && data.status.size() <= 100
        && data.createdAt is string && data.createdAt.size() <= 100
        && (!data.keys().hasAll(['notes']) || (data.notes is string && data.notes.size() <= 2000))
        && (!data.keys().hasAll(['userId']) || (data.userId is string && data.userId.size() <= 128))
        && (!data.keys().hasAll(['email']) || (data.email is string && data.email.size() <= 300));
    }

    // Validate Donation
    function isValidDonation(data) {
      return data.keys().hasAll(['id', 'donorName', 'amount', 'campaignTitle', 'message', 'createdAt'])
        && (data.keys().size() == 6 || data.keys().size() == 7)
        && data.id is string && data.id.size() <= 128
        && data.donorName is string && data.donorName.size() <= 200
        && (data.amount is int || data.amount is float) && data.amount > 0
        && data.campaignTitle is string && data.campaignTitle.size() <= 200
        && data.message is string && data.message.size() <= 2000
        && data.createdAt is string && data.createdAt.size() <= 100
        && (!data.keys().hasAll(['userId']) || (data.userId is string && data.userId.size() <= 128));
    }

    // Match users
    match /users/{userId} {
      allow get: if isSignedIn() && request.auth.uid == userId;
      allow create: if isSignedIn() && request.auth.uid == userId && isValidUser(request.resource.data)
        && (!request.resource.data.keys().hasAll(['isAdmin']) || request.resource.data.isAdmin == false)
        && (!request.resource.data.keys().hasAll(['isOfficer']) || request.resource.data.isOfficer == false);
      allow update: if isSignedIn() && request.auth.uid == userId && isValidUser(request.resource.data)
        && (
          !request.resource.data.keys().hasAll(['isAdmin']) || 
          (resource.data.keys().hasAll(['isAdmin']) && request.resource.data.isAdmin == resource.data.isAdmin) ||
          (!resource.data.keys().hasAll(['isAdmin']) && request.resource.data.isAdmin == false)
        )
        && (
          !request.resource.data.keys().hasAll(['isOfficer']) || 
          (resource.data.keys().hasAll(['isOfficer']) && request.resource.data.isOfficer == resource.data.isOfficer) ||
          (!request.resource.data.keys().hasAll(['isOfficer']) && request.resource.data.isOfficer == false)
        );
      allow list: if false;
      allow delete: if false;
    }

    // Match campaigns
    match /campaigns/{campaignId} {
      allow read: if true;
      allow create: if isValidCampaign(request.resource.data);
      allow update: if isValidCampaign(request.resource.data);
      allow delete: if false;
    }

    // Match jobs
    match /jobs/{jobId} {
      allow read: if true;
      allow create: if isValidJob(request.resource.data);
      allow update: if isValidJob(request.resource.data);
      allow delete: if false;
    }

    // Match requests
    match /requests/{requestId} {
      allow read: if true;
      allow create: if isValidRequest(request.resource.data);
      allow update: if isValidRequest(request.resource.data);
      allow delete: if false;
    }

    // Match donations
    match /donations/{donationId} {
      allow read: if true;
      allow create: if isValidDonation(request.resource.data);
      allow update: if isValidDonation(request.resource.data);
      allow delete: if false;
    }
  }
}`;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
}

export default function AuthModal({ isOpen, onClose, onAuthSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Extra fields for Register
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [quarter, setQuarter] = useState(QUARTERS_LIST[0].name);
  const [customQuarter, setCustomQuarter] = useState("");

  const [rememberMe, setRememberMe] = useState(() => {
    try {
      const cached = localStorage.getItem("phuloi_remember_me");
      return cached !== "false"; // Default to true
    } catch {
      return true;
    }
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [unauthorizedDomain, setUnauthorizedDomain] = useState<string | null>(null);
  const [copiedDomain, setCopiedDomain] = useState<string | null>(null);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [copiedRules, setCopiedRules] = useState<boolean>(false);

  // Pre-fill credentials if saved
  React.useEffect(() => {
    if (isOpen) {
      try {
        const cached = localStorage.getItem("phuloi_cached_creds");
        if (cached) {
          const { email: cachedEmail, password: cachedPassword } = JSON.parse(cached);
          if (cachedEmail) setEmail(cachedEmail);
          if (cachedPassword) setPassword(cachedPassword);
        }
      } catch (err) {
        console.warn("Failed to load cached credentials:", err);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const translateAuthError = (code: string) => {
    switch (code) {
      case "auth/email-already-in-use":
        return "Email này đã được sử dụng bởi tài khoản khác.";
      case "auth/invalid-email":
        return "Địa chỉ email không hợp lệ.";
      case "auth/weak-password":
        return "Mật khẩu quá yếu (yêu cầu ít nhất 6 ký tự).";
      case "auth/wrong-password":
      case "auth/user-not-found":
      case "auth/invalid-credential":
        return "Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.";
      case "auth/network-request-failed":
        return "Lỗi kết nối mạng. Vui lòng thử lại sau.";
      case "auth/operation-not-allowed":
        return "Lỗi hệ thống: Phương thức đăng nhập bằng Google (Gmail) chưa được bật trong dự án Firebase của bạn. Vui lòng truy cập Firebase Console -> Authentication -> Sign-in method -> chọn Google và nhấn 'Enable' để kích hoạt.";
      case "auth/unauthorized-domain":
        return `Lỗi hệ thống: Tên miền hiện tại (${window.location.hostname}) chưa được cấp quyền trong dự án Firebase của bạn. Vui lòng truy cập Firebase Console -> Authentication -> Settings -> Authorized domains -> nhấp 'Add domain' và thêm tên miền: ${window.location.hostname}`;
      case "auth/popup-blocked":
        return "Trình duyệt đã chặn cửa sổ đăng nhập Google (Popup blocked). Vui lòng cho phép bật cửa sổ popup trên trình duyệt của bạn để hoàn tất.";
      case "unavailable":
        return "Lỗi kết nối máy chủ Firestore (unavailable). Có thể bạn chưa khởi tạo Cơ sở dữ liệu Firestore trong Firebase Console (hoặc do mạng bị chặn). Vui lòng vào Firebase Console -> Firestore Database -> Tạo cơ sở dữ liệu (Create database).";
      default:
        return `Đã xảy ra lỗi hệ thống khi xác thực (${code}). Vui lòng thử lại hoặc kiểm tra bảng điều khiển (Console) trình duyệt để biết chi tiết lỗi.`;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setUnauthorizedDomain(null);
    setPermissionDenied(false);

    try {
      if (isLogin) {
        // Sign In
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;
        
        // Handle local storage caching based on rememberMe
        if (rememberMe) {
          localStorage.setItem("phuloi_remember_me", "true");
          localStorage.setItem("phuloi_cached_creds", JSON.stringify({ email, password }));
          sessionStorage.removeItem("phuloi_cached_creds");
        } else {
          localStorage.setItem("phuloi_remember_me", "false");
          localStorage.removeItem("phuloi_cached_creds");
          sessionStorage.setItem("phuloi_cached_creds", JSON.stringify({ email, password }));
        }

        // Fetch profile from Firestore
        const userDocRef = doc(db, "users", uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const profile = userDoc.data() as UserProfile;
          onAuthSuccess(profile);
          setSuccessMessage("Đăng nhập thành công!");
          setTimeout(() => {
            onClose();
            // Reset states
            setEmail("");
            setPassword("");
          }, 1200);
        } else {
          // Fallback if profile doesn't exist in Firestore
          const fallbackProfile: UserProfile = {
            uid,
            email: userCredential.user.email || email,
            fullName: email.split("@")[0],
            phone: "",
            address: "Phú Lợi, Thành phố Hồ Chí Minh",
            quarter: QUARTERS_LIST[0].name
          };
          onAuthSuccess(fallbackProfile);
          setSuccessMessage("Đăng nhập thành công!");
          setTimeout(() => {
            onClose();
          }, 1200);
        }
      } else {
        // Register
        if (!fullName.trim() || !phone.trim() || !address.trim()) {
          throw new Error("Vui lòng điền đầy đủ tất cả thông tin đăng ký.");
        }
        if (!/^[0-9]{10}$/.test(phone.trim())) {
          throw new Error("Số điện thoại không hợp lệ (yêu cầu đúng 10 số).");
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const uid = userCredential.user.uid;

        // Handle local storage caching based on rememberMe
        if (rememberMe) {
          localStorage.setItem("phuloi_remember_me", "true");
          localStorage.setItem("phuloi_cached_creds", JSON.stringify({ email, password }));
          sessionStorage.removeItem("phuloi_cached_creds");
        } else {
          localStorage.setItem("phuloi_remember_me", "false");
          localStorage.removeItem("phuloi_cached_creds");
          sessionStorage.setItem("phuloi_cached_creds", JSON.stringify({ email, password }));
        }

        const newProfile: UserProfile = {
          uid,
          email,
          fullName: fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          quarter: quarter === "Khác" ? customQuarter : quarter
        };

        // Save profile to Firestore
        await setDoc(doc(db, "users", uid), newProfile);
        
        onAuthSuccess(newProfile);
        setSuccessMessage("Đăng ký tài khoản thành công!");
        setTimeout(() => {
          onClose();
          // Reset states
          setEmail("");
          setPassword("");
          setFullName("");
          setPhone("");
          setAddress("");
        }, 1500);
      }
    } catch (err: any) {
      console.error("Auth error details:", err);
      if (err.code === "permission-denied" || (err.message && err.message.includes("permission-denied"))) {
        setPermissionDenied(true);
      }
      if (err.code) {
        setErrorMessage(translateAuthError(err.code));
      } else {
        setErrorMessage(err.message || "Xảy ra lỗi trong quá trình xử lý.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    setUnauthorizedDomain(null);
    setPermissionDenied(false);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: "select_account"
      });
      
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      const uid = user.uid;

      // Persist remember me for Google Sign-In so page refreshes don't auto-logout
      localStorage.setItem("phuloi_remember_me", "true");

      // Check if user profile already exists in Firestore
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const profile = userDoc.data() as UserProfile;
        onAuthSuccess(profile);
        setSuccessMessage("Đăng nhập bằng Gmail thành công!");
        setTimeout(() => {
          onClose();
          setEmail("");
          setPassword("");
        }, 1200);
      } else {
        // Create a new valid profile compliant with firestore.rules
        const newProfile: UserProfile = {
          uid,
          email: user.email || "",
          fullName: user.displayName || user.email?.split("@")[0] || "Công dân Google",
          phone: user.phoneNumber || "0900000000",
          address: "Phường Phú Lợi, Thành phố Hồ Chí Minh",
          quarter: QUARTERS_LIST[0].name,
          avatarUrl: user.photoURL || undefined
        };

        // Save profile to Firestore
        await setDoc(userDocRef, newProfile);
        onAuthSuccess(newProfile);
        setSuccessMessage("Đăng ký & Đăng nhập bằng Gmail thành công!");
        setTimeout(() => {
          onClose();
          setEmail("");
          setPassword("");
        }, 1200);
      }
    } catch (err: any) {
      console.error("Google authentication error:", err);
      if (err.code === "permission-denied" || (err.message && err.message.includes("permission-denied"))) {
        setPermissionDenied(true);
      }
      if (err.code === "auth/popup-blocked") {
        setErrorMessage("Trình duyệt chặn cửa sổ đăng nhập Google. Vui lòng bật cửa sổ bật lên (popup) để đăng nhập.");
      } else if (err.code === "auth/cancelled-popup-request" || err.code === "auth/popup-closed-by-user") {
        // user closed the popup, don't show scary error
        return;
      } else if (err.code === "auth/unauthorized-domain" || (err.message && err.message.includes("unauthorized-domain"))) {
        setUnauthorizedDomain(window.location.hostname);
        setErrorMessage(translateAuthError("auth/unauthorized-domain"));
      } else {
        setErrorMessage(translateAuthError(err.code || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-white/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="bg-white border-slate-200 shadow-xl rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md relative z-10 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header decoration */}
        <div className="bg-blue-50/50 p-6 text-white text-center relative border-b border-slate-200">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-500 hover:bg-slate-50 p-1.5 rounded-full transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          
          <h3 className="text-xl font-bold uppercase tracking-wider text-blue-900 font-sans">Cổng Xác Thực An Sinh</h3>
          <p className="text-blue-900 text-xs mt-1.5 font-light">
            Phường Phú Lợi, Thành phố Hồ Chí Minh
          </p>

          {/* Tab Selector */}
          <div className="flex bg-white/60 p-1 rounded-2xl mt-5 border border-slate-200">
            <button
              onClick={() => { setIsLogin(true); setErrorMessage(null); setUnauthorizedDomain(null); setPermissionDenied(false); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer ${
                isLogin ? "bg-blue-600 text-white shadow" : "text-slate-500 hover:text-blue-900"
              }`}
            >
              <LogIn className="w-4 h-4" />
              Đăng Nhập
            </button>
            <button
              onClick={() => { setIsLogin(false); setErrorMessage(null); setUnauthorizedDomain(null); setPermissionDenied(false); }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all duration-200 uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer ${
                !isLogin ? "bg-blue-600 text-white shadow" : "text-slate-500 hover:text-blue-900"
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Đăng Ký
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Messages */}
          {errorMessage && !unauthorizedDomain && (
            <div className="flex items-start gap-2 bg-blue-50/50 border border-red-100 p-3 rounded-2xl text-xs text-blue-700 font-semibold animate-shake">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {unauthorizedDomain && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-xs text-slate-500 animate-fade-in">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-blue-900 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-blue-900 uppercase tracking-wider text-[11px] mb-1 font-sans">
                    Yêu cầu cấu hình Firebase Console
                  </h4>
                  <p className="text-slate-500 leading-relaxed font-light">
                    Tên miền hiện tại chưa được cấp quyền trong Firebase Authentication. 
                    Vui lòng thêm tên miền dưới đây vào danh sách <strong>Authorized Domains</strong> để kích hoạt Google Sign-In:
                  </p>
                </div>
              </div>

              <div className="space-y-2 bg-white/60 p-3 rounded-xl border border-slate-200 font-mono">
                {/* Domain 1: Current Domain */}
                <div className="flex items-center justify-between gap-2 bg-blue-50/50 p-2 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-500 truncate select-all">{unauthorizedDomain}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(unauthorizedDomain);
                      setCopiedDomain("dev");
                      setTimeout(() => setCopiedDomain(null), 1500);
                    }}
                    className="p-1.5 hover:bg-slate-200 rounded-md transition text-slate-500 hover:text-blue-900 shrink-0 cursor-pointer"
                    title="Sao chép tên miền"
                  >
                    {copiedDomain === "dev" ? (
                      <Check className="w-3.5 h-3.5 text-blue-900" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Domain 2: Production/Preview Domain (Only if it's an AI Studio domain) */}
                {unauthorizedDomain.includes("ais-dev-") && (
                  <div className="flex items-center justify-between gap-2 bg-blue-50/50 p-2 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 truncate select-all">{unauthorizedDomain.replace("ais-dev-", "ais-pre-")}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const pre = unauthorizedDomain.replace("ais-dev-", "ais-pre-");
                        navigator.clipboard.writeText(pre);
                        setCopiedDomain("pre");
                        setTimeout(() => setCopiedDomain(null), 1500);
                      }}
                      className="p-1.5 hover:bg-slate-200 rounded-md transition text-slate-500 hover:text-blue-900 shrink-0 cursor-pointer"
                      title="Sao chép tên miền preview"
                    >
                      {copiedDomain === "pre" ? (
                        <Check className="w-3.5 h-3.5 text-blue-900" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {(!unauthorizedDomain.includes("ais-dev-") && unauthorizedDomain.startsWith("www.")) && (
                <div className="text-[10px] text-blue-700 font-medium bg-blue-100/50 p-2 rounded-lg mt-2">
                  💡 <strong>Mẹo:</strong> Nếu Firebase Console không cho phép thêm tên miền có chứa "www.", bạn hãy thử thêm tên miền gốc <strong>{unauthorizedDomain.replace("www.", "")}</strong>
                </div>
              )}

              <div className="text-[11px] font-medium text-blue-900 leading-relaxed space-y-1 font-light">
                <p className="font-bold font-sans text-blue-500">💡 Các bước thực hiện nhanh:</p>
                <ol className="list-decimal pl-4 space-y-1 text-slate-500">
                  <li>Mở <strong>Firebase Console</strong></li>
                  <li>Chọn tab <strong>Settings</strong> ➔ <strong>Authorized domains</strong>.</li>
                  <li>Nhấp <strong>Add domain</strong> và lần lượt thêm {unauthorizedDomain.includes("ais-dev-") ? "2 tên miền trên" : "tên miền trên"} vào danh sách.</li>
                </ol>
              </div>
            </div>
          )}

          {permissionDenied && (
            <div className="bg-blue-50/50 border border-red-100 rounded-2xl p-4 space-y-3 text-xs text-slate-500 animate-fade-in">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-blue-700 uppercase tracking-wider text-[11px] mb-1 font-sans">
                    Lỗi phân quyền Firestore (Permission Denied)
                  </h4>
                  <p className="text-slate-500 leading-relaxed font-light">
                    Hệ thống nhận thấy luật bảo mật (Security Rules) trong Firestore trên dự án <strong>{firebaseConfig.projectId}</strong> của bạn chưa được cấu hình, dẫn đến việc không thể đọc/ghi thông tin tài khoản.
                  </p>
                </div>
              </div>

              <div className="bg-white/60 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500 text-[11px] uppercase tracking-wider font-sans">Luật bảo mật Firestore của bạn:</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(FIRESTORE_RULES_CONTENT);
                      setCopiedRules(true);
                      setTimeout(() => setCopiedRules(false), 2000);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-bold hover:bg-slate-500 transition shadow-sm active:scale-95 cursor-pointer"
                  >
                    {copiedRules ? (
                      <>
                        <Check className="w-3 h-3" />
                        Đã sao chép!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Sao chép Rules
                      </>
                    )}
                  </button>
                </div>
                <pre className="text-[9px] text-slate-500 font-mono bg-blue-50/50 p-2.5 rounded-lg border border-slate-200 max-h-28 overflow-y-auto whitespace-pre-wrap select-all">
                  {FIRESTORE_RULES_CONTENT}
                </pre>
              </div>

              <div className="text-[11px] font-medium text-blue-700 leading-relaxed space-y-1 font-light">
                <p className="font-bold font-sans text-rose-300">🛠️ Cách kích hoạt nhanh trong 1 phút:</p>
                <ol className="list-decimal pl-4 space-y-1 text-slate-500">
                  <li>Truy cập <a href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/rules`} target="_blank" rel="noopener noreferrer" className="text-blue-900 hover:underline inline-flex items-center gap-0.5 font-bold">Firestore Security Rules <ExternalLink className="w-3 h-3 inline" /></a></li>
                  <li>Chọn tab <strong>Rules</strong> ở trên cùng.</li>
                  <li>Xóa toàn bộ nội dung cũ, dán luật mới vừa sao chép ở trên vào.</li>
                  <li>Nhấp nút <strong>Publish</strong> màu xanh ở góc trên bên phải để áp dụng luật. Sau đó thử đăng nhập lại!</li>
                </ol>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-900/30 p-3 rounded-2xl text-xs text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 animate-bounce" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-3 max-h-[55vh] overflow-y-auto px-1">
            
            {/* Registered-only fields */}
            {!isLogin && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-sans">
                    Họ và tên công dân <span className="text-blue-600">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-white/60 border border-slate-200 rounded-xl text-sm text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:bg-white transition font-light"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-sans">
                    Số điện thoại liên lạc <span className="text-blue-600">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="Số điện thoại di động"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-white/60 border border-slate-200 rounded-xl text-sm text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:bg-white transition font-light"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-sans">
                    Địa chỉ thường trú/Tạm trú <span className="text-blue-600">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Số nhà, Tên đường, Tổ..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 bg-white/60 border border-slate-200 rounded-xl text-sm text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:bg-white transition font-light"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-sans">
                    Khu phố cư trú <span className="text-blue-600">*</span>
                  </label>
                  <select
                    value={quarter}
                    onChange={(e) => setQuarter(e.target.value)}
                    className="w-full px-3 py-2.5 bg-white/60 border border-slate-200 rounded-xl text-sm text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:bg-white transition font-light"
                  >
                    {QUARTERS_LIST.map((kp) => (
                      <option key={kp.id} value={kp.name} className="bg-white text-blue-900">{kp.name}</option>
                    ))}
                    <option value="Khác" className="bg-white text-blue-900">Khác (Ngoài địa bàn Phường Phú Lợi)</option>
                  </select>
                  {quarter === "Khác" && (
                    <input
                      type="text"
                      required
                      placeholder="Nhập tên khu phố/phường xã/tỉnh thành..."
                      value={customQuarter}
                      onChange={(e) => setCustomQuarter(e.target.value)}
                      className="w-full mt-2 px-3 py-2.5 bg-white/60 border border-slate-200 rounded-xl text-sm text-blue-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:bg-white transition font-light"
                    />
                  )}
                </div>
              </>
            )}

            {/* General Email and Password */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-sans">
                Địa chỉ Email <span className="text-blue-600">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white/60 border border-slate-200 rounded-xl text-sm text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:bg-white transition font-light"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 font-sans">
                Mật khẩu đăng nhập <span className="text-blue-600">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  required
                  placeholder="Mật khẩu bảo mật"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white/60 border border-slate-200 rounded-xl text-sm text-blue-900 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:bg-white transition font-light"
                />
              </div>
            </div>

            {/* Remember Me Option */}
            <div className="flex items-center justify-between mt-2.5 px-1">
              <label className="flex items-center gap-2 cursor-pointer select-none text-[11px] text-slate-500 hover:text-slate-700 transition">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500/50 h-4 w-4 cursor-pointer"
                />
                Duy trì đăng nhập (Ghi nhớ tài khoản)
              </label>
            </div>

          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-slate-500 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-blue-500/10 transition-all duration-200 flex items-center justify-center gap-2 mt-2 disabled:opacity-70 cursor-pointer"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : isLogin ? (
              <>
                <LogIn className="w-4 h-4" />
                Xác nhận Đăng Nhập
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                Hoàn tất Đăng Ký
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-4 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 animate-pulse"></div>
            </div>
            <span className="relative bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">hoặc</span>
          </div>

          {/* Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2.5 py-3 border border-slate-200 rounded-xl hover:bg-slate-50/40 text-slate-500 font-bold text-xs uppercase tracking-wider transition-all duration-200 disabled:opacity-50 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
            </svg>
            Tiếp tục với Google (Gmail)
          </button>

          {/* Bottom Switch Trigger */}
          <p className="text-center text-[11px] text-slate-500 font-light pt-2">
            {isLogin ? (
              <>
                Chưa có tài khoản công dân?{" "}
                <button
                  type="button"
                  onClick={() => { setIsLogin(false); setErrorMessage(null); }}
                  className="text-blue-900 hover:underline font-bold cursor-pointer"
                >
                  Đăng ký ngay
                </button>
              </>
            ) : (
              <>
                Đã có tài khoản an sinh?{" "}
                <button
                  type="button"
                  onClick={() => { setIsLogin(true); setErrorMessage(null); }}
                  className="text-blue-900 hover:underline font-bold cursor-pointer"
                >
                  Đăng nhập tại đây
                </button>
              </>
            )}
          </p>

        </form>
      </div>
    </div>
  );
}
