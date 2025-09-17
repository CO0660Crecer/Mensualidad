import React, { useState, useEffect } from 'react'
import { X, User, Calendar, DollarSign, Receipt, Hash, Search, FileText } from 'lucide-react'
import { supabase, Payment, Participant } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

interface PaymentFormProps {
  payment?: Payment
  preselectedParticipant?: Participant
  onClose: () => void
  onSave: () => void
}

export function PaymentForm({ payment, preselectedParticipant, onClose, onSave }: PaymentFormProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [formData, setFormData] = useState({
    participant_ids: [] as string[],
    months: [] as number[],
    amount: '',
    payment_date: '',
    receipt_number: '',
    observations: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showParticipants, setShowParticipants] = useState(false)
  const [showMonths, setShowMonths] = useState(false)
  const { user } = useAuth()
  const [paidMonths, setPaidMonths] = useState<Set<number>>(new Set())

  useEffect(() => {
    loadParticipants()
    
    if (payment?.id) {
      setFormData({
        participant_ids: [payment.participant_id],
        months: [parseInt(payment.month.split('-')[1])],
        amount: payment.amount.toString(),
        payment_date: payment.payment_date,
        receipt_number: payment.receipt_number,
        observations: ''
      })
    } else if (preselectedParticipant) {
      // Set preselected participant
      const today = new Date().toISOString().slice(0, 10)
      setFormData(prev => ({
        ...prev,
        participant_ids: [preselectedParticipant.id],
        payment_date: today,
        amount: '3000'
      }))
      // Load paid months for preselected participant
      loadPaidMonths([preselectedParticipant.id])
    } else {
      // Set current month and today's date as defaults
      const now = new Date()
      const today = now.toISOString().slice(0, 10)
      
      setFormData(prev => ({
        ...prev,
        payment_date: today,
        amount: '3000'
      }))
    }
  }, [payment])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (formData.months.length === 0) {
        throw new Error('Debe seleccionar al menos un mes')
      }
      if (formData.participant_ids.length === 0) {
        throw new Error('Debe seleccionar al menos un participante')
      }

      if (payment?.id) {
        // Para edición, solo actualizar el pago existente
        const currentYear = new Date().getFullYear()
        const monthString = `${currentYear}-${formData.months[0].toString().padStart(2, '0')}`
        
        const paymentData = {
          participant_id: formData.participant_ids[0],
          month: monthString,
          amount: parseFloat(formData.amount),
          payment_date: formData.payment_date,
          receipt_number: formData.receipt_number,
          created_by: user?.id
        }
        
        const { error } = await supabase
          .from('payments')
          .update(paymentData)
          .eq('id', payment.id)

        if (error) throw error
      } else {
        // Para nuevo pago, crear un pago por cada mes seleccionado
        const currentYear = new Date().getFullYear()
        const paymentsToInsert = []
        
        for (const participantId of formData.participant_ids) {
          for (const month of formData.months) {
            const monthString = `${currentYear}-${month.toString().padStart(2, '0')}`
            paymentsToInsert.push({
              participant_id: participantId,
              month: monthString,
              amount: parseFloat(formData.amount) / (formData.participant_ids.length * formData.months.length),
              payment_date: formData.payment_date,
              receipt_number: formData.receipt_number,
              created_by: user?.id
            })
          }
        }
        
        const { error } = await supabase
          .from('payments')
          .insert(paymentsToInsert)

        if (error) throw error
      }

      onSave()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleParticipantToggle = (participantId: string) => {
    const newParticipantIds = formData.participant_ids.includes(participantId)
      ? formData.participant_ids.filter(id => id !== participantId)
      : [...formData.participant_ids, participantId]
    
    setFormData(prev => ({
      ...prev,
      participant_ids: newParticipantIds,
      amount: (3000 * newParticipantIds.length * prev.months.length).toString()
    }))
    
    // Cargar meses pagados para los participantes seleccionados
    if (newParticipantIds.length > 0) {
      loadPaidMonths(newParticipantIds)
    } else {
      setPaidMonths(new Set())
    }
  }

  const handleMonthToggle = (month: number) => {
    const newMonths = formData.months.includes(month)
      ? formData.months.filter(m => m !== month)
      : [...formData.months, month].sort((a, b) => a - b)
    
    setFormData(prev => ({
      ...prev,
      months: newMonths,
      amount: (3000 * prev.participant_ids.length * newMonths.length).toString()
    }))
  }

  const loadPaidMonths = async (participantIds: string[]) => {
    try {
      const currentYear = new Date().getFullYear()
      
      const { data: payments, error } = await supabase
        .from('payments')
        .select('month')
        .in('participant_id', participantIds)
        .like('month', `${currentYear}-%`)
      
      if (error) throw error
      
      const paidMonthsSet = new Set<number>()
      payments?.forEach(payment => {
        const month = parseInt(payment.month.split('-')[1])
        paidMonthsSet.add(month)
      })
      
      setPaidMonths(paidMonthsSet)
    } catch (error) {
      console.error('Error loading paid months:', error)
    }
  }

  const getMonthName = (month: number) => {
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return monthNames[month - 1]
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const filteredParticipants = participants.filter(participant =>
    participant.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    participant.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Generate month options (1-12)
  const generateMonthOptions = () => {
    const months = []
    for (let month = 1; month <= 12; month++) {
      months.push({ value: month, label: getMonthName(month) })
    }
    return months
  }

  // Update amount when months change
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      amount: (3000 * prev.participant_ids.length * prev.months.length).toString()
    }))
  }, [formData.months.length, formData.participant_ids.length])

  const isEdit = !!payment?.id
  const monthOptions = generateMonthOptions()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-2 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md min-h-screen sm:min-h-0 sm:max-h-[95vh] overflow-hidden mt-0 sm:mt-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isEdit ? 'Editar Pago' : 'Registrar Pago'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mx-4 sm:mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto max-h-[calc(100vh-140px)] sm:max-h-[calc(95vh-140px)]">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Participantes * ({formData.participant_ids.length} seleccionados)</span>
              </div>
            </label>
            
            {isEdit ? (
              <select
                value={formData.participant_ids[0] || ''}
                onChange={(e) => setFormData({ ...formData, participant_ids: [e.target.value] })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                required
              >
                <option value="">Seleccionar participante</option>
                {participants.map((participant) => (
                  <option key={participant.id} value={participant.id}>
                    {participant.code} - {participant.full_name}
                  </option>
                ))}
              </select>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => setShowParticipants(!showParticipants)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-left flex items-center justify-between bg-white"
                >
                  <span className="text-sm">
                    {formData.participant_ids.length > 0 
                      ? `${formData.participant_ids.length} participante(s) seleccionado(s)`
                      : 'Seleccionar participantes'
                    }
                  </span>
                  <span className="text-gray-400">
                    {showParticipants ? '▲' : '▼'}
                  </span>
                </button>
                
                {showParticipants && (
                  <div className="mt-2 border border-gray-300 rounded-lg bg-white">
                    <div className="p-3 border-b border-gray-200">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Buscar..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredParticipants.map((participant) => (
                        <label
                          key={participant.id}
                          className={`flex items-center space-x-2 p-3 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${
                            formData.participant_ids.includes(participant.id)
                              ? 'bg-green-50 text-green-800'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.participant_ids.includes(participant.id)}
                            onChange={() => handleParticipantToggle(participant.id)}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                          <span className="text-xs font-mono text-blue-600 min-w-0 flex-shrink-0">{participant.code}</span>
                          <span className="text-sm truncate">{participant.full_name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Meses de pago * {formData.months.length > 0 && `(${formData.months.length} seleccionados)`}</span>
              </div>
            </label>
            {isEdit ? (
              <select
                value={formData.months[0] || ''}
                onChange={(e) => setFormData({ ...formData, months: [parseInt(e.target.value)] })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                required
              >
                <option value="">Seleccionar mes</option>
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
            ) : (
              <div>
                <button
                  type="button"
                  onClick={() => setShowMonths(!showMonths)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-left flex items-center justify-between bg-white"
                >
                  <span className="text-sm">
                    {formData.months.length > 0 
                      ? `${formData.months.length} mes(es) seleccionado(s)`
                      : 'Seleccionar meses'
                    }
                  </span>
                  <span className="text-gray-400">
                    {showMonths ? '▲' : '▼'}
                  </span>
                </button>
                
                {showMonths && (
                  <div className="mt-2 border border-gray-300 rounded-lg bg-white max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
                      {monthOptions.map((month) => (
                        <label
                          key={month.value}
                          className={`flex items-center space-x-2 p-3 cursor-pointer transition-colors border-b border-gray-100 ${
                            paidMonths.has(month.value)
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : formData.months.includes(month.value)
                              ? 'bg-green-50 text-green-800'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.months.includes(month.value)}
                            disabled={paidMonths.has(month.value)}
                            onChange={() => handleMonthToggle(month.value)}
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 disabled:opacity-50"
                          />
                          <span className={`text-sm ${paidMonths.has(month.value) ? 'line-through' : ''}`}>
                            {month.label}
                            {paidMonths.has(month.value) && <span className="ml-1 text-xs">(Pagado)</span>}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4" />
                <span>Monto total *</span>
              </div>
            </label>
            <input
              type="number"
              step="1000"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              placeholder="3000"
              required
            />
            {(formData.months.length > 1 || formData.participant_ids.length > 1) && (
              <p className="text-xs text-gray-500 mt-1">
                {formatCurrency(3000)} × {formData.participant_ids.length} participantes × {formData.months.length} meses = {formatCurrency(3000 * formData.participant_ids.length * formData.months.length)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Fecha de pago *</span>
              </div>
            </label>
            <input
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center space-x-2">
                <Receipt className="w-4 h-4" />
                <span>Número de recibo *</span>
              </div>
            </label>
            <input
              type="text"
              value={formData.receipt_number}
              onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              placeholder="Ej: REC-001, 12345"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Observaciones</span>
              </div>
            </label>
            <textarea
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
              placeholder="Ej: Pago correspondiente al año 2024, hermanos, etc."
              rows={3}
            />
          </div>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 pt-4 sticky bottom-0 bg-white border-t border-gray-200 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 px-4 py-3 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all duration-200 text-sm font-medium"
            >
              {loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Registrar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}