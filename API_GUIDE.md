# API Guide - AI Course Platform

## Base URL
```
http://localhost:3000/api
```

## Authentication
Currently no authentication required. In production, implement JWT or API key authentication.

## Response Format

All responses follow this format:

**Success:**
```json
{
  "data_key": { ... },
  "message": "Optional success message"
}
```

**Error:**
```json
{
  "error": "Error message",
  "details": "Optional error details"
}
```

---

## Courses API

### List Courses
```http
GET /courses?status=published
```

Query Parameters:
- `status` (optional): Filter by status (draft, review, published, archived)

Response:
```json
{
  "courses": [
    {
      "id": "uuid",
      "title": "Course Title",
      "description": "Course description",
      "status": "published",
      "version": "1.0",
      "estimated_duration": 120,
      "created_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Course
```http
GET /courses/:id
```

### Get Full Course
```http
GET /courses/:id/full
```

Response includes course, outcomes, sections with objectives and sources, and configuration.

### Create Course
```http
POST /courses
Content-Type: application/json

{
  "title": "Course Title",
  "description": "Description",
  "status": "draft"
}
```

### Create Course Package
```http
POST /courses/package
Content-Type: application/json

{
  "course": {
    "title": "Full Course",
    "description": "Complete course",
    "status": "draft"
  },
  "outcomes": [
    {
      "outcome_text": "Learner will...",
      "performance_verb": "demonstrate",
      "order_index": 0
    }
  ],
  "sections": [
    {
      "section": {
        "title": "Section 1",
        "description": "First section",
        "is_critical": false,
        "order_index": 0
      },
      "objectives": [
        {
          "objective_text": "Objective 1",
          "order_index": 0
        }
      ],
      "sources": []
    }
  ],
  "configuration": {
    "mastery_threshold_standard": 0.8,
    "mastery_threshold_critical": 0.9
  }
}
```

### Update Course
```http
PATCH /courses/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description"
}
```

### Publish Course
```http
POST /courses/:id/publish
```

### Delete Course
```http
DELETE /courses/:id
```

---

## Learners API

### List Learners
```http
GET /learners
```

### Get Learner Profile
```http
GET /learners/:id/profile
```

Response:
```json
{
  "profile": {
    "learner": {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "experience_level": "intermediate"
    },
    "preferences": {
      "coaching_tone": "gentle",
      "format_preference": "video",
      "pace_preference": "standard"
    },
    "qualifiers": [],
    "competencies": []
  }
}
```

### Create Learner
```http
POST /learners
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "Sales Agent",
  "experience_level": "novice"
}
```

### Set Preferences
```http
POST /learners/:id/preferences
Content-Type: application/json

{
  "coaching_tone": "direct",
  "format_preference": "video",
  "pace_preference": "fast",
  "confidence_level": 7
}
```

---

## Enrollments API

### Create Enrollment
```http
POST /enrollments
Content-Type: application/json

