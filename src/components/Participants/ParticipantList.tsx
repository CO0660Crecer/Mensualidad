import React, { useState, useEffect } from 'react'
import { Plus, Search, User, Hash, Edit2, Trash2, Upload } from 'lucide-react'
import { supabase, Participant } from '../../lib/supabase'
import { useAuth } from '../../hooks/useAuth'

interface ParticipantListProps {
  onEditParticipant: (participant: Participant) => void
  onBulkUpload: () => void
}

export function ParticipantList({ onEditParticipant, onBulkUpload }: ParticipantListProps) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { isAdmin } = useAuth()

  useEffect(() => {
    loadParticipants()
  }, [])

  const loadParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .order('code')

      if (error) throw error
      setParticipants(data || [])
    } catch (error) {
      console.error('Error loading participants:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este participante?')) return

    try {
      const { error } = await supabase
        .from('participants')
        .delete()
        .eq('id', id)

      if (error) throw error
      setParticipants(participants.filter(p => p.id !== id))
    } catch (error) {
      console.error('Error deleting participant:', error)
      alert('Error al eliminar participante')
    }
  }

  const filteredParticipants = participants.filter(participant =>
    participant.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    participant.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

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
          <h1 className="text-3xl font-bold text-gray-900">Participantes</h1>
          <p className="text-gray-600 mt-2">{participants.length} participantes registrados</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onBulkUpload}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200"
          >
            <Upload className="w-5 h-5" />
            <span>Carga Masiva</span>
          </button>
          <button
            onClick={() => onEditParticipant({} as Participant)}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
          >
            <Plus className="w-5 h-5" />
            <span>Agregar Participante</span>
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredParticipants.length === 0 ? (
          <div className="p-8 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No se encontraron participantes</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredParticipants.map((participant) => (
              <div key={participant.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <Hash className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {participant.full_name}
                      </h3>
                      <div className="flex items-center space-x-1 text-sm text-gray-600 mt-1">
                        <Hash className="w-4 h-4" />
                        <span>Código: {participant.code}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-green-600">
                        $3.000
                      </div>
                      <span className="text-sm text-gray-500">Cuota mensual</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => onEditParticipant(participant)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDelete(participant.id)}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    participant.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {participant.is_active ? 'Activo' : 'Inactivo'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}