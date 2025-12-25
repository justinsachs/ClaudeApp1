import { Database } from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import {
  Assessment,
  AssessmentOption,
  VerificationRecord,
  RemediationLog,
  VideoAsset,
  NotebookLMArtifact,
  CompletionRecord,
  AuditTrail
} from '../types/models';

export class AssessmentRepository {
  constructor(private db: Database) {}

  // Assessments
  async createAssessment(assessment: Omit<Assessment, 'id' | 'created_at'>): Promise<Assessment> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db.run(
      `INSERT INTO assessments (id, section_id, course_id, assessment_type, question_text,
       correct_answer, rubric, difficulty_level, tags, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        assessment.section_id,
        assessment.course_id,
        assessment.assessment_type,
        assessment.question_text,
        assessment.correct_answer,
        assessment.rubric,
        assessment.difficulty_level,
        assessment.tags,
        now
      ]
    );

    return this.db.get<Assessment>('SELECT * FROM assessments WHERE id = ?', [id]) as Promise<Assessment>;
  }

  async getAssessmentById(id: string): Promise<Assessment | undefined> {
    return this.db.get<Assessment>('SELECT * FROM assessments WHERE id = ?', [id]);
  }

  async getSectionAssessments(sectionId: string): Promise<Assessment[]> {
    return this.db.all<Assessment>(
      'SELECT * FROM assessments WHERE section_id = ?',
      [sectionId]
    );
  }

  async getCourseAssessments(courseId: string): Promise<Assessment[]> {
    return this.db.all<Assessment>(
      'SELECT * FROM assessments WHERE course_id = ? AND section_id IS NULL',
      [courseId]
    );
  }

  // Assessment Options (for MCQ)
  async addAssessmentOption(assessmentId: string, option: Omit<AssessmentOption, 'id'>): Promise<void> {
    const id = uuidv4();

    await this.db.run(
      'INSERT INTO assessment_options (id, assessment_id, option_text, is_correct, order_index) VALUES (?, ?, ?, ?, ?)',
      [id, assessmentId, option.option_text, option.is_correct ? 1 : 0, option.order_index]
    );
  }

  async getAssessmentOptions(assessmentId: string): Promise<AssessmentOption[]> {
    return this.db.all<AssessmentOption>(
      'SELECT * FROM assessment_options WHERE assessment_id = ? ORDER BY order_index',
      [assessmentId]
    );
  }

  // Verification Records
  async createVerificationRecord(record: Omit<VerificationRecord, 'id' | 'verified_at'>): Promise<VerificationRecord> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db.run(
      `INSERT INTO verification_records (id, section_progress_id, assessment_id, learner_response,
       score, passed, attempt_number, verified_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        record.section_progress_id,
        record.assessment_id,
        record.learner_response,
        record.score,
        record.passed ? 1 : 0,
        record.attempt_number,
        now
      ]
    );

