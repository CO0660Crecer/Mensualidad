import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Profile {
  id: string
  email: string
  role: 'tutora' | 'admin'
  full_name: string
  created_at: string
}

export interface Participant {
  id: string
  code: string
  full_name: string
  is_active: boolean
  created_at: string
}

export interface Payment {
  id: string
  participant_id: string
  month: string
  amount: number
  payment_date: string
  receipt_number: string
  created_by: string
  created_at: string
  participant?: Participant
}

export interface PaymentStats {
  totalParticipants: number
  paidThisMonth: number
  pendingThisMonth: number
  totalCollected: number
  totalPending: number
}