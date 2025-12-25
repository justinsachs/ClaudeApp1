# AI Service Integration Guide

This guide provides specific information needed to integrate NotebookLM, Sora, and HeyGen APIs.

---

## NotebookLM Integration

### Current Status
- **Implementation**: Mock service only
- **Priority**: HIGH - Core functionality depends on this

### What We Need

#### 1. API Access
- [ ] Google Cloud Project with NotebookLM API enabled
- [ ] API credentials (API key or OAuth token)
- [ ] Project ID

#### 2. API Documentation
**Need to find official documentation for:**
- Creating notebooks programmatically
- Uploading source documents
- Indexing sources
- Generating content (video, audio, text)
- Querying notebooks

**Expected API Structure** (based on typical Google APIs):
```
POST /v1/projects/{projectId}/notebooks
POST /v1/projects/{projectId}/notebooks/{notebookId}/sources
GET  /v1/projects/{projectId}/notebooks/{notebookId}
POST /v1/projects/{projectId}/notebooks/{notebookId}:generate
POST /v1/projects/{projectId}/notebooks/{notebookId}:query
```

#### 3. Integration Points in Our Code

**File**: `src/server/services/NotebookLMService.real.ts`

**Methods to implement:**
```typescript
createNotebook(courseId: string, title: string, sources: string[]): Promise<string>
// Create a notebook with uploaded source documents
// Returns: NotebookLM notebook ID

generateVideo(notebookId: string, topic: string): Promise<{ url: string; transcript: string }>
// Generate video explanation from notebook
// Returns: Video URL and transcript

generatePodcast(notebookId: string, topic: string): Promise<{ url: string; transcript: string }>
// Generate audio podcast from notebook
// Returns: Audio URL and transcript

generateSummary(notebookId: string, topic: string): Promise<string>
// Generate text summary from notebook
// Returns: Markdown summary

askQuestion(notebookId: string, question: string): Promise<string>
// Query notebook with grounded Q&A
// Returns: Grounded answer
```

#### 4. Expected Request/Response Format

**Create Notebook Request:**
```json
POST /v1/projects/my-project/notebooks
{
  "name": "Real Estate Course - Module 1",
  "sources": [
    {
      "type": "document",
      "content": "base64_encoded_pdf_content"
    }
  ]
}
```

**Create Notebook Response:**
```json
{
  "notebookId": "nb_abc123",
  "status": "indexing",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

**Generate Video Request:**
```json
POST /v1/projects/my-project/notebooks/nb_abc123/generate
{
  "type": "video",
  "topic": "Introduction to Property Valuation",
  "duration": 300,
  "style": "educational"
}
```

**Generate Video Response:**
```json
{
  "jobId": "job_xyz789",
  "status": "processing",
  "estimatedCompletion": "2024-01-01T00:05:00Z"
}
```

**Check Job Status:**
```json
GET /v1/projects/my-project/jobs/job_xyz789

Response:
{
  "jobId": "job_xyz789",
  "status": "completed",
  "result": {
    "videoUrl": "https://storage.googleapis.com/notebooklm/videos/xyz.mp4",
    "transcript": "In this video, we'll explore...",
    "duration": 298
  }
}
```

#### 5. Environment Variables Needed

```env
NOTEBOOKLM_API_ENDPOINT=https://notebooklm.googleapis.com/v1
NOTEBOOKLM_API_KEY=AIzaSy...
NOTEBOOKLM_PROJECT_ID=my-project-12345
```

#### 6. Rate Limits to Check
- Requests per minute
- Notebooks per project
- Maximum source size
- Video generation concurrency

#### 7. Pricing to Verify
- Cost per notebook creation
- Cost per video/audio generation
- Cost per query
- Storage costs

### Research Links
- Search for: "Google NotebookLM API documentation"
- Check: https://cloud.google.com/ai/notebooklm
- Alternative: Contact Google Cloud support for API access

---

## Sora Integration

### Current Status
- **Implementation**: Mock service only
- **Priority**: HIGH - Needed for section welcome videos

### What We Need

#### 1. API Access
- [ ] OpenAI account with Sora access
- [ ] API key with Sora permissions
- [ ] Understand beta/waitlist status

#### 2. API Documentation
**Expected based on OpenAI API patterns:**
- Video generation endpoint
- Status checking
- Output retrieval

**Expected API Structure:**
```
POST /v1/videos/generations
GET  /v1/videos/generations/{id}
```

#### 3. Integration Points in Our Code

**File**: `src/server/services/SoraService.real.ts`

**Methods to implement:**
```typescript
generateWelcomeVideo(script: string, duration: number): Promise<{ jobId: string }>
// Generate video from script
// Returns: Job ID for polling

