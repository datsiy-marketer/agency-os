import { AppShell } from '@/components/layout/AppShell'
import { ClientDetailPage } from '@/components/clients/ClientDetailPage'

interface Props {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: Props) {
  const { id } = await params
  return (
    <AppShell>
      <ClientDetailPage clientId={id} />
    </AppShell>
  )
}
