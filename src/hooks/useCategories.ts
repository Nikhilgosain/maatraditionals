/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect } from 'react';
import Service from '@/lib/service';
import { useLoaderStore } from "@/store/useLoaderStore";
import { API_ENDPOINTS } from '@/utils/constant';

interface Category {
  _id: string;
  name: string;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const { showLoader, hideLoader, isLoading } = useLoaderStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchCategories() {
      try {
        showLoader();
        const response = await Service.get(API_ENDPOINTS.CATEGORIES);
        const categoryList = Array.isArray(response?.data) ? response.data : [];
        if (isMounted) {
          setCategories(categoryList);
          hideLoader();
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to load categories');
          hideLoader();
        }
      } finally { 
        hideLoader();
      }
    }

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, [showLoader, hideLoader]);

  return { categories, isLoading, error };
}
