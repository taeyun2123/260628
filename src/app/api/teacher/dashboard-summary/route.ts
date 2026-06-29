import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit as firestoreLimit } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const classId = searchParams.get('class_id');

  if (!classId) {
    return NextResponse.json({ error: 'class_id가 필요합니다.' }, { status: 400 });
  }

  try {
    // 1. 해당 학급의 모든 학생 가져오기
    const studentsQuery = query(
      collection(db, 'users'),
      where('class_code', '==', classId),
      where('role', '==', 'STUDENT')
    );
    const studentsSnap = await getDocs(studentsQuery);

    const students = studentsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as any));

    if (students.length === 0) {
      return NextResponse.json({ certified: [], uncertified: [] }, { status: 200 });
    }

    // 병렬로 treeProfiles 조회
    const treeProfilesData = await Promise.all(
      students.map((s: any) => {
        const treeQuery = query(collection(db, 'treeProfiles'), where('user_id', '==', s.id), firestoreLimit(1));
        return getDocs(treeQuery);
      })
    );
    const treeProfiles = treeProfilesData.map((snap: any) => snap.empty ? null : snap.docs[0].data());

    students.forEach((s: any, i: number) => {
      s.tree_profile = treeProfiles[i];
    });

    // 2. 오늘의 인증 기록 가져오기
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 해당 학급의 전체 인증을 가져온 후 in-memory에서 필터링 (복합 인덱스 오류 방지)
    const certsQuery = query(
      collection(db, 'certifications'),
      where('class_code', '==', classId)
    );
    const certsSnap = await getDocs(certsQuery);

    const allCertifications = certsSnap.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as any));
    const todayCertifications = allCertifications.filter((c: any) => {
      const d = c.created_at?.toDate ? c.created_at.toDate() : new Date(c.created_at);
      return d >= today && d < tomorrow;
    });

    const certifiedList: any[] = [];
    const uncertifiedList: any[] = [];

    students.forEach((student: any) => {
      const cert = todayCertifications.find((c: any) => c.user_id === student.id);
      
      if (cert) {
        certifiedList.push({
          student_id: student.id,
          name: student.login_id, // 학번이름
          tree_level: student.tree_profile?.tree_level || 1,
          current_xp: student.tree_profile?.current_xp || 0,
          daily_goal: cert.daily_goal,
          image_url: cert.image_url,
          comment: cert.comment,
          rating: cert.rating,
          teacher_rating: cert.teacher_rating,
          status: cert.status, // PENDING | APPROVED
          certification_id: cert.id,
        });
      } else {
        uncertifiedList.push({
          student_id: student.id,
          name: student.login_id,
          is_nudged: student.is_nudged,
        });
      }
    });

    return NextResponse.json({ certified: certifiedList, uncertified: uncertifiedList }, { status: 200 });
  } catch (error) {
    console.error('Teacher Dashboard Summary Error:', error);
    return NextResponse.json({ error: '데이터를 불러오는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
