"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

interface CertifiedStudent {
  student_id: string;
  name: string;
  tree_level: number;
  current_xp: number;
  daily_goal: string;
  image_url: string | null;
  comment: string | null;
  rating: number | null;
  teacher_rating: number | null;
  status: string;
  certification_id: string;
}

interface UncertifiedStudent {
  student_id: string;
  name: string;
  is_nudged: boolean;
}

interface TrendData {
  date: string;
  count: number;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [certified, setCertified] = useState<CertifiedStudent[]>([]);
  const [uncertified, setUncertified] = useState<UncertifiedStudent[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    const userStr = localStorage.getItem("study_forest_user");
    if (!userStr) {
      router.push("/");
      return;
    }
    const user = JSON.parse(userStr);
    setCurrentUser(user);
    
    // Fetch dashboard data
    const timestamp = Date.now();
    Promise.all([
      fetch(`/api/teacher/dashboard-summary?class_id=${user.class_id}&t=${timestamp}`).then(r => r.json()),
      fetch(`/api/teacher/attendance-trend?class_id=${user.class_id}&t=${timestamp}`).then(r => r.json())
    ]).then(([summary, trendRes]) => {
      setCertified(summary.certified || []);
      setUncertified(summary.uncertified || []);
      setTrendData(trendRes.trend || []); // 과거부터 오름차순
    }).catch(err => console.error(err))
      .finally(() => setLoading(false));
      
  }, [router]);

  const handleNudge = async (studentId: string) => {
    try {
      // Optimistic Update
      setUncertified(prev => prev.map(s => s.student_id === studentId ? { ...s, is_nudged: true } : s));
      
      await fetch('/api/teacher/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleTeacherRating = async (certificationId: string, rating: number) => {
    try {
      // Optimistic Update
      setCertified(prev => prev.map(s => s.certification_id === certificationId ? { ...s, teacher_rating: rating } : s));
      
      await fetch(`/api/teacher/certifications/${certificationId}/rating`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_rating: rating })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("study_forest_user");
    document.cookie = "study_forest_session=; path=/; max-age=0;";
    router.push("/");
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <div className="text-xl font-bold text-gray-500">대시보드 불러오는 중...</div>
      </div>
    );
  }

  // 병합된 학생 텃밭 (인증 + 미인증)
  const allStudentsForGrid = [
    ...certified.map(s => ({ ...s, is_certified: true })),
    ...uncertified.map(s => ({ ...s, is_certified: false, tree_level: 1, current_xp: 0, daily_goal: null }))
  ];

  return (
    <div className="min-h-screen bg-beige-50 text-gray-900 dark:bg-zinc-950 dark:text-gray-100 transition-colors">
      {/* Top Header */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-olive-100 bg-white/90 p-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/90 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mint-100 text-xl dark:bg-mint-900">
            👨‍🏫
          </div>
          <div>
            <h1 className="text-xl font-bold text-mint-700 dark:text-mint-400">
              우리 반 공부숲 교사 대시보드
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              학급 대시보드
            </p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700"
        >
          로그아웃
        </button>
      </header>

      <main className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* 1. 좌측 영역 (col-span-3): 인증 현황 모아보기 */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-olive-100 dark:bg-zinc-900 dark:ring-zinc-800 flex-1">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">오늘의 공부 인증</h2>
                <span className="rounded-full bg-mint-50 px-2 py-1 text-xs font-bold text-mint-700 dark:bg-mint-900/30 dark:text-mint-300 border border-mint-100 dark:border-mint-800">
                  {certified.length}명 인증 완료
                </span>
              </div>
              
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {certified.length === 0 ? (
                  <div className="text-center text-sm text-gray-400 mt-10">아직 인증한 학생이 없습니다.</div>
                ) : (
                  certified.map((student) => (
                    <div key={student.student_id} className="group relative flex flex-col items-center gap-2 rounded-xl p-3 transition-colors hover:bg-mint-50 dark:hover:bg-zinc-800">
                      {/* Photo Thumbnail */}
                      <div 
                        className="relative h-20 w-20 cursor-pointer overflow-hidden rounded-2xl bg-gray-100 shadow-sm ring-2 ring-mint-100 dark:bg-zinc-700 dark:ring-mint-900"
                        onClick={() => student.image_url && setSelectedPhoto({ url: student.image_url, name: student.name, comment: student.comment })}
                      >
                        {student.image_url ? (
                          <img src={student.image_url} alt="인증샷" className="h-full w-full object-cover transition-transform hover:scale-110" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-xs text-gray-400">사진 없음</div>
                        )}
                      </div>
                      <div className="flex flex-col items-center overflow-hidden w-full">
                        <div className="font-bold text-sm truncate">{student.name}</div>
                        <div className="text-xs text-gray-500 truncate dark:text-gray-400">{student.daily_goal}</div>
                        {/* 선생님 햇님 평가 */}
                        <div className="mt-1 flex items-center gap-1">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => handleTeacherRating(student.certification_id, star)}
                                className={`text-sm transition-all hover:scale-125 ${
                                  student.teacher_rating && student.teacher_rating >= star
                                    ? "text-yellow-400 drop-shadow-sm"
                                    : "text-gray-200 grayscale dark:text-zinc-700"
                                }`}
                              >
                                ☀️
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 2. 중앙 영역 (col-span-6): 학급 텃밭 뷰어 */}
          <div className="lg:col-span-6 flex flex-col gap-4">
            <div className="rounded-3xl bg-forest-50/70 p-6 shadow-inner min-h-[600px] dark:bg-zinc-900/80 flex flex-col border border-olive-100 dark:border-zinc-800">
              <h2 className="mb-6 text-center text-xl font-bold text-forest-700 dark:text-forest-400 tracking-wide">
                🌱 우리 반 학급 텃밭 현황 🌱
              </h2>
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {allStudentsForGrid.map((student) => (
                  <div 
                    key={student.student_id} 
                    className={`relative flex flex-col items-center justify-center rounded-2xl p-3 transition-all ${
                      student.is_certified 
                        ? "bg-white/90 shadow-sm hover:scale-105 hover:bg-white dark:bg-zinc-800/90" 
                        : "opacity-50 grayscale bg-black/5 dark:bg-white/5"
                    } group`}
                  >
                    <div className="my-1 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-tr from-green-100 to-green-50 text-4xl shadow-inner dark:from-green-900 dark:to-green-800">
                      {getTreeEmoji(student.tree_level)}
                    </div>
                    <div className="mt-2 text-center w-full">
                      <div className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                        {student.name}
                      </div>
                    </div>

                    {/* 교사용 툴팁 (Hover) */}
                    {student.is_certified && (
                      <div className="absolute -top-20 left-1/2 z-30 hidden -translate-x-1/2 w-52 rounded-xl bg-gray-900 p-3 text-xs text-white shadow-xl group-hover:block dark:bg-zinc-100 dark:text-zinc-900">
                        <div className="font-bold mb-1">{student.name} (Lv.{student.tree_level})</div>
                        <div className="text-gray-300 dark:text-gray-600 truncate mb-1">{student.daily_goal}</div>
                        <div className="flex justify-between items-center bg-gray-800 rounded px-2 py-1 dark:bg-zinc-200">
                          <span className="text-blue-400 font-bold">{student.rating ? `💧 ${student.rating}` : '💧 -'}</span>
                          <span className="text-yellow-400 font-bold">{student.teacher_rating ? `☀️ ${student.teacher_rating}` : '☀️ -'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 3. 우측 영역 (col-span-3): 미인증 관리 */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-olive-100 dark:bg-zinc-900 dark:ring-zinc-800 flex-1">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-rose-600 dark:text-rose-400">미인증 학생 관리</h2>
                <span className="rounded-full bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-100 dark:border-rose-800">
                  {uncertified.length}명 대기
                </span>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {uncertified.length === 0 ? (
                  <div className="text-center text-sm text-gray-400 mt-10">모든 학생이 인증을 완료했습니다! 🎉</div>
                ) : (
                  uncertified.map((student) => (
                    <div key={student.student_id} className="flex items-center justify-between rounded-xl bg-rose-50/50 border border-rose-100/50 p-3 dark:bg-zinc-800/50 dark:border-zinc-700">
                      <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">{student.name}</div>
                      <button
                        disabled={student.is_nudged}
                        onClick={() => handleNudge(student.student_id)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all shadow-sm ${
                          student.is_nudged 
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-zinc-700 dark:text-gray-500 shadow-none"
                            : "bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 active:scale-95 dark:bg-zinc-800 dark:border-rose-900/50 dark:text-rose-400 dark:hover:bg-zinc-700"
                        }`}
                      >
                        {student.is_nudged ? "알림 발송됨" : "독려 알림"}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 4. 하단 영역 (col-span-12): 추세 그래프 */}
          <div className="lg:col-span-12 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-olive-100 dark:bg-zinc-900 dark:ring-zinc-800">
            <h2 className="mb-6 text-lg font-bold text-gray-800 dark:text-gray-200">최근 7일 학급 인증 학생 수 추이</h2>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    formatter={(value: number) => [`${value}명`, '인증 학생 수']}
                    labelStyle={{ color: '#374151', fontWeight: 'bold', marginBottom: '4px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} 
                    activeDot={{ r: 6 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </main>

      {/* 이미지 뷰어 모달 */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <button 
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
              onClick={() => setSelectedImage(null)}
            >
              ✕
            </button>
            <img src={selectedImage} alt="원본 이미지" className="max-h-[90vh] w-auto object-contain" />
          </div>
        </div>
      )}
    </div>
  );
}
