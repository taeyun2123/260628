import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcryptjs';

dotenv.config({ path: '.env.local' });

if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = getFirestore();

async function main() {
  console.log('🌱 가상 학생 20명 및 10일치 운영 데이터 생성을 시작합니다...');
  
  const classCode = 'FOREST1';
  
  console.log(`1. 기존 학급(FOREST1)에 데모 학생 추가 중... (${classCode})`);

  const studentPasswordHash = await bcrypt.hash('password0000', 10);
  
  // XP와 레벨의 관계 (100XP당 1레벨)
  const levelsDistribution = [
    { level: 1, name: '잠자는 씨앗', targetCount: 3, xp: 0, certs: 0, certifiedToday: false },
    { level: 2, name: '자라는 새싹', targetCount: 3, xp: 120, certs: 1, certifiedToday: true }, // 오늘 인증함
    { level: 3, name: '튼튼한 묘목', targetCount: 3, xp: 250, certs: 2, certifiedToday: false }, // 오늘 미인증이나 과거 2회
    { level: 4, name: '연두빛 나무', targetCount: 4, xp: 330, certs: 3, certifiedToday: true },
    { level: 5, name: '풍성한 나무', targetCount: 4, xp: 480, certs: 4, certifiedToday: true },
    { level: 6, name: '열매가 가득', targetCount: 3, xp: 650, certs: 6, certifiedToday: true },
  ];

  let studentIdNum = 1;
  const names = ["김민수", "이서연", "박지훈", "최서준", "정민지", "강도윤", "조하은", "윤건우", "장지아", "임준서", "한서윤", "오현우", "서채원", "신우진", "권수아", "황시우", "안지유", "송도현", "전아인", "홍유준"];
  
  const today = new Date();
  today.setHours(10, 0, 0, 0); // 10 AM 기준

  console.log('3. 학생 20명, 트리 프로필 및 과거 10일치 인증 기록 생성 중...');
  for (const group of levelsDistribution) {
    for (let i = 0; i < group.targetCount; i++) {
      const login_id = `12${studentIdNum.toString().padStart(2, '0')}${names[studentIdNum - 1]}`;
      
      const userRef = await db.collection('users').add({
        login_id,
        password_hash: studentPasswordHash,
        role: 'STUDENT',
        class_code: classCode,
        is_password_changed: false,
        is_nudged: false,
      });

      await db.collection('treeProfiles').add({
        user_id: userRef.id,
        current_xp: group.xp,
        tree_level: group.level,
        updated_at: today
      });

      // 10일치 운영 시뮬레이션을 위한 과거 날짜 생성
      let daysToCertify = [];
      if (group.certifiedToday) {
        daysToCertify.push(0); // 오늘
      }
      
      const remainingCerts = group.certs - (group.certifiedToday ? 1 : 0);
      if (remainingCerts > 0) {
        // 1일 전부터 9일 전까지 풀에서 무작위 추출
        let pastDays = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        pastDays.sort(() => Math.random() - 0.5);
        daysToCertify.push(...pastDays.slice(0, remainingCerts));
      }

      for (const d of daysToCertify) {
        const certDate = new Date(today);
        certDate.setDate(certDate.getDate() - d);
        // 시간 살짝 흔들기
        certDate.setHours(10 + Math.floor(Math.random() * 5), Math.floor(Math.random() * 60));
        
        await db.collection('certifications').add({
          user_id: userRef.id,
          class_code: classCode,
          daily_goal: `${group.name} 달성 시연용 목표`,
          image_url: '/placeholder.png',
          comment: `성실하게 공부했어요! (${d === 0 ? '오늘' : d + '일 전'})`,
          status: 'APPROVED',
          created_at: certDate
        });
      }

      studentIdNum++;
    }
  }

  console.log('✅ 데모 데이터 생성이 모두 완료되었습니다!');
  console.log('====================================');
  console.log('반 인증번호:', classCode);
  console.log('학생 예시 아이디:', '1101김민수 (초기 비밀번호: password0000)');
  console.log('선생님 아이디:', 'demo_teacher@forest.com');
  console.log('선생님 비밀번호:', 'password123!');
  console.log('====================================');
}

main().then(() => process.exit(0)).catch(e => console.error(e));
