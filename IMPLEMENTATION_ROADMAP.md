# Implementation Roadmap - Making the Platform Functional

This roadmap addresses the critical gaps identified in the platform audit and provides a step-by-step plan to make the platform fully operational with real AI service integrations.

---

## 🎯 Goal: End-to-End Working System

**Target**: Complete the full course creation → publishing → learning journey workflow with real AI integrations.

**Timeline**: 6-8 weeks (1 developer) or 3-4 weeks (2 developers)

---

## Phase 1: Foundation & Integrations (Weeks 1-2)

### Week 1: Infrastructure Setup

#### 1.1 Set Up Redis & Job Queue (Day 1)
```bash
# Install Redis
# macOS
brew install redis
brew services start redis

# Ubuntu
sudo apt install redis-server
sudo systemctl start redis

# Install dependencies
npm install bull redis ioredis
```

**Create job queue infrastructure:**
```typescript
// src/server/jobs/queues.ts
import Bull from 'bull';

export const videoQueue = new Bull('video-generation', {
  redis: { host: 'localhost', port: 6379 }
});

export const notebookQueue = new Bull('notebook-processing', {
  redis: { host: 'localhost', port: 6379 }
});

export const contentQueue = new Bull('content-extraction', {
  redis: { host: 'localhost', port: 6379 }
});
```

**Deliverable**: Redis running, job queues initialized

---

#### 1.2 File Upload System (Days 2-3)

**Install dependencies:**
```bash
npm install multer pdf-parse mammoth cheerio turndown
```

**Implementation files to create:**

1. **Upload route** (`src/server/routes/uploads.ts`):
```typescript
import express from 'express';
import multer from 'multer';
import { SourceRepository } from '../repositories/SourceRepository';
import { ContentExtractor } from '../services/ContentExtractor';

const upload = multer({
  storage: multer.diskStorage({
    destination: './uploads',
    filename: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${file.originalname}`;
      cb(null, uniqueName);
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    cb(null, allowed.includes(file.mimetype));
  }
});

router.post('/upload', upload.single('file'), async (req, res) => {
  const { title, source_type, authority_level, jurisdiction } = req.body;

  // 1. Save file info to database
  const source = await sourceRepo.createSource({
    title,
    source_type,
    file_path: req.file!.path,
    authority_level,
    jurisdiction,
    uploaded_by: 'system' // TODO: Get from auth
  });

  // 2. Queue content extraction
  await contentQueue.add('extract', {
    sourceId: source.id,
    filePath: req.file!.path,
    fileType: source_type
  });

  res.status(201).json({ source });
});
```

2. **Content extractor** (`src/server/services/ContentExtractor.ts`):
```typescript
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs/promises';

export class ContentExtractor {
  async extractFromPDF(filePath: string): Promise<string> {
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }

  async extractFromDocx(filePath: string): Promise<string> {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  async chunkContent(text: string, maxChunkSize: number = 50000): Promise<string[]> {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += maxChunkSize) {
      chunks.push(text.substring(i, i + maxChunkSize));
    }
    return chunks;
  }
}
```

3. **Content extraction job processor** (`src/server/jobs/processors/contentProcessor.ts`):
```typescript
import { contentQueue } from '../queues';
import { ContentExtractor } from '../../services/ContentExtractor';

const extractor = new ContentExtractor();

contentQueue.process('extract', async (job) => {
  const { sourceId, filePath, fileType } = job.data;

  let text: string;

  if (fileType === 'pdf') {
    text = await extractor.extractFromPDF(filePath);
  } else if (fileType === 'docx') {
    text = await extractor.extractFromDocx(filePath);
  } else {
    throw new Error('Unsupported file type');
  }

  // Store extracted text in database
  // Update source with extracted content status

  return { sourceId, extractedLength: text.length };
});
```

**Deliverable**: Can upload PDF/DOCX files, extract text content

---

#### 1.3 Research & Set Up AI Service Access (Days 3-4)

**Tasks:**
1. **NotebookLM**:
   - Research API availability
   - Get API credentials
   - Read API documentation
   - Test basic API calls

2. **Sora**:
   - Check OpenAI Sora API access
   - Get API key
   - Understand rate limits and pricing
   - Test video generation

3. **HeyGen**:
   - Sign up for HeyGen account
   - Get API key
   - Review avatar/voice options
   - Test video generation

**Create configuration file** (`src/server/config/ai-services.ts`):
```typescript
export const aiServiceConfig = {
  notebookLM: {
    apiEndpoint: process.env.NOTEBOOKLM_API_ENDPOINT,
    apiKey: process.env.NOTEBOOKLM_API_KEY,
    projectId: process.env.NOTEBOOKLM_PROJECT_ID,
    timeout: 30000,
    maxRetries: 3
  },
  sora: {
    apiEndpoint: process.env.SORA_API_ENDPOINT || 'https://api.openai.com/v1/videos',
    apiKey: process.env.SORA_API_KEY,
    model: 'sora-1.0',
    maxDuration: 60,
    resolution: '1280x720'
  },
  heygen: {
    apiEndpoint: process.env.HEYGEN_API_ENDPOINT || 'https://api.heygen.com/v1',
    apiKey: process.env.HEYGEN_API_KEY,
    defaultAvatar: 'avatar_professional_1',
    defaultVoice: 'en-US-neural-female'
  }
};
```

**Update .env.example:**
```env
# NotebookLM
NOTEBOOKLM_API_ENDPOINT=https://notebooklm.googleapis.com/v1
NOTEBOOKLM_API_KEY=your_api_key_here
NOTEBOOKLM_PROJECT_ID=your_project_id

