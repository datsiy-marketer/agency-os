import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

// In-memory fallback user store (used when Supabase not configured)
const FALLBACK_USERS = [
  {
    id: 'admin',
    username: 'admin',
    passwordHash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/o7K0bwJYa', // 'admin'
    name: 'Сергей (Основатель)',
    role: 'founder' as const,
    allowedDivisions: [] as string[],
    employeeId: null as string | null,
  },
]

export interface AgencyUser {
  id: string
  username: string
  name: string
  role: 'founder' | 'employee'
  allowedDivisions: string[] // empty = all (for founder)
  employeeId: string | null
}

async function findUser(username: string): Promise<{ user: AgencyUser; hash: string } | null> {
  // Try Supabase first if configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (supabaseUrl && supabaseKey) {
    try {
      const res = await fetch(
        `${supabaseUrl}/rest/v1/agency_users?username=eq.${encodeURIComponent(username)}&is_active=eq.true&select=*`,
        { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } }
      )
      const data = await res.json()
      if (data && data[0]) {
        const row = data[0]
        return {
          user: {
            id: row.id,
            username: row.username,
            name: row.name,
            role: row.role,
            allowedDivisions: row.allowed_divisions || [],
            employeeId: row.employee_id || null,
          },
          hash: row.password_hash,
        }
      }
    } catch (e) {
      console.error('Supabase auth error, falling back to local users', e)
    }
  }

  // Fallback to in-memory users
  const found = FALLBACK_USERS.find((u) => u.username === username)
  if (!found) return null
  return {
    user: {
      id: found.id,
      username: found.username,
      name: found.name,
      role: found.role,
      allowedDivisions: found.allowedDivisions,
      employeeId: found.employeeId,
    },
    hash: found.passwordHash,
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Логин', type: 'text' },
        password: { label: 'Пароль', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null

        const result = await findUser(credentials.username)
        if (!result) return null

        const passwordMatch = await bcrypt.compare(credentials.password, result.hash)
        if (!passwordMatch) return null

        return {
          ...result.user,
          email: `${result.user.username}@agency-os.local`,
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as any
        token.role = u.role
        token.username = u.username
        token.allowedDivisions = u.allowedDivisions
        token.employeeId = u.employeeId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
        ;(session.user as any).username = token.username
        ;(session.user as any).allowedDivisions = token.allowedDivisions
        ;(session.user as any).employeeId = token.employeeId
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'agency-os-dev-secret-change-in-prod',
}
