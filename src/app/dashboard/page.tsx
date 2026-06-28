"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CertificationModal from "@/components/CertificationModal";
import MyForestSidebar from "@/components/MyForestSidebar"; // 새로 추가된 사이드바

interface StudentData {
  id: string;
  name: string;
  tree_level: number;
  current_xp: number;
  daily_goal: string | null;
  is_me: boolean;
  is_goal_set: boolean;
  is_certified: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [levelUpIds, setLevelUpIds] = useState<string[]>([]);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [initialGoal, setInitialGoal] = useState<string | null>(null);

  // Tooltip State for Grid
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Mobile Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchDashboardData = async (classId: string, userId: string) => {
    try {
      const res = await fetch(`/api/dashboard?class_id=${classId}&user_id=${userId}`);
      if (res.ok) {
        const data = await res.json();
        setStudents(prev => {
          if (prev.length > 0) {
            const leveledUp = data.students.filter((newStudent: StudentData) => {
              const old = prev.find(s => s.id === newStudent.id);
              return old && newStudent.tree_level > old.tree_level;
            }).map((s: StudentData) => s.id);
            
            if (leveledUp.length > 0) {
              setLevelUpIds(leveledUp);
              setTimeout(() => setLevelUpIds([]), 2000);
            }
          }
          return data.students;
        });
      }
    } catch (err) {
      console.error("Failed to fetch dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem("study_forest_user");
    if (!userStr) {
      router.push("/");
      return;
    }
    const user = JSON.parse(userStr);
    setCurrentUser(user);
    fetchDashboardData(user.class_id, user.id);
  }, [router]);

  const handleOpenModal = () => {
    const myData = students.find((s) => s.is_me);
    setInitialGoal(myData?.daily_goal || null);
    setIsModalOpen(true);
  };

  const handleModalSuccess = () => {
    if (currentUser) {
      fetchDashboardData(currentUser.class_id, currentUser.id);
    }
  };

  const getTreeEmoji = (level: number) => {
    switch (level) {
      case 1: return "🌰"; 
      case 2: return "🌱"; 
      case 3: return "🌿"; 
      case 4: return "🪴"; 
      case 5: return "🌳"; 
      default: return "🌳";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-green-50 dark:bg-zinc-950">
        <div className="text-xl font-bold text-green-700">숲을 불러오는 중... 🌳</div>
      </div>
    );
  }

  const myData = students.find((s) => s.is_me);

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-b from-beige-50 to-white dark:from-zinc-950 dark:to-zinc-900 transition-colors">
      
      {/* 1. 왼쪽: 내 숲 기록 (사이드바) - 데스크톱(w-3/10) */}
      <aside className="hidden w-[30%] lg:block border-r border-olive-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        {currentUser && <MyForestSidebar userId={currentUser.id} />}
      </aside>

      {/* 2. 모바일 드로어 (Drawer) */}
      {isDrawerOpen && currentUser && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsDrawerOpen(false)}
          ></div>
          <div className="relative w-4/5 max-w-sm h-full shadow-2xl transition-transform transform translate-x-0 bg-white dark:bg-zinc-900 z-50">
            <MyForestSidebar userId={currentUser.id} onCloseMobileDrawer={() => setIsDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* 3. 오른쪽: 반 텃밭 대시보드 (w-70% / 모바일은 전체) */}
      <div className="flex-1 overflow-y-auto pb-20 relative">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-green-200 bg-white/80 p-4 backdrop-blur-md dark:border-green-900 dark:bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="lg:hidden p-2 rounded-lg bg-mint-50 text-mint-700 hover:bg-mint-100 dark:bg-mint-900/40 dark:text-mint-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 6h18M3 18h18" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold text-mint-700 dark:text-mint-400">
                {currentUser?.class_code} 공부숲
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                오늘도 무럭무럭 자라나는 우리 반 나무들
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              localStorage.removeItem("study_forest_user");
              router.push("/");
            }}
            className="rounded-lg bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700"
          >
            로그아웃
          </button>
        </header>

        <main className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
          {/* Quick Action Button */}
          {myData && !myData.is_certified && (
            <div className="mb-8 rounded-2xl bg-white p-6 shadow-md ring-1 ring-olive-100 dark:bg-zinc-900 dark:ring-zinc-800 transition-all hover:shadow-lg">
              <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    {myData.is_goal_set ? "오늘의 공부를 완료하셨나요?" : "아직 오늘의 목표가 없어요!"}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {myData.is_goal_set 
                      ? "사진을 찍어 인증하고 나무를 성장시켜주세요." 
                      : "목표를 먼저 세우고 공부숲 가꾸기를 시작해볼까요?"}
                  </p>
                </div>
                <button
                  onClick={handleOpenModal}
                  className="w-full whitespace-nowrap rounded-2xl bg-mint-500 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:-translate-y-1 hover:bg-mint-600 hover:shadow-mint-500/30 active:scale-95 sm:w-auto dark:bg-mint-600 dark:hover:bg-mint-500"
                >
                  오늘의 공부숲 가꾸기 🚀
                </button>
              </div>
            </div>
          )}

          {myData && myData.is_certified && (
            <div className="mb-8 rounded-2xl bg-mint-50 p-6 text-center ring-1 ring-mint-100 dark:bg-mint-900/20 dark:ring-mint-800 shadow-sm">
              <h2 className="text-xl font-bold text-mint-700 dark:text-mint-400">
                🎉 오늘의 인증을 완료했습니다! 내일도 화이팅!
              </h2>
            </div>
          )}

          {/* Dynamic Grid 텃밭 영역 */}
          <div className="rounded-2xl bg-forest-50/50 p-6 sm:p-10 dark:bg-zinc-900/80 border border-forest-100 dark:border-zinc-800 shadow-sm">
            <h3 className="mb-6 text-center text-xl font-bold text-forest-700 dark:text-forest-400">
              🌱 우리 반 학급 텃밭 🌱
            </h3>
            
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {students.map((student) => {
                const isLevelingUp = levelUpIds.includes(student.id);
                const isSleeping = student.name === "잠자는 씨앗";
                return (
                <div 
                  key={student.id} 
                  onClick={() => {
                    if (!isSleeping) {
                      setSelectedStudentId(selectedStudentId === student.id ? null : student.id);
                    }
                  }}
                  className={`relative flex flex-col items-center justify-center rounded-2xl p-4 transition-all duration-300 ${
                    isSleeping ? "cursor-default" : "cursor-pointer"
                  } ${
                    student.is_me 
                      ? "ring-2 ring-forest-500 bg-white shadow-md dark:bg-zinc-800" 
                      : isSleeping
                        ? "opacity-60 grayscale filter bg-black/5 dark:bg-white/5"
                        : "bg-white/80 shadow-sm hover:scale-105 hover:bg-white dark:bg-zinc-800/80 dark:hover:bg-zinc-800 hover:shadow-md"
                  } ${isLevelingUp ? "animate-tree-shake ring-4 ring-yellow-400" : ""}`}
                >
                  {isLevelingUp && (
                    <div className="particle-container">
                      <span className="particle" style={{top: '10%', left: '20%'}}>✨</span>
                      <span className="particle" style={{top: '30%', left: '80%', animationDelay: '0.2s'}}>✨</span>
                      <span className="particle" style={{top: '70%', left: '30%', animationDelay: '0.4s'}}>✨</span>
                    </div>
                  )}
                  {student.is_me && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-mint-500 px-3 py-1 text-xs font-bold text-white shadow-sm">
                      나의 나무
                    </span>
                  )}
                  <div className="my-2 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-mint-50 to-white text-5xl shadow-inner dark:from-mint-900/50 dark:to-zinc-800">
                    {getTreeEmoji(student.tree_level)}
                  </div>
                  <div className="mt-2 text-center w-full">
                    {isSleeping ? (
                      <div className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-3">
                        잠자는 씨앗
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center justify-center gap-1 text-xs font-medium text-gray-500 dark:text-gray-400">
                        <span className="rounded-md bg-forest-50 px-1.5 py-0.5 text-forest-700 dark:bg-forest-900/50 dark:text-forest-400">Lv.{student.tree_level}</span>
                        <span>•</span>
                        <span>XP {student.current_xp}</span>
                      </div>
                    )}
                  </div>

                  {/* 말풍선 툴팁 */}
                  {selectedStudentId === student.id && !isSleeping && (
                    <div className="absolute -top-14 left-1/2 z-30 w-48 -translate-x-1/2 rounded-2xl bg-white p-3 shadow-xl ring-1 ring-mint-100 dark:bg-zinc-800 dark:ring-zinc-700 animate-fade-in-up">
                      <div className="mb-1 text-sm font-bold text-gray-900 dark:text-gray-100">{student.name}</div>
                      {student.daily_goal ? (
                        <div className="text-xs text-gray-600 dark:text-gray-300 bg-beige-50 dark:bg-zinc-900 p-2 rounded-xl border border-olive-50 dark:border-zinc-700">
                          {student.daily_goal}
                        </div>
                      ) : (
                        <div className="text-xs text-gray-500 italic">아직 목표를 세우지 않았어요.</div>
                      )}
                      {/* 말풍선 꼬리 */}
                      <div className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 border-b border-r border-mint-100 bg-white dark:border-zinc-700 dark:bg-zinc-800"></div>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      {currentUser && (
        <CertificationModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          userId={currentUser.id}
          initialGoal={initialGoal}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
