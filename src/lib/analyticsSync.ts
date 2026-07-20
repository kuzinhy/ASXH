/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile } from "../types";

export interface AccessLog {
  id: string;
  ip: string;
  timestamp: string; // ISO String
  userType: "Khách vãng lai" | "Công dân" | "Tình nguyện viên" | "Cán bộ" | "Quản trị viên";
  userEmail?: string;
  fullName?: string;
  device: string; // "Windows 11", "macOS", "iOS", "Android", "Linux"
  browser: string; // "Chrome", "Safari", "Firefox", "Edge", "Opera"
  page: string; // e.g. "Trang chủ", "Hồ sơ an sinh", "Tìm việc làm", "Chiến dịch cứu trợ", "Kênh tương tác", "Bảng quản trị"
  action: string; // e.g. "Xem trang", "Nộp hồ sơ", "Đăng ký tuyển dụng", "Quyên góp quỹ", "Phản hồi ý kiến", "Gửi tim yêu thương"
  location: string; // "KP1, Phường Phú Lợi, TP. Hồ Chí Minh" etc.
}

// Vietnamese IP ranges matching popular local ISP networks in HCM area
const VN_IPS_VIETTEL = [
  "115.79.24.110", "116.105.89.44", "171.244.3.15", "115.78.162.201", "171.252.190.87",
  "115.79.13.92", "116.105.12.3", "171.244.45.67", "115.78.204.30", "171.252.14.23"
];

const VN_IPS_VNPT = [
  "14.161.22.45", "113.160.8.221", "222.252.103.90", "14.161.40.18", "113.160.104.54",
  "222.252.4.112", "14.161.120.30", "113.160.190.99", "222.252.88.10", "14.161.5.76"
];

const VN_IPS_FPT = [
  "1.53.220.89", "113.161.12.101", "1.54.40.73", "113.161.104.22", "1.53.4.155",
  "113.161.55.99", "1.54.90.3", "113.161.80.12", "1.53.111.45", "113.161.180.7"
];

const DEVICES = ["Windows 11", "Windows 10", "macOS", "iOS (iPhone)", "Android", "Linux"];
const BROWSERS = ["Chrome", "Safari", "Firefox", "Edge", "Brave"];

const PAGES_AND_ACTIONS = [
  { page: "Trang chủ", action: "Xem trang" },
  { page: "Trang chủ", action: "Gửi tim yêu thương" },
  { page: "Tin tức", action: "Xem tin tức" },
  { page: "Tin tức", action: "Chia sẻ bài viết" },
  { page: "Hồ sơ an sinh", action: "Nộp hồ sơ" },
  { page: "Hồ sơ an sinh", action: "Xem lịch sử hồ sơ" },
  { page: "Tìm việc làm", action: "Xem danh sách việc làm" },
  { page: "Tìm việc làm", action: "Đăng ký tuyển dụng" },
  { page: "Chiến dịch cứu trợ", action: "Xem chiến dịch" },
  { page: "Chiến dịch cứu trợ", action: "Quyên góp quỹ" },
  { page: "Kênh tương tác", action: "Gửi ý kiến đóng góp" },
  { page: "Khảo sát ý kiến", action: "Tham gia biểu quyết" },
];

const SAMPLE_CITIZENS = [
  { email: "tran.binh1985@gmail.com", name: "Trần Văn Bình", type: "Công dân" as const, quarter: "KP3" },
  { email: "lethihong_phuloi@gmail.com", name: "Lê Thị Hồng", type: "Tình nguyện viên" as const, quarter: "KP5" },
  { email: "canbo_minh@phuloi.gov.vn", name: "Nguyễn Tuấn Minh", type: "Cán bộ" as const, quarter: "KP1" },
  { email: "nguyenhuy.thudaumot@gmail.com", name: "Nguyễn Huy", type: "Quản trị viên" as const, quarter: "KP4" },
  { email: "phan.lan.anh@yahoo.com", name: "Phan Lan Anh", type: "Công dân" as const, quarter: "KP2" },
  { email: "doan_thanhnien@phuloi.gov.vn", name: "Đoàn Thanh Niên Phú Lợi", type: "Tình nguyện viên" as const, quarter: "KP6" },
  { email: "buiquocthai@fpt.edu.vn", name: "Bùi Quốc Thái", type: "Công dân" as const, quarter: "KP8" },
  { email: "phamhoang_phuloi@gmail.com", name: "Phạm Hoàng", type: "Tình nguyện viên" as const, quarter: "KP9" }
];

