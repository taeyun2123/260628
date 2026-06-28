import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: certificationId } = await params;
    const body = await request.json();
    const { user_id, rating } = body;

    if (!user_id || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: '올바른 사용자 ID와 1~5 사이의 별점(rating)이 필요합니다.' }, { status: 400 });
    }

    const certRef = adminDb.collection('certifications').doc(certificationId);
    const certDoc = await certRef.get();

    if (!certDoc.exists) {
      return NextResponse.json({ error: '해당 인증 기록을 찾을 수 없습니다.' }, { status: 404 });
    }

    const certification = certDoc.data();

    if (certification?.user_id !== user_id) {
      return NextResponse.json({ error: '본인의 기록만 평가할 수 있습니다.' }, { status: 403 });
    }

    // 날짜 체크: "오늘" 작성된 기록인지 확인
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const created_at = certification?.created_at?.toDate ? certification.created_at.toDate() : new Date(certification?.created_at);
    const isToday = created_at >= today && created_at < tomorrow;

    if (!isToday) {
      return NextResponse.json({ error: '과거의 기록은 평가를 수정할 수 없습니다.' }, { status: 400 });
    }

    await certRef.update({ rating });
    const updatedCert = { id: certRef.id, ...certification, rating };

    return NextResponse.json({ message: '성찰 평가가 업데이트 되었습니다.', cert: updatedCert }, { status: 200 });

  } catch (error) {
    console.error('Rating Update Error:', error);
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
  }
}
