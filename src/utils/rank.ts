import { UserProfile } from "../types";

export interface RankInfo {
  name: string;
  level: number;
  color: string;
  icon: string;
  nextRankPoints: number | null;
  progress: number;
  points: number;
  isEligible: boolean;
  missingRequirements: string[];
}

export function calculateUserPoints(user: UserProfile): number {
  const visitPts = (user.visitDays || 0) * 1;
  const contribPts = (user.contributionsCount || 0) * 5;
  const eventPts = (user.eventsAttended || 0) * 3;
  const sharePts = (user.sharesCount || 0) * 2;
  const basePts = user.activityPoints || 0;
  
  return visitPts + contribPts + eventPts + sharePts + basePts;
}

export function getUserRank(user: UserProfile): RankInfo {
  const points = calculateUserPoints(user);
  
  const visits = user.visitDays || 0;
  const contribs = user.contributionsCount || 0;
  const events = user.eventsAttended || 0;
  const shares = user.sharesCount || 0;

  // Base requirement for any promotion beyond Bronze
  const missingRequirements: string[] = [];
  if (visits < 30) missingRequirements.push(`Cần ${30 - visits} ngày truy cập nữa`);
  if (contribs < 5) missingRequirements.push(`Cần ${5 - contribs} lần đóng góp/từ thiện`);
  if (events < 2) missingRequirements.push(`Cần tham gia ${2 - events} hoạt động`);
  if (shares < 3) missingRequirements.push(`Cần chia sẻ ${3 - shares} tin tức`);

  const isEligible = missingRequirements.length === 0;

  if (points >= 1000 && isEligible) return { name: "Kim Cương", level: 5, color: "text-cyan-400 bg-cyan-50 border-cyan-200", icon: "💎", nextRankPoints: null, progress: 100, points, isEligible, missingRequirements };
  if (points >= 500 && isEligible) return { name: "Bạch Kim", level: 4, color: "text-slate-600 bg-slate-100 border-slate-300", icon: "💠", nextRankPoints: 1000, progress: (points/1000)*100, points, isEligible, missingRequirements };
  if (points >= 200 && isEligible) return { name: "Vàng", level: 3, color: "text-yellow-600 bg-yellow-50 border-yellow-200", icon: "🏆", nextRankPoints: 500, progress: (points/500)*100, points, isEligible, missingRequirements };
  if (points >= 50 && isEligible) return { name: "Bạc", level: 2, color: "text-zinc-500 bg-zinc-50 border-zinc-200", icon: "🥈", nextRankPoints: 200, progress: (points/200)*100, points, isEligible, missingRequirements };
  
  const nextTarget = isEligible ? 50 : 50;
  let progress = (points / nextTarget) * 100;
  if (progress > 100 && !isEligible) progress = 95; // Stuck at 95% if not eligible
  
  return { name: "Đồng", level: 1, color: "text-amber-700 bg-amber-50 border-amber-200", icon: "🥉", nextRankPoints: nextTarget, progress, points, isEligible, missingRequirements };
}
