import React, { useState, useEffect } from 'react'
import { Plus, Search, Calendar, Receipt, DollarSign, Edit2, Trash2, User, ChevronDown, ChevronRight } from 'lucide-react'
import { supabase, Payment, Participant } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

interface PaymentListProps {
  onEditPayment: (payment?: Payment) => void
}

interface GroupedPayment {
  receipt_number: string
  payment_date: string
  created_at: string
  observations?: string
  payments: Payment[]
  total_amount: number
}

export function PaymentList({ onEditPayment }: PaymentListProps) {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const { isAdmin } = useAuth()

  useEffect(() => {
    loadPayments()
  }, [])

  const loadPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          participant:participants(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPayments(data || [])
    } catch (error) {
      console.error('Error loading payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este pago?')) return

    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id)

      if (error) throw error
      setPayments(payments.filter(p => p.id !== id))
    } catch (error) {
      console.error('Error deleting payment:', error)
      alert('Error al eliminar pago')
    }
  }

  const groupPaymentsByReceipt = (payments: Payment[]): GroupedPayment[] => {
    const groups = new Map<string, GroupedPayment>()

    payments.forEach(payment => {
      const key = payment.participant_id
      
      if (!groups.has(key)) {
        groups.set(key, {
          receipt_number: `${payment.participant?.code} - ${payment.participant?.full_name}`,
          payment_date: payment.payment_date,
          created_at: payment.created_at,
          observations: payment.observations || '',
          payments: [],
          total_amount: 0
        })
      }

      const group = groups.get(key)!
      group.payments.push(payment)
      group.total_amount += payment.amount
    })

    return Array.from(groups.values()).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }

  const filteredPayments = payments.filter(payment =>
    payment.participant?.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.participant?.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.receipt_number.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const groupedPayments = groupPaymentsByReceipt(filteredPayments)

  const toggleGroup = (receiptNumber: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(receiptNumber)) {
      newExpanded.delete(receiptNumber)
    } else {
      newExpanded.add(receiptNumber)
    }
    setExpandedGroups(newExpanded)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatConsecutiveMonths = (payments: Payment[]) => {
    // Agrupar pagos por participante
    const paymentsByParticipant = payments.reduce((acc, payment) => {
      const key = payment.participant?.code || ''
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(payment)
      return acc
    }, {} as { [key: string]: Payment[] })

    return Object.entries(paymentsByParticipant).map(([code, participantPayments]) => {
      // Ordenar pagos por mes
      const sortedPayments = participantPayments.sort((a, b) => a.month.localeCompare(b.month))
      const months = sortedPayments.map(p => {
        const [year, month] = p.month.split('-')
        return { 
          num: parseInt(month), 
          year: parseInt(year),
          name: new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('es-ES', { month: 'long' })
        }
      })

      // Formatear meses consecutivos
      const formatMonthRange = (months: any[]) => {
        if (months.length === 1) {
          return `${months[0].name} ${months[0].year}`
        }

        // Buscar rangos consecutivos
        const ranges = []
        let start = 0
        
        for (let i = 1; i <= months.length; i++) {
          const isConsecutive = i < months.length && 
            months[i].num === months[i-1].num + 1 && 
            months[i].year === months[i-1].year
          
          if (!isConsecutive) {
            const end = i - 1
            if (end > start + 1) {
              // Rango de 3 o más meses consecutivos
              ranges.push(`${months[start].name} - ${months[end].name} ${months[end].year}`)
            } else if (end === start + 1) {
              // Solo 2 meses consecutivos
              ranges.push(`${months[start].name}, ${months[end].name} ${months[end].year}`)
            } else {
              // Un solo mes
              ranges.push(`${months[start].name} ${months[start].year}`)
            }
            start = i
          }
        }
        
        return ranges.join(', ')
      }

      const formattedMonths = formatMonthRange(months)
      return participantPayments.length > 1 ? `${code}: ${formattedMonths}` : formattedMonths
    }).join(' | ')
  }

  const formatMonth = (monthString: string) => {
    const [year, month] = monthString.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('es-ES', {
      month: 'long'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pagos</h1>
          <p className="text-gray-600 mt-2">{payments.length} pagos registrados</p>
        </div>
        <button
          onClick={() => onEditPayment()}
          className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
        >
          <Plus className="w-5 h-5" />
          <span>Registrar Pago</span>
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por participante, código o recibo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {groupedPayments.length === 0 ? (
          <div className="p-8 text-center">
            <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron pagos</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {groupedPayments.map((group) => (
              <div key={group.receipt_number} className="transition-colors">
                {/* Header del grupo */}
                <div 
                  className="p-6 hover:bg-gray-50 cursor-pointer"
                  onClick={() => toggleGroup(group.receipt_number)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                        <Receipt className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {group.receipt_number}
                        </h3>
                        <div className="flex items-center space-x-4 mt-1">
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(group.payment_date)}</span>
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-gray-600">
                            <User className="w-4 h-4" />
                            <span>{group.payments.length} pago{group.payments.length > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                        {group.observations && (
                          <div className="mt-2 text-sm text-gray-600 bg-blue-50 px-2 py-1 rounded">
                            <strong>Observaciones:</strong> {group.observations}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="flex items-center space-x-1 text-lg font-semibold text-green-600">
                          <DollarSign className="w-5 h-5" />
                          <span>{formatCurrency(group.total_amount)}</span>
                        </div>
                        <span className="text-sm text-gray-500">Total</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {expandedGroups.has(group.receipt_number) ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detalles expandidos */}
                {expandedGroups.has(group.receipt_number) && (
                  <div className="bg-gray-50 border-t border-gray-200">
                    {group.payments.map((payment, index) => (
                      <div key={payment.id} className="px-6 py-4 border-b border-gray-200 last:border-b-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                              <Receipt className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                Recibo #{payment.receipt_number}
                              </p>
                              <p className="text-sm text-gray-600">
                                {formatMonth(payment.month)} - {formatCurrency(payment.amount)}
                              </p>
                              {payment.observations && (
                                <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mt-1">
                                  {payment.observations}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onEditPayment(payment)
                              }}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDelete(payment.id)
                                }}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}