# AI Service Integration Guide

## Overview

The AI Course Platform integrates with **4 AI services** to deliver personalized learning experiences:

1. **ChatGPT/Claude** - Calibration chatbot interviews
2. **NotebookLM** - Grounded instruction and assessment generation
3. **Sora** - Section intro videos
4. **HeyGen** - Personalized wrap-up videos

All services are integrated through the **Prompt Architecture System**, which resolves tenant-specific prompts before making AI calls.

---

## Service Mapping

| Learning Phase | AI Service | Purpose |
|---------------|------------|---------|
| 1. Welcome | **Sora** | Generate section intro video from script |
| 2. Calibration | **ChatGPT/Claude** | Conduct pre-learning interview |
| 3. Instruction | **NotebookLM** | Generate video, podcast, summary (grounded in sources) |
| 4. Assessment | **NotebookLM** | Generate quiz questions grounded in sources |
| 5. Remediation | *Internal* | Re-teaching based on failed questions |
| 6. Wrap-up | **HeyGen** | Generate personalized completion video |

---

## 1. Calibration Chatbot (ChatGPT/Claude)

### Purpose
Conducts a conversational pre-learning interview to:
- Assess learner's prior knowledge
- Identify gaps and misconceptions
- Determine pacing and emphasis areas
- Build learner confidence

### Integration

**Service:** `ChatbotService`
**Providers:** OpenAI (ChatGPT) or Anthropic (Claude)
**Configuration:**
```env
CHATBOT_PROVIDER=openai  # or 'anthropic'
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

### Usage Example

```typescript
import { AIOrchestrationService } from './services/AIOrchestrationService';

const aiOrchestrator = new AIOrchestrationService(
  db.getDb(),
  'openai' // or 'anthropic'
);

// Start calibration interview
const interview = await aiOrchestrator.startCalibrationInterview({
  deployment_id: 'dep_medviro',
  course_id: 'course_123',
  section_id: 'section_456',
  learner_id: 'learner_789',
  section_title: 'Revenue Models',
  section_objectives: ['Understand revenue streams', 'Learn pricing'],
  is_critical: false,
  learner_name: 'John Doe',
  learner_role: 'Sales Manager',
  learner_experience_level: 'intermediate',
  confidence_level: 6
});

console.log('Conversation ID:', interview.conversationId);
console.log('Chatbot:', interview.firstMessage);

// Continue conversation
const conversationHistory = [
  { role: 'assistant', content: interview.firstMessage }
];

const response = await aiOrchestrator.continueCalibrationInterview(
  interview.conversationId,
  interview.systemPrompt,
  conversationHistory,
  'I have 3 years of sales experience but new to medical devices.'
);

console.log('Chatbot:', response.message);

if (response.isComplete) {
  console.log('Calibration Results:', response.calibrationResults);
  // {
  //   knowledge_gaps: ['Medical device regulations', 'Compliance requirements'],
  //   emphasis_areas: ['FDA guidelines', 'Insurance requirements'],
  //   risk_flags: [],
  //   pacing_adjustment: 'standard',
  //   confidence_assessment: 6
  // }
}
```

### How It Works

1. **Prompt Resolution**: Calibration prompt is resolved with learner context
2. **Conversation Start**: System prompt + learner intro sent to ChatGPT/Claude
3. **Multi-turn Conversation**: Learner responds, chatbot asks follow-up questions
4. **Completion Detection**: After 4-5 exchanges or explicit completion signal
5. **Results Extraction**: AI analyzes conversation and extracts calibration results

### Mock Mode

When no API key is provided (or key is `mock_*`), the service runs in mock mode:
- Returns pre-defined responses
- Randomly completes after a few exchanges
- Returns mock calibration results

---

## 2. NotebookLM Integration

### Purpose
- Generate instruction content grounded in approved sources
- Create video explanations, podcasts, summaries
- Generate assessment questions based on source materials

### Integration

**Service:** `NotebookLMService`
**Configuration:**
```env
NOTEBOOKLM_API_KEY=your_key_here
```

### Usage Example

#### Generate Instruction Content

```typescript
const instruction = await aiOrchestrator.generateNotebookLMInstruction(
  'notebook_123',
  {
    deployment_id: 'dep_medviro',
    course_id: 'course_123',
    section_id: 'section_456',
    section_title: 'Revenue Models',
    section_objectives: ['...'],
    source_content: 'Content from uploaded PDFs...',
    is_critical: false
  },
  {
    // Calibration results from chatbot interview
    emphasis_areas: ['Compliance', 'Pricing strategies']
  }
);

