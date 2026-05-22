import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user as any).role !== 'founder') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { username, password, name, employeeId, allowedDivisions } = await req.json()
  const hash = await bcrypt.hash(password, 12)

  // Save to Supabase if configured, otherwise return a placeholder
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (supabaseUrl && supabaseKey) {
    const res = await fetch(`${supabaseUrl}/rest/v1/agency_users`, {
      method: 'POST',
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        username,
        password_hash: hash,
        name,
        employee_id: employeeId,
        allowed_divisions: allowedDivisions,
        role: 'employee',
      }),
    })
    const data = await res.json()
    return Response.json(data[0])
  }

  return Response.json({
    message: 'User created (no DB configured — add to FALLBACK_USERS in auth.ts)',
  })
}
