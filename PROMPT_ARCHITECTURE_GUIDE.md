# Prompt Architecture Guide

## Overview

The AI Course Platform now includes a comprehensive **Prompt Architecture System** that manages all AI interactions through customizable, tenant-specific prompt templates. This system ensures that NotebookLM, Sora, and HeyGen generate content tailored to each business's unique requirements (licensing, insurance, compliance, etc.).

---

## Key Concepts

### 1. **Hierarchical Prompt Resolution**

Prompts are resolved using a hierarchy that allows customization at multiple levels:

```
Global Defaults (from variable definitions)
    ↓ overridden by
Deployment-Level Values (e.g., MedViro vs MedVendor)
    ↓ overridden by
Course-Level Values (specific course customizations)
    ↓ overridden by
Section-Level Values (per-section customizations)
    ↓ overridden by
Learner-Level Values (from learner profile)
    ↓ overridden by
Runtime Variables (passed at execution time)
```

### 2. **Prompt Types**

The system supports 7 prompt types covering all AI interactions:

| Prompt Type | Purpose | AI Service |
|------------|---------|------------|
| `system` | Global orchestrator with hard rules | All |
| `sora_intro` | Section welcome video script | Sora |
| `calibration` | Pre-learning chatbot interview | **ChatGPT/Claude** |
| `notebooklm_main` | Comprehensive instruction generation | NotebookLM |
| `notebooklm_video` | Video explanation (3.1) | NotebookLM |
| `notebooklm_podcast` | Podcast walkthrough (3.2) | NotebookLM |
| `notebooklm_summary` | Written summary (3.3) | NotebookLM |
| `notebooklm_examples` | Examples (3.4) | NotebookLM |
| `notebooklm_practice` | Practice problems (3.5) | NotebookLM |
| `verification` | Assessment question generation | **NotebookLM** |
| `remediation` | Re-teaching after failed assessment | Internal |
| `heygen_wrapup` | Section completion video script | HeyGen |

### 3. **Variable Scopes**

Variables can be scoped to different levels:

- **Global**: Platform-wide defaults
- **Deployment**: Tenant/business-specific (e.g., MedViro, MedVendor)
- **Course**: Course-specific values
- **Section**: Section-specific values
- **Learner**: From learner profile (name, experience, preferences)

---

## Architecture Components

### Database Schema

**9 new tables** added to manage prompts:

```
deployments                  - Tenants/businesses using the platform
prompt_templates             - Master prompt library
prompt_variables             - Variable definitions
template_variables           - Which variables are used in which templates
deployment_prompts           - Deployment-specific prompt overrides
deployment_variables         - Deployment-specific variable values
course_prompts              - Course-specific prompt overrides
course_variables            - Course-specific variable values
section_variables           - Section-specific variable values
prompt_executions           - Audit log of all prompt resolutions
```

### Backend Services

**PromptRepository** (`src/server/repositories/PromptRepository.ts`)
- CRUD operations for all prompt entities
- Variable value management
- Execution history tracking

**PromptEngine** (`src/server/services/PromptEngine.ts`)
- Template resolution with hierarchy
- Variable substitution using `{{variable_name}}` syntax
- Conditional blocks: `{{#if variable}}...{{/if}}`
- Default values: `{{variable|default_value}}`
- Audit logging

**AIOrchestrationService** (`src/server/services/AIOrchestrationService.ts`)
- Integrates PromptEngine with AI services
- Resolves prompts before making AI calls
- High-level methods for each AI interaction

### API Endpoints

All routes under `/api/prompts`:

**Deployments:**
```
POST   /api/prompts/deployments              - Create deployment
GET    /api/prompts/deployments              - List all deployments
GET    /api/prompts/deployments/:id          - Get deployment
PATCH  /api/prompts/deployments/:id          - Update deployment
```

**Templates:**
```
POST   /api/prompts/templates                - Create template
GET    /api/prompts/templates                - List templates (filter by ?type=)
GET    /api/prompts/templates/:id            - Get template with variables
PATCH  /api/prompts/templates/:id            - Update template
```

**Variables:**
```
POST   /api/prompts/variables                - Create variable
GET    /api/prompts/variables                - List variables (filter by ?scope=)
GET    /api/prompts/variables/:id            - Get variable
```

**Deployment Customization:**
```
POST   /api/prompts/deployments/:id/prompts  - Override template for deployment
POST   /api/prompts/deployments/:id/variables - Set deployment variable values
GET    /api/prompts/deployments/:id/variables - Get all deployment variables
```

**Course Customization:**
```
POST   /api/prompts/courses/:id/prompts      - Override template for course
POST   /api/prompts/courses/:id/variables    - Set course variable values
GET    /api/prompts/courses/:id/variables    - Get all course variables
```

**Section Customization:**
```
POST   /api/prompts/sections/:id/variables   - Set section variable values
GET    /api/prompts/sections/:id/variables   - Get all section variables
```

