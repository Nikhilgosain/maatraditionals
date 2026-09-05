'use client';

import { useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useSubCategories } from '@/hooks/useSubCategories';
import { getCurrentUserId } from '@/utils/auth';
import Pagination from "@/components/common/Pagination";
import Image from 'next/image';

export default function Inventory() {
    const { categories, isLoading: categoriesLoading, error: categoriesError } = useCategories();
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
    const [searchText, setSearchText] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const { subCategories, pagination, loading: subCategoriesLoading, error: subCategoriesError, refetch, deleteSubCategory } = useSubCategories({
        categoryId: selectedCategoryId || null,
        search: searchText,
        page: currentPage,
        limit: 10,
        enablePagination: true // Explicitly enable pagination
    });

    const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedCategoryId(event.target.value);
        setCurrentPage(1); // Reset to first page when category changes
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchText(event.target.value);
        setCurrentPage(1); // Reset to first page when search changes
    };

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleClearFilters = () => {
        setSelectedCategoryId('');
        setSearchText('');
        setCurrentPage(1);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const userId = getCurrentUserId();
            await deleteSubCategory(id, userId || undefined);
            // Refresh the data after successful deletion
            refetch();
        } catch (error) {
            console.error('Failed to delete subcategory:', error);
            alert('Failed to delete subcategory. Please try again.');
        }
    };

    const getCategoryName = (categoryId: string) => {
        const category = categories.find(cat => cat._id === categoryId);
        return category ? category.name : 'Unknown';
    };

    return (
        <div className="space-y-6 text-black">
            {/* Search Card */}
            <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Search Uploads</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div>
                        <label className="block text-gray-700 mb-1 font-medium">Category</label>
                        <select
                            name="category"
                            value={selectedCategoryId}
                            onChange={handleCategoryChange}
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                        >
                            <option value="">
                                {categoriesLoading ? 'Loading categories...' : 'All Categories'}
                            </option>
                            {categoriesError && (
                                <option value="" disabled>Error loading categories</option>
                            )}
                            {(categories || []).map((category) => (
                                <option key={category._id} value={category._id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-gray-700 mb-1 font-medium">Search</label>
                        <input
                            type="text"
                            placeholder="Search by name or serial number..."
                            value={searchText}
                            onChange={handleSearchChange}
                            className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                        />
                    </div>
                    <div>
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="bg-gray-500 text-white w-full px-6 py-2 rounded-lg hover:bg-gray-600 transition"
                        >
                            Clear All
                        </button>
                    </div>
                </div>
            </div>

            {/* Listing Card */}
            <div className="bg-white rounded-xl overflow-x-auto shadow-md">
                <h2 className="text-xl font-semibold p-6 pb-0">Uploaded List</h2>

                {subCategoriesLoading && (
                    <div className="p-6 text-center text-gray-500">
                        Loading subcategories...
                    </div>
                )}

                {subCategoriesError && (
                    <div className="p-6 text-center text-red-500">
                        Error: {subCategoriesError}
                    </div>
                )}

                {!selectedCategoryId && !searchText && !subCategoriesLoading && (
                    <div className="p-6 text-center text-gray-500">
                        Select a category or search to view subcategories
                    </div>
                )}

                {(selectedCategoryId || searchText) && !subCategoriesLoading && subCategories && subCategories.length === 0 && (
                    <div className="p-6 text-center text-gray-500">
                        No subcategories found matching your criteria
                    </div>
                )}

                {subCategories && subCategories.length > 0 && (
                    <div className="flex flex-col m-[10px]">
                        <table className="w-full text-left text-gray-800">
                            <thead className="bg-red-700 text-white">
                                <tr>
                                    <th className="py-3 px-4">Sr. No.</th>
                                    <th className="py-3 px-4">Category</th>
                                    <th className="py-3 px-4">Subcategory</th>
                                    <th className="py-3 px-4">Photo</th>
                                    <th className="py-3 px-4">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(subCategories || []).map((subCategory, index) => (
                                    <tr key={subCategory._id} className="border-b hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            {subCategory.serialNumber || index + 1}
                                        </td>
                                        <td className="py-3 px-4">
                                            {getCategoryName(subCategory.categoryId)}
                                        </td>
                                        <td className="py-3 px-4">{subCategory.name}</td>
                                        <td className="py-3 px-4">
                                            <Image
                                                src={subCategory.imageUrl}
                                                alt={subCategory.name}
                                                width={64}
                                                height={64}
                                                className="object-cover rounded"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.onerror = null;
                                                    target.src = '/logo.png';
                                                }}
                                            />
                                        </td>
                                        <td className="py-3 px-4">
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(subCategory._id, subCategory.name)}
                                                disabled={subCategoriesLoading}
                                                className={`text-red-700 hover:text-white border border-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 dark:border-red-500 dark:text-red-500 dark:hover:text-white dark:hover:bg-red-600 dark:focus:ring-red-900 cursor-pointer ${subCategoriesLoading ? 'opacity-50 cursor-not-allowed' : ''
                                                    }`}
                                            >
                                                {subCategoriesLoading ? 'Processing...' : 'Delete'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination inside table card */}
                        {pagination && pagination.totalPages > 0 && (
                            <div className="p-4 border-t flex justify-center bg-gray-50">
                                <Pagination
                                    currentPage={pagination.currentPage}
                                    totalPages={pagination.totalPages}
                                    onPageChange={handlePageChange}
                                />
                            </div>
                        )}
                    </div>
                )}

            </div>

        </div>
    );
}