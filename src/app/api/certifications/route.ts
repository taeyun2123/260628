import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, action, daily_goal, image_url, comment } = body;

    if (!user_id || !action) {
      return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 사용자의 오늘자 인증 레코드 찾기
    const existingCert = await prisma.certification.findFirst({
      where: {
        user_id,
        created_at: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (action === 'SET_GOAL') {
      if (existingCert) {
        if (existingCert.status === 'APPROVED') {
          return NextResponse.json({ error: '이미 인증이 완료되어 목표를 수정할 수 없습니다.' }, { status: 400 });
        }
        
        // PENDING 상태면 목표 수정 (업데이트)
        const updatedCert = await prisma.certification.update({
          where: { id: existingCert.id },
          data: { daily_goal },
        });
        return NextResponse.json({ message: '목표가 수정되었습니다.', cert: updatedCert }, { status: 200 });
      }

      if (!daily_goal) {
        return NextResponse.json({ error: '목표를 입력해주세요.' }, { status: 400 });
      }

      const newCert = await prisma.certification.create({
        data: {
          user_id,
          daily_goal,
          status: 'PENDING',
        },
      });

      return NextResponse.json({ message: '목표가 설정되었습니다.', cert: newCert }, { status: 200 });
    }

    if (action === 'CERTIFY') {
      if (!existingCert || existingCert.status === 'APPROVED') {
        return NextResponse.json({ error: '인증할 목표가 없거나 이미 인증을 완료했습니다.' }, { status: 400 });
      }

      // 트랜잭션을 통해 인증 업데이트 및 XP/레벨업 동시 처리
      const result = await prisma.$transaction(async (tx) => {
        // 1. 인증 상태 업데이트
        const updatedCert = await tx.certification.update({
          where: { id: existingCert.id },
          data: {
            image_url: image_url || '/placeholder.png', // 모의 파일 업로드 URL
            comment: comment || '',
            status: 'APPROVED',
          },
        });

        // 2. 나무 프로필 조회
        const treeProfile = await tx.treeProfile.findUnique({
          where: { user_id },
        });

        if (!treeProfile) {
          throw new Error('나무 프로필을 찾을 수 없습니다.');
        }

        // 3. XP 추가 및 레벨업 로직
        const XP_GAIN = 10;
        const MAX_LEVEL = 5;
        let newXp = treeProfile.current_xp + XP_GAIN;
        let newLevel = treeProfile.tree_level;
        let levelUpOccurred = false;

        const nextLevelReq = newLevel * 50;

        if (newXp >= nextLevelReq && newLevel < MAX_LEVEL) {
          newLevel += 1;
          levelUpOccurred = true;
          // 남은 경험치 이월 여부 (요구사항에 맞춰 여기선 이월 유지)
        } else if (newLevel >= MAX_LEVEL) {
          // 최대 레벨 도달 시 레벨 제한
          newLevel = MAX_LEVEL;
        }

        // 4. 프로필 업데이트
        const updatedTree = await tx.treeProfile.update({
          where: { user_id },
          data: {
            current_xp: newXp,
            tree_level: newLevel,
          },
        });

        return { updatedCert, updatedTree, levelUpOccurred };
      });

      return NextResponse.json({ 
        message: '인증이 완료되었습니다!', 
        levelUpOccurred: result.levelUpOccurred,
        tree: result.updatedTree 
      }, { status: 200 });
    }

    return NextResponse.json({ error: '알 수 없는 action 입니다.' }, { status: 400 });

  } catch (error) {
    console.error('Certification Error:', error);
    return NextResponse.json({ error: '서버 내부 오류가 발생했습니다.' }, { status: 500 });
  }
}
