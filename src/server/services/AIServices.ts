// AI Service Integration Layer
// This module provides interfaces and implementations for AI services
// Current implementation uses mocks - replace with actual API calls when ready

export interface NotebookLMService {
  createNotebook(courseId: string, title: string, sources: string[]): Promise<string>;
  generateVideo(notebookId: string, topic: string, instructionPrompt?: string): Promise<{ url: string; transcript: string }>;
  generatePodcast(notebookId: string, topic: string, instructionPrompt?: string): Promise<{ url: string; transcript: string }>;
  generateSummary(notebookId: string, topic: string, instructionPrompt?: string): Promise<string>;
  generateAssessment(notebookId: string, assessmentPrompt: string): Promise<{ questions: any[] }>;
  askQuestion(notebookId: string, question: string): Promise<string>;
}

export interface SoraService {
  generateWelcomeVideo(script: string, duration: number): Promise<{ jobId: string }>;
  checkJobStatus(jobId: string): Promise<{ status: 'pending' | 'processing' | 'completed' | 'failed'; url?: string }>;
}

export interface HeyGenService {
  generateWrapUpVideo(script: string, style: 'section' | 'course'): Promise<{ jobId: string }>;
  checkJobStatus(jobId: string): Promise<{ status: 'pending' | 'processing' | 'completed' | 'failed'; url?: string }>;
}

// Mock NotebookLM Implementation
export class MockNotebookLMService implements NotebookLMService {
  private notebooks: Map<string, { title: string; sources: string[] }> = new Map();

  async createNotebook(courseId: string, title: string, sources: string[]): Promise<string> {
    const notebookId = `notebook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.notebooks.set(notebookId, { title, sources });
    console.log(`[NotebookLM Mock] Created notebook: ${notebookId} for course ${courseId}`);
    return notebookId;
  }

  async generateVideo(notebookId: string, topic: string): Promise<{ url: string; transcript: string }> {
    await this.delay(500); // Simulate API delay

    const transcript = `This is a comprehensive video explanation of ${topic}.

In this section, we'll cover the fundamental concepts and practical applications.
We'll start with the basic principles and gradually build up to more advanced topics.

Key points to remember:
1. Understanding the core concepts is essential
2. Real-world applications help reinforce learning
3. Practice is crucial for mastery

Let's dive into the details...`;

    return {
      url: `https://mock-notebooklm.com/videos/${notebookId}/${Date.now()}.mp4`,
      transcript
    };
  }

  async generatePodcast(notebookId: string, topic: string): Promise<{ url: string; transcript: string }> {
    await this.delay(500);

    const transcript = `Welcome to this podcast-style walkthrough of ${topic}.

Host 1: So, let's talk about this fascinating topic. Why is it important?

Host 2: Great question! This is fundamental because it helps learners understand...

Host 1: That makes sense. Can you give us a practical example?

Host 2: Absolutely! Let me walk you through a real-world scenario...`;

    return {
      url: `https://mock-notebooklm.com/podcasts/${notebookId}/${Date.now()}.mp3`,
      transcript
    };
  }

  async generateSummary(notebookId: string, topic: string): Promise<string> {
    await this.delay(300);

    return `# ${topic} - Summary

## Key Concepts
- Core principle 1: Foundation of understanding
- Core principle 2: Practical application
- Core principle 3: Advanced techniques

## Important Takeaways
- This topic is essential for overall mastery
- Real-world applications demonstrate practical value
- Continuous practice leads to proficiency

## Next Steps
- Review the material covered
- Practice with exercises
- Apply knowledge in practical scenarios`;
  }

