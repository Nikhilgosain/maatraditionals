import Service from '@/lib/service';
import { useCallback, useState } from 'react';

interface AvailabilityResponse {
  available: boolean;
  conflicts?: { date: string }[];
}

export function useAvailability() {
  const [loading, setLoading] = useState(false);

  const checkAvailability = useCallback(async (subCategoryId: string, startDate: string, endDate: string): Promise<AvailabilityResponse> => {
    try {
      setLoading(true);
      const response = await Service.post({
        url: '/availability/check',
        data: { 
          subCategoryId, 
          startDate,
          endDate 
        }
      });
      
      // Handle different response formats
      if (response && typeof response === 'object') {
        // If the response already has the expected structure
        if ('available' in response) {
          return {
            available: response.available,
            conflicts: response.conflicts || []
          };
        }
        // If the response is the data object from the server
        else if (response.data) {
          return {
            available: response.data.available || false,
            conflicts: response.data.conflicts || []
          };
        }
      }
      
      // Default fallback - assume available if we can't determine
      return { 
        available: true,
        conflicts: []
      };
    } catch (err) {
      console.error('Error checking availability:', err);
      // On error, assume not available to be safe
      return { 
        available: false,
        conflicts: []
      };
    } finally {
      setLoading(false);
    }
  }, []);

  return { checkAvailability, loading };
}
