import { cookies } from 'next/headers'
import { prisma } from './prisma'
import crypto from 'crypto'

const SESSION_TTL_DAYS = 3

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000)
  console.log('[SESSION] create', { userId, expiresAt })
  return prisma.session.create({
    data: { userId, token, expiresAt },
  })
}

export async function getSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  console.log('[SESSION] get', { hasToken: !!token })
  if (!token) return null
  const session = await prisma.session.findUnique({ where: { token } })
  console.log('[SESSION] found', { exists: !!session })
  if (!session) return null
  if (session.expiresAt < new Date()) {
    // expire session
    console.log('[SESSION] expired, deleting', { token })
    await prisma.session.delete({ where: { token } }).catch(() => {})
    cookieStore.delete('session')
    return null
  }
  return session
}

export async function invalidateSession(token: string) {
  console.log('[SESSION] invalidate', { token })
  await prisma.session.delete({ where: { token } }).catch(() => {})
}
