import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super_secret_key_for_study_forest'
);

export async function middleware(request: NextRequest) {
  // 보호할 경로 (예: /teacher 로 시작하는 모든 경로)
  if (request.nextUrl.pathname.startsWith('/teacher')) {
    const sessionCookie = request.cookies.get('study_forest_session');

    // 쿠키가 아예 없으면 로그인 페이지로 강제 이동
    if (!sessionCookie?.value) {
      return NextResponse.redirect(new URL('/?error=unauthorized', request.url));
    }

    try {
      // JWT 검증
      const { payload } = await jwtVerify(sessionCookie.value, JWT_SECRET);

      // 교사(TEACHER) 역할이 아니면 접근 차단
      if (payload.role !== 'TEACHER') {
        return NextResponse.redirect(new URL('/?error=forbidden', request.url));
      }

      // 검증 성공 -> 정상 접근 허용
      return NextResponse.next();
    } catch (err) {
      // JWT가 조작되었거나 만료된 경우
      console.error('Middleware JWT Error:', err);
      return NextResponse.redirect(new URL('/?error=invalid_session', request.url));
    }
  }

  // 그 외의 일반 경로는 통과
  return NextResponse.next();
}

// 미들웨어가 실행될 경로 범위 지정 (성능 최적화)
export const config = {
  matcher: ['/teacher/:path*'],
};
