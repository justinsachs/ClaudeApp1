/**
 * Course Creator Service
 * Provides "plug and play" course building interface for Course Creators
 * Maintains structured 6-step section flow while allowing drag-and-drop style editing
 */

import { Database } from '../db/database';
import { CourseDraft, CourseDraftData, SectionBuilderRequest } from '../types/rbac-models';
import { CourseRepository } from '../repositories/CourseRepository';
import { SourceRepository } from '../repositories/SourceRepository';

export class CourseCreatorService {
  private db: Database;
  private courseRepo: CourseRepository;
  private sourceRepo: SourceRepository;

  constructor(database: Database) {
    this.db = database;
    this.courseRepo = new CourseRepository(database);
    this.sourceRepo = new SourceRepository(database);
  }

  // ============================================
  // Course Draft Management
  // ============================================

  /**
   * Start building a new course
   * Creates a draft that can be edited before publishing
   */
  async startCourseBuilder(
    creatorId: string,
    deploymentId: string,
    initialData: {
      title: string;
      description: string;
      target_learner_profile?: string;
      prerequisites?: string;
    }
  ): Promise<CourseDraft> {
    const draftId = `draft_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const draftData: CourseDraftData = {
      course: {
        title: initialData.title,
        description: initialData.description,
        target_learner_profile: initialData.target_learner_profile,
        prerequisites: initialData.prerequisites
      },
      outcomes: [],
      sections: []
    };

    await this.db.run(
      `INSERT INTO course_drafts (id, creator_id, deployment_id, draft_data, status)
       VALUES (?, ?, ?, ?, ?)`,
      [draftId, creatorId, deploymentId, JSON.stringify(draftData), 'building']
    );

    const draft = await this.db.get<CourseDraft>(`SELECT * FROM course_drafts WHERE id = ?`, [draftId]);
    if (!draft) {
      throw new Error(`Failed to create draft with id ${draftId}`);
    }
    return draft;
  }

  /**
   * Get draft by ID
   */
  async getDraft(draftId: string): Promise<CourseDraft | null> {
    return this.db.get(`SELECT * FROM course_drafts WHERE id = ?`, [draftId]) as Promise<CourseDraft | null>;
  }

  /**
   * Get all drafts for a creator
   */
  async getCreatorDrafts(creatorId: string): Promise<CourseDraft[]> {
    return this.db.all(
      `SELECT * FROM course_drafts WHERE creator_id = ? ORDER BY updated_at DESC`,
      [creatorId]
    ) as Promise<CourseDraft[]>;
  }

  /**
   * Update course basic info
   */
  async updateCourseInfo(
    draftId: string,
    updates: {
      title?: string;
      description?: string;
      target_learner_profile?: string;
      prerequisites?: string;
      estimated_duration?: number;
    }
  ): Promise<CourseDraft> {
    const draft = await this.getDraft(draftId);
    if (!draft) throw new Error('Draft not found');

    const draftData: CourseDraftData = JSON.parse(draft.draft_data);

    // Update course fields
    if (updates.title) draftData.course.title = updates.title;
    if (updates.description) draftData.course.description = updates.description;
    if (updates.target_learner_profile !== undefined) {
      draftData.course.target_learner_profile = updates.target_learner_profile;
    }
    if (updates.prerequisites !== undefined) {
      draftData.course.prerequisites = updates.prerequisites;
    }
    if (updates.estimated_duration !== undefined) {
      draftData.course.estimated_duration = updates.estimated_duration;
    }

    await this.db.run(
      `UPDATE course_drafts SET draft_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [JSON.stringify(draftData), draftId]
    );

