# Platform Audit & Gap Analysis

## Executive Summary

The platform has a solid foundation with complete database schema, repository pattern, API routes, and UI components. However, **critical integration pieces are missing** to make it fully functional with real AI services. This document identifies all gaps and provides an implementation roadmap.

---

## ✅ What's Working

### Backend Infrastructure
- ✅ Complete database schema (20+ tables)
- ✅ Repository pattern for data access
- ✅ RESTful API structure (50+ endpoints)
- ✅ TypeScript types and models
- ✅ Express server setup
- ✅ CORS and middleware configuration
- ✅ Environment variable support

### Frontend Infrastructure
- ✅ React + Vite setup
- ✅ Tailwind CSS styling
- ✅ Routing with React Router
- ✅ API client structure
- ✅ Core UI pages (Dashboard, Course List, Course Creator, Learner List, Learner Journey)

### Data Models
- ✅ Course Definition Package structure
- ✅ Section execution flow models
- ✅ Learner profile and preferences
- ✅ Assessment and verification records
- ✅ Audit trail

---

## ❌ Critical Missing Components

### 1. **File Upload System** ⚠️ HIGH PRIORITY

**Status**: Not implemented
**Impact**: Cannot upload source materials (PDFs, docs, etc.)

**What's Missing:**
- File upload endpoints
- Multer middleware integration (configured but not used)
- File storage management
- File type validation
- File size limits enforcement
- Source content extraction from PDFs/docs

**Required Implementation:**
```typescript
// src/server/routes/uploads.ts
- POST /uploads/source - Upload source material
- GET /uploads/:id - Download source
- DELETE /uploads/:id - Remove source

// src/server/services/FileService.ts
- uploadSourceMaterial()
- extractTextFromPDF()
- extractTextFromDocx()
- validateFileType()
- storeFile()
```

**Dependencies Needed:**
```bash
npm install multer pdf-parse mammoth  # PDF and DOCX parsing
```

---

### 2. **NotebookLM Integration** ⚠️ HIGH PRIORITY

**Status**: Mock implementation only
**Impact**: No actual grounded instruction

**What's Missing:**
- Real NotebookLM API client
- Notebook creation with source upload
- Source document indexing
- Query interface
- Artifact generation (video, podcast, summary)
- Error handling for API failures

**Required Implementation:**
```typescript
// src/server/services/NotebookLMService.ts (Real Implementation)
class RealNotebookLMService implements NotebookLMService {
  async createNotebook(courseId: string, title: string, sources: string[]): Promise<string> {
    // 1. Upload source documents to NotebookLM
    // 2. Create notebook with sources
    // 3. Wait for indexing to complete
    // 4. Return notebook ID
  }

  async generateVideo(notebookId: string, topic: string): Promise<{ url: string; transcript: string }> {
    // 1. Query NotebookLM for grounded content
    // 2. Request video generation
    // 3. Poll for completion
    // 4. Return video URL and transcript
  }

  async addSourceToNotebook(notebookId: string, sourceContent: string): Promise<void> {
    // Add new source to existing notebook
  }
}
```

**API Requirements:**
- NotebookLM API endpoint URL
- Authentication method (API key, OAuth)
- Rate limits understanding
- Pricing/quota information

**Missing Environment Variables:**
```env
NOTEBOOKLM_API_ENDPOINT=https://notebooklm.googleapis.com/v1
NOTEBOOKLM_PROJECT_ID=your_project_id
NOTEBOOKLM_AUTH_METHOD=api_key
```

---

### 3. **Sora Integration** ⚠️ HIGH PRIORITY

**Status**: Mock implementation only
**Impact**: No section welcome videos

**What's Missing:**
- Real Sora API client
- Video generation request handling
- Script generation improvement (currently basic templates)
- Job status polling
- Video URL retrieval
- Retry logic for failed generations

