'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Tag, Plus, Loader2 } from 'lucide-react';
import { Category } from '@/hooks/useCategories';

interface AddCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createCategory: (name: string) => Promise<Category>;
  onSuccess?: (newCategory: Category) => void;
}

export default function AddCategoryDialog({
  open,
  onOpenChange,
  createCategory,
  onSuccess,
}: AddCategoryDialogProps) {
  const [categoryName, setCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when dialog opens & reset state
  useEffect(() => {
    if (open) {
      setCategoryName('');
      setError(null);
      setIsSubmitting(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !isSubmitting) {
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isSubmitting, onOpenChange]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = categoryName.trim();

    if (!trimmed) {
      setError('Category name is required.');
      inputRef.current?.focus();
      return;
    }

    if (trimmed.length < 2) {
      setError('Category name must be at least 2 characters long.');
      inputRef.current?.focus();
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      const newCategory = await createCategory(trimmed);
      setCategoryName('');
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(newCategory);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Failed to create category. Please try again.';
      setError(msg);
      inputRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity"
      onClick={() => {
        if (!isSubmitting) onOpenChange(false);
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all border border-gray-100"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-category-title"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-red-800 to-red-700 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <Tag className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h3 id="add-category-title" className="font-semibold text-lg leading-tight">
                Add New Category
              </h3>
              <p className="text-xs text-red-100">Create a category in the database</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm flex items-start gap-2 animate-in fade-in">
                <span className="font-medium">Error:</span>
                <span>{error}</span>
              </div>
            )}

            <div>
              <label 
                htmlFor="category-name-input" 
                className="block text-sm font-semibold text-gray-700 mb-1.5"
              >
                Category Name <span className="text-red-600">*</span>
              </label>
              <input
                id="category-name-input"
                ref={inputRef}
                type="text"
                value={categoryName}
                onChange={(e) => {
                  setCategoryName(e.target.value);
                  if (error) setError(null);
                }}
                disabled={isSubmitting}
                placeholder="e.g. Traditional Turbans, Dupattas, Jewellery"
                className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-yellow-400 focus:border-red-700 focus:outline-none transition-all disabled:bg-gray-100 disabled:text-gray-400 text-sm"
              />
              <p className="mt-1.5 text-xs text-gray-500">
                This category will be saved to the database and will be available across the inventory, uploads, and bookings.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bg-gray-50 px-6 py-3.5 flex items-center justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !categoryName.trim()}
              className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-medium text-white bg-red-700 hover:bg-red-800 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Category</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
