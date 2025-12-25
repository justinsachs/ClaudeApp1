# AI Course Deployment Platform

A comprehensive AI-powered course creation and delivery platform implementing the AI Course Deployment Specification v1.1. This platform uses **NotebookLM** for grounded instruction, **Sora** for section intro videos, and **HeyGen** for wrap-up videos to create engaging, adaptive learning experiences.

## 🌟 Features

### Core Capabilities

- **Course Creation & Management**: Create, publish, and manage courses with learning outcomes, sections, and objectives
- **Section Execution Loop**: Implements the complete 6-step section execution model:
  1. Sora Welcome Video
  2. Calibration Interview (Pre-learning assessment)
  3. NotebookLM Instruction (Video, Podcast, Summary)
  4. Learning Verification (Micro-validation gates)
  5. Remediation Loop (Adaptive re-teaching)
  6. HeyGen Wrap-Up Video

- **Learner Management**: Track learner profiles, preferences, qualifications, and competencies
- **Adaptive Learning**: Personalize instruction based on learner background, experience, and performance
- **Assessment & Verification**: Quiz, scenario-based, and rubric-scored assessments with automatic remediation
- **Source Control**: Manage and version approved source materials with grounding for compliance
- **Audit Trail**: Complete audit logging for governance and compliance
- **Critical Section Support**: Enhanced validation for safety/compliance/legal sections

### AI Integration

- **NotebookLM**: Grounded instruction from approved sources
- **Sora**: AI-generated section introduction videos
- **HeyGen**: Personalized wrap-up and reinforcement videos
- **Mock Services**: Development-ready mock implementations (replace with real APIs)

## 📋 Prerequisites

- **Node.js** 18+ and npm
- **SQLite3** (for database)
- Optional: API keys for NotebookLM, Sora, and HeyGen (currently using mocks)

## 🚀 Quick Start

### 1. Clone and Setup

```bash
cd ClaudeApp1
npm install
cd client && npm install && cd ..
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

Key environment variables:
```env
PORT=3000
DATABASE_PATH=./data/courses.db
NODE_ENV=development

# Add your API keys when ready
NOTEBOOKLM_API_KEY=your_key_here
SORA_API_KEY=your_key_here
HEYGEN_API_KEY=your_key_here
```

### 3. Run the Application

**Development Mode (Backend + Frontend):**
```bash
npm run dev
```

This starts:
- Backend API at `http://localhost:3000`
- Frontend at `http://localhost:5173`

**Production Mode:**
```bash
npm run build
npm start
```

### 4. Access the Platform

Open your browser to `http://localhost:5173` to access the platform UI.

## 🏗️ Architecture

### Backend (Node.js + Express + TypeScript)

```
src/server/
├── db/
│   ├── database.ts          # SQLite connection & initialization
│   └── schema.sql            # Database schema (all tables)
├── repositories/
│   ├── CourseRepository.ts   # Course CRUD operations
│   ├── LearnerRepository.ts  # Learner & enrollment operations
│   ├── AssessmentRepository.ts # Assessment & verification
│   └── SourceRepository.ts   # Source materials & notebooks
├── services/
│   ├── AIServices.ts         # NotebookLM, Sora, HeyGen integrations
│   └── SectionExecutionService.ts # Section execution logic
├── routes/
│   ├── courses.ts            # Course API routes
│   ├── learners.ts           # Learner API routes
│   ├── enrollments.ts        # Enrollment & learning journey routes
│   ├── sections.ts           # Section-specific routes
│   ├── sources.ts            # Source material routes
│   └── assessments.ts        # Assessment & verification routes
├── types/
│   └── models.ts             # TypeScript type definitions
└── server.ts                 # Express server entry point
```

### Frontend (React + TypeScript + Vite + Tailwind CSS)

```
client/src/
├── pages/
│   ├── Dashboard.tsx         # Platform overview & stats
│   ├── CourseList.tsx        # Browse and filter courses
│   ├── CourseCreator.tsx     # Create course definition packages
│   ├── LearnerList.tsx       # Manage learners & enrollments
│   └── LearnerJourney.tsx    # Learner's course progression
├── api/
│   └── client.ts             # API client & endpoint definitions
├── App.tsx                   # Main app component & routing
├── main.tsx                  # React entry point
└── index.css                 # Tailwind CSS imports
```

### Database Schema

Key tables:
- **courses**: Course definitions and metadata
- **learning_outcomes**: Observable competencies
- **sections**: Course modules with criticality flags
- **section_objectives**: Specific section learning goals
- **sources**: Approved source materials
- **notebooklm_notebooks**: NotebookLM notebook registry
- **learners**: Learner profiles
- **learner_preferences**: Personalization settings
- **enrollments**: Course enrollment tracking
- **section_progress**: Section-level progress tracking
- **assessments**: Assessment bank
- **verification_records**: Verification attempts and scores
- **remediation_logs**: Remediation content delivered
- **video_assets**: Sora and HeyGen video generation tracking
- **audit_trail**: Complete audit log

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Key Endpoints

#### Courses
- `GET /courses` - List all courses (filter by status)
- `GET /courses/:id` - Get course by ID
- `GET /courses/:id/full` - Get complete course with sections, outcomes, config
- `POST /courses` - Create a new course
- `POST /courses/package` - Create complete course definition package (CDP)
- `PATCH /courses/:id` - Update course
- `POST /courses/:id/publish` - Publish course
- `GET /courses/:id/sections` - Get course sections
- `GET /courses/:id/outcomes` - Get learning outcomes
- `GET /courses/:id/configuration` - Get course configuration

#### Learners
- `GET /learners` - List all learners
- `POST /learners` - Create a new learner
- `GET /learners/:id/profile` - Get full learner profile
- `POST /learners/:id/preferences` - Set learner preferences
- `GET /learners/:id/enrollments` - Get learner enrollments