**Required Implementation:**
```typescript
// src/server/services/SoraService.ts (Real Implementation)
class RealSoraService implements SoraService {
  async generateWelcomeVideo(script: string, duration: number): Promise<{ jobId: string }> {
    // 1. Validate script length
    // 2. Submit to Sora API
    // 3. Return job ID
  }

  async checkJobStatus(jobId: string): Promise<{ status: string; url?: string }> {
    // 1. Poll Sora API for job status
    // 2. Return status and URL when complete
  }

  async cancelJob(jobId: string): Promise<void> {
    // Cancel pending job
  }
}
```

**Background Job Needed:**
```typescript
// src/server/jobs/VideoStatusPoller.ts
class VideoStatusPoller {
  async pollVideoStatus(videoAssetId: string): Promise<void> {
    // 1. Get video asset from DB
    // 2. Check status with Sora API
    // 3. Update DB when complete
    // 4. Retry on failure
  }
}
```

**Dependencies Needed:**
```bash
npm install node-cron bull  # Job scheduling and queues
```

---

### 4. **HeyGen Integration** ⚠️ HIGH PRIORITY

**Status**: Mock implementation only
**Impact**: No wrap-up videos

**What's Missing:**
- Real HeyGen API client
- Avatar selection
- Voice selection
- Video template configuration
- Script personalization
- Job status polling

**Required Implementation:**
```typescript
// src/server/services/HeyGenService.ts (Real Implementation)
class RealHeyGenService implements HeyGenService {
  async generateWrapUpVideo(script: string, style: 'section' | 'course'): Promise<{ jobId: string }> {
    // 1. Select appropriate avatar and voice
    // 2. Format script for HeyGen
    // 3. Submit generation request
    // 4. Return job ID
  }

  async checkJobStatus(jobId: string): Promise<{ status: string; url?: string }> {
    // Poll HeyGen API
  }

  async listAvatars(): Promise<Avatar[]> {
    // Get available avatars
  }

  async listVoices(): Promise<Voice[]> {
    // Get available voices
  }
}
```

**Configuration Needed:**
```typescript
// src/server/config/heygen.ts
export const heygenConfig = {
  defaultAvatar: 'professional_female_1',
  defaultVoice: 'en-US-neural',
  sectionWrapUpTemplate: 'template_id_1',
  courseWrapUpTemplate: 'template_id_2'
};
```

---

### 5. **Background Job Processing** ⚠️ HIGH PRIORITY

**Status**: Not implemented
**Impact**: Video generation blocks API requests; no retry on failure

**What's Missing:**
- Job queue system
- Background workers
- Job scheduling
- Retry logic
- Job status tracking
- Failed job handling

**Required Implementation:**
```typescript
// src/server/jobs/JobQueue.ts
import Bull from 'bull';

export const videoQueue = new Bull('video-generation', {
  redis: { host: 'localhost', port: 6379 }
});

// Job processors
videoQueue.process('sora-welcome', async (job) => {
  const { sectionId, script } = job.data;
  // Generate Sora video
  // Update database
  // Notify on completion
});

videoQueue.process('heygen-wrapup', async (job) => {
  const { sectionId, enrollmentId, script } = job.data;
  // Generate HeyGen video
  // Update database
});

videoQueue.process('notebooklm-artifacts', async (job) => {
  const { sectionId, notebookId } = job.data;
  // Generate all NotebookLM artifacts
});
```

**Dependencies Needed:**
```bash
npm install bull redis
# Also need Redis server running
```

**New Routes Needed:**
```typescript
// GET /api/jobs/:jobId - Check job status
// GET /api/jobs - List all jobs (admin)
// POST /api/jobs/:jobId/retry - Retry failed job
```

---

### 6. **Source Content Processing** ⚠️ MEDIUM PRIORITY

**Status**: Not implemented
**Impact**: Cannot extract text from uploaded documents

**What's Missing:**
- PDF text extraction
- DOCX text extraction
- HTML cleaning
- Markdown conversion
- Image extraction (for diagrams)
- Table extraction