# Sora (OpenAI)
SORA_API_ENDPOINT=https://api.openai.com/v1/videos
SORA_API_KEY=sk-your_openai_key_here

# HeyGen
HEYGEN_API_ENDPOINT=https://api.heygen.com/v1
HEYGEN_API_KEY=your_heygen_key_here
```

**Deliverable**: API credentials obtained, configuration set up

---

### Week 2: Real AI Service Integration

#### 2.1 NotebookLM Service Implementation (Days 5-7)

**File**: `src/server/services/NotebookLMService.real.ts`

```typescript
import axios from 'axios';
import { aiServiceConfig } from '../config/ai-services';

export class RealNotebookLMService implements NotebookLMService {
  private apiClient = axios.create({
    baseURL: aiServiceConfig.notebookLM.apiEndpoint,
    headers: {
      'Authorization': `Bearer ${aiServiceConfig.notebookLM.apiKey}`,
      'Content-Type': 'application/json'
    },
    timeout: aiServiceConfig.notebookLM.timeout
  });

  async createNotebook(courseId: string, title: string, sources: string[]): Promise<string> {
    try {
      // 1. Upload source documents
      const uploadedSources = await this.uploadSources(sources);

      // 2. Create notebook
      const response = await this.apiClient.post('/notebooks', {
        name: title,
        project_id: aiServiceConfig.notebookLM.projectId,
        sources: uploadedSources
      });

      // 3. Wait for indexing
      await this.waitForIndexing(response.data.notebook_id);

      return response.data.notebook_id;
    } catch (error) {
      console.error('NotebookLM notebook creation failed:', error);
      throw new Error(`Failed to create NotebookLM notebook: ${error.message}`);
    }
  }

  private async uploadSources(sourcePaths: string[]): Promise<any[]> {
    const uploads = sourcePaths.map(async (path) => {
      const formData = new FormData();
      formData.append('file', fs.createReadStream(path));

      const response = await this.apiClient.post('/sources/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      return response.data;
    });

    return Promise.all(uploads);
  }

  private async waitForIndexing(notebookId: string, maxWait = 60000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < maxWait) {
      const response = await this.apiClient.get(`/notebooks/${notebookId}/status`);

      if (response.data.status === 'ready') {
        return;
      }

      if (response.data.status === 'failed') {
        throw new Error('Notebook indexing failed');
      }

      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2s
    }

    throw new Error('Notebook indexing timeout');
  }

  async generateVideo(notebookId: string, topic: string): Promise<{ url: string; transcript: string }> {
    const response = await this.apiClient.post(`/notebooks/${notebookId}/generate`, {
      type: 'video',
      topic,
      duration: 300 // 5 minutes
    });

    // Poll for completion
    const result = await this.pollForCompletion(response.data.job_id);

    return {
      url: result.video_url,
      transcript: result.transcript
    };
  }

  async generatePodcast(notebookId: string, topic: string): Promise<{ url: string; transcript: string }> {
    const response = await this.apiClient.post(`/notebooks/${notebookId}/generate`, {
      type: 'audio',
      topic,
      duration: 600 // 10 minutes
    });

    const result = await this.pollForCompletion(response.data.job_id);

    return {
      url: result.audio_url,
      transcript: result.transcript
    };
  }

  async generateSummary(notebookId: string, topic: string): Promise<string> {
    const response = await this.apiClient.post(`/notebooks/${notebookId}/query`, {
      query: `Provide a comprehensive summary of ${topic} based on the source materials.`,
      format: 'markdown'
    });

    return response.data.answer;
  }

