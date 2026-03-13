export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    display_name: string | null;
                    created_at: string;
                };
                Insert: {
                    id: string;
                    display_name?: string | null;
                    created_at?: string;
                };
                Update: {
                    id?: string;
                    display_name?: string | null;
                    created_at?: string;
                };
                Relationships: [];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            [_ in never]: never;
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
}

/** Convenience type for a resolved profile row */
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
