import React, { useState, useEffect } from 'react'
import { Search, User, Calendar, DollarSign, CheckCircle, XCircle, FileText, Plus } from 'lucide-react'
import { supabase, Payment, Participant } from '../../lib/supabase'

interface ConsolidadoData {
  participant: Participant
  payments: Payment[]
  monthsStatus: { [key: string]: boolean }
  totalPaid: number
  totalOwed: number
  paidMonths: number
  owedMonths: number
}

interface ConsolidadoProps {
  onRegisterPayment: (participant: Participant) => void
}

export function Consolidado({ onRegisterPayment }: ConsolidadoProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null)
  const [consolidadoData, setConsolidadoData] = useState<ConsolidadoData | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadParticipants()
  }, [])

  const loadParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .eq('is_active', true)
        .order('code')

      if (error) throw error
      setParticipants(data || [])
    } catch (error) {
      console.error('Error loading participants:', error)
    }
  }

  const loadConsolidado = async (participant: Participant) => {
    setLoading(true)
    try {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*')
        .eq('participant_id', participant.id)
        .order('month')

      if (error) throw error

      // Crear estado de meses (1-12)
      const monthsStatus: { [key: string]: boolean } = {}
      const currentYear = new Date().getFullYear()
      
      for (let month = 1; month <= 12; month++) {
        const monthKey = `${currentYear}-${month.toString().padStart(2, '0')}`
        monthsStatus[monthKey] = false
      }

      // Marcar meses pagados
      payments?.forEach(payment => {
        monthsStatus[payment.month] = true
      })

      const paidMonths = Object.values(monthsStatus).filter(paid => paid).length
      const owedMonths = 12 - paidMonths
      const totalPaid = payments?.reduce((sum, p) => sum + p.amount, 0) || 0
      const totalOwed = owedMonths * 3000

      setConsolidadoData({
        participant,
        payments: payments || [],
        monthsStatus,
        totalPaid,
        totalOwed,
        paidMonths,
        owedMonths
      })
    } catch (error) {
      console.error('Error loading consolidado:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleParticipantSelect = (participant: Participant) => {
    setSelectedParticipant(participant)
    loadConsolidado(participant)
    setSearchTerm('')
  }

  const filteredParticipants = participants.filter(participant =>
    participant.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    participant.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const getMonthName = (monthNumber: number) => {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return monthNames[monthNumber - 1]
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Consolidado de Pagos</h1>
        <p className="text-gray-600 mt-2">Consulta el estado de pagos por participante</p>
      </div>

      {/* Buscador de participantes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Search className="w-5 h-5" />
          <span>Buscar Participante</span>
        </h3>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por código o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {searchTerm && filteredParticipants.length > 0 && (
          <div className="mt-4 border border-gray-200 rounded-lg max-h-60 overflow-y-auto">
            {filteredParticipants.map((participant) => (
              <button
                key={participant.id}
                onClick={() => handleParticipantSelect(participant)}
                className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-blue-600">
                      {participant.code}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{participant.full_name}</p>
                    <p className="text-sm text-gray-500">Código: {participant.code}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Resultado del consolidado */}
      {consolidadoData && (
        <div className="space-y-6">
          {/* Información del participante */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {consolidadoData.participant.full_name}
                </h2>
                <p className="text-gray-600">Código: {consolidadoData.participant.code}</p>
              </div>
              <button
                onClick={() => onRegisterPayment(consolidadoData.participant)}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
              >
                <Plus className="w-5 h-5" />
                <span>Registrar Pago</span>
              </button>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 text-sm font-medium">Meses Pagados</p>
                    <p className="text-2xl font-bold text-green-700">{consolidadoData.paidMonths}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-600 text-sm font-medium">Meses Pendientes</p>
                    <p className="text-2xl font-bold text-red-700">{consolidadoData.owedMonths}</p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 text-sm font-medium">Total Pagado</p>
                    <p className="text-lg font-bold text-blue-700">{formatCurrency(consolidadoData.totalPaid)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-orange-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-600 text-sm font-medium">Total Pendiente</p>
                    <p className="text-lg font-bold text-orange-700">{formatCurrency(consolidadoData.totalOwed)}</p>
                  </div>
                  <Calendar className="w-8 h-8 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Estado de meses */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Estado de Pagos por Mes</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.entries(consolidadoData.monthsStatus).map(([monthKey, isPaid]) => {
                const monthNumber = parseInt(monthKey.split('-')[1])
                const monthName = getMonthName(monthNumber)
                
                return (
                  <div
                    key={monthKey}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isPaid
                        ? 'bg-green-50 border-green-200 text-green-800'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{monthName}</p>
                        <p className="text-sm">{formatCurrency(3000)}</p>
                      </div>
                      {isPaid ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                    <p className="text-xs mt-2 font-medium">
                      {isPaid ? 'PAGADO' : 'PENDIENTE'}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Historial de pagos */}
          {consolidadoData.payments.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Historial de Pagos</span>
              </h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mes</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha Pago</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recibo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {consolidadoData.payments.map((payment) => {
                      const monthNumber = parseInt(payment.month.split('-')[1])
                      return (
                        <tr key={payment.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {getMonthName(monthNumber)}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-green-600">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {new Date(payment.payment_date).toLocaleDateString('es-ES')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            #{payment.receipt_number}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {!consolidadoData && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Selecciona un participante</h3>
          <p className="text-gray-600">Usa el buscador para encontrar y seleccionar un participante</p>
        </div>
      )}
    </div>
  )
}