**Resolution & Preview:**
```
POST   /api/prompts/resolve                  - Resolve a prompt with context
POST   /api/prompts/preview                  - Preview prompt with test variables
GET    /api/prompts/executions               - Get execution history
```

---

## Template Syntax

### Variable Substitution

```
{{variable_name}}
```

Example:
```
You are teaching {{course_topic}} to learners at {{business_name}}.
```

### Default Values

```
{{variable_name|default_value}}
```

Example:
```
Industry: {{industry|healthcare}}
```

### Conditional Blocks

```
{{#if variable_name}}
  Content shown if variable is truthy
{{/if}}
```

Example:
```
{{#if is_critical}}
CRITICAL SECTION: This section covers safety-critical content.
{{/if}}
```

---

## Example: MedViro Deployment

### Step 1: Create Deployment

```bash
POST /api/prompts/deployments
{
  "name": "MedViro",
  "description": "Medical device company",
  "active": true
}
```

### Step 2: Set Deployment Variables

```bash
POST /api/prompts/deployments/dep_12345/variables
{
  "variables": [
    {
      "variable_id": "var_business_name",
      "value": "MedViro Medical Solutions"
    },
    {
      "variable_id": "var_industry",
      "value": "medical device manufacturing"
    },
    {
      "variable_id": "var_insurance_requirements",
      "value": "Professional liability insurance, Product liability insurance (minimum $5M coverage), Clinical trial insurance"
    },
    {
      "variable_id": "var_licensing_requirements",
      "value": "FDA Class II Medical Device Manufacturing License, ISO 13485 certification, State medical device distributor licenses"
    },
    {
      "variable_id": "var_compliance_standard",
      "value": "FDA 21 CFR Part 820 (Quality System Regulation), ISO 13485, HIPAA for clinical data"
    }
  ]
}
```

### Step 3: Create Course

```bash
POST /api/courses
{
  "title": "Business Foundations for MedViro",
  "description": "Core business concepts for medical device sales",
  ...
}
```

### Step 4: Set Course Variables

```bash
POST /api/prompts/courses/course_12345/variables
{
  "variables": [
    {
      "variable_id": "var_course_topic",
      "value": "Business Foundations"
    },
    {
      "variable_id": "var_learning_objectives",
      "value": "[\"Understand revenue models\", \"Learn compliance requirements\", \"Master sales processes\"]"
    }
  ]
}
```

### Step 5: Resolve Prompt for Section

```bash
POST /api/prompts/resolve
{
  "prompt_type": "sora_intro",
  "deployment_id": "dep_12345",
  "course_id": "course_12345",
  "section_id": "section_12345",
  "learner_id": "learner_12345",
  "additional_variables": {
    "section_title": "Revenue Models in Medical Device Sales",
    "section_objectives": ["Understand different revenue streams", "Learn pricing strategies"],
    "is_critical": false
  }
}
```

**Response:**
```json
{
  "prompt_type": "sora_intro",
  "resolved_text": "Generate a 45-second welcome video script for the section \"Revenue Models in Medical Device Sales\" in the Business Foundations course.\n\nContext:\n- Business: MedViro Medical Solutions (medical device manufacturing)\n- Learner: John Doe (intermediate level)\n- Section objectives: [\"Understand different revenue streams\", \"Learn pricing strategies\"]\n\nScript requirements:\n1. Warm, professional welcome (5 seconds)\n2. Explain why this section matters for MedViro Medical Solutions operations (15 seconds)\n3. Preview the key concepts to be covered (15 seconds)\n4. Set expectations and build excitement (10 seconds)\n\nTone: Engaging, professional, motivating\nVisual suggestions: Professional setting, graphics highlighting key concepts",
  "template_used": { ... },
  "variables_used": {
    "business_name": "MedViro Medical Solutions",
    "industry": "medical device manufacturing",
    "course_topic": "Business Foundations",
    "section_title": "Revenue Models in Medical Device Sales",
    "learner_name": "John Doe",
    "learner_experience_level": "intermediate",
    ...
  },
  "resolution_hierarchy": {
    "template_source": "master",
    "variables_from": {
      "global": [],
      "deployment": ["business_name", "industry", "insurance_requirements"],
      "course": ["course_topic"],
      "section": ["section_title"],
      "learner": ["learner_name", "learner_experience_level"]
    }
  }
}
```

---

## Usage in Code

### Using AIOrchestrationService

```typescript
import { AIOrchestrationService } from './services/AIOrchestrationService';
import { getDatabase } from './db/database';

const db = getDatabase();
const aiOrchestrator = new AIOrchestrationService(db.getDb());

// Generate Sora welcome video
const soraResult = await aiOrchestrator.generateSoraWelcomeVideo({
  deployment_id: 'dep_medviro',
  course_id: 'course_123',
  section_id: 'section_456',
  learner_id: 'learner_789',
  section_title: 'Revenue Models',
  section_objectives: ['Understand revenue streams', 'Learn pricing'],
  is_critical: false
});

console.log('Sora job ID:', soraResult.jobId);
console.log('Script used:', soraResult.resolvedPrompt);

// Generate NotebookLM instruction
const instruction = await aiOrchestrator.generateNotebookLMInstruction(
  'notebook_123',
  {
    deployment_id: 'dep_medviro',
    course_id: 'course_123',
    section_id: 'section_456',
    section_title: 'Revenue Models',
    section_objectives: ['...'],
    source_content: 'Grounding content here...',
    is_critical: false
  },
  {
    emphasis_areas: ['Compliance', 'Pricing strategies']
  }
);

console.log('Video URL:', instruction.video.url);
console.log('Podcast URL:', instruction.podcast.url);
console.log('Summary:', instruction.summary);
```

