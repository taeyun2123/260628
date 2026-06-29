import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, limit as firestoreLimit } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const user_id = searchParams.get('user_id');

  if (!user_id) {
    return NextResponse.json({ error: 'user_id가 필요합니다.' }, { status: 400 });
  }

  try {
    const userDocRef = doc(db, 'users', user_id);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
    }

    const userData = userDoc.data();

    const treeQuery = query(collection(db, 'treeProfiles'), where('user_id', '==', user_id), firestoreLimit(1));
    const treeSnap = await getDocs(treeQuery);
    const tree_profile = treeSnap.empty ? null : treeSnap.docs[0].data();

    const certsQuery = query(
      collection(db, 'certifications'),
      where('user_id', '==', user_id)
    );
    const certsSnap = await getDocs(certsQuery);
    
    let certifications = certsSnap.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        created_at: data.created_at?.toDate ? data.created_at.toDate() : new Date(data.created_at),
      };
    });

    // in-memory 정렬 (최신순)
    certifications.sort((a: any, b: any) => b.created_at.getTime() - a.created_at.getTime());

    return NextResponse.json({
      user: {
        id: user_id,
        login_id: userData?.login_id,
        tree_profile,
      },
      certifications,
    }, { status: 200 });

  } catch (error) {
    console.error('Certifications Me Error:', error);
    return NextResponse.json({ error: '데이터를 불러오는 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
