'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Неверный логин или пароль')
      } else {
        router.push('/')
        router.refresh()
      }
    } catch {
      setError('Произошла ошибка. Попробуйте снова.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center mb-4 shadow-lg">
            <span className="text-black font-bold text-xl">A</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Agency OS</h1>
          <p className="text-sm text-muted-foreground mt-1">Управление агентством</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-foreground mb-1">Вход в систему</h2>
          <p className="text-sm text-muted-foreground mb-6">Введите ваши данные для входа</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="username" className="text-sm font-medium text-foreground">
                Логин
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                required
                autoComplete="username"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Пароль
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-semibold rounded-lg text-sm transition-colors"
            >
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <p className="text-xs text-muted-foreground text-center mt-6">
            Нет аккаунта? Обратитесь к администратору.
          </p>
        </div>
      </div>
    </div>
  )
}
