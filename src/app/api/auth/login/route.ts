import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super_secret_key_for_study_forest'
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { loginType = 'STUDENT', class_code, login_id, password } = body;

    let user;
    let classId = null;

    if (loginType === 'STUDENT') {
      // 1단계: 반 인증번호(class_code) 확인
      const classDoc = await adminDb.collection('classes').doc(class_code).get();

      if (!classDoc.exists) {
        return NextResponse.json(
          { error: '유효하지 않은 반 인증번호입니다.' },
          { status: 404 }
        );
      }
      classId = class_code; // Firestore에서는 class_code를 ID로 사용

      // 2단계: 아이디(login_id) 및 비밀번호 확인
      const usersSnapshot = await adminDb.collection('users')
        .where('class_code', '==', class_code)
        .where('login_id', '==', login_id)
        .where('role', '==', 'STUDENT')
        .limit(1)
        .get();

      if (usersSnapshot.empty) {
        return NextResponse.json(
          { error: '해당 학급에 일치하는 학생 아이디가 존재하지 않습니다.' },
          { status: 401 }
        );
      }
      user = { id: usersSnapshot.docs[0].id, ...usersSnapshot.docs[0].data() } as any;
    } else if (loginType === 'TEACHER') {
      // 선생님은 이메일(login_id)과 비밀번호로만 로그인
      const usersSnapshot = await adminDb.collection('users')
        .where('login_id', '==', login_id)
        .where('role', '==', 'TEACHER')
        .limit(1)
        .get();

      if (usersSnapshot.empty) {
        return NextResponse.json(
          { error: '일치하는 선생님 계정이 존재하지 않습니다.' },
          { status: 401 }
        );
      }
      user = { id: usersSnapshot.docs[0].id, ...usersSnapshot.docs[0].data() } as any;
      classId = user.class_code;
    } else {
      return NextResponse.json({ error: '잘못된 로그인 타입입니다.' }, { status: 400 });
    }

    // 비밀번호 검증 (bcryptjs 사용)
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '비밀번호가 일치하지 않습니다.' },
        { status: 401 }
      );
    }

    // JWT 토큰 생성
    const token = await new SignJWT({
      id: user.id,
      role: user.role,
      class_id: classId,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h') // 24시간 유효
      .sign(JWT_SECRET);

    // 응답 객체 생성 및 쿠키 세팅
    const response = NextResponse.json(
      {
        message: '로그인 성공',
        user: {
          id: user.id,
          role: user.role,
          login_id: user.login_id,
          class_id: classId,
          is_password_changed: user.is_password_changed,
        },
      },
      { status: 200 }
    );

    response.cookies.set('study_forest_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 1일
    });

    return response;
  } catch (error) {
    console.error('로그인 에러:', error);
    return NextResponse.json(
      { error: '서버 내부 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
