import { Database } from '../db/database';
import { v4 as uuidv4 } from 'uuid';
import {
  Course,
  LearningOutcome,
  Section,
  SectionObjective,
  CourseConfiguration,
  CourseDefinitionPackage,
  Source,
  SectionSource
} from '../types/models';

export class CourseRepository {
  constructor(private db: Database) {}

  async createCourse(course: Omit<Course, 'id' | 'created_at' | 'updated_at'>): Promise<Course> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db.run(
      `INSERT INTO courses (id, title, description, target_learner_profile, prerequisites,
       estimated_duration, version, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        course.title,
        course.description,
        course.target_learner_profile,
        course.prerequisites,
        course.estimated_duration,
        course.version || '1.0',
        course.status,
        course.created_by,
        now,
        now
      ]
    );

    return this.getCourseById(id) as Promise<Course>;
  }

  async getCourseById(id: string): Promise<Course | undefined> {
    return this.db.get<Course>('SELECT * FROM courses WHERE id = ?', [id]);
  }

  async getAllCourses(status?: string): Promise<Course[]> {
    if (status) {
      return this.db.all<Course>('SELECT * FROM courses WHERE status = ? ORDER BY created_at DESC', [status]);
    }
    return this.db.all<Course>('SELECT * FROM courses ORDER BY created_at DESC');
  }

  async updateCourse(id: string, updates: Partial<Course>): Promise<void> {
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
      `UPDATE courses SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  }

  async publishCourse(id: string): Promise<void> {
    await this.db.run(
      'UPDATE courses SET status = ?, published_at = ?, updated_at = ? WHERE id = ?',
      ['published', new Date().toISOString(), new Date().toISOString(), id]
    );
  }

  async deleteCourse(id: string): Promise<void> {
    await this.db.run('DELETE FROM courses WHERE id = ?', [id]);
  }

  // Learning Outcomes
  async addLearningOutcome(courseId: string, outcome: Omit<LearningOutcome, 'id' | 'course_id'>): Promise<LearningOutcome> {
    const id = uuidv4();

    await this.db.run(
      `INSERT INTO learning_outcomes (id, course_id, outcome_text, performance_verb, assessment_criteria, order_index)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, courseId, outcome.outcome_text, outcome.performance_verb, outcome.assessment_criteria, outcome.order_index]
    );

    return this.db.get<LearningOutcome>('SELECT * FROM learning_outcomes WHERE id = ?', [id]) as Promise<LearningOutcome>;
  }

  async getLearningOutcomes(courseId: string): Promise<LearningOutcome[]> {
    return this.db.all<LearningOutcome>(
      'SELECT * FROM learning_outcomes WHERE course_id = ? ORDER BY order_index',
      [courseId]
    );
  }

  // Sections
  async createSection(courseId: string, section: Omit<Section, 'id' | 'course_id'>): Promise<Section> {
    const id = uuidv4();

    await this.db.run(
      `INSERT INTO sections (id, course_id, title, description, order_index, is_critical,
       criticality_reason, estimated_duration, notebooklm_notebook_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        courseId,
        section.title,
        section.description,
        section.order_index,
        section.is_critical ? 1 : 0,
        section.criticality_reason,
        section.estimated_duration,
        section.notebooklm_notebook_id
      ]
    );

    return this.db.get<Section>('SELECT * FROM sections WHERE id = ?', [id]) as Promise<Section>;
  }

  async getSections(courseId: string): Promise<Section[]> {
    return this.db.all<Section>(
      'SELECT * FROM sections WHERE course_id = ? ORDER BY order_index',
      [courseId]
    );
  }

  async getSectionById(id: string): Promise<Section | undefined> {
    return this.db.get<Section>('SELECT * FROM sections WHERE id = ?', [id]);
  }

  // Section Objectives
  async addSectionObjective(sectionId: string, objective: Omit<SectionObjective, 'id' | 'section_id'>): Promise<SectionObjective> {
    const id = uuidv4();

    await this.db.run(
      'INSERT INTO section_objectives (id, section_id, objective_text, order_index) VALUES (?, ?, ?, ?)',
      [id, sectionId, objective.objective_text, objective.order_index]
    );

    return this.db.get<SectionObjective>('SELECT * FROM section_objectives WHERE id = ?', [id]) as Promise<SectionObjective>;
  }

