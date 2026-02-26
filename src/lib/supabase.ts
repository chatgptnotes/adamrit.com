import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export interface Patient {
  id: number
  legacy_id: string
  patient_id: string
  full_name: string
  last_name: string
  sex: string
  dob: string
  blood_group: string
  mobile_phone: string
  email: string
  address: string
  city: string
  state: string
  zip_code: string
  admission_type: 'IPD' | 'OPD'
  emergency_contact: string
  is_emergency: boolean
  created_at: string
}

export interface WardPatient {
  id: number
  legacy_id: string
  legacy_patient_id: string
  ward_id: string
  room_id: string
  bed_id: string
  in_date: string
  out_date?: string
  is_discharge: boolean
  created_by: string
  created_at: string
}

export interface Appointment {
  id: number
  legacy_id: string
  legacy_patient_id: string
  doctor_id: string
  appointment_date: string
  status: string
  notes: string
  created_at: string
}

export interface Billing {
  id: number
  legacy_id: string
  legacy_patient_id: string
  amount: number
  payment_status: string
  billing_date: string
  description: string
  created_at: string
}

export interface DischargeSummary {
  id: number
  legacy_id: string
  legacy_patient_id: string
  discharge_date: string
  discharge_type: string
  created_at: string
}

export interface Ward {
  id: number
  legacy_id: string
  name: string
  location_id: string
  created_at: string
}

export interface Room {
  id: number
  legacy_id: string
  legacy_ward_id: string
  room_number: string
  created_at: string
}