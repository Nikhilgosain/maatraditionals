/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react';
import Service from '@/lib/service';
import { API_ENDPOINTS } from '@/utils/constant';
import { useLoaderStore } from "@/store/useLoaderStore";
import { showAppToast } from '@/utils/SnackbarUtils';

interface SubCategory {
  _id: string;
  name: string;
  categoryId: string;
  serialNumber: number;
  imageUrl: any;
  createdAt: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface UseSubCategoriesParams {
  categoryId: string | null;
  search?: string;
  page?: number;
  limit?: number;
  fetchAll?: boolean;
  enablePagination?: boolean; // New flag to explicitly enable pagination
}

export function useSubCategories(params: UseSubCategoriesParams | string | null) {
  // Handle backward compatibility - if string passed, treat as categoryId
  const { 
    categoryId, 
    search = '', 
    page = 1, 
    limit = 10, 
    fetchAll = false,
    enablePagination = false // Default to false for backward compatibility
  } = typeof params === 'string' || params === null 
      ? { 
          categoryId: params, 
          search: '', 
          page: 1, 
          limit: 10, 
          fetchAll: false,
          enablePagination: false 
        }
      : params;

  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { showLoader, hideLoader } = useLoaderStore();

  const fetchSubCategories = async () => {
    setLoading(true);
    setError(null);
    
    // Local variables to track state
    let allSubCategories: SubCategory[] = [];
    let currentPage = page;
    let hasMore = true;
    let totalPages = 1;
    let pageInfo = {
      currentPage: page,
      totalPages: 1,
      totalCount: 0,
      hasNextPage: false,
      hasPrevPage: false
    };
    
    try {
      if (!categoryId && !search) {
        setSubCategories([]);
        setPagination(null);
        setLoading(false);
        return;
      }

      // Build base query parameters
      const baseParams = new URLSearchParams();
      if (categoryId) baseParams.append('categoryId', categoryId);
      if (search) baseParams.append('search', search);
      
      // Always fetch at least once for the current page
      let fetchError: Error | null = null;
      
      do {
        const params = new URLSearchParams(baseParams.toString());
        // Always use the current page from the component state for pagination
        params.append('page', currentPage.toString());
        params.append('limit', (fetchAll ? 100 : limit).toString());

        const url = `${API_ENDPOINTS.SUBCATEGORIES}?${params.toString()}`;
        
        try {
          const response = await Service.get(url);
          
          // The API returns { subCategories, pagination, status, message }
          const subCategories = response.subCategories || [];
          const responsePageInfo = response.pagination || { 
            currentPage: page,
            totalPages: 1,
            totalCount: subCategories.length,
            hasNextPage: false,
            hasPrevPage: page > 1
          };
          
          // Update page info from response
          pageInfo = responsePageInfo;
          
          if (fetchAll) {
            // For fetchAll, keep appending to the array
            allSubCategories = [...allSubCategories, ...subCategories];
            hasMore = responsePageInfo.currentPage < responsePageInfo.totalPages;
            if (hasMore) currentPage++;
          } else {
            // For paginated requests, replace the array
            allSubCategories = subCategories;
            hasMore = false;
          }
          
          totalPages = responsePageInfo.totalPages;
        } catch (error) {
          fetchError = error instanceof Error ? error : new Error('Failed to fetch subcategories');
          console.error('Error in fetchSubCategories:', fetchError.message);
          hasMore = false; // Stop the loop on error
        }
      } while (hasMore);
      
      // Handle any fetch errors after the loop
      if (fetchError) {
        setError(fetchError.message);
        setSubCategories([]);
        setPagination(null);
        setLoading(false);
        return;
      }

      // Update state with the final results
      setSubCategories(allSubCategories);
      
      // Handle pagination based on flags
      if (enablePagination) {
        setPagination({
          currentPage: pageInfo.currentPage,
          totalPages: pageInfo.totalPages,
          totalCount: pageInfo.totalCount,
          limit,
          hasNextPage: pageInfo.currentPage < pageInfo.totalPages,
          hasPrevPage: pageInfo.currentPage > 1,
        });
      } else if (fetchAll) {
        // For fetchAll, clear pagination
        setPagination(null);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Error fetching subcategories:', err);
      setError(err.message || 'Failed to fetch subcategories');
      showAppToast('Failed to load subcategories', 'error');
    } finally {
      setLoading(false);
      hideLoader();
    }
  };

  useEffect(() => {
    fetchSubCategories();
  }, [categoryId, search, page, limit, enablePagination]);

  const deleteSubCategory = async (id: string, userId?: string) => {
    showLoader();
    setError(null);

    try {
      // Build URL with query parameters
      const urlObj = new URL('/api/subcategories', window.location.origin);
      urlObj.searchParams.append('id', id);
      if (userId) {
        urlObj.searchParams.append('userId', userId);
      }

      // Service.remove will throw an error for non-2xx responses
      const response = await Service.remove(urlObj.toString());
      
      // If we get here, the request was successful
      showAppToast("Record deleted successfully", "success");
      return response;
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        showAppToast(errorMessage, "error")
        throw err;
    } finally {
      hideLoader();
    }
};


  return { subCategories, pagination, loading, error, refetch: fetchSubCategories, deleteSubCategory };
}
