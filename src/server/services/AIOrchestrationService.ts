/**
 * AI Orchestration Service
 * Integrates PromptEngine with AI services (NotebookLM, Sora, HeyGen)
 * Resolves prompts with context before making AI service calls
 */

import { Database } from 'sqlite3';
import { PromptEngine } from './PromptEngine';
import { AIServiceFactory, NotebookLMService, SoraService, HeyGenService } from './AIServices';
import { PromptResolutionContext } from '../types/prompt-models';

export interface SectionContext {
  deployment_id?: string;
  course_id: string;
  section_id: string;
  learner_id?: string;
  section_title: string;
  section_objectives: string[];
  source_content?: string;
  is_critical: boolean;
}

export interface CalibrationContext extends SectionContext {
  learner_name: string;
  learner_role?: string;
  learner_experience_level: string;
  confidence_level: number;
}

export interface WrapUpContext extends SectionContext {
  learner_name: string;
  mastery_score: number;
}

export class AIOrchestrationService {
  private promptEngine: PromptEngine;
  private notebookLM: NotebookLMService;
  private sora: SoraService;
  private heygen: HeyGenService;

  constructor(database: Database) {
    this.promptEngine = new PromptEngine(database);
    this.notebookLM = AIServiceFactory.getNotebookLMService();
    this.sora = AIServiceFactory.getSoraService();
    this.heygen = AIServiceFactory.getHeyGenService();
  }

  /**
   * Generate Sora welcome video with resolved prompt
   */
  async generateSoraWelcomeVideo(context: SectionContext): Promise<{ jobId: string; resolvedPrompt: string }> {
    console.log(`[AIOrchestration] Generating Sora welcome video for section: ${context.section_title}`);

    // Resolve the prompt
    const resolved = await this.promptEngine.resolvePrompt('sora_intro', {
      deployment_id: context.deployment_id,
      course_id: context.course_id,
      section_id: context.section_id,
      learner_id: context.learner_id,
      additional_variables: {
        section_title: context.section_title,
        section_objectives: JSON.stringify(context.section_objectives),
        is_critical: context.is_critical
      }
    });

    console.log(`[AIOrchestration] Resolved Sora prompt (${resolved.resolved_text.length} chars)`);

    // Call Sora service with resolved script
    const result = await this.sora.generateWelcomeVideo(resolved.resolved_text, 45);

    return {
      jobId: result.jobId,
      resolvedPrompt: resolved.resolved_text
    };
  }

  /**
   * Run calibration chatbot interview with resolved prompt
   */
  async runCalibrationInterview(context: CalibrationContext): Promise<string> {
    console.log(`[AIOrchestration] Running calibration for learner: ${context.learner_name}`);

    const resolved = await this.promptEngine.resolvePrompt('calibration', {
      deployment_id: context.deployment_id,
      course_id: context.course_id,
      section_id: context.section_id,
      learner_id: context.learner_id,
      additional_variables: {
        section_title: context.section_title,
        learner_name: context.learner_name,
        learner_role: context.learner_role || 'learner',
        learner_experience_level: context.learner_experience_level,
        confidence_level: context.confidence_level
      }
    });

    console.log(`[AIOrchestration] Calibration prompt resolved`);

    // In real implementation, this would be sent to a chatbot interface
    // For now, return the resolved prompt (the chatbot instructions)
    return resolved.resolved_text;
  }

  /**
   * Generate NotebookLM instruction content with resolved prompt
   */
  async generateNotebookLMInstruction(
    notebookId: string,
    context: SectionContext,
    calibrationResults?: { emphasis_areas?: string[] }
  ): Promise<{
    video: { url: string; transcript: string };
    podcast: { url: string; transcript: string };
    summary: string;
    resolvedPrompt: string;
  }> {
    console.log(`[AIOrchestration] Generating NotebookLM instruction for: ${context.section_title}`);

    // Resolve the main NotebookLM instruction prompt
    const resolved = await this.promptEngine.resolvePrompt('notebooklm_main', {
      deployment_id: context.deployment_id,
      course_id: context.course_id,
      section_id: context.section_id,
      learner_id: context.learner_id,
      additional_variables: {
        section_title: context.section_title,
        section_objectives: JSON.stringify(context.section_objectives),
        source_content: context.source_content || '',
        calibration_emphasis_areas: calibrationResults?.emphasis_areas
          ? JSON.stringify(calibrationResults.emphasis_areas)
          : 'No specific emphasis'
      }
    });

    console.log(`[AIOrchestration] NotebookLM prompt resolved (${resolved.resolved_text.length} chars)`);

    // Generate all three formats using the resolved prompt
    // In real implementation, the resolved prompt would be sent to NotebookLM
    // which would generate all artifacts grounded in source materials

    const [video, podcast, summary] = await Promise.all([
      this.notebookLM.generateVideo(notebookId, context.section_title),
      this.notebookLM.generatePodcast(notebookId, context.section_title),
      this.notebookLM.generateSummary(notebookId, context.section_title)
    ]);

    return {
      video,
      podcast,
      summary,
      resolvedPrompt: resolved.resolved_text
    };
  }

