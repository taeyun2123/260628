import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('class_id');

  if (!classId) {
    return NextResponse.json({ error: 'class_id가 필요합니다.' }, { status: 400 });
  }

  try {
    // 1. 해당 학급의 전체 학생 수
    const totalStudentsCount = await prisma.user.count({
      where: {
        class_id: classId,
        role: 'STUDENT',
      },
    });

    if (totalStudentsCount === 0) {
      return NextResponse.json({ trend: [] }, { status: 200 });
    }

    // 2. 해당 학급 학생들의 ID 목록 추출 (Certification 조회를 위함)
    const students = await prisma.user.findMany({
      where: { class_id: classId, role: 'STUDENT' },
      select: { id: true },
    });
    const studentIds = students.map(s => s.id);

    // 3. 최근 7일(오늘 포함) 데이터 생성
    const trendData = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 과거 6일 전부터 오늘까지 순회 (총 7일)
    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() - i);
      
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);

      // 해당 날짜의 Certification 개수 세기 (학생별로 1개씩이므로 count를 그대로 사용 가능. 중복 시 distinct 처리 필요하지만 현재 1일 1개 목표)
      const certCount = await prisma.certification.count({
        where: {
          user_id: { in: studentIds },
          created_at: {
            gte: targetDate,
            lt: nextDay,
          },
        },
      });

      const count = certCount;

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
