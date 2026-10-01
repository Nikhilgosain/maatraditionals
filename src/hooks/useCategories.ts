/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from 'react';
import Service from '@/lib/service';
import { useLoaderStore } from "@/store/useLoaderStore";
import { API_ENDPOINTS } from '@/utils/constant';
import { showAppToast } from '@/utils/SnackbarUtils';

export interface Category {
  _id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const { showLoader, hideLoader, isLoading } = useLoaderStore();
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      showLoader();
      setError(null);
      const response = await Service.get(API_ENDPOINTS.CATEGORIES);
      const categoryList = Array.isArray(response?.data) ? response.data : [];
      setCategories(categoryList);
      return categoryList;
    } catch (err: any) {
      const errorMsg = err?.message || 'Failed to load categories';
      setError(errorMsg);
      return [];
    } finally { 
      hideLoader();
    }
  }, [showLoader, hideLoader]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (name: string): Promise<Category> => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      const err = new Error('Category name is required');
      showAppToast(err.message, 'error');
      throw err;
    }

    try {
      showLoader();
      const response = await Service.post({
        url: API_ENDPOINTS.CATEGORIES,
        data: { name: trimmedName },
      });

      if (!response || response.success === false) {
        throw new Error(response?.message || 'Failed to create category');
      }

      const newCategory: Category = response.data;
      showAppToast(response.message || 'Category created successfully', 'success');

      // Update state immediately
      setCategories((prev) => {
        const exists = prev.some((cat) => cat._id === newCategory._id);
        return exists ? prev : [...prev, newCategory];
      });

      return newCategory;
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to create category';
      showAppToast(errMsg, 'error');
      throw err;
    } finally {
      hideLoader();
    }
  };

  return { 
    categories, 
    isLoading, 
    error, 
    refetch: fetchCategories, 
    createCategory 
  };
}