  async getSectionObjectives(sectionId: string): Promise<SectionObjective[]> {
    return this.db.all<SectionObjective>(
      'SELECT * FROM section_objectives WHERE section_id = ? ORDER BY order_index',
      [sectionId]
    );
  }

  // Section-Source Mapping
  async linkSourceToSection(sectionId: string, sourceId: string): Promise<void> {
    await this.db.run(
      'INSERT OR IGNORE INTO section_sources (section_id, source_id) VALUES (?, ?)',
      [sectionId, sourceId]
    );
  }

  async getSectionSources(sectionId: string): Promise<Source[]> {
    return this.db.all<Source>(
      `SELECT s.* FROM sources s
       INNER JOIN section_sources ss ON s.id = ss.source_id
       WHERE ss.section_id = ?`,
      [sectionId]
    );
  }

  // Course Configuration
  async setCourseConfiguration(config: CourseConfiguration): Promise<void> {
    await this.db.run(
      `INSERT OR REPLACE INTO course_configuration
       (course_id, mastery_threshold_standard, mastery_threshold_critical,
        retry_limit_standard, retry_limit_critical, media_formats,
        heygen_mandatory, compliance_calendar_enabled, manager_dashboard_enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        config.course_id,
        config.mastery_threshold_standard,
        config.mastery_threshold_critical,
        config.retry_limit_standard,
        config.retry_limit_critical,
        config.media_formats,
        config.heygen_mandatory ? 1 : 0,
        config.compliance_calendar_enabled ? 1 : 0,
        config.manager_dashboard_enabled ? 1 : 0
      ]
    );
  }

  async getCourseConfiguration(courseId: string): Promise<CourseConfiguration | undefined> {
    return this.db.get<CourseConfiguration>(
      'SELECT * FROM course_configuration WHERE course_id = ?',
      [courseId]
    );
  }

  // Complete Course Package
  async createCoursePackage(cdp: CourseDefinitionPackage): Promise<string> {
    // Create course
    const course = await this.createCourse(cdp.course);
    const courseId = course.id;

    // Add learning outcomes
    for (const outcome of cdp.outcomes) {
      await this.addLearningOutcome(courseId, outcome);
    }

    // Add sections with objectives and sources
    for (const sectionData of cdp.sections) {
      const section = await this.createSection(courseId, sectionData.section);

      // Add objectives
      for (const objective of sectionData.objectives) {
        await this.addSectionObjective(section.id, objective);
      }

      // Link sources
      for (const sourceId of sectionData.sources) {
        await this.linkSourceToSection(section.id, sourceId);
      }
    }

    // Set configuration
    if (cdp.configuration) {
      await this.setCourseConfiguration({
        course_id: courseId,
        mastery_threshold_standard: cdp.configuration.mastery_threshold_standard || 0.8,
        mastery_threshold_critical: cdp.configuration.mastery_threshold_critical || 0.9,
        retry_limit_standard: cdp.configuration.retry_limit_standard || 3,
        retry_limit_critical: cdp.configuration.retry_limit_critical || 999,
        media_formats: cdp.configuration.media_formats || JSON.stringify(['audio', 'video', 'text']),
        heygen_mandatory: cdp.configuration.heygen_mandatory ?? true,
        compliance_calendar_enabled: cdp.configuration.compliance_calendar_enabled ?? false,
        manager_dashboard_enabled: cdp.configuration.manager_dashboard_enabled ?? false
      });
    }

    return courseId;
  }

  async getFullCourse(courseId: string) {
    const course = await this.getCourseById(courseId);
    if (!course) return null;

    const outcomes = await this.getLearningOutcomes(courseId);
    const sections = await this.getSections(courseId);
    const configuration = await this.getCourseConfiguration(courseId);

    const sectionsWithDetails = await Promise.all(
      sections.map(async (section) => ({
        ...section,
        objectives: await this.getSectionObjectives(section.id),
        sources: await this.getSectionSources(section.id)
      }))
    );

    return {
      course,
      outcomes,
      sections: sectionsWithDetails,
      configuration
    };
  }
}
