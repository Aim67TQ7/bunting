export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      applications: {
        Row: {
          auth_passcode: string | null
          auth_type: string | null
          category: string | null
          coming_soon: boolean | null
          created_at: string | null
          description: string | null
          icon_path: string | null
          id: string
          iframe_height: string | null
          is_active: boolean | null
          is_new: boolean | null
          license: string | null
          name: string
          requires_auth: boolean | null
          updated_at: string | null
          url: string | null
          use_count: number | null
          view_count: number | null
        }
        Insert: {
          auth_passcode?: string | null
          auth_type?: string | null
          category?: string | null
          coming_soon?: boolean | null
          created_at?: string | null
          description?: string | null
          icon_path?: string | null
          id?: string
          iframe_height?: string | null
          is_active?: boolean | null
          is_new?: boolean | null
          license?: string | null
          name: string
          requires_auth?: boolean | null
          updated_at?: string | null
          url?: string | null
          use_count?: number | null
          view_count?: number | null
        }
        Update: {
          auth_passcode?: string | null
          auth_type?: string | null
          category?: string | null
          coming_soon?: boolean | null
          created_at?: string | null
          description?: string | null
          icon_path?: string | null
          id?: string
          iframe_height?: string | null
          is_active?: boolean | null
          is_new?: boolean | null
          license?: string | null
          name?: string
          requires_auth?: boolean | null
          updated_at?: string | null
          url?: string | null
          use_count?: number | null
          view_count?: number | null
        }
        Relationships: []
      }
      approved_knowledge_managers: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          department: string | null
          id: string
          is_active: boolean | null
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          department?: string | null
          id?: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          department?: string | null
          id?: string
          is_active?: boolean | null
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      baq_registry: {
        Row: {
          baq_name: string
          command: string
          description: string | null
          id: string
          last_refreshed_at: string | null
          refresh_enabled: boolean | null
        }
        Insert: {
          baq_name: string
          command: string
          description?: string | null
          id?: string
          last_refreshed_at?: string | null
          refresh_enabled?: boolean | null
        }
        Update: {
          baq_name?: string
          command?: string
          description?: string | null
          id?: string
          last_refreshed_at?: string | null
          refresh_enabled?: boolean | null
        }
        Relationships: []
      }
      baq_stoplight: {
        Row: {
          Asm: number | null
          Department: string | null
          Description: string | null
          "Due Date": string | null
          EstProdHours: number | null
          Job: string | null
          JobNum: string | null
          Name: string | null
          Opr: number | null
          Part: string | null
          "Prod. Qty": number | null
          "Start Date": string | null
          uuid: string
        }
        Insert: {
          Asm?: number | null
          Department?: string | null
          Description?: string | null
          "Due Date"?: string | null
          EstProdHours?: number | null
          Job?: string | null
          JobNum?: string | null
          Name?: string | null
          Opr?: number | null
          Part?: string | null
          "Prod. Qty"?: number | null
          "Start Date"?: string | null
          uuid?: string
        }
        Update: {
          Asm?: number | null
          Department?: string | null
          Description?: string | null
          "Due Date"?: string | null
          EstProdHours?: number | null
          Job?: string | null
          JobNum?: string | null
          Name?: string | null
          Opr?: number | null
          Part?: string | null
          "Prod. Qty"?: number | null
          "Start Date"?: string | null
          uuid?: string
        }
        Relationships: []
      }
      bridgers: {
        Row: {
          created_at: string
          creator: string
          description: string | null
          id: string
          name: string
          url: string
        }
        Insert: {
          created_at?: string
          creator: string
          description?: string | null
          id?: string
          name: string
          url: string
        }
        Update: {
          created_at?: string
          creator?: string
          description?: string | null
          id?: string
          name?: string
          url?: string
        }
        Relationships: []
      }
      calculators: {
        Row: {
          created_at: string | null
          description: string
          icon_path: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          url: string
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          icon_path?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          url: string
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          icon_path?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          url?: string
          video_url?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          content: Json | null
          created_at: string | null
          id: string
          last_message_at: string | null
          topic: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content?: Json | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          topic: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: Json | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          topic?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          contact_info: string | null
          country: string | null
          customer_name: string
          customer_number: number | null
          embedding: string | null
          Epicor_Primary: string
          facility_type: string | null
          lat: string | null
          lng: string | null
          narrative_text: string | null
          prodcode: string | null
          sales_2022: string | null
          sales_2023: string | null
          sales_2024: string | null
          sales_rep: string | null
          state: string | null
          territory: string | null
          total_sales: number | null
          uuid: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_info?: string | null
          country?: string | null
          customer_name: string
          customer_number?: number | null
          embedding?: string | null
          Epicor_Primary: string
          facility_type?: string | null
          lat?: string | null
          lng?: string | null
          narrative_text?: string | null
          prodcode?: string | null
          sales_2022?: string | null
          sales_2023?: string | null
          sales_2024?: string | null
          sales_rep?: string | null
          state?: string | null
          territory?: string | null
          total_sales?: number | null
          uuid: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_info?: string | null
          country?: string | null
          customer_name?: string
          customer_number?: number | null
          embedding?: string | null
          Epicor_Primary?: string
          facility_type?: string | null
          lat?: string | null
          lng?: string | null
          narrative_text?: string | null
          prodcode?: string | null
          sales_2022?: string | null
          sales_2023?: string | null
          sales_2024?: string | null
          sales_rep?: string | null
          state?: string | null
          territory?: string | null
          total_sales?: number | null
          uuid?: string
          zip?: string | null
        }
        Relationships: []
      }
      Employee_id: {
        Row: {
          accountEnabled: boolean | null
          ageGroup: string | null
          alternateEmailAddress: string | null
          city: string | null
          companyName: string | null
          consentProvidedForMinor: string | null
          country: string | null
          createdDateTime: string | null
          creationType: string | null
          department: string | null
          directorySynced: string | null
          displayName: string | null
          employee_id: string
          givenName: string | null
          identityIssuer: string | null
          invitationState: string | null
          jobTitle: string | null
          legalAgeGroupClassification: string | null
          mobilePhone: string | null
          officeLocation: string | null
          postalCode: string | null
          state: string | null
          streetAddress: string | null
          surname: string | null
          telephoneNumber: string | null
          usageLocation: string | null
          user_id: string | null
          userPrincipalName: string
          userType: string | null
        }
        Insert: {
          accountEnabled?: boolean | null
          ageGroup?: string | null
          alternateEmailAddress?: string | null
          city?: string | null
          companyName?: string | null
          consentProvidedForMinor?: string | null
          country?: string | null
          createdDateTime?: string | null
          creationType?: string | null
          department?: string | null
          directorySynced?: string | null
          displayName?: string | null
          employee_id?: string
          givenName?: string | null
          identityIssuer?: string | null
          invitationState?: string | null
          jobTitle?: string | null
          legalAgeGroupClassification?: string | null
          mobilePhone?: string | null
          officeLocation?: string | null
          postalCode?: string | null
          state?: string | null
          streetAddress?: string | null
          surname?: string | null
          telephoneNumber?: string | null
          usageLocation?: string | null
          user_id?: string | null
          userPrincipalName: string
          userType?: string | null
        }
        Update: {
          accountEnabled?: boolean | null
          ageGroup?: string | null
          alternateEmailAddress?: string | null
          city?: string | null
          companyName?: string | null
          consentProvidedForMinor?: string | null
          country?: string | null
          createdDateTime?: string | null
          creationType?: string | null
          department?: string | null
          directorySynced?: string | null
          displayName?: string | null
          employee_id?: string
          givenName?: string | null
          identityIssuer?: string | null
          invitationState?: string | null
          jobTitle?: string | null
          legalAgeGroupClassification?: string | null
          mobilePhone?: string | null
          officeLocation?: string | null
          postalCode?: string | null
          state?: string | null
          streetAddress?: string | null
          surname?: string | null
          telephoneNumber?: string | null
          usageLocation?: string | null
          user_id?: string | null
          userPrincipalName?: string
          userType?: string | null
        }
        Relationships: []
      }
      match_feedback: {
        Row: {
          created_at: string | null
          document_id: string | null
          feedback_type: string | null
          id: string
          match_context: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          document_id?: string | null
          feedback_type?: string | null
          id?: string
          match_context?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string | null
          feedback_type?: string | null
          id?: string
          match_context?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_feedback_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "training_data"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_recordings: {
        Row: {
          audio_url: string | null
          created_at: string | null
          duration_seconds: number | null
          id: string
          is_processed: boolean | null
          title: string | null
          token: string | null
          updated_at: string | null
        }
        Insert: {
          audio_url?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          is_processed?: boolean | null
          title?: string | null
          token?: string | null
          updated_at?: string | null
        }
        Update: {
          audio_url?: string | null
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          is_processed?: boolean | null
          title?: string | null
          token?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      meeting_summaries: {
        Row: {
          created_at: string | null
          id: string
          key_points: Json | null
          recording_id: string | null
          summary: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key_points?: Json | null
          recording_id?: string | null
          summary: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key_points?: Json | null
          recording_id?: string | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_summaries_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "meeting_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          description: string
          due_date: string | null
          id: string
          is_completed: boolean | null
          recording_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          description: string
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          recording_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          description?: string
          due_date?: string | null
          id?: string
          is_completed?: boolean | null
          recording_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_tasks_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "meeting_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          call_name: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          call_name?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          call_name?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          coming_soon: boolean | null
          created_at: string | null
          description: string
          icon_path: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          url: string
          video_url: string | null
        }
        Insert: {
          coming_soon?: boolean | null
          created_at?: string | null
          description: string
          icon_path?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          url: string
          video_url?: string | null
        }
        Update: {
          coming_soon?: boolean | null
          created_at?: string | null
          description?: string
          icon_path?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          url?: string
          video_url?: string | null
        }
        Relationships: []
      }
      sales_tools: {
        Row: {
          coming_soon: boolean | null
          created_at: string | null
          description: string
          icon_path: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          url: string
          video_url: string | null
        }
        Insert: {
          coming_soon?: boolean | null
          created_at?: string | null
          description: string
          icon_path?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          url: string
          video_url?: string | null
        }
        Update: {
          coming_soon?: boolean | null
          created_at?: string | null
          description?: string
          icon_path?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          url?: string
          video_url?: string | null
        }
        Relationships: []
      }
      training_data: {
        Row: {
          content: Json
          created_at: string
          document_type: Database["public"]["Enums"]["document_type"]
          embedding: string | null
          exact_match_fields: string[] | null
          id: string
          scope: Database["public"]["Enums"]["training_data_scope"]
          updated_at: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          document_type: Database["public"]["Enums"]["document_type"]
          embedding?: string | null
          exact_match_fields?: string[] | null
          id?: string
          scope?: Database["public"]["Enums"]["training_data_scope"]
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          embedding?: string | null
          exact_match_fields?: string[] | null
          id?: string
          scope?: Database["public"]["Enums"]["training_data_scope"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_data_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transcriptions: {
        Row: {
          confidence: number | null
          created_at: string | null
          id: string
          recording_id: string | null
          text: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          recording_id?: string | null
          text: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          recording_id?: string | null
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "transcriptions_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "meeting_recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_conversations_embeddings: {
        Row: {
          conversation_id: string
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          parent_conversation_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          parent_conversation_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          parent_conversation_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_conversations_embeddings_parent_conversation_id_fkey"
            columns: ["parent_conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          agent_id: string
          bridger_id: string | null
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          agent_id: string
          bridger_id?: string | null
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          bridger_id?: string | null
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_bridger_id_fkey"
            columns: ["bridger_id"]
            isOneToOne: false
            referencedRelation: "bridgers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feedback: {
        Row: {
          content: string
          created_at: string
          feedback_type: string
          id: string
          is_anonymous: boolean
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          feedback_type?: string
          id?: string
          is_anonymous?: boolean
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          feedback_type?: string
          id?: string
          is_anonymous?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_feedback_user_id_fkey1"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string
          id: string
          is_read: boolean
          message_type: string
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          message_type?: string
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      user_starred_agents: {
        Row: {
          agent_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_training_submissions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          content: Json
          document_type: string
          embedding: string | null
          id: string
          status: string
          submitted_at: string
          user_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          content: Json
          document_type: string
          embedding?: string | null
          id?: string
          status?: string
          submitted_at?: string
          user_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          content?: Json
          document_type?: string
          embedding?: string | null
          id?: string
          status?: string
          submitted_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      user_unread_messages: {
        Row: {
          recipient_id: string | null
          unread_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      clean_old_weather_entries: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_available_employees: {
        Args: Record<PropertyKey, never>
        Returns: {
          employee_id: string
          displayname: string
          userprincipalname: string
        }[]
      }
      get_employee_by_user_id: {
        Args: { user_id_param: string }
        Returns: {
          employee_id: string
          user_id: string
          displayname: string
          userprincipalname: string
          department: string
          jobtitle: string
          officelocation: string
          city: string
          state: string
          country: string
        }[]
      }
      get_or_create_conversation_id: {
        Args: { user1_id: string; user2_id: string }
        Returns: string
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      log_application_usage: {
        Args:
          | { app_id: string; action: string }
          | { app_id: string; action: string; session_id?: string }
        Returns: undefined
      }
      match_documents: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
        }
        Returns: {
          id: string
          content: Json
          similarity: number
        }[]
      }
      match_documents_with_scope: {
        Args: {
          query_embedding: string
          match_threshold: number
          match_count: number
          user_id: string
          include_user_scope: boolean
        }
        Returns: {
          id: string
          content: Json
          scope: string
          user_id: string
          document_type: string
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      update_employee_data: {
        Args: {
          user_id_param: string
          department_param: string
          jobtitle_param: string
          officelocation_param: string
          city_param: string
          state_param: string
          country_param: string
        }
        Returns: undefined
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      document_type: "contact" | "company" | "sales" | "purchase_order"
      function_type:
        | "magnetism_calculator"
        | "five_why"
        | "equipment_selection"
        | "sales_map"
        | "stock_calculator"
        | "qr_generator"
        | "prospect_finder"
        | "bath_rail_designer"
        | "md_flow_calculator"
        | "five_s"
        | "fmea"
      scroll_pattern_type: "continuous" | "fade" | "slide"
      training_data_scope: "user" | "global"
      vote_type: "up" | "down"
    }
    CompositeTypes: {
      metadata_type: {
        title: string | null
        description: string | null
        source: string | null
        timestamp: string | null
      }
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      document_type: ["contact", "company", "sales", "purchase_order"],
      function_type: [
        "magnetism_calculator",
        "five_why",
        "equipment_selection",
        "sales_map",
        "stock_calculator",
        "qr_generator",
        "prospect_finder",
        "bath_rail_designer",
        "md_flow_calculator",
        "five_s",
        "fmea",
      ],
      scroll_pattern_type: ["continuous", "fade", "slide"],
      training_data_scope: ["user", "global"],
      vote_type: ["up", "down"],
    },
  },
} as const
