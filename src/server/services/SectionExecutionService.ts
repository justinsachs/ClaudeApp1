// Section Execution Service
// Implements the Section Execution Loop as defined in the specification

import { Database } from '../db/database';
import { CourseRepository } from '../repositories/CourseRepository';
import { LearnerRepository } from '../repositories/LearnerRepository';
import { AssessmentRepository } from '../repositories/AssessmentRepository';
import { AIServiceFactory } from './AIServices';
import {
  SectionExecutionContext,
  CalibrationInterview,
  VerificationRequest,
  VerificationResult,
  SectionProgress
} from '../types/models';

export class SectionExecutionService {
  private courseRepo: CourseRepository;
  private learnerRepo: LearnerRepository;
  private assessmentRepo: AssessmentRepository;

  constructor(db: Database) {
    this.courseRepo = new CourseRepository(db);
    this.learnerRepo = new LearnerRepository(db);
    this.assessmentRepo = new AssessmentRepository(db);
  }

  /**
   * Step 6.1: Generate and display Sora welcome video for section
   */
  async generateSectionWelcome(sectionId: string): Promise<{ videoAssetId: string; jobId: string }> {
    const section = await this.courseRepo.getSectionById(sectionId);
    if (!section) throw new Error('Section not found');

    // Generate script
    const script = this.createWelcomeScript(section.title, section.description || '');

    // Request video from Sora
    const soraService = AIServiceFactory.getSoraService();
    const { jobId } = await soraService.generateWelcomeVideo(script, 45); // 30-60 seconds

    // Create video asset record
    const videoAsset = await this.assessmentRepo.createVideoAsset({
      asset_type: 'sora_welcome',
      section_id: sectionId,
      script_text: script,
      generation_status: 'processing',
      external_job_id: jobId
    });

    // Log to audit trail
    await this.assessmentRepo.logAudit({
      entity_type: 'section',
      entity_id: sectionId,
      action: 'welcome_video_generated',
      actor_type: 'ai_service',
      metadata: JSON.stringify({ video_asset_id: videoAsset.id, job_id: jobId })
    });

    return { videoAssetId: videoAsset.id, jobId };
  }

  /**
   * Step 6.2: Conduct calibration interview with chatbot
   */
  async conductCalibrationInterview(
    enrollmentId: string,
    sectionId: string,
    learnerResponses: { question: string; answer: string }[]
  ): Promise<CalibrationInterview> {
    const section = await this.courseRepo.getSectionById(sectionId);
    if (!section) throw new Error('Section not found');

    const objectives = await this.courseRepo.getSectionObjectives(sectionId);
    const learnerProfile = await this.learnerRepo.getLearnerProfile(
      (await this.learnerRepo.getEnrollment(enrollmentId))!.learner_id
    );

    // Analyze responses to identify gaps and goals
    const analysis = this.analyzeCalibrationResponses(learnerResponses, objectives.map(o => o.objective_text));

    // Update section progress with calibration data
    const progress = await this.learnerRepo.getSectionProgress(enrollmentId, sectionId);
    if (progress) {
      await this.learnerRepo.updateSectionProgress(progress.id, {
        status: 'in_progress'
      });
    }

    return analysis;
  }

  /**
   * Step 6.3: Deliver instruction via NotebookLM
   */
  async deliverInstruction(sectionId: string, notebookId: string): Promise<{
    videoUrl: string;
    podcastUrl: string;
    summary: string;
  }> {
    const section = await this.courseRepo.getSectionById(sectionId);
    if (!section) throw new Error('Section not found');

    const notebookLM = AIServiceFactory.getNotebookLMService();

    // Generate all three required formats
    const [video, podcast, summary] = await Promise.all([
      notebookLM.generateVideo(notebookId, section.title),
      notebookLM.generatePodcast(notebookId, section.title),
      notebookLM.generateSummary(notebookId, section.title)
    ]);

    // Store artifacts
    await Promise.all([
      this.assessmentRepo.createNotebookArtifact({
        notebook_id: notebookId,
        section_id: sectionId,
        artifact_type: 'video',
        content_url: video.url,
        transcript: video.transcript
      }),
      this.assessmentRepo.createNotebookArtifact({
        notebook_id: notebookId,
        section_id: sectionId,
        artifact_type: 'podcast',
        content_url: podcast.url,
        transcript: podcast.transcript
      }),
      this.assessmentRepo.createNotebookArtifact({
        notebook_id: notebookId,
        section_id: sectionId,
        artifact_type: 'summary',
        transcript: summary
      })
    ]);

    return {
      videoUrl: video.url,
      podcastUrl: podcast.url,
      summary
    };
  }

