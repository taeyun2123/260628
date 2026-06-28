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

    // 3. 최근 7일(오늘 포함) 데이터 생성
    const trendData: any[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 과거 6일 전부터 오늘까지 순회 (총 7일)
    // Firestore 쿼리 병렬 처리로 속도 향상
    const dateQueries: any[] = [];
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() - i);
      
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      dateQueries.push({
        targetDate,
        promise: adminDb.collection('certifications')
          .where('class_code', '==', classId)
          .where('created_at', '>=', targetDate)
          .where('created_at', '<', nextDay)
          .count()
          .get()
      });
    }

    const results = await Promise.all(dateQueries.map(q => q.promise));

    results.forEach((certCountSnap, idx) => {
      const targetDate = dateQueries[idx].targetDate;
      const count = certCountSnap.data().count;

      const month = targetDate.getMonth() + 1;
      const date = targetDate.getDate();
      
      trendData.push({
        date: `${month}/${date}`,
        count: count,
      });
    });

    return NextResponse.json({ trend: trendData }, { status: 200 });
  } catch (error) {
    console.error('Teacher Attendance Trend Error:', error);
    return NextResponse.json({ error: '데이터를 불러오는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
