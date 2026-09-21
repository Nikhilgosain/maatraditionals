/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest } from 'next/server';
import { connectMongoDB } from '@/lib/db/mongo';
import StoredFile from '@/models/storedFile';
import mongoose from 'mongoose';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return new Response('File not found', { status: 404 });
    }

    await connectMongoDB();

    const storedFile: any = await StoredFile.findById(id).lean();

    if (!storedFile) {
      return new Response('File not found', { status: 404 });
    }

    const raw = storedFile.data as any;

    let buffer: Buffer;
    if (Buffer.isBuffer(raw)) {
      buffer = raw;
    } else if (raw && typeof raw === 'object' && raw.buffer) {
      const source = Buffer.isBuffer(raw.buffer) ? raw.buffer : Buffer.from(raw.buffer);
      const len = typeof raw.position === 'number' && raw.position >= 0 ? raw.position : source.length;
      buffer = source.subarray(0, len);
    } else {
      buffer = Buffer.from(raw);
    }

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': storedFile.contentType,
        'Content-Disposition': `inline; filename="${storedFile.originalName}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new Response('Internal server error', { status: 500 });
  }
}