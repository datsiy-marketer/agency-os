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
import { CheckCircle2, ChevronRight, ChevronLeft, Rocket } from 'lucide-react'
import type { Project, Division, ProjectType, BillingType, ProjectAssignment } from '@/types'

type Step = 1 | 2 | 3 | 4 | 5

interface FormData {
  name: string
  client_id: string
  division: Division
  type: ProjectType
  billing_type: BillingType
  start_date: string
  end_date: string
  monthly_rate: string
  one_time_fee: string
  description: string
  brief: string
  kpis: Array<{ name: string; target: string; unit: string }>
  assignments: Array<{ employee_id: string; role: string; monthly_rate: string }>
  links: Array<{ title: string; url: string; type: 'brief' | 'report' | 'design' | 'other' }>
}

const steps = [
  { num: 1, label: 'Основное' },
  { num: 2, label: 'Оплата' },
  { num: 3, label: 'Команда' },
  { num: 4, label: 'Бриф и KPI' },
  { num: 5, label: 'Запуск' },
]

const divisionOptions: { value: Division; label: string; desc: string }[] = [
  { value: 'ignite', label: 'Ignite', desc: 'Маркетинг недвижимости' },
  { value: 'noise-dealers', label: 'Noise Dealers', desc: 'Ивент маркетинг' },
  { value: 'other', label: 'Прочее', desc: 'Разные проекты' },
]

const typeOptions: { value: ProjectType; label: string }[] = [
  { value: 'real-estate', label: 'Недвижимость' },
  { value: 'event', label: 'Ивент' },
  { value: 'other', label: 'Прочее' },
]

