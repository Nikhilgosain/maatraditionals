import { MESSAGES, STATUS_CODE } from '@/utils/constant';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('token');
  return NextResponse.json({ success: true, message: MESSAGES.LOGOUT_SUCCESS, status: STATUS_CODE.SUCCESS  });
}
