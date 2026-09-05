// Utility functions for user authentication
export const getCurrentUserId = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  // Try to get user ID from localStorage (you can modify this based on your auth implementation)
  const userData = localStorage.getItem('user');
  if (userData) {
    try {
      const user = JSON.parse(userData);
      return user.id || user._id || null;
    } catch {
      return null;
    }
  }
  
  // Fallback: try to get from sessionStorage
  const sessionData = sessionStorage.getItem('user');
  if (sessionData) {
    try {
      const user = JSON.parse(sessionData);
      return user.id || user._id || null;
    } catch {
      return null;
    }
  }
  
  return null;
};

export const getCurrentUser = () => {
  if (typeof window === 'undefined') return null;
  
  const userData = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch {
      return null;
    }
  }
  
  return null;
};
