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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      appointments: {
        Row: {
          applicant_email: string
          applicant_name: string
          appointment_date: string
          appointment_time: string
          created_at: string
          funnel: string
          google_event_id: string | null
          google_meet_link: string | null
          id: string
          interviewer_email: string
          interviewer_name: string
          lead_id: string | null
          notes: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          applicant_email: string
          applicant_name: string
          appointment_date: string
          appointment_time: string
          created_at?: string
          funnel: string
          google_event_id?: string | null
          google_meet_link?: string | null
          id?: string
          interviewer_email: string
          interviewer_name: string
          lead_id?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          applicant_email?: string
          applicant_name?: string
          appointment_date?: string
          appointment_time?: string
          created_at?: string
          funnel?: string
          google_event_id?: string | null
          google_meet_link?: string | null
          id?: string
          interviewer_email?: string
          interviewer_name?: string
          lead_id?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_events: {
        Row: {
          asset_id: string
          assigned_to: string | null
          created_at: string
          created_by: string | null
          event_date: string
          event_type: string
          id: string
          new_condition: string | null
          new_quantity: number | null
          notes: string | null
          quantity_change: number
        }
        Insert: {
          asset_id: string
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          event_date?: string
          event_type: string
          id?: string
          new_condition?: string | null
          new_quantity?: number | null
          notes?: string | null
          quantity_change?: number
        }
        Update: {
          asset_id?: string
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          event_date?: string
          event_type?: string
          id?: string
          new_condition?: string | null
          new_quantity?: number | null
          notes?: string | null
          quantity_change?: number
        }
        Relationships: [
          {
            foreignKeyName: "asset_events_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          category: string
          condition: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          location: string | null
          name: string
          notes: string | null
          purchase_cost: number | null
          purchase_date: string | null
          quantity: number
          unit: string
          updated_at: string
          vendor: string | null
        }
        Insert: {
          category?: string
          condition?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          location?: string | null
          name: string
          notes?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          quantity?: number
          unit?: string
          updated_at?: string
          vendor?: string | null
        }
        Update: {
          category?: string
          condition?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          location?: string | null
          name?: string
          notes?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          quantity?: number
          unit?: string
          updated_at?: string
          vendor?: string | null
        }
        Relationships: []
      }
      data_deletion_requests: {
        Row: {
          email: string | null
          id: string
          notes: string | null
          processed_at: string | null
          processed_by: string | null
          reason: string | null
          requested_at: string
          status: string
          visitor_id: string | null
        }
        Insert: {
          email?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          requested_at?: string
          status?: string
          visitor_id?: string | null
        }
        Update: {
          email?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          processed_by?: string | null
          reason?: string | null
          requested_at?: string
          status?: string
          visitor_id?: string | null
        }
        Relationships: []
      }
      deal_stages: {
        Row: {
          color: string
          created_at: string
          display_order: number
          id: string
          is_terminal: boolean
          name: string
          win_probability: number
        }
        Insert: {
          color?: string
          created_at?: string
          display_order?: number
          id?: string
          is_terminal?: boolean
          name: string
          win_probability?: number
        }
        Update: {
          color?: string
          created_at?: string
          display_order?: number
          id?: string
          is_terminal?: boolean
          name?: string
          win_probability?: number
        }
        Relationships: []
      }
      deals: {
        Row: {
          amount: number
          closed_at: string | null
          created_at: string
          created_by: string | null
          currency: string
          expected_close_date: string | null
          funnel: string | null
          id: string
          lead_id: string | null
          notes: string | null
          owner_id: string | null
          owner_name: string | null
          stage_id: string | null
          status: Database["public"]["Enums"]["deal_status"]
          title: string
          updated_at: string
        }
        Insert: {
          amount?: number
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          expected_close_date?: string | null
          funnel?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          owner_id?: string | null
          owner_name?: string | null
          stage_id?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string
          expected_close_date?: string | null
          funnel?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          owner_id?: string | null
          owner_name?: string | null
          stage_id?: string | null
          status?: Database["public"]["Enums"]["deal_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      facebook_ad_metrics: {
        Row: {
          ad_id: string
          clicks: number
          cpc: number | null
          cpm: number | null
          created_at: string
          ctr: number | null
          date: string
          fb_reported_conversion_value: number
          fb_reported_conversions: number
          frequency: number
          id: string
          impressions: number
          raw_insights: Json | null
          reach: number
          spend: number
          synced_at: string
        }
        Insert: {
          ad_id: string
          clicks?: number
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          ctr?: number | null
          date: string
          fb_reported_conversion_value?: number
          fb_reported_conversions?: number
          frequency?: number
          id?: string
          impressions?: number
          raw_insights?: Json | null
          reach?: number
          spend?: number
          synced_at?: string
        }
        Update: {
          ad_id?: string
          clicks?: number
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          ctr?: number | null
          date?: string
          fb_reported_conversion_value?: number
          fb_reported_conversions?: number
          frequency?: number
          id?: string
          impressions?: number
          raw_insights?: Json | null
          reach?: number
          spend?: number
          synced_at?: string
        }
        Relationships: []
      }
      facebook_ads: {
        Row: {
          ad_id: string
          ad_name: string | null
          adset_id: string | null
          adset_name: string | null
          campaign_id: string | null
          campaign_name: string | null
          campaign_objective: string | null
          created_at: string
          creative_body: string | null
          creative_id: string | null
          creative_thumbnail_url: string | null
          creative_title: string | null
          effective_status: string | null
          first_seen_at: string
          last_synced_at: string
          status: string | null
          updated_at: string
        }
        Insert: {
          ad_id: string
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          campaign_objective?: string | null
          created_at?: string
          creative_body?: string | null
          creative_id?: string | null
          creative_thumbnail_url?: string | null
          creative_title?: string | null
          effective_status?: string | null
          first_seen_at?: string
          last_synced_at?: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          ad_id?: string
          ad_name?: string | null
          adset_id?: string | null
          adset_name?: string | null
          campaign_id?: string | null
          campaign_name?: string | null
          campaign_objective?: string | null
          created_at?: string
          creative_body?: string | null
          creative_id?: string | null
          creative_thumbnail_url?: string | null
          creative_title?: string | null
          effective_status?: string | null
          first_seen_at?: string
          last_synced_at?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      facebook_capi_event_mappings: {
        Row: {
          attribution_model: string
          capi_event_name: string
          created_at: string
          currency: string
          funnel: string | null
          id: string
          is_active: boolean
          lead_status: string
          updated_at: string
          value_field: string | null
        }
        Insert: {
          attribution_model?: string
          capi_event_name: string
          created_at?: string
          currency?: string
          funnel?: string | null
          id?: string
          is_active?: boolean
          lead_status: string
          updated_at?: string
          value_field?: string | null
        }
        Update: {
          attribution_model?: string
          capi_event_name?: string
          created_at?: string
          currency?: string
          funnel?: string | null
          id?: string
          is_active?: boolean
          lead_status?: string
          updated_at?: string
          value_field?: string | null
        }
        Relationships: []
      }
      facebook_capi_events: {
        Row: {
          attributed_ad_id: string | null
          attributed_campaign_id: string | null
          attribution_model: string | null
          created_at: string
          error_message: string | null
          event_id: string
          event_name: string
          event_time: string
          fb_trace_id: string | null
          id: string
          lead_id: string | null
          mapping_id: string | null
          next_retry_at: string | null
          payload_sent: Json | null
          response_body: Json | null
          response_status: number | null
          retry_count: number
          status: string
          test_event_code: string | null
          updated_at: string
        }
        Insert: {
          attributed_ad_id?: string | null
          attributed_campaign_id?: string | null
          attribution_model?: string | null
          created_at?: string
          error_message?: string | null
          event_id: string
          event_name: string
          event_time?: string
          fb_trace_id?: string | null
          id?: string
          lead_id?: string | null
          mapping_id?: string | null
          next_retry_at?: string | null
          payload_sent?: Json | null
          response_body?: Json | null
          response_status?: number | null
          retry_count?: number
          status?: string
          test_event_code?: string | null
          updated_at?: string
        }
        Update: {
          attributed_ad_id?: string | null
          attributed_campaign_id?: string | null
          attribution_model?: string | null
          created_at?: string
          error_message?: string | null
          event_id?: string
          event_name?: string
          event_time?: string
          fb_trace_id?: string | null
          id?: string
          lead_id?: string | null
          mapping_id?: string | null
          next_retry_at?: string | null
          payload_sent?: Json | null
          response_body?: Json | null
          response_status?: number | null
          retry_count?: number
          status?: string
          test_event_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facebook_capi_events_mapping_id_fkey"
            columns: ["mapping_id"]
            isOneToOne: false
            referencedRelation: "facebook_capi_event_mappings"
            referencedColumns: ["id"]
          },
        ]
      }
      facebook_settings: {
        Row: {
          ad_account_id: string | null
          capi_enabled: boolean
          daily_sync_enabled: boolean
          default_attribution_model: string
          fbclid_resolution_enabled: boolean
          id: number
          last_ads_sync_at: string | null
          last_insights_sync_at: string | null
          pixel_id: string | null
          test_event_code: string | null
          test_mode: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          ad_account_id?: string | null
          capi_enabled?: boolean
          daily_sync_enabled?: boolean
          default_attribution_model?: string
          fbclid_resolution_enabled?: boolean
          id?: number
          last_ads_sync_at?: string | null
          last_insights_sync_at?: string | null
          pixel_id?: string | null
          test_event_code?: string | null
          test_mode?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          ad_account_id?: string | null
          capi_enabled?: boolean
          daily_sync_enabled?: boolean
          default_attribution_model?: string
          fbclid_resolution_enabled?: boolean
          id?: number
          last_ads_sync_at?: string | null
          last_insights_sync_at?: string | null
          pixel_id?: string | null
          test_event_code?: string | null
          test_mode?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      fathom_webhook_log: {
        Row: {
          error_message: string | null
          event_type: string | null
          external_meeting_id: string | null
          id: string
          matched_appointment_id: string | null
          matched_lead_id: string | null
          raw_payload: Json | null
          received_at: string
          signature_valid: boolean
          status: string
        }
        Insert: {
          error_message?: string | null
          event_type?: string | null
          external_meeting_id?: string | null
          id?: string
          matched_appointment_id?: string | null
          matched_lead_id?: string | null
          raw_payload?: Json | null
          received_at?: string
          signature_valid?: boolean
          status?: string
        }
        Update: {
          error_message?: string | null
          event_type?: string | null
          external_meeting_id?: string | null
          id?: string
          matched_appointment_id?: string | null
          matched_lead_id?: string | null
          raw_payload?: Json | null
          received_at?: string
          signature_valid?: boolean
          status?: string
        }
        Relationships: []
      }
      gsuite_sync_state: {
        Row: {
          created_at: string
          gcal_last_synced_at: string | null
          gcal_sync_token: string | null
          gdrive_last_synced_at: string | null
          gdrive_page_token: string | null
          gmail_history_id: string | null
          gmail_last_synced_at: string | null
          id: string
          is_enabled: boolean
          last_error: string | null
          last_error_at: string | null
          updated_at: string
          user_email: string
        }
        Insert: {
          created_at?: string
          gcal_last_synced_at?: string | null
          gcal_sync_token?: string | null
          gdrive_last_synced_at?: string | null
          gdrive_page_token?: string | null
          gmail_history_id?: string | null
          gmail_last_synced_at?: string | null
          id?: string
          is_enabled?: boolean
          last_error?: string | null
          last_error_at?: string | null
          updated_at?: string
          user_email: string
        }
        Update: {
          created_at?: string
          gcal_last_synced_at?: string | null
          gcal_sync_token?: string | null
          gdrive_last_synced_at?: string | null
          gdrive_page_token?: string | null
          gmail_history_id?: string | null
          gmail_last_synced_at?: string | null
          id?: string
          is_enabled?: boolean
          last_error?: string | null
          last_error_at?: string | null
          updated_at?: string
          user_email?: string
        }
        Relationships: []
      }
      ip_hash_salts: {
        Row: {
          id: number
          rotated_at: string
          salt: string
        }
        Insert: {
          id?: number
          rotated_at?: string
          salt: string
        }
        Update: {
          id?: number
          rotated_at?: string
          salt?: string
        }
        Relationships: []
      }
      lead_activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          body: string | null
          created_at: string
          created_by: string | null
          created_by_name: string | null
          duration_minutes: number | null
          id: string
          lead_id: string
          metadata: Json | null
          occurred_at: string
          outcome: string | null
          subject: string | null
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["activity_type"]
          body?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          duration_minutes?: number | null
          id?: string
          lead_id: string
          metadata?: Json | null
          occurred_at?: string
          outcome?: string | null
          subject?: string | null
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["activity_type"]
          body?: string | null
          created_at?: string
          created_by?: string | null
          created_by_name?: string | null
          duration_minutes?: number | null
          id?: string
          lead_id?: string
          metadata?: Json | null
          occurred_at?: string
          outcome?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      lead_communications: {
        Row: {
          appointment_id: string | null
          body: string | null
          comm_type: string
          created_at: string
          direction: string | null
          external_id: string | null
          external_thread_id: string | null
          id: string
          lead_id: string | null
          metadata: Json | null
          occurred_at: string
          owner_email: string | null
          participants: Json | null
          raw_payload: Json | null
          snippet: string | null
          source: string
          subject: string | null
          transcript_url: string | null
          updated_at: string
          url: string | null
        }
        Insert: {
          appointment_id?: string | null
          body?: string | null
          comm_type: string
          created_at?: string
          direction?: string | null
          external_id?: string | null
          external_thread_id?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          occurred_at?: string
          owner_email?: string | null
          participants?: Json | null
          raw_payload?: Json | null
          snippet?: string | null
          source: string
          subject?: string | null
          transcript_url?: string | null
          updated_at?: string
          url?: string | null
        }
        Update: {
          appointment_id?: string | null
          body?: string | null
          comm_type?: string
          created_at?: string
          direction?: string | null
          external_id?: string | null
          external_thread_id?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          occurred_at?: string
          owner_email?: string | null
          participants?: Json | null
          raw_payload?: Json | null
          snippet?: string | null
          source?: string
          subject?: string | null
          transcript_url?: string | null
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      lead_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          lead_id: string
          metadata: Json | null
          note_type: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          lead_id: string
          metadata?: Json | null
          note_type?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          lead_id?: string
          metadata?: Json | null
          note_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_tag_assignments: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          lead_id: string
          tag_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          lead_id: string
          tag_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          lead_id?: string
          tag_id?: string
        }
        Relationships: []
      }
      lead_tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      lead_tasks: {
        Row: {
          assigned_to: string | null
          assigned_to_name: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_at: string | null
          id: string
          lead_id: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          assigned_to_name?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          assigned_to_name?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          achievements: string | null
          action: string | null
          browser: string | null
          business_type: string | null
          capi_consent: boolean | null
          city: string | null
          company: string | null
          contact_owner: string | null
          country: string | null
          created_at: string
          designation: string | null
          device_type: string | null
          email: string
          expected_annual_revenue: string | null
          fbc: string | null
          fbclid: string | null
          fbp: string | null
          first_touch_at: string | null
          first_touch_campaign: string | null
          first_touch_medium: string | null
          first_touch_source: string | null
          form_name: string | null
          form_page_path: string | null
          full_name: string
          funnel: string
          gbraid: string | null
          gclid: string | null
          id: string
          ip_hash: string | null
          landing_url: string | null
          language: string | null
          last_activity_at: string | null
          last_touch_at: string | null
          last_touch_campaign: string | null
          last_touch_medium: string | null
          last_touch_source: string | null
          lead_status: string | null
          li_fat_id: string | null
          msclkid: string | null
          nature_of_business: string | null
          next_follow_up_date: string | null
          os: string | null
          pain_point: string | null
          phone: string | null
          pixel_event_id: string | null
          qualification: string | null
          raw_data: Json | null
          referrer_domain: string | null
          referrer_url: string | null
          region: string | null
          relevancy: string | null
          remarks: string | null
          screen_resolution: string | null
          services: string[] | null
          session_id: string | null
          submitted_ip: string | null
          subsidy_reason: string | null
          time_to_submit_ms: number | null
          timezone: string | null
          ttclid: string | null
          twclid: string | null
          updated_at: string
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          viewport_size: string | null
          visa_type: string | null
          visitor_id: string | null
          wbraid: string | null
        }
        Insert: {
          achievements?: string | null
          action?: string | null
          browser?: string | null
          business_type?: string | null
          capi_consent?: boolean | null
          city?: string | null
          company?: string | null
          contact_owner?: string | null
          country?: string | null
          created_at?: string
          designation?: string | null
          device_type?: string | null
          email: string
          expected_annual_revenue?: string | null
          fbc?: string | null
          fbclid?: string | null
          fbp?: string | null
          first_touch_at?: string | null
          first_touch_campaign?: string | null
          first_touch_medium?: string | null
          first_touch_source?: string | null
          form_name?: string | null
          form_page_path?: string | null
          full_name: string
          funnel: string
          gbraid?: string | null
          gclid?: string | null
          id?: string
          ip_hash?: string | null
          landing_url?: string | null
          language?: string | null
          last_activity_at?: string | null
          last_touch_at?: string | null
          last_touch_campaign?: string | null
          last_touch_medium?: string | null
          last_touch_source?: string | null
          lead_status?: string | null
          li_fat_id?: string | null
          msclkid?: string | null
          nature_of_business?: string | null
          next_follow_up_date?: string | null
          os?: string | null
          pain_point?: string | null
          phone?: string | null
          pixel_event_id?: string | null
          qualification?: string | null
          raw_data?: Json | null
          referrer_domain?: string | null
          referrer_url?: string | null
          region?: string | null
          relevancy?: string | null
          remarks?: string | null
          screen_resolution?: string | null
          services?: string[] | null
          session_id?: string | null
          submitted_ip?: string | null
          subsidy_reason?: string | null
          time_to_submit_ms?: number | null
          timezone?: string | null
          ttclid?: string | null
          twclid?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          viewport_size?: string | null
          visa_type?: string | null
          visitor_id?: string | null
          wbraid?: string | null
        }
        Update: {
          achievements?: string | null
          action?: string | null
          browser?: string | null
          business_type?: string | null
          capi_consent?: boolean | null
          city?: string | null
          company?: string | null
          contact_owner?: string | null
          country?: string | null
          created_at?: string
          designation?: string | null
          device_type?: string | null
          email?: string
          expected_annual_revenue?: string | null
          fbc?: string | null
          fbclid?: string | null
          fbp?: string | null
          first_touch_at?: string | null
          first_touch_campaign?: string | null
          first_touch_medium?: string | null
          first_touch_source?: string | null
          form_name?: string | null
          form_page_path?: string | null
          full_name?: string
          funnel?: string
          gbraid?: string | null
          gclid?: string | null
          id?: string
          ip_hash?: string | null
          landing_url?: string | null
          language?: string | null
          last_activity_at?: string | null
          last_touch_at?: string | null
          last_touch_campaign?: string | null
          last_touch_medium?: string | null
          last_touch_source?: string | null
          lead_status?: string | null
          li_fat_id?: string | null
          msclkid?: string | null
          nature_of_business?: string | null
          next_follow_up_date?: string | null
          os?: string | null
          pain_point?: string | null
          phone?: string | null
          pixel_event_id?: string | null
          qualification?: string | null
          raw_data?: Json | null
          referrer_domain?: string | null
          referrer_url?: string | null
          region?: string | null
          relevancy?: string | null
          remarks?: string | null
          screen_resolution?: string | null
          services?: string[] | null
          session_id?: string | null
          submitted_ip?: string | null
          subsidy_reason?: string | null
          time_to_submit_ms?: number | null
          timezone?: string | null
          ttclid?: string | null
          twclid?: string | null
          updated_at?: string
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          viewport_size?: string | null
          visa_type?: string | null
          visitor_id?: string | null
          wbraid?: string | null
        }
        Relationships: []
      }
      pageviews: {
        Row: {
          created_at: string
          entered_at: string
          id: string
          is_entry: boolean
          is_exit: boolean
          left_at: string | null
          max_scroll_depth_pct: number | null
          path: string
          session_id: string
          time_on_page_ms: number | null
          title: string | null
          url: string
          visitor_id: string
        }
        Insert: {
          created_at?: string
          entered_at?: string
          id?: string
          is_entry?: boolean
          is_exit?: boolean
          left_at?: string | null
          max_scroll_depth_pct?: number | null
          path: string
          session_id: string
          time_on_page_ms?: number | null
          title?: string | null
          url: string
          visitor_id: string
        }
        Update: {
          created_at?: string
          entered_at?: string
          id?: string
          is_entry?: boolean
          is_exit?: boolean
          left_at?: string | null
          max_scroll_depth_pct?: number | null
          path?: string
          session_id?: string
          time_on_page_ms?: number | null
          title?: string | null
          url?: string
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pageviews_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pageviews_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      quick_replies: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      saved_views: {
        Row: {
          created_at: string
          entity: string
          filters: Json
          id: string
          is_default: boolean
          is_shared: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity?: string
          filters?: Json
          id?: string
          is_default?: boolean
          is_shared?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity?: string
          filters?: Json
          id?: string
          is_default?: boolean
          is_shared?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          city: string | null
          connection_type: string | null
          country: string | null
          created_at: string
          custom_params: Json | null
          ended_at: string | null
          epik: string | null
          exit_url: string | null
          fbc: string | null
          fbclid: string | null
          fbp: string | null
          gbraid: string | null
          gclid: string | null
          id: string
          irclickid: string | null
          landing_path: string | null
          landing_url: string | null
          last_activity_at: string
          li_fat_id: string | null
          msclkid: string | null
          pageview_count: number
          referrer_domain: string | null
          referrer_url: string | null
          region: string | null
          screen_resolution: string | null
          session_key: string
          started_at: string
          ttclid: string | null
          twclid: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_id: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          viewport_size: string | null
          visitor_id: string
          wbraid: string | null
        }
        Insert: {
          city?: string | null
          connection_type?: string | null
          country?: string | null
          created_at?: string
          custom_params?: Json | null
          ended_at?: string | null
          epik?: string | null
          exit_url?: string | null
          fbc?: string | null
          fbclid?: string | null
          fbp?: string | null
          gbraid?: string | null
          gclid?: string | null
          id?: string
          irclickid?: string | null
          landing_path?: string | null
          landing_url?: string | null
          last_activity_at?: string
          li_fat_id?: string | null
          msclkid?: string | null
          pageview_count?: number
          referrer_domain?: string | null
          referrer_url?: string | null
          region?: string | null
          screen_resolution?: string | null
          session_key: string
          started_at?: string
          ttclid?: string | null
          twclid?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_id?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          viewport_size?: string | null
          visitor_id: string
          wbraid?: string | null
        }
        Update: {
          city?: string | null
          connection_type?: string | null
          country?: string | null
          created_at?: string
          custom_params?: Json | null
          ended_at?: string | null
          epik?: string | null
          exit_url?: string | null
          fbc?: string | null
          fbclid?: string | null
          fbp?: string | null
          gbraid?: string | null
          gclid?: string | null
          id?: string
          irclickid?: string | null
          landing_path?: string | null
          landing_url?: string | null
          last_activity_at?: string
          li_fat_id?: string | null
          msclkid?: string | null
          pageview_count?: number
          referrer_domain?: string | null
          referrer_url?: string | null
          region?: string | null
          screen_resolution?: string | null
          session_key?: string
          started_at?: string
          ttclid?: string | null
          twclid?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_id?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          viewport_size?: string | null
          visitor_id?: string
          wbraid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      square_payments: {
        Row: {
          amount_cents: number
          buyer_email: string | null
          buyer_name: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          raw_response: Json | null
          receipt_url: string | null
          square_payment_id: string
          status: string
        }
        Insert: {
          amount_cents: number
          buyer_email?: string | null
          buyer_name?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          raw_response?: Json | null
          receipt_url?: string | null
          square_payment_id: string
          status: string
        }
        Update: {
          amount_cents?: number
          buyer_email?: string | null
          buyer_name?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          raw_response?: Json | null
          receipt_url?: string | null
          square_payment_id?: string
          status?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      touchpoints: {
        Row: {
          campaign: string | null
          click_id_type: string | null
          click_id_value: string | null
          content: string | null
          created_at: string
          fb_ad_id: string | null
          fb_adset_id: string | null
          fb_campaign_id: string | null
          fb_resolution_status: string | null
          fb_resolved_at: string | null
          id: string
          landing_path: string | null
          medium: string | null
          occurred_at: string
          referrer_domain: string | null
          session_id: string
          source: string | null
          term: string | null
          visitor_id: string
        }
        Insert: {
          campaign?: string | null
          click_id_type?: string | null
          click_id_value?: string | null
          content?: string | null
          created_at?: string
          fb_ad_id?: string | null
          fb_adset_id?: string | null
          fb_campaign_id?: string | null
          fb_resolution_status?: string | null
          fb_resolved_at?: string | null
          id?: string
          landing_path?: string | null
          medium?: string | null
          occurred_at?: string
          referrer_domain?: string | null
          session_id: string
          source?: string | null
          term?: string | null
          visitor_id: string
        }
        Update: {
          campaign?: string | null
          click_id_type?: string | null
          click_id_value?: string | null
          content?: string | null
          created_at?: string
          fb_ad_id?: string | null
          fb_adset_id?: string | null
          fb_campaign_id?: string | null
          fb_resolution_status?: string | null
          fb_resolved_at?: string | null
          id?: string
          landing_path?: string | null
          medium?: string | null
          occurred_at?: string
          referrer_domain?: string | null
          session_id?: string
          source?: string | null
          term?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "touchpoints_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "touchpoints_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "visitors"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      visitors: {
        Row: {
          browser: string | null
          browser_version: string | null
          city: string | null
          consent_at: string | null
          consent_given: boolean | null
          consent_jurisdiction: string | null
          country: string | null
          created_at: string
          device_type: string | null
          first_seen_at: string
          id: string
          ip_hash: string | null
          language: string | null
          last_seen_at: string
          os: string | null
          os_version: string | null
          region: string | null
          timezone: string | null
          total_pageviews: number
          total_sessions: number
          updated_at: string
          user_agent_raw: string | null
          visitor_id: string
        }
        Insert: {
          browser?: string | null
          browser_version?: string | null
          city?: string | null
          consent_at?: string | null
          consent_given?: boolean | null
          consent_jurisdiction?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          first_seen_at?: string
          id?: string
          ip_hash?: string | null
          language?: string | null
          last_seen_at?: string
          os?: string | null
          os_version?: string | null
          region?: string | null
          timezone?: string | null
          total_pageviews?: number
          total_sessions?: number
          updated_at?: string
          user_agent_raw?: string | null
          visitor_id: string
        }
        Update: {
          browser?: string | null
          browser_version?: string | null
          city?: string | null
          consent_at?: string | null
          consent_given?: boolean | null
          consent_jurisdiction?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          first_seen_at?: string
          id?: string
          ip_hash?: string | null
          language?: string | null
          last_seen_at?: string
          os?: string | null
          os_version?: string | null
          region?: string | null
          timezone?: string | null
          total_pageviews?: number
          total_sessions?: number
          updated_at?: string
          user_agent_raw?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      whatsapp_calls: {
        Row: {
          call_id: string | null
          conversation_id: string | null
          created_at: string
          direction: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          initiated_by: string | null
          metadata: Json | null
          status: string
          wa_id: string | null
        }
        Insert: {
          call_id?: string | null
          conversation_id?: string | null
          created_at?: string
          direction?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          initiated_by?: string | null
          metadata?: Json | null
          status?: string
          wa_id?: string | null
        }
        Update: {
          call_id?: string | null
          conversation_id?: string | null
          created_at?: string
          direction?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          initiated_by?: string | null
          metadata?: Json | null
          status?: string
          wa_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_calls_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversations: {
        Row: {
          assigned_to: string | null
          contact_name: string | null
          contact_phone: string
          created_at: string
          id: string
          is_archived: boolean | null
          labels: string[] | null
          last_message: string | null
          last_message_at: string | null
          last_sender_direction: string | null
          lead_id: string | null
          unread_count: number | null
          updated_at: string
          wa_id: string
        }
        Insert: {
          assigned_to?: string | null
          contact_name?: string | null
          contact_phone: string
          created_at?: string
          id?: string
          is_archived?: boolean | null
          labels?: string[] | null
          last_message?: string | null
          last_message_at?: string | null
          last_sender_direction?: string | null
          lead_id?: string | null
          unread_count?: number | null
          updated_at?: string
          wa_id: string
        }
        Update: {
          assigned_to?: string | null
          contact_name?: string | null
          contact_phone?: string
          created_at?: string
          id?: string
          is_archived?: boolean | null
          labels?: string[] | null
          last_message?: string | null
          last_message_at?: string | null
          last_sender_direction?: string | null
          lead_id?: string | null
          unread_count?: number | null
          updated_at?: string
          wa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          direction: string
          id: string
          is_starred: boolean | null
          media_url: string | null
          message_type: string
          metadata: Json | null
          status: string | null
          wa_message_id: string | null
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          direction: string
          id?: string
          is_starred?: boolean | null
          media_url?: string | null
          message_type?: string
          metadata?: Json | null
          status?: string | null
          wa_message_id?: string | null
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          direction?: string
          id?: string
          is_starred?: boolean | null
          media_url?: string | null
          message_type?: string
          metadata?: Json | null
          status?: string | null
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
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      tracking_daily_cleanup: { Args: never; Returns: undefined }
    }
    Enums: {
      activity_type:
        | "call"
        | "meeting"
        | "email"
        | "note"
        | "whatsapp"
        | "sms"
        | "other"
      app_role: "admin" | "moderator" | "user" | "csr"
      deal_status: "open" | "won" | "lost"
      task_priority: "low" | "normal" | "high" | "urgent"
      task_status: "open" | "in_progress" | "completed" | "cancelled"
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
    Enums: {
      activity_type: [
        "call",
        "meeting",
        "email",
        "note",
        "whatsapp",
        "sms",
        "other",
      ],
      app_role: ["admin", "moderator", "user", "csr"],
      deal_status: ["open", "won", "lost"],
      task_priority: ["low", "normal", "high", "urgent"],
      task_status: ["open", "in_progress", "completed", "cancelled"],
    },
  },
} as const
