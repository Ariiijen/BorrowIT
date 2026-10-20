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
          condition: 'New' | 'Good' | 'Fair' | 'Damaged'
          status: 'Available' | 'Pending' | 'Borrowed' | 'Unavailable'
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
          condition?: 'New' | 'Good' | 'Fair' | 'Damaged'
          status?: 'Available' | 'Pending' | 'Borrowed' | 'Unavailable'
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
          condition?: 'New' | 'Good' | 'Fair' | 'Damaged'
          status?: 'Available' | 'Pending' | 'Borrowed' | 'Unavailable'
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
          status: 'Pending' | 'Borrowed' | 'Returned' | 'Cancelled'
          requested_at: string
          approved_at: string | null
          due_date: string | null
          returned_at: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          equipment_id: string
          borrower_id: string
          lender_id?: string | null
          start_date: string
          end_date: string
          status?: 'Pending' | 'Borrowed' | 'Returned' | 'Cancelled'
          requested_at?: string
          approved_at?: string | null
          due_date?: string | null
          returned_at?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          equipment_id?: string
          borrower_id?: string
          lender_id?: string | null
          start_date?: string
          end_date?: string
          status?: 'Pending' | 'Borrowed' | 'Returned' | 'Cancelled'
          requested_at?: string
          approved_at?: string | null
          due_date?: string | null
          returned_at?: string | null
          notes?: string | null
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
      create_notification: {
        Args: { p_user_id: string; p_type: 'RequestCreated' | 'RequestApproved' | 'RequestRejected' | 'DueSoon' | 'Overdue' | 'ReturnRecorded' | 'DisputeFiled'; p_message: string }
        Returns: string
      }
    }
    Enums: Record<string, never>
  }
}
