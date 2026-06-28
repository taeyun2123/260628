import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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
      const classInfo = await prisma.class.findUnique({
        where: { class_code },
      });

      if (!classInfo) {
        return NextResponse.json(
          { error: '유효하지 않은 반 인증번호입니다.' },
          { status: 404 }
        );
      }
      classId = classInfo.id;

      // 2단계: 아이디(login_id) 및 비밀번호 확인
      user = await prisma.user.findFirst({
        where: {
          class_id: classId,
          login_id: login_id,
          role: 'STUDENT',
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: '해당 학급에 일치하는 학생 아이디가 존재하지 않습니다.' },
          { status: 401 }
        );
      }
    } else if (loginType === 'TEACHER') {
      // 선생님은 이메일(login_id)과 비밀번호로만 로그인
      user = await prisma.user.findFirst({
        where: {
          login_id: login_id,
          role: 'TEACHER',
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: '일치하는 선생님 계정이 존재하지 않습니다.' },
          { status: 401 }
        );
      }
      classId = user.class_id;
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
