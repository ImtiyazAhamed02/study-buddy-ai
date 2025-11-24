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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ingests: {
        Row: {
          content: string
          created_at: string
          domain: string
          id: string
          source_type: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          domain: string
          id?: string
          source_type: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          domain?: string
          id?: string
          source_type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          average_score: number | null
          created_at: string
          email: string
          id: string
          total_quizzes_taken: number | null
        }
        Insert: {
          average_score?: number | null
          created_at?: string
          email: string
          id: string
          total_quizzes_taken?: number | null
        }
        Update: {
          average_score?: number | null
          created_at?: string
          email?: string
          id?: string
          total_quizzes_taken?: number | null
        }
        Relationships: []
      }
      question_packs: {
        Row: {
          created_at: string
          id: string
          ingest_id: string
          mode: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ingest_id: string
          mode: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ingest_id?: string
          mode?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_packs_ingest_id_fkey"
            columns: ["ingest_id"]
            isOneToOne: false
            referencedRelation: "ingests"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          answer: string
          created_at: string
          difficulty: string
          id: string
          options: Json | null
          pack_id: string
          prompt: string
          question_type: string
          rationale: string
          supporting_span: string
        }
        Insert: {
          answer: string
          created_at?: string
          difficulty: string
          id?: string
          options?: Json | null
          pack_id: string
          prompt: string
          question_type: string
          rationale: string
          supporting_span: string
        }
        Update: {
          answer?: string
          created_at?: string
          difficulty?: string
          id?: string
          options?: Json | null
          pack_id?: string
          prompt?: string
          question_type?: string
          rationale?: string
          supporting_span?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "question_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_responses: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean
          question_id: string
          quiz_id: string
          time_taken: number
          user_answer: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct: boolean
          question_id: string
          quiz_id: string
          time_taken: number
          user_answer?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          quiz_id?: string
          time_taken?: number
          user_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_responses_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_responses_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          finished_at: string | null
          id: string
          pack_id: string
          started_at: string
          total_score: number | null
          user_id: string
          weak_spots: Json | null
        }
        Insert: {
          finished_at?: string | null
          id?: string
          pack_id: string
          started_at?: string
          total_score?: number | null
          user_id: string
          weak_spots?: Json | null
        }
        Update: {
          finished_at?: string | null
          id?: string
          pack_id?: string
          started_at?: string
          total_score?: number | null
          user_id?: string
          weak_spots?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "quizzes_pack_id_fkey"
            columns: ["pack_id"]
            isOneToOne: false
            referencedRelation: "question_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      summaries: {
        Row: {
          created_at: string
          highlights: Json | null
          id: string
          ingest_id: string
          mode: string
          summary_text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          highlights?: Json | null
          id?: string
          ingest_id: string
          mode: string
          summary_text: string
          user_id: string
        }
        Update: {
          created_at?: string
          highlights?: Json | null
          id?: string
          ingest_id?: string
          mode?: string
          summary_text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "summaries_ingest_id_fkey"
            columns: ["ingest_id"]
            isOneToOne: false
            referencedRelation: "ingests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