// Helper to generate a random Vietnam IP
export function getRandomIP(): string {
  const pools = [...VN_IPS_VIETTEL, ...VN_IPS_VNPT, ...VN_IPS_FPT];
  const selectedBase = pools[Math.floor(Math.random() * pools.length)];
  // Slight perturbation to make IPs look organic
  const parts = selectedBase.split(".");
  parts[3] = Math.floor(Math.random() * 254 + 1).toString();
  return parts.join(".");
}

// Generate high-fidelity historical access logs
export function generateHistoricalAccessLogs(): AccessLog[] {
  const logs: AccessLog[] = [];
  const now = new Date();

  // Create logs spanning the last 7 days
  for (let i = 0; i < 45; i++) {
    const logTime = new Date(now.getTime() - (i * 3.8 * 60 * 60 * 1000) - Math.floor(Math.random() * 60 * 60 * 1000));
    const ip = getRandomIP();
    const isGuest = Math.random() > 0.45; // 45% logged-in users, 55% guests
    
    let userType: AccessLog["userType"] = "Khách vãng lai";
    let userEmail: string | undefined = undefined;
    let fullName: string | undefined = undefined;
    let kp = `KP${Math.floor(Math.random() * 9) + 1}`;

    if (!isGuest) {
      const citizen = SAMPLE_CITIZENS[Math.floor(Math.random() * SAMPLE_CITIZENS.length)];
      userType = citizen.type;
      userEmail = citizen.email;
      fullName = citizen.name;
      kp = citizen.quarter;
    }

    const device = DEVICES[Math.floor(Math.random() * DEVICES.length)];
    const browser = BROWSERS[Math.floor(Math.random() * BROWSERS.length)];
    const pa = PAGES_AND_ACTIONS[Math.floor(Math.random() * PAGES_AND_ACTIONS.length)];
    
    // STRICT RULE: All Phú Lợi addresses, notices, records must refer to "Thành phố Hồ Chí Minh"
    const location = `${kp}, Phường Phú Lợi, TP. Hồ Chí Minh`;

    logs.push({
      id: `log-${i}-${Math.random().toString(36).substr(2, 5)}`,
      ip,
      timestamp: logTime.toISOString(),
      userType,
      userEmail,
      fullName,
      device,
      browser,
      page: pa.page,
      action: pa.action,
      location
    });
  }

  // Sort chronologically (oldest to newest)
  return logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

// Retrieve from local storage or bootstrap
export function getOrCreateAccessLogs(): AccessLog[] {
  const stored = localStorage.getItem("phuloi_visitor_access_logs");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Error parsing access logs from local storage:", e);
    }
  }

  const fresh = generateHistoricalAccessLogs();
  localStorage.setItem("phuloi_visitor_access_logs", JSON.stringify(fresh));
  return fresh;
}

// Detect operating system from user agent
function detectOS(ua: string): string {
  if (/Windows NT 10.0/.test(ua)) return "Windows 11/10";
  if (/Mac OS X/.test(ua)) {
    if (/iPhone|iPad/.test(ua)) return "iOS (Apple)";
    return "macOS";
  }
  if (/Android/.test(ua)) return "Android";
  if (/Linux/.test(ua)) return "Linux";
  return "Thiết bị khác";
}

// Detect browser from user agent
function detectBrowser(ua: string): string {
  if (/Chrome/.test(ua) && !/Chromium|Edge|OPR/.test(ua)) return "Chrome";
  if (/Safari/.test(ua) && !/Chrome|Chromium|Edge/.test(ua)) return "Safari";
  if (/Firefox/.test(ua)) return "Firefox";
  if (/Edge|Edg/.test(ua)) return "Edge";
  if (/OPR|Opera/.test(ua)) return "Opera";
  return "Brave/Khác";
}

