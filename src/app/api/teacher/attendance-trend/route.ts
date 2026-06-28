import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('class_id');

  if (!classId) {
    return NextResponse.json({ error: 'class_id가 필요합니다.' }, { status: 400 });
  }

  try {
    // 1. 해당 학급의 전체 학생 수
    const totalStudentsSnap = await adminDb.collection('users')
      .where('class_code', '==', classId)
      .where('role', '==', 'STUDENT')
      .count()
      .get();

    if (totalStudentsSnap.data().count === 0) {
      return NextResponse.json({ trend: [] }, { status: 200 });
    }

    // 3. 최근 7일(오늘 포함) 데이터 생성 (인덱스 오류 회피를 위해 in-memory에서 필터링)
    const trendData: any[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 7일 전 날짜 구하기
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const certsSnap = await adminDb.collection('certifications')
      .where('class_code', '==', classId)
      .get();
    
    const allCerts = certsSnap.docs.map((doc: any) => doc.data());
    
    // 7일간 순회
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() - i);
      
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      const count = allCerts.filter((c: any) => {
        const d = c.created_at?.toDate ? c.created_at.toDate() : new Date(c.created_at);
        return d >= targetDate && d < nextDay;
      }).length;

      const month = targetDate.getMonth() + 1;
      const date = targetDate.getDate();
      
      trendData.push({
        date: `${month}/${date}`,
        count: count,
      });
    }

    return NextResponse.json({ trend: trendData }, { status: 200 });
  } catch (error) {
    console.error('Teacher Attendance Trend Error:', error);
    return NextResponse.json({ error: '데이터를 불러오는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
