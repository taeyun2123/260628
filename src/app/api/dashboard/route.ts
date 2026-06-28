import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

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
    const studentsSnapshot = await adminDb.collection('users')
      .where('class_code', '==', class_id)
      .where('role', '==', 'STUDENT')
      .get();

    const students = studentsSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as any));

    // tree_profile 조회를 위해 병렬 쿼리 (최대 학생수 감안하여 Promise.all)
    const treeProfilesData = await Promise.all(
      students.map((s: any) => adminDb.collection('treeProfiles').where('user_id', '==', s.id).limit(1).get())
    );
    const treeProfiles = treeProfilesData.map((snap: any) => snap.empty ? null : snap.docs[0].data());

    students.forEach((s: any, i: number) => {
      s.tree_profile = treeProfiles[i];
    });

    // 2. 오늘 날짜 구하기 (00:00 ~ 23:59)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 3. 오늘 등록된 인증(Certification) 내역 조회
    const certsSnapshot = await adminDb.collection('certifications')
      .where('class_code', '==', class_id)
      .where('created_at', '>=', today)
      .where('created_at', '<', tomorrow)
      .get();

    const todayCertifications = certsSnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as any));

    // 4. 데이터 맵핑 및 익명화(Privacy) 처리 로직
    const dashboardData = students.map((student: any) => {
      // 해당 학생의 오늘 인증 기록 찾기 (최신순 등 규칙 가능하지만 일단 배열에서 찾기)
      const cert = todayCertifications.find((c: any) => c.user_id === student.id);
      
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
    dashboardData.sort((a: any, b: any) => {
      if (a.name === '잠자는 씨앗' && b.name !== '잠자는 씨앗') return 1;
      if (a.name !== '잠자는 씨앗' && b.name === '잠자는 씨앗') return -1;
      const nameA = a.name || '알 수 없음';
      const nameB = b.name || '알 수 없음';
      return nameA.localeCompare(nameB);
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
