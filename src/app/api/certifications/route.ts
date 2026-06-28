import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

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

    // 1. 유저 정보 조회 (class_code 확인용)
    const userDoc = await adminDb.collection('users').doc(user_id).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }
    const class_code = userDoc.data()?.class_code;

    // 2. 사용자의 오늘자 인증 레코드 찾기
    const certsSnapshot = await adminDb.collection('certifications')
      .where('user_id', '==', user_id)
      .where('created_at', '>=', today)
      .where('created_at', '<', tomorrow)
      .limit(1)
      .get();
    
    let existingCert = certsSnapshot.empty ? null : { id: certsSnapshot.docs[0].id, ...certsSnapshot.docs[0].data() } as any;

    if (action === 'SET_GOAL') {
      if (existingCert) {
        if (existingCert.status === 'APPROVED') {
          return NextResponse.json({ error: '이미 인증이 완료되어 목표를 수정할 수 없습니다.' }, { status: 400 });
        }
        
        // PENDING 상태면 목표 수정
        await adminDb.collection('certifications').doc(existingCert.id).update({ daily_goal });
        existingCert.daily_goal = daily_goal;
        return NextResponse.json({ message: '목표가 수정되었습니다.', cert: existingCert }, { status: 200 });
      }

      if (!daily_goal) {
        return NextResponse.json({ error: '목표를 입력해주세요.' }, { status: 400 });
      }

      const newCertRef = await adminDb.collection('certifications').add({
        user_id,
        class_code,
        daily_goal,
        status: 'PENDING',
        created_at: new Date(),
      });

      return NextResponse.json({ message: '목표가 설정되었습니다.', cert: { id: newCertRef.id, daily_goal, status: 'PENDING' } }, { status: 200 });
    }

    if (action === 'CERTIFY') {
      if (!existingCert || existingCert.status === 'APPROVED') {
        return NextResponse.json({ error: '인증할 목표가 없거나 이미 인증을 완료했습니다.' }, { status: 400 });
      }

      // Firestore 트랜잭션을 통해 인증 업데이트 및 XP/레벨업 동시 처리
      const result = await adminDb.runTransaction(async (t: any) => {
        const certRef = adminDb.collection('certifications').doc(existingCert.id);
        const treeRef = adminDb.collection('treeProfiles').where('user_id', '==', user_id).limit(1);
        
        const treeSnap = await t.get(treeRef);
        if (treeSnap.empty) {
          throw new Error('나무 프로필을 찾을 수 없습니다.');
        }
        const treeDocRef = treeSnap.docs[0].ref;
        const treeProfile = treeSnap.docs[0].data();

        // 1. 인증 상태 업데이트
        t.update(certRef, {
          image_url: image_url || '/placeholder.png',
          comment: comment || '',
          status: 'APPROVED',
        });

        // 2. XP 추가 및 레벨업 로직
        const XP_GAIN = 10;
        const MAX_LEVEL = 5;
        let newXp = (treeProfile.current_xp || 0) + XP_GAIN;
        let newLevel = treeProfile.tree_level || 1;
        let levelUpOccurred = false;

        const nextLevelReq = newLevel * 50;

        if (newXp >= nextLevelReq && newLevel < MAX_LEVEL) {
          newLevel += 1;
          levelUpOccurred = true;
        } else if (newLevel >= MAX_LEVEL) {
          newLevel = MAX_LEVEL;
        }

        // 3. 프로필 업데이트
        t.update(treeDocRef, {
          current_xp: newXp,
          tree_level: newLevel,
        });

        return { levelUpOccurred, updatedTree: { current_xp: newXp, tree_level: newLevel } };
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
