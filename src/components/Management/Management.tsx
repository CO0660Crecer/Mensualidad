import React, { useState, useEffect } from 'react'
import { Users, Settings, Database, Shield, Download, Upload, Trash2, AlertTriangle } from 'lucide-react'
import { supabase, Participant, Payment } from '../../lib/supabase'

export function Management() {
  const [stats, setStats] = useState({
    totalParticipants: 0,
    activeParticipants: 0,
    inactiveParticipants: 0,
    totalPayments: 0,
    totalAmount: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const [participantsResult, paymentsResult] = await Promise.all([
        supabase.from('participants').select('is_active'),
        supabase.from('payments').select('amount')
      ])

      const participants = participantsResult.data || []
      const payments = paymentsResult.data || []

      setStats({
        totalParticipants: participants.length,
        activeParticipants: participants.filter(p => p.is_active).length,
        inactiveParticipants: participants.filter(p => !p.is_active).length,
        totalPayments: payments.length,
        totalAmount: payments.reduce((sum, p) => sum + p.amount, 0)
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const exportAllData = async () => {
    try {
      const [participantsResult, paymentsResult] = await Promise.all([
        supabase.from('participants').select('*').order('code'),
        supabase.from('payments').select(`
          *,
          participant:participants(code, full_name)
        `).order('payment_date', { ascending: false })
      ])

      // Export participants
      const participantsHeaders = ['Código', 'Nombre', 'Cuota Mensual', 'Estado', 'Fecha Creación']
      const participantsData = (participantsResult.data || []).map(p => [
        p.code,
        p.full_name,
        p.monthly_fee,
        p.is_active ? 'Activo' : 'Inactivo',
        new Date(p.created_at).toLocaleDateString('es-ES')
      ])

      const participantsCsv = [participantsHeaders, ...participantsData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n')

      // Export payments
      const paymentsHeaders = ['Fecha', 'Código Participante', 'Nombre', 'Mes', 'Monto', 'Recibo']
      const paymentsData = (paymentsResult.data || []).map(p => [
        p.payment_date,
        p.participant?.code || '',
        p.participant?.full_name || '',
        p.month,
        p.amount,
        p.receipt_number
      ])

      const paymentsCsv = [paymentsHeaders, ...paymentsData]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n')

      // Download participants file
      const participantsBlob = new Blob([participantsCsv], { type: 'text/csv;charset=utf-8;' })
      const participantsLink = document.createElement('a')
      const participantsUrl = URL.createObjectURL(participantsBlob)
      participantsLink.setAttribute('href', participantsUrl)
      participantsLink.setAttribute('download', `participantes_${new Date().toISOString().slice(0, 10)}.csv`)
      participantsLink.style.visibility = 'hidden'
      document.body.appendChild(participantsLink)
      participantsLink.click()
      document.body.removeChild(participantsLink)

      // Download payments file
      setTimeout(() => {
        const paymentsBlob = new Blob([paymentsCsv], { type: 'text/csv;charset=utf-8;' })
        const paymentsLink = document.createElement('a')
        const paymentsUrl = URL.createObjectURL(paymentsBlob)
        paymentsLink.setAttribute('href', paymentsUrl)
        paymentsLink.setAttribute('download', `pagos_${new Date().toISOString().slice(0, 10)}.csv`)
        paymentsLink.style.visibility = 'hidden'
        document.body.appendChild(paymentsLink)
        paymentsLink.click()
        document.body.removeChild(paymentsLink)
      }, 1000)

    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Error al exportar datos')
    }
  }

  const resetDatabase = async () => {
    if (!window.confirm('⚠️ ADVERTENCIA: Esta acción eliminará TODOS los datos de participantes y pagos. ¿Estás seguro?')) {
      return
    }

    if (!window.confirm('Esta acción NO se puede deshacer. ¿Realmente deseas continuar?')) {
      return
    }

    try {
      setLoading(true)
      
      // Delete all payments first (due to foreign key constraints)
      await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      
      // Then delete all participants
      await supabase.from('participants').delete().neq('id', '00000000-0000-0000-0000-000000000000')
      
      alert('Base de datos reiniciada exitosamente')
      loadStats()
    } catch (error) {
      console.error('Error resetting database:', error)
      alert('Error al reiniciar la base de datos')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Administración</h1>
        <p className="text-gray-600 mt-2">Panel de administración del sistema</p>
      </div>

      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Participantes</p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{stats.totalParticipants}</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.activeParticipants} activos, {stats.inactiveParticipants} inactivos
              </p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Pagos</p>
              <p className="text-2xl font-bold text-green-600 mt-2">{stats.totalPayments}</p>
              <p className="text-sm text-gray-500 mt-1">Registros de pago</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center">
              <Database className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Monto Total</p>
              <p className="text-2xl font-bold text-purple-600 mt-2">{formatCurrency(stats.totalAmount)}</p>
              <p className="text-sm text-gray-500 mt-1">Recaudado histórico</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center">
              <Settings className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Herramientas de administración */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exportar datos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Download className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Exportar Datos</h3>
              <p className="text-sm text-gray-600">Descargar todos los datos en formato CSV</p>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Exporta todos los participantes y pagos registrados en el sistema. 
              Se generarán dos archivos CSV separados.
            </p>
            <button
              onClick={exportAllData}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-2 px-4 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
            >
              Exportar Todos los Datos
            </button>
          </div>
        </div>

        {/* Configuración del sistema */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Configuración</h3>
              <p className="text-sm text-gray-600">Ajustes del sistema</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-green-800">Cuota mensual actual:</span>
                <span className="text-lg font-bold text-green-600">{formatCurrency(3000000)}</span>
              </div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-800">Moneda del sistema:</span>
                <span className="text-sm font-bold text-blue-600">Pesos Colombianos (COP)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Zona de peligro */}
        <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 lg:col-span-2">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-900">Zona de Peligro</h3>
              <p className="text-sm text-red-600">Acciones irreversibles del sistema</p>
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800 mb-2">Reiniciar Base de Datos</h4>
                <p className="text-sm text-red-700 mb-4">
                  Esta acción eliminará TODOS los participantes y pagos registrados. 
                  Esta operación NO se puede deshacer. Asegúrate de exportar los datos antes de continuar.
                </p>
                <button
                  onClick={resetDatabase}
                  className="flex items-center space-x-2 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Reiniciar Base de Datos</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}