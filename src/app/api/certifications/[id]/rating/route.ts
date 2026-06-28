import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const certificationId = params.id;
    const body = await request.json();
    const { user_id, rating } = body;

    if (!user_id || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: '올바른 사용자 ID와 1~5 사이의 별점(rating)이 필요합니다.' }, { status: 400 });
    }

    const certification = await prisma.certification.findUnique({
      where: { id: certificationId },
    });

    if (!certification) {
      return NextResponse.json({ error: '해당 인증 기록을 찾을 수 없습니다.' }, { status: 404 });
    }

    if (certification.user_id !== user_id) {
      return NextResponse.json({ error: '본인의 기록만 평가할 수 있습니다.' }, { status: 403 });
    }

    // 날짜 체크: "오늘" 작성된 기록인지 확인
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = certification.created_at >= today && certification.created_at < tomorrow;

    if (!isToday) {
      return NextResponse.json({ error: '과거의 기록은 평가를 수정할 수 없습니다.' }, { status: 400 });
    }

    const updatedCert = await prisma.certification.update({
      where: { id: certificationId },
      data: { rating },
    });

    return NextResponse.json({ message: '성찰 평가가 업데이트 되었습니다.', cert: updatedCert }, { status: 200 });

  } catch (error) {
    console.error('Rating Update Error:', error);
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
  }
}
