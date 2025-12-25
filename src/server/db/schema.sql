-- AI Course Platform Database Schema
-- Version 1.0

-- Learner Profiles
CREATE TABLE IF NOT EXISTS learners (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT,
    jurisdiction TEXT,
    experience_level TEXT CHECK(experience_level IN ('novice', 'intermediate', 'advanced')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Learner Preferences
CREATE TABLE IF NOT EXISTS learner_preferences (
    learner_id TEXT PRIMARY KEY,
    coaching_tone TEXT CHECK(coaching_tone IN ('direct', 'gentle')),
    format_preference TEXT CHECK(format_preference IN ('audio', 'video', 'text')),
    pace_preference TEXT CHECK(pace_preference IN ('fast', 'standard', 'detailed')),
    confidence_level INTEGER CHECK(confidence_level BETWEEN 1 AND 10),
    FOREIGN KEY (learner_id) REFERENCES learners(id) ON DELETE CASCADE
);

-- Learner Background Qualifiers
CREATE TABLE IF NOT EXISTS learner_qualifiers (
    id TEXT PRIMARY KEY,
    learner_id TEXT NOT NULL,
    qualifier_type TEXT NOT NULL, -- 'prior_role', 'certification', 'jurisdiction'
    qualifier_value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (learner_id) REFERENCES learners(id) ON DELETE CASCADE
);

-- Courses
CREATE TABLE IF NOT EXISTS courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    target_learner_profile TEXT,
    prerequisites TEXT,
    estimated_duration INTEGER, -- in minutes
    version TEXT DEFAULT '1.0',
    status TEXT CHECK(status IN ('draft', 'review', 'published', 'archived')) DEFAULT 'draft',
    created_by TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_at TIMESTAMP
);

-- Learning Outcomes
CREATE TABLE IF NOT EXISTS learning_outcomes (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    outcome_text TEXT NOT NULL,
    performance_verb TEXT NOT NULL,
    assessment_criteria TEXT,
    order_index INTEGER NOT NULL,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Sections (Modules)
CREATE TABLE IF NOT EXISTS sections (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    order_index INTEGER NOT NULL,
    is_critical BOOLEAN DEFAULT 0,
    criticality_reason TEXT, -- safety/compliance/legal/ethics
    estimated_duration INTEGER, -- in minutes
    notebooklm_notebook_id TEXT,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Section Objectives
CREATE TABLE IF NOT EXISTS section_objectives (
    id TEXT PRIMARY KEY,
    section_id TEXT NOT NULL,
    objective_text TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE
);

-- Source Materials
CREATE TABLE IF NOT EXISTS sources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    source_type TEXT CHECK(source_type IN ('pdf', 'manual', 'sop', 'website', 'regulation', 'standard', 'template', 'transcript')),
    file_path TEXT,
    url TEXT,
    version TEXT,
    date_published DATE,
    authority_level TEXT CHECK(authority_level IN ('primary', 'secondary', 'internal')),
    scope_of_use TEXT, -- 'full' or 'excerpt'
    jurisdiction TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by TEXT
);

-- Section-Source Mapping
CREATE TABLE IF NOT EXISTS section_sources (
    section_id TEXT NOT NULL,
    source_id TEXT NOT NULL,
    PRIMARY KEY (section_id, source_id),
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (source_id) REFERENCES sources(id) ON DELETE CASCADE
);

-- NotebookLM Notebooks
CREATE TABLE IF NOT EXISTS notebooklm_notebooks (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    title TEXT NOT NULL,
    notebook_type TEXT, -- 'welcome', 'terminology', 'standards', 'sales', 'compliance'
    external_id TEXT, -- ID from NotebookLM service
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Assessment Bank
CREATE TABLE IF NOT EXISTS assessments (
    id TEXT PRIMARY KEY,
    section_id TEXT,
    course_id TEXT,
    assessment_type TEXT CHECK(assessment_type IN ('quiz', 'scenario', 'explain_back', 'skills_check', 'capstone')),
    question_text TEXT NOT NULL,
    correct_answer TEXT,
    rubric TEXT, -- JSON rubric for explain-back and scenarios
    difficulty_level INTEGER CHECK(difficulty_level BETWEEN 1 AND 5),
    tags TEXT, -- JSON array of tags
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Assessment Options (for MCQ)
CREATE TABLE IF NOT EXISTS assessment_options (
    id TEXT PRIMARY KEY,
    assessment_id TEXT NOT NULL,
    option_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT 0,
    order_index INTEGER NOT NULL,
    FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE
);

-- Learner Enrollments
CREATE TABLE IF NOT EXISTS enrollments (
    id TEXT PRIMARY KEY,
    learner_id TEXT NOT NULL,
    course_id TEXT NOT NULL,
    status TEXT CHECK(status IN ('active', 'completed', 'withdrawn')) DEFAULT 'active',
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    final_score REAL,
    FOREIGN KEY (learner_id) REFERENCES learners(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE(learner_id, course_id)
);

-- Section Progress
CREATE TABLE IF NOT EXISTS section_progress (
    id TEXT PRIMARY KEY,
    enrollment_id TEXT NOT NULL,
    section_id TEXT NOT NULL,
    status TEXT CHECK(status IN ('not_started', 'in_progress', 'completed', 'failed')) DEFAULT 'not_started',
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    mastery_score REAL,
    attempts INTEGER DEFAULT 0,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    UNIQUE(enrollment_id, section_id)
);

-- Verification Records
CREATE TABLE IF NOT EXISTS verification_records (
    id TEXT PRIMARY KEY,
    section_progress_id TEXT NOT NULL,
    assessment_id TEXT NOT NULL,
    learner_response TEXT,
    score REAL,
    passed BOOLEAN,
    attempt_number INTEGER,
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_progress_id) REFERENCES section_progress(id) ON DELETE CASCADE,
    FOREIGN KEY (assessment_id) REFERENCES assessments(id)
);

-- Remediation Logs
CREATE TABLE IF NOT EXISTS remediation_logs (
    id TEXT PRIMARY KEY,
    section_progress_id TEXT NOT NULL,
    verification_record_id TEXT,
    remediation_type TEXT, -- 'analogy', 'step_by_step', 'common_mistakes'
    content_provided TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_progress_id) REFERENCES section_progress(id) ON DELETE CASCADE,
    FOREIGN KEY (verification_record_id) REFERENCES verification_records(id)
);

-- Video Assets
CREATE TABLE IF NOT EXISTS video_assets (
    id TEXT PRIMARY KEY,
    asset_type TEXT CHECK(asset_type IN ('sora_welcome', 'heygen_section_wrap', 'heygen_course_wrap')),
    section_id TEXT,
    course_id TEXT,
    script_text TEXT NOT NULL,
    video_url TEXT,
    generation_status TEXT CHECK(generation_status IN ('pending', 'processing', 'completed', 'failed')) DEFAULT 'pending',
    external_job_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- NotebookLM Artifacts
CREATE TABLE IF NOT EXISTS notebooklm_artifacts (
    id TEXT PRIMARY KEY,
    notebook_id TEXT NOT NULL,
    section_id TEXT,
    artifact_type TEXT CHECK(artifact_type IN ('video', 'podcast', 'summary')),
    content_url TEXT,
    transcript TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (notebook_id) REFERENCES notebooklm_notebooks(id) ON DELETE CASCADE,
    FOREIGN KEY (section_id) REFERENCES sections(id)
);

-- Completion Records
CREATE TABLE IF NOT EXISTS completion_records (
    id TEXT PRIMARY KEY,
    enrollment_id TEXT NOT NULL,
    completion_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    final_score REAL,
    certificate_issued BOOLEAN DEFAULT 0,
    certificate_url TEXT,
    next_steps TEXT,
    FOREIGN KEY (enrollment_id) REFERENCES enrollments(id) ON DELETE CASCADE
);

-- Audit Trail
CREATE TABLE IF NOT EXISTS audit_trail (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL, -- 'course', 'section', 'enrollment', 'verification'
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL, -- 'created', 'updated', 'deleted', 'published', 'verified'
    actor_id TEXT,
    actor_type TEXT, -- 'user', 'system', 'ai_service'
    changes TEXT, -- JSON of what changed
    metadata TEXT, -- JSON of additional context
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Course Configuration
CREATE TABLE IF NOT EXISTS course_configuration (
    course_id TEXT PRIMARY KEY,
    mastery_threshold_standard REAL DEFAULT 0.8,
    mastery_threshold_critical REAL DEFAULT 0.9,
    retry_limit_standard INTEGER DEFAULT 3,
    retry_limit_critical INTEGER DEFAULT 999, -- unlimited for critical
    media_formats TEXT, -- JSON array: ['audio', 'video', 'text']
    heygen_mandatory BOOLEAN DEFAULT 1,
    compliance_calendar_enabled BOOLEAN DEFAULT 0,
    manager_dashboard_enabled BOOLEAN DEFAULT 0,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Competency Map
CREATE TABLE IF NOT EXISTS learner_competencies (
    id TEXT PRIMARY KEY,
    learner_id TEXT NOT NULL,
    outcome_id TEXT NOT NULL,
    mastery_level REAL CHECK(mastery_level BETWEEN 0 AND 1),
    last_assessed TIMESTAMP,
    FOREIGN KEY (learner_id) REFERENCES learners(id) ON DELETE CASCADE,
    FOREIGN KEY (outcome_id) REFERENCES learning_outcomes(id) ON DELETE CASCADE,
    UNIQUE(learner_id, outcome_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_enrollments_learner ON enrollments(learner_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_sections_course ON sections(course_id);
CREATE INDEX IF NOT EXISTS idx_section_progress_enrollment ON section_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_verification_records_section ON verification_records(section_progress_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_entity ON audit_trail(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_trail_created ON audit_trail(created_at);