#### Enrollments
- `POST /enrollments` - Enroll learner in course
- `GET /enrollments/:id/progress` - Get section progress
- `POST /enrollments/:enrollmentId/sections/:sectionId/start` - Start section
- `POST /enrollments/:enrollmentId/sections/:sectionId/calibrate` - Calibration interview
- `POST /enrollments/:enrollmentId/sections/:sectionId/instruct` - Get instruction
- `POST /enrollments/:enrollmentId/sections/:sectionId/verify` - Submit verification
- `POST /enrollments/:enrollmentId/sections/:sectionId/remediate` - Get remediation
- `POST /enrollments/:enrollmentId/sections/:sectionId/complete` - Complete section

#### Sections
- `GET /sections/:id` - Get section details
- `GET /sections/:id/objectives` - Get section objectives
- `GET /sections/:id/sources` - Get section sources
- `GET /sections/:id/assessments` - Get section assessments

#### Sources
- `GET /sources` - List all sources
- `POST /sources` - Upload new source
- `GET /sources/:id` - Get source by ID

#### Assessments
- `GET /assessments/:id` - Get assessment with options
- `POST /assessments` - Create assessment
- `GET /assessments/verifications/:sectionProgressId` - Get verification history

### Example: Create Course Package

```javascript
POST /api/courses/package

{
  "course": {
    "title": "Real Estate Fundamentals",
    "description": "Complete introduction to real estate principles",
    "target_learner_profile": "New agents",
    "status": "draft",
    "estimated_duration": 240
  },
  "outcomes": [
    {
      "outcome_text": "Explain the principles of property valuation",
      "performance_verb": "explain",
      "assessment_criteria": "Can describe 3+ valuation methods",
      "order_index": 0
    }
  ],
  "sections": [
    {
      "section": {
        "title": "Introduction to Real Estate",
        "description": "Core concepts and terminology",
        "is_critical": false,
        "order_index": 0
      },
      "objectives": [
        {
          "objective_text": "Define key real estate terms",
          "order_index": 0
        }
      ],
      "sources": []
    }
  ]
}
```

## 🎓 Usage Examples

### 1. Create a Course

1. Navigate to **Create Course** in the UI
2. Fill in course details, learning outcomes, and sections
3. Add objectives to each section
4. Mark critical sections (safety/compliance/legal)
5. Click **Create Course**

### 2. Add a Learner and Enroll

1. Navigate to **Learners**
2. Click **Add Learner**
3. Fill in learner details (name, email, experience level)
4. Click **Enroll in Course** for the learner
5. Select a published course

### 3. Track Learner Progress

1. View **Learner Journey** for an enrollment
2. See section-by-section progress
3. Monitor mastery scores and attempts
4. View verification records and remediation logs

## 🔧 Development

### Project Structure

- **`src/server/`**: Backend TypeScript code
- **`client/src/`**: Frontend React code
- **`data/`**: SQLite database file (created on first run)
- **`uploads/`**: File uploads directory

### Scripts

```bash
# Development
npm run dev              # Run backend + frontend in dev mode
npm run server:dev       # Run backend only
npm run client:dev       # Run frontend only

# Build
npm run build            # Build backend + frontend
npm run build:server     # Build backend only
npm run build:client     # Build frontend only

# Production
npm start                # Run production build

# Database
npm run db:migrate       # Run database migrations
```

### Adding Real AI Services

Replace mock implementations in `src/server/services/AIServices.ts`:

1. **NotebookLM**: Implement `NotebookLMService` interface with real API
2. **Sora**: Implement `SoraService` interface with real API
3. **HeyGen**: Implement `HeyGenService` interface with real API

Update `AIServiceFactory` to return real implementations when API keys are present.

## 📊 Data Models

### Course Definition Package (CDP)

A complete course includes:
- Course metadata
- 3+ learning outcomes (assessable)
- 1+ sections with objectives
- Source material references
- Configuration (thresholds, retry limits, media formats)

### Section Execution Context

Each section maintains:
- Learner profile and preferences
- Section data (objectives, sources, criticality)
- Progress status (not_started → in_progress → completed)
- Verification records (scores, attempts)
- Remediation logs (type, content)

## 🛡️ Governance & Compliance

### Source Grounding

All instruction must be grounded in approved sources:
- Sources have authority levels (primary, secondary, internal)
- Source versions are tracked
- Section-source mappings are explicit
- NotebookLM enforces source boundaries

### Audit Trail

Every significant action is logged:
- Entity type, entity ID
- Action (created, updated, verified, etc.)
- Actor (user, system, AI service)
- Timestamp
- Changes (JSON)

Query audit trail: `GET /api/assessments/audit/:entityType/:entityId`

### Critical Sections

Sections marked as critical (safety/compliance/legal):
- Higher mastery threshold (0.9 vs 0.8)
- Unlimited retry attempts
- Enhanced validation
- Mandatory completion before progression

## 🧪 Testing

The platform includes:
- Mock AI services for development
- Database initialization on first run
- Health check endpoint: `GET /health`
- API info endpoint: `GET /api`

## 🚧 Roadmap

- [ ] File upload support for source materials
- [ ] Real-time progress tracking with WebSockets
- [ ] Manager dashboard for team oversight
- [ ] Compliance calendar and certification
- [ ] Advanced analytics and reporting
- [ ] Mobile-responsive enhancements
- [ ] Internationalization (i18n)

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For questions or issues:
- Check the API documentation above
- Review the specification document (AI_COURSE_SPEC_v1.1.md)
- Open an issue on GitHub

---

**Built with ❤️ using NotebookLM, Sora, and HeyGen**

Platform Version: 1.0.0
Specification: AI Course Deployment v1.1