{
  "learner_id": "learner-uuid",
  "course_id": "course-uuid"
}
```

This automatically initializes section progress for all sections.

### Get Enrollment
```http
GET /enrollments/:id
```

### Get Progress
```http
GET /enrollments/:id/progress
```

Response:
```json
{
  "progress": [
    {
      "id": "progress-uuid",
      "section_id": "section-uuid",
      "status": "in_progress",
      "mastery_score": 0.85,
      "attempts": 2,
      "started_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## Section Execution Flow

### 1. Start Section
```http
POST /enrollments/:enrollmentId/sections/:sectionId/start
```

Response:
```json
{
  "message": "Section started",
  "welcome_video": {
    "videoAssetId": "uuid",
    "jobId": "sora-job-id"
  }
}
```

### 2. Calibration Interview
```http
POST /enrollments/:enrollmentId/sections/:sectionId/calibrate
Content-Type: application/json

{
  "responses": [
    {
      "question": "What's your experience with this topic?",
      "answer": "I have some basic knowledge"
    }
  ]
}
```

Response:
```json
{
  "calibration": {
    "section_goal": "Master core concepts",
    "identified_gaps": ["Area 1", "Area 2"],
    "adaptation_settings": {
      "emphasis_areas": ["Concept A", "Concept B"],
      "pacing_adjustment": "slower",
      "risk_flags": []
    }
  }
}
```

### 3. Get Instruction
```http
POST /enrollments/:enrollmentId/sections/:sectionId/instruct
Content-Type: application/json

{
  "notebook_id": "notebooklm-uuid"
}
```

Response:
```json
{
  "instruction": {
    "videoUrl": "https://mock-notebooklm.com/videos/...",
    "podcastUrl": "https://mock-notebooklm.com/podcasts/...",
    "summary": "# Summary\n\nKey concepts..."
  }
}
```

### 4. Submit Verification
```http
POST /enrollments/:enrollmentId/sections/:sectionId/verify
Content-Type: application/json

{
  "assessment_id": "assessment-uuid",
  "learner_response": "Answer to the question"
}
```

Response:
```json
{
  "verification": {
    "passed": true,
    "score": 0.9,
    "feedback": "Excellent work! You've demonstrated...",
    "requires_remediation": false
  }
}
```

### 5. Get Remediation (if needed)
```http
POST /enrollments/:enrollmentId/sections/:sectionId/remediate
Content-Type: application/json

{
  "remediation_type": "step_by_step"
}
```

Remediation types:
- `analogy`: Explain using analogies from learner's background
- `step_by_step`: Break down into smaller steps
- `common_mistakes`: Focus on common errors

Response:
```json
{
  "remediation": "Let's break this down step by step:\n\nStep 1: ..."
}
```

### 6. Complete Section
```http
POST /enrollments/:enrollmentId/sections/:sectionId/complete
Content-Type: application/json

{
  "final_score": 0.92
}
```

Response:
```json
{
  "message": "Section completed",
  "wrap_up_video": {
    "videoAssetId": "uuid",
    "jobId": "heygen-job-id"
  }
}
```

---

## Sources API

### List Sources
```http
GET /sources
```

### Create Source
```http
POST /sources
Content-Type: application/json

{
  "title": "Real Estate Handbook",
  "source_type": "pdf",
  "file_path": "/uploads/handbook.pdf",
  "authority_level": "primary",
  "version": "2024.1"
}
```

### Get Source
```http
GET /sources/:id
```

---

## Sections API

### Get Section
```http
GET /sections/:id
```

### Get Objectives
```http
GET /sections/:id/objectives
```

### Get Sources
```http
GET /sections/:id/sources
```

### Get Assessments
```http
GET /sections/:id/assessments
```

### Get Artifacts (NotebookLM outputs)
```http
GET /sections/:id/artifacts
```

---

## Assessments API

### Get Assessment
```http
GET /assessments/:id
```

Response:
```json
{
  "assessment": {
    "id": "uuid",
    "assessment_type": "quiz",
    "question_text": "What is...?",
    "difficulty_level": 3
  },
  "options": [
    {
      "id": "uuid",
      "option_text": "Option A",
      "is_correct": true,
      "order_index": 0
    }
  ]
}
```

### Create Assessment
```http
POST /assessments
Content-Type: application/json

{
  "section_id": "section-uuid",
  "assessment_type": "quiz",
  "question_text": "What is the definition of...?",
  "correct_answer": "The correct answer",
  "difficulty_level": 2,
  "options": [
    {
      "option_text": "Option A",
      "is_correct": true,
      "order_index": 0
    },
    {
      "option_text": "Option B",
      "is_correct": false,
      "order_index": 1
    }
  ]
}
```

### Get Verification Records
```http
GET /assessments/verifications/:sectionProgressId
```

### Get Remediation Logs
```http
GET /assessments/remediations/:sectionProgressId
```

### Get Audit Trail
```http
GET /assessments/audit/:entityType/:entityId
```

Example:
```http
GET /assessments/audit/course/course-uuid
GET /assessments/audit/section/section-uuid
GET /assessments/audit/enrollment/enrollment-uuid
```

---

## Error Codes

- `400` - Bad Request (validation error)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Rate Limiting

Not currently implemented. In production, implement rate limiting per IP or API key.

---

## Webhook Support

Not currently implemented. Future: webhooks for:
- Course published
- Enrollment completed
- Section completed
- Verification failed (critical section)

---

## Testing

Use tools like:
- **Postman**: Import collection from examples above
- **curl**: Command-line testing
- **HTTPie**: User-friendly CLI HTTP client

Example with curl:
```bash
# Create a learner
curl -X POST http://localhost:3000/api/learners \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","experience_level":"novice"}'

# List courses
curl http://localhost:3000/api/courses

# Health check
curl http://localhost:3000/health
```
