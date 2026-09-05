/* eslint-disable @typescript-eslint/no-explicit-any */

export const uploadFile = async (
  file: File, 
  uploadType: 'document' | 'cloth' = 'document', 
  metadata: any = {}
) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('uploadType', uploadType);
  
  // Add metadata if provided
  if (metadata) {
    // Convert all metadata values to strings and ensure they're not undefined
    const stringifiedMetadata = Object.entries(metadata).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null) {
        acc[key] = String(value);
      }
      return acc;
    }, {} as Record<string, string>);
    
    // Append metadata as a JSON string
    formData.append('metadata', JSON.stringify(stringifiedMetadata));
    
    // Also append each metadata field individually for backward compatibility
    Object.entries(stringifiedMetadata).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  try {
    
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'File upload failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};
