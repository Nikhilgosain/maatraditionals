/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/db/mongo';
import SubCategory from '@/models/subcategories';
import { MESSAGES, STATUS_CODE } from '@/utils/constant';

export async function GET(request: NextRequest) {
    try {
        await connectMongoDB();
        
        const { searchParams } = new URL(request.url);
        const categoryId = searchParams.get('categoryId');
        const search = searchParams.get('search');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '5');
        
        // Build query
        const query: any = {
            deleted_at: null
        };
        
        if (categoryId) {
            query.categoryId = categoryId;
        }
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                // Only use regex for string fields, for numbers try exact match
                ...(isNaN(Number(search)) 
                    ? [] 
                    : [{ serialNumber: Number(search) }])
            ];
        }
        
        // Calculate pagination
        const skip = (page - 1) * limit;
        
        // Get total count for pagination
        const totalCount = await SubCategory.countDocuments(query);
        const totalPages = Math.ceil(totalCount / limit);
        
        // Get subcategories with pagination
        const subCategories = await SubCategory.find(query)
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });
        
        return NextResponse.json({
            subCategories,
            pagination: {
                currentPage: page,
                totalPages,
                totalCount,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }, 
            status: STATUS_CODE.SUCCESS,
            message: MESSAGES.SUBCATEGORIES_FETCHED_SUCCESSFULLY,
        });
        
    } catch (error) {
        console.error('Error fetching subcategories:', error);
        return NextResponse.json(
            { error: MESSAGES.INTERNAL_SERVER_ERROR, status: STATUS_CODE.INTERNAL_SERVER_ERROR },
        );
    }
}

export async function DELETE(request: NextRequest) {
    try {
        await connectMongoDB();
        
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const userId = searchParams.get('userId'); // Optional: pass user ID for deleted_by
        
        if (!id) {
            return NextResponse.json(
                { error: MESSAGES.SUBCATEGORY_ID_REQUIRED, status: STATUS_CODE.ERROR },
            );
        }
        
        // Soft delete: update deleted_at and deleted_by fields
        const deletedSubCategory = await SubCategory.findByIdAndUpdate(
            id,
            {
                deleted_at: new Date(),
                deleted_by: userId || null
            },
            { new: true }
        );
        
        if (!deletedSubCategory) {
            return NextResponse.json(
                { error: MESSAGES.SUBCATEGORY_NOT_FOUND, status: STATUS_CODE.NOT_FOUND },
            );
        }
        
        return NextResponse.json({
            message: MESSAGES.SUBCATEGORY_DELETED_SUCCESSFULLY,
            deletedSubCategory
        });
        
    } catch (error) {
        console.error('Error deleting subcategory:', error);
        return NextResponse.json(
            { error: MESSAGES.FAILED_TO_DELETE_SUBCATEGORY, status: STATUS_CODE.INTERNAL_SERVER_ERROR },
        );
    }
}

export async function POST(req: NextRequest) {
  try {
    await connectMongoDB();

    const body = await req.json();
    const { categoryId, name, imageUrl, serialNumber } = body;

    // Validate required fields
    if (!categoryId || !name || !imageUrl) {
      return NextResponse.json(
        { success: false, message: MESSAGES.MISSING_REQUIRED_FIELDS, status: STATUS_CODE.ERROR },
      );
    }

    // Check if active subcategory with same name already exists for this category
    const existingSubCategory = await SubCategory.findOne({ 
      categoryId, 
      name,
      deleted_at: null // Only check non-deleted subcategories
    });
    if (existingSubCategory) {
      return NextResponse.json(
        { success: false, message: MESSAGES.SUBCATEGORY_WITH_SAME_NAME_ALREADY_EXISTS, status: STATUS_CODE.CONFLICT },
      );
    }

    // Create new subcategory
    const newSubCategory = new SubCategory({
      categoryId,
      name,
      imageUrl,
      serialNumber: serialNumber || undefined
    });

    const savedSubCategory = await newSubCategory.save();

    return NextResponse.json({ 
      success: true, 
      message: MESSAGES.SUBCATEGORY_CREATED_SUCCESSFULLY,
      data: savedSubCategory, 
      status: STATUS_CODE.SUCCESS,
    });

  } catch (error: any) {
    console.error('Error creating subcategory:', error);
    return NextResponse.json(
      { success: false, message: MESSAGES.INTERNAL_SERVER_ERROR, errorMessage: error.message, status: STATUS_CODE.INTERNAL_SERVER_ERROR },
    );
  }
}
