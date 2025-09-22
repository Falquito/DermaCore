import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { createSession, getSession, invalidateSession } from './session'
import type { Role, User } from '@prisma/client'
export type { Role }

export async function hashPassword(password: string) {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash)
}

export async function signIn(email: string, password: string): Promise<
  | { ok: false; error: string }
  | { ok: true; user: Pick<User, 'id' | 'email' | 'role' | 'name'> }
> {
  const user = await prisma.user.findUnique({ where: { email } })
  console.log('[AUTH] signIn lookup', { email, found: !!user })
  if (!user) return { ok: false, error: 'Credenciales inválidas' }

  const valid = await verifyPassword(password, user.passwordHash)
  console.log('[AUTH] password check', { email, valid })
  if (!valid) return { ok: false, error: 'Credenciales inválidas' }

  const session = await createSession(user.id)
  console.log('[AUTH] session created', { userId: user.id, token: session.token, expiresAt: session.expiresAt })

  // set cookie
  const cookieStore = await cookies()
  cookieStore.set('session', session.token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    expires: session.expiresAt,
  })

  return { ok: true, user: { id: user.id, email: user.email, role: user.role, name: user.name } }
}

export async function signOut() {
  const cookieStore = await cookies()
  const token = cookieStore.get('session')?.value
  if (token) {
    await invalidateSession(token)
    cookieStore.delete('session')
  }
}

export async function getCurrentUser(): Promise<Pick<User, 'id' | 'email' | 'role' | 'name'> | null> {
  const session = await getSession()
  console.log('[AUTH] getCurrentUser session', { hasSession: !!session })
  if (!session) return null
  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  console.log('[AUTH] getCurrentUser user', { userId: session.userId, found: !!user })
  if (!user) return null
  const { id, email, role, name } = user
  return { id, email, role, name }
}

export function roleToPath(role: Role) {
  switch (role) {
    case 'PROFESIONAL':
      return '/profesional'
    case 'MESA_ENTRADA':
      return '/mesa-entrada'
    case 'GERENTE':
      return '/gerente'
  }
}
