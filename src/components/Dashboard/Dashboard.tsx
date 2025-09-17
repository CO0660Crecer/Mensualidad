import React, { useState, useEffect } from 'react'
import { Users, DollarSign, TrendingUp, AlertTriangle, Eye, X, CheckCircle, XCircle } from 'lucide-react'
import { StatCard } from './StatCard'
import { supabase, PaymentStats, Participant, Payment } from '../../lib/supabase'

export function Dashboard() {
  const [stats, setStats] = useState<PaymentStats>({
    totalParticipants: 0,
    paidThisMonth: 0,
    pendingThisMonth: 0,
    totalCollected: 0,
    totalPending: 0
  })
  const [loading, setLoading] = useState(true)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [paidParticipants, setPaidParticipants] = useState<Participant[]>([])
  const [unpaidParticipants, setUnpaidParticipants] = useState<Participant[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

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
      const totalPending = pendingThisMonth * 3000

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

  const loadPaymentDetails = async () => {
    setDetailLoading(true)
    try {
      const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM

      // Get all active participants
      const { data: allParticipants } = await supabase
        .from('participants')
        .select('*')
        .eq('is_active', true)
        .order('code')

      // Get participants who paid this month
      const { data: paymentsThisMonth } = await supabase
        .from('payments')
        .select(`
          participant_id,
          participant:participants(*)
        `)
        .eq('month', currentMonth)

      const paidParticipantIds = new Set(paymentsThisMonth?.map(p => p.participant_id) || [])
      
      const paid = (allParticipants || []).filter(p => paidParticipantIds.has(p.id))
      const unpaid = (allParticipants || []).filter(p => !paidParticipantIds.has(p.id))

      setPaidParticipants(paid)
      setUnpaidParticipants(unpaid)
      setShowDetailModal(true)
    } catch (error) {
      console.error('Error loading payment details:', error)
    } finally {
      setDetailLoading(false)
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
        <div className="flex justify-between items-center">
          <div className="flex justify-between text-sm text-gray-600 flex-1">
            <span>{stats.paidThisMonth} pagaron</span>
            <span>{paymentRate}%</span>
            <span>{stats.pendingThisMonth} pendientes</span>
          </div>
          <button
            onClick={loadPaymentDetails}
            disabled={detailLoading}
            className="ml-4 flex items-center space-x-1 bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition-colors text-sm disabled:opacity-50"
          >
            <Eye className="w-4 h-4" />
            <span>{detailLoading ? 'Cargando...' : 'Detalle'}</span>
          </button>
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

      {/* Modal de detalle de pagos */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Detalle de Pagos del Mes Actual
              </h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Participantes que pagaron */}
                <div className="bg-green-50 rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <h3 className="text-lg font-semibold text-green-800">
                      Pagaron ({paidParticipants.length})
                    </h3>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {paidParticipants.map((participant) => (
                      <div
                        key={participant.id}
                        className="bg-white rounded-lg p-3 flex items-center space-x-3"
                      >
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-green-600">
                            {participant.code}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{participant.full_name}</p>
                          <p className="text-sm text-gray-500">Código: {participant.code}</p>
                        </div>
                      </div>
                    ))}
                    {paidParticipants.length === 0 && (
                      <p className="text-green-700 text-center py-4">
                        No hay participantes que hayan pagado este mes
                      </p>
                    )}
                  </div>
                </div>

                {/* Participantes pendientes */}
                <div className="bg-red-50 rounded-xl p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <XCircle className="w-6 h-6 text-red-600" />
                    <h3 className="text-lg font-semibold text-red-800">
                      Pendientes ({unpaidParticipants.length})
                    </h3>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {unpaidParticipants.map((participant) => (
                      <div
                        key={participant.id}
                        className="bg-white rounded-lg p-3 flex items-center space-x-3"
                      >
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-red-600">
                            {participant.code}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{participant.full_name}</p>
                          <p className="text-sm text-gray-500">Código: {participant.code}</p>
                        </div>
                      </div>
                    ))}
                    {unpaidParticipants.length === 0 && (
                      <p className="text-red-700 text-center py-4">
                        Todos los participantes han pagado este mes
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}