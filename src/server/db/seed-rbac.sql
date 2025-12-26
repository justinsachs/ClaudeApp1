-- Seed Default RBAC Permissions

-- MASTER ADMIN - Full access to everything
INSERT OR IGNORE INTO role_permissions (id, role, resource, action) VALUES
('perm_ma_1', 'master_admin', 'users', 'create'),
('perm_ma_2', 'master_admin', 'users', 'read'),
('perm_ma_3', 'master_admin', 'users', 'update'),
('perm_ma_4', 'master_admin', 'users', 'delete'),
('perm_ma_5', 'master_admin', 'deployments', 'create'),
('perm_ma_6', 'master_admin', 'deployments', 'read'),
('perm_ma_7', 'master_admin', 'deployments', 'update'),
('perm_ma_8', 'master_admin', 'deployments', 'delete'),
('perm_ma_9', 'master_admin', 'prompts', 'create'),
('perm_ma_10', 'master_admin', 'prompts', 'read'),
('perm_ma_11', 'master_admin', 'prompts', 'update'),
('perm_ma_12', 'master_admin', 'prompts', 'delete'),
('perm_ma_13', 'master_admin', 'courses', 'create'),
('perm_ma_14', 'master_admin', 'courses', 'read'),
('perm_ma_15', 'master_admin', 'courses', 'update'),
('perm_ma_16', 'master_admin', 'courses', 'delete'),
('perm_ma_17', 'master_admin', 'courses', 'publish'),
('perm_ma_18', 'master_admin', 'courses', 'assign'),
('perm_ma_19', 'master_admin', 'sources', 'create'),
('perm_ma_20', 'master_admin', 'sources', 'read'),
('perm_ma_21', 'master_admin', 'sources', 'update'),
('perm_ma_22', 'master_admin', 'sources', 'delete');

-- ADMIN SUPPORT - Can manage users and assignments, read-only on config
INSERT OR IGNORE INTO role_permissions (id, role, resource, action) VALUES
('perm_as_1', 'admin_support', 'users', 'read'),
('perm_as_2', 'admin_support', 'users', 'update'),
('perm_as_3', 'admin_support', 'courses', 'read'),
('perm_as_4', 'admin_support', 'courses', 'assign'),
('perm_as_5', 'admin_support', 'deployments', 'read'),
('perm_as_6', 'admin_support', 'prompts', 'read'),
('perm_as_7', 'admin_support', 'sources', 'read');

-- COURSE CREATOR - Can create and manage courses, upload sources
INSERT OR IGNORE INTO role_permissions (id, role, resource, action) VALUES
('perm_cc_1', 'course_creator', 'courses', 'create'),
('perm_cc_2', 'course_creator', 'courses', 'read'),
('perm_cc_3', 'course_creator', 'courses', 'update'),
('perm_cc_4', 'course_creator', 'courses', 'delete'), -- Only their own courses
('perm_cc_5', 'course_creator', 'courses', 'publish'),
('perm_cc_6', 'course_creator', 'sources', 'create'),
('perm_cc_7', 'course_creator', 'sources', 'read'),
('perm_cc_8', 'course_creator', 'sources', 'update'),
('perm_cc_9', 'course_creator', 'sources', 'delete'), -- Only their own sources
('perm_cc_10', 'course_creator', 'prompts', 'read'), -- Can view prompt templates
('perm_cc_11', 'course_creator', 'deployments', 'read'), -- Can view their deployment
('perm_cc_12', 'course_creator', 'users', 'read'); -- Can view students in their deployment

-- STUDENT - Can only access assigned courses and manage their own profile
INSERT OR IGNORE INTO role_permissions (id, role, resource, action) VALUES
('perm_st_1', 'student', 'courses', 'read'), -- Only assigned courses
('perm_st_2', 'student', 'users', 'update'); -- Only their own profile