  private async pollForCompletion(jobId: string): Promise<any> {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max

    while (attempts < maxAttempts) {
      const response = await this.apiClient.get(`/jobs/${jobId}`);

      if (response.data.status === 'completed') {
        return response.data.result;
      }

      if (response.data.status === 'failed') {
        throw new Error(`Job failed: ${response.data.error}`);
      }

      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s
      attempts++;
    }

    throw new Error('Job timeout');
  }
}
```

**Update service factory** (`src/server/services/AIServices.ts`):
```typescript
import { RealNotebookLMService } from './NotebookLMService.real';

export class AIServiceFactory {
  static getNotebookLMService(): NotebookLMService {
    if (process.env.NOTEBOOKLM_API_KEY && process.env.NOTEBOOKLM_API_KEY !== 'mock_notebooklm_key') {
      return new RealNotebookLMService();
    }
    return new MockNotebookLMService();
  }
  // ... similar for Sora and HeyGen
}
```

**Deliverable**: Real NotebookLM integration working

---

#### 2.2 Sora Service Implementation (Days 7-8)

**File**: `src/server/services/SoraService.real.ts`

```typescript
import axios from 'axios';
import { aiServiceConfig } from '../config/ai-services';

export class RealSoraService implements SoraService {
  private apiClient = axios.create({
    baseURL: aiServiceConfig.sora.apiEndpoint,
    headers: {
      'Authorization': `Bearer ${aiServiceConfig.sora.apiKey}`,
      'Content-Type': 'application/json'
    }
  });

  async generateWelcomeVideo(script: string, duration: number): Promise<{ jobId: string }> {
    const response = await this.apiClient.post('/generations', {
      model: aiServiceConfig.sora.model,
      prompt: this.formatScriptForSora(script),
      duration_seconds: Math.min(duration, aiServiceConfig.sora.maxDuration),
      resolution: aiServiceConfig.sora.resolution,
      aspect_ratio: '16:9'
    });

    return { jobId: response.data.id };
  }

  async checkJobStatus(jobId: string): Promise<{ status: string; url?: string }> {
    const response = await this.apiClient.get(`/generations/${jobId}`);

    return {
      status: this.mapStatus(response.data.status),
      url: response.data.output?.video_url
    };
  }

  private formatScriptForSora(script: string): string {
    // Convert script to visual prompt for Sora
    // This is simplified - you may want more sophisticated conversion
    return `Professional educational video: ${script}. Clean, modern aesthetic with text overlays for key points.`;
  }

  private mapStatus(soraStatus: string): 'pending' | 'processing' | 'completed' | 'failed' {
    const mapping: Record<string, any> = {
      'queued': 'pending',
      'processing': 'processing',
      'succeeded': 'completed',
      'failed': 'failed'
    };
    return mapping[soraStatus] || 'processing';
  }
}
```

**Deliverable**: Real Sora integration working

---

#### 2.3 HeyGen Service Implementation (Days 8-9)

**File**: `src/server/services/HeyGenService.real.ts`

```typescript
import axios from 'axios';
import { aiServiceConfig } from '../config/ai-services';

export class RealHeyGenService implements HeyGenService {
  private apiClient = axios.create({
    baseURL: aiServiceConfig.heygen.apiEndpoint,
    headers: {
      'X-Api-Key': aiServiceConfig.heygen.apiKey,
      'Content-Type': 'application/json'
    }
  });

  async generateWrapUpVideo(script: string, style: 'section' | 'course'): Promise<{ jobId: string }> {
    const response = await this.apiClient.post('/video/generate', {
      avatar_id: aiServiceConfig.heygen.defaultAvatar,
      voice_id: aiServiceConfig.heygen.defaultVoice,
      script: script,
      background: style === 'course' ? 'celebratory' : 'professional',
      dimension: '1280x720'
    });

    return { jobId: response.data.video_id };
  }

  async checkJobStatus(jobId: string): Promise<{ status: string; url?: string }> {
    const response = await this.apiClient.get(`/video/${jobId}`);

    return {
      status: this.mapStatus(response.data.status),
      url: response.data.video_url
    };
  }

  private mapStatus(heygenStatus: string): 'pending' | 'processing' | 'completed' | 'failed' {
    const mapping: Record<string, any> = {
      'pending': 'pending',
      'processing': 'processing',
      'completed': 'completed',
      'failed': 'failed'
    };
    return mapping[heygenStatus] || 'processing';
  }
}
```

**Deliverable**: Real HeyGen integration working

---

#### 2.4 Video Status Polling System (Days 9-10)

**File**: `src/server/jobs/VideoPoller.ts`

```typescript
import cron from 'node-cron';
import { getDatabase } from '../db/database';
import { AssessmentRepository } from '../repositories/AssessmentRepository';
import { AIServiceFactory } from '../services/AIServices';

