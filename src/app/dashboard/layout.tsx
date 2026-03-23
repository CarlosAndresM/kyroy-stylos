import { Sidebar } from '@/components/layout/sidebar'
import { Bell, Search, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cookies } from 'next/headers'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const sessionUser = cookieStore.get('session_user')
  let user = null
  if (sessionUser && sessionUser.value) {
    try {
      user = JSON.parse(sessionUser.value)
    } catch (e) {
      console.error("Error parsing session_user cookie:", e)
    }
  }
  
  const userRole = user?.role || 'INVITADO'
  const userName = user?.username || 'Usuario'

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      {/* Sidebar - en desktop ocupa espacio, en móvil es drawer superpuesto */}
      <Sidebar role={userRole} />

      {/* Main Content Area - en móvil ocupa todo el ancho */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-14 md:h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
          {/* Espacio para botón hamburguesa en móvil */}
          <div className="flex items-center gap-4 flex-1">
            {/* Placeholder para el botón hamburguesa en móvil (el sidebar lo renderiza) */}
            <div className="size-10 md:hidden" />
            <div className="relative w-full max-w-md group hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-[#FF7E5F] transition-colors" />
              <Input 
                placeholder="BUSCAR..." 
                className="pl-10 bg-slate-100/50 dark:bg-slate-800/50 border-none focus-visible:ring-1 focus-visible:ring-[#FF7E5F]/50 h-10 w-full rounded-full transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" className="rounded-full relative hover:bg-slate-100 dark:hover:bg-slate-800">
              <Bell className="size-5 text-slate-500" />
              <span className="absolute top-2 right-2 size-2 bg-[#FF7E5F] rounded-full border-2 border-white dark:border-slate-900" />
            </Button>
            
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1 md:mx-2" />

            <div className="flex items-center gap-2 md:gap-3 pl-1 md:pl-2 group cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-1 rounded-full transition-colors">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none">{userName}</p>
                <p className="text-xs text-slate-500 font-medium">{userRole}</p>
              </div>
              <div className="size-9 md:size-10 rounded-full bg-gradient-to-br from-[#FF7E5F] to-[#FEB47B] flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-sm">
                <User className="size-5 md:size-6 text-white" />
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Content */}
        <main className="flex-1 overflow-y-auto p-3 md:p-8 custom-scrollbar relative">
          {/* Subtle Background Glows */}
          <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-br from-[#FF7E5F]/5 to-transparent blur-3xl -z-10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-[#FEB47B]/5 to-transparent blur-3xl -z-10 pointer-events-none" />
          
          <div className="max-w-7xl mx-auto space-y-4 md:space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
