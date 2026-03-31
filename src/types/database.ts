export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          cancelled_by: string | null
          cancelled_reason: string | null
          created_at: string
          created_by: string | null
          doctor_id: string
          duration_mins: number
          id: string
          notes: string | null
          patient_id: string
          reason: string | null
          scheduled_at: string
          specialty: string
          status: string
          updated_at: string
          whatsapp_reminder_sent_at: string | null
        }
        Insert: {
          cancelled_by?: string | null
          cancelled_reason?: string | null
          created_at?: string
          created_by?: string | null
          doctor_id: string
          duration_mins?: number
          id?: string
          notes?: string | null
          patient_id: string
          reason?: string | null
          scheduled_at: string
          specialty: string
          status?: string
          updated_at?: string
          whatsapp_reminder_sent_at?: string | null
        }
        Update: {
          cancelled_by?: string | null
          cancelled_reason?: string | null
          created_at?: string
          created_by?: string | null
          doctor_id?: string
          duration_mins?: number
          id?: string
          notes?: string | null
          patient_id?: string
          reason?: string | null
          scheduled_at?: string
          specialty?: string
          status?: string
          updated_at?: string
          whatsapp_reminder_sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: number
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: number
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: number
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          appointment_id: string | null
          assessment: string | null
          blood_pressure: string | null
          consulted_at: string
          created_at: string
          doctor_id: string
          glucose: number | null
          heart_rate: number | null
          height_cm: number | null
          id: string
          is_draft: boolean
          objective: string | null
          patient_id: string
          plan: string | null
          reason: string | null
          specialty: string
          subjective: string | null
          temperature: number | null
          updated_at: string
          weight_kg: number | null
        }
        Insert: {
          appointment_id?: string | null
          assessment?: string | null
          blood_pressure?: string | null
          consulted_at?: string
          created_at?: string
          doctor_id: string
          glucose?: number | null
          heart_rate?: number | null
          height_cm?: number | null
          id?: string
          is_draft?: boolean
          objective?: string | null
          patient_id: string
          plan?: string | null
          reason?: string | null
          specialty: string
          subjective?: string | null
          temperature?: number | null
          updated_at?: string
          weight_kg?: number | null
        }
        Update: {
          appointment_id?: string | null
          assessment?: string | null
          blood_pressure?: string | null
          consulted_at?: string
          created_at?: string
          doctor_id?: string
          glucose?: number | null
          heart_rate?: number | null
          height_cm?: number | null
          id?: string
          is_draft?: boolean
          objective?: string | null
          patient_id?: string
          plan?: string | null
          reason?: string | null
          specialty?: string
          subjective?: string | null
          temperature?: number | null
          updated_at?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "consultations_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnoses: {
        Row: {
          consultation_id: string
          created_at: string
          icd10_code: string
          icd10_description: string
          id: string
          is_primary: boolean
          notes: string | null
          type: string | null
        }
        Insert: {
          consultation_id: string
          created_at?: string
          icd10_code: string
          icd10_description: string
          id?: string
          is_primary?: boolean
          notes?: string | null
          type?: string | null
        }
        Update: {
          consultation_id?: string
          created_at?: string
          icd10_code?: string
          icd10_description?: string
          id?: string
          is_primary?: boolean
          notes?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnoses_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_availability: {
        Row: {
          created_at: string
          day_of_week: number
          doctor_id: string
          effective_from: string | null
          effective_until: string | null
          end_time: string
          id: string
          is_active: boolean
          slot_duration: number
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          doctor_id: string
          effective_from?: string | null
          effective_until?: string | null
          end_time: string
          id?: string
          is_active?: boolean
          slot_duration?: number
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          doctor_id?: string
          effective_from?: string | null
          effective_until?: string | null
          end_time?: string
          id?: string
          is_active?: boolean
          slot_duration?: number
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_availability_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      doctor_blocks: {
        Row: {
          created_at: string
          created_by: string | null
          doctor_id: string
          ends_at: string
          id: string
          reason: string | null
          starts_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          doctor_id: string
          ends_at: string
          id?: string
          reason?: string | null
          starts_at: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          doctor_id?: string
          ends_at?: string
          id?: string
          reason?: string | null
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_blocks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "doctor_blocks_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      icd10_catalog: {
        Row: {
          category: string | null
          code: string
          description: string
          search_vector: unknown
        }
        Insert: {
          category?: string | null
          code: string
          description: string
          search_vector?: unknown
        }
        Update: {
          category?: string | null
          code?: string
          description?: string
          search_vector?: unknown
        }
        Relationships: []
      }
      medical_files: {
        Row: {
          category: string | null
          consultation_id: string | null
          created_at: string
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string
          id: string
          patient_id: string
          storage_path: string
          study_date: string | null
          uploaded_by: string
        }
        Insert: {
          category?: string | null
          consultation_id?: string | null
          created_at?: string
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type: string
          id?: string
          patient_id: string
          storage_path: string
          study_date?: string | null
          uploaded_by: string
        }
        Update: {
          category?: string | null
          consultation_id?: string | null
          created_at?: string
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string
          id?: string
          patient_id?: string
          storage_path?: string
          study_date?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_files_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_files_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      obras_sociales: {
        Row: {
          code: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      patients: {
        Row: {
          address: string | null
          allergies: string[] | null
          allergies_detail: string | null
          background_notes: string | null
          birth_date: string | null
          blood_type: string | null
          city: string | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          dni: string | null
          email: string | null
          first_name: string
          id: string
          last_name: string
          obra_social_id: string | null
          obra_social_number: string | null
          obra_social_plan: string | null
          phone: string | null
          phone_whatsapp: string | null
          search_vector: unknown
          sex: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          allergies?: string[] | null
          allergies_detail?: string | null
          background_notes?: string | null
          birth_date?: string | null
          blood_type?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          dni?: string | null
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          obra_social_id?: string | null
          obra_social_number?: string | null
          obra_social_plan?: string | null
          phone?: string | null
          phone_whatsapp?: string | null
          search_vector?: unknown
          sex?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          allergies?: string[] | null
          allergies_detail?: string | null
          background_notes?: string | null
          birth_date?: string | null
          blood_type?: string | null
          city?: string | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          dni?: string | null
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          obra_social_id?: string | null
          obra_social_number?: string | null
          obra_social_plan?: string | null
          phone?: string | null
          phone_whatsapp?: string | null
          search_vector?: unknown
          sex?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "patients_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patients_obra_social_id_fkey"
            columns: ["obra_social_id"]
            isOneToOne: false
            referencedRelation: "obras_sociales"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          role: string
          specialty: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          is_active?: boolean
          phone?: string | null
          role: string
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          role?: string
          specialty?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      treatments: {
        Row: {
          consultation_id: string
          created_at: string
          dosage: string | null
          duration: string | null
          ends_at: string | null
          frequency: string | null
          id: string
          instructions: string | null
          is_active: boolean
          name: string
          patient_id: string
          starts_at: string | null
          type: string
        }
        Insert: {
          consultation_id: string
          created_at?: string
          dosage?: string | null
          duration?: string | null
          ends_at?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          name: string
          patient_id: string
          starts_at?: string | null
          type: string
        }
        Update: {
          consultation_id?: string
          created_at?: string
          dosage?: string | null
          duration?: string | null
          ends_at?: string | null
          frequency?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean
          name?: string
          patient_id?: string
          starts_at?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatments_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversations: {
        Row: {
          closed_at: string | null
          created_at: string
          escalated_at: string | null
          escalated_reason: string | null
          id: string
          patient_id: string | null
          phone_number: string
          status: string
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          escalated_at?: string | null
          escalated_reason?: string | null
          id?: string
          patient_id?: string | null
          phone_number: string
          status?: string
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          escalated_at?: string | null
          escalated_reason?: string | null
          id?: string
          patient_id?: string | null
          phone_number?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          direction: string
          id: string
          model_used: string | null
          role: string
          tokens_used: number | null
          wa_message_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          direction: string
          id?: string
          model_used?: string | null
          role: string
          tokens_used?: number | null
          wa_message_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          direction?: string
          id?: string
          model_used?: string | null
          role?: string
          tokens_used?: number | null
          wa_message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_role: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
