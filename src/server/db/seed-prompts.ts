/**
 * Seed data for prompt architecture system
 * Based on Business Foundations course example with MedViro deployment
 */

import { Database } from './database';
import { PromptRepository } from '../repositories/PromptRepository';

export async function seedPrompts(db: Database) {
  const promptRepo = new PromptRepository(db);

  console.log('Seeding prompt architecture...');

  // ============================================
  // Step 1: Create Deployments
  // ============================================

  console.log('  Creating deployments...');

  const medViro = await promptRepo.createDeployment({
    name: 'MedViro',
    description: 'Medical device company - requires specific licensing and insurance',
    active: true
  });

  const medVendor = await promptRepo.createDeployment({
    name: 'MedVendor',
    description: 'Medical equipment vendor - different insurance requirements',
    active: true
  });

  // ============================================
  // Step 2: Create Prompt Variables
  // ============================================

  console.log('  Creating prompt variables...');

  // Global variables
  const businessNameVar = await promptRepo.createPromptVariable({
    variable_name: 'business_name',
    description: 'Name of the business/company',
    default_value: 'the company',
    variable_type: 'string',
    is_required: true,
    scope: 'deployment'
  });

  const industryVar = await promptRepo.createPromptVariable({
    variable_name: 'industry',
    description: 'Industry sector',
    default_value: 'healthcare',
    variable_type: 'string',
    is_required: false,
    scope: 'deployment'
  });

  const insuranceReqVar = await promptRepo.createPromptVariable({
    variable_name: 'insurance_requirements',
    description: 'Specific insurance requirements for the business',
    default_value: 'general liability insurance',
    variable_type: 'string',
    is_required: false,
    scope: 'deployment'
  });

  const licensingReqVar = await promptRepo.createPromptVariable({
    variable_name: 'licensing_requirements',
    description: 'Licensing requirements for the business',
    default_value: 'basic business license',
    variable_type: 'string',
    is_required: false,
    scope: 'deployment'
  });

  const complianceStandardVar = await promptRepo.createPromptVariable({
    variable_name: 'compliance_standard',
    description: 'Regulatory compliance standards (e.g., HIPAA, FDA)',
    default_value: 'industry standard practices',
    variable_type: 'string',
    is_required: false,
    scope: 'deployment'
  });

  // Course-level variables
  const courseTopicVar = await promptRepo.createPromptVariable({
    variable_name: 'course_topic',
    description: 'Main topic of the course',
    default_value: 'the subject matter',
    variable_type: 'string',
    is_required: true,
    scope: 'course'
  });

  const learningObjectivesVar = await promptRepo.createPromptVariable({
    variable_name: 'learning_objectives',
    description: 'List of learning objectives for the course',
    default_value: '',
    variable_type: 'json',
    is_required: false,
    scope: 'course'
  });

  // Section-level variables
  const sectionTitleVar = await promptRepo.createPromptVariable({
    variable_name: 'section_title',
    description: 'Title of the current section',
    default_value: '',
    variable_type: 'string',
    is_required: true,
    scope: 'section'
  });

  const sectionObjectivesVar = await promptRepo.createPromptVariable({
    variable_name: 'section_objectives',
    description: 'Learning objectives for this section',
    default_value: '',
    variable_type: 'json',
    is_required: false,
    scope: 'section'
  });

  const sourceContentVar = await promptRepo.createPromptVariable({
    variable_name: 'source_content',
    description: 'Grounding content from source materials',
    default_value: '',
    variable_type: 'string',
    is_required: false,
    scope: 'section'
  });

  // ============================================
  // Step 3: Create Master Prompt Templates
  // ============================================

  console.log('  Creating master prompt templates...');

  // 1. System Prompt (Global Orchestrator)
  const systemPrompt = await promptRepo.createPromptTemplate({
    name: 'Global System Orchestrator',
    prompt_type: 'system',
    template_text: `You are an AI course instructor for {{business_name}} in the {{industry}} industry.

HARD RULES:
1. All content must be grounded in the provided source materials
2. Maintain strict compliance with {{compliance_standard}}
3. Emphasize {{insurance_requirements}} and {{licensing_requirements}} where relevant
4. Use a {{coaching_tone}} coaching style
5. Adapt to learner's {{learner_experience_level}} experience level
6. Preferred format: {{format_preference}}
7. Pace: {{pace_preference}}

LEARNING APPROACH:
- Start with calibration to understand learner's background
- Provide instruction in multiple formats (video, audio, text)
- Verify understanding through assessment
- Provide remediation if needed with analogies and step-by-step explanations
- Celebrate success and provide clear next steps

COURSE TOPIC: {{course_topic}}

Remember: Safety, compliance, and learner understanding are paramount.`,
    description: 'Global system prompt that orchestrates all AI interactions',
    version: '1.0',
    variables: [
      businessNameVar.id,
      industryVar.id,
      insuranceReqVar.id,
      licensingReqVar.id,
      complianceStandardVar.id,
      courseTopicVar.id
    ]
  });

  // 2. Sora Section Intro
  const soraIntroPrompt = await promptRepo.createPromptTemplate({
    name: 'Sora Welcome Video Script',
    prompt_type: 'sora_intro',
    template_text: `Generate a 45-second welcome video script for the section "{{section_title}}" in the {{course_topic}} course.

Context:
- Business: {{business_name}} ({{industry}})
- Learner: {{learner_name}} ({{learner_experience_level}} level)
- Section objectives: {{section_objectives}}

Script requirements:
1. Warm, professional welcome (5 seconds)
2. Explain why this section matters for {{business_name}} operations (15 seconds)
3. Preview the key concepts to be covered (15 seconds)
4. Set expectations and build excitement (10 seconds)

Tone: Engaging, professional, motivating
Visual suggestions: Professional setting, graphics highlighting key concepts

{{#if is_critical}}
CRITICAL SECTION: Emphasize the safety/compliance importance of this section.
{{/if}}`,
    description: 'Generates script for Sora welcome videos at the start of each section',
    version: '1.0',
    variables: [sectionTitleVar.id, courseTopicVar.id, sectionObjectivesVar.id]
  });

  // 3. Calibration Chatbot
  const calibrationPrompt = await promptRepo.createPromptTemplate({
    name: 'Calibration Interview Chatbot',
    prompt_type: 'calibration',
    template_text: `You are conducting a brief pre-learning calibration interview for the section "{{section_title}}".

Learner profile:
- Name: {{learner_name}}
- Experience: {{learner_experience_level}}
- Role: {{learner_role}}
- Confidence: {{confidence_level}}/10

Ask 3-5 targeted questions to assess:
1. Prior knowledge of {{section_title}} concepts
2. Relevant experience at {{business_name}} or similar organizations
3. Specific areas of concern or interest
4. Learning goals for this section

Based on responses, identify:
- Knowledge gaps to address
- Areas to emphasize for {{business_name}} context
- Risk flags (misconceptions, overconfidence, anxiety)
- Recommended pacing adjustments

Use {{coaching_tone}} tone. Be encouraging and supportive.`,
    description: 'Chatbot that calibrates instruction based on learner background',
    version: '1.0',
    variables: [sectionTitleVar.id]
  });

  // 4. NotebookLM Main Instruction
  const notebookMainPrompt = await promptRepo.createPromptTemplate({
    name: 'NotebookLM Main Instruction',
    prompt_type: 'notebooklm_main',
    template_text: `Create comprehensive instructional content for "{{section_title}}" grounded in the provided source materials.

IMPORTANT: This content must be customized based on the learner's calibration interview responses.

Source content:
{{source_content}}

Learning objectives:
{{section_objectives}}

Business context:
- Company: {{business_name}}
- Industry: {{industry}}
- Insurance requirements: {{insurance_requirements}}
- Licensing requirements: {{licensing_requirements}}
- Compliance: {{compliance_standard}}

LEARNER CALIBRATION RESULTS (from chatbot interview):

Knowledge Gaps Identified:
{{calibration_knowledge_gaps|[]}}
→ Address these gaps explicitly in your explanations. Start with foundational concepts for these areas.

Emphasis Areas (what learner wants to focus on):
{{calibration_emphasis_areas|[]}}
→ Spend extra time on these topics. Provide more examples and deeper explanations.

Risk Flags (misconceptions or concerns):
{{calibration_risk_flags|[]}}
→ Proactively address these misconceptions. Clarify common misunderstandings.

Pacing Adjustment:
{{calibration_pacing|standard}}
→ slower: More detailed explanations, repeat key concepts, additional examples
→ standard: Balanced pace with clear explanations
→ faster: Advanced treatment, assume more background knowledge

Learner Confidence Level:
{{calibration_confidence|5}}/10
→ Low confidence (1-4): Encouraging tone, build up gradually, celebrate progress
→ Medium confidence (5-7): Balanced approach, challenge appropriately
→ High confidence (8-10): Advanced examples, edge cases, professional scenarios

Generate content in 5 formats:
1. Video explanation (8-12 minutes) - Adjust depth based on calibration
2. Podcast walkthrough (10-15 minutes) - Address knowledge gaps naturally in conversation
3. Written summary (1500-2000 words) - Emphasize areas from calibration
4. Practical examples specific to {{business_name}} - Use learner's context
5. Practice problems with solutions - Target identified knowledge gaps

Content Customization Instructions:
- If knowledge gaps include foundational concepts, start there before advancing
- For emphasis areas, provide 2-3x more examples than other topics
- If risk flags indicate misconceptions, explicitly address and correct them
- Adjust technical depth based on pacing preference
- Match tone and encouragement to confidence level
- Use {{business_name}} scenarios that relate to learner's background

All content must:
- Be grounded in source materials
- Address {{business_name}}-specific requirements
- Use real-world examples from {{industry}}
- Include compliance considerations
- Match learner's pacing preference ({{calibration_pacing}})
- Fill identified knowledge gaps
- Emphasize areas the learner indicated interest in`,
    description: 'Main prompt for NotebookLM to generate all instructional artifacts',
    version: '1.0',
    variables: [
      sectionTitleVar.id,
      sourceContentVar.id,
      sectionObjectivesVar.id,
      businessNameVar.id,
      insuranceReqVar.id,
      licensingReqVar.id,
      complianceStandardVar.id
    ]
  });

  // 5. Verification/Assessment
  const verificationPrompt = await promptRepo.createPromptTemplate({
    name: 'Assessment Generation',
    prompt_type: 'verification',
    template_text: `Generate a mastery assessment for "{{section_title}}" that verifies understanding of the instruction content.

Section objectives:
{{section_objectives}}

Assessment requirements:
- 5-7 questions covering all key concepts
- Mix of formats: multiple choice, scenario-based, explain-back
- Questions must test application, not just recall
- Include {{business_name}}-specific scenarios
- Address {{insurance_requirements}} and {{licensing_requirements}} knowledge

{{#if is_critical}}
CRITICAL SECTION - Use higher mastery threshold (90%):
- Include detailed rubrics
- Add scenario questions testing judgment
- Emphasize safety/compliance implications
{{/if}}

Learner level: {{learner_experience_level}}
Provide clear, unambiguous correct answers and detailed explanations.`,
    description: 'Generates assessments to verify section mastery',
    version: '1.0',
    variables: [sectionTitleVar.id, sectionObjectivesVar.id]
  });

  // 6. Remediation
  const remediationPrompt = await promptRepo.createPromptTemplate({
    name: 'Remediation Re-teaching',
    prompt_type: 'remediation',
    template_text: `The learner {{learner_name}} did not pass the assessment for "{{section_title}}".

Failed questions:
{{failed_questions}}

Learner profile:
- Experience: {{learner_experience_level}}
- Confidence before: {{confidence_level}}/10
- Learning preference: {{format_preference}}

Provide remediation using:
1. **Analogy approach**: Relate to familiar {{business_name}} processes
2. **Step-by-step breakdown**: Simplify the concept into smaller parts
3. **Common mistakes**: Explain why their answer was incorrect
4. **Real examples**: Use {{industry}}-specific scenarios

Focus on building understanding, not memorization.
Use {{coaching_tone}} tone - be patient and encouraging.
Emphasize practical application at {{business_name}}.

After remediation, create 2-3 practice questions to rebuild confidence.`,
    description: 'Provides targeted re-teaching when learners fail assessments',
    version: '1.0',
    variables: [sectionTitleVar.id]
  });

  // 7. HeyGen Wrap-up
  const heygenWrapupPrompt = await promptRepo.createPromptTemplate({
    name: 'HeyGen Wrap-up Video Script',
    prompt_type: 'heygen_wrapup',
    template_text: `Generate a 30-second wrap-up video script for completing "{{section_title}}".

Learner: {{learner_name}}
Mastery score: {{mastery_score}}%

Script structure:
1. Congratulate learner on completion (5 seconds)
2. Recap 3 key takeaways from {{section_title}} (15 seconds)
3. Preview next section connection (5 seconds)
4. Encouragement and call-to-action (5 seconds)

Personalization:
- Reference their mastery score
- Acknowledge {{business_name}} context
- Use {{coaching_tone}} tone

Visual: Professional presenter, {{business_name}} branding if available

{{#if is_critical}}
Emphasize the importance of this critical section for safety/compliance at {{business_name}}.
{{/if}}`,
    description: 'Generates script for HeyGen personalized wrap-up videos',
    version: '1.0',
    variables: [sectionTitleVar.id]
  });

  // ============================================
  // Step 4: Set Deployment-Specific Variables
  // ============================================

  console.log('  Setting deployment-specific variables...');

  // MedViro deployment variables
  await promptRepo.setDeploymentVariable(
    medViro.id,
    businessNameVar.id,
    'MedViro Medical Solutions'
  );

  await promptRepo.setDeploymentVariable(
    medViro.id,
    industryVar.id,
    'medical device manufacturing'
  );

  await promptRepo.setDeploymentVariable(
    medViro.id,
    insuranceReqVar.id,
    'Professional liability insurance, Product liability insurance (minimum $5M coverage), Clinical trial insurance'
  );

  await promptRepo.setDeploymentVariable(
    medViro.id,
    licensingReqVar.id,
    'FDA Class II Medical Device Manufacturing License, ISO 13485 certification, State medical device distributor licenses'
  );

  await promptRepo.setDeploymentVariable(
    medViro.id,
    complianceStandardVar.id,
    'FDA 21 CFR Part 820 (Quality System Regulation), ISO 13485, HIPAA for clinical data'
  );

  // MedVendor deployment variables
  await promptRepo.setDeploymentVariable(
    medVendor.id,
    businessNameVar.id,
    'MedVendor Supply Co.'
  );

  await promptRepo.setDeploymentVariable(
    medVendor.id,
    industryVar.id,
    'medical equipment distribution'
  );

  await promptRepo.setDeploymentVariable(
    medVendor.id,
    insuranceReqVar.id,
    'General liability insurance ($2M minimum), Product liability insurance for distributed equipment, Commercial auto insurance for delivery fleet'
  );

  await promptRepo.setDeploymentVariable(
    medVendor.id,
    licensingReqVar.id,
    'State medical equipment distributor license, FDA registration as a distributor, Local business operating license'
  );

  await promptRepo.setDeploymentVariable(
    medVendor.id,
    complianceStandardVar.id,
    'FDA regulations for medical device distributors, HIPAA for protected health information, State-specific medical equipment regulations'
  );

  console.log('✅ Prompt seeding completed!');
  console.log('\nCreated:');
  console.log(`  - 2 deployments (MedViro, MedVendor)`);
  console.log(`  - 10 prompt variables`);
  console.log(`  - 7 prompt templates (all prompt types)`);
  console.log(`  - Deployment-specific variable values`);
}
