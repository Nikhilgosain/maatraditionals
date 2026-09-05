/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { MESSAGES, STATUS_CODE } from '@/utils/constant';

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;
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

// Helper function to generate unique filename with upload type
function generateUniqueFileName(originalName: string, uploadType: UploadType): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  const folder = uploadType === 'cloth' ? 'cloth-images' : 'user-documents';
  return `${folder}/${timestamp}-${randomString}.${extension}`;
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

// POST: Direct file upload to S3
export async function POST(request: NextRequest) {
  try {
    // Check if required environment variables are set
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
      return NextResponse.json(
        { success: false, message: MESSAGES.AWS_CREDENTIALS_NOT_CONFIGURED, status: STATUS_CODE.INTERNAL_SERVER_ERROR },
      );
    }

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

    // Generate unique filename with upload type
    const fileName = generateUniqueFileName(file.name, uploadType);

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: file.type,
      Metadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        uploadType: uploadType,
        ...Object.fromEntries(
          Object.entries(metadata).map(([key, value]) => [`custom_${key}`, String(value)])
        ),
      },
    });

    await s3Client.send(uploadCommand);

    // Generate the public URL
    const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileName}`;

    return NextResponse.json({
      success: true,
      message: `${uploadType === 'cloth' ? 'Cloth image' : 'Document'} uploaded successfully`,
      data: {
        fileName: fileName,
        originalName: file.name,
        fileUrl: fileUrl,
        fileSize: file.size,
        fileType: file.type,
        uploadType: uploadType,
        metadata: metadata,
      },
    });

  } catch (error: any) {
    console.error('S3 Upload Error:', error);
    return NextResponse.json(
      { success: false, message: `Upload failed: ${error.message}`, status: STATUS_CODE.INTERNAL_SERVER_ERROR },
    );
  }
}

// GET: Generate presigned URL for direct client-side upload
export async function GET(request: NextRequest) {
  try {
    // Check if required environment variables are set
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_S3_BUCKET_NAME) {
      return NextResponse.json(
        { success: false, message: MESSAGES.AWS_CREDENTIALS_NOT_CONFIGURED, status: STATUS_CODE.INTERNAL_SERVER_ERROR },
      );
    }

    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get('fileName');
    const fileType = searchParams.get('fileType');
    const uploadType = searchParams.get('uploadType') as UploadType;
    const metadataString = searchParams.get('metadata');

    if (!fileName || !fileType) {
      return NextResponse.json(
        { success: false, message: MESSAGES.FILE_NAME_AND_FILE_TYPE_REQUIRED, status: STATUS_CODE.ERROR },
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

    // Validate file type based on upload type
    const tempFile = { type: fileType } as File;
    if (!isValidFileType(tempFile, uploadType)) {
      const allowedTypes = uploadType === 'cloth' 
        ? 'images (JPEG, PNG, GIF, WebP)' 
        : 'images, PDFs, and documents';
      return NextResponse.json(
        { success: false, message: `Invalid file type for ${uploadType} upload. Only ${allowedTypes} are allowed.`, status: STATUS_CODE.ERROR },
      );
    }

    // Generate unique filename with upload type
    const uniqueFileName = generateUniqueFileName(fileName, uploadType);

    // Create presigned URL for upload
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: uniqueFileName,
      ContentType: fileType,
      Metadata: {
        originalName: fileName,
        uploadedAt: new Date().toISOString(),
        uploadType: uploadType,
        ...Object.fromEntries(
          Object.entries(metadata).map(([key, value]) => [`custom_${key}`, String(value)])
        ),
      },
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour

    // Generate the final public URL
    const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${uniqueFileName}`;

    return NextResponse.json({
      success: true,
      data: {
        presignedUrl,
        fileName: uniqueFileName,
        fileUrl,
        uploadType: uploadType,
        metadata: metadata,
      },
    });

  } catch (error: any) {
    console.error('Presigned URL Error:', error);
    return NextResponse.json(
      { success: false, message: `Failed to generate presigned URL: ${error.message}`, status: STATUS_CODE.INTERNAL_SERVER_ERROR },
    );
  }
}