checkJobStatus(jobId: string): Promise<{ status: string; url?: string }>
// Check generation status
// Returns: Status and video URL when ready

cancelJob(jobId: string): Promise<void>
// Cancel pending generation
```

#### 4. Expected Request/Response Format

**Generate Video Request:**
```json
POST /v1/videos/generations
{
  "model": "sora-1.0",
  "prompt": "Professional educational video: Welcome to Property Valuation. Show modern office setting with text overlay of key learning objectives.",
  "duration_seconds": 45,
  "resolution": "1280x720",
  "aspect_ratio": "16:9",
  "style": "professional"
}
```

**Generate Video Response:**
```json
{
  "id": "gen_abc123",
  "object": "video.generation",
  "status": "queued",
  "created_at": 1704067200
}
```

**Check Status Request:**
```json
GET /v1/videos/generations/gen_abc123

Response:
{
  "id": "gen_abc123",
  "object": "video.generation",
  "status": "completed",
  "created_at": 1704067200,
  "completed_at": 1704067320,
  "output": {
    "video_url": "https://cdn.openai.com/sora/videos/gen_abc123.mp4",
    "thumbnail_url": "https://cdn.openai.com/sora/videos/gen_abc123_thumb.jpg",
    "duration": 45,
    "resolution": "1280x720"
  }
}
```

#### 5. Environment Variables Needed

```env
SORA_API_ENDPOINT=https://api.openai.com/v1/videos
SORA_API_KEY=sk-proj-...
SORA_MODEL=sora-1.0
```

#### 6. Important Considerations

**Script to Visual Prompt Conversion:**
Our scripts are text-based, but Sora needs visual descriptions. Need to convert:

```typescript
// Input: "Welcome to Section 1: Property Valuation"
// Output: "Professional educational video. Modern office setting.
//          Text overlay: 'Section 1: Property Valuation'.
//          Transition to instructor speaking. Clean, minimalist aesthetic."
```

**Duration Limits:**
- Check maximum video length
- May need to truncate or split scripts

**Cost Optimization:**
- Cache similar welcome videos
- Pre-generate videos on course publish (optional)
- Consider using same video template with text overlays

#### 7. Rate Limits to Check
- Generations per minute
- Concurrent generations
- Maximum duration
- File size limits

#### 8. Pricing to Verify
- Cost per second of video
- Estimated: $0.10-$0.30 per second
- For 45-second video: ~$4.50-$13.50 each

### Research Links
- OpenAI Sora API documentation: https://platform.openai.com/docs
- Join waitlist: https://openai.com/sora
- Alternative: Use OpenAI chat for now, wait for Sora API

### Temporary Workaround
If Sora not available:
- Use static images with text overlays
- Use Canva API for video generation
- Use Synthesia or similar service
- Skip welcome videos temporarily (just show text)

---

## HeyGen Integration

### Current Status
- **Implementation**: Mock service only
- **Priority**: HIGH - Needed for wrap-up videos

### What We Need

#### 1. API Access
- [ ] HeyGen account (https://heygen.com)
- [ ] API key from dashboard
- [ ] Verify plan includes API access

#### 2. API Documentation
**Official docs**: https://docs.heygen.com/reference/api-overview

**Key endpoints:**
```
POST /v1/video/generate
GET  /v1/video/{video_id}
GET  /v1/avatars
GET  /v1/voices
```

#### 3. Integration Points in Our Code

**File**: `src/server/services/HeyGenService.real.ts`

**Methods to implement:**
```typescript
generateWrapUpVideo(script: string, style: 'section' | 'course'): Promise<{ jobId: string }>
// Generate avatar video with script
// Returns: Video ID for polling

checkJobStatus(jobId: string): Promise<{ status: string; url?: string }>
// Check generation status
// Returns: Status and video URL when ready

listAvatars(): Promise<Avatar[]>
// Get available avatars
// For selecting appropriate avatar

