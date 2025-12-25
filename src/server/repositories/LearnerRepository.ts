import { Database } from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import {
  Learner,
  LearnerPreference,
  LearnerQualifier,
  LearnerCompetency,
  LearnerProfile,
  Enrollment,
  SectionProgress
} from '../types/models';

export class LearnerRepository {
  constructor(private db: Database) {}

  // Learner CRUD
  async createLearner(learner: Omit<Learner, 'id' | 'created_at' | 'updated_at'>): Promise<Learner> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db.run(
      `INSERT INTO learners (id, name, email, role, jurisdiction, experience_level, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, learner.name, learner.email, learner.role, learner.jurisdiction, learner.experience_level, now, now]
    );

    return this.getLearnerById(id) as Promise<Learner>;
  }

  async getLearnerById(id: string): Promise<Learner | undefined> {
    return this.db.get<Learner>('SELECT * FROM learners WHERE id = ?', [id]);
  }

  async getLearnerByEmail(email: string): Promise<Learner | undefined> {
    return this.db.get<Learner>('SELECT * FROM learners WHERE email = ?', [email]);
  }

  async getAllLearners(): Promise<Learner[]> {
    return this.db.all<Learner>('SELECT * FROM learners ORDER BY created_at DESC');
  }

  async updateLearner(id: string, updates: Partial<Learner>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    await this.db.run(
      `UPDATE learners SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  // Learner Preferences
  async setPreferences(learnerId: string, preferences: Omit<LearnerPreference, 'learner_id'>): Promise<void> {
    await this.db.run(
      `INSERT OR REPLACE INTO learner_preferences
       (learner_id, coaching_tone, format_preference, pace_preference, confidence_level)
       VALUES (?, ?, ?, ?, ?)`,
      [
        learnerId,
        preferences.coaching_tone,
        preferences.format_preference,
        preferences.pace_preference,
        preferences.confidence_level
      ]
    );
  }

  async getPreferences(learnerId: string): Promise<LearnerPreference | undefined> {
    return this.db.get<LearnerPreference>(
      'SELECT * FROM learner_preferences WHERE learner_id = ?',
      [learnerId]
    );
  }

  // Learner Qualifiers
  async addQualifier(learnerId: string, qualifier: Omit<LearnerQualifier, 'id' | 'created_at'>): Promise<void> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db.run(
      'INSERT INTO learner_qualifiers (id, learner_id, qualifier_type, qualifier_value, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, learnerId, qualifier.qualifier_type, qualifier.qualifier_value, now]
    );
  }

  async getQualifiers(learnerId: string): Promise<LearnerQualifier[]> {
    return this.db.all<LearnerQualifier>(
      'SELECT * FROM learner_qualifiers WHERE learner_id = ?',
      [learnerId]
    );
  }

  // Learner Competencies
  async updateCompetency(learnerId: string, outcomeId: string, masteryLevel: number): Promise<void> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db.run(
      `INSERT OR REPLACE INTO learner_competencies (id, learner_id, outcome_id, mastery_level, last_assessed)
       VALUES (?, ?, ?, ?, ?)`,
      [id, learnerId, outcomeId, masteryLevel, now]
    );
  }

  async getCompetencies(learnerId: string): Promise<LearnerCompetency[]> {
    return this.db.all<LearnerCompetency>(
      'SELECT * FROM learner_competencies WHERE learner_id = ?',
      [learnerId]
    );
  }

  // Full Learner Profile
  async getLearnerProfile(learnerId: string): Promise<LearnerProfile | null> {
    const learner = await this.getLearnerById(learnerId);
    if (!learner) return null;

    const preferences = await this.getPreferences(learnerId);
    const qualifiers = await this.getQualifiers(learnerId);
    const competencies = await this.getCompetencies(learnerId);

    return {
      learner,
      preferences,
      qualifiers,
      competencies
    };
  }

  // Enrollments
  async enrollLearner(learnerId: string, courseId: string): Promise<Enrollment> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db.run(
      'INSERT INTO enrollments (id, learner_id, course_id, status, enrolled_at) VALUES (?, ?, ?, ?, ?)',
      [id, learnerId, courseId, 'active', now]
    );

    return this.db.get<Enrollment>('SELECT * FROM enrollments WHERE id = ?', [id]) as Promise<Enrollment>;
  }

  async getEnrollment(enrollmentId: string): Promise<Enrollment | undefined> {
    return this.db.get<Enrollment>('SELECT * FROM enrollments WHERE id = ?', [enrollmentId]);
  }

  async getLearnerEnrollments(learnerId: string): Promise<Enrollment[]> {
    return this.db.all<Enrollment>(
      'SELECT * FROM enrollments WHERE learner_id = ? ORDER BY enrolled_at DESC',
      [learnerId]
    );
  }

  async getCourseEnrollment(learnerId: string, courseId: string): Promise<Enrollment | undefined> {
    return this.db.get<Enrollment>(
      'SELECT * FROM enrollments WHERE learner_id = ? AND course_id = ?',
      [learnerId, courseId]
    );
  }

  async updateEnrollmentStatus(enrollmentId: string, status: 'active' | 'completed' | 'withdrawn', finalScore?: number): Promise<void> {
    const updates: any[] = [status];
    let sql = 'UPDATE enrollments SET status = ?';

    if (status === 'completed') {
      sql += ', completed_at = ?, final_score = ?';
      updates.push(new Date().toISOString(), finalScore || null);
    }

    sql += ' WHERE id = ?';
    updates.push(enrollmentId);

    await this.db.run(sql, updates);
  }

  // Section Progress
  async initializeSectionProgress(enrollmentId: string, sectionId: string): Promise<SectionProgress> {
    const id = uuidv4();

    await this.db.run(
      `INSERT INTO section_progress (id, enrollment_id, section_id, status, attempts)
       VALUES (?, ?, ?, 'not_started', 0)`,
      [id, enrollmentId, sectionId]
    );

    return this.db.get<SectionProgress>('SELECT * FROM section_progress WHERE id = ?', [id]) as Promise<SectionProgress>;
  }

  async getSectionProgress(enrollmentId: string, sectionId: string): Promise<SectionProgress | undefined> {
    return this.db.get<SectionProgress>(
      'SELECT * FROM section_progress WHERE enrollment_id = ? AND section_id = ?',
      [enrollmentId, sectionId]
    );
  }

  async getAllSectionProgress(enrollmentId: string): Promise<SectionProgress[]> {
    return this.db.all<SectionProgress>(
      'SELECT * FROM section_progress WHERE enrollment_id = ?',
      [enrollmentId]
    );
  }

  async updateSectionProgress(
    progressId: string,
    updates: Partial<SectionProgress>
  ): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'enrollment_id' && key !== 'section_id') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    });

    values.push(progressId);

    await this.db.run(
      `UPDATE section_progress SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async startSection(progressId: string): Promise<void> {
    await this.db.run(
      `UPDATE section_progress SET status = 'in_progress', started_at = ? WHERE id = ?`,
      [new Date().toISOString(), progressId]
    );
  }

  async completeSection(progressId: string, masteryScore: number): Promise<void> {
    await this.db.run(
      `UPDATE section_progress SET status = 'completed', completed_at = ?, mastery_score = ? WHERE id = ?`,
      [new Date().toISOString(), masteryScore, progressId]
    );
  }

  async incrementSectionAttempts(progressId: string): Promise<void> {
    await this.db.run(
      'UPDATE section_progress SET attempts = attempts + 1 WHERE id = ?',
      [progressId]
    );
  }
}