  /**
   * Step 6.4: Verify learning (micro-validation gate)
   */
  async verifyLearning(request: VerificationRequest): Promise<VerificationResult> {
    const progress = await this.learnerRepo.getSectionProgress(
      request.section_progress_id.split('_')[0], // This is a simplification
      request.section_progress_id.split('_')[1]
    );

    if (!progress) throw new Error('Section progress not found');

    const assessment = await this.assessmentRepo.getAssessmentById(request.assessment_id);
    if (!assessment) throw new Error('Assessment not found');

    // Score the response
    const score = await this.scoreResponse(assessment, request.learner_response);
    const section = await this.courseRepo.getSectionById(progress.section_id);
    const config = await this.courseRepo.getCourseConfiguration(section!.course_id);

    // Determine if passed based on thresholds
    const threshold = section?.is_critical
      ? (config?.mastery_threshold_critical || 0.9)
      : (config?.mastery_threshold_standard || 0.8);

    const passed = score >= threshold;

    // Create verification record
    await this.assessmentRepo.createVerificationRecord({
      section_progress_id: progress.id,
      assessment_id: request.assessment_id,
      learner_response: typeof request.learner_response === 'string' ? request.learner_response : JSON.stringify(request.learner_response),
      score,
      passed,
      attempt_number: progress.attempts + 1
    });

    // Increment attempts
    await this.learnerRepo.incrementSectionAttempts(progress.id);

    // Determine remediation need
    const requiresRemediation = !passed;
    let remediationType: 'analogy' | 'step_by_step' | 'common_mistakes' | undefined;

    if (requiresRemediation) {
      // Choose remediation strategy based on attempt number
      const attempts = progress.attempts + 1;
      if (attempts === 1) remediationType = 'common_mistakes';
      else if (attempts === 2) remediationType = 'step_by_step';
      else remediationType = 'analogy';
    }

    return {
      passed,
      score,
      feedback: this.generateFeedback(assessment, score, passed),
      requires_remediation: requiresRemediation,
      remediation_type: remediationType
    };
  }

  /**
   * Step 6.5: Remediation loop
   */
  async provideRemediation(
    sectionProgressId: string,
    remediationType: 'analogy' | 'step_by_step' | 'common_mistakes'
  ): Promise<string> {
    const progress = await this.learnerRepo.getSectionProgress(
      sectionProgressId.split('_')[0],
      sectionProgressId.split('_')[1]
    );

    if (!progress) throw new Error('Section progress not found');

    const section = await this.courseRepo.getSectionById(progress.section_id);
    if (!section) throw new Error('Section not found');

    // Get learner profile for personalization
    const enrollment = await this.learnerRepo.getEnrollment(progress.enrollment_id);
    const learnerProfile = await this.learnerRepo.getLearnerProfile(enrollment!.learner_id);

    // Generate remediation content
    const content = this.generateRemediationContent(
      section.title,
      remediationType,
      learnerProfile?.qualifiers || []
    );

    // Log remediation
    await this.assessmentRepo.createRemediationLog({
      section_progress_id: progress.id,
      remediation_type: remediationType,
      content_provided: content
    });

    return content;
  }

  /**
   * Step 6.6: Generate section wrap-up video
   */
  async generateSectionWrapUp(sectionId: string, enrollmentId: string): Promise<{ videoAssetId: string; jobId: string }> {
    const section = await this.courseRepo.getSectionById(sectionId);
    if (!section) throw new Error('Section not found');

    const objectives = await this.courseRepo.getSectionObjectives(sectionId);
    const enrollment = await this.learnerRepo.getEnrollment(enrollmentId);
    const learnerProfile = await this.learnerRepo.getLearnerProfile(enrollment!.learner_id);

    // Generate wrap-up script
    const script = this.createWrapUpScript(
      section.title,
      objectives.map(o => o.objective_text),
      learnerProfile
    );

    // Request video from HeyGen
    const heygenService = AIServiceFactory.getHeyGenService();
    const { jobId } = await heygenService.generateWrapUpVideo(script, 'section');

    // Create video asset record
    const videoAsset = await this.assessmentRepo.createVideoAsset({
      asset_type: 'heygen_section_wrap',
      section_id: sectionId,
      script_text: script,
      generation_status: 'processing',
      external_job_id: jobId
    });

    return { videoAssetId: videoAsset.id, jobId };
  }

