import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json({ error: '학생 ID가 필요합니다.' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: studentId },
      data: { is_nudged: true },
    });

    return NextResponse.json({ message: '독려 알림을 발송했습니다.', student: updatedUser }, { status: 200 });
  } catch (error) {
    console.error('Teacher Nudge Error:', error);
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
  }
}