**Required Implementation:**
```typescript
// src/server/services/ContentExtractor.ts
export class ContentExtractor {
  async extractFromPDF(filePath: string): Promise<{ text: string; images: Buffer[] }> {
    // Use pdf-parse to extract text
    // Use pdf-image to extract images
  }

  async extractFromDocx(filePath: string): Promise<string> {
    // Use mammoth to extract text
  }

  async extractFromHTML(url: string): Promise<string> {
    // Fetch and clean HTML
    // Convert to markdown
  }

  async chunkContent(text: string, maxChunkSize: number): Promise<string[]> {
    // Split large documents into chunks for NotebookLM
  }
}
```

**Dependencies Needed:**
```bash
npm install pdf-parse mammoth cheerio turndown
```

---

### 7. **Notebook Creation Workflow** ⚠️ HIGH PRIORITY

**Status**: Not implemented
**Impact**: No automated notebook creation when course is published

**What's Missing:**
- Automatic notebook creation on course publish
- Source-to-notebook linking
- Section-to-notebook assignment
- Notebook validation (has required sources)

**Required Implementation:**
```typescript
// src/server/services/NotebookCreationService.ts
export class NotebookCreationService {
  async createNotebooksForCourse(courseId: string): Promise<void> {
    // 1. Get course sections
    // 2. Group sections by notebook type
    // 3. For each group:
    //    - Collect all source materials
    //    - Extract content from sources
    //    - Create NotebookLM notebook
    //    - Link notebook to sections
    //    - Store notebook ID
  }

  async validateNotebook(notebookId: string): Promise<boolean> {
    // Check notebook has required sources
    // Check notebook is indexed
    // Check notebook is queryable
  }
}
```

**New API Endpoint:**
```typescript
// POST /api/courses/:id/create-notebooks
// This should be called after course is published
```

---

### 8. **Assessment Auto-Generation** ⚠️ MEDIUM PRIORITY

**Status**: Manual only
**Impact**: Requires manual creation of all assessments

**What's Missing:**
- AI-powered question generation from source materials
- Rubric generation for explain-back assessments
- Scenario generation based on section objectives
- Question difficulty calibration

**Required Implementation:**
```typescript
// src/server/services/AssessmentGenerator.ts
export class AssessmentGenerator {
  async generateQuizQuestions(
    sectionId: string,
    notebookId: string,
    count: number
  ): Promise<Assessment[]> {
    // 1. Query NotebookLM for key concepts
    // 2. Generate MCQ questions
    // 3. Create distractors
    // 4. Assign difficulty levels
  }

  async generateScenario(
    sectionId: string,
    objectives: string[]
  ): Promise<Assessment> {
    // Generate scenario-based assessment
    // Create rubric
  }
}
```

---

### 9. **Interactive Learning Interface** ⚠️ HIGH PRIORITY

**Status**: Not implemented
**Impact**: No actual learner experience; just tracking UI

**What's Missing:**
- Chat interface for calibration
- Video player for welcome/wrap-up
- Audio player for podcast
- Quiz interface with multiple choice
- Scenario interface with text input
- Explain-back interface
- Real-time feedback
- Progress indicators
- Next/previous navigation

**Required Implementation:**

**New Frontend Pages:**
```typescript
// client/src/pages/SectionLearning.tsx
- Welcome video player
- Calibration chat interface
- Instruction content viewer (video, podcast, summary tabs)
- Assessment interface (quiz, scenario, explain-back)
- Remediation display
- Wrap-up video player
- Progress bar
- Next section button
```

**New Components:**
```typescript
// client/src/components/VideoPlayer.tsx
// client/src/components/AudioPlayer.tsx
// client/src/components/ChatInterface.tsx
// client/src/components/QuizInterface.tsx
// client/src/components/ScenarioInterface.tsx
// client/src/components/ProgressBar.tsx
```

