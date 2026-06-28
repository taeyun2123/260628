"use client";

import React, { useEffect, useState } from "react";

interface Certification {
  id: string;
  daily_goal: string;
  image_url: string | null;
  comment: string | null;
  rating: number | null;
  status: string;
  created_at: string;
}

interface TreeProfile {
  tree_level: number;
  current_xp: number;
}

interface UserData {
  id: string;
  login_id: string;
  tree_profile: TreeProfile | null;
}

interface MyForestSidebarProps {
  userId: string;
  onCloseMobileDrawer?: () => void;
}

export default function MyForestSidebar({ userId, onCloseMobileDrawer }: MyForestSidebarProps) {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(true);
  const [animatingDrop, setAnimatingDrop] = useState<{ certId: string; val: number } | null>(null);

  useEffect(() => {
    fetchMyData();
  }, [userId]);

  const fetchMyData = async () => {
    try {
      const res = await fetch(`/api/certifications/me?user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setUserData(data.user);
        setCertifications(data.certifications);
      }
    } catch (err) {
      console.error("Failed to fetch my forest data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (certId: string, newRating: number, isToday: boolean) => {
    if (!isToday) return; // 과거 기록은 수정 불가

    try {
      // Animation trigger
      setAnimatingDrop({ certId, val: newRating });
      setTimeout(() => setAnimatingDrop(null), 500);

      // Optimistic update
      setCertifications((prev) =>
        prev.map((c) => (c.id === certId ? { ...c, rating: newRating } : c))
      );

      await fetch(`/api/certifications/${certId}/rating`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, rating: newRating }),
      });
    } catch (err) {
      console.error("Failed to update rating", err);
      // Revert if needed (omitted for brevity)
    }
  };

  // 날짜 체크 유틸
  const checkIsToday = (dateStr: string) => {
    const today = new Date();
    const date = new Date(dateStr);
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // 나무 레벨에 따른 이모지
  const getTreeEmoji = (level: number) => {
    switch (level) {
      case 1: return "🌰 씨앗";
      case 2: return "🌱 새싹";
      case 3: return "🌿 묘목";
      case 4: return "🪴 작은 나무";
      case 5: return "🌳 울창한 나무";
      default: return "🌳 나무";
    }
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-6 text-green-700">
        불러오는 중...
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-beige-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:bg-zinc-900/50 transition-colors">
      {/* 모바일 닫기 버튼 */}
      {onCloseMobileDrawer && (
        <button
          onClick={onCloseMobileDrawer}
          className="absolute right-4 top-4 rounded-full bg-white p-2 text-gray-500 shadow-sm lg:hidden dark:bg-zinc-800 dark:text-gray-400"
        >
          ✕
        </button>
      )}

      {/* 상단: 내 나무 정보 */}
      <div className="border-b border-olive-100 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-bold text-gray-500 dark:text-gray-400">나의 숲 만들기 기록</h2>
        <div className="mt-4 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-forest-50 text-3xl shadow-inner dark:bg-forest-900/40">
            {userData?.tree_profile ? getTreeEmoji(userData.tree_profile.tree_level).split(' ')[0] : "🌰"}
          </div>
          <div>
            <p className="text-xl font-extrabold text-gray-900 dark:text-white">
              {userData?.login_id}
            </p>
            <div className="mt-1 flex items-center gap-2 text-sm font-medium text-forest-700 dark:text-forest-400">
              <span className="rounded-md bg-forest-50 px-2 py-0.5 dark:bg-forest-900/50">
                Lv. {userData?.tree_profile?.tree_level || 1}
              </span>
              <span>XP {userData?.tree_profile?.current_xp || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 하단: 타임라인 */}
      <div className="flex-1 overflow-y-auto p-6">
        {certifications.length === 0 ? (
          <div className="mt-10 text-center text-gray-500 dark:text-gray-400">
            아직 공부숲 기록이 없어요.<br/>첫 목표를 세워보세요!
          </div>
        ) : (
          <div className="space-y-6">
            {certifications.map((cert) => {
              const isToday = checkIsToday(cert.created_at);
              const dateObj = new Date(cert.created_at);
              const displayDate = `${dateObj.getMonth() + 1}월 ${dateObj.getDate()}일`;

              return (
                <div key={cert.id} className="relative pl-6">
                  {/* 타임라인 라인 & 닷 */}
                  <div className="absolute left-1.5 top-2 bottom-[-24px] w-0.5 bg-olive-100 last:bottom-0 dark:bg-zinc-700"></div>
                  <div className={`absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white ${isToday ? 'bg-forest-500 shadow-sm' : 'bg-gray-300'} dark:border-zinc-900`}></div>

                  {/* 카드 컨텐츠 */}
                  <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-100 dark:bg-zinc-800 dark:ring-gray-800 transition-all hover:shadow-md">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{displayDate} {isToday && "(오늘)"}</span>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${cert.status === 'APPROVED' ? 'bg-forest-50 text-forest-700' : 'bg-beige-100 text-olive-700'}`}>
                        {cert.status === 'APPROVED' ? '인증 완료' : '목표 진행 중'}
                      </span>
                    </div>
                    
                    <p className="font-semibold text-gray-800 dark:text-gray-200 leading-relaxed">{cert.daily_goal}</p>
                    
                    {cert.image_url && cert.image_url !== '/placeholder.png' && (
                      <div className="mt-3 h-24 w-full rounded-2xl bg-gray-100 overflow-hidden dark:bg-zinc-700">
                        <img src={cert.image_url} alt="인증샷" className="h-full w-full object-cover opacity-80" />
                      </div>
                    )}

                    {cert.comment && (
                      <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 bg-beige-50 p-3 rounded-2xl dark:bg-zinc-900">
                        💬 {cert.comment}
                      </p>
                    )}

                    {/* 물방울 척도 (성찰) */}
                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3 dark:border-zinc-700">
                      <span className="text-xs font-medium text-gray-500">오늘의 만족도</span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((val) => {
                          const isAnimating = animatingDrop?.certId === cert.id && animatingDrop.val === val;
                          return (
                            <button
                              key={val}
                              disabled={!isToday}
                              onClick={() => handleRating(cert.id, val, isToday)}
                              className={`text-lg transition-all transform origin-bottom ${
                                isAnimating ? 'animate-waterdrop-bounce text-blue-400 drop-shadow-md' : ''
                              } ${
                                isToday ? 'hover:scale-110 active:scale-95' : 'cursor-default opacity-80'
                              } ${
                                !isAnimating && cert.rating && val <= cert.rating
                                  ? "text-blue-400 drop-shadow-sm filter"
                                  : !isAnimating && "text-gray-200 dark:text-gray-600 grayscale opacity-40"
                              }`}
                            >
                              💧
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
