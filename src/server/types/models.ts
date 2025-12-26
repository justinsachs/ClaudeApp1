// Type definitions for AI Course Platform
// Corresponds to database schema

export interface Learner {
  id: string;
  name: string;
  email: string;
  role?: string;
  jurisdiction?: string;
  experience_level?: 'novice' | 'intermediate' | 'advanced';
  created_at: Date;
  updated_at: Date;
}

export interface LearnerPreference {
  learner_id: string;
  coaching_tone?: 'direct' | 'gentle';
  format_preference?: 'audio' | 'video' | 'text';
  pace_preference?: 'fast' | 'standard' | 'detailed';
  confidence_level?: number; // 1-10
}

export interface LearnerQualifier {
  id: string;
  learner_id: string;
  qualifier_type: 'prior_role' | 'certification' | 'jurisdiction';
  qualifier_value: string;
  created_at: Date;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  target_learner_profile?: string;
  prerequisites?: string;
  estimated_duration?: number; // minutes
  version: string;
  status: 'draft' | 'review' | 'published' | 'archived';
  created_by?: string;
  created_at: Date;
  updated_at: Date;
  published_at?: Date;
}

export interface LearningOutcome {
  id: string;
  course_id: string;
  outcome_text: string;
  performance_verb: string;
  assessment_criteria?: string;
  order_index: number;
}

export interface Section {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
  is_critical: boolean;
  criticality_reason?: string; // safety/compliance/legal/ethics
  estimated_duration?: number; // minutes
  notebooklm_notebook_id?: string;
}

export interface SectionObjective {
  id: string;
  section_id: string;
  objective_text: string;
  order_index: number;
}

export interface Source {
  id: string;
  title: string;
  source_type: 'pdf' | 'docx' | 'manual' | 'sop' | 'website' | 'regulation' | 'standard' | 'template' | 'transcript';
  file_path?: string;
  url?: string;
  version?: string;
  date_published?: Date;
  authority_level: 'primary' | 'secondary' | 'internal';
  scope_of_use?: string; // 'full' or 'excerpt'
  jurisdiction?: string;
  uploaded_at: Date;
  uploaded_by?: string;
}

export interface SectionSource {
  section_id: string;
  source_id: string;
}

export interface NotebookLMNotebook {
  id: string;
  course_id: string;
  title: string;
  notebook_type?: 'welcome' | 'terminology' | 'standards' | 'sales' | 'compliance';
  external_id?: string; // ID from NotebookLM service
  created_at: Date;
}

export interface Assessment {
  id: string;
  section_id?: string;
  course_id?: string;
  assessment_type: 'quiz' | 'scenario' | 'explain_back' | 'skills_check' | 'capstone';
  question_text: string;
  correct_answer?: string;
  rubric?: string; // JSON rubric
  difficulty_level?: number; // 1-5
  tags?: string; // JSON array
  created_at: Date;
}

export interface AssessmentOption {
  id: string;
  assessment_id: string;
  option_text: string;
  is_correct: boolean;
  order_index: number;
}

export interface Enrollment {
  id: string;
  learner_id: string;
  course_id: string;
  status: 'active' | 'completed' | 'withdrawn';
  enrolled_at: Date;
  completed_at?: Date;
  final_score?: number;
}

export interface SectionProgress {
  id: string;
  enrollment_id: string;
  section_id: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'failed';
  started_at?: Date;
  completed_at?: Date;
  mastery_score?: number;
  attempts: number;
}

export interface VerificationRecord {
  id: string;
  section_progress_id: string;
  assessment_id: string;
  learner_response?: string;
  score?: number;
  passed: boolean;
  attempt_number: number;
  verified_at: Date;
}

export interface RemediationLog {
  id: string;
  section_progress_id: string;
  verification_record_id?: string;
  remediation_type: 'analogy' | 'step_by_step' | 'common_mistakes';
  content_provided: string;
  created_at: Date;
}

export interface VideoAsset {
  id: string;
  asset_type: 'sora_welcome' | 'heygen_section_wrap' | 'heygen_course_wrap';
  section_id?: string;
  course_id?: string;
  script_text: string;
  video_url?: string;
  generation_status: 'pending' | 'processing' | 'completed' | 'failed';
  external_job_id?: string;
  created_at: Date;
  completed_at?: Date;
}

export interface NotebookLMArtifact {
  id: string;
  notebook_id: string;
  section_id?: string;
  artifact_type: 'video' | 'podcast' | 'summary';
  content_url?: string;
  transcript?: string;
  created_at: Date;
}

export interface CompletionRecord {
  id: string;
  enrollment_id: string;
  completion_date: Date;
  final_score?: number;
  certificate_issued: boolean;
  certificate_url?: string;
  next_steps?: string;
}

export interface AuditTrail {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id?: string;
  actor_type?: 'user' | 'system' | 'ai_service';
  changes?: string; // JSON
  metadata?: string; // JSON
  created_at: Date;
}

export interface CourseConfiguration {
  course_id: string;
  mastery_threshold_standard: number;
  mastery_threshold_critical: number;
  retry_limit_standard: number;
  retry_limit_critical: number;
  media_formats: string; // JSON array
  heygen_mandatory: boolean;
  compliance_calendar_enabled: boolean;
  manager_dashboard_enabled: boolean;
}

export interface LearnerCompetency {
  id: string;
  learner_id: string;
  outcome_id: string;
  mastery_level: number; // 0-1
  last_assessed?: Date;
}

// DTOs and Request/Response Types

export interface CourseDefinitionPackage {
  course: Omit<Course, 'id' | 'created_at' | 'updated_at'>;
  outcomes: Omit<LearningOutcome, 'id' | 'course_id'>[];
  sections: Array<{
    section: Omit<Section, 'id' | 'course_id'>;
    objectives: Omit<SectionObjective, 'id' | 'section_id'>[];
    sources: string[]; // source IDs
  }>;
  configuration?: Partial<CourseConfiguration>;
}

export interface LearnerProfile {
  learner: Learner;
  preferences?: LearnerPreference;
  qualifiers: LearnerQualifier[];
  competencies: LearnerCompetency[];
}

export interface SectionExecutionContext {
  enrollment_id: string;
  section_id: string;
  learner_profile: LearnerProfile;
  section_data: Section & {
    objectives: SectionObjective[];
    sources: Source[];
  };
  progress: SectionProgress;
}

export interface VerificationRequest {
  section_progress_id: string;
  assessment_id: string;
  learner_response: string | object;
}

export interface VerificationResult {
  passed: boolean;
  score: number;
  feedback: string;
  requires_remediation: boolean;
  remediation_type?: 'analogy' | 'step_by_step' | 'common_mistakes';
}

export interface CalibrationInterview {
  section_goal: string;
  identified_gaps: string[];
  adaptation_settings: {
    emphasis_areas: string[];
    pacing_adjustment: 'slower' | 'standard' | 'faster';
    risk_flags: string[];
  };
}
