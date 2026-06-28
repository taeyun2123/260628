"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [loginType, setLoginType] = useState<"STUDENT" | "TEACHER">("STUDENT");
  const [classCode, setClassCode] = useState("");
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 미들웨어에서 거부당하고 튕겨온 경우 에러 메시지 표시
    const errorParam = searchParams.get("error");
    if (errorParam === "unauthorized" || errorParam === "invalid_session") {
      setErrorMsg("선생님 페이지에 접근하려면 먼저 로그인해 주세요.");
    } else if (errorParam === "forbidden") {
      setErrorMsg("학생 계정으로는 선생님 페이지에 접근할 수 없습니다.");
    }
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      // 1. API 호출
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          loginType,
          class_code: loginType === "STUDENT" ? classCode.trim().toUpperCase() : undefined,
          login_id: studentId.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "로그인에 실패했습니다.");
        setIsLoading(false);
        return;
      }

      // 로그인 성공 시 로컬 스토리지에 사용자 정보 저장
      localStorage.setItem('study_forest_user', JSON.stringify({
        id: data.user.id,
        login_id: data.user.login_id,
        class_id: data.user.class_id,
        class_code: loginType === "STUDENT" ? classCode.trim().toUpperCase() : "TEACHER_DASHBOARD",
        role: data.user.role,
      }));

      // 리다이렉트 분기
      if (data.user.role === "TEACHER") {
        router.push("/teacher/dashboard");
      } else {
        // 학생인 경우 비밀번호 변경 확인
        if (data.user.is_password_changed === false) {
          router.push("/change-password");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (err) {
      console.error("로그인 중 에러 발생:", err);
      setErrorMsg("서버와 통신 중 오류가 발생했습니다.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-green-50 p-4 dark:bg-zinc-950">
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-zinc-900">
        
        {/* 헤더 섹션 */}
        <div className="bg-green-600 px-6 py-8 text-center dark:bg-green-700">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-4xl shadow-md">
            🌳
          </div>
          <h1 className="mt-4 text-2xl font-black tracking-tight text-white">
            우리 반 공부숲
          </h1>
          <p className="mt-2 text-sm font-medium text-green-100">
            매일 조금씩 자라나는 너와 나의 나무
          </p>
        </div>

        {/* 탭 섹션 */}
        <div className="flex border-b border-gray-200 dark:border-zinc-800">
          <button
            onClick={() => { setLoginType("STUDENT"); setErrorMsg(""); }}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${
              loginType === "STUDENT"
                ? "border-b-2 border-green-600 text-green-600 dark:border-green-400 dark:text-green-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            학생 로그인
          </button>
          <button
            onClick={() => { setLoginType("TEACHER"); setErrorMsg(""); }}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${
              loginType === "TEACHER"
                ? "border-b-2 border-green-600 text-green-600 dark:border-green-400 dark:text-green-400"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            선생님 로그인
          </button>
        </div>

        {/* 로그인 폼 영역 */}
        <div className="p-8">
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            
            {/* 학생 전용: 반 인증번호 */}
            {loginType === "STUDENT" && (
              <div>
                <label
                  htmlFor="classCode"
                  className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300"
                >
                  반 인증번호
                </label>
                <input
                  type="text"
                  id="classCode"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                  placeholder="예: FOREST1"
                  className="block w-full rounded-xl border-gray-300 bg-gray-50 p-4 text-center text-xl font-bold uppercase tracking-widest text-gray-900 outline-none transition-all focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-zinc-800 dark:text-white dark:focus:border-green-400 dark:focus:ring-green-400"
                  maxLength={10}
                  required
                />
              </div>
            )}

            <div>
              <label
                htmlFor="studentId"
                className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300"
              >
                {loginType === "STUDENT" ? "학번 + 이름" : "이메일 주소"}
              </label>
              <input
                type={loginType === "STUDENT" ? "text" : "email"}
                id="studentId"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder={loginType === "STUDENT" ? "예: 1101김가나" : "예: teacher@forest.com"}
                className="block w-full rounded-xl border-gray-300 bg-gray-50 p-3 text-gray-900 outline-none transition-all focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-zinc-800 dark:text-white dark:focus:border-green-400 dark:focus:ring-green-400"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-bold text-gray-700 dark:text-gray-300"
              >
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="block w-full rounded-xl border-gray-300 bg-gray-50 p-3 text-gray-900 outline-none transition-all focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-zinc-800 dark:text-white dark:focus:border-green-400 dark:focus:ring-green-400"
                required
              />
            </div>

            {errorMsg && (
              <p className="rounded-lg bg-red-50 p-3 text-center text-sm font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                ⚠️ {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 flex w-full items-center justify-center rounded-xl bg-green-600 py-4 text-lg font-bold text-white shadow-lg shadow-green-600/30 transition-all hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-green-700/40 active:scale-95 disabled:pointer-events-none disabled:opacity-70 dark:bg-green-500 dark:shadow-green-500/20 dark:hover:bg-green-600"
            >
              {isLoading ? "인증 중..." : "숲으로 들어가기 🚀"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
