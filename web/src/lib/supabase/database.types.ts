export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          operator_id: string | null;
          branch_id: string | null;
          role: string;
          full_name: string | null;
          phone: string | null;
          email: string | null;
          national_id: string | null;
          date_of_birth: string | null;
          gender: string | null;
          kra_pin: string | null;
          kyc_status: string;
          locale: string;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
      };
      products: {
        Row: {
          id: string;
          operator_id: string;
          code: string;
          slug: string;
          name: string;
          line: string;
          description: string | null;
          takaful_model: string;
          contribution_frequencies: string[];
          min_contribution: number | null;
          max_sum_covered: number | null;
          waiting_period_days: number;
          wakala_fee_rate: number | null;
          is_micro: boolean;
          is_active: boolean;
          shariah_approved: boolean;
          config: Json;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      participants: {
        Row: {
          id: string;
          operator_id: string;
          profile_id: string | null;
          full_name: string;
          phone: string;
          email: string | null;
          national_id: string | null;
          date_of_birth: string | null;
          gender: string | null;
          occupation: string | null;
          county: string | null;
          risk_score: number | null;
          lifetime_value: number;
          source_channel: string;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      agents: {
        Row: {
          id: string;
          operator_id: string;
          profile_id: string | null;
          branch_id: string | null;
          agent_code: string;
          full_name: string;
          phone: string | null;
          email: string | null;
          license_number: string | null;
          status: string;
          wallet_balance: number;
          ytd_gwp: number;
          sales_target: number;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      brokers: {
        Row: {
          id: string;
          operator_id: string;
          profile_id: string | null;
          broker_code: string;
          legal_name: string;
          license_number: string | null;
          status: string;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      quotes: {
        Row: {
          id: string;
          operator_id: string;
          quote_number: string;
          participant_id: string | null;
          agent_id: string | null;
          broker_id: string | null;
          product_id: string;
          channel: string;
          status: string;
          risk_payload: Json;
          sum_covered: number;
          base_contribution: number;
          wakala_fee: number;
          tabarru: number;
          taxes: number;
          levies: number;
          total_contribution: number;
          frequency: string;
          monthly_equivalent: number | null;
          uw_decision: string | null;
          uw_notes: string | null;
          valid_until: string | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      policies: {
        Row: {
          id: string;
          operator_id: string;
          policy_number: string;
          quote_id: string | null;
          participant_id: string;
          product_id: string;
          agent_id: string | null;
          broker_id: string | null;
          branch_id: string | null;
          status: string;
          channel: string;
          inception_date: string;
          expiry_date: string;
          sum_covered: number;
          contribution: number;
          frequency: string;
          wakala_fee: number;
          tabarru: number;
          certificate_url: string | null;
          risk_payload: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      claims: {
        Row: {
          id: string;
          operator_id: string;
          claim_number: string;
          policy_id: string;
          participant_id: string;
          status: string;
          incident_date: string;
          reported_at: string;
          description: string | null;
          incident_location: string | null;
          gps_lat: number | null;
          gps_lng: number | null;
          claimed_amount: number | null;
          approved_amount: number | null;
          fraud_score: number | null;
          assigned_assessor_id: string | null;
          sla_due_at: string | null;
          closed_at: string | null;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      payments: {
        Row: {
          id: string;
          operator_id: string;
          policy_id: string | null;
          participant_id: string | null;
          reference: string;
          method: string;
          status: string;
          amount: number;
          currency: string;
          provider_ref: string | null;
          receipt_number: string | null;
          paid_at: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      operators: {
        Row: {
          id: string;
          name: string;
          trading_name: string | null;
          license_number: string | null;
          country_code: string;
          base_currency: string;
          takaful_model: string;
          wakala_fee_rate: number;
          mudarib_share_rate: number;
          shariah_board_name: string | null;
          settings: Json;
          created_at: string;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
      branches: {
        Row: {
          id: string;
          operator_id: string;
          code: string;
          name: string;
          city: string | null;
          county: string | null;
          country_code: string;
          is_active: boolean;
        };
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_profile: {
        Args: Record<string, never>;
        Returns: Database["public"]["Tables"]["profiles"]["Row"];
      };
      is_staff: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
  };
};
