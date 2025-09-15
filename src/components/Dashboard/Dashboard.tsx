import React, { useState, useEffect } from 'react'
import { Users, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react'
import { StatCard } from './StatCard'
import { supabase, PaymentStats } from '../../lib/supabase'

export function Dashboard() {
  const [stats, setStats] = useState<PaymentStats>({
    totalParticipants: 0,
    paidThisMonth: 0,
    pendingThisMonth: 0,
    totalCollected: 0,
    totalPending: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM

      // Total participants
      const { count: totalParticipants } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      // Payments this month
      const { data: paymentsThisMonth } = await supabase
        .from('payments')
        .select('participant_id')
        .eq('month', currentMonth)

      const paidThisMonth = paymentsThisMonth?.length || 0
      const pendingThisMonth = (totalParticipants || 0) - paidThisMonth

      // Total collected
      const { data: allPayments } = await supabase
        .from('payments')
        .select('amount')

      const totalCollected = allPayments?.reduce((sum, payment) => sum + payment.amount, 0) || 0

      // Total pending (participants * monthly fee - total collected for current month)
      const { data: participants } = await supabase
        .from('participants')
        .select('monthly_fee')
        .eq('is_active', true)

      const totalMonthlyFees = participants?.reduce((sum, p) => sum + p.monthly_fee, 0) || 0
      const totalPending = pendingThisMonth * (totalMonthlyFees / (totalParticipants || 1))

      setStats({
        totalParticipants: totalParticipants || 0,
        paidThisMonth,
        pendingThisMonth,
        totalCollected,
        totalPending
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const paymentRate = stats.totalParticipants > 0 
    ? Math.round((stats.paidThisMonth / stats.totalParticipants) * 100)
    : 0

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Resumen del mes actual</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Participantes"
          value={stats.totalParticipants}
          icon={Users}
          color="blue"
        />
        
        <StatCard
          title="Pagaron este mes"
          value={stats.paidThisMonth}
          subtitle={`${paymentRate}% del total`}
          icon={DollarSign}
          color="green"
        />
        
        <StatCard
          title="Pendientes de pago"
          value={stats.pendingThisMonth}
          subtitle={`${100 - paymentRate}% del total`}
          icon={AlertTriangle}
          color="orange"
        />
        
        <StatCard
          title="Total Recaudado"
          value={formatCurrency(stats.totalCollected)}
          icon={TrendingUp}
          color="blue"
        />
      </div>

      {/* Visual Payment Progress */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Progreso de Pagos del Mes</h3>
        <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
          <div
            className="bg-gradient-to-r from-green-500 to-emerald-600 h-4 rounded-full transition-all duration-500"
            style={{ width: `${paymentRate}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>{stats.paidThisMonth} pagaron</span>
          <span>{paymentRate}%</span>
          <span>{stats.pendingThisMonth} pendientes</span>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Pagos</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-green-800 font-medium">Al día</span>
              <span className="text-green-600 font-bold">{stats.paidThisMonth}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <span className="text-orange-800 font-medium">Pendientes</span>
              <span className="text-orange-600 font-bold">{stats.pendingThisMonth}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen Financiero</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="text-blue-800 font-medium">Recaudado</span>
              <span className="text-blue-600 font-bold">{formatCurrency(stats.totalCollected)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-red-800 font-medium">Por cobrar</span>
              <span className="text-red-600 font-bold">{formatCurrency(stats.totalPending)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}