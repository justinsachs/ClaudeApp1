# Learner Customization Flow

## Overview

The platform uses a **calibration → customization** workflow where the chatbot interview collects information about the learner, and that information directly customizes all subsequent content generation.

**Critical Flow:**
```
Student answers calibration questions
    ↓
ChatGPT/Claude extracts:
  - Knowledge gaps
  - Emphasis areas
  - Risk flags (misconceptions)
  - Pacing preference
  - Confidence level
    ↓
These results populate variables in NotebookLM prompt
    ↓
NotebookLM generates customized content:
  - Fills knowledge gaps
  - Emphasizes requested areas
  - Addresses misconceptions
  - Adjusts pacing and depth
  - Matches confidence level
```

---

## Step-by-Step Workflow

### **Step 1: Calibration Interview (ChatGPT/Claude)**

**What happens:**
- Learner engages in conversational interview
- ChatGPT/Claude asks 3-5 targeted questions about:
  - Prior knowledge and experience
  - Specific areas of interest
  - Learning goals
  - Concerns or challenges

**Example conversation:**
```
Chatbot: "Tell me about your experience with revenue models in your current role."

Learner: "I've worked in sales for 3 years but mostly with consumer products.
         Medical device pricing is new to me, and I'm worried about understanding
         the insurance reimbursement side."

Chatbot: "That's helpful context. What specific aspects of medical device sales
         are you most interested in learning?"

Learner: "I really want to understand FDA regulations and how they affect pricing.
         Also, the insurance approval process seems complicated."

Chatbot: "Great! Can you walk me through how you currently approach pricing
         in your consumer product sales?"

Learner: "We use cost-plus pricing mostly. I calculate our costs and add a markup.
         But I know medical devices are different because of regulations."

Chatbot: "Perfect! Based on our conversation, I can see you have a solid sales
         foundation. We'll focus extra attention on FDA regulations, insurance
         processes, and value-based pricing specific to medical devices.
         Ready to begin?"
```

**Calibration Results Extracted:**
```json
{
  "knowledge_gaps": [
    "FDA regulations and compliance requirements",
    "Insurance reimbursement processes",
    "Value-based pricing for medical devices",
    "Medical device distribution channels"
  ],
  "emphasis_areas": [
    "FDA regulations",
    "Insurance approval processes",
    "Pricing strategies for regulated products"
  ],
  "risk_flags": [
    "May apply consumer pricing models incorrectly to medical devices"
  ],
  "pacing_adjustment": "standard",
  "confidence_assessment": 6
}
```

---

### **Step 2: Variable Population**

**What happens:**
All calibration results are passed as variables to the NotebookLM prompt:

```typescript
const resolved = await promptEngine.resolvePrompt('notebooklm_main', {
  deployment_id: 'dep_medviro',
  course_id: 'course_123',
  section_id: 'section_456',
  learner_id: 'learner_789',
  additional_variables: {
    section_title: 'Revenue Models in Medical Device Sales',
    section_objectives: ['...'],
    source_content: 'Content from uploaded FDA guidelines...',

    // CALIBRATION RESULTS - customize the content
    calibration_knowledge_gaps: JSON.stringify([
      "FDA regulations and compliance requirements",
      "Insurance reimbursement processes",
      "Value-based pricing for medical devices"
    ]),
    calibration_emphasis_areas: JSON.stringify([
      "FDA regulations",
      "Insurance approval processes"
    ]),
    calibration_risk_flags: JSON.stringify([
      "May apply consumer pricing models incorrectly"
    ]),
    calibration_pacing: 'standard',
    calibration_confidence: 6
  }
});
```

---

### **Step 3: Prompt Resolution**

**What happens:**
The NotebookLM prompt template includes instructions for customization:

**Template (from seed data):**
```
Create comprehensive instructional content for "{{section_title}}"...

LEARNER CALIBRATION RESULTS (from chatbot interview):

Knowledge Gaps Identified:
{{calibration_knowledge_gaps|[]}}
→ Address these gaps explicitly in your explanations.

Emphasis Areas (what learner wants to focus on):
{{calibration_emphasis_areas|[]}}
→ Spend extra time on these topics. Provide more examples.

Risk Flags (misconceptions or concerns):
{{calibration_risk_flags|[]}}
→ Proactively address these misconceptions.

Pacing Adjustment:
{{calibration_pacing|standard}}

Learner Confidence Level:
{{calibration_confidence|5}}/10

Content Customization Instructions:
- If knowledge gaps include foundational concepts, start there
- For emphasis areas, provide 2-3x more examples
- If risk flags indicate misconceptions, explicitly address them
- Adjust technical depth based on pacing
- Match tone to confidence level
```