export function NewProjectWizard() {
  const router = useRouter()
  const { clients, employees, addProject, addAssignment } = useAppStore()
  const [step, setStep] = useState<Step>(1)
  const [form, setForm] = useState<FormData>({
    name: '',
    client_id: '',
    division: 'ignite',
    type: 'real-estate',
    billing_type: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    monthly_rate: '',
    one_time_fee: '',
    description: '',
    brief: '',
    kpis: [{ name: '', target: '', unit: '' }],
    assignments: [],
    links: [],
  })

  const setField = (field: keyof FormData, value: any) =>
    setForm((f) => ({ ...f, [field]: value }))

  const handleLaunch = () => {
    const project: Project = {
      id: `proj-${Date.now()}`,
      name: form.name,
      client_id: form.client_id,
      division: form.division,
      type: form.type,
      status: 'active',
      billing_type: form.billing_type,
      start_date: form.start_date,
      end_date: form.end_date || undefined,
      monthly_rate: form.monthly_rate ? Number(form.monthly_rate) : undefined,
      one_time_fee: form.one_time_fee ? Number(form.one_time_fee) : undefined,
      description: form.description,
      brief: form.brief,
      kpis: form.kpis
        .filter((k) => k.name)
        .map((k, i) => ({
          id: `kpi-new-${i}`,
          name: k.name,
          target: Number(k.target) || 0,
          current: 0,
          unit: k.unit,
        })),
      links: form.links
        .filter((l) => l.title && l.url)
        .map((l, i) => ({ id: `link-new-${i}`, ...l })),
      created_at: new Date().toISOString(),
    }
    addProject(project)

    form.assignments.forEach((a, i) => {
      if (a.employee_id) {
        const assignment: ProjectAssignment = {
          id: `asgn-new-${Date.now()}-${i}`,
          project_id: project.id,
          employee_id: a.employee_id,
          role: a.role,
          monthly_rate: a.monthly_rate ? Number(a.monthly_rate) : undefined,
          start_date: form.start_date,
        }
        addAssignment(assignment)
      }
    })

    router.push(`/projects/${project.id}`)
  }

  const client = clients.find((c) => c.id === form.client_id)

  return (
    <div>
      <TopBar title="Новый проект" subtitle="Пошаговое создание проекта" />

      <div className="p-6 max-w-3xl">
        {/* Step indicator */}
        <div className="flex items-center gap-0 mb-8">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step > s.num
                      ? 'bg-emerald-500 text-white'
                      : step === s.num
                      ? 'bg-amber-500 text-black'
                      : 'bg-card border border-border text-muted-foreground'
                  }`}
                >
                  {step > s.num ? <CheckCircle2 size={16} /> : s.num}
                </div>
                <span className={`text-[11px] mt-1 ${step === s.num ? 'text-amber-400' : 'text-muted-foreground'}`}>
                  {s.label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-px w-12 mx-1 mt-[-14px] ${step > s.num ? 'bg-emerald-500' : 'bg-border'}`} />
              )}
            </div>
          ))}
        </div>

        <Card className="bg-card border-border">
          {/* Step 1: Basic info */}
          {step === 1 && (
            <>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Основная информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Название проекта *</Label>
                  <Input
                    id="name"
                    required
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                    placeholder="Запуск продаж ЖК «Рассвет»"
                    className="bg-background border-border"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Клиент *</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {clients.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setField('client_id', c.id)}
                        className={`p-3 rounded-lg border text-left text-sm transition-all ${
                          form.client_id === c.id
                            ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                            : 'border-border bg-background text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Дивизион *</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {divisionOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setField('division', opt.value)}
                        className={`p-3 rounded-lg border text-left transition-all ${
                          form.division === opt.value
                            ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                            : 'border-border bg-background text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <div className="font-medium text-sm">{opt.label}</div>
                        <div className="text-xs opacity-70 mt-0.5">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Тип проекта *</Label>
                  <div className="flex gap-2">
                    {typeOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setField('type', opt.value)}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                          form.type === opt.value
                            ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                            : 'border-border bg-background text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Дата начала *</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={form.start_date}
                      onChange={(e) => setField('start_date', e.target.value)}
                      className="bg-background border-border"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">Дата окончания</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={form.end_date}
                      onChange={(e) => setField('end_date', e.target.value)}
                      className="bg-background border-border"
                    />
                  </div>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 2: Billing */}
          {step === 2 && (
            <>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Настройка оплаты</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label>Тип оплаты *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { value: 'monthly', label: 'Ежемесячно', desc: 'Выставляется 1-го и 15-го числа' },
                      { value: 'one-time', label: 'Единоразово', desc: 'Одна оплата за весь проект' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setField('billing_type', opt.value as BillingType)}
                        className={`p-4 rounded-lg border text-left transition-all ${
                          form.billing_type === opt.value
                            ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                            : 'border-border bg-background text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <div className="font-semibold text-sm">{opt.label}</div>
                        <div className="text-xs opacity-70 mt-0.5">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {form.billing_type === 'monthly' && (
                  <div className="space-y-2">
                    <Label htmlFor="monthly_rate">Ежемесячная ставка (₽)</Label>
                    <Input
                      id="monthly_rate"
                      type="number"
                      value={form.monthly_rate}
                      onChange={(e) => setField('monthly_rate', e.target.value)}
                      placeholder="150000"
                      className="bg-background border-border"
                    />
                    {form.monthly_rate && (
                      <p className="text-xs text-muted-foreground">
                        ≈ {(Number(form.monthly_rate) / 1000).toFixed(0)}К ₽ в месяц · Следующее выставление 1-го числа
                      </p>
                    )}
                  </div>
                )}

                {form.billing_type === 'one-time' && (
                  <div className="space-y-2">
                    <Label htmlFor="one_time_fee">Единоразовая оплата (₽)</Label>
                    <Input
                      id="one_time_fee"
                      type="number"
                      value={form.one_time_fee}
                      onChange={(e) => setField('one_time_fee', e.target.value)}
                      placeholder="200000"
                      className="bg-background border-border"
                    />
                  </div>
                )}

                <div className="p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <p className="text-sm text-amber-400 font-medium mb-1">Правила выставления счётов</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Счёта выставляются 1-го и 15-го числа</li>
                    <li>• Оплата собирается после полного отработанного месяца</li>
                    <li>• При старте в середине месяца — первый счёт с проразацией</li>
                    <li>• При досрочном завершении — расчёт остатка</li>
                  </ul>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 3: Team */}
          {step === 3 && (
            <>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Назначение команды</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {employees.map((emp) => {
                  const existing = form.assignments.find((a) => a.employee_id === emp.id)
                  const isAdded = !!existing

                  return (
                    <div key={emp.id} className={`p-4 rounded-xl border transition-all ${isAdded ? 'border-amber-500/50 bg-amber-500/5' : 'border-border bg-background'}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                          style={{ backgroundColor: emp.color }}
                        >
                          {emp.name[0]}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{emp.name}</div>
                          <div className="text-xs text-muted-foreground">{emp.role} · {emp.type === 'piece-rate' ? 'Сдельно' : 'Фикс. оклад'}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (isAdded) {
                              setField('assignments', form.assignments.filter((a) => a.employee_id !== emp.id))
                            } else {
                              setField('assignments', [
                                ...form.assignments,
                                { employee_id: emp.id, role: emp.role, monthly_rate: '' },
                              ])
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            isAdded
                              ? 'bg-amber-500 text-black'
                              : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {isAdded ? 'Добавлен' : 'Добавить'}
                        </button>
                      </div>

                      {isAdded && (
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Роль в проекте</Label>
                            <Input
                              value={existing.role}
                              onChange={(e) => {
                                setField(
                                  'assignments',
                                  form.assignments.map((a) =>
                                    a.employee_id === emp.id ? { ...a, role: e.target.value } : a
                                  )
                                )
                              }}
                              placeholder="Руководитель проекта"
                              className="bg-background border-border h-8 text-sm"
                            />
                          </div>
                          {emp.type === 'piece-rate' && (
                            <div className="space-y-1">
                              <Label className="text-xs">Ставка (₽/мес)</Label>
                              <Input
                                type="number"
                                value={existing.monthly_rate}
                                onChange={(e) => {
                                  setField(
                                    'assignments',
                                    form.assignments.map((a) =>
                                      a.employee_id === emp.id ? { ...a, monthly_rate: e.target.value } : a
                                    )
                                  )
                                }}
                                placeholder="30000"
                                className="bg-background border-border h-8 text-sm"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </>
          )}

          {/* Step 4: Brief & KPIs */}
          {step === 4 && (
            <>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Бриф и KPI</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="description">Описание проекта</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setField('description', e.target.value)}
                    placeholder="Краткое описание проекта для команды и клиента..."
                    className="bg-background border-border resize-none"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brief">Бриф для команды</Label>
                  <Textarea
                    id="brief"
                    value={form.brief}
                    onChange={(e) => setField('brief', e.target.value)}
                    placeholder="Подробные инструкции для команды: цели, аудитория, каналы, приоритеты..."
                    className="bg-background border-border resize-none"
                    rows={4}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>KPI проекта</Label>
                    <button
                      type="button"
                      onClick={() => setField('kpis', [...form.kpis, { name: '', target: '', unit: '' }])}
                      className="text-xs text-amber-500 hover:text-amber-400"
                    >
                      + Добавить KPI
                    </button>
                  </div>
                  {form.kpis.map((kpi, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2">
                      <Input
                        value={kpi.name}
                        onChange={(e) => {
                          const kpis = [...form.kpis]
                          kpis[i] = { ...kpis[i], name: e.target.value }
                          setField('kpis', kpis)
                        }}
                        placeholder="Название KPI"
                        className="bg-background border-border text-sm"
                      />
                      <Input
                        type="number"
                        value={kpi.target}
                        onChange={(e) => {
                          const kpis = [...form.kpis]
                          kpis[i] = { ...kpis[i], target: e.target.value }
                          setField('kpis', kpis)
                        }}
                        placeholder="Цель"
                        className="bg-background border-border text-sm"
                      />
                      <Input
                        value={kpi.unit}
                        onChange={(e) => {
                          const kpis = [...form.kpis]
                          kpis[i] = { ...kpis[i], unit: e.target.value }
                          setField('kpis', kpis)
                        }}
                        placeholder="Единица (шт, ₽, %)"
                        className="bg-background border-border text-sm"
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Ссылки</Label>
                    <button
                      type="button"
                      onClick={() => setField('links', [...form.links, { title: '', url: '', type: 'other' as const }])}
                      className="text-xs text-amber-500 hover:text-amber-400"
                    >
                      + Добавить ссылку
                    </button>
                  </div>
                  {form.links.map((link, i) => (
                    <div key={i} className="grid grid-cols-3 gap-2">
                      <Input
                        value={link.title}
                        onChange={(e) => {
                          const links = [...form.links]
                          links[i] = { ...links[i], title: e.target.value }
                          setField('links', links)
                        }}
                        placeholder="Название"
                        className="bg-background border-border text-sm"
                      />
                      <Input
                        value={link.url}
                        onChange={(e) => {
                          const links = [...form.links]
                          links[i] = { ...links[i], url: e.target.value }
                          setField('links', links)
                        }}
                        placeholder="https://..."
                        className="bg-background border-border text-sm col-span-2"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </>
          )}

          {/* Step 5: Review */}
          {step === 5 && (
            <>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Обзор и запуск</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                  <div className="flex items-center gap-3 mb-3">
                    <Rocket size={18} className="text-emerald-500" />
                    <span className="font-semibold text-foreground">Готово к запуску</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Название: </span>
                      <span className="text-foreground font-medium">{form.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Клиент: </span>
                      <span className="text-foreground font-medium">{client?.name || '—'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Дивизион: </span>
                      <span className="text-foreground font-medium">
                        {divisionOptions.find((d) => d.value === form.division)?.label}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Оплата: </span>
                      <span className="text-foreground font-medium">
                        {form.billing_type === 'monthly' && form.monthly_rate
                          ? `${Number(form.monthly_rate).toLocaleString()} ₽/мес`
                          : form.one_time_fee
                          ? `${Number(form.one_time_fee).toLocaleString()} ₽`
                          : 'Не указана'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Старт: </span>
                      <span className="text-foreground font-medium">{form.start_date}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Команда: </span>
                      <span className="text-foreground font-medium">
                        {form.assignments.length > 0
                          ? form.assignments.map((a) => {
                              const emp = employees.find((e) => e.id === a.employee_id)
                              return emp?.name
                            }).join(', ')
                          : 'Не назначена'}
                      </span>
                    </div>
                  </div>
                </div>

                {form.assignments.length > 0 && (
                  <div className="p-4 rounded-xl bg-violet-500/5 border border-violet-500/20">
                    <p className="text-sm font-medium text-violet-400 mb-2">Уведомление команды</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      При запуске проекта «{form.name}» все участники команды получат уведомление с полным брифом,
                      дедлайнами, KPI и своими ролями.
                      {form.assignments.map((a) => {
                        const emp = employees.find((e) => e.id === a.employee_id)
                        return ` ${emp?.name} (${a.role})`
                      }).join(',')} — будут добавлены в проект.
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleLaunch}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold py-6 text-base gap-2"
                  disabled={!form.name || !form.client_id}
                >
                  <Rocket size={18} />
                  Запустить проект
                </Button>
              </CardContent>
            </>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between p-6 pt-0">
            <Button
              variant="outline"
              onClick={() => {
                if (step === 1) router.back()
                else setStep((s) => (s - 1) as Step)
              }}
              className="gap-2 border-border"
            >
              <ChevronLeft size={16} />
              {step === 1 ? 'Отмена' : 'Назад'}
            </Button>

            {step < 5 && (
              <Button
                onClick={() => setStep((s) => (s + 1) as Step)}
                className="gap-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
                disabled={step === 1 && (!form.name || !form.client_id)}
              >
                Далее
                <ChevronRight size={16} />
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