  async generateAssessment(notebookId: string, assessmentPrompt: string): Promise<{ questions: any[] }> {
    await this.delay(800);

    // Mock assessment questions
    // In real implementation, NotebookLM would generate questions grounded in source materials
    console.log(`[NotebookLM Mock] Generating assessment for notebook: ${notebookId}`);

    const mockQuestions = [
      {
        id: 'q1',
        type: 'multiple_choice',
        question_text: 'What is the primary concept covered in this section?',
        options: [
          'Fundamental principles and their application',
          'Advanced theoretical frameworks',
          'Historical context and background',
          'Future trends and predictions'
        ],
        correct_answer: 'Fundamental principles and their application',
        explanation: 'Based on the source materials, this section focuses on foundational concepts and practical applications.'
      },
      {
        id: 'q2',
        type: 'scenario',
        question_text: 'Given a real-world scenario where you need to apply these concepts, what would be the best approach?',
        rubric: {
          excellent: 'Demonstrates deep understanding and practical application',
          good: 'Shows understanding with minor gaps',
          needs_improvement: 'Missing key concepts or misapplication'
        }
      },
      {
        id: 'q3',
        type: 'explain_back',
        question_text: 'In your own words, explain the key takeaway from this section and how it applies to your work.',
        rubric: {
          excellent: 'Clear explanation with specific examples',
          good: 'Generally accurate with some detail',
          needs_improvement: 'Vague or incomplete explanation'
        }
      }
    ];

    return { questions: mockQuestions };
  }

  async askQuestion(notebookId: string, question: string): Promise<string> {
    await this.delay(400);

    return `Based on the approved sources for this section, here's the answer to your question:

${question}

The key points are:
1. This is grounded in the source material
2. The explanation follows best practices
3. You can apply this knowledge directly

Would you like me to clarify any specific aspect?`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Mock Sora Implementation
export class MockSoraService implements SoraService {
  private jobs: Map<string, { status: string; url?: string }> = new Map();

  async generateWelcomeVideo(script: string, duration: number): Promise<{ jobId: string }> {
    const jobId = `sora_job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.jobs.set(jobId, { status: 'processing' });
    console.log(`[Sora Mock] Started video generation: ${jobId}`);

    // Simulate video generation completion after 2 seconds
    setTimeout(() => {
      this.jobs.set(jobId, {
        status: 'completed',
        url: `https://mock-sora.com/videos/${jobId}.mp4`
      });
    }, 2000);

    return { jobId };
  }

  async checkJobStatus(jobId: string): Promise<{ status: 'pending' | 'processing' | 'completed' | 'failed'; url?: string }> {
    const job = this.jobs.get(jobId);

    if (!job) {
      return { status: 'failed' };
    }

    return {
      status: job.status as any,
      url: job.url
    };
  }
}

// Mock HeyGen Implementation
export class MockHeyGenService implements HeyGenService {
  private jobs: Map<string, { status: string; url?: string }> = new Map();

  async generateWrapUpVideo(script: string, style: 'section' | 'course'): Promise<{ jobId: string }> {
    const jobId = `heygen_job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.jobs.set(jobId, { status: 'processing' });
    console.log(`[HeyGen Mock] Started ${style} wrap-up video: ${jobId}`);

    // Simulate video generation completion after 3 seconds
    setTimeout(() => {
      this.jobs.set(jobId, {
        status: 'completed',
        url: `https://mock-heygen.com/videos/${jobId}.mp4`
      });
    }, 3000);

    return { jobId };
  }

  async checkJobStatus(jobId: string): Promise<{ status: 'pending' | 'processing' | 'completed' | 'failed'; url?: string }> {
    const job = this.jobs.get(jobId);

    if (!job) {
      return { status: 'failed' };
    }

    return {
      status: job.status as any,
      url: job.url
    };
  }
}

// Factory for getting service instances
export class AIServiceFactory {
  private static notebookLMInstance: NotebookLMService;
  private static soraInstance: SoraService;
  private static heygenInstance: HeyGenService;

  static getNotebookLMService(): NotebookLMService {
    if (!this.notebookLMInstance) {
      // In production, check for API keys and return real implementation
      // For now, return mock
      this.notebookLMInstance = new MockNotebookLMService();
    }
    return this.notebookLMInstance;
  }

  static getSoraService(): SoraService {
    if (!this.soraInstance) {
      this.soraInstance = new MockSoraService();
    }
    return this.soraInstance;
  }

  static getHeyGenService(): HeyGenService {
    if (!this.heygenInstance) {
      this.heygenInstance = new MockHeyGenService();
    }
    return this.heygenInstance;
  }
}
