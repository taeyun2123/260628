"use client";

import React, { useState, useEffect } from "react";
import Confetti from "react-confetti";

interface CertificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialGoal: string | null;
  onSuccess: () => void;
}

export default function CertificationModal({
  isOpen,
  onClose,
  userId,
  initialGoal,
  onSuccess,
}: CertificationModalProps) {
  const [currentGoal, setCurrentGoal] = useState<string | null>(initialGoal);
  const [goalInput, setGoalInput] = useState("");
  const [comment, setComment] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [levelUpMsg, setLevelUpMsg] = useState("");

  const [isEditingGoal, setIsEditingGoal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentGoal(initialGoal);
      setGoalInput(initialGoal || "");
      setComment("");
      setImageFile(null);
      setErrorMsg("");
      setShowConfetti(false);
      setLevelUpMsg("");
      setIsEditingGoal(false);
    }
  }, [isOpen, initialGoal]);

  const hasGoal = !!currentGoal;
  const showGoalForm = !hasGoal || isEditingGoal;

  const handleSetGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalInput.trim()) {
      setErrorMsg("목표를 입력해주세요.");
      return;
    }
    setLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/certifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SET_GOAL",
          user_id: userId,
          daily_goal: goalInput.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // 모달 닫지 않고 바로 State 2(사진 인증)로 전환
      setCurrentGoal(goalInput.trim());
      setIsEditingGoal(false);
      onSuccess(); // 백그라운드에서 대시보드 새로고침
    } catch (err: any) {
      setErrorMsg(err.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleCertify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      let finalImageUrl = "/placeholder.png";
      if (imageFile) {
        // blob URL 대신 Base64로 인코딩하여 영구적으로 DB에 저장
        finalImageUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(imageFile);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = error => reject(error);
        });
      }

      const res = await fetch("/api/certifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CERTIFY",
          user_id: userId,
          image_url: finalImageUrl,
          comment: comment.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.levelUpOccurred) {
        setShowConfetti(true);
        setLevelUpMsg("🎉 나무가 자라났어요! 레벨 업! 🎉");
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 3000);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      {showConfetti && <Confetti width={window.innerWidth} height={window.innerHeight} />}
      
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-zinc-900">
        <div className="bg-green-600 px-6 py-4 dark:bg-green-700">
          <h2 className="text-xl font-bold text-white">
            {!showGoalForm ? "오늘의 공부 인증하기 📸" : hasGoal ? "목표 수정하기 ✍️" : "오늘의 공부 목표 세우기 ✍️"}
          </h2>
        </div>

        <div className="p-6">
          {levelUpMsg ? (
            <div className="py-12 text-center">
              <div className="mb-4 text-6xl">🌳✨</div>
              <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">
                {levelUpMsg}
              </h3>
            </div>
          ) : showGoalForm ? (
            <form onSubmit={handleSetGoal} className="flex flex-col gap-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {hasGoal ? "수정할 목표를 적어주세요." : "먼저 오늘 하루 어떤 공부를 할 것인지 목표를 세워주세요!"}
              </p>
              <textarea
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="예: 수학 교과서 3단원 풀기, 영어 단어 50개 암기"
                className="min-h-[120px] w-full rounded-xl border border-gray-300 bg-gray-50 p-4 text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-500 dark:border-gray-700 dark:bg-zinc-800 dark:text-white"
                required
              />
              {errorMsg && <p className="text-sm font-medium text-red-500">{errorMsg}</p>}
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (hasGoal) setIsEditingGoal(false);
                    else onClose();
                  }}
                  className="flex-1 rounded-xl bg-gray-200 py-3 font-bold text-gray-700 hover:bg-gray-300 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] rounded-xl bg-green-600 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-50 dark:bg-green-500 dark:hover:bg-green-600"
                >
                  {loading ? "저장 중..." : hasGoal ? "수정 완료" : "목표 저장하고 다음 단계로"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCertify} className="flex flex-col gap-4">
              <div className="flex items-start justify-between rounded-xl bg-green-50 p-4 dark:bg-green-900/30">
                <div>
                  <p className="text-xs font-semibold text-green-800 dark:text-green-300">오늘의 목표</p>
                  <p className="mt-1 text-sm font-medium text-gray-800 dark:text-gray-200">{currentGoal}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingGoal(true)}
                  className="rounded-lg bg-green-100 px-3 py-1 text-xs font-bold text-green-700 hover:bg-green-200 dark:bg-green-800 dark:text-green-300 dark:hover:bg-green-700"
                >
                  목표 수정
                </button>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  공부 인증 사진 업로드
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-4 file:rounded-xl file:border-0 file:bg-green-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-green-700 hover:file:bg-green-200 dark:file:bg-green-900 dark:file:text-green-300"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  한 줄 소감 (선택)
                </label>
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="오늘 공부 어땠나요?"
                  className="w-full rounded-xl border border-gray-300 bg-gray-50 p-3 text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-500 dark:border-gray-700 dark:bg-zinc-800 dark:text-white"
                />
              </div>

              {errorMsg && <p className="text-sm font-medium text-red-500">{errorMsg}</p>}
              
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl bg-gray-200 py-3 font-bold text-gray-700 hover:bg-gray-300 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700"
                >
                  나중에
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] rounded-xl bg-green-600 py-3 font-bold text-white hover:bg-green-700 disabled:opacity-50 dark:bg-green-500 dark:hover:bg-green-600"
                >
                  {loading ? "인증 중..." : "인증 완료하기"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