console.log('Video URL:', instruction.video.url);
console.log('Podcast URL:', instruction.podcast.url);
console.log('Summary:', instruction.summary);
```

#### Generate Assessment

```typescript
const assessment = await aiOrchestrator.generateAssessment(
  'notebook_123',
  {
    deployment_id: 'dep_medviro',
    course_id: 'course_123',
    section_id: 'section_456',
    section_title: 'Revenue Models',
    section_objectives: ['...'],
    is_critical: false
  }
);

console.log('Questions:', assessment.questions);
// [
//   {
//     id: 'q1',
//     type: 'multiple_choice',
//     question_text: '...',
//     options: ['A', 'B', 'C', 'D'],
//     correct_answer: 'A',
//     explanation: '...'
//   },
//   ...
// ]
```

### How It Works

1. **Prompt Resolution**: NotebookLM prompt includes:
   - Section title and objectives
   - Source content (extracted from uploaded files)
   - Business context (insurance, licensing, compliance)
   - Calibration emphasis areas

2. **Content Generation**: NotebookLM generates grounded content:
   - Video explanation (8-12 min)
   - Podcast walkthrough (10-15 min)
   - Written summary (1500-2000 words)
   - Assessment questions

3. **Grounding**: All content is grounded in approved source materials

---

## 3. Sora Integration

### Purpose
Generate engaging section intro videos from scripts

### Integration

**Service:** `SoraService`
**Configuration:**
```env
SORA_API_KEY=your_key_here
```

### Usage Example

```typescript
const soraResult = await aiOrchestrator.generateSoraWelcomeVideo({
  deployment_id: 'dep_medviro',
  course_id: 'course_123',
  section_id: 'section_456',
  section_title: 'Revenue Models',
  section_objectives: ['...'],
  is_critical: false
});

console.log('Sora Job ID:', soraResult.jobId);
console.log('Script used:', soraResult.resolvedPrompt);

// Poll for completion
const sora = AIServiceFactory.getSoraService();
const status = await sora.checkJobStatus(soraResult.jobId);

if (status.status === 'completed') {
  console.log('Video URL:', status.url);
}
```

### How It Works

1. **Prompt Resolution**: Sora prompt includes:
   - Section title and objectives
   - Business context
   - Learner level
   - Script structure (45 seconds)

2. **Script Generation**: Resolved prompt is the video script

3. **Video Creation**: Sora generates video from script

4. **Status Polling**: Check job status until complete

---

## 4. HeyGen Integration

### Purpose
Generate personalized wrap-up videos with learner's name and mastery score

### Integration

**Service:** `HeyGenService`
**Configuration:**
```env
HEYGEN_API_KEY=your_key_here
```

### Usage Example

```typescript
const heygenResult = await aiOrchestrator.generateHeyGenWrapUp({
  deployment_id: 'dep_medviro',
  course_id: 'course_123',
  section_id: 'section_456',
  section_title: 'Revenue Models',
  section_objectives: ['...'],
  is_critical: false,
  learner_name: 'John Doe',
  mastery_score: 87
});

console.log('HeyGen Job ID:', heygenResult.jobId);
console.log('Script used:', heygenResult.resolvedPrompt);
```

### How It Works

1. **Prompt Resolution**: HeyGen prompt includes:
   - Learner name and mastery score
   - Section title
   - Key takeaways
   - Next section preview

2. **Script Generation**: Personalized 30-second script

3. **Video Creation**: HeyGen generates talking-head video

---

## Complete Section Execution Flow

Here's how all services work together:

```typescript
import { AIOrchestrationService } from './services/AIOrchestrationService';

