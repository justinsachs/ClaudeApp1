/**
 * Chatbot Service for Calibration Interviews
 * Supports both OpenAI (ChatGPT) and Anthropic (Claude)
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatbotResponse {
  message: string;
  is_complete: boolean;
  calibration_results?: {
    knowledge_gaps: string[];
    emphasis_areas: string[];
    risk_flags: string[];
    pacing_adjustment: 'slower' | 'standard' | 'faster';
    confidence_assessment: number; // 1-10
  };
}

export interface ChatbotService {
  sendMessage(
    conversationId: string,
    systemPrompt: string,
    conversationHistory: ChatMessage[],
    userMessage: string
  ): Promise<ChatbotResponse>;

  extractCalibrationResults(conversationHistory: ChatMessage[]): Promise<any>;
}

// OpenAI ChatGPT Implementation
export class OpenAIChatbotService implements ChatbotService {
  private apiKey: string;
  private model: string;
  private baseURL: string;

  constructor(apiKey?: string, model: string = 'gpt-4o') {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || '';
    this.model = model;
    this.baseURL = 'https://api.openai.com/v1';
  }

  async sendMessage(
    conversationId: string,
    systemPrompt: string,
    conversationHistory: ChatMessage[],
    userMessage: string
  ): Promise<ChatbotResponse> {
    if (!this.apiKey || this.apiKey === 'mock_openai_key') {
      return this.mockResponse(userMessage);
    }

    try {
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        ...conversationHistory,
        { role: 'user', content: userMessage }
      ];

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data: any = await response.json();
      const assistantMessage = data.choices[0].message.content;

      // Check if calibration is complete (AI indicates end of interview)
      const isComplete = this.checkIfCalibrationComplete(assistantMessage, conversationHistory);

      return {
        message: assistantMessage,
        is_complete: isComplete,
        calibration_results: isComplete
          ? await this.extractCalibrationResults([...conversationHistory, { role: 'user', content: userMessage }, { role: 'assistant', content: assistantMessage }])
          : undefined
      };
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.mockResponse(userMessage);
    }
  }

  async extractCalibrationResults(conversationHistory: ChatMessage[]): Promise<any> {
    if (!this.apiKey || this.apiKey === 'mock_openai_key') {
      return this.mockCalibrationResults();
    }

    const extractionPrompt = `Based on the following calibration interview, extract:
1. Knowledge gaps identified
2. Areas to emphasize in instruction
3. Risk flags (misconceptions, overconfidence, anxiety)
4. Recommended pacing (slower/standard/faster)
5. Confidence assessment (1-10)

Conversation:
${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}

Return as JSON:
{
  "knowledge_gaps": ["gap1", "gap2"],
  "emphasis_areas": ["area1", "area2"],
  "risk_flags": ["flag1"],
  "pacing_adjustment": "standard",
  "confidence_assessment": 6
}`;

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: extractionPrompt }],
          temperature: 0.3,
          response_format: { type: 'json_object' }
        })
      });

      const data: any = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Error extracting calibration results:', error);
      return this.mockCalibrationResults();
    }
  }

  private checkIfCalibrationComplete(message: string, history: ChatMessage[]): boolean {
    // Check if AI indicates completion or if we've had enough exchanges (5+ Q&A pairs)
    const qaCount = history.filter(m => m.role === 'user').length;
    const completionIndicators = [
      'that completes our calibration',
      'ready to begin the instruction',
      'calibration complete',
      'thank you for sharing'
    ];

    return qaCount >= 4 || completionIndicators.some(indicator =>
      message.toLowerCase().includes(indicator)
    );
  }

  private mockResponse(userMessage: string): ChatbotResponse {
    const responses = [
      "Thank you for sharing that. Can you tell me more about your experience with this topic?",
      "That's helpful context. What aspects of this subject are you most interested in learning about?",
      "I appreciate that insight. Are there any specific challenges you've faced in this area?",
      "Great! Based on what you've shared, it sounds like we should focus on practical applications. Let's begin the instruction phase."
    ];

    const isComplete = Math.random() > 0.6; // Randomly complete after a few exchanges
    const message = isComplete ? responses[3] : responses[Math.floor(Math.random() * 3)];

    return {
      message,
      is_complete: isComplete,
      calibration_results: isComplete ? this.mockCalibrationResults() : undefined
    };
  }

  private mockCalibrationResults(): any {
    return {
      knowledge_gaps: ['Fundamental concepts', 'Advanced applications'],
      emphasis_areas: ['Practical examples', 'Compliance requirements'],
      risk_flags: ['Overconfidence in prior knowledge'],
      pacing_adjustment: 'standard',
      confidence_assessment: 6
    };
  }
}

// Anthropic Claude Implementation
export class AnthropicChatbotService implements ChatbotService {
  private apiKey: string;
  private model: string;
  private baseURL: string;

  constructor(apiKey?: string, model: string = 'claude-3-5-sonnet-20241022') {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || '';
    this.model = model;
    this.baseURL = 'https://api.anthropic.com/v1';
  }

  async sendMessage(
    conversationId: string,
    systemPrompt: string,
    conversationHistory: ChatMessage[],
    userMessage: string
  ): Promise<ChatbotResponse> {
    if (!this.apiKey || this.apiKey === 'mock_anthropic_key') {
      return this.mockResponse(userMessage);
    }

    try {
      // Convert messages to Anthropic format (exclude system from messages array)
      const messages = [
        ...conversationHistory.filter(m => m.role !== 'system'),
        { role: 'user', content: userMessage }
      ];

      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 500,
          system: systemPrompt,
          messages
        })
      });

      if (!response.ok) {
        throw new Error(`Anthropic API error: ${response.status}`);
      }

      const data: any = await response.json();
      const assistantMessage = data.content[0].text;

      const isComplete = this.checkIfCalibrationComplete(assistantMessage, conversationHistory);

      return {
        message: assistantMessage,
        is_complete: isComplete,
        calibration_results: isComplete
          ? await this.extractCalibrationResults([...conversationHistory, { role: 'user', content: userMessage }, { role: 'assistant', content: assistantMessage }])
          : undefined
      };
    } catch (error) {
      console.error('Anthropic API error:', error);
      return this.mockResponse(userMessage);
    }
  }

  async extractCalibrationResults(conversationHistory: ChatMessage[]): Promise<any> {
    if (!this.apiKey || this.apiKey === 'mock_anthropic_key') {
      return this.mockCalibrationResults();
    }

    const extractionPrompt = `Based on the following calibration interview, extract and return ONLY valid JSON with no additional text:

Conversation:
${conversationHistory.map(m => `${m.role}: ${m.content}`).join('\n')}

Extract:
1. Knowledge gaps identified
2. Areas to emphasize in instruction
3. Risk flags (misconceptions, overconfidence, anxiety)
4. Recommended pacing (slower/standard/faster)
5. Confidence assessment (1-10)

Return as JSON:
{
  "knowledge_gaps": ["gap1", "gap2"],
  "emphasis_areas": ["area1", "area2"],
  "risk_flags": ["flag1"],
  "pacing_adjustment": "standard",
  "confidence_assessment": 6
}`;

    try {
      const response = await fetch(`${this.baseURL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 1000,
          messages: [{ role: 'user', content: extractionPrompt }]
        })
      });

      const data: any = await response.json();
      const text = data.content[0].text;

      // Extract JSON from response (Claude might add explanation)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return this.mockCalibrationResults();
    } catch (error) {
      console.error('Error extracting calibration results:', error);
      return this.mockCalibrationResults();
    }
  }

  private checkIfCalibrationComplete(message: string, history: ChatMessage[]): boolean {
    const qaCount = history.filter(m => m.role === 'user').length;
    const completionIndicators = [
      'that completes our calibration',
      'ready to begin the instruction',
      'calibration complete',
      'thank you for sharing'
    ];

    return qaCount >= 4 || completionIndicators.some(indicator =>
      message.toLowerCase().includes(indicator)
    );
  }

  private mockResponse(userMessage: string): ChatbotResponse {
    const responses = [
      "Thank you for sharing that. Can you tell me more about your experience with this topic?",
      "That's helpful context. What aspects of this subject are you most interested in learning about?",
      "I appreciate that insight. Are there any specific challenges you've faced in this area?",
      "Great! Based on what you've shared, it sounds like we should focus on practical applications. Let's begin the instruction phase."
    ];

    const isComplete = Math.random() > 0.6;
    const message = isComplete ? responses[3] : responses[Math.floor(Math.random() * 3)];

    return {
      message,
      is_complete: isComplete,
      calibration_results: isComplete ? this.mockCalibrationResults() : undefined
    };
  }

  private mockCalibrationResults(): any {
    return {
      knowledge_gaps: ['Fundamental concepts', 'Advanced applications'],
      emphasis_areas: ['Practical examples', 'Compliance requirements'],
      risk_flags: ['Overconfidence in prior knowledge'],
      pacing_adjustment: 'standard',
      confidence_assessment: 6
    };
  }
}

// Factory for getting chatbot service
export class ChatbotServiceFactory {
  private static instance: ChatbotService;

  static getChatbotService(provider?: 'openai' | 'anthropic'): ChatbotService {
    if (this.instance) {
      return this.instance;
    }

    const selectedProvider = provider || process.env.CHATBOT_PROVIDER || 'openai';

    if (selectedProvider === 'anthropic') {
      this.instance = new AnthropicChatbotService();
      console.log('[ChatbotService] Using Anthropic Claude');
    } else {
      this.instance = new OpenAIChatbotService();
      console.log('[ChatbotService] Using OpenAI ChatGPT');
    }

    return this.instance;
  }

  static setInstance(service: ChatbotService): void {
    this.instance = service;
  }
}
