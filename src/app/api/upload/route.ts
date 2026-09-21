/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/db/mongo';
import StoredFile from '@/models/storedFile';
import { MESSAGES, STATUS_CODE } from '@/utils/constant';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Upload types
type UploadType = 'cloth' | 'document';

// Base metadata interface
type BaseMetadata = Record<string, unknown>;

// Interfaces for metadata
interface ClothMetadata extends BaseMetadata {
  category: string;
  subCategory?: string;
  size?: string;
  color?: string;
  material?: string;
  occasion?: string;
  rentPrice?: number;
  description?: string;
  [key: string]: unknown; // Allow additional properties
}

interface DocumentMetadata extends BaseMetadata {
  userId: string;
  documentType: 'id_proof' | 'address_proof' | 'other';
  description?: string;
  [key: string]: unknown; // Allow additional properties
}

// Helper function to validate file type based on upload type
function isValidFileType(file: File, uploadType: UploadType): boolean {
  const clothImageTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
  const documentTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  const allowedTypes = uploadType === 'cloth' ? clothImageTypes : documentTypes;
  return allowedTypes.includes(file.type);
}

// Helper function to validate metadata
function validateMetadata(uploadType: UploadType, metadata: any): { isValid: boolean; error?: string } {
  if (uploadType === 'cloth') {
    if (!metadata.category) {
      return { isValid: false, error: 'Category is required for cloth uploads' };
    }
  } else if (uploadType === 'document') {
    if (!metadata.userId) {
      return { isValid: false, error: 'User ID is required for document uploads' };
    }
    if (!metadata.documentType || !['id_proof', 'address_proof', 'other'].includes(metadata.documentType)) {
      return { isValid: false, error: 'Valid document type is required (id_proof, address_proof, or other)' };
    }
  }
  return { isValid: true };
}

// POST: Upload file and store it in MongoDB
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const uploadType = formData.get('uploadType') as UploadType;
    const metadataString = formData.get('metadata') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, message: MESSAGES.NO_FILE_PROVIDED, status: STATUS_CODE.ERROR },
      );
    }

    if (!uploadType || !['cloth', 'document'].includes(uploadType)) {
      return NextResponse.json(
        { success: false, message: MESSAGES.INVALID_UPLOAD_TYPE, status: STATUS_CODE.ERROR },
      );
    }

    let metadata: ClothMetadata | DocumentMetadata | null = null;
    if (metadataString) {
      try {
        metadata = JSON.parse(metadataString);
      } catch {
        return NextResponse.json(
          { success: false, message: MESSAGES.INVALID_METADATA_FORMAT, status: STATUS_CODE.ERROR },
        );
      }
    }

    // Validate metadata
    if (!metadata) {
      return NextResponse.json(
        { success: false, message: MESSAGES.METADATA_IS_REQUIRED, status: STATUS_CODE.ERROR },
      );
    }
    const metadataValidation = validateMetadata(uploadType, metadata);
    if (!metadataValidation.isValid) {
      return NextResponse.json(
        { success: false, message: metadataValidation.error, status: STATUS_CODE.ERROR },
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, message: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`, status: STATUS_CODE.ERROR },
      );
    }

    // Validate file type based on upload type
    if (!isValidFileType(file, uploadType)) {
      const allowedTypes = uploadType === 'cloth' 
        ? 'images (JPEG, PNG, GIF, WebP)' 
        : 'images, PDFs, and documents';
      return NextResponse.json(
        { success: false, message: `Invalid file type for ${uploadType} upload. Only ${allowedTypes} are allowed.`, status: STATUS_CODE.ERROR },
      );
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Store file in MongoDB
    await connectMongoDB();

    const storedFile = new StoredFile({
      originalName: file.name,
      contentType: file.type,
      data: buffer,
      size: file.size,
      uploadType: uploadType,
      metadata: metadata,
    });

    const savedFile = await storedFile.save();

    // Build the public URL served by the API
    const fileUrl = `/api/files/${savedFile._id}`;

    return NextResponse.json({
      success: true,
      message: `${uploadType === 'cloth' ? 'Cloth image' : 'Document'} uploaded successfully`,
      data: {
        fileName: savedFile._id.toString(),
        originalName: file.name,
        fileUrl: fileUrl,
        fileSize: file.size,
        fileType: file.type,
        uploadType: uploadType,
        metadata: metadata,
      },
    });

  } catch (error: any) {
    console.error('MongoDB Upload Error:', error);
    return NextResponse.json(
      { success: false, message: `Upload failed: ${error.message}`, status: STATUS_CODE.INTERNAL_SERVER_ERROR },
    );
  }
}