---

### 10. **Video Status Polling** ⚠️ HIGH PRIORITY

**Status**: Not implemented
**Impact**: No way to know when videos are ready

**What's Missing:**
- Polling mechanism for Sora video status
- Polling mechanism for HeyGen video status
- Database updates when videos complete
- Notification to learner when ready
- Frontend status indicators

**Required Implementation:**

**Backend:**
```typescript
// src/server/jobs/VideoPoller.ts
import cron from 'node-cron';

export class VideoPoller {
  start() {
    // Run every minute
    cron.schedule('* * * * *', async () => {
      await this.pollPendingVideos();
    });
  }

  async pollPendingVideos() {
    // 1. Get all processing videos
    // 2. Check status with Sora/HeyGen
    // 3. Update database when complete
    // 4. Notify learner
  }
}
```

**Frontend:**
```typescript
// client/src/hooks/useVideoStatus.ts
export function useVideoStatus(videoAssetId: string) {
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const interval = setInterval(async () => {
      const response = await apiClient.get(`/assessments/videos/${videoAssetId}`);
      setStatus(response.data.video.generation_status);

      if (status === 'completed' || status === 'failed') {
        clearInterval(interval);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [videoAssetId]);

  return status;
}
```

---

### 11. **Script Generation Improvement** ⚠️ MEDIUM PRIORITY

**Status**: Basic templates only
**Impact**: Generic, non-personalized video scripts

**What's Missing:**
- AI-powered script generation
- Personalization based on learner profile
- Section content integration
- Tone adjustment (formal vs casual)
- Length optimization

**Required Implementation:**
```typescript
// src/server/services/ScriptGenerator.ts
export class ScriptGenerator {
  async generateWelcomeScript(
    section: Section,
    learnerProfile: LearnerProfile
  ): Promise<string> {
    // Use GPT-4 or similar to generate:
    // - Personalized greeting
    // - Relevance to learner's background
    // - Section overview
    // - Learning objectives
    // - Motivational hook
  }

  async generateWrapUpScript(
    section: Section,
    learnerProfile: LearnerProfile,
    performanceData: VerificationRecord[]
  ): Promise<string> {
    // Generate based on:
    // - What learner mastered
    // - Struggles and remediation
    // - Next steps
    // - Encouragement
  }
}
```

---

### 12. **Calibration Chat Implementation** ⚠️ HIGH PRIORITY

**Status**: API exists but no chat interface
**Impact**: Cannot conduct pre-learning assessment

**What's Missing:**
- Chat UI component
- Question generation from objectives
- Response analysis
- Gap identification
- Adaptive questioning (follow-up based on answers)

**Required Implementation:**

**Frontend:**
```typescript
// client/src/components/CalibrationChat.tsx
export function CalibrationChat({ sectionId, objectives }: Props) {
  const [messages, setMessages] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);

  // 1. Generate questions from objectives
  // 2. Ask one at a time
  // 3. Analyze responses
  // 4. Submit to calibration endpoint
}
```

**Backend:**
```typescript
// src/server/services/CalibrationService.ts
export class CalibrationService {
  async generateQuestions(objectives: SectionObjective[]): Promise<string[]> {
    // Generate 3-5 calibration questions
  }

  async analyzeResponse(question: string, answer: string): Promise<{
    hasGap: boolean;
    confidence: number;
    followUpQuestion?: string;
  }> {
    // Use AI to analyze learner's answer
  }
}
```

---

### 13. **Error Handling & Validation** ⚠️ MEDIUM PRIORITY

**Status**: Minimal
**Impact**: Poor error messages, potential crashes

**What's Missing:**
- Input validation middleware
- API error responses with proper status codes
- Retry logic for AI service failures
- Graceful degradation (if video fails, show text)
- User-friendly error messages
- Error logging

