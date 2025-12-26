// RBAC Type Definitions

export type UserRole = 'master_admin' | 'admin_support' | 'course_creator' | 'student';
export type ResourceType = 'users' | 'deployments' | 'prompts' | 'courses' | 'sources' | 'assessments';
export type ActionType = 'create' | 'read' | 'update' | 'delete' | 'publish' | 'assign';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  deployment_id?: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export interface UserSession {
  id: string;
  user_id: string;
  token: string;
  expires_at: Date;
  created_at: Date;
}

export interface RolePermission {
  id: string;
  role: UserRole;
  resource: ResourceType;
  action: ActionType;
}

export interface CourseDraft {
  id: string;
  creator_id: string;
  deployment_id: string;
  course_id?: string;
  draft_data: string; // JSON
  status: 'building' | 'review' | 'ready' | 'published';
  created_at: Date;
  updated_at: Date;
}

export interface CourseAssignment {
  id: string;
  course_id: string;
  student_id: string;
  assigned_by: string;
  assigned_at: Date;
  due_date?: Date;
  status: 'assigned' | 'started' | 'completed' | 'overdue';
}

export interface StudentProfile {
  user_id: string;
  role?: string;
  jurisdiction?: string;
  experience_level?: 'novice' | 'intermediate' | 'advanced';
  coaching_tone?: 'direct' | 'gentle';
  format_preference?: 'audio' | 'video' | 'text';
  pace_preference?: 'fast' | 'standard' | 'detailed';
  confidence_level?: number;
}

export interface CreatorProfile {
  user_id: string;
  organization?: string;
  specialization?: string;
  courses_created: number;
  bio?: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  details?: string; // JSON
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

// DTOs

export interface UserCreateRequest {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  deployment_id?: string;
}

export interface UserLoginRequest {
  email: string;
  password: string;
}

export interface UserLoginResponse {
  user: Omit<User, 'password_hash'>;
  token: string;
  expires_at: Date;
}

export interface CourseBuilderRequest {
  title: string;
  description: string;
  deployment_id: string;
  target_learner_profile?: string;
  prerequisites?: string;
}

export interface SectionBuilderRequest {
  title: string;
  description?: string;
  order_index: number;
  is_critical: boolean;
  criticality_reason?: string;
  objectives: string[];
  source_ids: string[];
}

export interface CourseDraftData {
  course: {
    title: string;
    description: string;
    target_learner_profile?: string;
    prerequisites?: string;
    estimated_duration?: number;
  };
  outcomes: Array<{
    outcome_text: string;
    performance_verb: string;
    assessment_criteria?: string;
    order_index: number;
  }>;
  sections: Array<{
    section: {
      title: string;
      description?: string;
      order_index: number;
      is_critical: boolean;
      criticality_reason?: string;
      estimated_duration?: number;
    };
    objectives: Array<{
      objective_text: string;
      order_index: number;
    }>;
    source_ids: string[];
  }>;
}

export interface CourseAssignmentRequest {
  course_id: string;
  student_ids: string[];
  due_date?: Date;
}