listVoices(): Promise<Voice[]>
// Get available voices
// For selecting appropriate voice
```

#### 4. Expected Request/Response Format

**Generate Video Request:**
```json
POST /v1/video/generate
{
  "video_inputs": [
    {
      "character": {
        "type": "avatar",
        "avatar_id": "avatar_professional_female_1",
        "avatar_style": "normal"
      },
      "voice": {
        "type": "text",
        "input_text": "Congratulations on completing Section 1! Here are your key takeaways: First, you learned about property valuation methods...",
        "voice_id": "en-US-neural-female-1"
      },
      "background": {
        "type": "color",
        "value": "#FFFFFF"
      }
    }
  ],
  "dimension": {
    "width": 1280,
    "height": 720
  },
  "aspect_ratio": "16:9"
}
```

**Generate Video Response:**
```json
{
  "code": 100,
  "data": {
    "video_id": "video_abc123xyz"
  },
  "message": "Success"
}
```

**Check Status Request:**
```json
GET /v1/video/video_abc123xyz

Response:
{
  "code": 100,
  "data": {
    "video_id": "video_abc123xyz",
    "status": "completed",
    "video_url": "https://resource.heygen.com/video_abc123xyz.mp4",
    "thumbnail_url": "https://resource.heygen.com/video_abc123xyz_thumb.jpg",
    "duration": 32.5,
    "created_at": 1704067200
  }
}
```

**List Avatars Request:**
```json
GET /v1/avatars

Response:
{
  "code": 100,
  "data": {
    "avatars": [
      {
        "avatar_id": "avatar_professional_female_1",
        "avatar_name": "Professional Female",
        "preview_image_url": "https://...",
        "gender": "female"
      },
      {
        "avatar_id": "avatar_professional_male_1",
        "avatar_name": "Professional Male",
        "preview_image_url": "https://...",
        "gender": "male"
      }
    ]
  }
}
```

#### 5. Environment Variables Needed

```env
HEYGEN_API_ENDPOINT=https://api.heygen.com/v1
HEYGEN_API_KEY=your_api_key_here
HEYGEN_DEFAULT_AVATAR=avatar_professional_female_1
HEYGEN_DEFAULT_VOICE=en-US-neural-female-1
```

#### 6. Configuration Options

**Avatar Selection:**
- Store avatar preferences in course configuration
- Allow course creator to choose avatar
- Default to professional avatar

**Voice Selection:**
- Match voice to target audience
- Support multiple languages
- Adjust speed/tone if available

**Script Formatting:**
- Maximum script length (check docs)
- SSML support for emphasis/pauses
- Personalization tokens

#### 7. Rate Limits to Check
- Videos per minute
- Concurrent generations
- Maximum video length
- API calls per day

#### 8. Pricing to Verify
**Typical HeyGen pricing:**
- Credit-based system
- ~1 credit per minute of video
- Credits cost varies by plan
- Estimated: $0.15-$0.30 per video minute

**For our use case:**
- Section wrap-up: ~30 seconds = ~$0.08-$0.15
- Course wrap-up: ~60 seconds = ~$0.15-$0.30

### Research Links
- HeyGen API Docs: https://docs.heygen.com/
- Sign up: https://heygen.com/
- Pricing: https://heygen.com/pricing

### Implementation Notes

**Script Enhancement:**
Add SSML for better delivery:
```xml
<speak>
  Congratulations on completing Section 1!
  <break time="500ms"/>
  Here are your key takeaways:
  <emphasis level="strong">First</emphasis>, you learned about property valuation methods...
</speak>
```

**Personalization:**
Use learner name in script:
```typescript
const script = `Great work, ${learnerName}! You've completed ${sectionTitle}...`;
```

**Error Handling:**
- Fallback to text if video generation fails
- Retry with different avatar if failed
- Cache successfully generated videos

---

## Common Integration Patterns

### Authentication
All three services likely use one of:
1. **API Key in Header**: `Authorization: Bearer YOUR_API_KEY`
2. **API Key in Query**: `?api_key=YOUR_API_KEY`
3. **OAuth 2.0**: Token exchange flow

**Our implementation** (`src/server/services/BaseAIService.ts`):
```typescript
import axios, { AxiosInstance } from 'axios';

export abstract class BaseAIService {
  protected apiClient: AxiosInstance;

