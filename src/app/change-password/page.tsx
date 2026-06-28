"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("study_forest_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserId(user.id);
    } else {
      router.push("/");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setErrorMsg("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (newPassword.length < 4) {
      setErrorMsg("비밀번호는 최소 4자 이상이어야 합니다.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, new_password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "비밀번호 변경에 실패했습니다.");
      }

      // 로컬 스토리지 정보 갱신
      const userStr = localStorage.getItem("study_forest_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        user.is_password_changed = true;
        localStorage.setItem("study_forest_user", JSON.stringify(user));
      }

      router.push("/dashboard");
    } catch (err: any) {
      setErrorMsg(err.message || "오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-beige-50 to-white font-sans dark:from-zinc-950 dark:to-zinc-900 transition-colors">
      <main className="flex w-full max-w-md flex-col items-center justify-center p-8">
        
        {/* Warning / Notice Icon */}
        <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-yellow-100 shadow-sm dark:bg-yellow-900/40">
          <span className="text-4xl">🔐</span>
        </div>

        {/* Title */}
        <h1 className="mb-2 text-center text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
          비밀번호 변경
        </h1>
        <p className="mb-8 text-center text-sm text-gray-600 dark:text-gray-300">
          안전한 숲을 위해 초기 비밀번호를 변경해 주세요.
        </p>

        {/* Form Card */}
        <div className="w-full rounded-3xl bg-white p-8 shadow-md ring-1 ring-olive-100 dark:bg-zinc-900 dark:ring-zinc-800">
          <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
            {/* New Password Input */}
            <div>
              <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                새 비밀번호
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새로운 비밀번호"
                className="block w-full rounded-2xl border-gray-300 bg-beige-50 p-4 text-lg font-medium text-gray-900 outline-none transition-all focus:border-olive-500 focus:bg-white focus:ring-2 focus:ring-olive-500 dark:border-gray-600 dark:bg-zinc-800 dark:text-white dark:focus:border-olive-400 dark:focus:ring-olive-400"
                required
              />
            </div>
            
            {/* Confirm New Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                새 비밀번호 확인
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="비밀번호 다시 입력"
                className="block w-full rounded-2xl border-gray-300 bg-beige-50 p-4 text-lg font-medium text-gray-900 outline-none transition-all focus:border-olive-500 focus:bg-white focus:ring-2 focus:ring-olive-500 dark:border-gray-600 dark:bg-zinc-800 dark:text-white dark:focus:border-olive-400 dark:focus:ring-olive-400"
                required
              />
            </div>

            {errorMsg && (
              <p className="rounded-xl bg-red-50 p-3 text-center text-sm font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                ⚠️ {errorMsg}
              </p>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="mt-4 flex w-full items-center justify-center rounded-2xl bg-forest-500 px-5 py-4 text-lg font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-forest-600 focus:outline-none focus:ring-4 focus:ring-forest-200 active:scale-95 disabled:opacity-70 dark:bg-forest-600 dark:hover:bg-forest-500"
            >
              {isLoading ? "변경 중..." : "변경하고 숲으로 가기"}
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}
