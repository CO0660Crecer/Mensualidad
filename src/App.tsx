import React, { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { AuthForm } from './components/Auth/AuthForm'
import { Navbar } from './components/Layout/Navbar'
import { Sidebar } from './components/Layout/Sidebar'
import { Dashboard } from './components/Dashboard/Dashboard'
import { ParticipantList } from './components/Participants/ParticipantList'
import { ParticipantForm } from './components/Participants/ParticipantForm'
import { BulkUploadForm } from './components/Participants/BulkUploadForm'
import { PaymentList } from './components/Payments/PaymentList'
import { PaymentForm } from './components/Payments/PaymentForm'
import { Reports } from './components/Reports/Reports'
import { Management } from './components/Management/Management'
import { Consolidado } from './components/Consolidado/Consolidado'
import { Participant, Payment } from './lib/supabase'

function App() {
  const { user, profile, loading } = useAuth()
  const [activeView, setActiveView] = useState('dashboard')
  const [editingParticipant, setEditingParticipant] = useState<Participant | null>(null)
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null)
  const [preselectedParticipant, setPreselectedParticipant] = useState<Participant | null>(null)
  const [showParticipantForm, setShowParticipantForm] = useState(false)
  const [showBulkUploadForm, setShowBulkUploadForm] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)

  // Debug logs
  console.log('App render - loading:', loading, 'user:', user, 'profile:', profile)

  const handleEditParticipant = (participant?: Participant) => {
    setEditingParticipant(participant || ({} as Participant))
    setShowParticipantForm(true)
  }

  const handleBulkUpload = () => {
    setShowBulkUploadForm(true)
  }

  const handleEditPayment = (payment?: Payment) => {
    if (payment) {
      setEditingPayment(payment)
      setPreselectedParticipant(null)
    } else {
      setEditingPayment(null)
      setPreselectedParticipant(null)
    }
    setShowPaymentForm(true)
  }

  const handleRegisterPaymentForParticipant = (participant: Participant) => {
    setEditingPayment(null)
    setPreselectedParticipant(participant)
    setShowPaymentForm(true)
  }

  const handleCloseParticipantForm = () => {
    setShowParticipantForm(false)
    setEditingParticipant(null)
  }

  const handleCloseBulkUploadForm = () => {
    setShowBulkUploadForm(false)
  }

  const handleClosePaymentForm = () => {
    setShowPaymentForm(false)
    setEditingPayment(null)
    setPreselectedParticipant(null)
  }

  const handleSaveParticipant = () => {
    // Refresh participant list
    setActiveView('participants')
    window.location.reload() // Force refresh to show updated data
  }

  const handleSavePayment = () => {
    // Refresh payment list
    setActiveView('payments')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user || !profile) {
    return <AuthForm />
  }

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard />
      case 'participants':
        return <ParticipantList onEditParticipant={handleEditParticipant} onBulkUpload={handleBulkUpload} />
      case 'payments':
        return <PaymentList onEditPayment={handleEditPayment} />
      case 'consolidado':
        return <Consolidado onRegisterPayment={handleRegisterPaymentForParticipant} />
      case 'reports':
        return <Reports />
      case 'management':
        return <Management />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex">
        <Sidebar activeView={activeView} onViewChange={setActiveView} />
        <main className="flex-1">
          {renderContent()}
        </main>
      </div>

      {showParticipantForm && (
        <ParticipantForm
          participant={editingParticipant}
          onClose={handleCloseParticipantForm}
          onSave={handleSaveParticipant}
        />
      )}

      {showBulkUploadForm && (
        <BulkUploadForm
          onClose={handleCloseBulkUploadForm}
          onSave={handleSaveParticipant}
        />
      )}

      {showPaymentForm && (
        <PaymentForm
          payment={editingPayment}
          preselectedParticipant={preselectedParticipant}
          onClose={handleClosePaymentForm}
          onSave={handleSavePayment}
        />
      )}
    </div>
  )
}

export default App