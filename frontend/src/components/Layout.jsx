import { NavLink, Outlet } from 'react-router-dom'
import { Waves, LayoutDashboard, Activity, Bell, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import WeatherScene from './WeatherScene'

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/predict', label: 'Predict', icon: Activity },
  { to: '/alerts', label: 'Alerts', icon: Bell },
  { to: '/about', label: 'About', icon: Info },
]

export default function Layout() {
  return (
    <div className="grain relative min-h-screen">
      <WeatherScene />
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <NavLink to="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30">
              <Waves className="h-5 w-5" />
            </span>
            FRPEWS
          </NavLink>
          <nav className="flex items-center gap-1">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground',
                    isActive && 'bg-secondary text-foreground'
                  )
                }
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="relative z-10 mx-auto max-w-6xl px-4 py-8 pb-16">
        <Outlet />
      </main>
      <footer className="relative z-10 border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
        FRPEWS · Flood Risk Prediction & Early Warning · Nigeria · Thesis prototype
      </footer>
    </div>
  )
}