---

## Seed Data

The platform includes comprehensive seed data with example prompts:

```bash
npm run seed-prompts
```

This creates:
- 2 deployments (MedViro, MedVendor)
- 10 prompt variables
- 7 prompt templates (all prompt types)
- Deployment-specific variable values

To run seed data:

```typescript
import { seedPrompts } from './db/seed-prompts';
import { getDatabase } from './db/database';

const db = getDatabase();
await db.initialize();
await seedPrompts(db.getDb());
```

---

## Customization Examples

### Override Template for Deployment

If MedViro needs a different Sora intro format:

```bash
POST /api/prompts/deployments/dep_medviro/prompts
{
  "template_id": "tpl_sora_intro",
  "custom_template_text": "MedViro-specific Sora script template...",
  "notes": "MedViro prefers shorter intros with more emphasis on compliance"
}
```

### Override Template for Course

If a specific course needs custom remediation:

```bash
POST /api/prompts/courses/course_123/prompts
{
  "template_id": "tpl_remediation",
  "custom_template_text": "Custom remediation template for this course...",
}
```

---

## Audit Trail

Every prompt resolution is logged:

```bash
GET /api/prompts/executions?course_id=course_123&limit=50
```

Response includes:
- Resolved prompt text
- All variables used
- Variable resolution hierarchy
- Execution timestamp
- AI service called

---

## Migration Path

### From Mock to Real AI Services

The prompt system is already integrated. When ready to use real AI services:

1. **Get API credentials** for NotebookLM, Sora, HeyGen

2. **Update environment variables:**
```env
NOTEBOOKLM_API_KEY=real_key_here
SORA_API_KEY=real_key_here
HEYGEN_API_KEY=real_key_here
```

3. **Replace mock services** in `src/server/services/AIServices.ts`:
```typescript
static getNotebookLMService(): NotebookLMService {
  if (process.env.NOTEBOOKLM_API_KEY && process.env.NOTEBOOKLM_API_KEY !== 'mock_notebooklm_key') {
    return new RealNotebookLMService(process.env.NOTEBOOKLM_API_KEY);
  }
  return new MockNotebookLMService();
}
```

4. **No changes needed** to AIOrchestrationService or prompt system - they already pass resolved prompts to AI services

---

## Best Practices

### 1. **Variable Naming**
- Use descriptive snake_case names
- Prefix scope-specific vars: `deployment_`, `course_`, `section_`

### 2. **Template Design**
- Keep templates focused on single responsibility
- Use conditional blocks for optional content
- Provide default values for non-critical variables

### 3. **Deployment Setup**
- Set all deployment variables upfront
- Document why each override exists (use `notes` field)
- Test prompts with preview endpoint before production

### 4. **Version Control**
- Increment template versions when making changes
- Keep old templates active temporarily for A/B testing
- Log which version was used in prompt_executions

---

## API Examples

### Create Variable

```bash
POST /api/prompts/variables
{
  "variable_name": "company_mission",
  "description": "Company mission statement",
  "default_value": "To provide excellent service",
  "variable_type": "string",
  "is_required": false,
  "scope": "deployment"
}
```

### Create Template

```bash
POST /api/prompts/templates
{
  "name": "Custom Sora Intro",
  "prompt_type": "sora_intro",
  "template_text": "Generate a video for {{section_title}} at {{business_name}}...",
  "description": "Custom format for welcome videos",
  "version": "2.0",
  "variables": ["var_123", "var_456"]
}
```

### Preview Prompt

```bash
POST /api/prompts/preview
{
  "template_id": "tpl_123",
  "deployment_id": "dep_medviro",
  "course_id": "course_123",
  "test_variables": {
    "section_title": "Test Section",
    "custom_var": "Test value"
  }
}
```

---

## Summary

The Prompt Architecture System provides:

✅ **Tenant-specific customization** - Each deployment can have unique prompts
✅ **Hierarchical overrides** - Fine-grained control at deployment/course/section levels
✅ **Template reusability** - Master templates with variable substitution
✅ **Audit trail** - Complete history of all prompt resolutions
✅ **AI service integration** - Seamless integration with NotebookLM, Sora, HeyGen
✅ **Preview & testing** - Test prompts before production use
✅ **Version control** - Track template versions and changes

This system ensures that all AI-generated content is tailored to each business's specific requirements while maintaining consistency and control.
