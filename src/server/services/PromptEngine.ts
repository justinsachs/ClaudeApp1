import { Database } from '../db/database';
import { PromptRepository } from '../repositories/PromptRepository';
import { LearnerRepository } from '../repositories/LearnerRepository';
import {
  PromptType,
  PromptResolutionContext,
  ResolvedPrompt,
  PromptTemplate,
  PromptVariable
} from '../types/prompt-models';

/**
 * PromptEngine - Template resolution and variable substitution service
 *
 * Resolves prompts with hierarchical variable inheritance:
 * 1. Global defaults (from variable definitions)
 * 2. Deployment-level values
 * 3. Course-level values
 * 4. Section-level values
 * 5. Learner-level values (from profile)
 * 6. Runtime additional variables
 *
 * Template syntax: {{variable_name}}
 * Conditional syntax: {{#if variable_name}}...{{/if}}
 * Default values: {{variable_name|default_value}}
 */
export class PromptEngine {
  private promptRepo: PromptRepository;
  private learnerRepo: LearnerRepository;

  constructor(database: Database) {
    this.promptRepo = new PromptRepository(database);
    this.learnerRepo = new LearnerRepository(database);
  }

  /**
   * Resolve a prompt for a given type and context
   */
  async resolvePrompt(
    promptType: PromptType,
    context: PromptResolutionContext
  ): Promise<ResolvedPrompt> {
    // Step 1: Get the template to use (deployment override > course override > master)
    const template = await this.getTemplateToUse(promptType, context);
    if (!template) {
      throw new Error(`No template found for prompt type: ${promptType}`);
    }

    // Step 2: Collect all variables with hierarchical override
    const variables = await this.collectVariables(context);

    // Step 3: Add learner-specific variables if learner_id provided
    if (context.learner_id) {
      const learnerVars = await this.getLearnerVariables(context.learner_id);
      Object.assign(variables, learnerVars);
    }

    // Step 4: Merge in any additional runtime variables
    if (context.additional_variables) {
      Object.assign(variables, context.additional_variables);
    }

    // Step 5: Substitute variables in template
    const resolvedText = this.substituteVariables(template.template_text, variables);

    // Step 6: Track which variables came from where
    const hierarchy = await this.buildVariableHierarchy(context);

    // Step 7: Log the execution
    await this.promptRepo.logPromptExecution({
      prompt_type: promptType,
      deployment_id: context.deployment_id,
      course_id: context.course_id,
      section_id: context.section_id,
      learner_id: context.learner_id,
      resolved_prompt: resolvedText,
      ai_service: this.getAIServiceForPromptType(promptType),
      execution_context: JSON.stringify({
        template_id: template.id,
        variables_used: variables,
        hierarchy
      })
    });

    return {
      prompt_type: promptType,
      resolved_text: resolvedText,
      template_used: template,
      variables_used: variables,
      resolution_hierarchy: hierarchy
    };
  }

  /**
   * Preview a prompt with test variables (doesn't log execution)
   */
  async previewPrompt(
    templateId: string,
    context: PromptResolutionContext,
    testVariables?: Record<string, any>
  ): Promise<string> {
    const template = await this.promptRepo.getPromptTemplate(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const variables = await this.collectVariables(context);
    if (testVariables) {
      Object.assign(variables, testVariables);
    }

    return this.substituteVariables(template.template_text, variables);
  }

  /**
   * Get the template to use based on hierarchy
   */
  private async getTemplateToUse(
    promptType: PromptType,
    context: PromptResolutionContext
  ): Promise<PromptTemplate | null> {
    // Priority 1: Course-specific override
    if (context.course_id) {
      const coursePrompt = await this.promptRepo.getCoursePromptByType(
        context.course_id,
        promptType
      );
      if (coursePrompt?.custom_template_text) {
        // Create synthetic template from course override
        const masterTemplate = await this.promptRepo.getPromptTemplateByType(promptType);
        return {
          ...masterTemplate!,
          template_text: coursePrompt.custom_template_text
        };
      }
    }

    // Priority 2: Deployment-specific override
    if (context.deployment_id) {
      const deploymentPrompt = await this.promptRepo.getDeploymentPromptByType(
        context.deployment_id,
        promptType
      );
      if (deploymentPrompt?.custom_template_text) {
        const masterTemplate = await this.promptRepo.getPromptTemplateByType(promptType);
        return {
          ...masterTemplate!,
          template_text: deploymentPrompt.custom_template_text
        };
      }
    }

    // Priority 3: Master template
    return this.promptRepo.getPromptTemplateByType(promptType);
  }

  /**
   * Collect variables from all scopes with hierarchical override
   */
  private async collectVariables(context: PromptResolutionContext): Promise<Record<string, any>> {
    const variables: Record<string, any> = {};

    // Step 1: Global defaults
    const allVariables = await this.promptRepo.getAllPromptVariables();
    for (const v of allVariables) {
      if (v.default_value) {
        variables[v.variable_name] = this.parseVariableValue(v.default_value, v.variable_type);
      }
    }

    // Step 2: Deployment-level variables (override defaults)
    if (context.deployment_id) {
      const deploymentVars = await this.promptRepo.getDeploymentVariables(context.deployment_id);
      Object.assign(variables, deploymentVars);
    }

    // Step 3: Course-level variables (override deployment)
    if (context.course_id) {
      const courseVars = await this.promptRepo.getCourseVariables(context.course_id);
      Object.assign(variables, courseVars);
    }

    // Step 4: Section-level variables (override course)
    if (context.section_id) {
      const sectionVars = await this.promptRepo.getSectionVariables(context.section_id);
      Object.assign(variables, sectionVars);
    }

    return variables;
  }

  /**
   * Get learner-specific variables from profile
   */
  private async getLearnerVariables(learnerId: string): Promise<Record<string, any>> {
    const profile = await this.learnerRepo.getLearnerProfile(learnerId);
    if (!profile) return {};

    const vars: Record<string, any> = {
      learner_name: profile.learner.name,
      learner_email: profile.learner.email,
      learner_role: profile.learner.role || '',
      learner_jurisdiction: profile.learner.jurisdiction || '',
      learner_experience_level: profile.learner.experience_level || 'intermediate',
      coaching_tone: profile.preferences?.coaching_tone || 'direct',
      format_preference: profile.preferences?.format_preference || 'video',
      pace_preference: profile.preferences?.pace_preference || 'standard',
      confidence_level: profile.preferences?.confidence_level || 5
    };

    return vars;
  }

  /**
   * Substitute {{variables}} in template text
   * Supports:
   * - Simple substitution: {{variable_name}}
   * - Default values: {{variable_name|default}}
   * - Conditional blocks: {{#if variable_name}}...{{/if}}
   */
  private substituteVariables(template: string, variables: Record<string, any>): string {
    let result = template;

    // Process conditional blocks first
    result = this.processConditionals(result, variables);

    // Process simple variable substitution
    result = result.replace(/\{\{([^}]+)\}\}/g, (match, varExpression) => {
      const trimmed = varExpression.trim();

      // Check for default value syntax: {{variable|default}}
      if (trimmed.includes('|')) {
        const [varName, defaultValue] = trimmed.split('|').map((s: string) => s.trim());
        return variables[varName] !== undefined
          ? String(variables[varName])
          : defaultValue;
      }

      // Simple variable substitution
      return variables[trimmed] !== undefined
        ? String(variables[trimmed])
        : `{{${trimmed}}}`; // Leave unresolved variables as-is
    });

    return result;
  }

