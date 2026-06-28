import { NextResponse } from 'next/server';
import { adminStorage } from '@/lib/firebaseAdmin';

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
    const buffer = Buffer.from(arrayBuffer);

    // Firebase Admin SDK를 통해 Storage에 업로드 (보안 룰 우회)
    const bucket = adminStorage.bucket(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    const fileRef = bucket.file(fileName);
    
    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    // Make file public to allow clients to download
    await fileRef.makePublic();
    
    // Return public URL
    const publicUrl = fileRef.publicUrl();

    return NextResponse.json({ url: publicUrl }, { status: 200 });
  } catch (error) {
    console.error('File Upload Error:', error);
    return NextResponse.json({ error: '파일 업로드 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
