import type { User } from '~/types'

export const initialUsers: User[] = [
  {
    id: 'usr_wakanda_admin_01',
    name: 'Shuri Al-Wakanda',
    email: 'shuri@wakanda-academy.edu',
    role: 'admin',
    nimNidn: 'ADM-001',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'usr_wakanda_inst_01',
    name: 'T\'Challa Udaku',
    email: 'tchalla@wakanda-academy.edu',
    role: 'lecturer',
    nimNidn: 'LEC-002',
    isActive: true,
    createdAt: '2026-01-05T00:00:00.000Z',
    updatedAt: '2026-01-05T00:00:00.000Z'
  },
  {
    id: 'usr_wakanda_stud_01',
    name: 'Okoye General',
    email: 'okoye@wakanda-academy.edu',
    role: 'student',
    nimNidn: 'STD-2026001',
    isActive: true,
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-01-10T00:00:00.000Z'
  }
]
