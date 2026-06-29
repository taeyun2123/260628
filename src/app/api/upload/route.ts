import { NextResponse } from 'next/server';
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('user_id') as string;

    if (!file || !userId) {
      return NextResponse.json({ error: '파일과 사용자 ID가 필요합니다.' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `certifications/${userId}_${Date.now()}.${fileExt}`;
    
    // File 데이터를 Buffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // 일반 Firebase SDK를 통한 Storage 업로드 (Storage 보안 룰 체크됨)
    const fileRef = ref(storage, fileName);
    
    await uploadBytes(fileRef, buffer, {
      contentType: file.type,
    });

    // 클라이언트 SDK는 기본적으로 다운로드 URL을 제공함
    const publicUrl = await getDownloadURL(fileRef);

    return NextResponse.json({ url: publicUrl }, { status: 200 });
  } catch (error) {
    console.error('File Upload Error:', error);
    return NextResponse.json({ error: '파일 업로드 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
