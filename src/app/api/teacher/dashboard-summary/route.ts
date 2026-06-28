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
    // 1. 해당 학급의 모든 학생 가져오기
    const students = await prisma.user.findMany({
      where: {
        class_id: classId,
        role: 'STUDENT',
      },
      include: {
        tree_profile: true,
      },
    });

    if (!students || students.length === 0) {
      return NextResponse.json({ certified: [], uncertified: [] }, { status: 200 });
    }

    // 2. 오늘의 인증 기록 가져오기
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCertifications = await prisma.certification.findMany({
      where: {
        user_id: { in: students.map(s => s.id) },
        created_at: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    const certifiedList: any[] = [];
    const uncertifiedList: any[] = [];

    students.forEach((student) => {
      const cert = todayCertifications.find(c => c.user_id === student.id);
      
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
