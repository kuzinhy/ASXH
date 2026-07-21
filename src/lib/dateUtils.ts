/**
 * Helper to parse dates from various formats safely (DD/MM/YYYY, ISO, Date objects, numbers)
 */
export const safeParseDate = (dateVal: any): number => {
  if (!dateVal) return 0;
  if (dateVal instanceof Date) return dateVal.getTime();
  if (typeof dateVal === 'number') return dateVal;
  
  const dateStr = String(dateVal);
  
  // Handle DD/MM/YYYY
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) return d.getTime();
    }
  }
  
  const parsed = new Date(dateStr).getTime();
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Format date to Vietnamese locale
 */
export const formatDateVN = (dateVal: any): string => {
  const d = new Date(safeParseDate(dateVal));
  if (isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleDateString("vi-VN");
};
