'use client';

import { useState } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useSubcategoryUpload } from '@/hooks/useSubcategoryUpload';

export default function Upload() {
    const { categories, isLoading, error } = useCategories();
    const { submitMessage, uploadSubcategory } = useSubcategoryUpload();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [formData, setFormData] = useState({
        categoryId: '',
        subcategoryName: '',
        serialNumber: ''
    });

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        setSelectedFile(file || null);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = event.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        if (!selectedFile) {
            return;
        }

        if (!formData.categoryId || !formData.subcategoryName) {
            return;
        }

        const success = await uploadSubcategory(formData, selectedFile);
        
        if (success) {
            // Reset form on success
            setFormData({categoryId: '', subcategoryName: '', serialNumber: ''});
            setSelectedFile(null);
        }
    };

    return (
        <>
            <div className="bg-white rounded-xl shadow-md p-6 text-black">
                <h2 className="text-xl font-semibold mb-4">Upload New Item</h2>
                {submitMessage && (
                    <div className={`p-4 rounded-lg mb-4 ${
                        submitMessage.type === 'success' 
                            ? 'bg-green-50 text-green-700 border border-green-200' 
                            : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                        {submitMessage.text}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    
                    {/* Row 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-700 mb-1 font-medium">Category *</label>
                            <select 
                                name="categoryId" 
                                value={formData.categoryId}
                                onChange={handleInputChange}
                                required
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                            >
                                <option value="">
                                    {isLoading ? 'Loading categories...' : 'Select Category'}
                                </option>
                                {error && (
                                    <option value="" disabled>Error loading categories</option>
                                )}
                                {categories.map((category) => (
                                    <option key={category._id} value={category._id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-1 font-medium">Sr. No.</label>
                            <input 
                                type="number" 
                                name="serialNumber"
                                value={formData.serialNumber}
                                onChange={handleInputChange}
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 focus:outline-none" 
                                placeholder="Enter Sr. No." 
                            />
                        </div>
                    </div>

                    {/* Row 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-700 mb-1 font-medium">Subcategory Name *</label>
                            <input 
                                type="text" 
                                name="subcategoryName"
                                value={formData.subcategoryName}
                                onChange={handleInputChange}
                                required
                                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 focus:outline-none" 
                                placeholder="Enter Subcategory Name" 
                            />
                        </div>
                        <div>
                            <label className="block text-gray-700 mb-1 font-medium">Choose Photo</label>
                            <div className="relative">
                                <input 
                                    type="file" 
                                    name="photo" 
                                    id="photo-upload"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${
                                    selectedFile 
                                        ? 'border-green-400 bg-green-50' 
                                        : 'border-gray-300 bg-gray-50 hover:border-yellow-400 hover:bg-yellow-50'
                                }`}>
                                    <div className="flex flex-col items-center space-y-2">
                                        {selectedFile ? (
                                            <>
                                                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <div className="text-sm text-gray-700">
                                                    <p className="font-medium text-green-600">{selectedFile.name}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                    </p>
                                                </div>
                                                <p className="text-xs text-green-600">File selected successfully</p>
                                            </>
                                        ) : (
                                            <>
                                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                                </svg>
                                                <div className="text-sm text-gray-600">
                                                    <span className="font-medium text-yellow-600 hover:text-yellow-500">Click to upload</span>
                                                    <span className="text-gray-500"> or drag and drop</span>
                                                </div>
                                                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className="text-right">
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className={`px-6 py-2 rounded-lg transition ${
                                isLoading 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-red-700 hover:bg-red-800'
                            } text-white`}
                        >
                            {isLoading ? 'Uploading...' : 'Submit'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    )
}