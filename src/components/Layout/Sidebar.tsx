import React from 'react'
import { Home, Users, CreditCard, BarChart3, FileText } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

interface SidebarProps {
  activeView: string
  onViewChange: (view: string) => void
}

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { isAdmin } = useAuth()

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, allowTutora: true },
    { id: 'participants', label: 'Participantes', icon: Users, allowTutora: true },
    { id: 'payments', label: 'Pagos', icon: CreditCard, allowTutora: true },
    { id: 'reports', label: 'Reportes', icon: BarChart3, allowTutora: false },
    { id: 'management', label: 'Administración', icon: FileText, allowTutora: false }
  ]

  const visibleItems = menuItems.filter(item => 
    isAdmin || item.allowTutora
  )

  return (
    <div className="w-64 bg-gray-50 min-h-screen border-r border-gray-200">
      <div className="p-4">
        <nav className="space-y-2">
          {visibleItems.map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.id
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`
                  w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}