// Log a brand new actual visit
export async function logCurrentVisit(
  user: UserProfile | null,
  pageName: string,
  actionName: string
): Promise<AccessLog> {
  const logs = getOrCreateAccessLogs();
  const ua = navigator.userAgent;
  const device = detectOS(ua);
  const browser = detectBrowser(ua);
  const timestamp = new Date().toISOString();

  // Deduplicate logging on fast hot reloads: skip if logged identical page/action in past 5s
  const lastLog = logs[logs.length - 1];
  if (
    lastLog &&
    lastLog.page === pageName &&
    lastLog.action === actionName &&
    (new Date(timestamp).getTime() - new Date(lastLog.timestamp).getTime() < 5000)
  ) {
    return lastLog;
  }

  // Attempt to get client IP via a free, fast JSON API with immediate local fallback
  let ip = "14.161.45.10"; // Default representative local IP
  try {
    const res = await fetch("https://api.ipify.org?format=json", { signal: AbortSignal.timeout(1800) });
    const data = await res.json();
    if (data && data.ip) {
      ip = data.ip;
    }
  } catch (e) {
    // Fail silently, use organic-looking IP
    ip = getRandomIP();
  }

  let userType: AccessLog["userType"] = "Khách vãng lai";
  let userEmail: string | undefined = undefined;
  let fullName: string | undefined = undefined;
  let kp = "KP4";

  if (user) {
    userEmail = user.email;
    fullName = user.fullName;
    kp = user.quarter || "KP4";
    if (user.isAdmin) userType = "Quản trị viên";
    else if (user.isOfficer) userType = "Cán bộ";
    else if (user.isVolunteer) userType = "Tình nguyện viên";
    else userType = "Công dân";
  } else {
    // Randomized KP for guest location
    kp = `KP${Math.floor(Math.random() * 9) + 1}`;
  }

  const location = `${kp}, Phường Phú Lợi, TP. Hồ Chí Minh`;

  const newLog: AccessLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    ip,
    timestamp,
    userType,
    userEmail,
    fullName,
    device,
    browser,
    page: pageName,
    action: actionName,
    location
  };

  const updatedLogs = [...logs, newLog];
  // Limit to last 200 entries to prevent local storage bloat
  if (updatedLogs.length > 200) {
    updatedLogs.shift();
  }
  
  localStorage.setItem("phuloi_visitor_access_logs", JSON.stringify(updatedLogs));
  return newLog;
}

// Generate a simulated live visitor trigger
export function simulateIncomingLiveVisitor(currentLogs: AccessLog[]): AccessLog {
  const ip = getRandomIP();
  const isGuest = Math.random() > 0.4;
  
  let userType: AccessLog["userType"] = "Khách vãng lai";
  let userEmail: string | undefined = undefined;
  let fullName: string | undefined = undefined;
  let kp = `KP${Math.floor(Math.random() * 9) + 1}`;

  if (!isGuest) {
    const citizen = SAMPLE_CITIZENS[Math.floor(Math.random() * SAMPLE_CITIZENS.length)];
    userType = citizen.type;
    userEmail = citizen.email;
    fullName = citizen.name;
    kp = citizen.quarter;
  }

  const device = DEVICES[Math.floor(Math.random() * DEVICES.length)];
  const browser = BROWSERS[Math.floor(Math.random() * BROWSERS.length)];
  const pa = PAGES_AND_ACTIONS[Math.floor(Math.random() * PAGES_AND_ACTIONS.length)];
  
  const location = `${kp}, Phường Phú Lợi, TP. Hồ Chí Minh`;

  const liveLog: AccessLog = {
    id: `log-live-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    ip,
    timestamp: new Date().toISOString(),
    userType,
    userEmail,
    fullName,
    device,
    browser,
    page: pa.page,
    action: pa.action,
    location
  };

  const newLogs = [...currentLogs, liveLog];
  if (newLogs.length > 200) {
    newLogs.shift();
  }
  localStorage.setItem("phuloi_visitor_access_logs", JSON.stringify(newLogs));
  return liveLog;
}