  constructor(baseURL: string, apiKey: string) {
    this.apiClient = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    // Add retry logic
    this.apiClient.interceptors.response.use(
      response => response,
      async error => {
        if (error.response?.status === 429) {
          // Rate limited - wait and retry
          await new Promise(resolve => setTimeout(resolve, 5000));
          return this.apiClient.request(error.config);
        }
        throw error;
      }
    );
  }
}
```

### Async Job Pattern
All three services use async job pattern:
1. Submit generation request → Get job ID
2. Poll job status until complete
3. Retrieve result URL

**Polling implementation**:
```typescript
async pollUntilComplete(
  jobId: string,
  checkStatus: (id: string) => Promise<any>,
  maxAttempts = 60
): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    const result = await checkStatus(jobId);

    if (result.status === 'completed') {
      return result;
    }

    if (result.status === 'failed') {
      throw new Error(`Job ${jobId} failed: ${result.error}`);
    }

    // Wait 5 seconds between checks
    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  throw new Error(`Job ${jobId} timeout after ${maxAttempts} attempts`);
}
```

### Error Handling
```typescript
try {
  const result = await service.generateVideo(script);
} catch (error) {
  if (error.response?.status === 429) {
    // Rate limited
    logger.warn('Rate limited, queuing for retry');
    await videoQueue.add('generate', { script }, { delay: 60000 });
  } else if (error.response?.status === 402) {
    // Payment required
    logger.error('Insufficient credits/quota');
    // Notify admin
  } else {
    // Other error
    logger.error('Video generation failed:', error);
    // Fallback to text or retry
  }
}
```

---

## Testing Checklist

Before going live, test each service:

### NotebookLM
- [ ] Create notebook with single PDF
- [ ] Create notebook with multiple sources
- [ ] Generate video from notebook
- [ ] Generate podcast from notebook
- [ ] Generate text summary
- [ ] Query notebook with question
- [ ] Handle indexing timeout
- [ ] Handle invalid source

### Sora
- [ ] Generate short video (10s)
- [ ] Generate medium video (45s)
- [ ] Generate with different prompts
- [ ] Check video quality
- [ ] Verify duration matches request
- [ ] Handle generation failure
- [ ] Check file size

### HeyGen
- [ ] Generate video with default avatar
- [ ] Generate video with custom avatar
- [ ] Test different voices
- [ ] Test script with special characters
- [ ] Test long script (3+ minutes)
- [ ] Verify video quality
- [ ] Check audio sync

---

## Cost Estimation

For a typical course with 10 sections:

**NotebookLM:**
- 1 notebook creation: ~$?? (unknown)
- 10 video generations: ~$?? (unknown)
- 10 podcast generations: ~$?? (unknown)
- Queries: ~$?? (unknown)

**Sora:**
- 10 welcome videos @ 45s each: ~$45-130

**HeyGen:**
- 10 section wrap-ups @ 30s: ~$0.80-1.50
- 1 course wrap-up @ 60s: ~$0.15-0.30

**Total per course:** ~$46-132 (mostly Sora)
**Per learner:** $0 (videos reused)

**Optimization strategies:**
- Pre-generate videos on course publish
- Cache identical welcome videos
- Use template videos with text overlays
- Consider cheaper alternatives for non-critical videos

---

## Next Steps

1. **Week 1**:
   - [ ] Sign up for HeyGen (easiest to get started)
   - [ ] Request Sora API access from OpenAI
   - [ ] Research NotebookLM API availability

2. **Week 1-2**:
   - [ ] Test each service independently with curl/Postman
   - [ ] Document actual API formats
   - [ ] Update service implementations

3. **Week 2-3**:
   - [ ] Integrate into platform
   - [ ] Test end-to-end workflow
   - [ ] Optimize for cost and performance

---

## Alternative Services (If Primary Not Available)

### NotebookLM Alternatives:
- **RAG with Pinecone/Weaviate**: Build custom RAG system
- **ChatGPT with Files**: Use OpenAI Assistant API
- **Claude with Projects**: Use Anthropic's context

### Sora Alternatives:
- **Synthesia**: Similar avatar-based video
- **D-ID**: AI video generation
- **Canva Video API**: Template-based videos
- **Static images**: Simple fallback

### HeyGen Alternatives:
- **Synthesia**: Actually may be better than HeyGen
- **D-ID**: Another option
- **ElevenLabs + Images**: Voice + static image
- **Text summary**: Simplest fallback

The platform is designed to work with or without these services - mocks can stay in place until real APIs are available.
