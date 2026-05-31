import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { clsx } from 'clsx'
import { Menu, X } from 'lucide-react'

interface NavLink {
  label: string
  path: string
  icon?: React.ReactNode
}

interface SidebarProps {
  links: NavLink[]
}

export function Sidebar({ links }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 rounded-lg bg-primary-500 text-white"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed md:static top-0 left-0 z-30 h-screen w-64 bg-neutral-900 text-white overflow-y-auto transition-transform duration-300 md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold">Dinthialma</h1>
          <p className="text-neutral-400 text-sm">Gestion de Tontines</p>
        </div>

        <nav className="mt-8 space-y-2 px-4">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setIsOpen(false)}
              className={clsx(
                'flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors',
                isActive(link.path)
                  ? 'bg-primary-500 text-white'
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
              )}
            >
              {link.icon && <span className="flex-shrink-0">{link.icon}</span>}
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
    </>
  )
}