export class VideoPoller {
  private db = getDatabase();
  private assessmentRepo = new AssessmentRepository(this.db);
  private soraService = AIServiceFactory.getSoraService();
  private heygenService = AIServiceFactory.getHeyGenService();

  start() {
    // Run every 30 seconds
    cron.schedule('*/30 * * * * *', async () => {
      await this.pollPendingVideos();
    });

    console.log('Video poller started');
  }

  private async pollPendingVideos() {
    const pendingVideos = await this.db.all(
      `SELECT * FROM video_assets
       WHERE generation_status IN ('pending', 'processing')
       AND created_at > datetime('now', '-24 hours')`
    );

    for (const video of pendingVideos) {
      try {
        await this.checkVideoStatus(video);
      } catch (error) {
        console.error(`Failed to check video ${video.id}:`, error);
      }
    }
  }

  private async checkVideoStatus(video: any) {
    let result;

    if (video.asset_type === 'sora_welcome') {
      result = await this.soraService.checkJobStatus(video.external_job_id);
    } else {
      result = await this.heygenService.checkJobStatus(video.external_job_id);
    }

    if (result.status !== video.generation_status) {
      await this.assessmentRepo.updateVideoAsset(video.id, {
        generation_status: result.status,
        video_url: result.url,
        ...(result.status === 'completed' && { completed_at: new Date() })
      });

      console.log(`Video ${video.id} status updated: ${result.status}`);
    }
  }
}
```

**Start poller in server.ts:**
```typescript
import { VideoPoller } from './jobs/VideoPoller';

const poller = new VideoPoller();
poller.start();
```

**Deliverable**: Videos automatically update when completed

---

## Phase 2: Course Creation Workflow (Week 3)

### 3.1 Source Upload UI (Days 11-12)

**Frontend file**: `client/src/pages/SourceManager.tsx`

```typescript
import { useState } from 'react';
import { useDropzone } from 'react-dropzone';

