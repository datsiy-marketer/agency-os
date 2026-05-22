import { AppShell } from '@/components/layout/AppShell'
import { DivisionPage } from '@/components/dashboard/DivisionPage'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function Page({ params }: Props) {
  const { slug } = await params
  return (
    <AppShell>
      <DivisionPage slug={slug} />
    </AppShell>
  )
}
