// Type definitions for Prompt Architecture System

export type PromptType =
  | 'system'           // Global orchestrator
  | 'sora_intro'       // Section welcome video
  | 'calibration'      // Pre-learning chatbot
  | 'notebooklm_main'  // Main instruction prompt
  | 'notebooklm_video' // Video explanation (3.1)
  | 'notebooklm_podcast' // Podcast walkthrough (3.2)
  | 'notebooklm_summary' // Written summary (3.3)
  | 'notebooklm_examples' // Examples (3.4)
  | 'notebooklm_practice' // Practice problems (3.5)
  | 'verification'     // Assessment generation
  | 'remediation'      // Re-teaching content
  | 'heygen_wrapup';   // Wrap-up video

export type VariableScope = 'global' | 'deployment' | 'course' | 'section' | 'learner';
export type VariableType = 'string' | 'number' | 'boolean' | 'json';

export interface Deployment {
  id: string;
  name: string;
  description?: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PromptTemplate {
  id: string;
  name: string;
  prompt_type: PromptType;
  template_text: string;
  description?: string;
  version: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PromptVariable {
  id: string;
  variable_name: string;
  description?: string;
  default_value?: string;
  variable_type: VariableType;
  is_required: boolean;
  scope: VariableScope;
  created_at: Date;
}

export interface TemplateVariable {
  template_id: string;
  variable_id: string;
  is_required: boolean;
}

export interface DeploymentPrompt {
  id: string;
  deployment_id: string;
  template_id: string;
  custom_template_text?: string;
  is_enabled: boolean;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DeploymentVariable {
  id: string;
  deployment_id: string;
  variable_id: string;
  value: string;
  created_at: Date;
  updated_at: Date;
}

export interface CoursePrompt {
  id: string;
  course_id: string;
  template_id: string;
  custom_template_text?: string;
  is_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CourseVariable {
  id: string;
  course_id: string;
  variable_id: string;
  value: string;
  created_at: Date;
  updated_at: Date;
}

export interface SectionVariable {
  id: string;
  section_id: string;
  variable_id: string;
  value: string;
  created_at: Date;
  updated_at: Date;
}

export interface PromptExecution {
  id: string;
  prompt_type: PromptType;
  deployment_id?: string;
  course_id?: string;
  section_id?: string;
  learner_id?: string;
  resolved_prompt: string;
  ai_service?: 'notebooklm' | 'sora' | 'heygen';
  execution_context?: string; // JSON
  executed_at: Date;
}

// DTOs and Request/Response Types

export interface PromptResolutionContext {
  deployment_id?: string;
  course_id?: string;
  section_id?: string;
  learner_id?: string;
  additional_variables?: Record<string, any>;
}

export interface ResolvedPrompt {
  prompt_type: PromptType;
  resolved_text: string;
  template_used: PromptTemplate;
  variables_used: Record<string, any>;
  resolution_hierarchy: {
    template_source: 'master' | 'deployment' | 'course';
    variables_from: {
      global: string[];
      deployment: string[];
      course: string[];
      section: string[];
      learner: string[];
    };
  };
}

export interface PromptTemplateCreateRequest {
  name: string;
  prompt_type: PromptType;
  template_text: string;
  description?: string;
  version?: string;
  variables?: string[]; // variable IDs
}

export interface DeploymentPromptCreateRequest {
  deployment_id: string;
  template_id: string;
  custom_template_text?: string;
  notes?: string;
}

export interface VariableValueSetRequest {
  variable_id: string;
  value: string | number | boolean | object;
}

export interface BulkVariableSetRequest {
  deployment_id?: string;
  course_id?: string;
  section_id?: string;
  variables: VariableValueSetRequest[];
}

export interface PromptPreviewRequest {
  template_id: string;
  context: PromptResolutionContext;
  test_variables?: Record<string, any>;
}