    return this.db.get<VerificationRecord>('SELECT * FROM verification_records WHERE id = ?', [id]) as Promise<VerificationRecord>;
  }

  async getVerificationRecords(sectionProgressId: string): Promise<VerificationRecord[]> {
    return this.db.all<VerificationRecord>(
      'SELECT * FROM verification_records WHERE section_progress_id = ? ORDER BY verified_at',
      [sectionProgressId]
    );
  }

  async getLatestVerification(sectionProgressId: string): Promise<VerificationRecord | undefined> {
    return this.db.get<VerificationRecord>(
      'SELECT * FROM verification_records WHERE section_progress_id = ? ORDER BY verified_at DESC LIMIT 1',
      [sectionProgressId]
    );
  }

  // Remediation Logs
  async createRemediationLog(log: Omit<RemediationLog, 'id' | 'created_at'>): Promise<RemediationLog> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db.run(
      `INSERT INTO remediation_logs (id, section_progress_id, verification_record_id,
       remediation_type, content_provided, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, log.section_progress_id, log.verification_record_id, log.remediation_type, log.content_provided, now]
    );

    return this.db.get<RemediationLog>('SELECT * FROM remediation_logs WHERE id = ?', [id]) as Promise<RemediationLog>;
  }

  async getRemediationLogs(sectionProgressId: string): Promise<RemediationLog[]> {
    return this.db.all<RemediationLog>(
      'SELECT * FROM remediation_logs WHERE section_progress_id = ? ORDER BY created_at',
      [sectionProgressId]
    );
  }

  // Video Assets
  async createVideoAsset(asset: Omit<VideoAsset, 'id' | 'created_at'>): Promise<VideoAsset> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db.run(
      `INSERT INTO video_assets (id, asset_type, section_id, course_id, script_text,
       video_url, generation_status, external_job_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        asset.asset_type,
        asset.section_id,
        asset.course_id,
        asset.script_text,
        asset.video_url,
        asset.generation_status,
        asset.external_job_id,
        now
      ]
    );

    return this.db.get<VideoAsset>('SELECT * FROM video_assets WHERE id = ?', [id]) as Promise<VideoAsset>;
  }

  async getVideoAsset(id: string): Promise<VideoAsset | undefined> {
    return this.db.get<VideoAsset>('SELECT * FROM video_assets WHERE id = ?', [id]);
  }

  async updateVideoAsset(id: string, updates: Partial<VideoAsset>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    values.push(id);

    await this.db.run(
      `UPDATE video_assets SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async getSectionVideo(sectionId: string, assetType: string): Promise<VideoAsset | undefined> {
    return this.db.get<VideoAsset>(
      'SELECT * FROM video_assets WHERE section_id = ? AND asset_type = ? ORDER BY created_at DESC LIMIT 1',
      [sectionId, assetType]
    );
  }

  // NotebookLM Artifacts
  async createNotebookArtifact(artifact: Omit<NotebookLMArtifact, 'id' | 'created_at'>): Promise<NotebookLMArtifact> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db.run(
      `INSERT INTO notebooklm_artifacts (id, notebook_id, section_id, artifact_type,
       content_url, transcript, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, artifact.notebook_id, artifact.section_id, artifact.artifact_type, artifact.content_url, artifact.transcript, now]
    );

    return this.db.get<NotebookLMArtifact>('SELECT * FROM notebooklm_artifacts WHERE id = ?', [id]) as Promise<NotebookLMArtifact>;
  }

  async getSectionArtifacts(sectionId: string): Promise<NotebookLMArtifact[]> {
    return this.db.all<NotebookLMArtifact>(
      'SELECT * FROM notebooklm_artifacts WHERE section_id = ?',
      [sectionId]
    );
  }

  // Completion Records
  async createCompletionRecord(record: Omit<CompletionRecord, 'id' | 'completion_date'>): Promise<CompletionRecord> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db.run(
      `INSERT INTO completion_records (id, enrollment_id, completion_date, final_score,
       certificate_issued, certificate_url, next_steps)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        record.enrollment_id,
        now,
        record.final_score,
        record.certificate_issued ? 1 : 0,
        record.certificate_url,
        record.next_steps
      ]
    );

    return this.db.get<CompletionRecord>('SELECT * FROM completion_records WHERE id = ?', [id]) as Promise<CompletionRecord>;
  }

  async getCompletionRecord(enrollmentId: string): Promise<CompletionRecord | undefined> {
    return this.db.get<CompletionRecord>(
      'SELECT * FROM completion_records WHERE enrollment_id = ?',
      [enrollmentId]
    );
  }

  // Audit Trail
  async logAudit(log: Omit<AuditTrail, 'id' | 'created_at'>): Promise<void> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db.run(
      `INSERT INTO audit_trail (id, entity_type, entity_id, action, actor_id,
       actor_type, changes, metadata, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        log.entity_type,
        log.entity_id,
        log.action,
        log.actor_id,
        log.actor_type,
        log.changes,
        log.metadata,
        now
      ]
    );
  }

  async getAuditTrail(entityType: string, entityId: string): Promise<AuditTrail[]> {
    return this.db.all<AuditTrail>(
      'SELECT * FROM audit_trail WHERE entity_type = ? AND entity_id = ? ORDER BY created_at DESC',
      [entityType, entityId]
    );
  }
}
