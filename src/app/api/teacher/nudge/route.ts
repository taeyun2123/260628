import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json({ error: '학생 ID가 필요합니다.' }, { status: 400 });
    }

    await adminDb.collection('users').doc(studentId).update({ is_nudged: true });
    
    // 클라이언트에 반환하기 위해 다시 조회
    const userDoc = await adminDb.collection('users').doc(studentId).get();
    const updatedUser = { id: userDoc.id, ...userDoc.data() };

    return NextResponse.json({ message: '독려 알림을 발송했습니다.', student: updatedUser }, { status: 200 });
  } catch (error) {
    console.error('Teacher Nudge Error:', error);
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
  }
}
