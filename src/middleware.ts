import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token as any
    const pathname = req.nextUrl.pathname

    // Finance routes: founder only
    if (pathname.startsWith('/finance') && token?.role !== 'founder') {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // Division access check for employees
    if (token?.role === 'employee' && token?.allowedDivisions?.length > 0) {
      const divisionMatch = pathname.match(/^\/divisions\/([^/]+)/)
      if (divisionMatch) {
        const slug = divisionMatch[1]
        if (!token.allowedDivisions.includes(slug)) {
          return NextResponse.redirect(new URL('/', req.url))
        }
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: ['/((?!api|login|_next/static|_next/image|favicon.ico).*)'],
}
