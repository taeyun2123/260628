import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
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
  console.log('Firebase Firestore Seed 시작...');

  const teacherPasswordHash = await bcrypt.hash('password123!', 10);
  const studentPasswordHash = await bcrypt.hash('password0000', 10);

  // 1. 학급 생성
  const classCode = 'FOREST1';
  console.log(`1. 학급 생성 중... (${classCode})`);
  await db.collection('classes').doc(classCode).set({
    class_code: classCode,
    school_name: '숲속중학교',
    grade: 1,
    class_number: 1,
  });

  // 2. 사용자 생성
  console.log('2. 사용자(선생님, 학생) 생성 중...');
  
  // 기존 users 컬렉션이 비어있다고 가정하고 추가합니다.
  const usersRef = db.collection('users');

  const teacherRef = await usersRef.add({
    login_id: 'teacher@forest.com',
    password_hash: teacherPasswordHash,
    role: 'TEACHER',
    class_code: classCode,
    is_password_changed: true,
  });

  const student1Ref = await usersRef.add({
    login_id: '1101김가나',
    password_hash: studentPasswordHash,
    role: 'STUDENT',
    class_code: classCode,
    is_password_changed: false,
    is_nudged: false,
  });

  const student2Ref = await usersRef.add({
    login_id: '1102이다라',
    password_hash: studentPasswordHash,
    role: 'STUDENT',
    class_code: classCode,
    is_password_changed: false,
    is_nudged: false,
  });

  const student3Ref = await usersRef.add({
    login_id: '1103박마바',
    password_hash: studentPasswordHash,
    role: 'STUDENT',
    class_code: classCode,
    is_password_changed: true,
    is_nudged: false,
  });

  console.log('3. 학생 나무 프로필 생성 중...');
  const treeProfilesRef = db.collection('treeProfiles');
  
  await treeProfilesRef.add({ user_id: student1Ref.id, current_xp: 0, tree_level: 1, updated_at: new Date() });
  await treeProfilesRef.add({ user_id: student2Ref.id, current_xp: 0, tree_level: 1, updated_at: new Date() });
  await treeProfilesRef.add({ user_id: student3Ref.id, current_xp: 0, tree_level: 1, updated_at: new Date() });

  console.log('✅ Firebase Seed 데이터 생성 완료!');
  console.log('====================================');
  console.log('반 인증번호:', classCode);
  console.log('학생 로그인 아이디 예시:', '1101김가나');
  console.log('학생 초기 비밀번호:', 'password0000');
  console.log('교사 이메일:', 'teacher@forest.com');
  console.log('교사 비밀번호:', 'password123!');
  console.log('====================================');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed 에러:', error);
    process.exit(1);
  });
