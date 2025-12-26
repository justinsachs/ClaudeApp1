## Role-Based Access Control (RBAC) Guide

## Overview

The AI Course Platform implements a comprehensive **4-role RBAC system**:

1. **Master Admin** - Full platform control
2. **Admin Support** - User and assignment management
3. **Course Creator** - "Plug and play" course building
4. **Student** - Takes assigned courses

---

## Roles & Permissions

### 1. **Master Admin**

**Who:** Platform owners, super administrators

**Can:**
- ✅ Create/manage deployments (tenants)
- ✅ Create/manage all users (any role)
- ✅ Configure global prompts and templates
- ✅ Manage all courses (create, edit, delete, publish)
- ✅ Upload and manage all source materials
- ✅ Assign courses to students
- ✅ View all analytics and audit trails
- ✅ Configure system settings

**Cannot:**
- ❌ Nothing - full access

**Use Case:** Platform administration, initial setup, troubleshooting

---

### 2. **Admin Support**

**Who:** Customer support, operations staff

**Can:**
- ✅ View and edit user profiles
- ✅ Assign courses to students
- ✅ View all courses (read-only)
- ✅ View deployment settings (read-only)
- ✅ View prompt templates (read-only)
- ✅ View source materials (read-only)
- ✅ Assist students with access issues

**Cannot:**
- ❌ Create or delete users
- ❌ Create or modify courses
- ❌ Upload source materials
- ❌ Modify prompts or deployments
- ❌ Delete anything

**Use Case:** Day-to-day user support, course assignments, troubleshooting student issues

---

### 3. **Course Creator** 🎨

**Who:** Subject matter experts, instructional designers

**Can:**
- ✅ Create courses using drag-and-drop builder
- ✅ Upload source materials (PDFs, documents)
- ✅ Define learning outcomes and objectives
- ✅ Build sections with 6-step structure
- ✅ Publish courses
- ✅ Edit their own courses
- ✅ Delete their own unpublished drafts
- ✅ View prompt templates (to understand AI behavior)
- ✅ View students in their deployment
- ✅ Duplicate courses for variations

**Cannot:**
- ❌ Modify courses created by others
- ❌ Assign courses to students (admin does this)
- ❌ Create or modify prompt templates
- ❌ Manage users
- ❌ Access other deployments' content

**Use Case:** Content creation, curriculum development, course maintenance

---

### 4. **Student** 📚

**Who:** Learners taking courses

**Can:**
- ✅ Access assigned courses only
- ✅ Take calibration interviews
- ✅ View instruction content (video, podcast, summary)
- ✅ Complete assessments
- ✅ Receive remediation
- ✅ View wrap-up videos
- ✅ Update their own profile and preferences
- ✅ Track their progress

**Cannot:**
- ❌ Access unassigned courses
- ❌ View other students' progress
- ❌ Modify course content
- ❌ Upload materials
- ❌ Create anything

**Use Case:** Taking courses, learning, skill development

---

## Course Creator Workflow

### **"Plug and Play" Course Building**

The Course Creator experience is designed like drag-and-drop website builders but maintains the structured 6-step learning flow for scalability.

### **Step 1: Start New Course**

```typescript
POST /api/course-builder/start
{
  "title": "Medical Device Sales Fundamentals",
  "description": "Learn essential sales techniques for medical devices",
  "target_learner_profile": "Sales representatives new to medical devices",
  "prerequisites": "Basic sales experience"
}

Response: { draftId: "draft_12345..." }
```

**UI:** Simple form with title, description, target audience, prerequisites

---

### **Step 2: Define Learning Outcomes**

**Add Outcomes:**
```typescript
POST /api/course-builder/draft_12345/outcomes
{
  "outcome_text": "Apply value-based pricing strategies to medical devices",
  "performance_verb": "Apply",
  "assessment_criteria": "Correctly calculate pricing for 3 device scenarios"
}
```

**Drag-and-Drop Reordering:**
```typescript
PUT /api/course-builder/draft_12345/outcomes/reorder
{
  "outcomeIndices": [2, 0, 1, 3] // New order
}
```

**UI:**
- Add outcome button
- Drag handles to reorder
- Delete button on each outcome
- Live preview of order

---

### **Step 3: Upload Source Materials**

```typescript
POST /api/uploads/upload
Content-Type: multipart/form-data

{
  file: [PDF/DOCX file],
  title: "FDA Class II Device Guidelines",
  authority_level: "primary"
}

Response: { sourceId: "src_67890..." }
```

**UI:**
- Drag-and-drop file upload
- Progress indicators
- Source library showing all uploaded materials
- Filter by type (PDF, manual, regulation, etc.)

---

### **Step 4: Build Sections** (Structured 6-Step Flow)

**Add Section:**
```typescript
POST /api/course-builder/draft_12345/sections
{
  "title": "Revenue Models and Pricing Strategies",
  "description": "Understanding different revenue approaches",
  "is_critical": false,
  "objectives": [
    "Understand cost-plus vs value-based pricing",
    "Calculate device pricing scenarios",
    "Explain FDA impact on pricing"
  ],
  "source_ids": ["src_67890", "src_11223"] // Grounding sources
}
```