export default function SourceManager() {
  const [sources, setSources] = useState([]);
  const [uploading, setUploading] = useState(false);

  const onDrop = async (acceptedFiles: File[]) => {
    setUploading(true);

    for (const file of acceptedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);
      formData.append('source_type', file.type.includes('pdf') ? 'pdf' : 'docx');
      formData.append('authority_level', 'primary');

      try {
        await fetch('http://localhost:3000/api/uploads/upload', {
          method: 'POST',
          body: formData
        });
      } catch (error) {
        alert(`Failed to upload ${file.name}`);
      }
    }

    setUploading(false);
    loadSources();
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    }
  });

  const loadSources = async () => {
    const response = await fetch('http://localhost:3000/api/sources');
    const data = await response.json();
    setSources(data.sources);
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Source Materials</h1>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary-500 cursor-pointer"
      >
        <input {...getInputProps()} />
        <p className="text-gray-600">
          {uploading ? 'Uploading...' : 'Drag & drop PDF or DOCX files here, or click to select'}
        </p>
      </div>

      {/* Source list */}
      <div className="mt-8">
        {sources.map((source: any) => (
          <div key={source.id} className="bg-white p-4 rounded shadow mb-2">
            <h3 className="font-medium">{source.title}</h3>
            <p className="text-sm text-gray-500">{source.source_type} - {source.authority_level}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Install dependency:**
```bash
cd client
npm install react-dropzone
```

**Add route to App.tsx:**
```typescript
<Route path="/sources" element={<SourceManager />} />
```

**Deliverable**: Can upload sources via drag-and-drop

---

### 3.2 Notebook Creation Workflow (Days 12-13)

**Service file**: `src/server/services/NotebookCreationService.ts`

```typescript
import { CourseRepository } from '../repositories/CourseRepository';
import { SourceRepository } from '../repositories/SourceRepository';
import { AIServiceFactory } from './AIServices';

export class NotebookCreationService {
  constructor(
    private courseRepo: CourseRepository,
    private sourceRepo: SourceRepository
  ) {}

  async createNotebooksForCourse(courseId: string): Promise<void> {
    const sections = await this.courseRepo.getSections(courseId);

    // Group sections by notebook type (you can customize grouping logic)
    const notebookGroups = this.groupSections(sections);

    for (const [type, sectionIds] of Object.entries(notebookGroups)) {
      await this.createNotebookForGroup(courseId, type, sectionIds);
    }
  }

  private groupSections(sections: any[]): Record<string, string[]> {
    // Simple grouping: all sections in one notebook
    // You can implement more sophisticated grouping based on section.notebooklm_notebook_id
    return {
      'main': sections.map(s => s.id)
    };
  }

  private async createNotebookForGroup(
    courseId: string,
    type: string,
    sectionIds: string[]
  ): Promise<void> {
    // 1. Collect all sources for these sections
    const allSources = [];
    for (const sectionId of sectionIds) {
      const sources = await this.courseRepo.getSectionSources(sectionId);
      allSources.push(...sources);
    }

    // Remove duplicates
    const uniqueSources = [...new Map(allSources.map(s => [s.id, s])).values()];

    // 2. Get file paths
    const sourcePaths = uniqueSources
      .filter(s => s.file_path)
      .map(s => s.file_path as string);

    if (sourcePaths.length === 0) {
      console.warn(`No sources found for notebook type ${type}`);
      return;
    }

    // 3. Create NotebookLM notebook
    const notebookLM = AIServiceFactory.getNotebookLMService();
    const externalId = await notebookLM.createNotebook(
      courseId,
      `Course ${courseId} - ${type}`,
      sourcePaths
    );

    // 4. Save to database
    const notebook = await this.sourceRepo.createNotebook({
      course_id: courseId,
      title: `${type} notebook`,
      notebook_type: type as any,
      external_id: externalId
    });

    // 5. Link sections to notebook
    for (const sectionId of sectionIds) {
      await this.courseRepo.updateSection(sectionId, {
        notebooklm_notebook_id: notebook.id
      });
    }

    console.log(`Created notebook ${notebook.id} for ${sectionIds.length} sections`);
  }
}
```

**Add to course publishing:**
```typescript
// src/server/routes/courses.ts

router.post('/:id/publish', async (req, res) => {
  const notebookService = new NotebookCreationService(courseRepo, sourceRepo);

  // Create notebooks before publishing
  await notebookService.createNotebooksForCourse(req.params.id);

  // Then publish
  await courseRepo.publishCourse(req.params.id);

  res.json({ message: 'Course published with notebooks created' });
});
```

**Deliverable**: Publishing creates NotebookLM notebooks

---

## Phase 3: Learning Experience (Week 4)

### 4.1 Section Learning Interface (Days 14-16)

**Major new file**: `client/src/pages/SectionLearning.tsx`

This is the main learner interface. Create a complete implementation with:
- Video player for welcome video
- Chat interface for calibration
- Tabs for instruction (video/podcast/summary)
- Quiz/assessment interface
- Remediation display
- Wrap-up video player

**Dependencies:**
```bash
cd client
npm install react-player
```

**Deliverable**: Full interactive learning experience

---

### 4.2 Assessment UI Components (Days 16-17)

Create specialized assessment interfaces:
- `QuizInterface.tsx` - MCQ with radio buttons
- `ScenarioInterface.tsx` - Text input with rubric
- `ExplainBackInterface.tsx` - Rich text editor

**Deliverable**: All assessment types functional

---

## Phase 4: Polish & Production (Weeks 5-6)

### Error Handling, Validation, Logging, Testing, Deployment

See detailed steps in PLATFORM_AUDIT.md Phase 3 & 4.

---

## Quick Start for Immediate Work

### Option A: Start with Mock Services (Test Full Flow)
1. Keep mock services
2. Build Section Learning UI first
3. Test complete flow end-to-end
4. Then replace with real services

### Option B: Integrate Real Services First
1. Get API access for NotebookLM, Sora, HeyGen
2. Implement real service clients
3. Test each service independently
4. Then build UI

**Recommendation**: **Option A** - Build UI with mocks first, then swap in real services. This allows you to validate the complete user experience without depending on external APIs.

---

## Testing Checklist

Once Phase 1-2 complete, you should be able to:

- [ ] Upload a PDF source
- [ ] Create a course with 2 sections
- [ ] Add objectives to sections
- [ ] Link sources to sections
- [ ] Publish course (creates notebooks)
- [ ] Enroll a learner
- [ ] Start section (generates welcome video via Sora)
- [ ] See welcome video when ready
- [ ] Complete calibration chat
- [ ] View NotebookLM instruction
- [ ] Complete assessment
- [ ] Get remediation if failed
- [ ] See wrap-up video (generated via HeyGen)
- [ ] Complete section
- [ ] View progress dashboard
- [ ] Check audit trail

---

## Success Metrics

**Week 2**: Real AI services integrated and tested
**Week 4**: End-to-end learning journey working
**Week 6**: Production-ready with error handling and monitoring

---

This roadmap provides a concrete path from current state to fully functional platform. Focus on Phase 1 first to establish the foundation, then build out the learner experience in Phase 2.