  /**
   * Generate assessment questions with resolved prompt
   */
  async generateAssessment(context: SectionContext): Promise<{
    questions: any[];
    resolvedPrompt: string;
  }> {
    console.log(`[AIOrchestration] Generating assessment for: ${context.section_title}`);

    const resolved = await this.promptEngine.resolvePrompt('verification', {
      deployment_id: context.deployment_id,
      course_id: context.course_id,
      section_id: context.section_id,
      additional_variables: {
        section_title: context.section_title,
        section_objectives: JSON.stringify(context.section_objectives),
        is_critical: context.is_critical
      }
    });

    console.log(`[AIOrchestration] Assessment prompt resolved`);

    // In real implementation, this would call an AI service to generate questions
    // For now, return mock questions
    const mockQuestions = [
      {
        id: 'q1',
        question_text: `What are the key ${context.section_title} concepts?`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correct_answer: 'Option A'
      }
    ];

    return {
      questions: mockQuestions,
      resolvedPrompt: resolved.resolved_text
    };
  }

  /**
   * Generate remediation content with resolved prompt
   */
  async generateRemediation(
    context: SectionContext,
    failedQuestions: any[]
  ): Promise<{
    remediationContent: string;
    resolvedPrompt: string;
  }> {
    console.log(`[AIOrchestration] Generating remediation for: ${context.section_title}`);

    const resolved = await this.promptEngine.resolvePrompt('remediation', {
      deployment_id: context.deployment_id,
      course_id: context.course_id,
      section_id: context.section_id,
      learner_id: context.learner_id,
      additional_variables: {
        section_title: context.section_title,
        failed_questions: JSON.stringify(failedQuestions)
      }
    });

    console.log(`[AIOrchestration] Remediation prompt resolved`);

    // In real implementation, this would generate personalized remediation
    // For now, return the resolved prompt as the remediation content
    return {
      remediationContent: resolved.resolved_text,
      resolvedPrompt: resolved.resolved_text
    };
  }

  /**
   * Generate HeyGen wrap-up video with resolved prompt
   */
  async generateHeyGenWrapUp(context: WrapUpContext): Promise<{
    jobId: string;
    resolvedPrompt: string;
  }> {
    console.log(`[AIOrchestration] Generating HeyGen wrap-up for: ${context.section_title}`);

    const resolved = await this.promptEngine.resolvePrompt('heygen_wrapup', {
      deployment_id: context.deployment_id,
      course_id: context.course_id,
      section_id: context.section_id,
      learner_id: context.learner_id,
      additional_variables: {
        section_title: context.section_title,
        learner_name: context.learner_name,
        mastery_score: context.mastery_score,
        is_critical: context.is_critical
      }
    });

    console.log(`[AIOrchestration] HeyGen prompt resolved (${resolved.resolved_text.length} chars)`);

    // Call HeyGen service with resolved script
    const result = await this.heygen.generateWrapUpVideo(resolved.resolved_text, 'section');

    return {
      jobId: result.jobId,
      resolvedPrompt: resolved.resolved_text
    };
  }

  /**
   * Get system orchestrator prompt for overall context
   */
  async getSystemPrompt(context: {
    deployment_id?: string;
    course_id: string;
  }): Promise<string> {
    const resolved = await this.promptEngine.resolvePrompt('system', {
      deployment_id: context.deployment_id,
      course_id: context.course_id
    });

    return resolved.resolved_text;
  }

  /**
   * Preview any prompt type with test data
   */
  async previewPrompt(
    templateId: string,
    context: PromptResolutionContext,
    testVariables?: Record<string, any>
  ): Promise<string> {
    return this.promptEngine.previewPrompt(templateId, context, testVariables);
  }
}
