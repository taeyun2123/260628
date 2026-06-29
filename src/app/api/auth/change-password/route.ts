import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, new_password } = body;

    if (!user_id || !new_password) {
      return NextResponse.json({ error: '사용자 ID와 새 비밀번호를 입력해주세요.' }, { status: 400 });
    }

    if (new_password.length < 4) {
      return NextResponse.json({ error: '비밀번호는 최소 4자 이상이어야 합니다.' }, { status: 400 });
    }

    const password_hash = await bcrypt.hash(new_password, 10);

    const userRef = doc(db, 'users', user_id);
    await updateDoc(userRef, {
      password_hash: password_hash,
      is_password_changed: true,
    });

    return NextResponse.json({ message: '비밀번호가 성공적으로 변경되었습니다.' }, { status: 200 });
  } catch (error) {
    console.error('비밀번호 변경 에러:', error);
    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
