-- Prompt Architecture Schema
-- Manages prompts, templates, and tenant-specific customizations

-- Deployments/Tenants
CREATE TABLE IF NOT EXISTS deployments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL, -- e.g., 'MedViro', 'MedVendor'
    description TEXT,
    active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prompt Templates (Master prompt library)
CREATE TABLE IF NOT EXISTS prompt_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL, -- descriptive name
    prompt_type TEXT NOT NULL CHECK(prompt_type IN (
        'system',           -- Global orchestrator
        'sora_intro',       -- Section welcome video
        'calibration',      -- Pre-learning chatbot
        'notebooklm_main',  -- Main instruction prompt
        'notebooklm_video', -- Video explanation (3.1)
        'notebooklm_podcast', -- Podcast walkthrough (3.2)
        'notebooklm_summary', -- Written summary (3.3)
        'notebooklm_examples', -- Examples (3.4)
        'notebooklm_practice', -- Practice problems (3.5)
        'verification',     -- Assessment generation
        'remediation',      -- Re-teaching content
        'heygen_wrapup'     -- Wrap-up video
    )),
    template_text TEXT NOT NULL, -- Prompt template with {{variables}}
    description TEXT,
    version TEXT DEFAULT '1.0',
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prompt Variables (Define available variables)
CREATE TABLE IF NOT EXISTS prompt_variables (
    id TEXT PRIMARY KEY,
    variable_name TEXT NOT NULL UNIQUE, -- e.g., 'business_name', 'insurance_requirements'
    description TEXT,
    default_value TEXT, -- Default if not overridden
    variable_type TEXT CHECK(variable_type IN ('string', 'number', 'boolean', 'json')),
    is_required BOOLEAN DEFAULT 0,
    scope TEXT CHECK(scope IN ('global', 'deployment', 'course', 'section', 'learner')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Template-Variable Mapping (Which variables are used in which templates)
CREATE TABLE IF NOT EXISTS template_variables (
    template_id TEXT NOT NULL,
    variable_id TEXT NOT NULL,
    is_required BOOLEAN DEFAULT 0,
    PRIMARY KEY (template_id, variable_id),
    FOREIGN KEY (template_id) REFERENCES prompt_templates(id) ON DELETE CASCADE,
    FOREIGN KEY (variable_id) REFERENCES prompt_variables(id) ON DELETE CASCADE
);

-- Deployment Prompt Overrides (Tenant-specific customizations)
CREATE TABLE IF NOT EXISTS deployment_prompts (
    id TEXT PRIMARY KEY,
    deployment_id TEXT NOT NULL,
    template_id TEXT NOT NULL,
    custom_template_text TEXT, -- Override template if needed
    is_enabled BOOLEAN DEFAULT 1,
    notes TEXT, -- Why this customization was made
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (deployment_id) REFERENCES deployments(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES prompt_templates(id) ON DELETE CASCADE,
    UNIQUE(deployment_id, template_id)
);

-- Deployment Variable Values (Tenant-specific variable values)
CREATE TABLE IF NOT EXISTS deployment_variables (
    id TEXT PRIMARY KEY,
    deployment_id TEXT NOT NULL,
    variable_id TEXT NOT NULL,
    value TEXT NOT NULL, -- JSON or plain text depending on variable_type
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (deployment_id) REFERENCES deployments(id) ON DELETE CASCADE,
    FOREIGN KEY (variable_id) REFERENCES prompt_variables(id) ON DELETE CASCADE,
    UNIQUE(deployment_id, variable_id)
);

-- Course Prompt Customizations (Course-specific prompt overrides)
CREATE TABLE IF NOT EXISTS course_prompts (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    template_id TEXT NOT NULL,
    custom_template_text TEXT, -- Course-specific override
    is_enabled BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (template_id) REFERENCES prompt_templates(id) ON DELETE CASCADE,
    UNIQUE(course_id, template_id)
);

-- Course Variable Values (Course-specific variable values)
CREATE TABLE IF NOT EXISTS course_variables (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    variable_id TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (variable_id) REFERENCES prompt_variables(id) ON DELETE CASCADE,
    UNIQUE(course_id, variable_id)
);

-- Section Variable Values (Section-specific variable values)
CREATE TABLE IF NOT EXISTS section_variables (
    id TEXT PRIMARY KEY,
    section_id TEXT NOT NULL,
    variable_id TEXT NOT NULL,
    value TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (section_id) REFERENCES sections(id) ON DELETE CASCADE,
    FOREIGN KEY (variable_id) REFERENCES prompt_variables(id) ON DELETE CASCADE,
    UNIQUE(section_id, variable_id)
);

-- Prompt Execution Log (Track which prompts were used)
CREATE TABLE IF NOT EXISTS prompt_executions (
    id TEXT PRIMARY KEY,
    prompt_type TEXT NOT NULL,
    deployment_id TEXT,
    course_id TEXT,
    section_id TEXT,
    learner_id TEXT,
    resolved_prompt TEXT NOT NULL, -- Final prompt after variable substitution
    ai_service TEXT, -- 'notebooklm', 'sora', 'heygen'
    execution_context TEXT, -- JSON of all variables used
    executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (deployment_id) REFERENCES deployments(id),
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (section_id) REFERENCES sections(id),
    FOREIGN KEY (learner_id) REFERENCES learners(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_prompt_templates_type ON prompt_templates(prompt_type, is_active);
CREATE INDEX IF NOT EXISTS idx_deployment_prompts_deployment ON deployment_prompts(deployment_id);
CREATE INDEX IF NOT EXISTS idx_deployment_variables_deployment ON deployment_variables(deployment_id);
CREATE INDEX IF NOT EXISTS idx_course_prompts_course ON course_prompts(course_id);
CREATE INDEX IF NOT EXISTS idx_course_variables_course ON course_variables(course_id);
CREATE INDEX IF NOT EXISTS idx_section_variables_section ON section_variables(section_id);
CREATE INDEX IF NOT EXISTS idx_prompt_executions_context ON prompt_executions(deployment_id, course_id, section_id);
