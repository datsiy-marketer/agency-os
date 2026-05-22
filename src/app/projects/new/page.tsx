import { AppShell } from '@/components/layout/AppShell'
import { NewProjectWizard } from '@/components/projects/NewProjectWizard'

export default function Page() {
  return (
    <AppShell>
      <NewProjectWizard />
    </AppShell>
  )
}
