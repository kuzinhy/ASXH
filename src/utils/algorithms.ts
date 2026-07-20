
/**
 * Advanced algorithms for data processing and matching.
 */

// 1. Levenshtein Distance for Fuzzy String Matching
export function getLevenshteinDistance(a: string, b: string): number {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          )
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

// 1.1 Jaro-Winkler Distance for smarter short-string matching (like names, titles)
export function jaroWinklerDistance(s1: string, s2: string): number {
  let m = 0;
  if (s1.length === 0 || s2.length === 0) return 0;
  if (s1 === s2) return 1;

  const range = Math.max(0, Math.floor(Math.max(s1.length, s2.length) / 2) - 1);
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - range);
    const end = Math.min(i + range + 1, s2.length);
    for (let j = start; j < end; j++) {
      if (s2Matches[j]) continue;
      if (s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      m++;
      break;
    }
  }
  if (m === 0) return 0;

  let k = 0;
  let numTransposes = 0;
  for (let i = 0; i < s1.length; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) numTransposes++;
    k++;
  }

  const weight = (m / s1.length + m / s2.length + (m - numTransposes / 2) / m) / 3;
  let l = 0;
  const p = 0.1;
  if (weight > 0.7) {
    while (s1[l] === s2[l] && l < 4) l++;
    return weight + l * p * (1 - weight);
  }
  return weight;
}

export function fuzzyMatch(str: string, query: string, threshold = 2): boolean {
  if (!str || !query) return false;
  str = str.toLowerCase();
  query = query.toLowerCase();
  
  if (str.includes(query)) return true;
  
  // Use Jaro-Winkler for whole string if it's very close
  if (jaroWinklerDistance(str, query) > 0.85) return true;

  // Split into words for partial matching
  const strWords = str.split(/\s+/);
  const queryWords = query.split(/\s+/);

  for (const qWord of queryWords) {
    if (qWord.length < 3) continue; // Skip very short words
    let matched = false;
    for (const sWord of strWords) {
      if (getLevenshteinDistance(sWord, qWord) <= threshold || jaroWinklerDistance(sWord, qWord) > 0.88) {
        matched = true;
        break;
      }
    }
    if (matched) return true;
  }
  return false;
}

// 2. Smart Sorting Algorithm for Priority and Relevance with Urgency Detection
export function analyzeUrgency(text: string): number {
  const urgencyKeywords = ["khẩn cấp", "cấp cứu", "đói", "nguy hiểm", "ngay lập tức", "sắp sinh", "tai nạn", "cứu trợ", "sos"];
  const lowerText = (text || "").toLowerCase();
  let score = 0;
  for (const kw of urgencyKeywords) {
    if (lowerText.includes(kw)) {
      score += 2;
    }
  }
  return score;
}

export function smartSortRequests<T extends { status: string; createdAt: string; reason?: string; content?: string }>(
  items: T[], 
  statusPriorityMap: Record<string, number>
): T[] {
  return [...items].sort((a, b) => {
    // 1. Sort by Priority based on Status
    const priorityA = statusPriorityMap[a.status] ?? 99;
    const priorityB = statusPriorityMap[b.status] ?? 99;
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // 2. Tie-breaker: Sort by Content Urgency (higher score = more urgent = smaller index)
    const urgencyA = analyzeUrgency(a.reason || a.content || "");
    const urgencyB = analyzeUrgency(b.reason || b.content || "");
    
    if (urgencyA !== urgencyB) {
      return urgencyB - urgencyA; // Descending urgency
    }
    
    // 3. Final Tie-breaker: Sort by Date (newest first)
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA; // Descending
  });
}

// 3. Recommendation Scoring for Jobs based on location relevance & title
export function rankJobsByRelevance<T extends { location: string; title?: string }>(
  jobs: T[],
  userQuarter: string,
  userSkills?: string
): T[] {
  if (!userQuarter && !userSkills) return jobs;
  
  return [...jobs].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    
    if (userQuarter) {
      scoreA += fuzzyMatch(a.location, userQuarter, 1) ? 2 : 0;
      scoreB += fuzzyMatch(b.location, userQuarter, 1) ? 2 : 0;
      // Bonus if exact match or Jaro-Winkler is very high
      if (jaroWinklerDistance(a.location.toLowerCase(), userQuarter.toLowerCase()) > 0.9) scoreA += 1;
      if (jaroWinklerDistance(b.location.toLowerCase(), userQuarter.toLowerCase()) > 0.9) scoreB += 1;
    }
    
    if (userSkills && a.title && b.title) {
      scoreA += fuzzyMatch(a.title, userSkills, 2) ? 1.5 : 0;
      scoreB += fuzzyMatch(b.title, userSkills, 2) ? 1.5 : 0;
    }
    
    return scoreB - scoreA; // Sort highest score first
  });
}

// 4. TF-IDF Contextual Search Scoring (Simplified)
export function searchRank<T extends Record<string, any>>(
  items: T[],
  query: string,
  searchFields: (keyof T)[]
): T[] {
  if (!query.trim()) return items;
  
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
  if (queryWords.length === 0) return items;
  
  const scoredItems = items.map(item => {
    let score = 0;
    for (const field of searchFields) {
      const text = String(item[field] || "").toLowerCase();
      if (!text) continue;
      
      // Exact field match gets massive boost
      if (text === query.toLowerCase()) {
        score += 100;
        continue;
      }
      
      // Partial field match
      if (text.includes(query.toLowerCase())) {
        score += 20;
      }
      
      for (const qWord of queryWords) {
        if (text.includes(qWord)) {
          score += 5;
        } else if (fuzzyMatch(text, qWord, 1)) {
          score += 2;
        }
      }
    }
    return { item, score };
  });
  
  return scoredItems
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(x => x.item);
}
