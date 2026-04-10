import { cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { User } from '@/types';

export async function getSession(): Promise<User | null> {
  const cookieStore = cookies();
  const token = cookieStore.get('linkage_session')?.value;
  if (!token) return null;

  const session = await prisma.userSession.findUnique({
    where: { session_token: token },
    include: { user: true },
  });

  if (!session || session.expires_at < new Date()) {
    return null;
  }
  
  return session.user as unknown as User;
}

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomUUID() + '-' + crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 365 * 24 * 60 * 60 * 1000); // 10 years
  
  await prisma.userSession.create({
    data: {
      user_id: userId,
      session_token: token,
      expires_at: expiresAt,
    },
  });
  
  return token;
}

export async function deleteSession(token: string): Promise<void> {
  await prisma.userSession.deleteMany({
    where: { session_token: token }
  });
}
