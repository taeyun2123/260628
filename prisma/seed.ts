import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('기존 데이터 삭제 중...');
  await prisma.treeProfile.deleteMany({});
  await prisma.certification.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.class.deleteMany({});

  console.log('비밀번호 해싱 중...');
  const teacherPasswordHash = await bcrypt.hash('password123!', 10);
  const studentPasswordHash = await bcrypt.hash('password0000', 10);

  console.log('1. 학급 생성 중...');
  const newClass = await prisma.class.create({
    data: {
      class_code: 'FOREST1',
      school_name: '숲속중학교',
      grade: 1,
      class_number: 1,
    },
  });

  console.log('2. 사용자(선생님, 학생) 생성 중...');
  const teacher = await prisma.user.create({
    data: {
      login_id: 'teacher@forest.com',
      password_hash: teacherPasswordHash,
      role: 'TEACHER',
      class_id: newClass.id,
      is_password_changed: true,
    },
  });

  const student1 = await prisma.user.create({
    data: {
      login_id: '1101김가나',
      password_hash: studentPasswordHash,
      role: 'STUDENT',
      class_id: newClass.id,
      is_password_changed: false,
    },
  });

  const student2 = await prisma.user.create({
    data: {
      login_id: '1102이다라',
      password_hash: studentPasswordHash,
      role: 'STUDENT',
      class_id: newClass.id,
      is_password_changed: false,
    },
  });

  const student3 = await prisma.user.create({
    data: {
      login_id: '1103박마바',
      password_hash: studentPasswordHash,
      role: 'STUDENT',
      class_id: newClass.id,
      is_password_changed: true, // 이 학생은 이미 변경 완료
    },
  });

  console.log('3. 학생 나무 프로필 생성 중...');
  await prisma.treeProfile.createMany({
    data: [
      { user_id: student1.id },
      { user_id: student2.id },
      { user_id: student3.id },
    ]
  });

  console.log('✅ Seed 데이터 생성 완료!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
