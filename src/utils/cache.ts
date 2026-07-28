export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export const isCacheValid = (timestamp: number, durationMinutes = 5): boolean => {
  const now = Date.now();
  return now - timestamp < durationMinutes * 60 * 1000;
};

export const getCachedData = <T>(key: string): T | null => {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  try {
    const entry: CacheEntry<T> = JSON.parse(cached);
    if (isCacheValid(entry.timestamp)) {
      return entry.data;
    }
  } catch (e) {
    console.error(`Error parsing cache for ${key}:`, e);
  }
  return null;
};

export const setCachedData = <T>(key: string, data: T): void => {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
  };
  localStorage.setItem(key, JSON.stringify(entry));
};