**The 6-Step Structure (Automatic):**

When a section is created, the system automatically provides:

1. **Welcome** - Sora intro video (generated from source materials)
2. **Calibration** - ChatGPT/Claude interview (customized per student)
3. **Instruction** - NotebookLM content (video, podcast, summary)
4. **Assessment** - NotebookLM-generated questions (grounded in sources)
5. **Remediation** - Adaptive re-teaching (if student fails)
6. **Wrap-up** - HeyGen personalized video

**Course Creator only needs to provide:**
- Section title
- Objectives
- Source materials
- Critical designation (if safety/compliance related)

**UI:**
- Section builder with drag-and-drop
- Objective list (add/remove/reorder)
- Source selector (multi-select from library)
- Critical section toggle with reason field
- Live preview showing 6-step structure

---

### **Step 5: Organize & Preview**

**Drag-and-Drop Section Reordering:**
```typescript
PUT /api/course-builder/draft_12345/sections/reorder
{
  "sectionIndices": [1, 0, 2, 3] // New order
}
```

**Preview Course:**
```typescript
GET /api/course-builder/draft_12345/preview

Response: {
  course: { title, description, ... },
  outcomes: [...],
  sections: [
    {
      section: { title, order_index, ... },
      objectives: [...],
      sources: [{ title, file_path, ... }]
    }
  ],
  stats: {
    total_sections: 5,
    total_outcomes: 8,
    total_sources: 12,
    estimated_duration: 180 // minutes
  }
}
```

**UI:**
- Visual course outline
- Section cards with drag handles
- Expandable details for each section
- Source preview
- Estimated completion time
- Validation warnings (missing sources, etc.)

---

### **Step 6: Validate & Publish**

**Validation:**
```typescript
POST /api/course-builder/draft_12345/validate

Response: {
  valid: true,
  errors: []
}

// Or if issues:
Response: {
  valid: false,
  errors: [
    "Section 2: At least one source is required for grounding",
    "Section 3: Title is required"
  ]
}
```

**Publish:**
```typescript
POST /api/course-builder/draft_12345/publish

Response: {
  courseId: "course_99887",
  message: "Course published successfully"
}
```

**UI:**
- Validation checklist
- Error highlights on problematic sections
- Publish button (disabled until valid)
- Confirmation dialog
- Success message with course ID

---

## Drag-and-Drop Features

### **Outcomes**
```
[Drag Handle] ≡ Apply value-based pricing strategies          [×]
[Drag Handle] ≡ Calculate device pricing                      [×]
[Drag Handle] ≡ Explain FDA impact on pricing                 [×]
```

### **Sections**
```
┌─────────────────────────────────────────────┐
│ ≡ Section 1: Introduction to Medical Sales │
│   📝 3 objectives                           │
│   📄 2 sources attached                     │
│   ⏱️ 45 min                                 │
│   [Edit] [Delete]                           │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ ≡ Section 2: Revenue Models                │
│   📝 5 objectives                           │
│   📄 4 sources attached                     │
│   ⚠️ Critical Section (Compliance)          │
│   ⏱️ 60 min                                 │
│   [Edit] [Delete]                           │
└─────────────────────────────────────────────┘
```

---

## Course Assignment Workflow

### **Admin/Support Assigns Course to Students**

```typescript
POST /api/assignments/assign
{
  "course_id": "course_99887",
  "student_ids": ["user_111", "user_222", "user_333"],
  "due_date": "2025-12-31"
}

Response: {
  assignments: [
    { id: "assign_1", student_id: "user_111", status: "assigned" },
    { id: "assign_2", student_id: "user_222", status: "assigned" },
    { id: "assign_3", student_id: "user_333", status: "assigned" }
  ]
}
```

**Students see:**
- Assigned courses in their dashboard
- Due dates
- Progress tracking
- Start button

---

## Example User Journeys

### **Journey 1: Course Creator Creates First Course**

1. **Login** as Course Creator (Sarah, MedViro SME)
2. **Start new course** - "Medical Device Compliance 101"
3. **Upload sources** - Drag FDA guidelines PDF, ISO standards doc
4. **Add outcomes** - 5 learning outcomes defined
5. **Build section 1** - "FDA Regulations Overview"
   - Add 3 objectives
   - Attach FDA guidelines source
   - Mark as critical (compliance)
6. **Build section 2** - "Documentation Requirements"
   - Add 4 objectives
   - Attach ISO standards source
7. **Preview** - Review structure, check estimated time (90 min)
8. **Validate** - All checks pass ✓
9. **Publish** - Course goes live for MedViro deployment

**Time to create:** ~45 minutes (vs hours of manual content creation)

---

### **Journey 2: Admin Assigns Course**

1. **Login** as Admin Support (Mike)
2. **View available courses** - Sees "Medical Device Compliance 101"
3. **Select students** - Picks 15 new sales reps from MedViro
4. **Set due date** - 2 weeks from now
5. **Assign** - Students receive notifications