  /**
   * Complete section and mark as done
   */
  async completeSection(enrollmentId: string, sectionId: string, finalScore: number): Promise<void> {
    const progress = await this.learnerRepo.getSectionProgress(enrollmentId, sectionId);
    if (!progress) throw new Error('Section progress not found');

    await this.learnerRepo.completeSection(progress.id, finalScore);

    // Log completion
    await this.assessmentRepo.logAudit({
      entity_type: 'section_progress',
      entity_id: progress.id,
      action: 'completed',
      metadata: JSON.stringify({ final_score: finalScore })
    });
  }

  // Helper methods

  private createWelcomeScript(title: string, description: string): string {
    return `Welcome to ${title}!

${description}

In this section, you'll discover why this topic matters and how it applies to your role. Get ready to expand your knowledge and skills.

Let's get started!`;
  }

  private createWrapUpScript(title: string, objectives: string[], learnerProfile: any): string {
    const takeaways = objectives.slice(0, 5).map((obj, i) => `${i + 1}. ${obj}`).join('\n');

    return `Congratulations on completing ${title}!

Here are your key takeaways:
${takeaways}

You can now:
- Apply these concepts in your work
- Build on this foundation in the next section

Great job! Let's keep moving forward.`;
  }

  private analyzeCalibrationResponses(
    responses: { question: string; answer: string }[],
    objectives: string[]
  ): CalibrationInterview {
    // Simplified analysis - in production, use LLM for deeper analysis
    const gaps: string[] = [];
    const emphasisAreas: string[] = [];

    responses.forEach(r => {
      if (r.answer.toLowerCase().includes('not sure') || r.answer.toLowerCase().includes('don\'t know')) {
        gaps.push(`Uncertainty about: ${r.question}`);
      }
    });

    return {
      section_goal: objectives[0] || 'Master this section',
      identified_gaps: gaps.length > 0 ? gaps : ['No significant gaps identified'],
      adaptation_settings: {
        emphasis_areas: emphasisAreas.length > 0 ? emphasisAreas : objectives.slice(0, 2),
        pacing_adjustment: gaps.length > 2 ? 'slower' : 'standard',
        risk_flags: []
      }
    };
  }

  private async scoreResponse(assessment: any, response: string | object): Promise<number> {
    // Simplified scoring - implement proper rubric-based scoring in production
    if (assessment.assessment_type === 'quiz') {
      const responseStr = typeof response === 'string' ? response : JSON.stringify(response);
      return responseStr === assessment.correct_answer ? 1.0 : 0.0;
    }

    // For other types, use a rubric or AI-based scoring
    return 0.85; // Mock score
  }

  private generateFeedback(assessment: any, score: number, passed: boolean): string {
    if (passed) {
      return `Excellent work! You've demonstrated strong understanding with a score of ${(score * 100).toFixed(0)}%.`;
    } else {
      return `You scored ${(score * 100).toFixed(0)}%. Let's review the material and try again. Focus on the key concepts.`;
    }
  }

  private generateRemediationContent(
    topic: string,
    type: 'analogy' | 'step_by_step' | 'common_mistakes',
    qualifiers: any[]
  ): string {
    switch (type) {
      case 'analogy':
        return `Let me explain ${topic} using an analogy from your experience...

Think of it like managing a project - you need clear goals, proper resources, and regular check-ins. Similarly, this concept requires...`;

      case 'step_by_step':
        return `Let's break down ${topic} step by step:

Step 1: Start with the fundamental concept
Step 2: Understand how it applies
Step 3: Practice with examples
Step 4: Apply it to real scenarios`;

      case 'common_mistakes':
        return `Here are common mistakes people make with ${topic}:

Mistake #1: Skipping the foundation
Mistake #2: Not practicing enough
Mistake #3: Forgetting to apply it

Let's make sure you avoid these pitfalls...`;

      default:
        return `Let's review ${topic} together.`;
    }
  }
}