async function executeSectionLearning(context: SectionContext) {
  const ai = new AIOrchestrationService(db.getDb(), 'openai');

  // 1. WELCOME - Sora intro video
  const welcome = await ai.generateSoraWelcomeVideo(context);
  // Wait for video generation...

  // 2. CALIBRATION - ChatGPT/Claude interview
  const interview = await ai.startCalibrationInterview({
    ...context,
    learner_name: 'John Doe',
    learner_experience_level: 'intermediate',
    confidence_level: 6
  });

  // Multi-turn conversation...
  let calibrationResults = null;
  const conversationHistory = [];

  while (!calibrationResults) {
    const userMessage = await getUserInput(); // From UI
    const response = await ai.continueCalibrationInterview(
      interview.conversationId,
      interview.systemPrompt,
      conversationHistory,
      userMessage
    );

    conversationHistory.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: response.message }
    );

    if (response.isComplete) {
      calibrationResults = response.calibrationResults;
    }
  }

  // 3. INSTRUCTION - NotebookLM
  const instruction = await ai.generateNotebookLMInstruction(
    'notebook_123',
    context,
    calibrationResults
  );

  // Learner consumes video/podcast/summary...

  // 4. ASSESSMENT - NotebookLM
  const assessment = await ai.generateAssessment('notebook_123', context);

  // Learner takes quiz...
  const passed = checkAssessmentResults(learnerAnswers, assessment.questions);

  if (!passed) {
    // 5. REMEDIATION
    const remediation = await ai.generateRemediation(
      context,
      failedQuestions
    );
    // Show remediation content...
    // Re-assess...
  }

  // 6. WRAP-UP - HeyGen
  const wrapup = await ai.generateHeyGenWrapUp({
    ...context,
    learner_name: 'John Doe',
    mastery_score: 87
  });
}
```

---

## Environment Configuration

### Development (Mocks)

```env
# .env
CHATBOT_PROVIDER=openai
OPENAI_API_KEY=mock_openai_key
ANTHROPIC_API_KEY=mock_anthropic_key
NOTEBOOKLM_API_KEY=mock_notebooklm_key
SORA_API_KEY=mock_sora_key
HEYGEN_API_KEY=mock_heygen_key
```

### Production (Real APIs)

```env
# .env
CHATBOT_PROVIDER=openai  # or 'anthropic'
OPENAI_API_KEY=sk-proj-...
ANTHROPIC_API_KEY=sk-ant-...
NOTEBOOKLM_API_KEY=your_real_key
SORA_API_KEY=your_real_key
HEYGEN_API_KEY=your_real_key
```

---

## API Specifications

### ChatGPT API

**Endpoint:** `https://api.openai.com/v1/chat/completions`
**Model:** `gpt-4o` (configurable)
**Authentication:** `Authorization: Bearer ${OPENAI_API_KEY}`

**Request:**
```json
{
  "model": "gpt-4o",
  "messages": [
    { "role": "system", "content": "Resolved calibration prompt..." },
    { "role": "user", "content": "Learner message" }
  ],
  "temperature": 0.7,
  "max_tokens": 500
}
```

### Claude API

**Endpoint:** `https://api.anthropic.com/v1/messages`
**Model:** `claude-3-5-sonnet-20241022` (configurable)
**Authentication:** `x-api-key: ${ANTHROPIC_API_KEY}`

**Request:**
```json
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 500,
  "system": "Resolved calibration prompt...",
  "messages": [
    { "role": "user", "content": "Learner message" }
  ]
}
```

---

## Testing

### Test Calibration Interview

```bash
# Set API key
export OPENAI_API_KEY=sk-proj-...
# or
export ANTHROPIC_API_KEY=sk-ant-...

# Start server
npm run dev

# Test via API
curl -X POST http://localhost:3000/api/calibration/start \
  -H "Content-Type: application/json" \
  -d '{
    "deployment_id": "dep_medviro",
    "course_id": "course_123",
    "section_id": "section_456",
    "learner_id": "learner_789"
  }'
```

---

## Cost Estimation

### ChatGPT (GPT-4o)
- Input: $2.50 / 1M tokens
- Output: $10.00 / 1M tokens
- **Per calibration interview (~5 exchanges):** ~$0.02

### Claude (Sonnet 3.5)
- Input: $3.00 / 1M tokens
- Output: $15.00 / 1M tokens
- **Per calibration interview:** ~$0.03

### NotebookLM
- Pricing varies by usage
- Contact Google for details

### Sora
- Pricing varies by video length
- Contact OpenAI for details

### HeyGen
- Pricing varies by video length
- Contact HeyGen for details

---

## Migration Path

1. **Start with mocks** (current setup)
2. **Add ChatGPT/Claude** for calibration first (easiest to test)
3. **Add NotebookLM** for instruction and assessment
4. **Add Sora** for intro videos
5. **Add HeyGen** for wrap-up videos

Each service can be enabled independently - the system gracefully falls back to mocks if API keys are not configured.