**Resolved Prompt (sent to NotebookLM):**
```
Create comprehensive instructional content for "Revenue Models in Medical Device Sales"...

LEARNER CALIBRATION RESULTS (from chatbot interview):

Knowledge Gaps Identified:
["FDA regulations and compliance requirements", "Insurance reimbursement processes", "Value-based pricing for medical devices"]
→ Address these gaps explicitly in your explanations.

Emphasis Areas (what learner wants to focus on):
["FDA regulations", "Insurance approval processes"]
→ Spend extra time on these topics. Provide more examples.

Risk Flags (misconceptions or concerns):
["May apply consumer pricing models incorrectly"]
→ Proactively address these misconceptions.

Pacing Adjustment:
standard

Learner Confidence Level:
6/10

Content Customization Instructions:
- Start with FDA basics before diving into pricing
- Provide 2-3x more examples for FDA regulations and insurance
- Explicitly contrast medical device pricing vs consumer product pricing
- Standard pacing with clear explanations
- Encouraging but professional tone for medium confidence
```

---

### **Step 4: Customized Content Generation**

**What NotebookLM does:**

Based on the resolved prompt, NotebookLM generates content that:

#### **Video Explanation (8-12 min)**
```
STRUCTURE:
[0:00-2:00] Foundation: FDA regulations basics
            → Addresses knowledge gap #1

[2:00-5:00] Deep dive: FDA impact on pricing
            → Emphasis area #1 with extra examples
            → Explicitly contrasts with consumer pricing
            → Addresses risk flag

[5:00-8:00] Insurance reimbursement process
            → Addresses knowledge gaps #2
            → Emphasis area #2 with case studies

[8:00-10:00] Value-based pricing for medical devices
             → Knowledge gap #3
             → Practical examples from MedViro

[10:00-12:00] Summary and key takeaways
```

#### **Podcast Walkthrough (10-15 min)**
```
Host 1: "Let's start with FDA regulations since that's crucial for
        understanding medical device pricing..."

→ Natural conversation addressing knowledge gaps

Host 2: "Great point! Let me walk through a real example of how
        FDA approval impacts pricing at a company like MedViro..."

→ Extra examples for emphasis areas

Host 1: "Now, you might be thinking, 'Can't we just use cost-plus
        pricing like consumer products?' Let me explain why that
        doesn't work for medical devices..."

→ Proactively addressing the risk flag
```

#### **Written Summary (1500-2000 words)**
```
Revenue Models in Medical Device Sales

Introduction: Building on Your Sales Experience
[Acknowledges learner's consumer sales background - confidence level 6]

Section 1: FDA Regulations and Their Impact on Pricing (500 words)
[Knowledge gap #1 + Emphasis area #1 → Double coverage]
- Regulatory basics explained clearly
- 3 detailed examples
- Comparison table: Consumer vs Medical Device regulations

Section 2: Insurance Reimbursement in Medical Devices (400 words)
[Knowledge gap #2 + Emphasis area #2 → Double coverage]
- Step-by-step process
- Common pitfalls
- MedViro-specific scenarios

Section 3: Value-Based Pricing vs Cost-Plus Pricing (350 words)
[Knowledge gap #3 + Risk flag addressed]
- Why cost-plus doesn't work for medical devices
- Value-based pricing framework
- Transition guide from consumer pricing mindset

Section 4: Practical Application at MedViro (250 words)
[Business-specific examples]

Key Takeaways & Action Items
```

#### **Practice Problems**
```
Problem 1: FDA Regulation Scenario
"A new Class II medical device is undergoing FDA review..."
→ Targets knowledge gap #1

Problem 2: Insurance Reimbursement Challenge
"A hospital requests pricing for a device not yet on their approved list..."
→ Targets knowledge gap #2

Problem 3: Pricing Model Decision
"Should you use cost-plus or value-based pricing for this device?"
→ Addresses risk flag by forcing critical thinking

Problem 4: MedViro Case Study
"Given MedViro's ISO 13485 certification and compliance requirements..."
→ Applies learning to business context
```

---

## Code Implementation

### **Complete Flow Example:**

