'use client'

import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Settings, Database, Users, Shield, Bell, Palette } from 'lucide-react'
import { useSession } from 'next-auth/react'

export function SettingsPage() {
  const { data: session } = useSession()
  const isFounder = session?.user && (session.user as any).role === 'founder'

  return (
    <div>
      <TopBar title="Настройки" subtitle="Конфигурация системы" />

      <div className="p-6 space-y-6 max-w-3xl">
        {/* Agency info */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Palette size={16} className="text-muted-foreground" />
              Агентство
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Название агентства</Label>
              <Input defaultValue="Agency OS" className="bg-background border-border max-w-xs" />
            </div>
            <div className="space-y-2">
              <Label>Email для уведомлений</Label>
              <Input defaultValue="hello@agency-os.ru" type="email" className="bg-background border-border max-w-xs" />
            </div>
            <Button className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
              Сохранить
            </Button>
          </CardContent>
        </Card>

        {/* Database */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Database size={16} className="text-muted-foreground" />
              База данных (Supabase)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <p className="text-xs text-yellow-500">
                Сейчас используются демо-данные. Для работы с реальными данными подключите Supabase.
              </p>
            </div>
            <div className="space-y-2">
              <Label>NEXT_PUBLIC_SUPABASE_URL</Label>
              <Input
                placeholder="https://xxxx.supabase.co"
                className="bg-background border-border max-w-lg font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label>NEXT_PUBLIC_SUPABASE_ANON_KEY</Label>
              <Input
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                type="password"
                className="bg-background border-border max-w-lg font-mono text-sm"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="border-border">
                Проверить подключение
              </Button>
              <Button className="bg-amber-500 hover:bg-amber-600 text-black font-semibold">
                Применить
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Billing settings */}
        {isFounder && (
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Settings size={16} className="text-muted-foreground" />
                Настройки финансов
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Первая дата выставления счёта</Label>
                  <div className="px-3 py-2 rounded-lg bg-accent/50 border border-border text-sm font-medium">
                    1-е число месяца
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Вторая дата выставления счёта</Label>
                  <div className="px-3 py-2 rounded-lg bg-accent/50 border border-border text-sm font-medium">
                    15-е число месяца
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Дата выплаты зарплат</Label>
                <div className="px-3 py-2 rounded-lg bg-accent/50 border border-border text-sm font-medium">
                  1-е число следующего месяца
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Bell size={16} className="text-muted-foreground" />
              Уведомления
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Напомнить о дате выставления счёта', checked: true },
                { label: 'Уведомлять о просроченных задачах', checked: true },
                { label: 'Отчёт об активности раз в неделю', checked: false },
                { label: 'Уведомлять о новых проектах', checked: true },
              ].map((item, i) => (
                <label key={i} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={item.checked}
                    className="w-4 h-4 rounded border-border accent-amber-500"
                  />
                  <span className="text-sm text-foreground">{item.label}</span>
                </label>
              ))}
            </div>
            <Button className="mt-4 bg-amber-500 hover:bg-amber-600 text-black font-semibold">
              Сохранить
            </Button>
          </CardContent>
        </Card>

        {/* Access control */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Shield size={16} className="text-muted-foreground" />
              Контроль доступа
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50 border border-border">
                <div>
                  <div className="text-sm font-medium text-foreground">Финансовая информация</div>
                  <div className="text-xs text-muted-foreground">Счета, зарплаты, маржа</div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 font-medium">
                  Только основатель
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-accent/50 border border-border">
                <div>
                  <div className="text-sm font-medium text-foreground">Проекты и клиенты</div>
                  <div className="text-xs text-muted-foreground">Брифы, задачи, KPI</div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 font-medium">
                  Вся команда
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
