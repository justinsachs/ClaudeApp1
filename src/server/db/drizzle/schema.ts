/**
 * Drizzle ORM Schema Definition
 * Defines all database tables using Drizzle ORM
 * Supports PostgreSQL, MySQL, and SQLite (for local development)
 */

import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  real,
  uuid,
  json,
  serial
} from 'drizzle-orm/pg-core';

// ============================================
// Core Tables
// ============================================

export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  description: text('description'),
  target_learner_profile: text('target_learner_profile'),
  prerequisites: text('prerequisites'),
  estimated_duration: integer('estimated_duration'),
  version: text('version').default('1.0'),
  status: text('status').notNull().default('draft'), // draft, review, published, archived
  created_by: text('created_by').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
  published_at: timestamp('published_at'),
});

export const learningOutcomes = pgTable('learning_outcomes', {
  id: uuid('id').primaryKey().defaultRandom(),
  course_id: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  outcome_text: text('outcome_text').notNull(),
  performance_verb: text('performance_verb').notNull(),
  order_index: integer('order_index').notNull(),
  assessment_criteria: text('assessment_criteria'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const sections = pgTable('sections', {
  id: uuid('id').primaryKey().defaultRandom(),
  course_id: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  order_index: integer('order_index').notNull(),
  is_critical: boolean('is_critical').default(false),
  estimated_duration: integer('estimated_duration'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const sectionObjectives = pgTable('section_objectives', {
  id: uuid('id').primaryKey().defaultRandom(),
  section_id: uuid('section_id').notNull().references(() => sections.id, { onDelete: 'cascade' }),
  objective_text: text('objective_text').notNull(),
  order_index: integer('order_index').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// Source Materials
// ============================================

export const sources = pgTable('sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  source_type: text('source_type').notNull(), // pdf, docx, manual, sop, website, regulation, guideline
  file_path: text('file_path'),
  url: text('url'),
  version: text('version'),
  date_published: text('date_published'),
  authority_level: text('authority_level').notNull(), // primary, secondary, supplemental
  scope_of_use: text('scope_of_use'),
  jurisdiction: text('jurisdiction'),
  uploaded_at: timestamp('uploaded_at').defaultNow().notNull(),
  uploaded_by: text('uploaded_by').notNull(),
});

export const sectionSources = pgTable('section_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  section_id: uuid('section_id').notNull().references(() => sections.id, { onDelete: 'cascade' }),
  source_id: uuid('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  relevance_score: real('relevance_score'),
  is_primary: boolean('is_primary').default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// Learner Tables
// ============================================

export const learners = pgTable('learners', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  email: text('email').unique(),
  role: text('role'),
  experience_level: text('experience_level'),
  organization: text('organization'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const enrollments = pgTable('enrollments', {
  id: uuid('id').primaryKey().defaultRandom(),
  learner_id: uuid('learner_id').notNull().references(() => learners.id, { onDelete: 'cascade' }),
  course_id: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('active'), // active, completed, dropped
  enrolled_at: timestamp('enrolled_at').defaultNow().notNull(),
  completed_at: timestamp('completed_at'),
  final_score: real('final_score'),
});

export const sectionProgress = pgTable('section_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  enrollment_id: uuid('enrollment_id').notNull().references(() => enrollments.id, { onDelete: 'cascade' }),
  section_id: uuid('section_id').notNull().references(() => sections.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('not_started'), // not_started, in_progress, completed
  started_at: timestamp('started_at'),
  completed_at: timestamp('completed_at'),
  mastery_score: real('mastery_score'),
  calibration_data: json('calibration_data'),
  verification_attempts: integer('verification_attempts').default(0),
  remediation_count: integer('remediation_count').default(0),
});

// ============================================
// NotebookLM Integration
// ============================================

export const notebooklmNotebooks = pgTable('notebooklm_notebooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  course_id: uuid('course_id').notNull().references(() => courses.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  notebook_type: text('notebook_type').notNull(), // instruction, assessment
  external_id: text('external_id').unique(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const notebookSources = pgTable('notebook_sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  notebook_id: uuid('notebook_id').notNull().references(() => notebooklmNotebooks.id, { onDelete: 'cascade' }),
  source_id: uuid('source_id').notNull().references(() => sources.id, { onDelete: 'cascade' }),
  chunk_index: integer('chunk_index'),
  added_at: timestamp('added_at').defaultNow().notNull(),
});

// ============================================
// Assessment Tables
// ============================================

export const assessments = pgTable('assessments', {
  id: uuid('id').primaryKey().defaultRandom(),
  section_id: uuid('section_id').notNull().references(() => sections.id, { onDelete: 'cascade' }),
  question_text: text('question_text').notNull(),
  question_type: text('question_type').notNull(), // multiple_choice, true_false, open_ended
  correct_answer: text('correct_answer').notNull(),
  options: json('options'),
  explanation: text('explanation'),
  source_reference: text('source_reference'),
  difficulty_level: text('difficulty_level'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// Prompt Architecture Tables
// ============================================

export const deployments = pgTable('deployments', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
  active: boolean('active').default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const promptTemplates = pgTable('prompt_templates', {
  id: text('id').primaryKey(),
  prompt_type: text('prompt_type').notNull(),
  name: text('name').notNull(),
  template_text: text('template_text').notNull(),
  description: text('description'),
  version: text('version').default('1.0'),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const promptVariables = pgTable('prompt_variables', {
  id: text('id').primaryKey(),
  variable_name: text('variable_name').notNull().unique(),
  description: text('description'),
  default_value: text('default_value'),
  variable_type: text('variable_type').notNull(), // text, number, boolean, json
  is_required: boolean('is_required').default(false),
  scope: text('scope').notNull(), // global, deployment, course, section, learner
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// ============================================
// RBAC Tables
// ============================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  password_hash: text('password_hash').notNull(),
  full_name: text('full_name').notNull(),
  role: text('role').notNull(), // master_admin, admin_support, course_creator, student
  deployment_id: text('deployment_id').references(() => deployments.id),
  active: boolean('active').default(true),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export const courseDrafts = pgTable('course_drafts', {
  id: text('id').primaryKey(),
  creator_id: uuid('creator_id').notNull().references(() => users.id),
  deployment_id: text('deployment_id').notNull().references(() => deployments.id),
  course_id: uuid('course_id').references(() => courses.id),
  draft_data: text('draft_data').notNull(), // JSON
  status: text('status').default('building'), // building, review, ready, published
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const courseAssignments = pgTable('course_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  course_id: uuid('course_id').notNull().references(() => courses.id),
  student_id: uuid('student_id').notNull().references(() => users.id),
  assigned_by: uuid('assigned_by').notNull().references(() => users.id),
  assigned_at: timestamp('assigned_at').defaultNow().notNull(),
  due_date: timestamp('due_date'),
  status: text('status'), // assigned, started, completed, overdue
});
