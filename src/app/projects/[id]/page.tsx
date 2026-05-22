import { AppShell } from '@/components/layout/AppShell'
import { ProjectDetailPage } from '@/components/projects/ProjectDetailPage'

interface Props {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: Props) {
  const { id } = await params
  return (
    <AppShell>
      <ProjectDetailPage projectId={id} />
    </AppShell>
  )
}
