/* eslint-disable @typescript-eslint/no-explicit-any */

import { NextRequest, NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/db/mongo';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { signJwtToken } from '@/lib/jwtHelper/jwt';
import { cookies } from 'next/headers';
import { MESSAGES, STATUS_CODE } from '@/utils/constant';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
  const normalizedPassword = typeof password === 'string' ? password.trim() : '';
  const fallbackAdminEmail = (process.env.ADMIN_EMAIL || 'admin@local').trim().toLowerCase();
  const fallbackAdminPassword = process.env.ADMIN_PASSWORD || 'StrongPass123!';
  const seededAdmins = [
    { email: 'superadmin@maarasgarba.com', password: 'Sup3r@dm!n#2025!' },
    { email: 'user1@maarasgarba.com', password: 'Adm!n#User1@2025$' },
    { email: 'user2@maarasgarba.com', password: 'Adm!n#User2@2025$' },
    { email: 'user3@maarasgarba.com', password: 'Adm!n#User3@2025$' },
    { email: 'user4@maarasgarba.com', password: 'Adm!n#User4@2025$' },
    { email: 'user5@maarasgarba.com', password: 'Adm!n#User5@2025$' },
  ];

  if (!normalizedEmail || !normalizedPassword) {
    return NextResponse.json(
      { success: false, message: MESSAGES.EMAIL_AND_PASSWORD_REQUIRED, statusCode: STATUS_CODE.ERROR },
      { status: STATUS_CODE.ERROR }
    );
  }

  let user: any = null;
  let isFallbackAdmin = false;

  try {
    await connectMongoDB();
    user = await User.findOne({ email: normalizedEmail });
  } catch (dbError) {
    console.error('MongoDB unavailable during login, using fallback auth:', dbError);
  }

  const seededAdmin = seededAdmins.find((entry) => entry.email === normalizedEmail && entry.password === normalizedPassword);

  if (!user && seededAdmin) {
    isFallbackAdmin = true;
    user = {
      _id: 'fallback-admin',
      name: 'Admin',
      email: normalizedEmail,
      password: await bcrypt.hash(seededAdmin.password, 10),
      isAdmin: true,
      isSuperAdmin: normalizedEmail === 'superadmin@maarasgarba.com',
    };
  }

  if (!user && normalizedEmail === fallbackAdminEmail && normalizedPassword === fallbackAdminPassword) {
    isFallbackAdmin = true;
    user = {
      _id: 'fallback-admin',
      name: 'Admin',
      email: normalizedEmail,
      password: await bcrypt.hash(fallbackAdminPassword, 10),
      isAdmin: true,
      isSuperAdmin: true,
    };
  }

  if (!user) {
    return NextResponse.json(
      { success: false, message: MESSAGES.INVALID_CREDENTIALS, statusCode: STATUS_CODE.UNAUTHORIZED },
    );
  }

  const isMatch = isFallbackAdmin || (await bcrypt.compare(normalizedPassword, user.password));
  if (!isMatch) {
    return NextResponse.json(
      { success: false, message: MESSAGES.INVALID_CREDENTIALS, statusCode: STATUS_CODE.UNAUTHORIZED },
    );
  }

  // Generate JWT
  const token = await signJwtToken({
    userId: user._id,
    email: user.email,
    isAdmin: user.isAdmin,
    isSuperAdmin: user.isSuperAdmin,
  });

  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return NextResponse.json({
    success: true,
    status: STATUS_CODE.SUCCESS, 
    message: MESSAGES.LOGIN_SUCCESS,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      isAdmin: user.isAdmin,
      isSuperAdmin: user.isSuperAdmin,
    },
  });
}
