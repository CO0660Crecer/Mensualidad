import React, { useState } from 'react'
import { X, Upload, Download, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface BulkUploadFormProps {
  onClose: () => void
  onSave: () => void
}

export function BulkUploadForm({ onClose, onSave }: BulkUploadFormProps) {
  const [textData, setTextData] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<Array<{code: string, full_name: string}>>([])

  const parseTextData = (text: string) => {
    const lines = text.trim().split('\n')
    const participants = []
    
    for (const line of lines) {
      if (line.trim()) {
        const parts = line.split(',').map(part => part.trim())
        if (parts.length >= 2) {
          participants.push({
            code: parts[0],
            full_name: parts[1]
          })
        }
      }
    }
    
    return participants
  }

  const handleTextChange = (text: string) => {
    setTextData(text)
    setError('')
    
    if (text.trim()) {
      try {
        const parsed = parseTextData(text)
        setPreview(parsed)
      } catch (err) {
        setError('Error al procesar los datos')
        setPreview([])
      }
    } else {
      setPreview([])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (preview.length === 0) {
        throw new Error('No hay datos válidos para cargar')
      }

      // Verificar códigos duplicados
      const codes = preview.map(p => p.code)
      const duplicates = codes.filter((code, index) => codes.indexOf(code) !== index)
      if (duplicates.length > 0) {
        throw new Error(`Códigos duplicados encontrados: ${duplicates.join(', ')}`)
      }

      // Verificar si ya existen códigos en la base de datos
      const { data: existingParticipants } = await supabase
        .from('participants')
        .select('code')
        .in('code', codes)

      if (existingParticipants && existingParticipants.length > 0) {
        const existingCodes = existingParticipants.map(p => p.code)
        throw new Error(`Los siguientes códigos ya existen: ${existingCodes.join(', ')}`)
      }

      // Insertar participantes
      const participantsToInsert = preview.map(p => ({
        code: p.code,
        full_name: p.full_name,
        monthly_fee: 3000,
        is_active: true
      }))

      const { error } = await supabase
        .from('participants')
        .insert(participantsToInsert)

      if (error) throw error

      onSave()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = () => {
    const template = `P001,Juan Pérez
P002,María García
P003,Carlos López`
    
    const blob = new Blob([template], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'plantilla_participantes.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Carga Masiva de Participantes</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Instrucciones</h3>
              <button
                onClick={downloadTemplate}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm"
              >
                <Download className="w-4 h-4" />
                <span>Descargar plantilla</span>
              </button>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-2">Formato requerido:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Una línea por participante</li>
                    <li>Formato: <code className="bg-blue-100 px-1 rounded">CÓDIGO,NOMBRE COMPLETO</code></li>
                    <li>Ejemplo: <code className="bg-blue-100 px-1 rounded">P001,Juan Pérez</code></li>
                    <li>Los códigos deben ser únicos</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Datos de participantes
              </label>
              <textarea
                value={textData}
                onChange={(e) => handleTextChange(e.target.value)}
                className="w-full h-40 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="P001,Juan Pérez&#10;P002,María García&#10;P003,Carlos López"
                required
              />
            </div>

            {preview.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Vista previa ({preview.length} participantes)</span>
                </h4>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Código</th>
                        <th className="px-3 py-2 text-left font-medium text-gray-700">Nombre</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {preview.map((participant, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-mono text-blue-600">{participant.code}</td>
                          <td className="px-3 py-2">{participant.full_name}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || preview.length === 0}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 transition-all duration-200"
              >
                {loading ? 'Cargando...' : `Cargar ${preview.length} participantes`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}