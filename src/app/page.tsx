import { Sidebar } from '@/components/layout/Sidebar'
import { DashboardPage } from '@/components/dashboard/DashboardPage'

export default function Home() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">
        <DashboardPage />
      </main>
    </div>
  )
}
