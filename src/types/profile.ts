
import { z } from "zod";

// Form schema for profile update
export const profileSchema = z.object({
  email: z.string().email().optional(),
  first_name: z.string().min(1, "First name is required"),
  call_name: z.string().min(1, "Call name is required"),
  department: z.string().optional(),
  jobTitle: z.string().optional(),
  officeLocation: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

// Interface for employee and profile data
export interface UserProfileData {
  email?: string;
  first_name?: string;
  call_name?: string;
  avatar_url?: string;
  department?: string;
  jobTitle?: string;
  officeLocation?: string;
  city?: string;
  state?: string;
  country?: string;
  conversation_preferences?: string;
}

// Interface for Employee_id table data
export interface EmployeeData {
  employee_id: string;
  user_id: string | null;
  displayName?: string;
  userPrincipalName?: string;
  department?: string;
  jobTitle?: string;
  officeLocation?: string;
  city?: string;
  state?: string;
  country?: string;
}

// Interface for profile table data
export interface ProfileData {
  id: string;
  email?: string;
  first_name?: string;
  call_name?: string;
  avatar_url?: string;
  conversation_preferences?: string;
  created_at: string;
  updated_at: string;
}