**Required Implementation:**
```typescript
// src/server/middleware/validation.ts
import { body, param, validationResult } from 'express-validator';

export const validateCourseCreation = [
  body('title').isLength({ min: 5, max: 200 }),
  body('description').isLength({ min: 20 }),
  body('outcomes').isArray({ min: 3 }),
  // ... more validations
];

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};
```

**Centralized Error Handler:**
```typescript
// src/server/middleware/errorHandler.ts
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

export const errorHandler = (err: Error, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }

  // Log unexpected errors
  console.error('Unexpected error:', err);

  res.status(500).json({ error: 'Internal server error' });
};
```

---

### 14. **Course Publishing Workflow** ⚠️ HIGH PRIORITY

**Status**: Partial
**Impact**: Cannot properly prepare course for learners

**What's Missing:**
- Publishing checklist validation
- Notebook creation on publish
- Assessment verification
- Source availability check
- Generate all required videos upfront (optional)
- Unpublish capability

**Required Implementation:**
```typescript
// src/server/services/CoursePublishingService.ts
export class CoursePublishingService {
  async validateForPublishing(courseId: string): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    // Check: Has 3+ outcomes
    // Check: All sections have objectives
    // Check: All sections have sources
    // Check: All sections have assessments
    // Check: Critical sections have enhanced validation
    // Check: Configuration is set

    return { valid: errors.length === 0, errors };
  }

  async publish(courseId: string): Promise<void> {
    // 1. Validate
    // 2. Create notebooks
    // 3. Generate section welcome videos (optional)
    // 4. Set status to published
    // 5. Log audit trail
  }

  async unpublish(courseId: string): Promise<void> {
    // Check: No active enrollments
    // Set status to draft
  }
}
```

**New API Endpoint:**
```typescript
// POST /api/courses/:id/validate - Check if ready to publish
// POST /api/courses/:id/unpublish - Revert to draft
```

---

### 15. **Source Material Upload UI** ⚠️ HIGH PRIORITY

**Status**: Not implemented
**Impact**: Cannot add source materials to courses

**Required Implementation:**

**Frontend:**
```typescript
// client/src/pages/SourceManager.tsx
export function SourceManager() {
  const [sources, setSources] = useState([]);

  const handleFileUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', file.name);
    formData.append('source_type', getFileType(file));
    formData.append('authority_level', 'primary');

    await sourceAPI.upload(formData);
    loadSources();
  };

  return (
    // File upload dropzone
    // Source list
    // Link to sections
  );
}
```

**Backend:**
```typescript
// src/server/routes/uploads.ts
import multer from 'multer';

const storage = multer.diskStorage({
  destination: './uploads',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/msword', 'text/html'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

router.post('/upload', upload.single('file'), async (req, res) => {
  // Save to database
  // Extract content
  // Return source ID
});
```

---

### 16. **Configuration UI** ⚠️ MEDIUM PRIORITY

**Status**: Not implemented
**Impact**: Cannot configure course thresholds and settings

**Required Implementation:**
```typescript
// client/src/components/CourseConfiguration.tsx
export function CourseConfiguration({ courseId }: Props) {
  const [config, setConfig] = useState({
    mastery_threshold_standard: 0.8,
    mastery_threshold_critical: 0.9,
    retry_limit_standard: 3,
    retry_limit_critical: 999,
    media_formats: ['audio', 'video', 'text'],
    heygen_mandatory: true,
    compliance_calendar_enabled: false
  });

  const handleSave = async () => {
    await courseAPI.setConfiguration(courseId, config);
  };

  // Render form with sliders, toggles, etc.
}
```

---

### 17. **Real-time Progress Updates** ⚠️ MEDIUM PRIORITY

**Status**: Not implemented
**Impact**: No live updates; requires manual refresh

**What's Missing:**
- WebSocket connection
- Progress broadcast
- Video status broadcast
- Assessment completion broadcast

