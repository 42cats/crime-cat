
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
      commands: {
        Row: {
          id: string
          name: string
          description: string
          usage: string
          category: string
          required_permissions: string[]
          content: string | null
          created_by: string
          updated_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          usage: string
          category: string
          required_permissions: string[]
          content?: string | null
          created_by: string
          updated_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          usage?: string
          category?: string
          required_permissions?: string[]
          content?: string | null
          created_by?: string
          updated_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      themes: {
        Row: {
          id: string
          title: string
          thumbnail: string
          description: string
          recommendations: number
          content: string
          tags: string[] | null
          created_by: string
          updated_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          thumbnail: string
          description: string
          recommendations?: number
          content: string
          tags?: string[] | null
          created_by: string
          updated_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          thumbnail?: string
          description?: string
          recommendations?: number
          content?: string
          tags?: string[] | null
          created_by?: string
          updated_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      message_formats: {
        Row: {
          id: string
          guild_id: string
          format_type: string
          content: string
          is_enabled: boolean
          created_by: string
          updated_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          guild_id: string
          format_type: string
          content: string
          is_enabled?: boolean
          created_by: string
          updated_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          guild_id?: string
          format_type?: string
          content?: string
          is_enabled?: boolean
          created_by?: string
          updated_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          discord_id: string
          display_name: string
          avatar: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          discord_id: string
          display_name: string
          avatar: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          discord_id?: string
          display_name?: string
          avatar?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
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
  }
}
