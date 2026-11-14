import { ForbiddenError } from './errors'

export const PROTECTED_DEMO_EMAILS = [
  'admin@wakanda.ac.id',
  'shuri@lecturer.wakanda.ac.id',
  'tchalla@lecturer.wakanda.ac.id',
  'wkabi@lecturer.wakanda.ac.id',
  'nakia@student.wakanda.ac.id',
  'mbaku@student.wakanda.ac.id',
  'erik@student.wakanda.ac.id',
  'riri@student.wakanda.ac.id'
] as const

const PROTECTED_SET = new Set(PROTECTED_DEMO_EMAILS.map(e => e.toLowerCase()))

export function isProtectedDemoEmail(email?: string | null): boolean {
  if (!email) return false
  return PROTECTED_SET.has(email.trim().toLowerCase())
}

export function assertNotProtectedDemoAccount(
  email?: string | null,
  actionDescription = 'tindakan ini'
): void {
  if (isProtectedDemoEmail(email)) {
    throw new ForbiddenError(
      `Akun demo institusional ini dilindungi oleh Protected Demo Account Guard. ${actionDescription} dibatasi agar ketersediaan simulasi 1-klik login ITW tetap terjamin.`
    )
  }
}