```typescript
import { AIOrchestrationService } from './services/AIOrchestrationService';
import { getDatabase } from './db/database';

async function executePersonalizedLearning() {
  const db = getDatabase();
  const ai = new AIOrchestrationService(db.getDb(), 'openai');

  // STEP 1: Start calibration interview
  const interview = await ai.startCalibrationInterview({
    deployment_id: 'dep_medviro',
    course_id: 'course_123',
    section_id: 'section_456',
    learner_id: 'learner_789',
    section_title: 'Revenue Models in Medical Device Sales',
    section_objectives: ['Understand pricing models', 'Learn FDA impact'],
    is_critical: false,
    learner_name: 'Sarah Johnson',
    learner_role: 'Sales Representative',
    learner_experience_level: 'intermediate',
    confidence_level: 6
  });

  console.log('Chatbot:', interview.firstMessage);

  // STEP 2: Multi-turn conversation
  const conversationHistory = [
    { role: 'assistant', content: interview.firstMessage }
  ];

  // Learner response 1
  let response = await ai.continueCalibrationInterview(
    interview.conversationId,
    interview.systemPrompt,
    conversationHistory,
    "I've worked in sales for 3 years but medical device pricing is new to me. I'm worried about the insurance side."
  );

  conversationHistory.push(
    { role: 'user', content: 'I\'ve worked in sales...' },
    { role: 'assistant', content: response.message }
  );

  console.log('Chatbot:', response.message);

  // Continue conversation until complete...
  while (!response.isComplete) {
    const userMessage = await getUserInput(); // From UI
    response = await ai.continueCalibrationInterview(
      interview.conversationId,
      interview.systemPrompt,
      conversationHistory,
      userMessage
    );

    conversationHistory.push(
      { role: 'user', content: userMessage },
      { role: 'assistant', content: response.message }
    );

    console.log('Chatbot:', response.message);
  }

  // STEP 3: Extract calibration results
  const calibrationResults = response.calibrationResults;
  console.log('Calibration complete!');
  console.log('Knowledge gaps:', calibrationResults.knowledge_gaps);
  console.log('Emphasis areas:', calibrationResults.emphasis_areas);
  console.log('Pacing:', calibrationResults.pacing_adjustment);

  // STEP 4: Generate customized NotebookLM content
  const instruction = await ai.generateNotebookLMInstruction(
    'notebook_123',
    {
      deployment_id: 'dep_medviro',
      course_id: 'course_123',
      section_id: 'section_456',
      section_title: 'Revenue Models in Medical Device Sales',
      section_objectives: ['Understand pricing models', 'Learn FDA impact'],
      source_content: 'FDA guidelines content...',
      is_critical: false
    },
    calibrationResults // ← PASSED TO CUSTOMIZE CONTENT
  );

  console.log('✅ Customized content generated!');
  console.log('Video URL:', instruction.video.url);
  console.log('Podcast URL:', instruction.podcast.url);
  console.log('Summary:', instruction.summary);

  // The content is now tailored to Sarah's:
  // - Knowledge gaps (FDA, insurance, value-based pricing)
  // - Emphasis areas (FDA regulations, insurance processes)
  // - Risk flags (consumer pricing mindset)
  // - Confidence level (6/10 - encouraging tone)
  // - Pacing (standard - balanced explanations)
}
```

---

## Key Variables in Prompt Customization

| Variable | Source | Purpose |
|----------|--------|---------|
| `calibration_knowledge_gaps` | Chatbot analysis | Fill gaps explicitly |
| `calibration_emphasis_areas` | Learner's stated interests | Provide 2-3x more content |
| `calibration_risk_flags` | Detected misconceptions | Proactively address |
| `calibration_pacing` | Learner preference | Adjust depth and detail |
| `calibration_confidence` | Self-assessment | Match tone and encouragement |
| `business_name` | Deployment setting | Use company-specific examples |
| `industry` | Deployment setting | Contextualize content |
| `insurance_requirements` | Deployment setting | Address specific compliance |
| `licensing_requirements` | Deployment setting | Cover regulatory needs |

---

## Benefits

### **For Learners:**
- ✅ Content addresses their specific knowledge gaps
- ✅ Focuses on what they want to learn (emphasis areas)
- ✅ Corrects their misconceptions proactively
- ✅ Paced appropriately for their level
- ✅ Tone matches their confidence

### **For MedViro (Example):**
- ✅ All examples use MedViro's actual requirements
- ✅ FDA Class II specific guidance
- ✅ ISO 13485 compliance built in
- ✅ Professional liability insurance context
- ✅ Medical device industry scenarios

### **For MedVendor (Different Deployment):**
- ✅ Equipment distribution focus
- ✅ Different FDA requirements
- ✅ Distribution-specific insurance
- ✅ Vendor-focused examples
- ✅ Different regulatory landscape

---

## Testing the Flow

### **1. Run Calibration Interview:**
```bash
# Start server
npm run dev

# In another terminal, test calibration
curl -X POST http://localhost:3000/api/test/calibration \
  -H "Content-Type: application/json" \
  -d '{
    "learner_id": "test_learner",
    "section_id": "test_section"
  }'
```

### **2. Examine Resolved Prompt:**
```bash
# Preview what will be sent to NotebookLM
curl -X POST http://localhost:3000/api/prompts/preview \
  -H "Content-Type: application/json" \
  -d '{
    "template_id": "tpl_notebooklm_main",
    "deployment_id": "dep_medviro",
    "course_id": "course_123",
    "test_variables": {
      "calibration_knowledge_gaps": "[\"FDA regulations\", \"Insurance\"]",
      "calibration_emphasis_areas": "[\"Pricing strategies\"]",
      "calibration_pacing": "slower"
    }
  }'
```

### **3. Verify Content Customization:**
Check that the resolved prompt includes:
- ✅ Knowledge gaps listed explicitly
- ✅ Instructions to emphasize specific areas
- ✅ Pacing adjustments
- ✅ Confidence-appropriate tone

---

## Summary

The calibration-to-customization flow ensures that **every piece of content is personalized** based on what the learner says in the initial interview. This creates a truly adaptive learning experience where:

1. **ChatGPT/Claude learns about the student** through conversation
2. **Results populate prompt variables** automatically
3. **NotebookLM receives detailed customization instructions** in the resolved prompt
4. **Generated content is tailored** to that specific learner's needs

This is the core differentiator of the platform - every learner gets content customized to their background, goals, and learning style.
