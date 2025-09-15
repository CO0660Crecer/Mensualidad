import React from 'react'
import { DivideIcon as LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  color: 'blue' | 'green' | 'orange' | 'red'
  trend?: {
    value: number
    label: string
  }
}

const colorClasses = {
  blue: 'from-blue-500 to-indigo-600',
  green: 'from-green-500 to-emerald-600',
  orange: 'from-orange-500 to-amber-600',
  red: 'from-red-500 to-pink-600'
}

export function StatCard({ title, value, subtitle, icon: Icon, color, trend }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-16 h-16 bg-gradient-to-r ${colorClasses[color]} rounded-2xl flex items-center justify-center`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>
      
      {trend && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${trend.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {trend.value >= 0 ? '+' : ''}{trend.value}%
            </span>
            <span className="text-gray-500 text-sm">{trend.label}</span>
          </div>
        </div>
      )}
    </div>
  )
}