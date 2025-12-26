-- Role-Based Access Control (RBAC) Schema

-- User Accounts (replaces/extends learners table for all users)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('master_admin', 'admin_support', 'course_creator', 'student')),
    deployment_id TEXT, -- Which deployment/tenant this user belongs to
    active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    FOREIGN KEY (deployment_id) REFERENCES deployments(id)
);

-- Role Permissions (define what each role can do)
CREATE TABLE IF NOT EXISTS role_permissions (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL,
    resource TEXT NOT NULL, -- 'courses', 'sources', 'learners', 'prompts', etc.
    action TEXT NOT NULL CHECK(action IN ('create', 'read', 'update', 'delete', 'publish', 'assign')),
    UNIQUE(role, resource, action)
);

-- User Sessions (for authentication)
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Course Creator Workspace (tracks course creation progress)
CREATE TABLE IF NOT EXISTS course_drafts (
    id TEXT PRIMARY KEY,
    creator_id TEXT NOT NULL,
    deployment_id TEXT NOT NULL,
    course_id TEXT, -- NULL until published
    draft_data TEXT NOT NULL, -- JSON of course structure
    status TEXT CHECK(status IN ('building', 'review', 'ready', 'published')) DEFAULT 'building',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id),
    FOREIGN KEY (deployment_id) REFERENCES deployments(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- Course Assignments (admin assigns courses to students)
CREATE TABLE IF NOT EXISTS course_assignments (
    id TEXT PRIMARY KEY,
    course_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    assigned_by TEXT NOT NULL, -- admin or course creator
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    status TEXT CHECK(status IN ('assigned', 'started', 'completed', 'overdue')) DEFAULT 'assigned',
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    UNIQUE(course_id, student_id)
);

-- Student Profiles (extends users for student-specific data)
CREATE TABLE IF NOT EXISTS student_profiles (
    user_id TEXT PRIMARY KEY,
    role TEXT, -- Job role
    jurisdiction TEXT,
    experience_level TEXT CHECK(experience_level IN ('novice', 'intermediate', 'advanced')),
    coaching_tone TEXT CHECK(coaching_tone IN ('direct', 'gentle')),
    format_preference TEXT CHECK(format_preference IN ('audio', 'video', 'text')),
    pace_preference TEXT CHECK(pace_preference IN ('fast', 'standard', 'detailed')),
    confidence_level INTEGER CHECK(confidence_level BETWEEN 1 AND 10),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Course Creator Profiles (extends users for creator-specific data)
CREATE TABLE IF NOT EXISTS creator_profiles (
    user_id TEXT PRIMARY KEY,
    organization TEXT,
    specialization TEXT, -- Subject matter expertise
    courses_created INTEGER DEFAULT 0,
    bio TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Activity Log (audit trail for all user actions)
CREATE TABLE IF NOT EXISTS activity_log (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL, -- 'created_course', 'uploaded_source', 'assigned_student', etc.
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details TEXT, -- JSON
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_deployment ON users(deployment_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_course_assignments_student ON course_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_course_assignments_status ON course_assignments(status);
CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON activity_log(created_at);
