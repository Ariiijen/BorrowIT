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
      profiles: {
        Relationships: []
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'Borrower' | 'Lender' | 'Faculty' | 'Admin'
          student_number: string | null
          employee_number: string | null
          is_restricted: boolean
          restriction_until: string | null
          late_return_count: number
          contact_number: string | null
          extension_requested_until: string | null
          is_activated: boolean
          activation_status: 'Pending' | 'Approved' | 'Rejected'
          activated_at: string | null
          activated_by: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          email: string
          full_name?: string | null
          role?: 'Borrower' | 'Lender' | 'Faculty' | 'Admin'
          student_number?: string | null
          employee_number?: string | null
          is_restricted?: boolean
          restriction_until?: string | null
          late_return_count?: number
          contact_number?: string | null
          extension_requested_until?: string | null
          is_activated?: boolean
          activation_status?: 'Pending' | 'Approved' | 'Rejected'
          activated_at?: string | null
          activated_by?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'Borrower' | 'Lender' | 'Faculty' | 'Admin'
          student_number?: string | null
          employee_number?: string | null
          is_restricted?: boolean
          restriction_until?: string | null
          late_return_count?: number
          contact_number?: string | null
          extension_requested_until?: string | null
          is_activated?: boolean
          activation_status?: 'Pending' | 'Approved' | 'Rejected'
          activated_at?: string | null
          activated_by?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string | null
        }
      }
      equipment: {
        Relationships: []
        Row: {
          id: string
          name: string
          description: string | null
          category: string
          image_url: string | null
          condition: 'New' | 'Good' | 'Fair' | 'Damaged'
          status: 'Available' | 'Pending' | 'Borrowed' | 'Unavailable'
          total_stock: number
          available_stock: number
          terms: string | null
          usage_instructions: string | null
          review_status: 'Pending' | 'Approved' | 'Rejected'
          reviewed_at: string | null
          reviewed_by: string | null
          rejection_reason: string | null
          owner_type: 'Student' | 'School'
          owner_id: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: string
          image_url?: string | null
          condition?: 'New' | 'Good' | 'Fair' | 'Damaged'
          status?: 'Available' | 'Pending' | 'Borrowed' | 'Unavailable'
          total_stock?: number
          available_stock?: number
          terms?: string | null
          usage_instructions?: string | null
          review_status?: 'Pending' | 'Approved' | 'Rejected'
          reviewed_at?: string | null
          reviewed_by?: string | null
          rejection_reason?: string | null
          owner_type?: 'Student' | 'School'
          owner_id: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
          image_url?: string | null
          condition?: 'New' | 'Good' | 'Fair' | 'Damaged'
          status?: 'Available' | 'Pending' | 'Borrowed' | 'Unavailable'
          total_stock?: number
          available_stock?: number
          terms?: string | null
          usage_instructions?: string | null
          review_status?: 'Pending' | 'Approved' | 'Rejected'
          reviewed_at?: string | null
          reviewed_by?: string | null
          rejection_reason?: string | null
          owner_type?: 'Student' | 'School'
          owner_id?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      borrowing_requests: {
        Relationships: []
        Row: {
          id: string
          equipment_id: string
          borrower_id: string
          lender_id: string | null
          start_date: string
          end_date: string
          status: 'Pending' | 'Borrowed' | 'Returned' | 'Cancelled' | 'Rejected'
          requested_at: string
          approved_at: string | null
          due_date: string | null
          returned_at: string | null
          notes: string | null
          picked_up_at: string | null
          reviewed_at: string | null
          rejection_reason: string | null
          cancellation_reason: string | null
        }
        Insert: {
          id?: string
          equipment_id: string
          borrower_id: string
          lender_id?: string | null
          start_date: string
          end_date: string
          status?: 'Pending' | 'Borrowed' | 'Returned' | 'Cancelled' | 'Rejected'
          requested_at?: string
          approved_at?: string | null
          due_date?: string | null
          returned_at?: string | null
          notes?: string | null
          picked_up_at?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          cancellation_reason?: string | null
        }
        Update: {
          id?: string
          equipment_id?: string
          borrower_id?: string
          lender_id?: string | null
          start_date?: string
          end_date?: string
          status?: 'Pending' | 'Borrowed' | 'Returned' | 'Cancelled' | 'Rejected'
          requested_at?: string
          approved_at?: string | null
          due_date?: string | null
          returned_at?: string | null
          notes?: string | null
          picked_up_at?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          cancellation_reason?: string | null
        }
      }
      notifications: {
        Relationships: []
        Row: {
          id: string
          user_id: string
          type: 'RequestCreated' | 'RequestApproved' | 'RequestRejected' | 'DueSoon' | 'Overdue' | 'ReturnRecorded' | 'DisputeFiled'
          message: string
          is_read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'RequestCreated' | 'RequestApproved' | 'RequestRejected' | 'DueSoon' | 'Overdue' | 'ReturnRecorded' | 'DisputeFiled'
          message: string
          is_read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'RequestCreated' | 'RequestApproved' | 'RequestRejected' | 'DueSoon' | 'Overdue' | 'ReturnRecorded' | 'DisputeFiled'
          message?: string
          is_read?: boolean
          created_at?: string
        }
      }
      lending: {
        Relationships: []
        Row: {
          id: string
          borrowing_request_id: string
          equipment_id: string
          lender_id: string
          borrower_id: string
          start_date: string
          end_date: string
          status: 'Borrowed' | 'Returned'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          borrowing_request_id: string
          equipment_id: string
          lender_id: string
          borrower_id: string
          start_date: string
          end_date: string
          status: 'Borrowed' | 'Returned'
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'Borrowed' | 'Returned'
          updated_at?: string
        }
      }
      return_record: {
        Relationships: []
        Row: {
          id: string
          lending_id: string
          borrowing_request_id: string
          equipment_id: string
          borrower_id: string
          condition: 'New' | 'Good' | 'Fair' | 'Damaged'
          notes: string | null
          returned_at: string
        }
        Insert: {
          id?: string
          lending_id: string
          borrowing_request_id: string
          equipment_id: string
          borrower_id: string
          condition: 'New' | 'Good' | 'Fair' | 'Damaged'
          notes?: string | null
          returned_at?: string
        }
        Update: never
      }
      dispute: {
        Relationships: []
        Row: {
          id: string
          borrowing_request_id: string
          reporter_id: string
          against_user_id: string
          description: string
          status: 'Open' | 'UnderReview' | 'Resolved' | 'Dismissed'
          resolution_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          borrowing_request_id: string
          reporter_id: string
          against_user_id: string
          description: string
          status?: 'Open' | 'UnderReview' | 'Resolved' | 'Dismissed'
          resolution_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'Open' | 'UnderReview' | 'Resolved' | 'Dismissed'
          resolution_notes?: string | null
          updated_at?: string
        }
      }
      notification_delivery: {
        Relationships: []
        Row: {
          id: string
          notification_id: string
          email: string
          status: 'Pending' | 'Sent' | 'Failed'
          attempts: number
          last_attempt_at: string | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          notification_id: string
          email: string
          status?: 'Pending' | 'Sent' | 'Failed'
          attempts?: number
          last_attempt_at?: string | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          status?: 'Pending' | 'Sent' | 'Failed'
          attempts?: number
          last_attempt_at?: string | null
          error_message?: string | null
        }
      }
      audit_log: {
        Relationships: []
        Row: {
          id: number
          actor_id: string | null
          action: string
          table_name: string
          record_id: string | null
          old_data: Json | null
          new_data: Json | null
          created_at: string
        }
        Insert: {
          id?: never
          actor_id?: string | null
          action: string
          table_name: string
          record_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          created_at?: string
        }
        Update: never
      }
    }
    Views: Record<string, never>
    Functions: {
      current_user_role: { Args: Record<PropertyKey, never>; Returns: 'Borrower' | 'Lender' | 'Faculty' | 'Admin' | null }
      list_profiles_for_admin: { Args: Record<PropertyKey, never>; Returns: unknown[] }
      review_user_account: { Args: { p_profile_id: string; p_action: 'Approve' | 'Reject'; p_reason?: string | null }; Returns: unknown }
      bootstrap_first_admin: { Args: { p_email: string; p_full_name: string }; Returns: string }
      approve_borrowing_request: { Args: { p_request_id: string }; Returns: unknown }
      create_borrow_request: { Args: { p_equipment_id: string; p_start_date: string; p_end_date: string; p_notes?: string | null }; Returns: string }
      review_equipment: { Args: { p_equipment_id: string; p_approved: boolean; p_total_stock?: number | null; p_reason?: string | null }; Returns: unknown }
      set_equipment_stock: { Args: { p_equipment_id: string; p_total_stock: number }; Returns: unknown }
      reject_borrowing_request: { Args: { p_request_id: string; p_reason?: string | null }; Returns: unknown }
      cancel_accepted_request: { Args: { p_request_id: string; p_reason?: string | null }; Returns: unknown }
      mark_request_picked_up: { Args: { p_request_id: string }; Returns: unknown }
      record_lender_return: { Args: { p_request_id: string; p_condition: 'New' | 'Good' | 'Fair' | 'Damaged'; p_notes?: string | null }; Returns: unknown }
      request_rental_extension: { Args: { p_request_id: string; p_requested_due_date: string; p_reason?: string | null }; Returns: unknown }
      review_rental_extension: { Args: { p_extension_id: string; p_approve: boolean }; Returns: unknown }
      process_late_returns: { Args: Record<PropertyKey, never>; Returns: number }
      process_due_notifications: { Args: Record<PropertyKey, never>; Returns: number }
      process_expired_requests: { Args: Record<PropertyKey, never>; Returns: number }
      create_notification: {
        Args: { p_user_id: string; p_type: 'RequestCreated' | 'RequestApproved' | 'RequestRejected' | 'DueSoon' | 'Overdue' | 'ReturnRecorded' | 'DisputeFiled'; p_message: string }
        Returns: string
      }
    }
    Enums: Record<string, never>
  }
}