**Time to assign:** ~2 minutes for 15 students

---

### **Journey 3: Student Takes Course**

1. **Login** as Student (John, new sales rep)
2. **Dashboard** - Sees "Medical Device Compliance 101" assigned
3. **Start course** - Clicks begin
4. **Section 1, Step 1: Welcome** - Watches Sora intro video (45 sec)
5. **Section 1, Step 2: Calibration** - ChatGPT interview (5 min)
   - "I'm new to FDA regulations, worried about compliance errors"
   - Results: knowledge_gaps=["FDA basics"], emphasis=["compliance procedures"]
6. **Section 1, Step 3: Instruction** - NotebookLM content (customized based on calibration)
   - Video explanation starts with FDA basics
   - Extra examples on compliance procedures
   - Podcast addresses his concerns
7. **Section 1, Step 4: Assessment** - Takes quiz (5 questions)
   - Scores 60% (needs 80% for non-critical sections)
8. **Section 1, Step 5: Remediation** - Re-teaching content
   - Addresses missed concepts
   - Retry assessment → 85% ✓
9. **Section 1, Step 6: Wrap-up** - HeyGen video
   - "Great job, John! You scored 85%..."

**Total time:** ~60 minutes for Section 1 (estimated 45 min, took longer due to remediation)

---

## Database Schema Summary

### **New Tables:**
- `users` - All platform users (replaces learners)
- `role_permissions` - What each role can do
- `user_sessions` - Authentication tokens
- `course_drafts` - Course builder workspace
- `course_assignments` - Admin assigns courses to students
- `student_profiles` - Student-specific data
- `creator_profiles` - Creator-specific data
- `activity_log` - Audit trail

### **Key Relationships:**
```
users
  ↓ (role: course_creator)
creator_profiles
  ↓
course_drafts (building courses)
  ↓ (publish)
courses
  ↓ (admin assigns)
course_assignments
  ↓
users (role: student)
  ↓
enrollments (student starts)
  ↓
section_progress (learning journey)
```

---

## API Routes Summary

### **Course Builder (Course Creators):**
```
POST   /api/course-builder/start
GET    /api/course-builder/drafts
GET    /api/course-builder/:draftId
PUT    /api/course-builder/:draftId/info
POST   /api/course-builder/:draftId/outcomes
PUT    /api/course-builder/:draftId/outcomes/reorder
DELETE /api/course-builder/:draftId/outcomes/:index
POST   /api/course-builder/:draftId/sections
PUT    /api/course-builder/:draftId/sections/:index
PUT    /api/course-builder/:draftId/sections/reorder
DELETE /api/course-builder/:draftId/sections/:index
POST   /api/course-builder/:draftId/validate
GET    /api/course-builder/:draftId/preview
POST   /api/course-builder/:draftId/publish
POST   /api/course-builder/:draftId/duplicate
DELETE /api/course-builder/:draftId
```

### **Assignments (Admin/Support):**
```
POST   /api/assignments/assign
GET    /api/assignments/student/:studentId
GET    /api/assignments/course/:courseId
PUT    /api/assignments/:assignmentId/status
DELETE /api/assignments/:assignmentId
```

### **Student Learning:**
```
GET    /api/student/my-courses
GET    /api/student/course/:courseId/start
POST   /api/student/course/:courseId/section/:sectionId/calibration/start
POST   /api/student/course/:courseId/section/:sectionId/calibration/continue
GET    /api/student/course/:courseId/section/:sectionId/instruction
POST   /api/student/course/:courseId/section/:sectionId/assessment
POST   /api/student/course/:courseId/section/:sectionId/submit
```

---

## Benefits of This Design

### **For Course Creators:**
✅ **Fast course creation** - Minutes instead of hours
✅ **No technical skills required** - Drag-and-drop interface
✅ **AI does the heavy lifting** - Just provide sources and structure
✅ **Maintain quality** - 6-step structure ensures consistency
✅ **Easy updates** - Edit drafts, republish

### **For Admins:**
✅ **Simple assignment** - Bulk assign courses to students
✅ **Clear oversight** - Track who's assigned what
✅ **Support focus** - Help students, not build courses

### **For Students:**
✅ **Personalized learning** - Calibration customizes content
✅ **Consistent experience** - Every section follows same flow
✅ **Progress tracking** - Clear visibility of completion

### **For Platform:**
✅ **Scalable** - Structure allows automation
✅ **Tenant isolation** - Each deployment independent
✅ **Audit trail** - Complete activity logging
✅ **Role security** - Clear permission boundaries

---

## Next Steps

1. **Implement authentication** - Login/signup for all roles
2. **Build Course Creator UI** - Drag-and-drop interface
3. **Build Student UI** - Learning dashboard
4. **Build Admin UI** - Assignment management
5. **Add real AI services** - Connect ChatGPT, NotebookLM, Sora, HeyGen
6. **Deploy** - Production-ready multi-tenant platform

The foundation is now in place for a complete, role-based AI learning platform! 🚀
