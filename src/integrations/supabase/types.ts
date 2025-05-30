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
      corrections: {
        Row: {
          applied: boolean | null
          conversation_id: string
          correction_text: string
          created_at: string
          id: string
          is_global: boolean | null
          keywords: string[] | null
          message_id: string
          topic: string | null
          user_id: string
        }
        Insert: {
          applied?: boolean | null
          conversation_id: string
          correction_text: string
          created_at?: string
          id?: string
          is_global?: boolean | null
          keywords?: string[] | null
          message_id: string
          topic?: string | null
          user_id: string
        }
        Update: {
          applied?: boolean | null
          conversation_id?: string
          correction_text?: string
          created_at?: string
          id?: string
          is_global?: boolean | null
          keywords?: string[] | null
          message_id?: string
          topic?: string | null
          user_id?: string
        }
        Relationships: []
      }
      embeddings: {
        Row: {
          embedding: string | null
          narrative_text: string | null
          uuid: string
        }
        Insert: {
          embedding?: string | null
          narrative_text?: string | null
          uuid: string
        }
        Update: {
          embedding?: string | null
          narrative_text?: string | null
          uuid?: string
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
      entities: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      market_research_reports: {
        Row: {
          competitive_landscape: Json
          consumer_analysis: string
          created_at: string
          executive_summary: string
          future_predictions: string
          id: string
          market_segmentation: Json
          market_size: Json
          recommendations: Json
          swot_analysis: Json
          topic_id: string
          trends: Json
          updated_at: string
        }
        Insert: {
          competitive_landscape: Json
          consumer_analysis: string
          created_at?: string
          executive_summary: string
          future_predictions: string
          id?: string
          market_segmentation: Json
          market_size: Json
          recommendations: Json
          swot_analysis: Json
          topic_id: string
          trends: Json
          updated_at?: string
        }
        Update: {
          competitive_landscape?: Json
          consumer_analysis?: string
          created_at?: string
          executive_summary?: string
          future_predictions?: string
          id?: string
          market_segmentation?: Json
          market_size?: Json
          recommendations?: Json
          swot_analysis?: Json
          topic_id?: string
          trends?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "market_research_reports_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "market_research_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      market_research_topics: {
        Row: {
          created_at: string
          id: string
          status: string
          topic: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          topic: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          topic?: string
          updated_at?: string
          user_id?: string | null
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
      mto_delivery: {
        Row: {
          created_at: string | null
          id: string
          lineCount: number
          month: string
          onTimePercentage: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          lineCount: number
          month: string
          onTimePercentage: number
        }
        Update: {
          created_at?: string | null
          id?: string
          lineCount?: number
          month?: string
          onTimePercentage?: number
        }
        Relationships: []
      }
      mto_incoming: {
        Row: {
          created_at: string | null
          gmMonth: number | null
          id: string
          incoming: number | null
          month: string | null
        }
        Insert: {
          created_at?: string | null
          gmMonth?: number | null
          id?: string
          incoming?: number | null
          month?: string | null
        }
        Update: {
          created_at?: string | null
          gmMonth?: number | null
          id?: string
          incoming?: number | null
          month?: string | null
        }
        Relationships: []
      }
      mto_metadata: {
        Row: {
          created_at: string | null
          id: string
          timestamp: string
        }
        Insert: {
          created_at?: string | null
          id: string
          timestamp: string
        }
        Update: {
          created_at?: string | null
          id?: string
          timestamp?: string
        }
        Relationships: []
      }
      mto_orders: {
        Row: {
          activeOp: string | null
          activeOpDesc: string | null
          created_at: string | null
          creditHold: string | null
          creditOvrd: string | null
          desc: string | null
          id: string
          jobNum: string | null
          lastLaborDate: string | null
          line: string | null
          maxOp: string | null
          maxOpDesc: string | null
          mfgComplete: string | null
          name: string | null
          openValue: string | null
          opStartDate: string | null
          order: string | null
          orderDate: string | null
          orderHeld: string | null
          orderQty: string | null
          part: string | null
          rel: string | null
          shipBy: string | null
          startDate: string | null
        }
        Insert: {
          activeOp?: string | null
          activeOpDesc?: string | null
          created_at?: string | null
          creditHold?: string | null
          creditOvrd?: string | null
          desc?: string | null
          id?: string
          jobNum?: string | null
          lastLaborDate?: string | null
          line?: string | null
          maxOp?: string | null
          maxOpDesc?: string | null
          mfgComplete?: string | null
          name?: string | null
          openValue?: string | null
          opStartDate?: string | null
          order?: string | null
          orderDate?: string | null
          orderHeld?: string | null
          orderQty?: string | null
          part?: string | null
          rel?: string | null
          shipBy?: string | null
          startDate?: string | null
        }
        Update: {
          activeOp?: string | null
          activeOpDesc?: string | null
          created_at?: string | null
          creditHold?: string | null
          creditOvrd?: string | null
          desc?: string | null
          id?: string
          jobNum?: string | null
          lastLaborDate?: string | null
          line?: string | null
          maxOp?: string | null
          maxOpDesc?: string | null
          mfgComplete?: string | null
          name?: string | null
          openValue?: string | null
          opStartDate?: string | null
          order?: string | null
          orderDate?: string | null
          orderHeld?: string | null
          orderQty?: string | null
          part?: string | null
          rel?: string | null
          shipBy?: string | null
          startDate?: string | null
        }
        Relationships: []
      }
      photos: {
        Row: {
          content_type: string
          created_at: string | null
          filename: string
          id: string
          test_result_id: string
          url: string
        }
        Insert: {
          content_type: string
          created_at?: string | null
          filename: string
          id: string
          test_result_id: string
          url: string
        }
        Update: {
          content_type?: string
          created_at?: string | null
          filename?: string
          id?: string
          test_result_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "photos_test_result_id_fkey"
            columns: ["test_result_id"]
            isOneToOne: false
            referencedRelation: "test_results"
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
      pt_entities: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pt_locations: {
        Row: {
          created_at: string | null
          description: string | null
          entity_id: string | null
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          id: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          entity_id?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pt_locations_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "pt_entities"
            referencedColumns: ["id"]
          },
        ]
      }
      pt_test_results: {
        Row: {
          attachment: string | null
          avg_pull: number | null
          comment: string | null
          created_at: string | null
          expected_max: number | null
          expected_min: number | null
          id: string
          inspector_name: string | null
          location_id: string | null
          magnet_id: string | null
          photo_path: string | null
          photo_url: string | null
          pull_test_1: number | null
          pull_test_2: number | null
          pull_test_3: number | null
          pull_test_4: number | null
          pull_test_5: number | null
          pull_test_6: number | null
          serial_number: string | null
          status: string | null
          test_date: string | null
          test_equipment: string | null
          test_type: string | null
          user_id: string | null
        }
        Insert: {
          attachment?: string | null
          avg_pull?: number | null
          comment?: string | null
          created_at?: string | null
          expected_max?: number | null
          expected_min?: number | null
          id: string
          inspector_name?: string | null
          location_id?: string | null
          magnet_id?: string | null
          photo_path?: string | null
          photo_url?: string | null
          pull_test_1?: number | null
          pull_test_2?: number | null
          pull_test_3?: number | null
          pull_test_4?: number | null
          pull_test_5?: number | null
          pull_test_6?: number | null
          serial_number?: string | null
          status?: string | null
          test_date?: string | null
          test_equipment?: string | null
          test_type?: string | null
          user_id?: string | null
        }
        Update: {
          attachment?: string | null
          avg_pull?: number | null
          comment?: string | null
          created_at?: string | null
          expected_max?: number | null
          expected_min?: number | null
          id?: string
          inspector_name?: string | null
          location_id?: string | null
          magnet_id?: string | null
          photo_path?: string | null
          photo_url?: string | null
          pull_test_1?: number | null
          pull_test_2?: number | null
          pull_test_3?: number | null
          pull_test_4?: number | null
          pull_test_5?: number | null
          pull_test_6?: number | null
          serial_number?: string | null
          status?: string | null
          test_date?: string | null
          test_equipment?: string | null
          test_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pt_test_results_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "pt_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      pulltest_entities: {
        Row: {
          address: string | null
          contact_email: string | null
          contact_person: string | null
          contact_phone: string | null
          created_at: string | null
          id: string
          name: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          contact_email?: string | null
          contact_person?: string | null
          contact_phone?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          updated_at?: string | null
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
      test_results: {
        Row: {
          attachment: string | null
          comments: string | null
          created_at: string | null
          entity_id: string | null
          equipment: string
          expected_max: string | null
          expected_min: string | null
          id: string
          inspector_name: string
          is_passed: boolean | null
          location: string | null
          photo_urls: string[] | null
          serial_number: string
          test_average: string
          test_type: string
          test_values: string[]
          updated_at: string | null
        }
        Insert: {
          attachment?: string | null
          comments?: string | null
          created_at?: string | null
          entity_id?: string | null
          equipment: string
          expected_max?: string | null
          expected_min?: string | null
          id?: string
          inspector_name: string
          is_passed?: boolean | null
          location?: string | null
          photo_urls?: string[] | null
          serial_number: string
          test_average: string
          test_type: string
          test_values: string[]
          updated_at?: string | null
        }
        Update: {
          attachment?: string | null
          comments?: string | null
          created_at?: string | null
          entity_id?: string | null
          equipment?: string
          expected_max?: string | null
          expected_min?: string | null
          id?: string
          inspector_name?: string
          is_passed?: boolean | null
          location?: string | null
          photo_urls?: string[] | null
          serial_number?: string
          test_average?: string
          test_type?: string
          test_values?: string[]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "test_results_entity_id_fkey"
            columns: ["entity_id"]
            isOneToOne: false
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: []
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
        Relationships: []
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
      user_preferences: {
        Row: {
          created_at: string | null
          enabled_functions: string[] | null
          id: string
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enabled_functions?: string[] | null
          id?: string
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          enabled_functions?: string[] | null
          id?: string
          theme?: string | null
          updated_at?: string | null
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
      backfill_training_data_embeddings: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      check_embedding_status: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_entries: number
          entries_with_embeddings: number
          entries_missing_embeddings: number
        }[]
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
