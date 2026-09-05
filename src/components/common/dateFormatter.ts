// Format date to DD-MM-YYYY string
export function formatDate(dateString: string | Date): string {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

// Format date for API (DD-MM-YYYY)
export function formatDateForAPI(dateStr: string | Date | null | undefined): string {
  try {
    if (!dateStr) return '';
    
    // If it's already in DD-MM-YYYY format
    if (typeof dateStr === 'string' && /^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      // Validate the date parts
      const [day, month, year] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      if (date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year) {
        return dateStr;
      }
    }
    
    // If it's a Date object
    if (dateStr instanceof Date) {
      if (isNaN(dateStr.getTime())) throw new Error('Invalid Date object');
      return formatDate(dateStr);
    }
    
    // If it's in YYYY-MM-DD format
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      if (date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year) {
        return `${String(day).padStart(2, '0')}-${String(month).padStart(2, '0')}-${year}`;
      }
    }
    
    // Try to parse as ISO date string
    const parsedDate = new Date(dateStr);
    if (!isNaN(parsedDate.getTime())) {
      return formatDate(parsedDate);
    }
    
    // Try to parse as DD/MM/YYYY or other common formats
    const dateParts = String(dateStr).split(/[-/\s]/);
    if (dateParts.length === 3) {
      let day: number, month: number, year: number;
      
      // Try DD/MM/YYYY or DD-MM-YYYY
      if (dateParts[0].length === 2 && dateParts[1].length === 2) {
        day = parseInt(dateParts[0], 10);
        month = parseInt(dateParts[1], 10) - 1;
        year = parseInt(dateParts[2], 10);
      } 
      // Try YYYY/MM/DD or YYYY-MM-DD
      else if (dateParts[0].length === 4) {
        year = parseInt(dateParts[0], 10);
        month = parseInt(dateParts[1], 10) - 1;
        day = parseInt(dateParts[2], 10);
      } else {
        throw new Error('Unrecognized date format');
      }
      
      const date = new Date(year, month, day);
      if (date.getDate() === day && date.getMonth() === month && date.getFullYear() === year) {
        return formatDate(date);
      }
    }
    
    throw new Error('Could not parse date');
  } catch (error) {
    console.error('Error formatting date:', error);
    return ''; // Return empty string for invalid dates
  }
}

// Format date to YYYY-MM-DD (for date inputs)
export function formatDateToLocalYYYYMMDD(date: Date | string): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parse DD-MM-YYYY string to Date object
export function parseDateDMY(dateStr: string): Date {
  const [day, month, year] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}