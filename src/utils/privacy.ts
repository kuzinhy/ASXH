import { UserProfile } from "../types";

export type MaskingStrategy = "initials" | "asterisks" | "hidden";

/**
 * Masks a full Vietnamese name depending on the selected masking strategy
 */
export function maskName(fullName: string, strategy: MaskingStrategy = "initials"): string {
  if (!fullName) return "Công dân ẩn danh";
  if (strategy === "hidden") return "🔒 (Bà con ẩn danh)";
  if (strategy === "asterisks") {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length <= 1) {
      return fullName.length > 2 ? `${fullName.slice(0, 1)}***` : `${fullName}*`;
    }
    const firstName = parts[0];
    const maskedOthers = parts.slice(1).map(p => p.charAt(0) + "*".repeat(p.length - 1)).join(" ");
    return `${firstName} ${maskedOthers}`;
  }
  
  // Default: initials (Administrative Initialism)
  const parts = fullName.trim().split(/\s+/);
  if (parts.length <= 1) {
    return fullName.length > 2 ? `${fullName.slice(0, 1)}**` : fullName;
  }
  
  const firstName = parts[0];
  const middleAndLastName = parts.slice(1).map(p => p.charAt(0).toUpperCase() + ".").join(" ");
  return `${firstName} ${middleAndLastName}`;
}

/**
 * Masks a phone number depending on the selected masking strategy
 */
export function maskPhone(phone: string, strategy: MaskingStrategy = "initials"): string {
  if (!phone) return "**********";
  const cleaned = phone.replace(/\s+/g, "");
  if (strategy === "hidden") return "🔒 (SĐT đã ẩn)";
  if (strategy === "asterisks") {
    if (cleaned.length < 6) return "****";
    return cleaned.slice(0, 2) + "*".repeat(cleaned.length - 4) + cleaned.slice(-2);
  }
  
  if (cleaned.length < 6) {
    return cleaned.slice(0, 2) + "***";
  }
  return cleaned.slice(0, 3) + "***" + cleaned.slice(-3);
}

/**
 * Masks a specific address to shield exact residence but preserve statistical neighborhood info
 */
export function maskAddress(address: string, quarter: string, strategy: MaskingStrategy = "initials"): string {
  if (strategy === "hidden") return "🔒 (Địa chỉ đã ẩn)";
  return `***, ${quarter || "Phường Phú Lợi"}`;
}

/**
 * Calculates whether a user has authority to view sensitive personal details of a record.
 * Supports simulation parameters for interactive learning and policy auditing.
 */
export function canViewSensitiveInfo(
  currentUser: UserProfile | null,
  requestQuarter?: string,
  requestOwnerId?: string,
  requestFullName?: string,
  requestPhone?: string,
  simulatedRole?: { 
    role: "guest" | "citizen" | "officer" | "admin"; 
    officerQuarter?: string;
    uid?: string;
  }
): boolean {
  // 1. If simulating role (for administrative demo and policy auditing)
  if (simulatedRole) {
    if (simulatedRole.role === "admin") return true;
    if (simulatedRole.role === "officer" && simulatedRole.officerQuarter && requestQuarter) {
      const simQ = simulatedRole.officerQuarter.toLowerCase().replace(/[^a-z0-9]/g, "");
      const reqQ = requestQuarter.toLowerCase().replace(/[^a-z0-9]/g, "");
      return simQ === reqQ;
    }
    if (simulatedRole.role === "citizen" && currentUser) {
      if (requestOwnerId && currentUser.uid === requestOwnerId) return true;
      if (requestFullName && currentUser.fullName.toLowerCase().trim() === requestFullName.toLowerCase().trim()) return true;
      if (requestPhone && currentUser.phone.trim() === requestPhone.trim()) return true;
    }
    return false;
  }

  // 2. Real Firestore / State Authentication Roles
  if (!currentUser) return false;

  // Admin gets global clearance
  if (currentUser.isAdmin || currentUser.email?.toLowerCase() === "nguyenhuy.thudaumot@gmail.com") return true;

  // Officer gets localized quarter clearance
  if (currentUser.isOfficer && currentUser.officerQuarter && requestQuarter) {
    const userQ = currentUser.officerQuarter.toLowerCase().replace(/[^a-z0-9]/g, "");
    const reqQ = requestQuarter.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (userQ === reqQ) return true;
  }

  // Author gets clearance for their own requests
  if (requestOwnerId && currentUser.uid === requestOwnerId) return true;
  if (requestFullName && currentUser.fullName && currentUser.fullName.toLowerCase().trim() === requestFullName.toLowerCase().trim()) return true;
  if (requestPhone && currentUser.phone && currentUser.phone.trim() === requestPhone.trim()) return true;

  return false;
}
