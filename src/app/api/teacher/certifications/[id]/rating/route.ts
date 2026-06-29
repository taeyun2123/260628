import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: certificationId } = await params;
    const body = await request.json();
    const { teacher_rating } = body;

    if (typeof teacher_rating !== 'number' || teacher_rating < 1 || teacher_rating > 5) {
      return NextResponse.json({ error: '유효한 햇님 점수(1~5)가 필요합니다.' }, { status: 400 });
    }

    const certRef = doc(db, 'certifications', certificationId);
    const certDoc = await getDoc(certRef);

    if (!certDoc.exists) {
      return NextResponse.json({ error: '인증 기록을 찾을 수 없습니다.' }, { status: 404 });
    }

    await updateDoc(certRef, { teacher_rating });
    const updated = { id: certRef.id, ...certDoc.data(), teacher_rating };

    return NextResponse.json({ message: '평가가 저장되었습니다.', certification: updated }, { status: 200 });
  } catch (error) {
    console.error('Teacher Rating Error:', error);
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
  }
}
