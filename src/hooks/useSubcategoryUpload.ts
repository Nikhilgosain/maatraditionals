/* eslint-disable @typescript-eslint/no-explicit-any */

import { useLoaderStore } from '@/store/useLoaderStore';
import { showAppToast } from '@/utils/SnackbarUtils';
import Service from '@/lib/service';
import { useState } from 'react';
import { API_ENDPOINTS } from '@/utils/constant';

interface UploadFormData {
  categoryId: string;
  subcategoryName: string;
  serialNumber: string;
}

interface UseSubcategoryUploadReturn {
  isLoading: boolean;
  submitMessage: { type: 'success' | 'error'; text: string } | null;
  uploadSubcategory: (formData: UploadFormData, file: File) => Promise<boolean>;
  clearMessage: () => void;
}

export function useSubcategoryUpload(): UseSubcategoryUploadReturn {
  const { showLoader, hideLoader, isLoading } = useLoaderStore();
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  

  const uploadSubcategory = async (formData: UploadFormData, file: File): Promise<boolean> => {
    showLoader();

    try {
      // Step 1: Upload image to S3 (using fetch for FormData)
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('uploadType', 'cloth');
      uploadFormData.append('metadata', JSON.stringify({
        category: formData.categoryId,
        subcategory: formData.subcategoryName
      }));

      const uploadResponse = await Service.post({
        url: API_ENDPOINTS.UPLOAD,
        data: uploadFormData
      });

      const uploadResult = await uploadResponse;

      if (!uploadResult.success) {
        throw new Error(uploadResult.message || 'Upload failed');
      }

      // Step 2: Save subcategory data to database using Service
      const subcategoryData = {
        categoryId: formData.categoryId,
        name: formData.subcategoryName,
        imageUrl: uploadResult.data.fileUrl,
        serialNumber: formData.serialNumber ? parseInt(formData.serialNumber) : undefined
      };

      const saveResult = await Service.post({
        url: API_ENDPOINTS.SUBCATEGORIES,
        data: subcategoryData
      });

      if (!saveResult.success) {
        throw new Error(saveResult.message || 'Failed to save subcategory');
      }

      showAppToast("Subcategory uploaded successfully!", "success");
      return true;

    } catch (error: any) {
        showAppToast(error.message || 'Upload failed', "error");
      return false;
    } finally {
        hideLoader();
    }
  };

  const clearMessage = () => {
    setSubmitMessage(null);
  };

  return {
    isLoading,
    submitMessage,
    uploadSubcategory,
    clearMessage
  };
}