  /**
   * Process conditional blocks: {{#if variable}}...{{/if}}
   */
  private processConditionals(template: string, variables: Record<string, any>): string {
    const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g;

    return template.replace(conditionalRegex, (match, varName, content) => {
      const value = variables[varName.trim()];
      // Include block if variable is truthy
      return this.isTruthy(value) ? content : '';
    });
  }

  /**
   * Check if a value is truthy for conditional logic
   */
  private isTruthy(value: any): boolean {
    if (value === undefined || value === null) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') return value.length > 0 && value.toLowerCase() !== 'false';
    if (Array.isArray(value)) return value.length > 0;
    return true;
  }

  /**
   * Parse variable value based on type
   */
  private parseVariableValue(value: string, type: string): any {
    switch (type) {
      case 'number':
        return Number(value);
      case 'boolean':
        return value === 'true' || value === '1';
      case 'json':
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      default:
        return value;
    }
  }

  /**
   * Build variable hierarchy for audit trail
   */
  private async buildVariableHierarchy(context: PromptResolutionContext) {
    const hierarchy = {
      template_source: 'master' as 'master' | 'deployment' | 'course',
      variables_from: {
        global: [] as string[],
        deployment: [] as string[],
        course: [] as string[],
        section: [] as string[],
        learner: [] as string[]
      }
    };

    // Track which variables came from where
    const allVars = await this.promptRepo.getAllPromptVariables();
    hierarchy.variables_from.global = allVars
      .filter(v => v.default_value)
      .map(v => v.variable_name);

    if (context.deployment_id) {
      const depVars = await this.promptRepo.getDeploymentVariables(context.deployment_id);
      hierarchy.variables_from.deployment = Object.keys(depVars);
      if (Object.keys(depVars).length > 0) {
        hierarchy.template_source = 'deployment';
      }
    }

    if (context.course_id) {
      const courseVars = await this.promptRepo.getCourseVariables(context.course_id);
      hierarchy.variables_from.course = Object.keys(courseVars);
      if (Object.keys(courseVars).length > 0) {
        hierarchy.template_source = 'course';
      }
    }

    if (context.section_id) {
      const sectionVars = await this.promptRepo.getSectionVariables(context.section_id);
      hierarchy.variables_from.section = Object.keys(sectionVars);
    }

    if (context.learner_id) {
      hierarchy.variables_from.learner = [
        'learner_name',
        'learner_email',
        'learner_experience_level',
        'coaching_tone',
        'format_preference'
      ];
    }

    return hierarchy;
  }

  /**
   * Map prompt type to AI service
   */
  private getAIServiceForPromptType(promptType: PromptType): 'notebooklm' | 'sora' | 'heygen' | undefined {
    if (promptType.startsWith('notebooklm')) return 'notebooklm';
    if (promptType === 'sora_intro') return 'sora';
    if (promptType === 'heygen_wrapup') return 'heygen';
    return undefined;
  }
}
