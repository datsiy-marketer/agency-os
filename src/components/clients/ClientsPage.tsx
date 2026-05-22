'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TopBar } from '@/components/layout/TopBar'
import { useAppStore } from '@/lib/store'
import { DIVISION_MAP } from '@/lib/constants'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Search, Plus, Users, FolderKanban, Phone, Mail, Filter, Pencil, Trash2 } from 'lucide-react'
import type { Client, Division } from '@/types'

const divisionFilters = [
  { value: 'all', label: 'Все' },
  { value: 'ignite', label: 'Ignite' },
  { value: 'noise-dealers', label: 'Noise Dealers' },
  { value: 'other', label: 'Прочее' },
]

const divisionOptions: { value: Division; label: string }[] = [
  { value: 'ignite', label: 'Ignite' },
  { value: 'noise-dealers', label: 'Noise Dealers' },
  { value: 'other', label: 'Прочее' },
]

export function ClientsPage() {
  const { clients, projects, updateClient, deleteClient } = useAppStore()
  const [search, setSearch] = useState('')
  const [divisionFilter, setDivisionFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  // Edit state
  const [editClient, setEditClient] = useState<Client | null>(null)
  const [editForm, setEditForm] = useState<Partial<Client>>({})

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<Client | null>(null)

  const filtered = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(search.toLowerCase()) ||
      client.contact_name?.toLowerCase().includes(search.toLowerCase()) ||
      false
    const matchesDivision = divisionFilter === 'all' || client.division === divisionFilter
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter
    return matchesSearch && matchesDivision && matchesStatus
  })

  const getClientProjects = (clientId: string) =>
    projects.filter((p) => p.client_id === clientId)

  const getActiveProjects = (clientId: string) =>
    projects.filter((p) => p.client_id === clientId && p.status === 'active')

  const openEdit = (client: Client) => {
    setEditClient(client)
    setEditForm({ ...client })
  }

  const handleEditSave = () => {
    if (!editClient) return
    updateClient(editClient.id, editForm)
    setEditClient(null)
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteClient(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <div>
      <TopBar
        title="Клиенты"
        subtitle={`${clients.length} клиентов · ${clients.filter((c) => c.status === 'active').length} активных`}
        actions={
          <Link href="/clients/new">
            <Button size="sm" className="gap-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold">
              <Plus size={16} />
              Добавить клиента
            </Button>
          </Link>
        }
      />

      <div className="p-6">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Поиск по имени клиента..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card border-border"
            />
          </div>

          <div className="flex gap-2 flex-wrap">
            {divisionFilters.map((f) => (
              <button
                key={f.value}
                onClick={() => setDivisionFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  divisionFilter === f.value
                    ? 'bg-amber-500 text-black'
                    : 'bg-card text-muted-foreground hover:text-foreground border border-border'
                }`}
              >
                {f.label}
              </button>
            ))}
            <button
              onClick={() => setStatusFilter(statusFilter === 'all' ? 'active' : 'all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                statusFilter === 'active'
                  ? 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                  : 'bg-card text-muted-foreground hover:text-foreground border border-border'
              }`}
            >
              <Filter size={14} />
              {statusFilter === 'active' ? 'Активные' : 'Все статусы'}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {['ignite', 'noise-dealers', 'other'].map((divId) => {
            const div = DIVISION_MAP[divId]
            const divClients = clients.filter((c) => c.division === divId)
            return (
              <div key={divId} className={`p-4 rounded-xl border ${div.borderColor} ${div.bgColor}`}>
                <div className={`text-2xl font-bold ${div.textColor}`}>{divClients.length}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{div.name}</div>
              </div>
            )
          })}
        </div>

        {/* Client cards grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg font-medium">
              {clients.length === 0 ? 'Нет клиентов' : 'Клиенты не найдены'}
            </p>
            {clients.length === 0 ? (
              <>
                <p className="text-sm mt-1">Добавьте первого клиента, чтобы начать работу</p>
                <Link href="/clients/new">
                  <Button className="mt-4 bg-amber-500 hover:bg-amber-600 text-black font-semibold gap-2">
                    <Plus size={16} />
                    Добавить первого клиента
                  </Button>
                </Link>
              </>
            ) : (
              <p className="text-sm mt-1">Попробуйте изменить фильтры</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((client) => {
              const div = DIVISION_MAP[client.division]
              const clientProjects = getClientProjects(client.id)
              const activeProjects = getActiveProjects(client.id)

              return (
                <Card key={client.id} className="bg-card border-border hover:border-amber-500/30 transition-all hover:shadow-sm h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1 min-w-0">
                        <Link href={`/clients/${client.id}`}>
                          <h3 className="font-semibold text-foreground hover:text-amber-600 transition-colors cursor-pointer">
                            {client.name}
                          </h3>
                        </Link>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${div.bgColor} ${div.textColor} ${div.borderColor}`}>
                            {div.name}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            client.status === 'active'
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/30'
                              : 'bg-slate-500/10 text-slate-500 border border-slate-500/30'
                          }`}>
                            {client.status === 'active' ? 'Активный' : 'Неактивный'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0 ml-2">
                        <button
                          onClick={() => openEdit(client)}
                          className="p-1.5 rounded hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(client)}
                          className="p-1.5 rounded hover:bg-red-50 transition-colors text-muted-foreground hover:text-red-600"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {client.contact_name && (
                      <div className="space-y-1.5 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Users size={13} />
                          <span>{client.contact_name}</span>
                        </div>
                        {client.contact_phone && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone size={13} />
                            <span>{client.contact_phone}</span>
                          </div>
                        )}
                        {client.contact_email && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail size={13} />
                            <span className="truncate">{client.contact_email}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {client.notes && (
                      <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{client.notes}</p>
                    )}

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <div className="flex items-center gap-1.5 text-sm">
                        <FolderKanban size={14} className="text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {clientProjects.length} проектов
                        </span>
                      </div>
                      {activeProjects.length > 0 && (
                        <span className="text-xs font-medium text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          {activeProjects.length} активных
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editClient} onOpenChange={() => setEditClient(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Редактировать клиента</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Название компании *</Label>
              <Input
                value={editForm.name || ''}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Дивизион</Label>
              <select
                value={editForm.division || 'ignite'}
                onChange={(e) => setEditForm({ ...editForm, division: e.target.value as Division })}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
              >
                {divisionOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Статус</Label>
              <select
                value={editForm.status || 'active'}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'active' | 'inactive' })}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm"
              >
                <option value="active">Активный</option>
                <option value="inactive">Неактивный</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Контактное лицо</Label>
                <Input
                  value={editForm.contact_name || ''}
                  onChange={(e) => setEditForm({ ...editForm, contact_name: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Телефон</Label>
                <Input
                  value={editForm.contact_phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, contact_phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={editForm.contact_email || ''}
                onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Заметки</Label>
              <Textarea
                value={editForm.notes || ''}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditClient(null)}>Отмена</Button>
            <Button className="bg-amber-500 hover:bg-amber-600 text-black font-semibold" onClick={handleEditSave}>
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Удалить клиента?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">
            Клиент <span className="font-medium text-foreground">«{deleteTarget?.name}»</span> будет удалён. Это действие нельзя отменить.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Отмена</Button>
            <Button variant="destructive" onClick={handleDelete}>Удалить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
