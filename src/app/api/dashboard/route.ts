import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const class_id = searchParams.get('class_id');
  const user_id = searchParams.get('user_id');

  if (!class_id || !user_id) {
    return NextResponse.json(
      { error: 'class_id와 user_id가 필요합니다.' },
      { status: 400 }
    );
  }

  try {
    // 1. 해당 학급의 모든 학생 조회 (선생님 제외)
    const students = await prisma.user.findMany({
      where: {
        class_id: class_id,
        role: 'STUDENT',
      },
      include: {
        tree_profile: true,
      },
    });

    // 2. 오늘 날짜 구하기 (00:00 ~ 23:59)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 3. 오늘 등록된 인증(Certification) 내역 조회
    const todayCertifications = await prisma.certification.findMany({
      where: {
        user_id: { in: students.map((s) => s.id) },
        created_at: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // 4. 데이터 맵핑 및 익명화(Privacy) 처리 로직
    const dashboardData = students.map((student) => {
      // 해당 학생의 오늘 인증 기록 찾기 (최신순 등 규칙 가능하지만 일단 배열에서 찾기)
      const cert = todayCertifications.find((c) => c.user_id === student.id);
      
      const isCertified = cert?.status === 'APPROVED';
      const isGoalSet = cert !== undefined; // 상태가 PENDING이든 APPROVED이든 레코드가 있으면 목표 설정됨

      // 보안/낙인 방지 룰 적용:
      // 본인이 아니면서 + 인증(APPROVED)을 완료하지 않았다면 익명화 처리
      const isMe = student.id === user_id;
      const shouldMask = !isMe && !isCertified;

      return {
        id: student.id,
        // 익명화 조건에 해당하면 이름 가리기
        name: shouldMask ? '잠자는 씨앗' : student.login_id,
        tree_level: student.tree_profile?.tree_level || 1,
        current_xp: student.tree_profile?.current_xp || 0,
        daily_goal: shouldMask ? '비공개' : cert?.daily_goal || null,
        is_me: isMe,
        is_goal_set: isGoalSet,
        is_certified: isCertified,
      };
    });

    // 자신의 데이터가 최상단 또는 특정 위치에 오도록 정렬 가능 (일단 학번순 정렬)
    dashboardData.sort((a, b) => {
      if (a.name === '잠자는 씨앗' && b.name !== '잠자는 씨앗') return 1;
      if (a.name !== '잠자는 씨앗' && b.name === '잠자는 씨앗') return -1;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ students: dashboardData }, { status: 200 });
  } catch (error) {
    console.error('Dashboard Fetch Error:', error);
    return NextResponse.json(
      { error: '데이터를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