**Required Implementation:**
```typescript
// src/server/websocket.ts
import { Server } from 'socket.io';

export function setupWebSocket(httpServer) {
  const io = new Server(httpServer, { cors: { origin: '*' } });

  io.on('connection', (socket) => {
    socket.on('join-enrollment', (enrollmentId) => {
      socket.join(`enrollment-${enrollmentId}`);
    });
  });

  return io;
}

// Broadcast progress update
export function broadcastProgress(enrollmentId: string, progress: any) {
  io.to(`enrollment-${enrollmentId}`).emit('progress-update', progress);
}
```

**Frontend:**
```typescript
// client/src/hooks/useRealtimeProgress.ts
import { useEffect, useState } from 'react';
import io from 'socket.io-client';

export function useRealtimeProgress(enrollmentId: string) {
  const [progress, setProgress] = useState([]);

  useEffect(() => {
    const socket = io('http://localhost:3000');
    socket.emit('join-enrollment', enrollmentId);

    socket.on('progress-update', (data) => {
      setProgress(data);
    });

    return () => socket.disconnect();
  }, [enrollmentId]);

  return progress;
}
```

**Dependencies Needed:**
```bash
npm install socket.io
cd client && npm install socket.io-client
```

---

### 18. **Testing** ⚠️ MEDIUM PRIORITY

**Status**: No tests
**Impact**: No test coverage

**Required Implementation:**
```typescript
// src/server/__tests__/CourseRepository.test.ts
// src/server/__tests__/SectionExecution.test.ts
// client/src/__tests__/CourseCreator.test.tsx
```

**Dependencies Needed:**
```bash
npm install --save-dev jest @types/jest ts-jest supertest
cd client && npm install --save-dev vitest @testing-library/react
```

---

### 19. **API Documentation** ⚠️ LOW PRIORITY

**Status**: Markdown only
**Impact**: No interactive API docs

**What's Missing:**
- Swagger/OpenAPI documentation
- Interactive API explorer
- Request/response examples
- Authentication documentation

**Required Implementation:**
```bash
npm install swagger-ui-express swagger-jsdoc
```

---

### 20. **Logging & Monitoring** ⚠️ MEDIUM PRIORITY

**Status**: Console.log only
**Impact**: No structured logging, difficult debugging

**Required Implementation:**
```typescript
// src/server/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

**Dependencies Needed:**
```bash
npm install winston
```

---

## 📋 Implementation Priority Matrix

### Phase 1: Core Functionality (Weeks 1-2)
**Must have to work at all:**
1. ✅ File upload system
2. ✅ Real NotebookLM integration
3. ✅ Real Sora integration
4. ✅ Real HeyGen integration
5. ✅ Background job processing
6. ✅ Source content extraction
7. ✅ Notebook creation workflow
8. ✅ Video status polling

### Phase 2: Learning Experience (Weeks 3-4)
**Must have for learners to use:**
9. ✅ Interactive learning interface (Section Learning page)
10. ✅ Video/audio players
11. ✅ Chat interface for calibration
12. ✅ Quiz/assessment interfaces
13. ✅ Source upload UI
14. ✅ Course publishing workflow

### Phase 3: Polish & Optimization (Weeks 5-6)
**Important for production:**
15. ✅ Error handling & validation
16. ✅ Script generation improvement
17. ✅ Assessment auto-generation
18. ✅ Configuration UI
19. ✅ Real-time updates (WebSocket)
20. ✅ Logging & monitoring

### Phase 4: Quality & Scale (Weeks 7-8)
**Important for scale:**
21. Testing (unit, integration, e2e)
22. Performance optimization
23. Caching layer (Redis)
24. CDN for video delivery
25. API documentation (Swagger)

---

## 🔧 Required External Services

### 1. NotebookLM
- **API Access**: Need Google Cloud project with NotebookLM API enabled
- **Pricing**: Unknown (check Google Cloud pricing)
- **Quotas**: Unknown (check limits)
- **Documentation**: Need API documentation URL

### 2. Sora
- **API Access**: Need OpenAI account with Sora API access
- **Pricing**: ~$0.10-$0.30 per second of video generated (estimate)
- **Quotas**: Rate limits apply
- **Documentation**: https://platform.openai.com/docs/guides/sora (hypothetical)

### 3. HeyGen
- **API Access**: Need HeyGen API key
- **Pricing**: Per-video pricing (check HeyGen website)
- **Quotas**: Check rate limits
- **Documentation**: https://docs.heygen.com/

### 4. Redis (for job queue)
- **Installation**: Local or hosted (RedisLabs, AWS ElastiCache)
- **Purpose**: Background job processing
- **Cost**: Free for development, ~$10-50/mo for production

### 5. Storage (for uploads)
- **Options**: Local filesystem, AWS S3, Google Cloud Storage
- **Recommendation**: Use S3 for production
- **Cost**: ~$0.023/GB/month

---

## 📦 Additional Dependencies Needed

```bash
# Backend
npm install multer pdf-parse mammoth cheerio turndown
npm install bull redis
npm install node-cron
npm install socket.io
npm install winston
npm install express-validator
npm install aws-sdk  # If using S3

