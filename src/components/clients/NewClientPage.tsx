'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { TopBar } from '@/components/layout/TopBar'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Client, Division } from '@/types'

const divisionOptions: { value: Division; label: string }[] = [
  { value: 'ignite', label: 'Ignite — Недвижимость' },
  { value: 'noise-dealers', label: 'Noise Dealers — Ивенты' },
  { value: 'other', label: 'Прочее' },
]

export function NewClientPage() {
  const router = useRouter()
  const { addClient } = useAppStore()
  const [form, setForm] = useState({
    name: '',
    division: 'ignite' as Division,
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    notes: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const client: Client = {
      id: `client-${Date.now()}`,
      ...form,
      status: 'active',
      created_at: new Date().toISOString(),
    }
    addClient(client)
    router.push(`/clients/${client.id}`)
  }

  return (
    <div>
      <TopBar title="Новый клиент" subtitle="Добавление клиента в систему" />

      <div className="p-6 max-w-2xl">
        <form onSubmit={handleSubmit}>
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Основная информация</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Название компании *</Label>
                <Input
                  id="name"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="ЖК «Рассвет»"
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label>Дивизион *</Label>
                <div className="grid grid-cols-3 gap-2">
                  {divisionOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm({ ...form, division: opt.value })}
                      className={`p-3 rounded-lg border text-left text-sm transition-all ${
                        form.division === opt.value
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                          : 'border-border bg-background text-muted-foreground hover:border-border/80'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact_name">Контактное лицо</Label>
                  <Input
                    id="contact_name"
                    value={form.contact_name}
                    onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                    placeholder="Имя Фамилия"
                    className="bg-background border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact_phone">Телефон</Label>
                  <Input
                    id="contact_phone"
                    value={form.contact_phone}
                    onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                    placeholder="+7 999 000 00 00"
                    className="bg-background border-border"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                  placeholder="contact@company.ru"
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Заметки</Label>
                <Textarea
                  id="notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Дополнительная информация о клиенте..."
                  className="bg-background border-border resize-none"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="border-border"
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-black font-semibold flex-1"
                  disabled={!form.name}
                >
                  Добавить клиента
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  )
}
