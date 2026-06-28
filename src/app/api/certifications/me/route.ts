import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get('user_id');

  if (!user_id) {
    return NextResponse.json({ error: 'user_id가 필요합니다.' }, { status: 400 });
  }

  try {
    const userWithCertifications = await prisma.user.findUnique({
      where: { id: user_id },
      include: {
        tree_profile: true,
        certifications: {
          orderBy: {
            created_at: 'desc',
          },
        },
      },
    });

    if (!userWithCertifications) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: userWithCertifications.id,
        login_id: userWithCertifications.login_id,
        tree_profile: userWithCertifications.tree_profile,
      },
      certifications: userWithCertifications.certifications,
    }, { status: 200 });

  } catch (error) {
    console.error('Certifications Me Error:', error);
    return NextResponse.json({ error: '데이터를 불러오는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