    return this.getDraft(draftId) as Promise<CourseDraft>;
  }

  // ============================================
  // Learning Outcomes
  // ============================================

  /**
   * Add a learning outcome
   */
  async addLearningOutcome(
    draftId: string,
    outcome: {
      outcome_text: string;
      performance_verb: string;
      assessment_criteria?: string;
    }
  ): Promise<CourseDraft> {
    const draft = await this.getDraft(draftId);
    if (!draft) throw new Error('Draft not found');

    const draftData: CourseDraftData = JSON.parse(draft.draft_data);

    draftData.outcomes.push({
      ...outcome,
      order_index: draftData.outcomes.length
    });

    await this.db.run(
      `UPDATE course_drafts SET draft_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [JSON.stringify(draftData), draftId]
    );

    return this.getDraft(draftId) as Promise<CourseDraft>;
  }

  /**
   * Reorder outcomes (drag and drop)
   */
  async reorderOutcomes(draftId: string, outcomeIndices: number[]): Promise<CourseDraft> {
    const draft = await this.getDraft(draftId);
    if (!draft) throw new Error('Draft not found');

    const draftData: CourseDraftData = JSON.parse(draft.draft_data);

    const reordered = outcomeIndices.map((oldIndex, newIndex) => ({
      ...draftData.outcomes[oldIndex],
      order_index: newIndex
    }));

    draftData.outcomes = reordered;

    await this.db.run(
      `UPDATE course_drafts SET draft_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [JSON.stringify(draftData), draftId]
    );

    return this.getDraft(draftId) as Promise<CourseDraft>;
  }

  /**
   * Remove a learning outcome
   */
  async removeLearningOutcome(draftId: string, outcomeIndex: number): Promise<CourseDraft> {
    const draft = await this.getDraft(draftId);
    if (!draft) throw new Error('Draft not found');

    const draftData: CourseDraftData = JSON.parse(draft.draft_data);

    draftData.outcomes.splice(outcomeIndex, 1);

    // Re-index remaining outcomes
    draftData.outcomes.forEach((outcome, index) => {
      outcome.order_index = index;
    });

    await this.db.run(
      `UPDATE course_drafts SET draft_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [JSON.stringify(draftData), draftId]
    );

    return this.getDraft(draftId) as Promise<CourseDraft>;
  }

  // ============================================
  // Sections (Maintaining 6-step structure)
  // ============================================

  /**
   * Add a section with structured 6-step flow
   * The 6 steps are automatic: Welcome → Calibration → Instruction → Assessment → Remediation → Wrap-up
   */
  async addSection(
    draftId: string,
    section: SectionBuilderRequest
  ): Promise<CourseDraft> {
    const draft = await this.getDraft(draftId);
    if (!draft) throw new Error('Draft not found');

    const draftData: CourseDraftData = JSON.parse(draft.draft_data);

    // Validate source IDs exist
    for (const sourceId of section.source_ids) {
      const source = await this.sourceRepo.getSource(sourceId);
      if (!source) {
        throw new Error(`Source not found: ${sourceId}`);
      }
    }

    const newSection = {
      section: {
        title: section.title,
        description: section.description,
        order_index: section.order_index !== undefined ? section.order_index : draftData.sections.length,
        is_critical: section.is_critical,
        criticality_reason: section.criticality_reason,
        estimated_duration: undefined
      },
      objectives: section.objectives.map((obj, index) => ({
        objective_text: obj,
        order_index: index
      })),
      source_ids: section.source_ids
    };

    draftData.sections.push(newSection);

    await this.db.run(
      `UPDATE course_drafts SET draft_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [JSON.stringify(draftData), draftId]
    );

    return this.getDraft(draftId) as Promise<CourseDraft>;
  }

  /**
   * Update section details
   */
  async updateSection(
    draftId: string,
    sectionIndex: number,
    updates: Partial<SectionBuilderRequest>
  ): Promise<CourseDraft> {
    const draft = await this.getDraft(draftId);
    if (!draft) throw new Error('Draft not found');

    const draftData: CourseDraftData = JSON.parse(draft.draft_data);

    if (sectionIndex < 0 || sectionIndex >= draftData.sections.length) {
      throw new Error('Invalid section index');
    }

    const section = draftData.sections[sectionIndex];

    if (updates.title) section.section.title = updates.title;
    if (updates.description !== undefined) section.section.description = updates.description;
    if (updates.is_critical !== undefined) section.section.is_critical = updates.is_critical;
    if (updates.criticality_reason !== undefined) {
      section.section.criticality_reason = updates.criticality_reason;
    }

    if (updates.objectives) {
      section.objectives = updates.objectives.map((obj, index) => ({
        objective_text: obj,
        order_index: index
      }));
    }

    if (updates.source_ids) {
      // Validate source IDs
      for (const sourceId of updates.source_ids) {
        const source = await this.sourceRepo.getSource(sourceId);
        if (!source) {
          throw new Error(`Source not found: ${sourceId}`);
        }
      }
      section.source_ids = updates.source_ids;
    }

    await this.db.run(
      `UPDATE course_drafts SET draft_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [JSON.stringify(draftData), draftId]
    );

    return this.getDraft(draftId) as Promise<CourseDraft>;
  }

  /**
   * Reorder sections (drag and drop)
   */
  async reorderSections(draftId: string, sectionIndices: number[]): Promise<CourseDraft> {
    const draft = await this.getDraft(draftId);
    if (!draft) throw new Error('Draft not found');

    const draftData: CourseDraftData = JSON.parse(draft.draft_data);

    const reordered = sectionIndices.map((oldIndex, newIndex) => {
      const section = draftData.sections[oldIndex];
      return {
        ...section,
        section: {
          ...section.section,
          order_index: newIndex
        }
      };
    });

    draftData.sections = reordered;

    await this.db.run(
      `UPDATE course_drafts SET draft_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [JSON.stringify(draftData), draftId]
    );

    return this.getDraft(draftId) as Promise<CourseDraft>;
  }

  /**
   * Remove a section
   */
  async removeSection(draftId: string, sectionIndex: number): Promise<CourseDraft> {
    const draft = await this.getDraft(draftId);
    if (!draft) throw new Error('Draft not found');

    const draftData: CourseDraftData = JSON.parse(draft.draft_data);

    draftData.sections.splice(sectionIndex, 1);

    // Re-index remaining sections
    draftData.sections.forEach((section, index) => {
      section.section.order_index = index;
    });

    await this.db.run(
      `UPDATE course_drafts SET draft_data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [JSON.stringify(draftData), draftId]
    );

    return this.getDraft(draftId) as Promise<CourseDraft>;
  }

  // ============================================
  // Publishing
  // ============================================

  /**
   * Mark draft as ready for review
   */
  async markForReview(draftId: string): Promise<CourseDraft> {
    await this.db.run(
      `UPDATE course_drafts SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      ['review', draftId]
    );

    return this.getDraft(draftId) as Promise<CourseDraft>;
  }

  /**
   * Publish course (convert draft to actual course)
   */
  async publishCourse(draftId: string, creatorId: string): Promise<{ courseId: string; draft: CourseDraft }> {
    const draft = await this.getDraft(draftId);
    if (!draft) throw new Error('Draft not found');

    if (draft.creator_id !== creatorId) {
      throw new Error('Unauthorized: Not the course creator');
    }

    const draftData: CourseDraftData = JSON.parse(draft.draft_data);

    // Validate draft has required data
    if (!draftData.course.title || !draftData.course.description) {
      throw new Error('Course must have title and description');
    }

    if (draftData.sections.length === 0) {
      throw new Error('Course must have at least one section');
    }

    // Create the actual course using CourseRepository
    const coursePackage = {
      course: {
        ...draftData.course,
        version: '1.0',
        status: 'published' as const,
        created_by: creatorId
      },
      outcomes: draftData.outcomes,
      sections: draftData.sections.map(s => ({
        section: s.section,
        objectives: s.objectives,
        sources: s.source_ids
      }))
    };

    const courseId = await this.courseRepo.createCoursePackage(coursePackage);

    // Update draft to link to published course
    await this.db.run(
      `UPDATE course_drafts SET course_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [courseId, 'published', draftId]
    );

    // Update creator's course count
    await this.db.run(
      `UPDATE creator_profiles SET courses_created = courses_created + 1 WHERE user_id = ?`,
      [creatorId]
    );

    const updatedDraft = await this.getDraft(draftId);
    if (!updatedDraft) {
      throw new Error(`Failed to retrieve updated draft with id ${draftId}`);
    }

    return {
      courseId: courseId,
      draft: updatedDraft
    };
  }

  /**
   * Duplicate a draft (for creating variations)
   */
  async duplicateDraft(draftId: string, creatorId: string): Promise<CourseDraft> {
    const draft = await this.getDraft(draftId);
    if (!draft) throw new Error('Draft not found');

    const newDraftId = `draft_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    const draftData: CourseDraftData = JSON.parse(draft.draft_data);
    draftData.course.title = `${draftData.course.title} (Copy)`;

    await this.db.run(
      `INSERT INTO course_drafts (id, creator_id, deployment_id, draft_data, status)
       VALUES (?, ?, ?, ?, ?)`,
      [newDraftId, creatorId, draft.deployment_id, JSON.stringify(draftData), 'building']
    );

    return this.getDraft(newDraftId) as Promise<CourseDraft>;
  }

  /**
   * Delete a draft
   */
  async deleteDraft(draftId: string, creatorId: string): Promise<void> {
    const draft = await this.getDraft(draftId);
    if (!draft) throw new Error('Draft not found');

    if (draft.creator_id !== creatorId) {
      throw new Error('Unauthorized: Not the course creator');
    }

    if (draft.status === 'published') {
      throw new Error('Cannot delete published draft. Unpublish the course first.');
    }

    await this.db.run(`DELETE FROM course_drafts WHERE id = ?`, [draftId]);
  }

  // ============================================
  // Preview & Validation
  // ============================================

  /**
   * Validate draft structure
   */
  async validateDraft(draftId: string): Promise<{ valid: boolean; errors: string[] }> {
    const draft = await this.getDraft(draftId);
    if (!draft) return { valid: false, errors: ['Draft not found'] };

    const draftData: CourseDraftData = JSON.parse(draft.draft_data);
    const errors: string[] = [];

    // Validate course
    if (!draftData.course.title) errors.push('Course title is required');
    if (!draftData.course.description) errors.push('Course description is required');

    // Validate outcomes
    if (draftData.outcomes.length === 0) {
      errors.push('At least one learning outcome is required');
    }

    // Validate sections
    if (draftData.sections.length === 0) {
      errors.push('At least one section is required');
    }

    for (let i = 0; i < draftData.sections.length; i++) {
      const section = draftData.sections[i];
      if (!section.section.title) {
        errors.push(`Section ${i + 1}: Title is required`);
      }
      if (section.objectives.length === 0) {
        errors.push(`Section ${i + 1}: At least one objective is required`);
      }
      if (section.source_ids.length === 0) {
        errors.push(`Section ${i + 1}: At least one source is required for grounding`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get course preview (what students will see)
   */
  async getPreview(draftId: string): Promise<any> {
    const draft = await this.getDraft(draftId);
    if (!draft) throw new Error('Draft not found');

    const draftData: CourseDraftData = JSON.parse(draft.draft_data);

    // Load source details
    const sectionsWithSources = await Promise.all(
      draftData.sections.map(async (section) => {
        const sources = await Promise.all(
          section.source_ids.map(id => this.sourceRepo.getSource(id))
        );

        return {
          ...section,
          sources: sources.filter(s => s !== null)
        };
      })
    );

    return {
      course: draftData.course,
      outcomes: draftData.outcomes,
      sections: sectionsWithSources,
      stats: {
        total_sections: draftData.sections.length,
        total_outcomes: draftData.outcomes.length,
        total_sources: [...new Set(draftData.sections.flatMap(s => s.source_ids))].length,
        estimated_duration: draftData.course.estimated_duration ||
          draftData.sections.reduce((sum, s) => sum + (s.section.estimated_duration || 60), 0)
      }
    };
  }
}
