"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginFormComponent() {
  const searchParams = useSearchParams();
  const classCode = searchParams.get("classCode") || "";
  const router = useRouter();

  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          class_code: classCode,
          login_id: studentId,
          password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || "로그인에 실패했습니다.");
        setLoading(false);
        return;
      }

      // 로그인 성공 시 is_password_changed 값 확인
      if (data.user.is_password_changed === false) {
        router.push("/change-password");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error(error);
      setErrorMsg("서버와 통신 중 문제가 발생했습니다.");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-green-50 to-white font-sans dark:from-green-950 dark:to-black">
      <main className="flex w-full max-w-md flex-col items-center justify-center p-8">
        
        {/* Logo / Icon Area */}
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 shadow-sm dark:bg-green-900">
          <span className="text-4xl">📚</span>
        </div>

        {/* Title */}
        <h1 className="mb-2 text-center text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          로그인
        </h1>
        <p className="mb-8 text-center text-sm text-gray-600 dark:text-gray-300">
          {classCode ? `반 코드(${classCode}) 인증이 완료되었습니다.` : "반 코드가 입력되지 않았습니다."}
        </p>

        {/* Login Form Card */}
        <div className="w-full rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-200 dark:bg-zinc-900 dark:ring-gray-800">
          <form className="flex flex-col gap-5" onSubmit={handleLogin}>
            {/* ID Input */}
            <div>
              <label htmlFor="studentId" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                아이디 (학번+이름)
              </label>
              <input
                type="text"
                id="studentId"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="예: 1101김가나"
                className="block w-full rounded-xl border-gray-300 bg-gray-50 p-4 text-lg font-medium text-gray-900 outline-none transition-all focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-zinc-800 dark:text-white dark:focus:border-green-400 dark:focus:ring-green-400"
                required
              />
            </div>
            
            {/* Password Input */}
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="block w-full rounded-xl border-gray-300 bg-gray-50 p-4 text-lg font-medium text-gray-900 outline-none transition-all focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-500 dark:border-gray-600 dark:bg-zinc-800 dark:text-white dark:focus:border-green-400 dark:focus:ring-green-400"
                required
              />
            </div>

            {errorMsg && (
              <div className="text-sm font-medium text-red-500">
                {errorMsg}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="mt-4 flex w-full items-center justify-center rounded-xl bg-green-600 px-5 py-4 text-lg font-bold text-white transition-all hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 active:scale-95 disabled:opacity-50 dark:bg-green-500 dark:hover:bg-green-600 dark:focus:ring-green-800"
            >
              {loading ? "로그인 중..." : "로그인"}
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginFormComponent />
    </Suspense>
  );
}
