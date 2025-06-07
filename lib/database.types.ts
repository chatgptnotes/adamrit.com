export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      complications: {
        Row: {
          id: string
          name: string
          description: string
          risk_level: 'Low' | 'Moderate' | 'High'
          foreign_key: string
          lab1_id: string
          lab2_id: string
          rad1_id: string
          rad2_id: string
          med1_id: string
          med2_id: string
          med3_id: string
          med4_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          risk_level: 'Low' | 'Moderate' | 'High'
          foreign_key: string
          lab1_id: string
          lab2_id: string
          rad1_id: string
          rad2_id: string
          med1_id: string
          med2_id: string
          med3_id: string
          med4_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          risk_level?: 'Low' | 'Moderate' | 'High'
          foreign_key?: string
          lab1_id?: string
          lab2_id?: string
          rad1_id?: string
          rad2_id?: string
          med1_id?: string
          med2_id?: string
          med3_id?: string
          med4_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      lab: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      radiology: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      medications: {
        Row: {
          id: string
          name: string
          dosage: string
          route: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          dosage: string
          route: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          dosage?: string
          route?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 