# Frontend
cd client
npm install socket.io-client
npm install react-dropzone  # File upload UI
npm install react-player    # Video player
npm install @headlessui/react  # Modal, dropdown components
```

---

## 🚀 Recommended Next Steps

### Immediate (Week 1)
1. **Set up Redis** for job queue
2. **Implement file upload** system
3. **Research NotebookLM API** - Get documentation and access
4. **Research Sora API** - Get documentation and access
5. **Research HeyGen API** - Get documentation and access

### Short-term (Week 2)
6. **Implement real AI service clients** (NotebookLM, Sora, HeyGen)
7. **Build background job system** with Bull queue
8. **Create source content extractor**
9. **Implement video status polling**

### Medium-term (Weeks 3-4)
10. **Build interactive learning interface**
11. **Create video/audio player components**
12. **Implement chat interface**
13. **Build quiz/assessment UI**
14. **Complete publishing workflow**

### Long-term (Weeks 5+)
15. Add comprehensive error handling
16. Implement testing
17. Add monitoring and logging
18. Optimize performance
19. Add real-time updates
20. Production deployment

---

## 💡 Key Architectural Decisions Needed

1. **Job Queue**: Bull + Redis vs. AWS SQS vs. Google Cloud Tasks?
2. **File Storage**: Local vs. S3 vs. Google Cloud Storage?
3. **Video Storage**: Where to store generated videos long-term?
4. **AI Service Fallbacks**: What happens if NotebookLM is down?
5. **Caching Strategy**: Redis for what data?
6. **WebSocket vs. Polling**: For real-time updates?
7. **Monolith vs. Microservices**: Keep as is or split services?

---

## 🎯 Success Metrics

To consider the platform "functional", we need:

- ✅ Upload a PDF source material
- ✅ Create a course with sections and outcomes
- ✅ Publish course (creates NotebookLM notebooks)
- ✅ Enroll a learner
- ✅ Learner completes full section execution loop:
  - Watch Sora welcome video
  - Complete calibration chat
  - Access NotebookLM instruction (video/podcast/summary)
  - Complete assessment
  - Receive remediation if needed
  - Watch HeyGen wrap-up video
- ✅ Track progress in dashboard
- ✅ View audit trail

---

## 📝 Conclusion

The platform has **excellent foundational architecture** but is missing **critical integration layers** to be functional. The main gaps are:

1. **Real AI service integrations** (NotebookLM, Sora, HeyGen)
2. **File upload and content processing**
3. **Background job processing**
4. **Interactive learning interface**
5. **Video status polling**

Estimated effort to make fully functional: **6-8 weeks** for a single developer.

Priority should be on **Phase 1 (Core Functionality)** to get the system working end-to-end, then **Phase 2 (Learning Experience)** to make it usable by learners.
